import { useMemo, useState } from 'react';
import type { DateClickArg, EventResizeDoneArg } from '@fullcalendar/interaction';
import type { DatesSetArg, EventClickArg, EventDropArg } from '@fullcalendar/core';
import { generateAppointmentsPdf } from '@/lib/api/functions';
import { moveSchedulingItemOnCalendar } from './schedulingCalendarMutations';
import type { SchedulingItem } from './schedulingItem';

export default function useSchedulingAgenda({
  filters,
  filtered,
  buildings,
  groupColors,
  restrictedDates,
  canCreate,
  canScheduleEmergency,
  canEdit,
  startCreateAt,
  schedulingItems,
  isRestrictedDate,
  toast,
  t,
  invalidateScheduling,
  setSelected
}: {
  filters: { buildingId: string; from: string; to: string };
  filtered: SchedulingItem[];
  buildings: Array<{ id: string; group?: string }>;
  groupColors: Map<string, string>;
  restrictedDates: Set<string>;
  canCreate: boolean;
  canScheduleEmergency: boolean;
  canEdit: boolean;
  startCreateAt: (start: Date) => void;
  schedulingItems: SchedulingItem[];
  isRestrictedDate: (value?: string) => boolean;
  toast: (message: string, tone?: 'success' | 'error') => void;
  t: (key: string) => string;
  invalidateScheduling: () => Promise<unknown>;
  setSelected: React.Dispatch<React.SetStateAction<SchedulingItem | null>>;
}) {
  const [calendarRange, setCalendarRange] = useState<{ start: string; end: string } | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const calendarEvents = useMemo(
    () => [
      ...filtered.map((item) => {
        const building = buildings.find((b) => b.id === item.buildingId);
        const color = building?.group ? groupColors.get(building.group) : undefined;
        return {
          id: item.id,
          title: item.title,
          start: item.startAt,
          end: item.endAt,
          backgroundColor: color,
          borderColor: color,
          extendedProps: {
            type: item.type
          }
        };
      }),
      ...Array.from(restrictedDates).map((date) => ({
        id: `holiday-${date}`,
        start: date,
        allDay: true,
        display: 'background' as const,
        backgroundColor: '#e5e7eb'
      }))
    ],
    [filtered, buildings, groupColors, restrictedDates]
  );

  const handleCalendarDateClick = (info: DateClickArg) => {
    if (!canCreate) return;
    const dateIso = info.date.toISOString();
    if (isRestrictedDate(dateIso) && !canScheduleEmergency) {
      toast(t('scheduling.dateBlocked'), 'error');
      return;
    }
    startCreateAt(info.date);
  };

  const handleCalendarDatesSet = (info: DatesSetArg) => {
    setCalendarRange({ start: info.start.toISOString(), end: info.end.toISOString() });
  };

  const handleCalendarEventClick = (info: EventClickArg) => {
    const appointment = schedulingItems.find((item) => item.id === info.event.id);
    if (appointment) {
      setSelected(appointment);
    }
  };

  const handleCalendarMutation = (info: EventDropArg | EventResizeDoneArg) => {
    if (!canEdit) return;
    if (!info.event.start || !info.event.end) return;
    const appointment = schedulingItems.find((item) => item.id === info.event.id);
    const type = (info.event.extendedProps as { type?: string }).type;
    void moveSchedulingItemOnCalendar({
      schedulingItemId: info.event.id,
      start: info.event.start,
      end: info.event.end,
      type,
      isRestrictedDate,
      toast,
      t,
      invalidateScheduling,
      revert: () => info.revert(),
      buildingId: appointment?.buildingId ?? '',
      employeeId: appointment?.employeeId ?? null,
      schedulingItems
    }).catch(() => toast(t('common.actionError'), 'error'));
  };

  const resolvePdfRange = () => {
    if (filters.from && filters.to) {
      const start = new Date(`${filters.from}T00:00:00`);
      const end = new Date(`${filters.to}T00:00:00`);
      end.setDate(end.getDate() + 1);
      return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
    }
    if (calendarRange) {
      return { rangeStart: calendarRange.start, rangeEnd: calendarRange.end };
    }
    const start = new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
  };

  const handleGeneratePdf = async () => {
    if (!filters.buildingId) return;
    try {
      setPdfLoading(true);
      const { rangeStart, rangeEnd } = resolvePdfRange();
      const response = await generateAppointmentsPdf({
        buildingId: filters.buildingId,
        rangeStart,
        rangeEnd
      });
      const bytes = Uint8Array.from(atob(response.contentBase64), (char) => char.charCodeAt(0));
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = response.filename;
      link.click();
      URL.revokeObjectURL(url);
      toast(t('scheduling.pdfReady'), 'success');
    } catch {
      toast(t('scheduling.pdfError'), 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  return {
    pdfLoading,
    calendarEvents,
    handleCalendarDateClick,
    handleCalendarDatesSet,
    handleCalendarEventClick,
    handleCalendarMutation,
    handleGeneratePdf
  };
}

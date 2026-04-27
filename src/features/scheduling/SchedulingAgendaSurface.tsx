import type { Dispatch, ReactNode, SetStateAction } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin, { type DateClickArg, type EventResizeDoneArg } from '@fullcalendar/interaction';
import multiMonthPlugin from '@fullcalendar/multimonth';
import esLocale from '@fullcalendar/core/locales/es';
import type { DatesSetArg, EventClickArg, EventDropArg, EventInput } from '@fullcalendar/core';
import type { ColumnDef } from '@tanstack/react-table';
import Button from '@/components/Button';
import Card from '@/components/Card';
import DataTable from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import PageHeader from '@/components/PageHeader';
import Select from '@/components/Select';
import useBreakpoint from '@/components/useBreakpoint';
import { DownloadIcon } from '@/components/ActionIcons';
import { useI18n } from '@/lib/i18n';
import type { SchedulingItem } from './schedulingItem';

export default function SchedulingAgendaSurface({
  viewMode,
  setViewMode,
  pdfLoading,
  canCreate,
  canEdit,
  hasBuildingFilter,
  onGeneratePdf,
  onCreate,
  columns,
  filtered,
  calendarEvents,
  onDateClick,
  onDatesSet,
  onEventClick,
  onEventDrop,
  onEventResize,
  children
}: {
  viewMode: 'calendar' | 'list';
  setViewMode: Dispatch<SetStateAction<'calendar' | 'list'>>;
  pdfLoading: boolean;
  canCreate: boolean;
  canEdit: boolean;
  hasBuildingFilter: boolean;
  onGeneratePdf: () => void;
  onCreate: () => void;
  columns: ColumnDef<SchedulingItem>[];
  filtered: SchedulingItem[];
  calendarEvents: EventInput[];
  onDateClick: (info: DateClickArg) => void;
  onDatesSet: (info: DatesSetArg) => void;
  onEventClick: (info: EventClickArg) => void;
  onEventDrop: (info: EventDropArg) => void;
  onEventResize: (info: EventResizeDoneArg) => void;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const { isMobile } = useBreakpoint();

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('scheduling.title')}
        subtitle={t('scheduling.subtitle')}
        actions={
          <div className="flex items-end gap-2">
            <Select
              label={t('scheduling.viewLabel')}
              value={viewMode}
              onChange={(event) => setViewMode(event.target.value as 'calendar' | 'list')}
              className="min-w-[160px]"
            >
              <option value="calendar">{t('scheduling.viewCalendar')}</option>
              <option value="list">{t('scheduling.viewList')}</option>
            </Select>
            <Button
              variant="secondary"
              disabled={!hasBuildingFilter || pdfLoading}
              onClick={onGeneratePdf}
              className="h-9 px-3 text-sm whitespace-nowrap flex items-center gap-2"
            >
              <DownloadIcon className="h-4 w-4" aria-hidden />
              <span>{pdfLoading ? t('scheduling.pdfGenerating') : t('scheduling.pdfGenerate')}</span>
            </Button>
            {canCreate ? <Button onClick={onCreate}>{t('common.add')}</Button> : null}
          </div>
        }
      />

      {children}

      {viewMode === 'calendar' ? (
        <Card>
          <h3 className="text-sm font-semibold text-ink-800">{t('scheduling.calendar')}</h3>
          <div className="mt-4">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin, multiMonthPlugin]}
              locale={esLocale}
              timeZone="America/Bogota"
              initialView={isMobile ? 'listWeek' : 'timeGridWeek'}
              height="auto"
              editable={canEdit}
              selectable
              eventOverlap
              slotEventOverlap
              allDayText={t('scheduling.allDay')}
              slotLabelFormat={{ hour: 'numeric', minute: '2-digit', hour12: true }}
              eventTimeFormat={{ hour: 'numeric', minute: '2-digit', hour12: true }}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridDay,timeGridWeek,dayGridMonth,multiMonthQuarter,multiMonthSemester,multiMonthYear'
              }}
              buttonText={{
                today: t('common.today'),
                timeGridDay: t('scheduling.views.day'),
                timeGridWeek: t('scheduling.views.week'),
                dayGridMonth: t('scheduling.views.month'),
                multiMonthQuarter: t('scheduling.views.quarter'),
                multiMonthSemester: t('scheduling.views.semester'),
                multiMonthYear: t('scheduling.views.year')
              }}
              views={{
                multiMonthQuarter: {
                  type: 'multiMonth',
                  duration: { months: 3 },
                  titleFormat: { month: 'short', year: 'numeric' }
                },
                multiMonthSemester: {
                  type: 'multiMonth',
                  duration: { months: 6 },
                  titleFormat: { month: 'short', year: 'numeric' }
                },
                multiMonthYear: {
                  type: 'multiMonth',
                  duration: { months: 12 },
                  titleFormat: { month: 'short', year: 'numeric' }
                }
              }}
              dateClick={onDateClick}
              datesSet={onDatesSet}
              events={calendarEvents}
              eventClick={onEventClick}
              eventDrop={onEventDrop}
              eventResize={onEventResize}
            />
          </div>
        </Card>
      ) : null}

      {viewMode === 'list' ? (
        <DataTable
          columns={columns}
          data={filtered}
          emptyState={<EmptyState title={t('scheduling.emptyTitle')} description={t('scheduling.emptySubtitle')} />}
        />
      ) : null}
    </div>
  );
}

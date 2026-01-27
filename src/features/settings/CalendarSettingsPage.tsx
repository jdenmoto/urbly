import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useI18n } from '@/lib/i18n';
import { db } from '@/lib/firebase/client';
import { useToast } from '@/components/ToastProvider';
import { EditIcon, TrashIcon } from '@/components/ActionIcons';

type CalendarEntry = {
  id: string;
  date: string;
  name?: string;
};

type CalendarSettings = {
  holidays?: CalendarEntry[];
  nonWorkingDays?: CalendarEntry[];
};

export default function CalendarSettingsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [holidays, setHolidays] = useState<CalendarEntry[]>([]);
  const [nonWorkingDays, setNonWorkingDays] = useState<CalendarEntry[]>([]);
  const [editingHolidayId, setEditingHolidayId] = useState<string | null>(null);
  const [editingNonWorkingId, setEditingNonWorkingId] = useState<string | null>(null);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayName, setHolidayName] = useState('');
  const [nonWorkingDate, setNonWorkingDate] = useState('');
  const [nonWorkingName, setNonWorkingName] = useState('');
  const [holidayYear, setHolidayYear] = useState(() => String(new Date().getFullYear()));

  const holidayDates = useMemo(() => new Set(holidays.map((item) => item.date)), [holidays]);

  useEffect(() => {
    const load = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'settings', 'calendar'));
        if (snapshot.exists()) {
          const payload = snapshot.data() as CalendarSettings;
          setHolidays(payload.holidays ?? []);
          setNonWorkingDays(payload.nonWorkingDays ?? []);
        }
      } catch (error) {
        toast(t('common.actionError'), 'error');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [t, toast]);

  const persist = async (nextHolidays: CalendarEntry[], nextNonWorking: CalendarEntry[]) => {
    setSaving(true);
    try {
      await setDoc(
        doc(db, 'settings', 'calendar'),
        { holidays: nextHolidays, nonWorkingDays: nextNonWorking },
        { merge: true }
      );
      setHolidays(nextHolidays);
      setNonWorkingDays(nextNonWorking);
      toast(t('settings.toastSaved'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveHoliday = async () => {
    const date = holidayDate.trim();
    if (!date) return;
    if (!editingHolidayId && holidayDates.has(date)) {
      toast(t('settings.calendarDateDuplicate'), 'error');
      return;
    }
    const id = editingHolidayId ?? (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`);
    const payload = { id, date, name: holidayName.trim() };
    const next = editingHolidayId
      ? holidays.map((item) => (item.id === editingHolidayId ? payload : item))
      : [...holidays, payload];
    await persist(next, nonWorkingDays);
    setEditingHolidayId(null);
    setHolidayDate('');
    setHolidayName('');
  };

  const saveNonWorking = async () => {
    const date = nonWorkingDate.trim();
    if (!date) return;
    if (!editingNonWorkingId && nonWorkingDays.some((item) => item.date === date)) {
      toast(t('settings.calendarDateDuplicate'), 'error');
      return;
    }
    const id = editingNonWorkingId ?? (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`);
    const payload = { id, date, name: nonWorkingName.trim() };
    const next = editingNonWorkingId
      ? nonWorkingDays.map((item) => (item.id === editingNonWorkingId ? payload : item))
      : [...nonWorkingDays, payload];
    await persist(holidays, next);
    setEditingNonWorkingId(null);
    setNonWorkingDate('');
    setNonWorkingName('');
  };

  const editHoliday = (item: CalendarEntry) => {
    setEditingHolidayId(item.id);
    setHolidayDate(item.date);
    setHolidayName(item.name ?? '');
  };

  const editNonWorking = (item: CalendarEntry) => {
    setEditingNonWorkingId(item.id);
    setNonWorkingDate(item.date);
    setNonWorkingName(item.name ?? '');
  };

  const deleteHoliday = async (id: string) => {
    const next = holidays.filter((item) => item.id !== id);
    await persist(next, nonWorkingDays);
  };

  const deleteNonWorking = async (id: string) => {
    const next = nonWorkingDays.filter((item) => item.id !== id);
    await persist(holidays, next);
  };

  const normalizeDate = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.includes('/')) {
      const [day, month, year] = trimmed.split('/').map((part) => part.padStart(2, '0'));
      if (!year) return '';
      return `${year}-${month}-${day}`;
    }
    if (trimmed.includes('-')) {
      const parts = trimmed.split('-');
      if (parts[0]?.length === 4) return trimmed;
      if (parts.length === 3) {
        const [day, month, year] = parts.map((part) => part.padStart(2, '0'));
        return `${year}-${month}-${day}`;
      }
    }
    return trimmed;
  };

  const loadColombiaHolidays = async () => {
    try {
      const year = Number(holidayYear);
      if (!Number.isFinite(year) || year < 2000) {
        toast(t('settings.calendarYearInvalid'), 'error');
        return;
      }
      const mod = await import('festivos-colombianos');
      const CalendarCtor =
        (mod as { default?: any; Calendar?: any; FestivosColombia?: any }).default ??
        (mod as { Calendar?: any }).Calendar ??
        (mod as { FestivosColombia?: any }).FestivosColombia ??
        mod;
      const calendar = typeof CalendarCtor === 'function' ? new CalendarCtor() : CalendarCtor;
      const holidaysFromLib =
        typeof calendar?.getHolidaysByYear === 'function'
          ? calendar.getHolidaysByYear(year)
          : typeof calendar?.getHolidays === 'function'
            ? calendar.getHolidays(year)
            : Array.isArray(calendar)
              ? calendar
              : [];
      if (!Array.isArray(holidaysFromLib)) {
        toast(t('settings.calendarImportError'), 'error');
        return;
      }
      const mapped: CalendarEntry[] = holidaysFromLib
        .map((item: any) => {
          const date = normalizeDate(String(item.date ?? item.fecha ?? ''));
          if (!date) return null;
          return {
            id: item.id ?? `${date}`,
            date,
            name: String(item.name ?? item.nombre ?? t('settings.calendarHolidayDefault'))
          };
        })
        .filter(Boolean) as CalendarEntry[];

      const existing = new Map(holidays.map((item) => [item.date, item]));
      mapped.forEach((item) => {
        if (!existing.has(item.date)) {
          existing.set(item.date, item);
        }
      });
      await persist(Array.from(existing.values()), nonWorkingDays);
      toast(t('settings.calendarImported'), 'success');
    } catch (error) {
      toast(t('settings.calendarImportError'), 'error');
    }
  };

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-ink-600">{t('common.loading')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('settings.calendarTitle')} subtitle={t('settings.calendarSubtitle')} />
      <Card className="space-y-8">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-ink-900">{t('settings.holidaysTitle')}</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              label={t('settings.calendarYear')}
              value={holidayYear}
              onChange={(event) => setHolidayYear(event.target.value)}
              inputMode="numeric"
            />
            <div className="flex items-end md:col-span-2">
              <Button type="button" variant="secondary" onClick={loadColombiaHolidays} disabled={saving} className="w-full">
                {t('settings.calendarImportColombia')}
              </Button>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              label={t('settings.calendarDate')}
              type="date"
              value={holidayDate}
              onChange={(event) => setHolidayDate(event.target.value)}
              required
            />
            <Input
              label={t('settings.calendarName')}
              value={holidayName}
              onChange={(event) => setHolidayName(event.target.value)}
            />
            <div className="flex items-end">
              <Button type="button" onClick={saveHoliday} disabled={saving} className="w-full">
                {editingHolidayId ? t('settings.calendarUpdate') : t('settings.calendarAddHoliday')}
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-fog-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-fog-100 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-3 py-2">{t('settings.calendarDate')}</th>
                  <th className="px-3 py-2">{t('settings.calendarName')}</th>
                  <th className="px-3 py-2">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map((item) => (
                  <tr key={item.id} className="border-t border-fog-100">
                    <td className="px-3 py-2 text-ink-900">{item.date}</td>
                    <td className="px-3 py-2 text-ink-700">{item.name || t('common.noData')}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-ink-700 hover:bg-fog-100"
                          onClick={() => editHoliday(item)}
                          title={t('common.edit')}
                          aria-label={t('common.edit')}
                        >
                          <EditIcon className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-rose-600 hover:bg-rose-50"
                          onClick={() => deleteHoliday(item.id)}
                          title={t('common.delete')}
                          aria-label={t('common.delete')}
                        >
                          <TrashIcon className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-ink-900">{t('settings.nonWorkingTitle')}</h3>
          <div className="grid gap-3 md:grid-cols-3">
            <Input
              label={t('settings.calendarDate')}
              type="date"
              value={nonWorkingDate}
              onChange={(event) => setNonWorkingDate(event.target.value)}
              required
            />
            <Input
              label={t('settings.calendarName')}
              value={nonWorkingName}
              onChange={(event) => setNonWorkingName(event.target.value)}
            />
            <div className="flex items-end">
              <Button type="button" onClick={saveNonWorking} disabled={saving} className="w-full">
                {editingNonWorkingId ? t('settings.calendarUpdate') : t('settings.calendarAddNonWorking')}
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-fog-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-fog-100 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-3 py-2">{t('settings.calendarDate')}</th>
                  <th className="px-3 py-2">{t('settings.calendarName')}</th>
                  <th className="px-3 py-2">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {nonWorkingDays.map((item) => (
                  <tr key={item.id} className="border-t border-fog-100">
                    <td className="px-3 py-2 text-ink-900">{item.date}</td>
                    <td className="px-3 py-2 text-ink-700">{item.name || t('common.noData')}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-ink-700 hover:bg-fog-100"
                          onClick={() => editNonWorking(item)}
                          title={t('common.edit')}
                          aria-label={t('common.edit')}
                        >
                          <EditIcon className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-rose-600 hover:bg-rose-50"
                          onClick={() => deleteNonWorking(item.id)}
                          title={t('common.delete')}
                          aria-label={t('common.delete')}
                        >
                          <TrashIcon className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </Card>
    </div>
  );
}

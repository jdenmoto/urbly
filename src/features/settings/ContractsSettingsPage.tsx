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

type MaintenancePrices = {
  valor_lavado_tanque_agua_potable_sem1: number;
  valor_lavado_tanque_agua_potable_sem2: number;
  valor_lavado_pozos_eyectores_aguas_lluvias: number;
  valor_lavado_pozos_eyectores_aguas_negras: number;
  valor_pruebas_hidraulicas_red_contra_incendios: number;
  valor_limpieza_sistema_drenaje_sotanos: number;
  valor_lavado_tanque_red_contra_incendios: number;
  valor_contrato_mantenimiento: number;
};

type MaintenanceType = {
  id: string;
  name: string;
  prices: MaintenancePrices;
  applies?: Record<keyof MaintenancePrices, boolean>;
  recommendedDates?: {
    fecha_rec_agua_potable_1?: string;
    fecha_rec_agua_potable_2?: string;
    fecha_rec_pozo_aguas_lluvias?: string;
    fecha_rec_pozo_aguas_negras?: string;
    fecha_rec_tanque_rci?: string;
    fecha_rec_pruebas_rci?: string;
  };
};

const emptyPrices: MaintenancePrices = {
  valor_lavado_tanque_agua_potable_sem1: 0,
  valor_lavado_tanque_agua_potable_sem2: 0,
  valor_lavado_pozos_eyectores_aguas_lluvias: 0,
  valor_lavado_pozos_eyectores_aguas_negras: 0,
  valor_pruebas_hidraulicas_red_contra_incendios: 0,
  valor_limpieza_sistema_drenaje_sotanos: 0,
  valor_lavado_tanque_red_contra_incendios: 0,
  valor_contrato_mantenimiento: 0
};

const defaultApplies: Record<keyof MaintenancePrices, boolean> = {
  valor_lavado_tanque_agua_potable_sem1: true,
  valor_lavado_tanque_agua_potable_sem2: true,
  valor_lavado_pozos_eyectores_aguas_lluvias: true,
  valor_lavado_pozos_eyectores_aguas_negras: true,
  valor_pruebas_hidraulicas_red_contra_incendios: true,
  valor_limpieza_sistema_drenaje_sotanos: true,
  valor_lavado_tanque_red_contra_incendios: true,
  valor_contrato_mantenimiento: true
};

export default function ContractsSettingsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [editingMaintenanceId, setEditingMaintenanceId] = useState<string | null>(null);
  const [contractTypeName, setContractTypeName] = useState('');
  const [prices, setPrices] = useState<MaintenancePrices>(emptyPrices);
  const [applies, setApplies] = useState<Record<keyof MaintenancePrices, boolean>>(defaultApplies);
  const [recommendedDates, setRecommendedDates] = useState<{
    fecha_rec_agua_potable_1: string;
    fecha_rec_agua_potable_2: string;
    fecha_rec_pozo_aguas_lluvias: string;
    fecha_rec_pozo_aguas_negras: string;
    fecha_rec_tanque_rci: string;
    fecha_rec_pruebas_rci: string;
  }>({
    fecha_rec_agua_potable_1: '',
    fecha_rec_agua_potable_2: '',
    fecha_rec_pozo_aguas_lluvias: '',
    fecha_rec_pozo_aguas_negras: '',
    fecha_rec_tanque_rci: '',
    fecha_rec_pruebas_rci: ''
  });

  const formatCOP = (value: number) => {
    if (!Number.isFinite(value)) return '$0';
    return `$${Math.round(value).toLocaleString('es-CO')}`;
  };

  const parseCOP = (value: string) => {
    const numeric = value.replace(/[^\d]/g, '');
    return numeric ? Number(numeric) : 0;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const maintenanceSnap = await getDoc(doc(db, 'settings', 'maintenance_contract_types'));
        if (maintenanceSnap.exists()) {
          const payload = maintenanceSnap.data() as { types?: MaintenanceType[] };
          setMaintenanceTypes(payload.types ?? []);
        }
      } catch (error) {
        toast(t('common.actionError'), 'error');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [toast, t]);

  const resetMaintenanceForm = () => {
    setEditingMaintenanceId(null);
    setContractTypeName('');
    setPrices(emptyPrices);
    setApplies(defaultApplies);
    setRecommendedDates({
      fecha_rec_agua_potable_1: '',
      fecha_rec_agua_potable_2: '',
      fecha_rec_pozo_aguas_lluvias: '',
      fecha_rec_pozo_aguas_negras: '',
      fecha_rec_tanque_rci: '',
      fecha_rec_pruebas_rci: ''
    });
  };

  const persistMaintenanceTypes = async (next: MaintenanceType[]) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'maintenance_contract_types'), { types: next }, { merge: true });
      setMaintenanceTypes(next);
      toast(t('settings.toastSaved'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    } finally {
      setSaving(false);
    }
  };


  const saveMaintenanceType = async () => {
    const name = contractTypeName.trim();
    if (!name) return;
    const id = editingMaintenanceId ?? (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`);
    const payload: MaintenanceType = { id, name, prices, applies, recommendedDates };
    const next = editingMaintenanceId
      ? maintenanceTypes.map((item) => (item.id === editingMaintenanceId ? payload : item))
      : [...maintenanceTypes, payload];
    await persistMaintenanceTypes(next);
    resetMaintenanceForm();
  };

  const removeMaintenanceType = async (id: string) => {
    const next = maintenanceTypes.filter((item) => item.id !== id);
    await persistMaintenanceTypes(next);
    toast(t('settings.contractTypeDeleted'), 'success');
  };

  const startEditMaintenance = (item: MaintenanceType) => {
    setEditingMaintenanceId(item.id);
    setContractTypeName(item.name);
    setPrices(item.prices);
    setApplies({ ...defaultApplies, ...(item.applies ?? {}) });
    setRecommendedDates({
      fecha_rec_agua_potable_1: item.recommendedDates?.fecha_rec_agua_potable_1 ?? '',
      fecha_rec_agua_potable_2: item.recommendedDates?.fecha_rec_agua_potable_2 ?? '',
      fecha_rec_pozo_aguas_lluvias: item.recommendedDates?.fecha_rec_pozo_aguas_lluvias ?? '',
      fecha_rec_pozo_aguas_negras: item.recommendedDates?.fecha_rec_pozo_aguas_negras ?? '',
      fecha_rec_tanque_rci: item.recommendedDates?.fecha_rec_tanque_rci ?? '',
      fecha_rec_pruebas_rci: item.recommendedDates?.fecha_rec_pruebas_rci ?? ''
    });
  };


  const priceFields = useMemo(
    () => [
      { key: 'valor_lavado_tanque_agua_potable_sem1', label: t('settings.priceWaterTankSem1') },
      { key: 'valor_lavado_tanque_agua_potable_sem2', label: t('settings.priceWaterTankSem2') },
      { key: 'valor_lavado_pozos_eyectores_aguas_lluvias', label: t('settings.pricePozosLluvias') },
      { key: 'valor_lavado_pozos_eyectores_aguas_negras', label: t('settings.pricePozosNegras') },
      { key: 'valor_pruebas_hidraulicas_red_contra_incendios', label: t('settings.priceHidraulicas') },
      { key: 'valor_limpieza_sistema_drenaje_sotanos', label: t('settings.priceDrenaje') },
      { key: 'valor_lavado_tanque_red_contra_incendios', label: t('settings.priceTankRCI') },
      { key: 'valor_contrato_mantenimiento', label: t('settings.priceMaintenance') }
    ],
    [t]
  );

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-ink-600">{t('common.loading')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('settings.contractsTitle')} subtitle={t('settings.contractsSubtitle')} />
      <Card className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-ink-900">{t('settings.maintenanceTypesTitle')}</h3>
          <Input
            label={t('settings.contractTypeName')}
            value={contractTypeName}
            onChange={(event) => setContractTypeName(event.target.value)}
            required
          />
          <div className="grid gap-2 md:grid-cols-2">
            {priceFields.map((field) => (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink-800">{field.label}</span>
                  <button
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      applies[field.key as keyof MaintenancePrices]
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                    onClick={() =>
                      setApplies((prev) => ({
                        ...prev,
                        [field.key]: !prev[field.key as keyof MaintenancePrices]
                      }))
                    }
                  >
                    {applies[field.key as keyof MaintenancePrices]
                      ? t('settings.appliesYes')
                      : t('settings.appliesNo')}
                  </button>
                </div>
                <Input
                  label=""
                  value={formatCOP(prices[field.key as keyof MaintenancePrices] ?? 0)}
                  inputMode="numeric"
                  onChange={(event) =>
                    setPrices((prev) => ({
                      ...prev,
                      [field.key]: parseCOP(event.target.value)
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-fog-200 p-4">
            <p className="text-sm font-semibold text-ink-900">{t('settings.recommendedDatesTitle')}</p>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Input
                label={t('settings.recWaterPotableSem1')}
                type="date"
                value={recommendedDates.fecha_rec_agua_potable_1}
                onChange={(event) =>
                  setRecommendedDates((prev) => ({ ...prev, fecha_rec_agua_potable_1: event.target.value }))
                }
              />
              <Input
                label={t('settings.recWaterPotableSem2')}
                type="date"
                value={recommendedDates.fecha_rec_agua_potable_2}
                onChange={(event) =>
                  setRecommendedDates((prev) => ({ ...prev, fecha_rec_agua_potable_2: event.target.value }))
                }
              />
              <Input
                label={t('settings.recPozoLluvias')}
                type="date"
                value={recommendedDates.fecha_rec_pozo_aguas_lluvias}
                onChange={(event) =>
                  setRecommendedDates((prev) => ({ ...prev, fecha_rec_pozo_aguas_lluvias: event.target.value }))
                }
              />
              <Input
                label={t('settings.recPozoNegras')}
                type="date"
                value={recommendedDates.fecha_rec_pozo_aguas_negras}
                onChange={(event) =>
                  setRecommendedDates((prev) => ({ ...prev, fecha_rec_pozo_aguas_negras: event.target.value }))
                }
              />
              <Input
                label={t('settings.recTankRci')}
                type="date"
                value={recommendedDates.fecha_rec_tanque_rci}
                onChange={(event) =>
                  setRecommendedDates((prev) => ({ ...prev, fecha_rec_tanque_rci: event.target.value }))
                }
              />
              <Input
                label={t('settings.recPruebasRci')}
                type="date"
                value={recommendedDates.fecha_rec_pruebas_rci}
                onChange={(event) =>
                  setRecommendedDates((prev) => ({ ...prev, fecha_rec_pruebas_rci: event.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            {editingMaintenanceId ? (
              <Button type="button" variant="secondary" onClick={resetMaintenanceForm}>
                {t('common.cancel')}
              </Button>
            ) : null}
            <Button type="button" onClick={saveMaintenanceType} disabled={saving}>
              {saving
                ? t('settings.saving')
                : editingMaintenanceId
                  ? t('settings.updateContractType')
                  : t('settings.addContractType')}
            </Button>
          </div>
          <div className="overflow-hidden rounded-xl border border-fog-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-fog-100 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-3 py-2">{t('settings.contractTypeName')}</th>
                  <th className="px-3 py-2">{t('settings.pricesSection')}</th>
                  <th className="px-3 py-2">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceTypes.map((item) => (
                  <tr key={item.id} className="border-t border-fog-100">
                    <td className="px-3 py-2 font-semibold text-ink-900">{item.name}</td>
                    <td className="px-3 py-2 text-xs text-ink-600">
                      {priceFields.map((field) => (
                        <div key={field.key} className="flex items-center justify-between gap-2">
                          <span>{field.label}</span>
                          <span>
                            {(item.applies?.[field.key as keyof MaintenancePrices] ?? true)
                              ? formatCOP(item.prices[field.key as keyof MaintenancePrices])
                              : 'N/A'}
                          </span>
                        </div>
                      ))}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-ink-700 hover:bg-fog-100"
                          onClick={() => startEditMaintenance(item)}
                          title={t('common.edit')}
                          aria-label={t('common.edit')}
                        >
                          <EditIcon className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-rose-600 hover:bg-rose-50"
                          onClick={() => removeMaintenanceType(item.id)}
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
        </div>

      </Card>
    </div>
  );
}

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
  valor_pruebas_hidraulias_red_contra_incendios: number;
  valor_limpieza_sistema_drenaje_sotanos: number;
  valor_lavado_tanque_red_contra_incendios: number;
  valor_contrato_mantenimiento: number;
};

type MaintenanceType = {
  id: string;
  name: string;
  prices: MaintenancePrices;
};

const emptyPrices: MaintenancePrices = {
  valor_lavado_tanque_agua_potable_sem1: 0,
  valor_lavado_tanque_agua_potable_sem2: 0,
  valor_lavado_pozos_eyectores_aguas_lluvias: 0,
  valor_lavado_pozos_eyectores_aguas_negras: 0,
  valor_pruebas_hidraulias_red_contra_incendios: 0,
  valor_limpieza_sistema_drenaje_sotanos: 0,
  valor_lavado_tanque_red_contra_incendios: 0,
  valor_contrato_mantenimiento: 0
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
    const payload: MaintenanceType = { id, name, prices };
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
  };


  const priceFields = useMemo(
    () => [
      { key: 'valor_lavado_tanque_agua_potable_sem1', label: t('settings.priceWaterTankSem1') },
      { key: 'valor_lavado_tanque_agua_potable_sem2', label: t('settings.priceWaterTankSem2') },
      { key: 'valor_lavado_pozos_eyectores_aguas_lluvias', label: t('settings.pricePozosLluvias') },
      { key: 'valor_lavado_pozos_eyectores_aguas_negras', label: t('settings.pricePozosNegras') },
      { key: 'valor_pruebas_hidraulias_red_contra_incendios', label: t('settings.priceHidraulicas') },
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
              <Input
                key={field.key}
                label={field.label}
                value={formatCOP(prices[field.key as keyof MaintenancePrices] ?? 0)}
                inputMode="numeric"
                onChange={(event) =>
                  setPrices((prev) => ({
                    ...prev,
                    [field.key]: parseCOP(event.target.value)
                  }))
                }
              />
            ))}
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
                          <span>{formatCOP(item.prices[field.key as keyof MaintenancePrices])}</span>
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

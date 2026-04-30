import { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useI18n } from '@/lib/i18n';
import { db } from '@/lib/firebase/client';
import { useToast } from '@/components/ToastProvider';
import { useList } from '@/lib/api/queries';
import type { Contract } from '@/core/models/contract';
import { EditIcon, PowerIcon, TrashIcon } from '@/components/ActionIcons';

type LabType = {
  id: string;
  name: string;
  description: string;
  labType: string;
  active?: boolean;
};

export default function LabsSettingsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [labTypes, setLabTypes] = useState<LabType[]>([]);
  const { data: contracts = [] } = useList<Contract>('contracts', 'contracts');
  const [labTypeName, setLabTypeName] = useState('');
  const [labTypeDescription, setLabTypeDescription] = useState('');
  const [labTypeKind, setLabTypeKind] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const editingItem = useMemo(
    () => labTypes.find((item) => item.id === editingId) ?? null,
    [labTypes, editingId]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const labSnap = await getDoc(doc(db, 'settings', 'lab_analysis_types'));
        if (labSnap.exists()) {
          const payload = labSnap.data() as { types?: LabType[] };
          setLabTypes(payload.types ?? []);
        }
      } catch {
        toast(t('common.action.error'), 'error');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [toast, t]);

  const persistLabTypes = async (next: LabType[]) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'lab_analysis_types'), { types: next }, { merge: true });
      setLabTypes(next);
      toast(t('settings.toast.saved'), 'success');
    } catch {
      toast(t('common.action.error'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const isDuplicate = (name: string, type: string, ignoreId?: string | null) => {
    return labTypes.some(
      (item) =>
        item.id !== ignoreId &&
        item.name.toLowerCase() === name.toLowerCase() &&
        item.labType.toLowerCase() === type.toLowerCase()
    );
  };

  const addLabType = async () => {
    const name = labTypeName.trim();
    const description = labTypeDescription.trim();
    const labType = labTypeKind.trim();
    if (!name || !description || !labType) return;
    if (isDuplicate(name, labType, editingId)) {
      toast(t('settings.lab.type.duplicate'), 'error');
      return;
    }
    if (editingId) {
      const next = labTypes.map((item) =>
        item.id === editingId ? { ...item, name, description, labType } : item
      );
      await persistLabTypes(next);
      toast(t('settings.lab.type.updated'), 'success');
    } else {
      const id = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
      await persistLabTypes([...labTypes, { id, name, description, labType, active: true }]);
      toast(t('settings.lab.type.created'), 'success');
    }
    setLabTypeName('');
    setLabTypeDescription('');
    setLabTypeKind('');
    setEditingId(null);
  };

  const startEdit = (item: LabType) => {
    setEditingId(item.id);
    setLabTypeName(item.name);
    setLabTypeDescription(item.description);
    setLabTypeKind(item.labType);
  };

  const toggleActive = async (id: string) => {
    const next = labTypes.map((item) =>
      item.id === id ? { ...item, active: item.active === false } : item
    );
    await persistLabTypes(next);
    toast(t('settings.lab.type.updated'), 'success');
  };

  const removeLabType = async (id: string) => {
    const inUse = contracts.some((contract) => contract.labAnalysisTypeId === id);
    if (inUse) {
      toast(t('settings.lab.type.delete.blocked'), 'error');
      return;
    }
    await persistLabTypes(labTypes.filter((item) => item.id !== id));
    toast(t('settings.lab.type.deleted'), 'success');
  };

  const labRows = useMemo(() => labTypes, [labTypes]);

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-ink-600">{t('common.loading.default')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('settings.labs.title')} subtitle={t('settings.labs.subtitle')} />
      <Card className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-ink-900">{t('settings.lab.types.title')}</h3>
          <div className="grid gap-2 md:grid-cols-3">
            <Input
              label={t('settings.lab.type.name')}
              value={labTypeName}
              onChange={(event) => setLabTypeName(event.target.value)}
              required
            />
            <Input
              label={t('settings.lab.type.description')}
              value={labTypeDescription}
              onChange={(event) => setLabTypeDescription(event.target.value)}
              required
            />
            <Input
              label={t('settings.lab.type.kind')}
              value={labTypeKind}
              onChange={(event) => setLabTypeKind(event.target.value)}
              required
            />
          </div>
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2">
              {editingId && editingItem ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-fog-200 px-3 py-2 text-xs font-semibold text-ink-700"
                  onClick={() => toggleActive(editingItem.id)}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${editingItem.active === false ? 'bg-rose-400' : 'bg-emerald-400'}`}
                  />
                  {editingItem.active === false ? t('settings.lab.type.enable') : t('settings.lab.type.disable')}
                </button>
              ) : null}
              <Button type="button" variant="secondary" onClick={addLabType} disabled={saving}>
                {editingId ? t('settings.update.lab.type') : t('settings.add.lab.type')}
              </Button>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-fog-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-fog-100 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-3 py-2">{t('settings.lab.type.name')}</th>
                  <th className="px-3 py-2">{t('settings.lab.type.description')}</th>
                  <th className="px-3 py-2">{t('settings.lab.type.kind')}</th>
                  <th className="px-3 py-2">{t('settings.lab.type.status')}</th>
                  <th className="px-3 py-2">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {labRows.map((item) => (
                  <tr key={item.id} className="border-t border-fog-100">
                    <td className="px-3 py-2 font-semibold text-ink-900">{item.name}</td>
                    <td className="px-3 py-2 text-xs text-ink-600">{item.description}</td>
                    <td className="px-3 py-2 text-xs text-ink-600">{item.labType}</td>
                    <td className="px-3 py-2 text-xs text-ink-600">
                      {item.active === false ? t('settings.lab.type.disabled') : t('settings.lab.type.active')}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-ink-700 hover:bg-fog-100"
                          onClick={() => startEdit(item)}
                          title={t('common.edit')}
                          aria-label={t('common.edit')}
                        >
                          <EditIcon className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-amber-600 hover:bg-amber-50"
                          onClick={() => toggleActive(item.id)}
                          title={item.active === false ? t('settings.lab.type.enable') : t('settings.lab.type.disable')}
                          aria-label={item.active === false ? t('settings.lab.type.enable') : t('settings.lab.type.disable')}
                        >
                          <PowerIcon className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-rose-600 hover:bg-rose-50"
                          onClick={() => removeLabType(item.id)}
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

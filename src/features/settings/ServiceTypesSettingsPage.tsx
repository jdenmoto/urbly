import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useI18n } from '@/lib/i18n';
import { db } from '@/lib/firebase/client';
import { useToast } from '@/components/ToastProvider';
import { EditIcon, TrashIcon } from '@/components/ActionIcons';

export type ServiceTypeRecord = {
  id: string;
  code: string;
  name: string;
  description?: string;
  active: boolean;
  defaultDurationMinutes?: number | null;
  category?: string | null;
};

type ServiceTypesSettings = {
  types: ServiceTypeRecord[];
};

const defaultSettings: ServiceTypesSettings = {
  types: []
};

export default function ServiceTypesSettingsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [settings, setSettings] = useState<ServiceTypesSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ServiceTypeRecord>({
    id: '',
    code: '',
    name: '',
    description: '',
    active: true,
    defaultDurationMinutes: 60,
    category: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'settings', 'service_types'));
        if (snapshot.exists()) {
          setSettings(snapshot.data() as ServiceTypesSettings);
        }
      } catch {
        toast(t('common.actionError'), 'error');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [toast, t]);

  const persist = async (next: ServiceTypesSettings) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'service_types'), next, { merge: true });
      setSettings(next);
      toast(t('settings.toastSaved'), 'success');
    } catch {
      toast(t('common.actionError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      id: '',
      code: '',
      name: '',
      description: '',
      active: true,
      defaultDurationMinutes: 60,
      category: ''
    });
  };

  const save = async () => {
    const code = form.code.trim();
    const name = form.name.trim();
    if (!code || !name) return;
    const id = editingId ?? (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`);
    const payload: ServiceTypeRecord = {
      ...form,
      id,
      code,
      name,
      description: form.description?.trim() || '',
      category: form.category?.trim() || '',
      defaultDurationMinutes: Number(form.defaultDurationMinutes || 0) || null
    };
    const next = editingId
      ? settings.types.map((item) => (item.id === editingId ? payload : item))
      : [...settings.types, payload];
    await persist({ types: next });
    resetForm();
  };

  const remove = async (id: string) => {
    const next = settings.types.map((item) => (item.id === id ? { ...item, active: false } : item));
    await persist({ types: next });
  };

  const startEdit = (item: ServiceTypeRecord) => {
    setEditingId(item.id);
    setForm(item);
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
      <PageHeader title="Tipos de servicio" subtitle="Catálogo administrable de tipos de servicio" />
      <Card className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Código" value={form.code} onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))} required />
          <Input label="Nombre" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} required />
          <Input label="Categoría" value={form.category ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))} />
          <Input label="Duración por defecto (min)" type="number" value={String(form.defaultDurationMinutes ?? 60)} onChange={(e) => setForm((prev) => ({ ...prev, defaultDurationMinutes: Number(e.target.value) }))} />
        </div>
        <Input label="Descripción" value={form.description ?? ''} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
        <div className="flex items-center gap-3">
          <Button type="button" onClick={save} disabled={saving}>{saving ? t('settings.saving') : editingId ? 'Actualizar tipo' : 'Agregar tipo'}</Button>
          {editingId ? <Button type="button" variant="secondary" onClick={resetForm}>Nuevo tipo</Button> : null}
        </div>
      </Card>
      <Card>
        <div className="overflow-hidden rounded-xl border border-fog-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-fog-100 text-xs uppercase text-ink-500">
              <tr>
                <th className="px-3 py-2">Código</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Estado</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {settings.types.map((item) => (
                <tr key={item.id} className="border-t border-fog-100">
                  <td className="px-3 py-2 font-mono text-xs text-ink-700">{item.code}</td>
                  <td className="px-3 py-2 font-semibold text-ink-900">{item.name}</td>
                  <td className="px-3 py-2 text-xs text-ink-600">{item.active ? 'Activo' : 'Inactivo'}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button type="button" className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-ink-700 hover:bg-fog-100" onClick={() => startEdit(item)}>
                        <EditIcon className="h-4 w-4" aria-hidden />
                      </button>
                      <button type="button" className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-rose-600 hover:bg-rose-50" onClick={() => remove(item.id)}>
                        <TrashIcon className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

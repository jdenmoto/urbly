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

type IssueSettings = {
  types: string[];
  categories: Record<string, string[]>;
};

const defaultSettings: IssueSettings = {
  types: [],
  categories: {}
};

export default function IssuesSettingsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [settings, setSettings] = useState<IssueSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newType, setNewType] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newTypeCategories, setNewTypeCategories] = useState<string[]>([]);
  const [editingType, setEditingType] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const snapshot = await getDoc(doc(db, 'settings', 'issues'));
        if (snapshot.exists()) {
          setSettings(snapshot.data() as IssueSettings);
        }
      } catch (error) {
        toast(t('common.actionError'), 'error');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [toast, t]);

  const typeList = useMemo(() => settings.types ?? [], [settings.types]);

  const persistSettings = async (next: IssueSettings) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'issues'), next, { merge: true });
      setSettings(next);
      toast(t('settings.toastSaved'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const addType = async () => {
    const value = newType.trim();
    if (!value || typeList.includes(value)) return;
    const categories = newTypeCategories.map((item) => item.trim()).filter(Boolean);
    const next: IssueSettings = {
      types: [...settings.types, value],
      categories: { ...settings.categories, [value]: categories }
    };
    await persistSettings(next);
    setNewType('');
    setNewTypeCategories([]);
  };

  const removeType = async (value: string) => {
    const nextTypes = settings.types.filter((item) => item !== value);
    const nextCategories = { ...settings.categories };
    delete nextCategories[value];
    await persistSettings({ types: nextTypes, categories: nextCategories });
    toast(t('settings.issueDeleted'), 'success');
  };

  const startEdit = (value: string) => {
    setEditingType(value);
    setNewType(value);
    setNewTypeCategories(settings.categories[value] ?? []);
  };

  const saveEdit = async () => {
    if (!editingType) return;
    const name = newType.trim();
    if (!name) return;
    const categories = newTypeCategories.map((item) => item.trim()).filter(Boolean);
    const renamed = name !== editingType;
    const nextTypes = renamed
      ? settings.types.map((item) => (item === editingType ? name : item))
      : [...settings.types];
    const nextCategories = { ...settings.categories };
    delete nextCategories[editingType];
    nextCategories[name] = categories;
    await persistSettings({ types: nextTypes, categories: nextCategories });
    setEditingType(null);
    setNewType('');
    setNewTypeCategories([]);
    toast(t('settings.issueUpdated'), 'success');
  };

  const addCategoryChip = () => {
    const value = newCategory.trim();
    if (!value) return;
    setNewTypeCategories((prev) => [...prev, value]);
    setNewCategory('');
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
      <PageHeader title={t('settings.issuesTitle')} subtitle={t('settings.issuesSubtitle')} />
      <Card className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-ink-900">{t('settings.issueTypes')}</h3>
          <div className="grid gap-2 md:grid-cols-2">
            <Input
              label={t('settings.issueName')}
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              required
            />
            <div className="space-y-2">
              <Input
                label={t('settings.issueCategories')}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
              />
              <Button type="button" variant="secondary" onClick={addCategoryChip}>
                {t('settings.addCategory')}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {newTypeCategories.map((item, index) => (
              <div
                key={`${item}-${index}`}
                className="flex items-center gap-2 rounded-full border border-fog-200 bg-white px-3 py-1 text-xs text-ink-700"
              >
                <input
                  value={item}
                  className="w-32 bg-transparent text-xs text-ink-700 outline-none"
                  onChange={(event) =>
                    setNewTypeCategories((prev) =>
                      prev.map((entry, idx) => (idx === index ? event.target.value : entry))
                    )
                  }
                />
                <button
                  type="button"
                  className="text-rose-500"
                  onClick={() => setNewTypeCategories((prev) => prev.filter((_, idx) => idx !== index))}
                  aria-label={t('common.delete')}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-500">{t('settings.categoryPillHint')}</p>
            <Button type="button" onClick={editingType ? saveEdit : addType} disabled={saving}>
              {saving
                ? t('settings.saving')
                : editingType
                  ? t('settings.updateIssue')
                  : t('settings.addIssue')}
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-ink-900">{t('settings.issuesTableTitle')}</h3>
          <div className="overflow-hidden rounded-xl border border-fog-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-fog-100 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-3 py-2">{t('settings.issueName')}</th>
                  <th className="px-3 py-2">{t('settings.issueCategories')}</th>
                  <th className="px-3 py-2">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {typeList.map((item) => (
                  <tr key={item} className="border-t border-fog-100">
                    <td className="px-3 py-2 font-semibold text-ink-900">{item}</td>
                    <td className="px-3 py-2 text-xs text-ink-600">
                      {(settings.categories[item] ?? []).join(', ')}
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
                          className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-rose-600 hover:bg-rose-50"
                          onClick={() => removeType(item)}
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

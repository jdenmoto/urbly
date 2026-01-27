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

type BuildingGroup = {
  id: string;
  name: string;
  color: string;
};

export default function GroupsSettingsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [groups, setGroups] = useState<BuildingGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupsSaving, setGroupsSaving] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupColor, setNewGroupColor] = useState('#4f46e5');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const groupsSnap = await getDoc(doc(db, 'settings', 'building_groups'));
        if (groupsSnap.exists()) {
          const payload = groupsSnap.data() as { groups?: BuildingGroup[] };
          setGroups(payload.groups ?? []);
        }
      } catch (error) {
        toast(t('common.actionError'), 'error');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [toast, t]);

  const addGroup = async () => {
    const name = newGroupName.trim();
    if (!name) return;
    if (groups.some((group) => group.id !== editingId && group.name.toLowerCase() === name.toLowerCase())) {
      toast(t('settings.groupExists'), 'error');
      return;
    }
    if (groups.some((group) => group.id !== editingId && group.color.toLowerCase() === newGroupColor.toLowerCase())) {
      toast(t('settings.groupColorExists'), 'error');
      return;
    }
    const id = editingId ?? (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`);
    const next = editingId
      ? groups.map((group) => (group.id === editingId ? { ...group, name, color: newGroupColor } : group))
      : [...groups, { id, name, color: newGroupColor }];
    setGroups(next);
    setNewGroupName('');
    setEditingId(null);
    await saveGroups(next);
  };

  const removeGroup = (id: string) => {
    setGroups((prev) => prev.filter((group) => group.id !== id));
  };

  const saveGroups = async (payload?: BuildingGroup[]) => {
    setGroupsSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'building_groups'), { groups: payload ?? groups }, { merge: true });
      toast(t('settings.groupsSaved'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    } finally {
      setGroupsSaving(false);
    }
  };

  const startEdit = (group: BuildingGroup) => {
    setEditingId(group.id);
    setNewGroupName(group.name);
    setNewGroupColor(group.color);
  };

  const groupRows = useMemo(() => groups, [groups]);

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-ink-600">{t('common.loading')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('settings.groupsTitle')} subtitle={t('settings.groupsSubtitle')} />
      <Card className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-ink-900">{t('settings.buildingGroups')}</h3>
          <div className="flex flex-wrap items-end gap-3">
            <Input
              label={t('settings.groupName')}
              value={newGroupName}
              onChange={(event) => setNewGroupName(event.target.value)}
              required
            />
            <label className="flex flex-col gap-1 text-sm text-ink-700">
              <span className="font-medium text-ink-800">
                {t('settings.groupColor')}
                <span className="ml-1 text-red-500">*</span>
              </span>
              <input
                type="color"
                value={newGroupColor}
                onChange={(event) => setNewGroupColor(event.target.value)}
                className="h-10 w-20 rounded-lg border border-fog-200 bg-white"
              />
            </label>
            <Button type="button" variant="secondary" onClick={addGroup} disabled={groupsSaving}>
              {groupsSaving
                ? t('settings.saving')
                : editingId
                  ? t('settings.updateGroup')
                  : t('settings.addGroup')}
            </Button>
            {editingId ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setNewGroupName('');
                  setNewGroupColor('#4f46e5');
                }}
              >
                {t('settings.newGroup')}
              </Button>
            ) : null}
          </div>
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-ink-900">{t('settings.groupsTableTitle')}</h3>
          <div className="overflow-hidden rounded-xl border border-fog-200">
            <table className="w-full text-left text-sm">
              <thead className="bg-fog-100 text-xs uppercase text-ink-500">
                <tr>
                  <th className="px-3 py-2">{t('settings.groupName')}</th>
                  <th className="px-3 py-2">{t('settings.groupColor')}</th>
                  <th className="px-3 py-2">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {groupRows.map((group) => (
                  <tr key={group.id} className="border-t border-fog-100">
                    <td className="px-3 py-2 font-semibold text-ink-900">{group.name}</td>
                    <td className="px-3 py-2 text-xs text-ink-600">
                      <span className="inline-flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: group.color }} />
                        {group.color}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-ink-700 hover:bg-fog-100"
                          onClick={() => startEdit(group)}
                          title={t('common.edit')}
                          aria-label={t('common.edit')}
                        >
                          <EditIcon className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-rose-600 hover:bg-rose-50"
                          onClick={() => removeGroup(group.id)}
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

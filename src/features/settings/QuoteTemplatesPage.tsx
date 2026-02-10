import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Document, Page, PDFViewer, Text, Image } from '@react-pdf/renderer';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Input from '@/components/Input';
import Select from '@/components/Select';
import { useI18n } from '@/lib/i18n';
import { db } from '@/lib/firebase/client';
import { useToast } from '@/components/ToastProvider';
import {
  LETTER_PAGE,
  QuoteTemplate,
  QuoteTemplateElement,
  QuoteTemplatePage,
  createEmptyTemplate
} from '@/core/models/quoteTemplate';

type MaintenanceType = {
  id: string;
  name: string;
};

type QuoteTemplatesDoc = {
  templates?: Record<string, QuoteTemplate>;
};

type DragState = {
  elementId: string;
  offsetX: number;
  offsetY: number;
};

const DEFAULT_FONT_SIZE = 11;
const stripHtml = (value: string) => value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const placeholderGroups = [
  {
    key: 'building',
    items: [
      { key: '{nombre_edificio}', sample: 'Edificio Lumen' },
      { key: '{direccion_edificio}', sample: 'Cra 50 # 20-10' },
      { key: '{nit_edificio}', sample: '901111111-1' },
      { key: '{tipo_edificio}', sample: 'EDIFICIO' }
    ]
  },
  {
    key: 'management',
    items: [
      { key: '{nombre_administracion}', sample: 'Aurora Gestion' },
      { key: '{telefono_administracion}', sample: '+57 300 111 2233' }
    ]
  },
  {
    key: 'contract',
    items: [
      { key: '{tipo_contrato_mantenimiento}', sample: 'Mantenimiento integral' },
      { key: '{fecha_finalizacion_contrato_mantenimiento}', sample: '31/12/2026' },
      { key: '{contrato_analisis_lab_tipo}', sample: 'Fisicoquimico' },
      { key: '{valor_contrato_mantenimiento}', sample: '$1.200.000' },
      { key: '{valor_analisis_laboratiorio_tipo}', sample: '$198.000' },
      { key: '{valor_lavado_tanque_agua_potable_sem1}', sample: '$640.382' },
      { key: '{valor_lavado_tanque_agua_potable_sem2}', sample: '$640.382' },
      { key: '{valor_lavado_pozos_eyectores_aguas_lluvias}', sample: '$520.000' },
      { key: '{valor_lavado_pozos_eyectores_aguas_negras}', sample: '$0' },
      { key: '{valor_pruebas_hidraulicas_red_contra_incendios}', sample: '$1.049.724' },
      { key: '{valor_limpieza_sistema_drenaje_sotanos}', sample: '$520.000' },
      { key: '{valor_lavado_tanque_red_contra_incendios}', sample: '$0' }
    ]
  },
  {
    key: 'recommended',
    items: [
      { key: '{fecha_rec_agua_potable_1}', sample: '3/01/2026' },
      { key: '{fecha_rec_agua_potable_2}', sample: '3/07/2026' },
      { key: '{fecha_rec_pozo_aguas_lluvias}', sample: '3/01/2026' },
      { key: '{fecha_rec_pozo_aguas_negras}', sample: '3/07/2026' },
      { key: '{fecha_rec_tanque_rci}', sample: 'N/A' },
      { key: '{fecha_rec_pruebas_rci}', sample: '3/07/2026' }
    ]
  },
  {
    key: 'dates',
    items: [
      { key: '{fecha_generacion}', sample: '15/01/2026' },
      { key: '{anho_anterior}', sample: '2025' },
      { key: '{anho_actual}', sample: '2026' }
    ]
  },
  {
    key: 'month',
    items: [
      { key: '{dia_mes_enero}', sample: '14' },
      { key: '{dia_mes_febrero}', sample: '7' },
      { key: '{dia_mes_marzo}', sample: '6' },
      { key: '{dia_mes_abril}', sample: '8' },
      { key: '{dia_mes_mayo}', sample: '9' },
      { key: '{dia_mes_junio}', sample: '12' },
      { key: '{dia_mes_julio}', sample: '10' },
      { key: '{dia_mes_agosto}', sample: '4' },
      { key: '{dia_mes_septiembre}', sample: '5' },
      { key: '{dia_mes_octubre}', sample: '11' },
      { key: '{dia_mes_noviembre}', sample: '2' },
      { key: '{dia_mes_diciembre}', sample: '1' }
    ]
  }
];

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ align: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block'],
    ['link', 'clean']
  ]
};

const quillFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'color',
  'background',
  'align',
  'list',
  'blockquote',
  'code-block',
  'link'
];

export default function QuoteTemplatesPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([]);
  const [templates, setTemplates] = useState<Record<string, QuoteTemplate>>({});
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [duplicateTargetId, setDuplicateTargetId] = useState('');
  const [activePageId, setActivePageId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const resizeRef = useRef<DragState | null>(null);
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>(() =>
    placeholderGroups.reduce((acc, group) => ({ ...acc, [group.key]: true }), {})
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [typesSnap, templatesSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'maintenance_contract_types')),
          getDoc(doc(db, 'settings', 'quote_templates'))
        ]);
        if (typesSnap.exists()) {
          const payload = typesSnap.data() as { types?: MaintenanceType[] };
          setMaintenanceTypes(payload.types ?? []);
        }
        if (templatesSnap.exists()) {
          const payload = templatesSnap.data() as QuoteTemplatesDoc;
          setTemplates(payload.templates ?? {});
        }
      } catch (error) {
        toast(t('common.actionError'), 'error');
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [t, toast]);

  useEffect(() => {
    if (!maintenanceTypes.length) return;
    if (!selectedTypeId) {
      setSelectedTypeId(maintenanceTypes[0].id);
    }
  }, [maintenanceTypes, selectedTypeId]);

  useEffect(() => {
    if (!maintenanceTypes.length) return;
    if (!duplicateTargetId || duplicateTargetId === selectedTypeId) {
      const next = maintenanceTypes.find((item) => item.id !== selectedTypeId);
      setDuplicateTargetId(next?.id ?? '');
    }
  }, [maintenanceTypes, selectedTypeId, duplicateTargetId]);

  const selectedType = useMemo(
    () => maintenanceTypes.find((item) => item.id === selectedTypeId),
    [maintenanceTypes, selectedTypeId]
  );

  const currentTemplate = useMemo(() => {
    if (!selectedTypeId) return null;
    const existing = templates[selectedTypeId];
    return (
      existing ??
      createEmptyTemplate(
        selectedTypeId,
        selectedType?.name ?? t('settings.quoteTemplateDefaultName')
      )
    );
  }, [selectedTypeId, selectedType, t, templates]);

  useEffect(() => {
    if (!currentTemplate) return;
    if (!activePageId || !currentTemplate.pages.some((page) => page.id === activePageId)) {
      setActivePageId(currentTemplate.pages[0]?.id ?? null);
    }
  }, [activePageId, currentTemplate]);

  const activePage = useMemo<QuoteTemplatePage | null>(() => {
    if (!currentTemplate || !activePageId) return null;
    return currentTemplate.pages.find((page) => page.id === activePageId) ?? null;
  }, [currentTemplate, activePageId]);

  useEffect(() => {
    setSelectedElementId(null);
  }, [activePageId]);

  const placeholderLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    placeholderGroups.forEach((group) => {
      group.items.forEach((item) => {
        labels[item.key] = item.key;
      });
    });
    return labels;
  }, []);

  const placeholderSamples = useMemo(() => {
    const samples: Record<string, string> = {};
    placeholderGroups.forEach((group) => {
      group.items.forEach((item) => {
        samples[item.key] = item.sample;
      });
    });
    return samples;
  }, []);

  const updateTemplate = useCallback(
    (updater: (template: QuoteTemplate) => QuoteTemplate) => {
      if (!selectedTypeId) return;
      setTemplates((prev) => {
        const base =
          prev[selectedTypeId] ??
          createEmptyTemplate(selectedTypeId, selectedType?.name ?? t('settings.quoteTemplateDefaultName'));
        return { ...prev, [selectedTypeId]: updater(base) };
      });
    },
    [selectedTypeId, selectedType, t]
  );

  const updateActivePage = useCallback(
    (updater: (page: QuoteTemplatePage) => QuoteTemplatePage) => {
      if (!activePage || !currentTemplate) return;
      updateTemplate((template) => ({
        ...template,
        pages: template.pages.map((page) => (page.id === activePage.id ? updater(page) : page))
      }));
    },
    [activePage, currentTemplate, updateTemplate]
  );

  const addElement = (element: Partial<QuoteTemplateElement>) => {
    if (!activePage) return;
    const id = crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`;
    const next: QuoteTemplateElement = {
      id,
      type: element.type ?? 'text',
      x: element.x ?? 40,
      y: element.y ?? 40,
      width: element.width,
      height: element.height,
      fontSize: element.fontSize ?? DEFAULT_FONT_SIZE,
      bold: element.bold ?? false,
      align: element.align ?? 'left',
      text: element.text ?? (element.type === 'text' ? t('settings.quoteTemplateText') : ''),
      html: element.html,
      src: element.src,
      field: element.field
    };
    updateActivePage((page) => ({ ...page, elements: [...page.elements, next] }));
    setSelectedElementId(id);
  };

  const updateElement = (elementId: string, changes: Partial<QuoteTemplateElement>) => {
    updateActivePage((page) => ({
      ...page,
      elements: page.elements.map((el) => (el.id === elementId ? { ...el, ...changes } : el))
    }));
  };

  const removeElement = (elementId: string) => {
    updateActivePage((page) => ({ ...page, elements: page.elements.filter((el) => el.id !== elementId) }));
    setSelectedElementId(null);
  };

  const handleImagePick = (file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      if (!src) return;
      addElement({ type: 'image', src, width: 160, height: 90 });
    };
    reader.readAsDataURL(file);
  };

  const replaceImage = (elementId: string, file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : '';
      if (!src) return;
      updateElement(elementId, { src });
    };
    reader.readAsDataURL(file);
  };

  const addPage = () => {
    if (!currentTemplate) return;
    const pageId = `${currentTemplate.id}-page-${currentTemplate.pages.length + 1}`;
    const nextPage: QuoteTemplatePage = { id: pageId, elements: [] };
    updateTemplate((template) => ({ ...template, pages: [...template.pages, nextPage] }));
    setActivePageId(pageId);
  };

  const handlePointerMove = useCallback(
    (event: PointerEvent) => {
      if (!canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const scale = zoom;
      if (dragRef.current) {
        const x = (event.clientX - rect.left) / scale - dragRef.current.offsetX;
        const y = (event.clientY - rect.top) / scale - dragRef.current.offsetY;
        updateElement(dragRef.current.elementId, {
          x: Math.max(0, Math.min(LETTER_PAGE.width - 10, x)),
          y: Math.max(0, Math.min(LETTER_PAGE.height - 10, y))
        });
      }
      if (resizeRef.current) {
        const x = (event.clientX - rect.left) / scale - resizeRef.current.offsetX;
        const y = (event.clientY - rect.top) / scale - resizeRef.current.offsetY;
        updateElement(resizeRef.current.elementId, {
          width: Math.max(40, x),
          height: Math.max(20, y)
        });
      }
    },
    [updateElement, zoom]
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
    resizeRef.current = null;
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  }, [handlePointerMove]);

  const startDrag = (event: React.PointerEvent, element: QuoteTemplateElement) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = zoom;
    const offsetX = (event.clientX - rect.left) / scale - element.x;
    const offsetY = (event.clientY - rect.top) / scale - element.y;
    dragRef.current = { elementId: element.id, offsetX, offsetY };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const startResize = (event: React.PointerEvent, element: QuoteTemplateElement) => {
    if (!canvasRef.current) return;
    event.stopPropagation();
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = zoom;
    const offsetX = (event.clientX - rect.left) / scale - (element.x + (element.width ?? 0));
    const offsetY = (event.clientY - rect.top) / scale - (element.y + (element.height ?? 0));
    resizeRef.current = { elementId: element.id, offsetX, offsetY };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const saveTemplate = async () => {
    if (!selectedTypeId || !currentTemplate) return;
    setSaving(true);
    try {
      const payload: QuoteTemplatesDoc = {
        templates: {
          ...templates,
          [selectedTypeId]: {
            ...currentTemplate,
            name: selectedType?.name ?? currentTemplate.name,
            updatedAt: new Date().toISOString()
          }
        }
      };
      await setDoc(doc(db, 'settings', 'quote_templates'), payload, { merge: true });
      setTemplates(payload.templates ?? {});
      toast(t('settings.quoteTemplateSaved'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const duplicateTemplate = async () => {
    if (!selectedTypeId || !currentTemplate || !duplicateTargetId) {
      toast(t('common.actionError'), 'error');
      return;
    }
    if (selectedTypeId === duplicateTargetId) {
      toast(t('settings.quoteTemplateDuplicateSame'), 'error');
      return;
    }
    const targetType = maintenanceTypes.find((item) => item.id === duplicateTargetId);
    const nextTemplate: QuoteTemplate = {
      ...currentTemplate,
      id: duplicateTargetId,
      name: targetType?.name ?? currentTemplate.name,
      pages: currentTemplate.pages.map((page, index) => ({
        ...page,
        id: `${duplicateTargetId}-page-${index + 1}`
      })),
      updatedAt: new Date().toISOString()
    };
    setSaving(true);
    try {
      const payload: QuoteTemplatesDoc = {
        templates: {
          ...templates,
          [duplicateTargetId]: nextTemplate
        }
      };
      await setDoc(doc(db, 'settings', 'quote_templates'), payload, { merge: true });
      setTemplates(payload.templates ?? {});
      toast(t('settings.quoteTemplateDuplicated'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedElement = useMemo(
    () => activePage?.elements.find((el) => el.id === selectedElementId) ?? null,
    [activePage, selectedElementId]
  );

  if (loading) {
    return (
      <Card>
        <p className="text-sm text-ink-600">{t('common.loading')}</p>
      </Card>
    );
  }

  if (!maintenanceTypes.length) {
    return (
      <Card>
        <p className="text-sm text-ink-600">{t('settings.quoteTemplateEmptyTypes')}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('settings.quoteTemplateTitle')} subtitle={t('settings.quoteTemplateSubtitle')} />
      <Card className="space-y-6">
        <div className="flex flex-wrap items-end gap-3">
          <Select
            label={t('settings.quoteTemplateContractType')}
            value={selectedTypeId}
            onChange={(event) => setSelectedTypeId(event.target.value)}
            required
          >
            {maintenanceTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
          <Select
            label={t('settings.quoteTemplateDuplicateTarget')}
            value={duplicateTargetId}
            onChange={(event) => setDuplicateTargetId(event.target.value)}
            className="min-w-[180px]"
          >
            {maintenanceTypes
              .filter((item) => item.id !== selectedTypeId)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </Select>
          <Button type="button" variant="secondary" onClick={duplicateTemplate} disabled={saving}>
            {t('settings.quoteTemplateDuplicate')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowPreview((prev) => !prev)}
          >
            {showPreview ? t('settings.quoteTemplateHidePreview') : t('settings.quoteTemplateShowPreview')}
          </Button>
          <Button type="button" onClick={saveTemplate} disabled={saving}>
            {saving ? t('settings.saving') : t('settings.quoteTemplateSave')}
          </Button>
          <Select
            label={t('settings.quoteTemplateZoom')}
            value={String(zoom)}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="w-32"
          >
            <option value="0.75">75%</option>
            <option value="0.9">90%</option>
            <option value="1">100%</option>
            <option value="1.1">110%</option>
            <option value="1.25">125%</option>
          </Select>
        </div>
        <div className="flex flex-wrap gap-3">
          {currentTemplate?.pages.map((page, index) => (
            <button
              key={page.id}
              type="button"
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                page.id === activePageId
                  ? 'border-ink-900 bg-ink-900 text-white'
                  : 'border-fog-200 text-ink-700'
              }`}
              onClick={() => setActivePageId(page.id)}
            >
              {t('settings.quoteTemplatePage')} {index + 1}
            </button>
          ))}
        </div>
      </Card>
      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold text-ink-900">{t('settings.quoteTemplateFields')}</h3>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={addPage}>
              {t('settings.quoteTemplateAddPage')}
            </Button>
            <Button type="button" variant="secondary" onClick={() => imageInputRef.current?.click()}>
              {t('settings.quoteTemplateAddImage')}
            </Button>
          </div>
          <div className="space-y-4">
            {placeholderGroups.map((group) => (
              <div key={group.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase text-ink-400">
                    {t(`settings.quoteTemplateGroup.${group.key}`)}
                  </p>
                  <button
                    type="button"
                    className="text-xs text-ink-500"
                    onClick={() =>
                      setGroupOpen((prev) => ({ ...prev, [group.key]: !prev[group.key] }))
                    }
                  >
                    {groupOpen[group.key] ? t('common.collapse') : t('common.expand')}
                  </button>
                </div>
                {groupOpen[group.key] ? (
                  <div className="space-y-2">
                    {group.items.map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        draggable
                        onDragStart={(event) => {
                          event.dataTransfer.setData(
                            'text/plain',
                            JSON.stringify({ type: 'field', field: item.key })
                          );
                        }}
                        className="w-full rounded-lg border border-fog-200 px-3 py-2 text-left text-xs text-ink-800 hover:border-ink-400"
                        onClick={() => addElement({ type: 'field', field: item.key })}
                      >
                        <span className="font-semibold">{item.key}</span>
                        <span className="ml-2 text-ink-500">{item.sample}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
          <div className="border-t border-fog-200 pt-4">
            <Button
              type="button"
              variant="secondary"
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('text/plain', JSON.stringify({ type: 'text' }));
              }}
              onClick={() => addElement({ type: 'text', text: '' })}
            >
              {t('settings.quoteTemplateAddText')}
            </Button>
          </div>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => handleImagePick(event.target.files?.[0])}
          />
        </Card>
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink-900">{t('settings.quoteTemplateCanvas')}</h3>
            <span className="text-xs text-ink-500">
              {LETTER_PAGE.width}x{LETTER_PAGE.height}px
            </span>
          </div>
          <div className="flex justify-center overflow-auto rounded-2xl border border-fog-200 bg-fog-50 p-4">
            <div
              ref={canvasRef}
              className="relative bg-white shadow-[0_12px_30px_rgba(15,23,42,0.12)]"
              style={{
                width: LETTER_PAGE.width,
                height: LETTER_PAGE.height,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left'
              }}
              onClick={() => setSelectedElementId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                const payload = event.dataTransfer.getData('text/plain');
                if (!payload) return;
                try {
                  const rect = canvasRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const scale = zoom;
                  const dropX = (event.clientX - rect.left) / scale;
                  const dropY = (event.clientY - rect.top) / scale;
                  const data = JSON.parse(payload) as { type: QuoteTemplateElement['type']; field?: string };
                  addElement({ type: data.type, field: data.field, x: dropX, y: dropY });
                } catch (error) {
                  return;
                }
              }}
            >
              {activePage?.elements.map((element) => {
                const isSelected = element.id === selectedElementId;
                if (element.type === 'image') {
                  return (
                    <div
                      key={element.id}
                      className={`absolute cursor-move select-none rounded border ${
                        isSelected ? 'border-ink-900' : 'border-transparent'
                      }`}
                      style={{
                        left: element.x,
                        top: element.y,
                        width: element.width ?? 160,
                        height: element.height ?? 90
                      }}
                      onClick={(event) => {
                        event.stopPropagation();
                        setSelectedElementId(element.id);
                      }}
                      onPointerDown={(event) => startDrag(event, element)}
                    >
                      <img
                        src={element.src}
                        alt={t('settings.quoteTemplateImageAlt')}
                        className="h-full w-full object-contain"
                      />
                      {isSelected ? (
                        <span
                          className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-sm border border-ink-900 bg-white"
                          onPointerDown={(event) => startResize(event, element)}
                        />
                      ) : null}
                    </div>
                  );
                }
                  return (
                    <div
                      key={element.id}
                      className={`absolute cursor-move select-none rounded border px-1 py-0.5 text-xs ${
                        isSelected ? 'border-ink-900 bg-ink-900/5' : 'border-transparent'
                      }`}
                    style={{
                      left: element.x,
                      top: element.y,
                      fontSize: element.fontSize ?? DEFAULT_FONT_SIZE,
                      fontWeight: element.bold ? 700 : 400,
                      width: element.width,
                      height: element.height,
                      textAlign: element.align ?? 'left'
                    }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedElementId(element.id);
                    }}
                    onPointerDown={(event) => startDrag(event, element)}
                  >
                    {element.type === 'text' ? (
                      <div
                        className="prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{
                          __html: element.html || element.text || t('settings.quoteTemplateText')
                        }}
                      />
                    ) : (
                      placeholderSamples[element.field ?? ''] ?? element.field
                    )}
                    {isSelected ? (
                      <span
                        className="absolute -bottom-1 -right-1 h-3 w-3 cursor-nwse-resize rounded-sm border border-ink-900 bg-white"
                        onPointerDown={(event) => startResize(event, element)}
                      />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
        <Card className="space-y-4">
          <h3 className="text-sm font-semibold text-ink-900">{t('settings.quoteTemplateInspector')}</h3>
          {selectedElement ? (
            <div className="space-y-3">
              <Select
                label={t('settings.quoteTemplateElementType')}
                value={selectedElement.type}
                onChange={(event) =>
                  updateElement(selectedElement.id, { type: event.target.value as QuoteTemplateElement['type'] })
                }
              >
                <option value="text">{t('settings.quoteTemplateElementText')}</option>
                <option value="field">{t('settings.quoteTemplateElementField')}</option>
                <option value="image">{t('settings.quoteTemplateElementImage')}</option>
              </Select>
              {selectedElement.type === 'text' ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-ink-400">{t('settings.quoteTemplateRichText')}</p>
                  <ReactQuill
                    value={selectedElement.html ?? selectedElement.text ?? ''}
                    onChange={(value) => updateElement(selectedElement.id, { html: value })}
                    modules={quillModules}
                    formats={quillFormats}
                  />
                </div>
              ) : null}
              {selectedElement.type === 'field' ? (
                <Select
                  label={t('settings.quoteTemplateField')}
                  value={selectedElement.field ?? ''}
                  onChange={(event) => updateElement(selectedElement.id, { field: event.target.value })}
                >
                  {Object.keys(placeholderLabels).map((key) => (
                    <option key={key} value={key}>
                      {key}
                    </option>
                  ))}
                </Select>
              ) : null}
              {selectedElement.type === 'image' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-ink-800">{t('settings.quoteTemplateImage')}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => replaceImage(selectedElement.id, event.target.files?.[0])}
                  />
                </div>
              ) : null}
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label={t('settings.quoteTemplateFontSize')}
                  type="number"
                  min={8}
                  max={32}
                  value={selectedElement.fontSize ?? DEFAULT_FONT_SIZE}
                  onChange={(event) => updateElement(selectedElement.id, { fontSize: Number(event.target.value) })}
                  disabled={selectedElement.type === 'image'}
                />
                <Select
                  label={t('settings.quoteTemplateAlign')}
                  value={selectedElement.align ?? 'left'}
                  onChange={(event) =>
                    updateElement(selectedElement.id, { align: event.target.value as 'left' | 'center' | 'right' })
                  }
                  disabled={selectedElement.type === 'image'}
                >
                  <option value="left">{t('settings.quoteTemplateAlignLeft')}</option>
                  <option value="center">{t('settings.quoteTemplateAlignCenter')}</option>
                  <option value="right">{t('settings.quoteTemplateAlignRight')}</option>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="X"
                  type="number"
                  value={Math.round(selectedElement.x)}
                  onChange={(event) => updateElement(selectedElement.id, { x: Number(event.target.value) })}
                />
                <Input
                  label="Y"
                  type="number"
                  value={Math.round(selectedElement.y)}
                  onChange={(event) => updateElement(selectedElement.id, { y: Number(event.target.value) })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label={t('settings.quoteTemplateWidth')}
                  type="number"
                  value={Math.round(selectedElement.width ?? 0)}
                  onChange={(event) =>
                    updateElement(selectedElement.id, { width: Number(event.target.value) || undefined })
                  }
                />
                <Input
                  label={t('settings.quoteTemplateHeight')}
                  type="number"
                  value={Math.round(selectedElement.height ?? 0)}
                  onChange={(event) =>
                    updateElement(selectedElement.id, { height: Number(event.target.value) || undefined })
                  }
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => updateElement(selectedElement.id, { bold: !selectedElement.bold })}
                disabled={selectedElement.type !== 'text'}
              >
                {selectedElement.bold ? t('settings.quoteTemplateUnbold') : t('settings.quoteTemplateBold')}
              </Button>
              <Button type="button" variant="secondary" onClick={() => removeElement(selectedElement.id)}>
                {t('settings.quoteTemplateRemove')}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-ink-500">{t('settings.quoteTemplateSelectElement')}</p>
          )}
          {showPreview && currentTemplate ? (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase text-ink-400">{t('settings.quoteTemplatePreview')}</h4>
              <div className="h-[420px] overflow-hidden rounded-xl border border-fog-200 bg-white">
                <PDFViewer width="100%" height="100%" showToolbar={false}>
                  <Document>
                    {currentTemplate.pages.map((page) => (
                      <Page key={page.id} size="LETTER">
                        {page.elements.map((element) => {
                          if (element.type === 'image') {
                            return (
                              <Image
                                key={element.id}
                                src={element.src ?? ''}
                                style={{
                                  position: 'absolute',
                                  left: element.x,
                                  top: element.y,
                                  width: element.width ?? 160,
                                  height: element.height ?? 90
                                }}
                              />
                            );
                          }
                          return (
                            <Text
                              key={element.id}
                              style={{
                                position: 'absolute',
                                left: element.x,
                                top: element.y,
                                fontSize: element.fontSize ?? DEFAULT_FONT_SIZE,
                                fontWeight: element.bold ? 700 : 400,
                                width: element.width,
                                textAlign: element.align ?? 'left'
                              }}
                            >
                              {element.type === 'text'
                                ? stripHtml(element.html || element.text || t('settings.quoteTemplateText'))
                                : placeholderSamples[element.field ?? ''] ?? element.field}
                            </Text>
                          );
                        })}
                      </Page>
                    ))}
                  </Document>
                </PDFViewer>
              </div>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}

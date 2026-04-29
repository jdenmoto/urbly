import { z } from 'zod';

import { createServiceOrderStatus } from '@/features/services/serviceOrderTransitions';

export const fastCreateServiceOrderSchema = z.object({
  buildingId: z.string().min(1, 'El edificio es obligatorio.'),
  type: z.string().min(1, 'El tipo de servicio es obligatorio.'),
  scheduledStartAt: z.string().min(1, 'La fecha y hora inicial son obligatorias.'),
  estimatedDurationMinutes: z.coerce.number().int().min(15, 'La duración mínima es de 15 minutos.'),
  assignedTechnicianId: z.string().optional().default(''),
});

export type FastCreateServiceOrderValues = z.infer<typeof fastCreateServiceOrderSchema>;

function toIsoDateTime(localDateTime: string) {
  return new Date(localDateTime).toISOString();
}

function addMinutes(isoDateTime: string, minutes: number) {
  return new Date(new Date(isoDateTime).getTime() + minutes * 60_000).toISOString();
}

function toTitleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function buildFastCreateServiceOrderDraft(values: FastCreateServiceOrderValues) {
  const parsed = fastCreateServiceOrderSchema.parse(values);
  const scheduledStartAt = toIsoDateTime(parsed.scheduledStartAt);
  const assignedTechnicianId = parsed.assignedTechnicianId?.trim() ? parsed.assignedTechnicianId.trim() : null;

  return {
    buildingId: parsed.buildingId,
    title: toTitleCase(parsed.type),
    description: '',
    type: parsed.type,
    priority: 'medium' as const,
    status: createServiceOrderStatus({ assignedTechnicianId }),
    scheduledStartAt,
    scheduledEndAt: addMinutes(scheduledStartAt, parsed.estimatedDurationMinutes),
    assignedTechnicianId,
    estimatedDurationMinutes: parsed.estimatedDurationMinutes,
  };
}

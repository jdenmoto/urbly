export type Contract = {
  id: string;
  name: string;
  administrationId: string;
  maintenanceTypeId: string;
  maintenanceTypeName?: string;
  labAnalysisTypeId: string;
  labAnalysisTypeName?: string;
  maintenancePrices: {
    valor_lavado_tanque_agua_potable_sem1: number;
    valor_lavado_tanque_agua_potable_sem2: number;
    valor_lavado_pozos_eyectores_aguas_lluvias: number;
    valor_lavado_pozos_eyectores_aguas_negras: number;
    valor_pruebas_hidraulicas_red_contra_incendios: number;
    valor_limpieza_sistema_drenaje_sotanos: number;
    valor_lavado_tanque_red_contra_incendios: number;
    valor_contrato_mantenimiento: number;
  };
  maintenanceApplies?: {
    valor_lavado_tanque_agua_potable_sem1: boolean;
    valor_lavado_tanque_agua_potable_sem2: boolean;
    valor_lavado_pozos_eyectores_aguas_lluvias: boolean;
    valor_lavado_pozos_eyectores_aguas_negras: boolean;
    valor_pruebas_hidraulicas_red_contra_incendios: boolean;
    valor_limpieza_sistema_drenaje_sotanos: boolean;
    valor_lavado_tanque_red_contra_incendios: boolean;
    valor_contrato_mantenimiento: boolean;
  };
  maintenanceRecommendedDates?: {
    fecha_rec_agua_potable_1?: string;
    fecha_rec_agua_potable_2?: string;
    fecha_rec_pozo_aguas_lluvias?: string;
    fecha_rec_pozo_aguas_negras?: string;
    fecha_rec_tanque_rci?: string;
    fecha_rec_pruebas_rci?: string;
  };
  labAnalysisPrice: number;
  startAt: string;
  endAt: string;
  status: 'activo' | 'inactivo';
  createdAt?: string;
};

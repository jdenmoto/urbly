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
    valor_pruebas_hidraulias_red_contra_incendios: number;
    valor_limpieza_sistema_drenaje_sotanos: number;
    valor_lavado_tanque_red_contra_incendios: number;
    valor_contrato_mantenimiento: number;
  };
  labAnalysisPrice: number;
  startAt: string;
  endAt: string;
  status: 'activo' | 'inactivo';
  createdAt?: string;
};

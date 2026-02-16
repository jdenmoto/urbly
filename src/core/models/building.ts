export type Building = {
  id: string;
  name: string;
  group: string;
  type: 'EDIFICIO' | 'CONJUNTO_RESIDENCIAL' | 'UNIDAD';
  delegateName: string;
  delegatePhone: string;
  nit: string;
  email: string;
  billingEmail: string;
  porterPhone: string;
  managementCompanyId: string;
  contractId?: string;
  addressText: string;
  location: { lat: number; lng: number };
  googlePlaceId: string;
  active?: boolean;
  createdAt?: string;
};

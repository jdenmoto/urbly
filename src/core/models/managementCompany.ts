export type ManagementCompany = {
  id: string;
  name: string;
  contactPhone: string;
  email: string;
  billingEmail: string;
  legalRepresentative: string;
  group: string;
  type: 'EDIFICIO' | 'CONJUNTO_RESIDENCIAL' | 'UNIDAD';
  delegateName: string;
  delegatePhone: string;
  nit: string;
  address: string;
  createdAt?: string;
};

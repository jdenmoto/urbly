export type Building = {
  id: string;
  name: string;
  porterPhone: string;
  managementCompanyId: string;
  addressText: string;
  location: { lat: number; lng: number };
  googlePlaceId: string;
  createdAt?: string;
};

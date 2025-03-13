
export interface DeliveryCompanyField {
  name: string;
  selectors: string[];
  description?: string;
}

export interface DeliveryCompany {
  id: string;
  name: string;
  logoUrl?: string;
  websiteUrl: string;
  color?: string;
  loginRequired: boolean;
  loginUrl?: string;
  formUrl?: string;
  fields: DeliveryCompanyField[];
  isActive: boolean;
  lastUsed?: Date;
  usageCount: number;
  autofillScript?: string;
  isCustomScript: boolean;
  notes?: string;
}

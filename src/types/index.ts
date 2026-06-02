export interface Filament {
  id: string;
  brand: string;
  colorName: string;
  colorHex?: string;
  material: string;
  initialWeightG: number;
  currentWeightG: number;
  purchaseCost: number;
  tempPrintStart?: number;
  tempPrintEnd?: number;
  tempBedStart?: number;
  tempBedEnd?: number;
  createdAt: string;
}

export interface Printer {
  id: string;
  name: string;
  model: string;
  depreciationCostPerHour: number;
  energyConsumptionKwPerHour: number;
  createdAt: string;
}

export interface Client {
  id: string;
  fullName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  billingAddress?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  imageUrl?: string;
  estimatedPrintTimeMinutes: number;
  estimatedConsumptionG: number;
  successRate: number;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string; // Ex: ORC-001
  clientId: string;
  projectId: string;
  printerId: string;
  filamentIds: string[]; // Up to 4 filaments
  status: 'Pendente' | 'Imprimindo' | 'Concluído' | 'Falha' | 'Cancelado';
  calculatedCost: number; // total cost
  machineCost: number;
  filamentCost: number;
  shippingCost: number;
  finalPrice: number; // calculated cost + margin
  marginPercentage: number;
  estimatedDeliveryDate?: string;
  createdAt: string;
}

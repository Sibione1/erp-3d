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

export interface OrderItem {
  id: string;
  type: '3D_PROJECT' | 'CUSTOM';
  name: string; // Ex: Nome do Projeto ou "Taxa de Modelagem"
  projectId?: string;
  filamentIds?: string[];
  status: 'Pendente' | 'Imprimindo' | 'Concluído' | 'Falha';
  wastedGrams: number;
  wastedCost: number;
  price: number;
  cost: number;
}

export interface Order {
  id: string;
  orderNumber: string; // Ex: ORC-001 ou PED-001
  clientId: string;
  isQuote: boolean; // True = Orçamento, False = Pedido
  items: OrderItem[];
  status: 'Pendente' | 'Em Andamento' | 'Concluído' | 'Cancelado';
  paymentStatus: 'Pendente' | 'Pago';
  paymentMethod?: 'PIX' | 'Cartão' | 'Dinheiro' | 'Transferência';
  calculatedCost: number; // total cost
  machineCost: number;
  filamentCost: number;
  shippingCost: number;
  finalPrice: number; // calculated cost + margin
  marginPercentage: number;
  estimatedDeliveryDate?: string;
  createdAt: string;
}


export type Site = 'Abidjan' | 'Bouaké' | 'Global';
export type Period = 'Jour' | 'Semaine' | 'Mois' | 'Année' | 'Personnalisé';

export interface DashboardData {
  period: string;
  turnover: number;
  interventions: number;
  profit: number;
}

export interface Intervention {
  id: string;
  client: string;
  description: string;
  technician: string;
  status: 'En cours' | 'Terminé' | 'En attente';
  date: string;
  site: Site | string; // string allowed for specific backend values
}

export interface StockItem {
  id: string;
  name: string;
  description?: string; // Nouveau champ
  category: string;
  quantity: number;
  threshold: number;
  unitPrice: number;
  supplier: string;
  site: Site | string;
  imageUrls?: string[]; // Changé de imageUrl?: string à imageUrls?: string[]
  technicalSheetUrl?: string; // Nouveau champ
  specs?: Record<string, string>;
}

export interface Transaction {
  id: string;
  type: 'Recette' | 'Dépense';
  category: string;
  amount: number;
  date: string;
  description: string;
  site: Site | string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  site: Site | string;
  status: 'Actif' | 'Congés';
  entryDate: string;
}

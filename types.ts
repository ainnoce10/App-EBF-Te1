
export type Site = 'Abidjan' | 'Bouaké' | 'Global';
export type Period = 'Jour' | 'Semaine' | 'Mois' | 'Année' | 'Personnalisé';

export interface TickerMessage {
  id?: string;
  content: string;
  color: 'green' | 'yellow' | 'red' | 'neutral';
}

export interface DashboardData {
  period: string;
  turnover: number;
  interventions: number;
  profit: number;
}

export interface Intervention {
  id: string;
  client: string;
  clientPhone?: string; // Nouveau
  domain?: 'Électricité' | 'Bâtiment' | 'Froid'; // Nouveau
  interventionType?: 'Dépannage' | 'Expertise' | 'Installation' | 'Tuyauterie' | 'Appareillage' | 'Fillerie' | 'Entretien' | 'Désinstallation'; // Nouveau
  description: string;
  technician: string;
  status: 'En cours' | 'Terminé' | 'En attente';
  date: string;
  site: Site | string;
}

export interface StockItem {
  id: string;
  name: string;
  description?: string;
  category: string;
  quantity: number;
  threshold: number;
  unitPrice: number;
  supplier: string;
  site: Site | string;
  imageUrls?: string[];
  technicalSheetUrl?: string;
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

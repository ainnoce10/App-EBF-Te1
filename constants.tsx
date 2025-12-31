
import { LayoutDashboard, Wrench, Wallet, CalendarDays, ShoppingCart, Settings, MonitorPlay } from 'lucide-react';
import { DashboardData, Intervention, StockItem, Transaction, Employee, TickerMessage } from './types';

// EBF Brand Colors references
export const COLORS = {
  primary: '#f97316', // Orange-500
  secondary: '#16a34a', // Green-600
  neutral: '#ffffff', // White
  text: '#1f2937', // Gray-800
};

export const MOCK_DASHBOARD_DATA: DashboardData[] = [
  { period: 'Lundi', turnover: 120000, interventions: 5, profit: 45000 },
  { period: 'Mardi', turnover: 150000, interventions: 8, profit: 60000 },
  { period: 'Mercredi', turnover: 90000, interventions: 4, profit: 30000 },
  { period: 'Jeudi', turnover: 200000, interventions: 12, profit: 90000 },
  { period: 'Vendredi', turnover: 180000, interventions: 10, profit: 75000 },
  { period: 'Samedi', turnover: 110000, interventions: 6, profit: 40000 },
  { period: 'Dimanche', turnover: 50000, interventions: 2, profit: 15000 },
];

export const MOCK_INTERVENTIONS: Intervention[] = [
  { id: 'INT-001', client: 'Société Ivoire', description: 'Maintenance clim', technician: 'Kouassi Jean', status: 'En cours', date: '2023-10-25', site: 'Abidjan' },
  { id: 'INT-002', client: 'M. Diallo', description: 'Installation électrique', technician: 'Koné Moussa', status: 'Terminé', date: '2023-10-24', site: 'Bouaké' },
  { id: 'INT-003', client: 'Résidence Palmeraie', description: 'Plomberie SDB', technician: 'Traoré Ali', status: 'En attente', date: '2023-10-26', site: 'Abidjan' },
];

export const MOCK_STOCK: StockItem[] = [
  { 
    id: 'STK-001', 
    name: 'Câble R2V 3G2.5mm² - Bobine 100m', 
    category: 'Électricité', 
    quantity: 500, 
    threshold: 100, 
    unitPrice: 25000, 
    supplier: 'ElecPro', 
    site: 'Abidjan',
    imageUrls: [
      'https://images.unsplash.com/photo-1555617778-02518510b9fa?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1558402529-d2638a7023e9?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&q=80&w=1200'
    ],
    specs: {
      'Type': 'R2V',
      'Section': '3G2.5 mm²',
      'Longueur': '100m',
      'Usage': 'Industriel & Domestique',
      'Norme': 'NF C 32-321'
    }
  },
  { 
    id: 'STK-002', 
    name: 'Disjoncteur 16A Phase+Neutre - Qualité Pro', 
    category: 'Électricité', 
    quantity: 15, 
    threshold: 20, 
    unitPrice: 3500, 
    supplier: 'ElecPro', 
    site: 'Bouaké',
    imageUrls: [
      'https://images.unsplash.com/photo-1558402529-d2638a7023e9?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1555617778-02518510b9fa?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=1200'
    ],
    specs: {
      'Calibre': '16A',
      'Courbe': 'C',
      'Tension': '230V',
      'Modules': '1'
    }
  },
  { 
    id: 'STK-003', 
    name: 'Tuyau PVC Pression Ø32 Haute Qualité', 
    category: 'Plomberie', 
    quantity: 80, 
    threshold: 30, 
    unitPrice: 1500, 
    supplier: 'PlombService', 
    site: 'Abidjan',
    imageUrls: [
      'https://images.unsplash.com/photo-1605615792224-2c7bb1cb27f4?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1541535881962-3bb380b08458?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200'
    ],
    specs: {
      'Diamètre': '32mm',
      'Pression': 'PN16',
      'Longueur': '4m',
      'Matériau': 'PVC-U'
    }
  },
  { 
    id: 'STK-004', 
    name: 'Perceuse à Percussion 750W Professionnelle', 
    category: 'Outillage', 
    quantity: 5, 
    threshold: 2, 
    unitPrice: 45000, 
    supplier: 'BricoTotal', 
    site: 'Abidjan',
    imageUrls: [
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1530124560676-5f7bc47f271b?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?auto=format&fit=crop&q=80&w=1200'
    ],
    specs: {
      'Puissance': '750W',
      'Vitesse': '3000 tr/min',
      'Poids': '2.1kg',
      'Garantie': '2 ans'
    }
  }
];

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'TRX-001', type: 'Recette', category: 'Prestation', amount: 150000, date: '2023-10-25', description: 'Facture #F2023-88', site: 'Abidjan' },
  { id: 'TRX-002', type: 'Dépense', category: 'Achat Matériel', amount: 45000, date: '2023-10-25', description: 'Achat câbles', site: 'Bouaké' },
  { id: 'TRX-003', type: 'Recette', category: 'Acompte', amount: 75000, date: '2023-10-24', description: 'Avance chantier M. Koffi', site: 'Abidjan' },
];

export const MOCK_EMPLOYEES: Employee[] = [
  { id: 'EMP-001', name: 'Kouassi Jean', role: 'Technicien Senior', site: 'Abidjan', status: 'Actif', entryDate: '2019-03-15' },
  { id: 'EMP-002', name: 'Koné Moussa', role: 'Technicien Junior', site: 'Bouaké', status: 'Actif', entryDate: '2022-08-01' },
  { id: 'EMP-003', name: 'Aicha Touré', role: 'Secrétaire', site: 'Abidjan', status: 'Congés', entryDate: '2021-01-10' },
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Tableau de Bord', icon: <LayoutDashboard size={20} /> },
  { id: 'technicians', label: 'Techniciens', icon: <Wrench size={20} /> },
  { id: 'accounting', label: 'Comptabilité & RH', icon: <Wallet size={20} /> },
  { id: 'secretariat', label: 'Secrétariat', icon: <CalendarDays size={20} /> },
  { id: 'hardware', label: 'Quincaillerie', icon: <ShoppingCart size={20} /> },
  { id: 'showcase', label: 'Diffusion TV', icon: <MonitorPlay size={20} /> },
  { id: 'settings', label: 'Paramètres', icon: <Settings size={20} /> },
];

export const TICKER_MESSAGES: TickerMessage[] = [
  { content: "Bienvenue chez EBF - Votre partenaire technique de confiance.", color: "neutral" },
  { content: "Promotion du mois : -15% sur tout l'outillage portatif !", color: "green" },
  { content: "Nouveau arrivage : Câbles R2V haute résistance en stock.", color: "green" },
  { content: "EBF Abidjan & Bouaké : Ouvert du Lundi au Samedi de 08h à 18h.", color: "neutral" },
];

export const Logo = () => (
  <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter select-none">
     <div className="relative w-10 h-10 bg-orange-500 rounded-tr-lg rounded-bl-lg flex items-center justify-center shadow-md">
        <span className="text-white text-xs font-black">EBF</span>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-600 rounded-full border-2 border-white"></div>
     </div>
     <div>
       <span className="text-orange-600 font-black">E</span>
       <span className="text-green-600 font-black">B</span>
       <span className="text-gray-700 font-black">F</span>
     </div>
  </div>
);

import React, { useState, useEffect } from 'react';
import { StockItem } from '../types';
import { supabase } from '../lib/supabase';
import { 
  Plus,
  Settings2,
  Search,
  X
} from 'lucide-react';

interface HardwareStoreProps {
  initialData?: StockItem[];
}

const HardwareStore: React.FC<HardwareStoreProps> = ({ initialData = [] }) => {
  const [inventory, setInventory] = useState<StockItem[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  
  // States for Add/Edit Modal
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState<StockItem | null>(null);
  
  // Filter States
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [siteFilter, setSiteFilter] = useState('All');
  
  const [isManagementMode, setIsManagementMode] = useState(false);

  // Sync with prop updates from App.tsx (Supabase Realtime)
  useEffect(() => {
    if (initialData.length > 0) setInventory(initialData);
  }, [initialData]);

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesSite = siteFilter === 'All' || item.site === siteFilter;
    return matchesSearch && matchesCategory && matchesSite;
  });

  const handleEditClick = (item: StockItem) => {
    const imageUrls = [...(item.imageUrls || [])];
    while (imageUrls.length < 4) imageUrls.push('');
    setEditForm({ ...item, imageUrls });
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleAddNew = () => {
    setEditForm({
        id: '', 
        name: '', 
        category: 'Divers', 
        quantity: 0, 
        threshold: 5, 
        unitPrice: 0, 
        supplier: '', 
        site: 'Abidjan', 
        imageUrls: ['', '', '', '']
    } as StockItem);
    setIsAdding(true);
    setIsEditing(false);
  }

  const handleSave = async () => {
    if (editForm) {
      const cleanedUrls = (editForm.imageUrls || []).filter(url => url.trim() !== '');
      const finalForm = { ...editForm, imageUrls: cleanedUrls };
      
      if (isAdding) {
         // eslint-disable-next-line @typescript-eslint/no-unused-vars
         const { id, ...dataToInsert } = finalForm;
         // Optimistic update would go here or wait for realtime
         await supabase.from('stock').insert([dataToInsert]);
      } else {
         await supabase.from('stock').update(finalForm).eq('id', finalForm.id);
      }
      
      setIsEditing(false);
      setIsAdding(false);
      setEditForm(null);
    }
  };

  return (
    <div className="space-y-6 select-none pb-20 relative">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tighter">QUINCAILLERIE EBF</h2>
          <p className="text-gray-500 font-medium text-lg">Données synchronisées en temps réel</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setIsManagementMode(!isManagementMode)}
             className={`px-6 py-4 rounded-2xl flex items-center gap-3 transition-all font-black uppercase text-xs tracking-widest shadow-xl border-b-4 active:scale-95 ${isManagementMode ? 'bg-blue-600 text-white border-blue-800' : 'bg-white text-gray-700 border-gray-200'}`}
           >
             <Settings2 size={20} /> {isManagementMode ? 'Quitter Gestion' : 'Gérer le Stock'}
           </button>
           <button onClick={handleAddNew} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 shadow-xl border-b-4 border-orange-700 active:scale-95"><Plus size={20} /> Nouvel Article</button>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Rechercher un produit..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-700"
            />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
            <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-600 outline-none focus:ring-2 focus:ring-orange-500"
            >
                <option value="All">Toutes Catégories</option>
                <option value="Électricité">Électricité</option>
                <option value="Plomberie">Plomberie</option>
                <option value="Outillage">Outillage</option>
                <option value="Divers">Divers</option>
            </select>
            <select 
                value={siteFilter} 
                onChange={(e) => setSiteFilter(e.target.value)}
                className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-600 outline-none focus:ring-2 focus:ring-orange-500"
            >
                <option value="All">Tous Sites</option>
                <option value="Abidjan">Abidjan</option>
                <option value="Bouaké">Bouaké</option>
            </select>
        </div>
      </div>

      {/* Grid des articles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all group flex flex-col cursor-pointer">
             <div className="p-4 flex-1 flex flex-col">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{item.category}</p>
                <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-2">{item.name}</h3>
                <div className="mt-auto">
                   <p className="text-xl font-black">{item.unitPrice.toLocaleString()} F</p>
                   {isManagementMode && (
                       <button 
                          onClick={() => handleEditClick(item)}
                          className="w-full mt-4 bg-orange-500 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest"
                       >
                         Modifier
                       </button>
                   )}
                </div>
             </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {(isAdding || isEditing) && editForm && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
            <div className="bg-white p-12 rounded-[3rem] w-full max-w-xl max-h-[90vh] overflow-y-auto">
               <div className="flex justify-between items-center mb-8">
                   <h3 className="text-3xl font-black">{isAdding ? 'Ajouter' : 'Modifier'} Article</h3>
                   <button onClick={() => { setIsAdding(false); setIsEditing(false); }} className="p-4 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors"><X /></button>
               </div>
               
               <div className="space-y-4">
                   <div>
                       <label className="block text-sm font-bold text-gray-500 mb-2">Nom</label>
                       <input 
                         type="text" 
                         value={editForm.name} 
                         onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                         className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border border-gray-200 focus:border-orange-500"
                       />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="block text-sm font-bold text-gray-500 mb-2">Prix (FCFA)</label>
                           <input 
                             type="number" 
                             value={editForm.unitPrice} 
                             onChange={(e) => setEditForm({...editForm, unitPrice: parseInt(e.target.value) || 0})}
                             className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border border-gray-200 focus:border-orange-500"
                           />
                       </div>
                       <div>
                           <label className="block text-sm font-bold text-gray-500 mb-2">Quantité</label>
                           <input 
                             type="number" 
                             value={editForm.quantity} 
                             onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value) || 0})}
                             className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border border-gray-200 focus:border-orange-500"
                           />
                       </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="block text-sm font-bold text-gray-500 mb-2">Catégorie</label>
                           <select 
                             value={editForm.category} 
                             onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                             className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border border-gray-200 focus:border-orange-500 appearance-none"
                           >
                                <option value="Divers">Divers</option>
                                <option value="Électricité">Électricité</option>
                                <option value="Plomberie">Plomberie</option>
                                <option value="Outillage">Outillage</option>
                           </select>
                       </div>
                       <div>
                           <label className="block text-sm font-bold text-gray-500 mb-2">Site</label>
                           <select 
                             value={editForm.site} 
                             onChange={(e) => setEditForm({...editForm, site: e.target.value})}
                             className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border border-gray-200 focus:border-orange-500 appearance-none"
                           >
                                <option value="Abidjan">Abidjan</option>
                                <option value="Bouaké">Bouaké</option>
                           </select>
                       </div>
                   </div>
               </div>

               <button onClick={handleSave} className="w-full bg-orange-500 text-white p-6 rounded-3xl font-black text-xl mt-8 hover:bg-orange-600 transition-colors shadow-xl border-b-4 border-orange-700 active:scale-95">
                   Sauvegarder
               </button>
            </div>
         </div>
      )}
    </div>
  );
};

export default HardwareStore;
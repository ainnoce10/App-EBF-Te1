import React, { useState, useEffect } from 'react';
import { StockItem } from '../types';
import { supabase } from '../lib/supabase';
import { 
  Plus,
  Settings2,
  Search,
  X,
  Image as ImageIcon,
  FileText,
  Upload
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
        description: '',
        category: 'Divers', 
        quantity: 0, 
        threshold: 5, 
        unitPrice: 0, 
        supplier: '', 
        site: 'Abidjan', 
        imageUrls: ['', '', '', ''],
        technicalSheetUrl: '',
        specs: {}
    } as StockItem);
    setIsAdding(true);
    setIsEditing(false);
  }

  const handleImageChange = (index: number, value: string) => {
    if (!editForm) return;
    const newImages = [...(editForm.imageUrls || [])];
    newImages[index] = value;
    setEditForm({ ...editForm, imageUrls: newImages });
  };

  const handleSave = async () => {
    if (editForm) {
      const cleanedUrls = (editForm.imageUrls || []).filter(url => url.trim() !== '');
      const finalForm = { ...editForm, imageUrls: cleanedUrls };
      
      // Génération ID si manquant pour le insert
      if (isAdding && !finalForm.id) {
         finalForm.id = `STK-${Math.floor(Math.random() * 100000)}`;
      }

      if (isAdding) {
         // eslint-disable-next-line @typescript-eslint/no-unused-vars
         const { ...dataToInsert } = finalForm;
         const { error } = await supabase.from('stock').insert([dataToInsert]);
         if (error) {
             console.error("Erreur insert", error);
             alert("Erreur lors de l'ajout");
         }
      } else {
         const { error } = await supabase.from('stock').update(finalForm).eq('id', finalForm.id);
         if (error) {
             console.error("Erreur update", error);
             alert("Erreur lors de la modification");
         }
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
          <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all group flex flex-col cursor-pointer relative">
             {item.imageUrls && item.imageUrls[0] && (
                 <div className="h-40 w-full overflow-hidden bg-gray-50 p-4">
                     <img src={item.imageUrls[0]} alt={item.name} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500" />
                 </div>
             )}
             <div className="p-4 flex-1 flex flex-col">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">{item.category}</p>
                <h3 className="text-sm font-bold text-gray-800 line-clamp-2 mb-2">{item.name}</h3>
                <div className="mt-auto">
                   <p className="text-xl font-black text-orange-600">{item.unitPrice.toLocaleString()} F</p>
                   {isManagementMode && (
                       <button 
                          onClick={() => handleEditClick(item)}
                          className="w-full mt-4 bg-gray-900 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-orange-500 transition-colors"
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
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
            <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
               {/* Modal Header */}
               <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                   <div>
                       <h3 className="text-2xl font-black text-gray-800">{isAdding ? 'Ajouter' : 'Modifier'} Article</h3>
                       <p className="text-gray-500 text-sm">Remplissez les détails du produit</p>
                   </div>
                   <button onClick={() => { setIsAdding(false); setIsEditing(false); }} className="p-3 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm"><X size={20}/></button>
               </div>
               
               {/* Modal Body (Scrollable) */}
               <div className="p-8 overflow-y-auto space-y-8">
                   
                   {/* SECTION 1: INFOS PRINCIPALES */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="md:col-span-2">
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nom du produit</label>
                           <input 
                             type="text" 
                             value={editForm.name} 
                             onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                             placeholder="Ex: Perceuse à percussion"
                             className="w-full p-4 bg-gray-50 rounded-xl font-bold outline-none border-2 border-transparent focus:border-orange-500 focus:bg-white transition-all"
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Catégorie</label>
                           <select 
                             value={editForm.category} 
                             onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                             className="w-full p-4 bg-gray-50 rounded-xl font-bold outline-none border-2 border-transparent focus:border-orange-500 focus:bg-white transition-all appearance-none"
                           >
                                <option value="Divers">Divers</option>
                                <option value="Électricité">Électricité</option>
                                <option value="Plomberie">Plomberie</option>
                                <option value="Outillage">Outillage</option>
                           </select>
                       </div>
                   </div>

                   {/* SECTION 2: DESCRIPTION */}
                   <div>
                       <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Description Détaillée</label>
                       <textarea 
                         rows={3}
                         value={editForm.description || ''} 
                         onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                         placeholder="Caractéristiques, usage, détails techniques..."
                         className="w-full p-4 bg-gray-50 rounded-xl font-medium text-gray-600 outline-none border-2 border-transparent focus:border-orange-500 focus:bg-white transition-all resize-none"
                       />
                   </div>

                   {/* SECTION 3: PRIX & STOCK */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       <div className="col-span-2">
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Prix Unitaire (FCFA)</label>
                           <input 
                             type="number" 
                             value={editForm.unitPrice} 
                             onChange={(e) => setEditForm({...editForm, unitPrice: parseInt(e.target.value) || 0})}
                             className="w-full p-4 bg-gray-50 rounded-xl font-black text-xl text-orange-600 outline-none border-2 border-transparent focus:border-orange-500 focus:bg-white transition-all"
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Quantité</label>
                           <input 
                             type="number" 
                             value={editForm.quantity} 
                             onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value) || 0})}
                             className="w-full p-4 bg-gray-50 rounded-xl font-bold outline-none border-2 border-transparent focus:border-orange-500 focus:bg-white transition-all"
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Seuil Alerte</label>
                           <input 
                             type="number" 
                             value={editForm.threshold} 
                             onChange={(e) => setEditForm({...editForm, threshold: parseInt(e.target.value) || 0})}
                             className="w-full p-4 bg-gray-50 rounded-xl font-bold outline-none border-2 border-transparent focus:border-orange-500 focus:bg-white transition-all text-red-500"
                           />
                       </div>
                   </div>

                   {/* SECTION 4: LOCALISATION & FOURNISSEUR */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                       <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Fournisseur</label>
                           <input 
                             type="text" 
                             value={editForm.supplier || ''} 
                             onChange={(e) => setEditForm({...editForm, supplier: e.target.value})}
                             placeholder="Ex: ElecPro"
                             className="w-full p-3 bg-white rounded-lg font-bold outline-none border border-gray-200 focus:border-orange-500 transition-all"
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Site de Stockage</label>
                           <select 
                             value={editForm.site} 
                             onChange={(e) => setEditForm({...editForm, site: e.target.value})}
                             className="w-full p-3 bg-white rounded-lg font-bold outline-none border border-gray-200 focus:border-orange-500 transition-all appearance-none"
                           >
                                <option value="Abidjan">📍 Abidjan</option>
                                <option value="Bouaké">📍 Bouaké</option>
                           </select>
                       </div>
                   </div>

                   {/* SECTION 5: MEDIA (IMAGES & FICHE TECHNIQUE) */}
                   <div>
                       <h4 className="text-sm font-black text-gray-800 mb-4 flex items-center gap-2">
                           <ImageIcon size={18} className="text-orange-500"/> Images & Documents
                       </h4>
                       
                       {/* Images Grid */}
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                           {[0, 1, 2, 3].map((idx) => (
                               <div key={idx} className="relative group">
                                   <div className={`h-24 w-full rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-gray-50 ${editForm.imageUrls?.[idx] ? 'border-green-400 bg-white' : 'border-gray-300'}`}>
                                       {editForm.imageUrls?.[idx] ? (
                                           <img src={editForm.imageUrls[idx]} alt="Preview" className="w-full h-full object-cover" />
                                       ) : (
                                           <span className="text-xs text-gray-400 font-bold">Image {idx + 1}</span>
                                       )}
                                   </div>
                                   <input 
                                     type="text" 
                                     placeholder="URL de l'image..."
                                     value={editForm.imageUrls?.[idx] || ''}
                                     onChange={(e) => handleImageChange(idx, e.target.value)}
                                     className="w-full mt-2 text-[10px] p-2 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-orange-500"
                                   />
                               </div>
                           ))}
                       </div>

                       {/* Fiche Technique */}
                       <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                           <div className="bg-white p-3 rounded-lg text-blue-600 shadow-sm">
                               <FileText size={24} />
                           </div>
                           <div className="flex-1">
                               <label className="block text-xs font-black text-blue-800 uppercase tracking-widest mb-1">Fiche Technique (PDF)</label>
                               <input 
                                 type="text"
                                 placeholder="Coller le lien du document PDF ici..."
                                 value={editForm.technicalSheetUrl || ''}
                                 onChange={(e) => setEditForm({...editForm, technicalSheetUrl: e.target.value})}
                                 className="w-full bg-transparent border-b border-blue-200 text-sm font-medium text-blue-900 placeholder-blue-300 focus:border-blue-500 outline-none py-1"
                               />
                           </div>
                           <button className="text-blue-500 hover:text-blue-700">
                               <Upload size={20} />
                           </button>
                       </div>
                   </div>

               </div>

               {/* Modal Footer */}
               <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-4">
                   <button 
                     onClick={() => { setIsAdding(false); setIsEditing(false); }}
                     className="px-6 py-3 font-bold text-gray-500 hover:text-gray-700 transition-colors"
                   >
                       Annuler
                   </button>
                   <button 
                     onClick={handleSave} 
                     className="px-8 py-3 bg-orange-600 text-white rounded-xl font-black shadow-lg hover:bg-orange-700 transition-all transform active:scale-95 flex items-center gap-2"
                   >
                       <Settings2 size={18} />
                       {isAdding ? 'AJOUTER AU STOCK' : 'ENREGISTRER'}
                   </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default HardwareStore;
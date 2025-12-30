
import React, { useState, useEffect, useRef } from 'react';
import { StockItem } from '../types';
import { supabase } from '../lib/supabase';
import { 
  Plus,
  Settings2,
  Search,
  X,
  Image as ImageIcon,
  ShoppingCart,
  Maximize2,
  Edit,
  Camera,
  Trash2,
  Package
} from 'lucide-react';

interface HardwareStoreProps {
  initialData?: StockItem[];
}

const HardwareStore: React.FC<HardwareStoreProps> = ({ initialData = [] }) => {
  const [inventory, setInventory] = useState<StockItem[]>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState<StockItem | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [isManagementMode, setIsManagementMode] = useState(false);

  // Refs pour les inputs de fichiers cachés
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    if (initialData.length > 0) setInventory(initialData);
  }, [initialData]);

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEditClick = (e: React.MouseEvent, item: StockItem) => {
    e.stopPropagation();
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

  const handleFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editForm) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const newImages = [...(editForm.imageUrls || [])];
        newImages[index] = base64String;
        setEditForm({ ...editForm, imageUrls: newImages });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    if (editForm) {
      const newImages = [...(editForm.imageUrls || [])];
      newImages[index] = '';
      setEditForm({ ...editForm, imageUrls: newImages });
    }
  };

  const handleAddToCart = (item: StockItem) => {
    alert(`🛒 ${item.name} ajouté au panier !`);
  };

  const handleSave = async () => {
    if (editForm) {
      const cleanedUrls = (editForm.imageUrls || []).filter(url => url && url.length > 100); 
      const finalForm = { ...editForm, imageUrls: cleanedUrls };
      
      let itemId = finalForm.id;
      if (isAdding && !itemId) {
         itemId = `STK-${Math.floor(Math.random() * 100000)}`;
         finalForm.id = itemId;
      }

      try {
          if (isAdding) {
              const { error } = await supabase.from('stock').insert([finalForm]);
              if (error) throw error;
          } else {
              const { error } = await supabase.from('stock').update(finalForm).eq('id', itemId);
              if (error) throw error;
          }

          setIsEditing(false);
          setIsAdding(false);
          setEditForm(null);
      } catch (error) {
          alert("Erreur lors de l'enregistrement : " + (error as any).message);
      }
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 select-none pb-24 relative">
      {/* Header Mobile Stacked */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter uppercase">Quincaillerie EBF</h2>
          <p className="text-gray-500 font-bold text-sm md:text-lg">Catalogue numérique & Stock</p>
        </div>
        <div className="w-full md:w-auto flex gap-3">
           <button 
             onClick={() => setIsManagementMode(!isManagementMode)}
             className={`flex-1 md:flex-none justify-center px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl flex items-center gap-2 transition-all font-black uppercase text-[10px] md:text-xs tracking-widest shadow-md border-b-4 active:scale-95 ${isManagementMode ? 'bg-blue-600 text-white border-blue-800' : 'bg-white text-gray-700 border-gray-200'}`}
           >
             <Settings2 size={16} /> {isManagementMode ? 'Stop' : 'Gérer'}
           </button>
           <button onClick={handleAddNew} className="flex-1 md:flex-none justify-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl flex items-center gap-2 shadow-md border-b-4 border-orange-700 active:scale-95 font-black uppercase text-[10px] md:text-xs tracking-widest"><Plus size={16} /> Nouveau</button>
        </div>
      </div>

      {/* Barre de recherche Stacked on Mobile */}
      <div className="bg-white p-3 md:p-4 rounded-2xl md:rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-3 md:gap-4 items-center">
        <div className="flex-1 relative w-full">
            <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Rechercher référence..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 md:pl-16 pr-4 py-3 md:py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-xl md:rounded-2xl focus:outline-none font-bold text-gray-700 text-sm md:text-lg transition-all"
            />
        </div>
        <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-auto px-4 md:px-6 py-3 md:py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-xl md:rounded-2xl font-black text-gray-600 outline-none cursor-pointer uppercase text-xs tracking-widest"
        >
            <option value="All">Toutes Catégories</option>
            <option value="Électricité">Électricité</option>
            <option value="Plomberie">Plomberie</option>
            <option value="Outillage">Outillage</option>
            <option value="Divers">Divers</option>
        </select>
      </div>

      {/* Liste des articles - 1 Col on Mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-8">
        {filteredItems.map((item) => {
          const mainImage = item.imageUrls?.find(url => url && url.length > 50);

          return (
            <div key={item.id} className="bg-white rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 overflow-hidden hover:shadow-xl transition-all group flex flex-col relative animate-fade-in border-b-4 md:border-b-8 border-b-transparent hover:border-b-orange-500">
               
               {isManagementMode && (
                   <button 
                      onClick={(e) => handleEditClick(e, item)}
                      className="absolute top-3 right-3 z-20 p-2.5 bg-white/90 backdrop-blur rounded-full shadow-lg text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all active:scale-90"
                   >
                       <Edit size={18} />
                   </button>
               )}

               <div 
                  className="w-full aspect-[4/3] sm:aspect-square overflow-hidden bg-gray-50 flex items-center justify-center relative border-b border-gray-50"
                  onClick={() => mainImage && setSelectedImage(mainImage)}
               >
                   {mainImage ? (
                       <img 
                          src={mainImage} 
                          alt={item.name} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                       />
                   ) : (
                       <div className="flex flex-col items-center justify-center text-gray-300 gap-1">
                           <ImageIcon size={40} strokeWidth={1.5}/>
                           <span className="text-[9px] font-black uppercase tracking-widest">No Image</span>
                       </div>
                   )}
               </div>

               <div className="p-4 md:p-6 flex-1 flex flex-col">
                  <div className="mb-2">
                    <span className="text-[9px] md:text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] bg-orange-50 px-2 py-1 rounded-md">{item.category}</span>
                  </div>
                  <h3 className="text-base md:text-lg font-black text-gray-900 line-clamp-2 mb-3 leading-tight min-h-[2.5rem]">{item.name}</h3>
                  
                  <div className="mt-auto pt-3 border-t border-gray-50">
                     <div className="flex items-end justify-between mb-4">
                        <div>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Prix Unitaire</p>
                          <p className="text-2xl md:text-3xl font-black text-gray-950 tracking-tighter">{item.unitPrice.toLocaleString()}<span className="text-xs md:text-sm ml-1 text-gray-400 font-bold">F</span></p>
                        </div>
                        {item.quantity < item.threshold && (
                          <div className="px-2 py-1 bg-red-100 text-red-600 text-[8px] md:text-[9px] font-black rounded uppercase animate-pulse border border-red-200">Critique</div>
                        )}
                     </div>
                     
                     <button 
                        onClick={() => handleAddToCart(item)}
                        className="w-full bg-gray-950 text-white py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 border-b-4 border-gray-800 hover:border-orange-800"
                     >
                       <ShoppingCart size={16} strokeWidth={3} />
                       Ajouter
                     </button>
                  </div>
               </div>
            </div>
          );
        })}
      </div>

      {/* LIGHTBOX */}
      {selectedImage && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setSelectedImage(null)}
        >
            <button className="absolute top-4 right-4 md:top-10 md:right-10 text-white/50 hover:text-white bg-white/10 p-3 rounded-full">
                <X size={24} />
            </button>
            <img 
                src={selectedImage} 
                alt="Zoom" 
                className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
      )}

      {/* MODAL AJOUT/MODIFICATION MOBILE OPTIMIZED */}
      {(isAdding || isEditing) && editForm && (
         <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full h-[90vh] md:h-auto md:max-h-[90vh] md:max-w-4xl rounded-t-[2.5rem] md:rounded-[3.5rem] flex flex-col shadow-2xl overflow-hidden animate-slide-up">
               
               {/* Header Modal */}
               <div className="px-6 py-6 md:px-12 md:py-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 sticky top-0 z-10 backdrop-blur">
                   <div>
                       <h3 className="text-xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none">{isAdding ? 'Ajout Produit' : 'Modif. Produit'}</h3>
                       <p className="text-gray-400 font-bold text-[10px] md:text-xs uppercase tracking-widest mt-1">Gestion Stock EBF</p>
                   </div>
                   <button onClick={() => { setIsAdding(false); setIsEditing(false); }} className="p-3 bg-white rounded-full text-gray-400 hover:text-red-500 shadow-sm border border-gray-100 active:scale-90"><X size={24}/></button>
               </div>
               
               {/* Body Modal Scrollable */}
               <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-8 md:space-y-10 bg-white custom-scrollbar">
                   {/* INFOS */}
                   <div className="space-y-6">
                       <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nom du produit</label>
                           <input 
                             type="text" 
                             value={editForm.name} 
                             onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                             placeholder="Ex: Disjoncteur 20A"
                             className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-lg outline-none border-2 border-transparent focus:border-orange-500 transition-all"
                           />
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Catégorie</label>
                               <select 
                                 value={editForm.category} 
                                 onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                                 className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-500 appearance-none"
                               >
                                    <option value="Divers">📦 Divers</option>
                                    <option value="Électricité">⚡ Élec</option>
                                    <option value="Plomberie">💧 Plomb</option>
                                    <option value="Outillage">🛠️ Outil</option>
                               </select>
                           </div>
                            <div className="space-y-2">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prix (FCFA)</label>
                               <input 
                                 type="number" 
                                 value={editForm.unitPrice} 
                                 onChange={(e) => setEditForm({...editForm, unitPrice: parseInt(e.target.value) || 0})}
                                 className="w-full p-4 bg-orange-50 text-orange-600 rounded-2xl font-black text-lg outline-none focus:ring-2 focus:ring-orange-500"
                               />
                           </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock</label>
                               <input 
                                 type="number" 
                                 value={editForm.quantity} 
                                 onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value) || 0})}
                                 className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xl text-center outline-none focus:ring-2 focus:ring-gray-300"
                               />
                           </div>
                           <div className="space-y-2">
                               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alerte</label>
                               <input 
                                 type="number" 
                                 value={editForm.threshold} 
                                 onChange={(e) => setEditForm({...editForm, threshold: parseInt(e.target.value) || 0})}
                                 className="w-full p-4 bg-red-50 text-red-500 rounded-2xl font-black text-xl text-center outline-none focus:ring-2 focus:ring-red-200"
                               />
                           </div>
                       </div>
                   </div>

                   {/* IMAGES */}
                   <div>
                       <h4 className="text-xs font-black text-gray-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                           <Camera size={16} className="text-orange-500"/> Photos
                       </h4>
                       <div className="grid grid-cols-4 gap-2 md:gap-4">
                           {[0, 1, 2, 3].map((idx) => (
                               <div key={idx} className="aspect-square relative group">
                                   <input type="file" ref={fileInputRefs[idx]} onChange={(e) => handleFileChange(idx, e)} accept="image/*" className="hidden"/>
                                   <div 
                                      onClick={() => fileInputRefs[idx].current?.click()}
                                      className={`w-full h-full rounded-xl md:rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer relative overflow-hidden
                                        ${editForm.imageUrls?.[idx] ? 'border-green-400' : 'border-gray-300 bg-gray-50'}`}
                                   >
                                       {editForm.imageUrls?.[idx] ? (
                                           <img src={editForm.imageUrls[idx]} className="w-full h-full object-cover" />
                                       ) : (
                                           <Plus size={20} className="text-gray-300"/>
                                       )}
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               </div>

               {/* Footer Sticky */}
               <div className="p-6 md:p-10 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
                   <button 
                     onClick={() => { setIsAdding(false); setIsEditing(false); }}
                     className="flex-1 py-4 font-black text-gray-400 bg-gray-100 rounded-2xl hover:bg-gray-200 uppercase text-xs tracking-widest"
                   >
                       Annuler
                   </button>
                   <button 
                     onClick={handleSave} 
                     className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-black shadow-lg flex items-center justify-center gap-2 text-sm uppercase tracking-widest active:scale-95"
                   >
                       <Package size={18} />
                       Enregistrer
                   </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default HardwareStore;

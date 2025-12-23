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
  Trash2
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
      const cleanedUrls = (editForm.imageUrls || []).filter(url => url && url.length > 100); // Filtre pour ne garder que les vraies images base64/url
      const finalForm = { ...editForm, imageUrls: cleanedUrls };
      
      if (isAdding && !finalForm.id) {
         finalForm.id = `STK-${Math.floor(Math.random() * 100000)}`;
      }

      const { error } = isAdding 
        ? await supabase.from('stock').insert([finalForm])
        : await supabase.from('stock').update(finalForm).eq('id', finalForm.id);

      if (error) {
        alert("Erreur lors de l'enregistrement : " + error.message);
      } else {
        setIsEditing(false);
        setIsAdding(false);
        setEditForm(null);
      }
    }
  };

  return (
    <div className="space-y-6 select-none pb-20 relative">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Quincaillerie EBF</h2>
          <p className="text-gray-500 font-bold text-lg">Catalogue numérique et gestion de stock</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setIsManagementMode(!isManagementMode)}
             className={`px-6 py-4 rounded-2xl flex items-center gap-3 transition-all font-black uppercase text-xs tracking-widest shadow-xl border-b-4 active:scale-95 ${isManagementMode ? 'bg-blue-600 text-white border-blue-800' : 'bg-white text-gray-700 border-gray-200'}`}
           >
             <Settings2 size={20} /> {isManagementMode ? 'Quitter Gestion' : 'Gérer le Stock'}
           </button>
           <button onClick={handleAddNew} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 shadow-xl border-b-4 border-orange-700 active:scale-95 font-black uppercase text-xs tracking-widest"><Plus size={20} /> Nouvel Article</button>
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
            <input 
                type="text" 
                placeholder="Rechercher un produit ou une référence..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-16 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl focus:outline-none font-bold text-gray-700 text-lg transition-all"
            />
        </div>
        <select 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl font-black text-gray-600 outline-none appearance-none cursor-pointer uppercase text-xs tracking-widest"
        >
            <option value="All">Toutes Catégories</option>
            <option value="Électricité">Électricité</option>
            <option value="Plomberie">Plomberie</option>
            <option value="Outillage">Outillage</option>
            <option value="Divers">Divers</option>
        </select>
      </div>

      {/* Liste des articles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
        {filteredItems.map((item) => {
          const mainImage = item.imageUrls?.find(url => url && url.length > 50);

          return (
            <div key={item.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden hover:shadow-2xl transition-all group flex flex-col relative animate-fade-in border-b-8 border-b-transparent hover:border-b-orange-500">
               
               {isManagementMode && (
                   <button 
                      onClick={(e) => handleEditClick(e, item)}
                      className="absolute top-4 right-4 z-20 p-3 bg-white/90 backdrop-blur rounded-full shadow-lg text-gray-700 hover:text-orange-600 hover:bg-orange-50 transition-all active:scale-90"
                   >
                       <Edit size={20} />
                   </button>
               )}

               {/* ZONE IMAGE - Format Carré Imposé (Aspect Square) */}
               <div 
                  className="w-full aspect-square overflow-hidden bg-white flex items-center justify-center relative cursor-zoom-in border-b border-gray-50 group-hover:bg-gray-50 transition-colors"
                  onClick={() => mainImage && setSelectedImage(mainImage)}
               >
                   {mainImage ? (
                       <img 
                          src={mainImage} 
                          alt={item.name} 
                          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700" 
                       />
                   ) : (
                       <div className="flex flex-col items-center justify-center text-gray-300 gap-2">
                           <ImageIcon size={64} strokeWidth={1}/>
                           <span className="text-[10px] font-black uppercase tracking-widest">Aucune image</span>
                       </div>
                   )}
                   {mainImage && (
                       <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none">
                           <div className="bg-white/80 p-3 rounded-full backdrop-blur-md shadow-lg">
                               <Maximize2 size={24} className="text-gray-800"/>
                           </div>
                       </div>
                   )}
               </div>

               <div className="p-6 flex-1 flex flex-col">
                  <div className="mb-2">
                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] bg-orange-50 px-3 py-1 rounded-full">{item.category}</span>
                  </div>
                  <h3 className="text-lg font-black text-gray-900 line-clamp-2 mb-4 leading-tight min-h-[3rem]">{item.name}</h3>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50">
                     <div className="flex items-end justify-between mb-6">
                        <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Prix Unitaire</p>
                          <p className="text-3xl font-black text-gray-950 tracking-tighter">{item.unitPrice.toLocaleString()}<span className="text-sm ml-1 text-gray-400 font-bold">F</span></p>
                        </div>
                        {item.quantity < item.threshold && (
                          <div className="px-2 py-1 bg-red-100 text-red-600 text-[9px] font-black rounded uppercase animate-pulse border border-red-200">Alerte Stock</div>
                        )}
                     </div>
                     
                     <button 
                        onClick={() => handleAddToCart(item)}
                        className="w-full bg-gray-950 text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-orange-600 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 border-b-4 border-gray-800 hover:border-orange-800"
                     >
                       <ShoppingCart size={18} strokeWidth={3} />
                       Ajouter au Panier
                     </button>
                  </div>
               </div>
            </div>
          );
        })}
      </div>

      {/* LIGHTBOX (Zoom Image) */}
      {selectedImage && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-8 animate-fade-in cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
        >
            <button className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors bg-white/10 p-5 rounded-full">
                <X size={40} />
            </button>
            <img 
                src={selectedImage} 
                alt="Zoom" 
                className="max-w-full max-h-[85vh] object-contain rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
      )}

      {/* MODAL AJOUT/MODIFICATION */}
      {(isAdding || isEditing) && editForm && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xl animate-fade-in">
            <div className="bg-white rounded-[3.5rem] w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border-[12px] border-gray-50">
               
               <div className="px-12 py-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                   <div>
                       <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">{isAdding ? 'Ajouter au Catalogue' : 'Modifier l\'Article'}</h3>
                       <p className="text-gray-500 font-black text-xs uppercase tracking-widest mt-2">Quincaillerie EBF - Gestion de Stock Directe</p>
                   </div>
                   <button onClick={() => { setIsAdding(false); setIsEditing(false); }} className="p-5 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-md active:scale-90"><X size={32}/></button>
               </div>
               
               <div className="p-12 overflow-y-auto space-y-12 scrollbar-hide">
                   {/* INFOS PRODUIT */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="md:col-span-2">
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Désignation complète</label>
                           <input 
                             type="text" 
                             value={editForm.name} 
                             onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                             placeholder="Ex: Disjoncteur 20A bipolaire"
                             className="w-full p-6 bg-gray-50 rounded-3xl font-black text-2xl outline-none border-4 border-transparent focus:border-orange-500 focus:bg-white transition-all shadow-inner"
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Catégorie</label>
                           <select 
                             value={editForm.category} 
                             onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                             className="w-full p-6 bg-gray-50 rounded-3xl font-black text-lg outline-none border-4 border-transparent focus:border-orange-500 focus:bg-white transition-all appearance-none cursor-pointer"
                           >
                                <option value="Divers">📦 Divers</option>
                                <option value="Électricité">⚡ Électricité</option>
                                <option value="Plomberie">💧 Plomberie</option>
                                <option value="Outillage">🛠️ Outillage</option>
                           </select>
                       </div>
                   </div>

                   {/* PRIX ET QUANTITÉ */}
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                       <div className="lg:col-span-1">
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Prix de vente (FCFA)</label>
                           <input 
                             type="number" 
                             value={editForm.unitPrice} 
                             onChange={(e) => setEditForm({...editForm, unitPrice: parseInt(e.target.value) || 0})}
                             className="w-full p-6 bg-orange-50 rounded-3xl font-black text-4xl text-orange-600 outline-none border-4 border-transparent focus:border-orange-500 focus:bg-white transition-all shadow-inner"
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Quantité en Stock</label>
                           <input 
                             type="number" 
                             value={editForm.quantity} 
                             onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value) || 0})}
                             className="w-full p-6 bg-gray-50 rounded-3xl font-black text-4xl outline-none border-4 border-transparent focus:border-orange-500 focus:bg-white transition-all shadow-inner text-center"
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Seuil d'Alerte</label>
                           <input 
                             type="number" 
                             value={editForm.threshold} 
                             onChange={(e) => setEditForm({...editForm, threshold: parseInt(e.target.value) || 0})}
                             className="w-full p-6 bg-red-50 rounded-3xl font-black text-4xl outline-none border-4 border-transparent focus:border-red-500 focus:bg-white transition-all shadow-inner text-center text-red-500"
                           />
                       </div>
                   </div>

                   {/* GALERIE D'IMAGES - IMPORT PAR CLIC */}
                   <div>
                       <div className="flex justify-between items-center mb-6">
                           <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-3">
                               <Camera size={24} className="text-orange-500"/> Galerie Photos (Import par clic)
                           </h4>
                           <span className="text-[10px] font-black text-gray-400 italic">4 Emplacements Disponibles</span>
                       </div>
                       
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                           {[0, 1, 2, 3].map((idx) => (
                               <div key={idx} className="relative group aspect-square">
                                   <input 
                                     type="file" 
                                     ref={fileInputRefs[idx]}
                                     onChange={(e) => handleFileChange(idx, e)}
                                     accept="image/*"
                                     className="hidden"
                                   />
                                   <div 
                                      onClick={() => fileInputRefs[idx].current?.click()}
                                      className={`w-full h-full rounded-[2.5rem] border-4 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer relative
                                        ${editForm.imageUrls?.[idx] ? 'border-green-400 bg-white' : 'border-gray-200 bg-gray-50 hover:border-orange-400 hover:bg-orange-50 shadow-inner'}`}
                                   >
                                       {editForm.imageUrls?.[idx] ? (
                                           <>
                                              <img src={editForm.imageUrls[idx]} alt="Preview" className="w-full h-full object-cover" />
                                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                  <Edit size={40} className="text-white" />
                                              </div>
                                           </>
                                       ) : (
                                           <div className="flex flex-col items-center gap-3 text-gray-300 group-hover:text-orange-400 transition-colors">
                                               <Plus size={48} />
                                               <span className="text-[11px] font-black uppercase tracking-widest">Image {idx + 1}</span>
                                           </div>
                                       )}
                                   </div>
                                   {editForm.imageUrls?.[idx] && (
                                       <button 
                                          onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                          className="absolute -top-3 -right-3 p-3 bg-red-500 text-white rounded-full shadow-xl hover:bg-red-600 transition-all scale-0 group-hover:scale-100"
                                       >
                                           <Trash2 size={18} />
                                       </button>
                                   )}
                               </div>
                           ))}
                       </div>
                   </div>
               </div>

               {/* FOOTER */}
               <div className="p-12 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-end gap-6">
                   <button 
                     onClick={() => { setIsAdding(false); setIsEditing(false); }}
                     className="px-12 py-5 font-black text-gray-400 hover:text-gray-900 transition-all uppercase tracking-[0.2em] text-xs"
                   >
                       Annuler
                   </button>
                   <button 
                     onClick={handleSave} 
                     className="px-16 py-6 bg-gray-950 text-white rounded-3xl font-black shadow-2xl hover:bg-orange-600 transition-all transform active:scale-95 flex items-center justify-center gap-4 text-lg border-b-8 border-gray-800 hover:border-orange-800 uppercase tracking-widest"
                   >
                       <Settings2 size={24} />
                       {isAdding ? 'Confirmer l\'Ajout' : 'Enregistrer les Changements'}
                   </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default HardwareStore;
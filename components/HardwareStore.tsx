import React, { useState, useEffect, useRef } from 'react';
import { StockItem } from '../types';
import { supabase } from '../lib/supabase';
import { 
  Plus,
  Settings2,
  Search,
  X,
  Image as ImageIcon,
  FileText,
  Upload,
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
  
  // States for Add/Edit Modal
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState<StockItem | null>(null);
  
  // State for Image Zoom (Lightbox)
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Filter States
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [siteFilter, setSiteFilter] = useState('All');
  
  const [isManagementMode, setIsManagementMode] = useState(false);

  // Refs for hidden file inputs
  const fileInputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    if (initialData.length > 0) setInventory(initialData);
  }, [initialData]);

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesSite = siteFilter === 'All' || item.site === siteFilter;
    return matchesSearch && matchesCategory && matchesSite;
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

  // Convert File to Base64
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
      const cleanedUrls = (editForm.imageUrls || []).filter(url => url.trim() !== '');
      const finalForm = { ...editForm, imageUrls: cleanedUrls };
      
      if (isAdding && !finalForm.id) {
         finalForm.id = `STK-${Math.floor(Math.random() * 100000)}`;
      }

      if (isAdding) {
         const { error } = await supabase.from('stock').insert([finalForm]);
         if (error) alert("Erreur lors de l'ajout : " + error.message);
      } else {
         const { error } = await supabase.from('stock').update(finalForm).eq('id', finalForm.id);
         if (error) alert("Erreur lors de la modification : " + error.message);
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
          <p className="text-gray-500 font-medium text-lg">Gérez vos articles et votre stock en direct</p>
        </div>
        <div className="flex gap-4">
           <button 
             onClick={() => setIsManagementMode(!isManagementMode)}
             className={`px-6 py-4 rounded-2xl flex items-center gap-3 transition-all font-black uppercase text-xs tracking-widest shadow-xl border-b-4 active:scale-95 ${isManagementMode ? 'bg-blue-600 text-white border-blue-800' : 'bg-white text-gray-700 border-gray-200'}`}
           >
             <Settings2 size={20} /> {isManagementMode ? 'Mode Client' : 'Gérer le Stock'}
           </button>
           <button onClick={handleAddNew} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 shadow-xl border-b-4 border-orange-700 active:scale-95"><Plus size={20} /> Nouvel Article</button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Chercher une référence, un outil..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-gray-700"
            />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
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
        </div>
      </div>

      {/* Grid des articles */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredItems.map((item) => {
          const displayImage = item.imageUrls?.find(url => url && url.length > 20);

          return (
            <div key={item.id} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden hover:shadow-2xl transition-all group flex flex-col relative animate-fade-in border-b-4 border-b-transparent hover:border-b-orange-500">
               
               {isManagementMode && (
                   <button 
                      onClick={(e) => handleEditClick(e, item)}
                      className="absolute top-3 right-3 z-20 p-2.5 bg-white/90 backdrop-blur rounded-full shadow-lg text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-all active:scale-90"
                      title="Modifier l'article"
                   >
                       <Edit size={18} />
                   </button>
               )}

               <div 
                  className="h-52 w-full overflow-hidden bg-gray-50 flex items-center justify-center relative cursor-zoom-in group-hover:bg-gray-100 transition-colors"
                  onClick={() => displayImage && setSelectedImage(displayImage)}
               >
                   {displayImage ? (
                       <img 
                          src={displayImage} 
                          alt={item.name} 
                          className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-700" 
                       />
                   ) : (
                       <div className="flex flex-col items-center justify-center text-gray-300 gap-2">
                           <ImageIcon size={48} strokeWidth={1}/>
                           <span className="text-[10px] font-black uppercase tracking-widest">Pas d'image</span>
                       </div>
                   )}
                   {displayImage && (
                       <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                           <Maximize2 size={16} className="text-gray-600"/>
                       </div>
                   )}
               </div>

               <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-2 py-0.5 rounded-md">{item.category}</p>
                    <p className="text-[9px] font-bold text-gray-400">REF: {item.id.split('-').pop()}</p>
                  </div>
                  <h3 className="text-sm font-black text-gray-800 line-clamp-2 mb-4 leading-tight min-h-[2.5rem]">{item.name}</h3>
                  
                  <div className="mt-auto space-y-4">
                     <div className="flex items-end justify-between">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mb-0.5">Prix Unitaire</p>
                          <p className="text-2xl font-black text-gray-900 tracking-tighter">{item.unitPrice.toLocaleString()}<span className="text-xs ml-1 text-gray-500">F</span></p>
                        </div>
                        {item.quantity < item.threshold && (
                          <span className="px-2 py-1 bg-red-100 text-red-600 text-[9px] font-black rounded uppercase animate-pulse">Stock Faible</span>
                        )}
                     </div>
                     
                     <button 
                        onClick={() => handleAddToCart(item)}
                        className="w-full bg-gray-900 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-orange-600 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 border-b-4 border-gray-950 hover:border-orange-800"
                     >
                       <ShoppingCart size={14} strokeWidth={3} />
                       Ajouter au Panier
                     </button>
                  </div>
               </div>
            </div>
          );
        })}
      </div>

      {/* --- LIGHTBOX (ZOOM IMAGE) --- */}
      {selectedImage && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in cursor-zoom-out"
            onClick={() => setSelectedImage(null)}
        >
            <button className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors bg-white/10 p-4 rounded-full">
                <X size={32} />
            </button>
            <img 
                src={selectedImage} 
                alt="Zoom" 
                className="max-w-full max-h-[85vh] object-contain rounded-3xl shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {(isAdding || isEditing) && editForm && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xl animate-fade-in">
            <div className="bg-white rounded-[3rem] w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col shadow-2xl border-8 border-gray-50/50">
               
               <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                   <div>
                       <h3 className="text-3xl font-black text-gray-800 tracking-tighter">{isAdding ? 'NOUVEL ARTICLE' : 'MODIFICATION ARTICLE'}</h3>
                       <p className="text-gray-500 font-bold">Quincaillerie EBF - Gestion de Stock</p>
                   </div>
                   <button onClick={() => { setIsAdding(false); setIsEditing(false); }} className="p-4 bg-white rounded-full hover:bg-red-50 hover:text-red-500 transition-all shadow-md active:scale-90"><X size={24}/></button>
               </div>
               
               <div className="p-10 overflow-y-auto space-y-10 scrollbar-hide">
                   
                   {/* INFOS PRODUIT */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                       <div className="md:col-span-2">
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Nom de l'article</label>
                           <input 
                             type="text" 
                             value={editForm.name} 
                             onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                             placeholder="Ex: Câble R2V 3G1.5mm..."
                             className="w-full p-5 bg-gray-50 rounded-[1.5rem] font-bold text-xl outline-none border-4 border-transparent focus:border-orange-500 focus:bg-white transition-all shadow-inner"
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Rayon / Catégorie</label>
                           <select 
                             value={editForm.category} 
                             onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                             className="w-full p-5 bg-gray-50 rounded-[1.5rem] font-bold text-lg outline-none border-4 border-transparent focus:border-orange-500 focus:bg-white transition-all appearance-none cursor-pointer"
                           >
                                <option value="Divers">📦 Divers</option>
                                <option value="Électricité">⚡ Électricité</option>
                                <option value="Plomberie">💧 Plomberie</option>
                                <option value="Outillage">🛠️ Outillage</option>
                           </select>
                       </div>
                   </div>

                   {/* DESCRIPTION */}
                   <div>
                       <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Fiche Description</label>
                       <textarea 
                         rows={3}
                         value={editForm.description || ''} 
                         onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                         placeholder="Décrivez les caractéristiques techniques du produit..."
                         className="w-full p-6 bg-gray-50 rounded-[1.5rem] font-medium text-gray-600 outline-none border-4 border-transparent focus:border-orange-500 focus:bg-white transition-all shadow-inner resize-none"
                       />
                   </div>

                   {/* PRIX ET QUANTITÉ */}
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                       <div className="col-span-2">
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Prix de vente (FCFA)</label>
                           <div className="relative">
                             <input 
                               type="number" 
                               value={editForm.unitPrice} 
                               onChange={(e) => setEditForm({...editForm, unitPrice: parseInt(e.target.value) || 0})}
                               className="w-full p-6 bg-orange-50/50 rounded-[1.5rem] font-black text-4xl text-orange-600 outline-none border-4 border-transparent focus:border-orange-500 focus:bg-white transition-all shadow-inner"
                             />
                             <span className="absolute right-6 top-1/2 -translate-y-1/2 text-orange-200 font-black text-2xl">FCFA</span>
                           </div>
                       </div>
                       <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Stock Actuel</label>
                           <input 
                             type="number" 
                             value={editForm.quantity} 
                             onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value) || 0})}
                             className="w-full p-6 bg-gray-50 rounded-[1.5rem] font-black text-3xl outline-none border-4 border-transparent focus:border-orange-500 focus:bg-white transition-all shadow-inner text-center"
                           />
                       </div>
                       <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Seuil d'Alerte</label>
                           <input 
                             type="number" 
                             value={editForm.threshold} 
                             onChange={(e) => setEditForm({...editForm, threshold: parseInt(e.target.value) || 0})}
                             className="w-full p-6 bg-red-50 rounded-[1.5rem] font-black text-3xl outline-none border-4 border-transparent focus:border-red-500 focus:bg-white transition-all shadow-inner text-center text-red-500"
                           />
                       </div>
                   </div>

                   {/* IMAGES IMPORT */}
                   <div>
                       <div className="flex justify-between items-center mb-6">
                           <h4 className="text-sm font-black text-gray-800 uppercase tracking-widest flex items-center gap-3">
                               <Camera size={20} className="text-orange-500"/> Galerie Photos (Max 04)
                           </h4>
                           <span className="text-[10px] font-black text-gray-400 italic">CLIQUEZ SUR UN CADRE POUR IMPORTER</span>
                       </div>
                       
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
                                      className={`w-full h-full rounded-[2rem] border-4 border-dashed transition-all flex flex-col items-center justify-center overflow-hidden cursor-pointer relative
                                        ${editForm.imageUrls?.[idx] ? 'border-green-400 bg-white' : 'border-gray-200 bg-gray-50 hover:border-orange-400 hover:bg-orange-50'}`}
                                   >
                                       {editForm.imageUrls?.[idx] ? (
                                           <>
                                              <img src={editForm.imageUrls[idx]} alt="Preview" className="w-full h-full object-cover" />
                                              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                  <Edit size={32} className="text-white" />
                                              </div>
                                           </>
                                       ) : (
                                           <div className="flex flex-col items-center gap-2 text-gray-300 group-hover:text-orange-400 transition-colors">
                                               <Plus size={40} />
                                               <span className="text-[10px] font-black">IMAGE {idx + 1}</span>
                                           </div>
                                       )}
                                   </div>
                                   {editForm.imageUrls?.[idx] && (
                                       <button 
                                          onClick={(e) => { e.stopPropagation(); removeImage(idx); }}
                                          className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 transition-all scale-0 group-hover:scale-100"
                                       >
                                           <Trash2 size={14} />
                                       </button>
                                   )}
                               </div>
                           ))}
                       </div>
                   </div>

                   {/* FICHE TECHNIQUE */}
                   <div className="p-8 bg-blue-50 rounded-[2rem] border-4 border-blue-100 flex flex-col md:flex-row items-center gap-8">
                       <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center text-blue-600 shadow-xl shrink-0">
                           <FileText size={40} />
                       </div>
                       <div className="flex-1 w-full">
                           <label className="block text-xs font-black text-blue-800 uppercase tracking-widest mb-2">Lien Fiche Technique (PDF / Manuel)</label>
                           <input 
                             type="text"
                             placeholder="Ex: https://ebf-ivoire.com/fiches/perceuse.pdf"
                             value={editForm.technicalSheetUrl || ''}
                             onChange={(e) => setEditForm({...editForm, technicalSheetUrl: e.target.value})}
                             className="w-full bg-white p-4 rounded-xl border-2 border-transparent focus:border-blue-500 outline-none font-bold text-blue-900 placeholder-blue-200 shadow-sm"
                           />
                       </div>
                       <div className="shrink-0 flex gap-2">
                           <button className="p-4 bg-white text-blue-600 rounded-xl shadow-md hover:bg-blue-600 hover:text-white transition-all active:scale-90">
                               <Upload size={24} />
                           </button>
                       </div>
                   </div>

               </div>

               {/* FOOTER */}
               <div className="p-10 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row justify-end gap-6">
                   <button 
                     onClick={() => { setIsAdding(false); setIsEditing(false); }}
                     className="px-10 py-5 font-black text-gray-400 hover:text-gray-800 transition-all uppercase tracking-widest text-sm"
                   >
                       Annuler
                   </button>
                   <button 
                     onClick={handleSave} 
                     className="px-16 py-5 bg-orange-600 text-white rounded-[1.5rem] font-black shadow-[0_15px_30px_rgba(249,115,22,0.3)] hover:bg-orange-700 transition-all transform active:scale-95 flex items-center justify-center gap-4 text-lg border-b-8 border-orange-800"
                   >
                       <Settings2 size={24} />
                       {isAdding ? 'AJOUTER AU STOCK' : 'VALIDER LES MODIFICATIONS'}
                   </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default HardwareStore;
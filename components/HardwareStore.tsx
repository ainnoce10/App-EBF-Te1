import React, { useState, useRef, useEffect } from 'react';
import { MOCK_STOCK } from '../constants';
import { StockItem } from '../types';
import ShowcaseMode from './ShowcaseMode';
import { 
  Box, 
  Search, 
  SlidersHorizontal, 
  X, 
  FileText, 
  ShoppingCart,
  Save,
  Edit3,
  ImageIcon,
  BarChart,
  ZoomIn,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Move,
  Plus,
  Settings2,
  Check,
  MonitorPlay
} from 'lucide-react';

const HardwareStore: React.FC = () => {
  const [inventory, setInventory] = useState(MOCK_STOCK);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editForm, setEditForm] = useState<StockItem | null>(null);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [siteFilter, setSiteFilter] = useState('All');
  
  // Nouveau state pour le mode TV
  const [showShowcase, setShowShowcase] = useState(false);
  
  // Nouveau state pour le mode gestion
  const [isManagementMode, setIsManagementMode] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [showCartSuccess, setShowCartSuccess] = useState(false);

  // Galerie et Zoom States
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [zoomedImageUrl, setZoomedImageUrl] = useState<string | null>(null);
  
  // États de l'interaction Zoom
  const [zoomScale, setZoomScale] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const filteredItems = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
    const matchesSite = siteFilter === 'All' || item.site === siteFilter;
    return matchesSearch && matchesCategory && matchesSite;
  });

  // --- Logique Interactive du Zoom ---
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    const newScale = Math.min(Math.max(zoomScale + delta, 1), 5);
    setZoomScale(newScale);
    if (newScale === 1) setPanPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1) return;
    setPanPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetZoom = () => {
    setZoomScale(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedItem?.imageUrls) {
      const nextIdx = (activeImageIndex + 1) % selectedItem.imageUrls.length;
      setActiveImageIndex(nextIdx);
      setZoomedImageUrl(selectedItem.imageUrls[nextIdx]);
      resetZoom();
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedItem?.imageUrls) {
      const prevIdx = (activeImageIndex - 1 + selectedItem.imageUrls.length) % selectedItem.imageUrls.length;
      setActiveImageIndex(prevIdx);
      setZoomedImageUrl(selectedItem.imageUrls[prevIdx]);
      resetZoom();
    }
  };

  // --- Handlers Articles ---
  const handleEditClick = (item: StockItem) => {
    setSelectedItem(item);
    const imageUrls = [...(item.imageUrls || [])];
    while (imageUrls.length < 4) imageUrls.push('');
    setEditForm({ ...item, imageUrls });
    setIsEditing(true);
    setIsAdding(false);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCartCount(prev => prev + 1);
    setShowCartSuccess(true);
    setTimeout(() => setShowCartSuccess(false), 2000);
  };

  const handleAddNew = () => {
    const newItem: StockItem = {
      id: `STK-${Math.floor(Math.random() * 9000) + 1000}`,
      name: '',
      category: 'Divers',
      quantity: 0,
      threshold: 5,
      unitPrice: 0,
      supplier: '',
      site: 'Abidjan',
      imageUrls: ['', '', '', ''],
      specs: {}
    };
    setEditForm(newItem);
    setSelectedItem(newItem);
    setIsEditing(true);
    setIsAdding(true);
  };

  const handleSave = () => {
    if (editForm) {
      const cleanedUrls = (editForm.imageUrls || []).filter(url => url.trim() !== '');
      const finalForm = { ...editForm, imageUrls: cleanedUrls };
      if (isAdding) setInventory([finalForm, ...inventory]);
      else setInventory(inventory.map(i => i.id === finalForm.id ? finalForm : i));
      setSelectedItem(finalForm);
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-6 select-none pb-20 relative">
      {/* MODE VITRINE TV */}
      {showShowcase && <ShowcaseMode onClose={() => setShowShowcase(false)} />}

      {/* Toast Succès Panier */}
      {showCartSuccess && (
        <div className="fixed top-24 right-8 z-[110] bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-slide-up">
          <Check size={24} />
          <span className="font-black text-sm uppercase tracking-widest">Article ajouté au panier !</span>
        </div>
      )}

      {/* --- OVERLAY ZOOM INTERACTIF --- */}
      {zoomedImageUrl && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center overflow-hidden cursor-zoom-out animate-fade-in"
          onWheel={handleWheel}
          onClick={() => setZoomedImageUrl(null)}
        >
          <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20 pointer-events-none">
             <div className="bg-white/10 backdrop-blur-lg px-4 py-2 rounded-full border border-white/20 text-white text-xs font-black uppercase tracking-widest flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                Inspection : {Math.round(zoomScale * 100)}%
             </div>
             <button className="bg-red-500/20 hover:bg-red-500 p-3 rounded-full text-white transition-all pointer-events-auto border border-red-500/30">
                <X size={28} />
             </button>
          </div>

          <button onClick={prevImage} className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-4 bg-white/5 hover:bg-orange-500 text-white rounded-full transition-all border border-white/10 group pointer-events-auto">
            <ChevronLeft size={48} className="group-hover:scale-110 transition-transform" />
          </button>
          <button onClick={nextImage} className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-4 bg-white/5 hover:bg-orange-500 text-white rounded-full transition-all border border-white/10 group pointer-events-auto">
            <ChevronRight size={48} className="group-hover:scale-110 transition-transform" />
          </button>

          <div 
            className={`transition-transform duration-200 ease-out cursor-${zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in'}`}
            style={{ 
              transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale})`,
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.1, 0, 0.1, 1)'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={zoomedImageUrl} 
              alt="Zoomed" 
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-[0_0_100px_rgba(0,0,0,0.8)] pointer-events-none"
            />
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-xl border border-white/20 px-6 py-3 rounded-full flex items-center gap-6 text-white text-[10px] font-black uppercase tracking-widest">
              <span className="flex items-center gap-2"><Maximize size={14} className="text-orange-500" /> Roulette : Zoom</span>
              <div className="w-px h-4 bg-white/20"></div>
              <span className="flex items-center gap-2"><Move size={14} className="text-blue-500" /> Glisser : Déplacer</span>
          </div>
        </div>
      )}

      {/* --- HEADER --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-3xl font-black text-gray-800 tracking-tighter">QUINCAILLERIE EBF</h2>
            <p className="text-gray-500 font-medium text-lg">Le plus grand choix de matériel technique au meilleur prix</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
           <div className="relative mr-4">
              <ShoppingCart className="text-gray-700" size={32} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-lg animate-scale-in">
                  {cartCount}
                </span>
              )}
           </div>

           {/* BOUTON DIFFUSION TV */}
           <button 
             onClick={() => setShowShowcase(true)}
             className="bg-gray-900 hover:bg-orange-500 text-white px-6 py-4 rounded-2xl flex items-center gap-3 transition-all font-black uppercase text-xs tracking-widest shadow-xl border-b-4 border-gray-700 active:scale-95"
           >
             <MonitorPlay size={20} className="text-orange-500" /> Diffuser sur TV
           </button>

           <button 
             onClick={() => setIsManagementMode(!isManagementMode)}
             className={`px-6 py-4 rounded-2xl flex items-center gap-3 transition-all font-black uppercase text-xs tracking-widest shadow-xl border-b-4 active:scale-95 ${isManagementMode ? 'bg-blue-600 text-white border-blue-800' : 'bg-white text-gray-700 border-gray-200 hover:border-blue-500'}`}
           >
             <Settings2 size={20} /> {isManagementMode ? 'Quitter Gestion' : 'Gérer le Stock'}
           </button>
           <button onClick={() => setShowReportsModal(true)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-2xl flex items-center gap-3 transition-all font-black uppercase text-xs tracking-widest shadow-sm"><BarChart size={20} /> Bilans</button>
           <button onClick={handleAddNew} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl flex items-center gap-3 transition-all font-black uppercase text-xs tracking-widest shadow-xl border-b-4 border-orange-700 active:scale-95"><Plus size={20} /> Nouvel Article</button>
        </div>
      </div>

      {/* --- FILTRES --- */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
        <div className="relative flex-1 group">
          <input 
            type="text" 
            placeholder="Rechercher un produit, une marque..." 
            className="w-full pl-14 pr-6 py-5 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-3xl outline-none font-bold text-gray-700 transition-all" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
          <Search className="absolute left-5 top-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={28} />
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`px-8 py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${showFilters ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
          <SlidersHorizontal size={20} /> Filtrer
        </button>
      </div>

      {/* --- GRID PRODUITS STYLE JUMIA --- */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {filteredItems.map((item, idx) => (
          <div key={item.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 group flex flex-col cursor-pointer stagger-1" style={{ animationDelay: `${idx * 0.05}s` }}>
            <div 
              className="relative aspect-square bg-gray-50 overflow-hidden"
              onClick={() => { setSelectedItem(item); setActiveImageIndex(0); setZoomedImageUrl(item.imageUrls?.[0] || null); }}
            >
              {item.imageUrls && item.imageUrls[0] ? (
                <img src={item.imageUrls[0]} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-200"><ImageIcon size={64} /></div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-white p-4 rounded-full shadow-2xl scale-50 group-hover:scale-100 transition-all duration-300">
                  <ZoomIn size={32} className="text-orange-500" />
                </div>
              </div>
              {item.quantity <= item.threshold && (
                <div className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded uppercase tracking-tighter">Bientôt épuisé</div>
              )}
              {isManagementMode && (
                <div className="absolute top-2 right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg">
                  <Settings2 size={16} />
                </div>
              )}
            </div>

            <div className="p-4 flex-1 flex flex-col">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{item.category}</p>
              <h3 className="text-sm font-bold text-gray-800 line-clamp-2 min-h-[2.5rem] mb-2 group-hover:text-orange-600 transition-colors">{item.name}</h3>
              
              <div className="mt-auto space-y-3">
                <div className="flex flex-col">
                  <span className="text-xl font-black text-gray-900">{item.unitPrice.toLocaleString()} F</span>
                  {item.quantity > 0 ? (
                    <span className="text-[10px] font-bold text-green-600 uppercase">En stock ({item.quantity})</span>
                  ) : (
                    <span className="text-[10px] font-bold text-red-500 uppercase">Épuisé</span>
                  )}
                </div>
                
                {isManagementMode ? (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleEditClick(item); }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Edit3 size={14} /> Gérer l'article
                  </button>
                ) : (
                  <button 
                    onClick={handleAddToCart}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg border-b-4 border-orange-700 flex items-center justify-center gap-3 active:scale-95"
                  >
                    <ShoppingCart size={16} /> Ajouter au panier
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL FICHE PRODUIT --- */}
      {selectedItem && !zoomedImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden max-h-[90vh] flex flex-col animate-slide-up border-8 border-gray-50">
            <div className="p-8 border-b-2 border-gray-50 flex justify-between items-center bg-gray-50/50">
               <h3 className="text-2xl font-black text-gray-800 flex items-center gap-4">
                  {isEditing ? <Edit3 className="text-orange-500" /> : <Box className="text-orange-500" />}
                  {isEditing ? 'Édition du produit' : 'Détails du produit'}
               </h3>
               <button onClick={() => { setSelectedItem(null); setIsEditing(false); }} className="p-3 bg-white rounded-full shadow-lg text-gray-400 hover:text-red-500 transition-all"><X size={24} /></button>
            </div>

            <div className="p-10 flex-1 overflow-y-auto scrollbar-hide">
               {isEditing && editForm ? (
                 <div className="space-y-8 animate-fade-in">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="col-span-2"><label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Nom de l'article</label><input type="text" className="w-full p-5 border-4 border-gray-50 rounded-2xl font-bold text-lg focus:border-orange-500 outline-none transition-all" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} /></div>
                      <div><label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Prix Unitaire (F)</label><input type="number" className="w-full p-5 border-4 border-gray-50 rounded-2xl font-black text-xl focus:border-orange-500 outline-none transition-all" value={editForm.unitPrice} onChange={e => setEditForm({...editForm, unitPrice: parseInt(e.target.value)})} /></div>
                      <div><label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Quantité</label><input type="number" className="w-full p-5 border-4 border-gray-50 rounded-2xl font-black text-xl focus:border-orange-500 outline-none transition-all" value={editForm.quantity} onChange={e => setEditForm({...editForm, quantity: parseInt(e.target.value)})} /></div>
                    </div>

                    <div className="bg-gray-50 p-8 rounded-[2rem] border-2 border-gray-100">
                        <p className="font-black text-gray-800 uppercase text-xs tracking-widest mb-6 flex items-center gap-3"><ImageIcon size={20} className="text-orange-500" /> Images du produit (Jusqu'à 4)</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[0, 1, 2, 3].map(idx => (
                                <div key={idx} className="flex flex-col gap-2">
                                  <input 
                                    type="text" 
                                    placeholder={`URL Photo ${idx + 1}`}
                                    className="w-full p-3 bg-white border-2 border-gray-100 rounded-xl text-xs font-medium focus:border-orange-500 outline-none"
                                    value={editForm.imageUrls?.[idx] || ''}
                                    onChange={e => {
                                      const urls = [...(editForm.imageUrls || [])];
                                      urls[idx] = e.target.value;
                                      setEditForm({...editForm, imageUrls: urls});
                                    }}
                                  />
                                </div>
                            ))}
                        </div>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col md:flex-row gap-12 animate-fade-in">
                    <div className="w-full md:w-1/2 space-y-6">
                        <div 
                          className="relative aspect-square bg-gray-50 rounded-[2.5rem] overflow-hidden border-4 border-gray-50 group cursor-zoom-in shadow-xl"
                          onClick={() => setZoomedImageUrl(selectedItem.imageUrls![activeImageIndex])}
                        >
                           <img src={selectedItem.imageUrls?.[activeImageIndex] || ''} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                             <div className="bg-white p-5 rounded-full shadow-2xl animate-scale-in">
                               <ZoomIn size={40} className="text-orange-500" />
                             </div>
                           </div>
                        </div>
                        <div className="flex gap-4 justify-center">
                           {selectedItem.imageUrls?.map((url, i) => (
                             <button key={i} onClick={() => setActiveImageIndex(i)} className={`w-20 h-20 rounded-2xl overflow-hidden border-4 transition-all ${activeImageIndex === i ? 'border-orange-500 scale-105 shadow-lg' : 'border-white opacity-60'}`}>
                               <img src={url} className="w-full h-full object-cover" />
                             </button>
                           ))}
                        </div>
                    </div>

                    <div className="flex-1 space-y-8">
                       <div>
                          <span className="px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-widest">{selectedItem.category}</span>
                          <h2 className="text-4xl font-black text-gray-800 tracking-tighter mt-4 leading-tight">{selectedItem.name}</h2>
                          <p className="text-gray-500 font-bold mt-2">ID Article : <span className="text-gray-900">#{selectedItem.id}</span></p>
                       </div>

                       <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white shadow-2xl border-b-8 border-gray-800">
                          <div className="flex justify-between items-end mb-4">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Prix unitaire</p>
                             <p className="text-5xl font-black text-orange-500 tracking-tighter">{selectedItem.unitPrice.toLocaleString()} F</p>
                          </div>
                          <div className="flex justify-between items-end pt-6 border-t border-white/10">
                             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock disponible</p>
                             <p className="text-3xl font-black tracking-tighter">{selectedItem.quantity} Unités</p>
                          </div>
                       </div>
                       
                       <button 
                         onClick={handleAddToCart}
                         className="w-full bg-orange-500 hover:bg-orange-600 text-white py-6 rounded-[2rem] font-black uppercase text-lg shadow-2xl border-b-8 border-orange-800 active:scale-95 transition-all flex items-center justify-center gap-4"
                       >
                         <ShoppingCart size={28} /> Ajouter au panier
                       </button>

                       <div className="space-y-4">
                          <h4 className="font-black text-gray-800 uppercase text-xs tracking-widest flex items-center gap-3"><FileText size={20} className="text-orange-500" /> Spécifications</h4>
                          <div className="grid grid-cols-1 gap-3">
                             {selectedItem.specs && Object.entries(selectedItem.specs).map(([k, v]) => (
                               <div key={k} className="flex justify-between p-4 bg-gray-50 rounded-2xl text-sm">
                                  <span className="text-gray-500 font-black uppercase tracking-widest text-[10px]">{k}</span>
                                  <span className="text-gray-800 font-bold">{v as string}</span>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
               )}
            </div>

            <div className="p-8 border-t-2 border-gray-50 bg-gray-50/50 flex justify-end gap-6">
               {isEditing ? (
                 <>
                   <button onClick={() => setIsEditing(false)} className="px-10 py-5 text-gray-600 font-black uppercase tracking-widest hover:bg-gray-200 rounded-2xl transition-all">Annuler</button>
                   <button onClick={handleSave} className="px-12 py-5 bg-green-600 text-white font-black uppercase tracking-widest rounded-[1.5rem] shadow-2xl border-b-8 border-green-800 flex items-center gap-4 active:scale-95 transition-all"><Save size={24} /> Valider</button>
                 </>
               ) : (
                 <button onClick={() => handleEditClick(selectedItem)} className="px-12 py-5 bg-orange-500 text-white font-black uppercase tracking-widest rounded-[1.5rem] shadow-2xl border-b-8 border-orange-800 flex items-center gap-4 active:scale-95 transition-all"><Edit3 size={24} /> Modifier</button>
               )}
            </div>
          </div>
        </div>
      )}

      {/* RAPPORTS MODAL */}
      {showReportsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-lg animate-fade-in">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
              <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-purple-50/50">
                 <div><h3 className="text-3xl font-black text-purple-900 flex items-center gap-4"><BarChart className="text-purple-600" size={32} />Analyses de Stock</h3><p className="text-purple-500 text-lg font-bold">Rapports financiers de la quincaillerie</p></div>
                 <button onClick={() => setShowReportsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors bg-white p-3 rounded-full shadow-lg"><X size={24} /></button>
              </div>
              <div className="p-10 flex-1 overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                     <div className="bg-white rounded-[2.5rem] p-10 border-2 border-gray-50 shadow-sm text-center"><p className="text-xs font-black uppercase tracking-widest text-green-600 mb-3">Ventes</p><h4 className="text-4xl font-black text-gray-800 tracking-tighter">1.250.000 F</h4></div>
                     <div className="bg-white rounded-[2.5rem] p-10 border-2 border-gray-50 shadow-sm text-center"><p className="text-xs font-black uppercase tracking-widest text-red-500 mb-3">Achats</p><h4 className="text-4xl font-black text-gray-800 tracking-tighter">450.000 F</h4></div>
                     <div className="bg-gray-900 rounded-[2.5rem] p-10 shadow-2xl text-center text-white border-b-8 border-purple-900"><p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-3">Bénéfice</p><h4 className="text-4xl font-black text-orange-500 tracking-tighter">800.000 F</h4></div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default HardwareStore;

import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Achievement } from '../types';
import { 
  Trophy, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  Video, 
  Loader2, 
  X,
  Play,
  Move,
  Edit,
  Save
} from 'lucide-react';

interface AchievementsProps {
  initialData?: Achievement[];
}

const Achievements: React.FC<AchievementsProps> = ({ initialData = [] }) => {
  const [achievements, setAchievements] = useState<Achievement[]>(initialData);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [newAchievement, setNewAchievement] = useState<{
      title: string;
      description: string;
      file: File | null;
      previewUrl: string | null;
      mediaType: 'image' | 'video';
      posX: number;
      posY: number;
  }>({
      title: '',
      description: '',
      file: null,
      previewUrl: null,
      mediaType: 'image',
      posX: 50,
      posY: 50
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
      setAchievements(initialData);
  }, [initialData]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const isVideo = file.type.startsWith('video/');
          const previewUrl = URL.createObjectURL(file);
          setNewAchievement(prev => ({ 
              ...prev, 
              file, 
              previewUrl, 
              mediaType: isVideo ? 'video' : 'image' 
          }));
      }
  };

  const handleEdit = (item: Achievement) => {
      // Parse position string "50% 50%" to numbers
      let x = 50, y = 50;
      if (item.position) {
          const parts = item.position.split(' ');
          if (parts.length === 2) {
              x = parseInt(parts[0]);
              y = parseInt(parts[1]);
          }
      }

      setNewAchievement({
          title: item.title,
          description: item.description || '',
          file: null, // No new file selected yet
          previewUrl: item.mediaUrl, // Use existing URL as preview
          mediaType: item.mediaType,
          posX: isNaN(x) ? 50 : x,
          posY: isNaN(y) ? 50 : y
      });
      setEditingId(item.id);
      setIsAdding(true);
  };

  const handleSave = async () => {
      if (!newAchievement.title || (!newAchievement.previewUrl && !newAchievement.file)) {
          alert("Titre et fichier sont obligatoires.");
          return;
      }

      setIsUploading(true);
      try {
          let publicUrl = newAchievement.previewUrl || '';

          // 1. Upload ONLY if a new file is selected
          if (newAchievement.file) {
              const timestamp = Date.now();
              const fileExt = newAchievement.file.name.split('.').pop();
              const fileName = `achievement_${timestamp}.${fileExt}`;
              
              const { error: uploadError } = await supabase.storage
                .from('assets')
                .upload(fileName, newAchievement.file);
              
              if (uploadError) throw uploadError;

              const { data } = supabase.storage
                .from('assets')
                .getPublicUrl(fileName);
              
              publicUrl = data.publicUrl;
          }

          const recordData = {
              title: newAchievement.title,
              description: newAchievement.description,
              mediaUrl: publicUrl,
              mediaType: newAchievement.mediaType,
              position: `${newAchievement.posX}% ${newAchievement.posY}%`,
          };

          if (editingId) {
              // UPDATE
              const { error: dbError } = await supabase
                .from('achievements')
                .update(recordData)
                .eq('id', editingId);

              if (dbError) throw dbError;

              // Update Local State
              setAchievements(prev => prev.map(a => 
                  a.id === editingId ? { ...a, ...recordData } : a
              ));

          } else {
              // INSERT
              const newRecord: Achievement = {
                  id: `ACH-${Date.now()}`,
                  ...recordData,
                  date: new Date().toISOString()
              };

              const { error: dbError } = await supabase
                .from('achievements')
                .insert([newRecord]);

              if (dbError) throw dbError;

              setAchievements([newRecord, ...achievements]);
          }

          // Reset
          setIsAdding(false);
          setEditingId(null);
          setNewAchievement({ title: '', description: '', file: null, previewUrl: null, mediaType: 'image', posX: 50, posY: 50 });

      } catch (error: any) {
          alert("Erreur: " + error.message);
      } finally {
          setIsUploading(false);
      }
  };

  const handleDelete = async (id: string) => {
      if (!confirm("Supprimer cette réalisation ?")) return;
      
      try {
          const { error } = await supabase.from('achievements').delete().eq('id', id);
          if (error) throw error;
          setAchievements(prev => prev.filter(a => a.id !== id));
      } catch (error: any) {
          alert("Erreur: " + error.message);
      }
  };

  return (
    <div className="space-y-6 pb-24 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Nos Réalisations</h2>
          <p className="text-gray-500 font-bold text-sm">Gestion des médias pour la TV</p>
        </div>
        <button 
          onClick={() => {
              setEditingId(null);
              setNewAchievement({ title: '', description: '', file: null, previewUrl: null, mediaType: 'image', posX: 50, posY: 50 });
              setIsAdding(true);
          }} 
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-all font-black uppercase text-xs tracking-widest"
        >
            <Plus size={20} /> Ajouter Média
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {achievements.map((item) => (
              <div key={item.id} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group relative animate-fade-in">
                  
                  {/* Actions Buttons */}
                  <div className="absolute top-4 right-4 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(item)}
                        className="p-2 bg-white/90 rounded-full text-blue-600 shadow-sm hover:scale-110 transition-transform"
                      >
                          <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 bg-white/90 rounded-full text-red-500 shadow-sm hover:scale-110 transition-transform"
                      >
                          <Trash2 size={16} />
                      </button>
                  </div>

                  <div className="aspect-video bg-gray-100 relative flex items-center justify-center overflow-hidden">
                      {item.mediaType === 'video' ? (
                          <>
                             <video src={item.mediaUrl} className="w-full h-full object-cover" />
                             <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                 <Play size={40} className="text-white fill-white opacity-80" />
                             </div>
                             <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                                 <Video size={10} /> Vidéo
                             </div>
                          </>
                      ) : (
                          <>
                            <img 
                                src={item.mediaUrl} 
                                alt={item.title} 
                                className="w-full h-full object-cover transition-transform duration-700 hover:scale-110"
                                style={{ objectPosition: item.position || '50% 50%' }}
                            />
                             <div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                                 <ImageIcon size={10} /> Image
                             </div>
                          </>
                      )}
                  </div>
                  
                  <div className="p-5">
                      <h3 className="font-black text-gray-900 text-lg leading-tight mb-1 truncate">{item.title}</h3>
                      <p className="text-gray-500 text-xs font-medium line-clamp-2">{item.description || "Aucune description"}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-3 tracking-wider">
                          {new Date(item.date).toLocaleDateString()}
                      </p>
                  </div>
              </div>
          ))}
          
          {achievements.length === 0 && (
              <div className="col-span-full py-20 text-center text-gray-400">
                  <Trophy size={48} className="mx-auto mb-4 opacity-20"/>
                  <p className="font-bold text-sm">Aucune réalisation ajoutée.</p>
              </div>
          )}
      </div>

      {/* MODAL AJOUT / EDIT */}
      {isAdding && (
          <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 md:pt-24 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
              <div className="bg-white w-full max-h-[90vh] md:max-w-xl rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col shadow-2xl overflow-hidden animate-slide-up relative mb-10">
                  
                  {/* Header */}
                  <div className="px-6 py-6 md:px-10 md:py-8 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                      <div>
                          <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                              {editingId ? 'Modifier' : 'Ajouter'}
                          </h3>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Réalisation TV</p>
                      </div>
                      <button onClick={() => setIsAdding(false)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"><X size={20} className="text-gray-500"/></button>
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 bg-white custom-scrollbar">
                      {/* Upload Area */}
                      <div 
                        className={`w-full aspect-video rounded-3xl border-4 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden relative group
                            ${newAchievement.previewUrl ? 'border-orange-500 bg-black' : 'border-gray-200 bg-gray-50 hover:border-orange-300 hover:bg-orange-50 cursor-pointer'}`}
                      >
                          <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*,video/*" 
                            className="hidden" 
                            onChange={handleFileSelect}
                          />
                          
                          {newAchievement.previewUrl ? (
                              newAchievement.mediaType === 'video' ? (
                                  <video src={newAchievement.previewUrl} className="w-full h-full object-contain" controls />
                              ) : (
                                  <img 
                                    src={newAchievement.previewUrl} 
                                    className="w-full h-full object-cover" 
                                    style={{ objectPosition: `${newAchievement.posX}% ${newAchievement.posY}%` }}
                                  />
                              )
                          ) : (
                              <div className="text-center text-gray-400" onClick={() => fileInputRef.current?.click()}>
                                  <div className="flex justify-center gap-2 mb-2 group-hover:scale-110 transition-transform">
                                      <ImageIcon size={32}/> <Video size={32}/>
                                  </div>
                                  <span className="text-xs font-black uppercase tracking-wide">Cliquez pour ajouter</span>
                              </div>
                          )}

                          {newAchievement.previewUrl && (
                              <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute top-4 right-4 bg-black/60 backdrop-blur p-3 rounded-full text-white hover:bg-red-500 transition-colors shadow-lg"
                              >
                                  <Move size={18} />
                              </button>
                          )}
                      </div>

                      {/* Position Controls (Only for images) */}
                      {newAchievement.previewUrl && newAchievement.mediaType === 'image' && (
                          <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                  <Move size={12}/> Cadrage de l'image
                              </p>
                              <div className="grid grid-cols-2 gap-6">
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-500 mb-2 block">Horizontal (X)</label>
                                      <input 
                                        type="range" min="0" max="100" 
                                        value={newAchievement.posX} 
                                        onChange={(e) => setNewAchievement({...newAchievement, posX: parseInt(e.target.value)})}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                                      />
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-bold text-gray-500 mb-2 block">Vertical (Y)</label>
                                      <input 
                                        type="range" min="0" max="100" 
                                        value={newAchievement.posY} 
                                        onChange={(e) => setNewAchievement({...newAchievement, posY: parseInt(e.target.value)})}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600"
                                      />
                                  </div>
                              </div>
                          </div>
                      )}

                      <div className="space-y-4">
                          <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Titre</label>
                              <input 
                                type="text" 
                                placeholder="Titre de la réalisation"
                                className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-orange-500 transition-all text-gray-900"
                                value={newAchievement.title}
                                onChange={(e) => setNewAchievement({...newAchievement, title: e.target.value})}
                              />
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Description</label>
                              <textarea 
                                placeholder="Description courte (optionnel)"
                                className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-orange-500 resize-none h-28 transition-all text-gray-900"
                                value={newAchievement.description}
                                onChange={(e) => setNewAchievement({...newAchievement, description: e.target.value})}
                              />
                          </div>
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="p-6 md:p-8 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex gap-4">
                      <button 
                        onClick={() => setIsAdding(false)}
                        className="flex-1 py-4 font-black text-gray-400 bg-gray-100 rounded-2xl hover:bg-gray-200 uppercase text-xs tracking-widest transition-colors"
                      >
                          Annuler
                      </button>
                      <button 
                        onClick={handleSave} 
                        disabled={isUploading}
                        className="flex-[2] py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-orange-600 transition-all active:scale-95"
                      >
                          {isUploading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                          {isUploading ? 'Sauvegarde...' : 'Enregistrer'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Achievements;


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
  Play
} from 'lucide-react';

interface AchievementsProps {
  initialData?: Achievement[];
}

const Achievements: React.FC<AchievementsProps> = ({ initialData = [] }) => {
  const [achievements, setAchievements] = useState<Achievement[]>(initialData);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [newAchievement, setNewAchievement] = useState<{
      title: string;
      description: string;
      file: File | null;
      previewUrl: string | null;
      mediaType: 'image' | 'video';
  }>({
      title: '',
      description: '',
      file: null,
      previewUrl: null,
      mediaType: 'image'
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

  const handleSave = async () => {
      if (!newAchievement.title || !newAchievement.file) {
          alert("Titre et fichier sont obligatoires.");
          return;
      }

      setIsUploading(true);
      try {
          const timestamp = Date.now();
          const fileExt = newAchievement.file.name.split('.').pop();
          const fileName = `achievement_${timestamp}.${fileExt}`;
          
          // 1. Upload
          const { error: uploadError } = await supabase.storage
            .from('assets')
            .upload(fileName, newAchievement.file);
          
          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('assets')
            .getPublicUrl(fileName);

          // 2. Insert DB
          const newRecord: Achievement = {
              id: `ACH-${timestamp}`,
              title: newAchievement.title,
              description: newAchievement.description,
              mediaUrl: publicUrl,
              mediaType: newAchievement.mediaType,
              date: new Date().toISOString()
          };

          const { error: dbError } = await supabase
            .from('achievements')
            .insert([newRecord]);

          if (dbError) throw dbError;

          // Update Local
          setAchievements([newRecord, ...achievements]);
          setIsAdding(false);
          setNewAchievement({ title: '', description: '', file: null, previewUrl: null, mediaType: 'image' });

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
          onClick={() => setIsAdding(true)} 
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-4 rounded-2xl flex items-center gap-2 shadow-lg active:scale-95 transition-all font-black uppercase text-xs tracking-widest"
        >
            <Plus size={20} /> Ajouter Média
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {achievements.map((item) => (
              <div key={item.id} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-all group relative animate-fade-in">
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-4 right-4 z-10 p-2 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:scale-110"
                  >
                      <Trash2 size={16} />
                  </button>

                  <div className="aspect-video bg-gray-100 relative flex items-center justify-center">
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
                            <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover" />
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

      {/* MODAL AJOUT */}
      {isAdding && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-scale-in">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black uppercase text-gray-900">Nouvelle Réalisation</h3>
                      <button onClick={() => setIsAdding(false)}><X size={24} className="text-gray-400"/></button>
                  </div>

                  <div className="space-y-6">
                      {/* Upload Area */}
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors overflow-hidden relative
                            ${newAchievement.previewUrl ? 'border-orange-500 bg-black' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
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
                                  <img src={newAchievement.previewUrl} className="w-full h-full object-contain" />
                              )
                          ) : (
                              <div className="text-center text-gray-400">
                                  <div className="flex justify-center gap-2 mb-2">
                                      <ImageIcon size={24}/> <Video size={24}/>
                                  </div>
                                  <span className="text-xs font-black uppercase tracking-wide">Cliquez pour ajouter (Image/Vidéo)</span>
                              </div>
                          )}
                      </div>

                      <div className="space-y-4">
                          <input 
                            type="text" 
                            placeholder="Titre de la réalisation"
                            className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-orange-500"
                            value={newAchievement.title}
                            onChange={(e) => setNewAchievement({...newAchievement, title: e.target.value})}
                          />
                          <textarea 
                            placeholder="Description courte (optionnel)"
                            className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-orange-500 resize-none h-24"
                            value={newAchievement.description}
                            onChange={(e) => setNewAchievement({...newAchievement, description: e.target.value})}
                          />
                      </div>

                      <button 
                        onClick={handleSave} 
                        disabled={isUploading}
                        className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                          {isUploading ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                          {isUploading ? 'Téléchargement...' : 'Enregistrer'}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Achievements;

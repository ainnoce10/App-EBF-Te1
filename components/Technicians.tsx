
import React, { useState, useEffect, useRef } from 'react';
import { Intervention, Site } from '../types';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Mic, 
  X, 
  Square, 
  Play, 
  Pause,
  PartyPopper,
  CalendarPlus,
  Loader2,
  Phone,
  Briefcase,
  Layers,
  User
} from 'lucide-react';

interface TechniciansProps {
  initialData?: Intervention[];
}

const Technicians: React.FC<TechniciansProps> = ({ initialData = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [interventions, setInterventions] = useState<Intervention[]>(initialData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setInterventions(initialData);
  }, [initialData]);

  const [showReportModal, setShowReportModal] = useState(false);
  const [showNewInterventionModal, setShowNewInterventionModal] = useState(false);
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState({ title: 'ENVOYÉ !', sub: 'Ton travail est bien enregistré.' });
  
  const [formReport, setFormReport] = useState({ client: '', workDone: '', status: 'Terminé' });
  const [newIntervention, setNewIntervention] = useState({
    client: '',
    clientPhone: '',
    domain: 'Électricité' as 'Électricité' | 'Bâtiment' | 'Froid',
    interventionType: 'Dépannage' as any,
    description: '',
    site: 'Abidjan' as Site,
    date: new Date().toISOString().split('T')[0]
  });

  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'review'>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const playbackTimerRef = useRef<number | null>(null);

  const handleStartRecording = () => {
    setRecordingState('recording');
    setRecordingDuration(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setRecordingDuration(prev => prev + 1);
    }, 1000);
  };

  const handleStopRecording = () => {
    setRecordingState('review');
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleTogglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    } else {
      setIsPlaying(true);
      playbackTimerRef.current = window.setInterval(() => {
        setPlaybackTime(prev => {
          if (prev >= recordingDuration) {
            setIsPlaying(false);
            if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
            return recordingDuration;
          }
          return prev + 0.1;
        });
      }, 100);
    }
  };

  const triggerCelebration = (title: string, sub: string) => {
    setCelebrationMessage({ title, sub });
    setShowSuccessCelebration(true);
    setTimeout(() => setShowSuccessCelebration(false), 3000);
  };

  const handleSubmitReport = async () => {
    const target = interventions.find(i => i.client === formReport.client);
    if (!target) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('interventions')
        .update({ status: formReport.status, description: formReport.workDone })
        .eq('id', target.id);
      
      if (error) throw error;
      triggerCelebration('REPORTÉ !', 'Le rapport a été mis à jour.');
      setShowReportModal(false);
    } catch (err: any) {
      alert("Erreur de sauvegarde: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateIntervention = async () => {
    if (!newIntervention.client || !newIntervention.description) {
        alert("Veuillez remplir au moins le nom du client et la description.");
        return;
    }

    setIsSaving(true);
    const id = `INT-${Math.floor(Math.random() * 9000) + 1000}`;
    try {
      const { error } = await supabase.from('interventions').insert([{
        id,
        ...newIntervention,
        technician: 'Admin EBF',
        status: 'En attente'
      }]);
      if (error) throw error;
      triggerCelebration('PLANIFIÉ !', 'Nouvelle intervention créée.');
      setShowNewInterventionModal(false);
      // Reset form
      setNewIntervention({
        client: '',
        clientPhone: '',
        domain: 'Électricité',
        interventionType: 'Dépannage',
        description: '',
        site: 'Abidjan',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (err: any) {
      alert("Erreur de création: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const filteredInterventions = interventions.filter(i => 
    i.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      {showSuccessCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
             <div className="bg-white p-10 rounded-[3rem] flex flex-col items-center border-8 border-orange-500 animate-bounce text-center shadow-2xl">
                <PartyPopper size={64} className="text-orange-500 mb-4" />
                <h2 className="text-3xl font-black">{celebrationMessage.title}</h2>
                <p className="text-xl text-gray-500 font-bold">{celebrationMessage.sub}</p>
             </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-800">Techniciens 🛠️</h2>
          <p className="text-gray-500">Suivi des interventions</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setShowNewInterventionModal(true)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95">
              <CalendarPlus size={18} /> Planifier
            </button>
            <button onClick={() => setShowReportModal(true)} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg pulse-soft transition-all active:scale-95">
              <Mic size={18} /> Vocal
            </button>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher un client ou une intervention..."
          className="w-full pl-14 pr-4 py-4 border-4 border-white rounded-[2rem] shadow-sm font-bold outline-none focus:border-orange-500 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInterventions.map((inter) => (
          <div key={inter.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 hover-lift relative group overflow-hidden">
            <div className="flex justify-between mb-4">
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${inter.status === 'Terminé' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {inter.status}
              </span>
              <span className="text-[10px] text-gray-300 font-mono">#{inter.id.split('-')[1]}</span>
            </div>
            <h3 className="font-black text-xl mb-2 text-gray-900">{inter.client}</h3>
            <p className="text-gray-500 text-sm mb-6 line-clamp-2">{inter.description}</p>
            
            <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                    <Briefcase size={14} className="text-orange-500" /> {inter.domain || 'N/A'}
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                    <Layers size={14} className="text-blue-500" /> {inter.interventionType || 'N/A'}
                </div>
            </div>

            <div className="flex items-center gap-4 pt-4 border-t border-gray-50 text-[10px] font-black uppercase text-gray-400">
               <div className="flex items-center gap-1"><MapPin size={12}/> {inter.site}</div>
               <div className="flex items-center gap-1"><Calendar size={12}/> {new Date(inter.date).toLocaleDateString()}</div>
            </div>
            <button 
                onClick={() => { setFormReport({ ...formReport, client: inter.client }); setShowReportModal(true); }} 
                className="absolute bottom-4 right-4 p-3 bg-orange-50 rounded-2xl text-orange-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-orange-500 hover:text-white"
            >
              <Mic size={20} />
            </button>
          </div>
        ))}
        {filteredInterventions.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white/50 rounded-[3rem] border-4 border-dashed border-gray-200">
                <Search size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-bold">Aucune intervention trouvée</p>
            </div>
        )}
      </div>

      {/* MODAL REPORT VOCAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 animate-scale-in shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black text-gray-800">Compte Rendu Vocal</h3>
                  <button onClick={() => setShowReportModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"><X/></button>
              </div>

              <div className="flex flex-col items-center gap-8 py-10">
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer ${recordingState === 'recording' ? 'bg-red-500 scale-110 animate-pulse' : 'bg-orange-500 hover:scale-105'}`}>
                      {recordingState === 'idle' ? (
                        <button onClick={handleStartRecording} className="text-white"><Mic size={48} /></button>
                      ) : recordingState === 'recording' ? (
                        <button onClick={handleStopRecording} className="text-white"><Square size={40} /></button>
                      ) : (
                        <button onClick={handleTogglePlayback} className="text-white">{isPlaying ? <Pause size={48} /> : <Play size={48} />}</button>
                      )}
                  </div>
                  
                  <div className="text-center">
                      <p className="text-4xl font-black font-mono tracking-tighter text-gray-800">
                        {formatTime(recordingState === 'review' ? playbackTime : recordingDuration)}
                      </p>
                      <p className="text-gray-400 font-bold uppercase text-[10px] mt-2 tracking-widest">
                          {recordingState === 'recording' ? 'Enregistrement en cours...' : recordingState === 'review' ? 'Réécoute du rapport' : 'Prêt pour le vocal'}
                      </p>
                  </div>
              </div>

              {recordingState === 'review' && (
                <div className="space-y-4 animate-fade-in">
                   <select 
                     className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-orange-500"
                     value={formReport.client}
                     onChange={(e) => setFormReport({...formReport, client: e.target.value})}
                   >
                     <option value="">Sélectionner le client...</option>
                     {interventions.map(i => <option key={i.id} value={i.client}>{i.client}</option>)}
                   </select>
                   <button 
                     onClick={handleSubmitReport} 
                     disabled={isSaving || !formReport.client}
                     className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex justify-center items-center gap-2 hover:bg-black transition-all disabled:opacity-50"
                   >
                     {isSaving ? <Loader2 className="animate-spin"/> : 'Transmettre au bureau'}
                   </button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* MODAL NOUVELLE INTERVENTION (AMÉLIORÉ) */}
      {showNewInterventionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-8 md:p-12 animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
              <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">PLANIFIER INTERVENTION</h3>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Création de dossier client</p>
                  </div>
                  <button onClick={() => setShowNewInterventionModal(false)} className="p-3 bg-gray-100 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"><X/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom du Client / Entreprise</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input type="text" placeholder="Ex: Société Ivoire" className="w-full pl-12 p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-green-500 transition-all" value={newIntervention.client} onChange={e => setNewIntervention({...newIntervention, client: e.target.value})}/>
                    </div>
                  </div>

                  {/* Client Phone */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Numéro de Téléphone</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input type="tel" placeholder="+225 00 00 00 00" className="w-full pl-12 p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-green-500 transition-all" value={newIntervention.clientPhone} onChange={e => setNewIntervention({...newIntervention, clientPhone: e.target.value})}/>
                    </div>
                  </div>

                  {/* Domain */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Domaine d'activité</label>
                    <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-green-500 transition-all appearance-none" value={newIntervention.domain} onChange={e => setNewIntervention({...newIntervention, domain: e.target.value as any})}>
                        <option value="Électricité">⚡ Électricité</option>
                        <option value="Bâtiment">🏠 Bâtiment / GC</option>
                        <option value="Froid">❄️ Froid & Clim</option>
                    </select>
                  </div>

                  {/* Intervention Type */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nature de l'intervention</label>
                    <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-green-500 transition-all appearance-none" value={newIntervention.interventionType} onChange={e => setNewIntervention({...newIntervention, interventionType: e.target.value as any})}>
                        <option value="Dépannage">Dépannage Urgent</option>
                        <option value="Installation">Installation</option>
                        <option value="Expertise">Expertise / Devis</option>
                        <option value="Entretien">Entretien / Maintenance</option>
                        <option value="Tuyauterie">Tuyauterie</option>
                    </select>
                  </div>

                  {/* Site d'intervention */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Site EBF</label>
                    <div className="flex gap-2">
                        {(['Abidjan', 'Bouaké'] as Site[]).map(s => (
                            <button 
                                key={s} 
                                onClick={() => setNewIntervention({...newIntervention, site: s})}
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all border-2 ${newIntervention.site === s ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-gray-50 border-transparent text-gray-400'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date prévue</label>
                    <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-green-500 transition-all" value={newIntervention.date} onChange={e => setNewIntervention({...newIntervention, date: e.target.value})}/>
                  </div>

                  {/* Description / Lieu */}
                  <div className="col-span-full space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lieu & Description du travail</label>
                    <textarea 
                        placeholder="Ex: Rue 12 Plateau, 3ème étage. Panne de climatiseur central..." 
                        className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-green-500 transition-all h-32 resize-none" 
                        value={newIntervention.description} 
                        onChange={e => setNewIntervention({...newIntervention, description: e.target.value})} 
                    />
                  </div>

                  <button 
                    onClick={handleCreateIntervention} 
                    disabled={isSaving} 
                    className="col-span-full mt-4 py-5 bg-green-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-green-700 transition-all active:scale-95 flex items-center justify-center gap-3"
                  >
                      {isSaving ? <Loader2 className="animate-spin"/> : <CalendarPlus size={20} />}
                      {isSaving ? 'PLANIFICATION EN COURS...' : 'VALIDER LE PLANNING'}
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Technicians;
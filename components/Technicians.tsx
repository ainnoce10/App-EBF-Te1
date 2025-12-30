
import React, { useState, useEffect, useRef } from 'react';
import { MOCK_INTERVENTIONS } from '../constants';
import { Intervention, Site } from '../types';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  MapPin, 
  Calendar, 
  Mic, 
  FileText, 
  X, 
  Square, 
  Play, 
  Pause,
  Trash2,
  PartyPopper,
  ChevronRight,
  CalendarPlus,
  Save,
  Zap,
  Home,
  Snowflake,
  Phone,
  Tag,
  User,
  Filter
} from 'lucide-react';

interface TechniciansProps {
  initialData?: Intervention[];
}

const Technicians: React.FC<TechniciansProps> = ({ initialData = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [interventions, setInterventions] = useState<Intervention[]>([]);

  useEffect(() => {
    if (initialData.length > 0) {
      setInterventions(initialData);
    } else if (interventions.length === 0) {
        setInterventions(MOCK_INTERVENTIONS);
    }
  }, [initialData]);

  // Modal States
  const [showReportModal, setShowReportModal] = useState(false);
  const [showNewInterventionModal, setShowNewInterventionModal] = useState(false);
  const [reportMode, setReportMode] = useState<'form' | 'voice'>('voice');
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState({ title: 'ENVOYÉ !', sub: 'Ton travail est bien enregistré.' });
  
  // Form States (New & Report) - Same as before
  const [formReport, setFormReport] = useState({ client: '', workDone: '', status: 'Terminé' });
  const [newIntervention, setNewIntervention] = useState<{
    client: string;
    clientPhone: string;
    domain: 'Électricité' | 'Bâtiment' | 'Froid';
    interventionType: string;
    description: string;
    site: Site;
    date: string;
  }>({
    client: '',
    clientPhone: '',
    domain: 'Électricité',
    interventionType: 'Dépannage',
    description: '',
    site: 'Abidjan',
    date: new Date().toISOString().split('T')[0]
  });

  // Audio States
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
    setPlaybackTime(0);
  };

  const handleTogglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    } else {
      if (playbackTime >= recordingDuration) setPlaybackTime(0);
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

  const handleRestart = () => {
    setRecordingState('idle');
    setRecordingDuration(0);
    setPlaybackTime(0);
    setIsPlaying(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
  };

  const triggerCelebration = (title: string, sub: string) => {
    setCelebrationMessage({ title, sub });
    setShowSuccessCelebration(true);
    setTimeout(() => {
      setShowSuccessCelebration(false);
    }, 3000);
  };

  const handleSubmitReport = async () => {
    const targetIntervention = interventions.find(i => i.client === formReport.client);
    if (targetIntervention) {
        try {
            const { error } = await supabase
                .from('interventions')
                .update({ status: formReport.status, description: formReport.workDone })
                .eq('id', targetIntervention.id);
            if (error) throw error;
            triggerCelebration('ENVOYÉ !', 'Rapport transmis. 🚀');
            closeReportModal();
        } catch (error) {
            alert(`Erreur: ${(error as any).message}`);
        }
    }
  };

  const handleCreateIntervention = async () => {
    const id = `INT-${Math.floor(Math.random() * 9000) + 1000}`;
    const newItem: Intervention = {
      id,
      client: newIntervention.client,
      clientPhone: newIntervention.clientPhone,
      domain: newIntervention.domain,
      interventionType: newIntervention.interventionType as any,
      description: newIntervention.description,
      technician: 'Admin EBF', 
      status: 'En attente',
      date: newIntervention.date,
      site: newIntervention.site
    };
    try {
        const { error } = await supabase.from('interventions').insert([newItem]);
        if (error) throw error;
        triggerCelebration('CRÉÉ !', 'Intervention planifiée. 📅');
        setShowNewInterventionModal(false);
    } catch (error) {
        alert(`Erreur : ${(error as any).message}`);
    }
  };

  const closeReportModal = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    setShowReportModal(false);
    setRecordingState('idle');
    setRecordingDuration(0);
    setIsPlaying(false);
    setFormReport({ client: '', workDone: '', status: 'Terminé' });
  };

  const openVoiceReportAction = () => {
    setReportMode('voice');
    setShowReportModal(true);
    handleStartRecording();
  };

  const openFormReportAction = (clientName: string = '') => {
    setReportMode('form');
    setFormReport(prev => ({ ...prev, client: clientName }));
    setShowReportModal(true);
    setRecordingState('idle'); 
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredInterventions = interventions.filter(inter => 
    inter.client.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 md:space-y-6 relative pb-20">
      {/* Confettis Layer */}
      {showSuccessCelebration && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center bg-black/40 backdrop-blur-md">
             <div className="bg-white p-8 md:p-12 rounded-[3rem] flex flex-col items-center border-8 border-orange-500 max-w-sm text-center mx-4 animate-bounce">
                <PartyPopper size={80} className="text-orange-500 mb-4" />
                <h2 className="text-3xl md:text-5xl font-black text-gray-800 tracking-tighter">{celebrationMessage.title}</h2>
                <p className="text-lg md:text-2xl text-gray-500 font-bold mt-2">{celebrationMessage.sub}</p>
             </div>
        </div>
      )}

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">Espace Tech 🛠️</h2>
          <p className="text-gray-500 font-medium text-sm md:text-lg">Gérez vos chantiers et rapports</p>
        </div>
        <div className="flex w-full md:w-auto gap-2">
            <button 
              onClick={() => setShowNewInterventionModal(true)}
              className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 font-black text-xs md:text-sm uppercase tracking-wide border-b-4 border-green-800"
            >
              <CalendarPlus size={18} />
              Nouveau
            </button>
            <button 
              onClick={openVoiceReportAction}
              className="flex-none bg-orange-500 hover:bg-orange-600 text-white p-3 md:px-6 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 font-black text-xs md:text-sm uppercase tracking-wide border-b-4 border-orange-700 pulse-soft"
            >
              <Mic size={20} />
              <span className="hidden md:inline">Rapport Vocal</span>
            </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <input
          type="text"
          placeholder="Rechercher client..."
          className="w-full pl-12 md:pl-16 pr-4 py-4 md:py-6 border-4 border-gray-100 rounded-2xl md:rounded-[2.5rem] focus:border-orange-500 bg-white shadow-sm font-black text-lg text-gray-700 outline-none transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
      </div>

      {/* Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
        {filteredInterventions.map((inter, idx) => (
          <div key={inter.id} className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-sm border-2 border-gray-50 overflow-hidden hover-lift" style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="p-6 md:p-8">
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col gap-2">
                    <span className={`px-3 py-1 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest w-fit
                    ${inter.status === 'En cours' ? 'bg-blue-100 text-blue-700' : 
                        inter.status === 'Terminé' ? 'bg-green-100 text-green-700' : 
                        'bg-gray-100 text-gray-700'}`}>
                    {inter.status}
                    </span>
                    {inter.domain && (
                        <span className="flex items-center gap-1.5 text-[9px] md:text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            {inter.domain === 'Électricité' && <Zap size={10} className="text-orange-500" />}
                            {inter.domain === 'Bâtiment' && <Home size={10} className="text-blue-500" />}
                            {inter.domain === 'Froid' && <Snowflake size={10} className="text-cyan-500" />}
                            {inter.domain} • {inter.interventionType?.slice(0, 10)}
                        </span>
                    )}
                </div>
                <span className="text-[10px] text-gray-300 font-mono font-black">#{inter.id.split('-')[1]}</span>
              </div>
              <h3 className="font-black text-xl md:text-2xl text-gray-800 mb-2 truncate">{inter.client}</h3>
              <p className="text-gray-500 font-bold text-sm md:text-base mb-6 line-clamp-2">{inter.description}</p>
              
              <div className="space-y-3 pt-4 border-t-2 border-gray-50">
                <div className="flex items-center gap-3 text-gray-600 font-black uppercase tracking-wider text-xs">
                  <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600"><MapPin size={16} /></div>
                  {inter.site}
                </div>
                <div className="flex items-center gap-3 text-gray-600 font-black uppercase tracking-wider text-xs">
                  <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600"><Calendar size={16} /></div>
                  {new Date(inter.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 md:px-8 md:py-6 flex justify-between items-center">
                 <button 
                    onClick={() => openFormReportAction(inter.client)}
                    className="text-gray-500 font-black text-[10px] uppercase tracking-widest hover:text-blue-600 flex items-center gap-2"
                 >
                    Ouvrir <ChevronRight size={14}/>
                 </button>
                 <button onClick={openVoiceReportAction} className="bg-white p-2.5 rounded-xl shadow-sm text-orange-500 active:scale-90">
                    <Mic size={20} />
                 </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL : NOUVELLE INTERVENTION (Mobile Full Screen) */}
      {showNewInterventionModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full h-[95vh] md:h-auto md:max-h-[90vh] md:max-w-3xl rounded-t-[2.5rem] md:rounded-[3rem] shadow-2xl flex flex-col animate-slide-up overflow-hidden">
            
            <div className="px-6 py-4 md:p-8 border-b border-gray-100 flex justify-between items-center bg-green-50">
                <h3 className="text-xl md:text-3xl font-black text-gray-800 flex items-center gap-3">
                   <CalendarPlus size={28} className="text-green-600"/>
                   Planification
                </h3>
                <button onClick={() => setShowNewInterventionModal(false)} className="p-2 bg-white rounded-full text-gray-400 hover:text-red-500"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 md:space-y-8 bg-white custom-scrollbar">
                <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 block">Domaine</label>
                    <div className="grid grid-cols-3 gap-2 md:gap-4">
                        {[
                            { id: 'Électricité', icon: <Zap size={20}/>, color: 'orange' },
                            { id: 'Bâtiment', icon: <Home size={20}/>, color: 'blue' },
                            { id: 'Froid', icon: <Snowflake size={20}/>, color: 'cyan' }
                        ].map((d) => (
                            <button
                                key={d.id}
                                onClick={() => setNewIntervention({...newIntervention, domain: d.id as any})}
                                className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border-2 font-bold text-[10px] md:text-xs uppercase
                                    ${newIntervention.domain === d.id 
                                        ? `bg-${d.color}-50 border-${d.color}-500 text-${d.color}-700` 
                                        : 'bg-white border-gray-100 text-gray-400'}`}
                            >
                                {d.icon}
                                <span className="hidden md:inline">{d.id}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Client</label>
                        <input 
                            type="text" 
                            placeholder="Nom du client"
                            className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-green-500"
                            value={newIntervention.client}
                            onChange={(e) => setNewIntervention({...newIntervention, client: e.target.value})}
                        />
                    </div>
                     <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Téléphone</label>
                        <input 
                            type="tel" 
                            placeholder="07 XX XX XX XX"
                            className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-green-500"
                            value={newIntervention.clientPhone}
                            onChange={(e) => setNewIntervention({...newIntervention, clientPhone: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Mission</label>
                    <textarea 
                        rows={3}
                        className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-green-500 resize-none"
                        value={newIntervention.description}
                        onChange={(e) => setNewIntervention({...newIntervention, description: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Site</label>
                        <select 
                            className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-800 outline-none"
                            value={newIntervention.site}
                            onChange={(e) => setNewIntervention({...newIntervention, site: e.target.value as Site})}
                        >
                            <option value="Abidjan">Abidjan</option>
                            <option value="Bouaké">Bouaké</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1">Date</label>
                        <input 
                            type="date"
                            className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-gray-800 outline-none"
                            value={newIntervention.date}
                            onChange={(e) => setNewIntervention({...newIntervention, date: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            <div className="p-4 md:p-6 border-t border-gray-100 bg-white">
                <button 
                    onClick={handleCreateIntervention}
                    disabled={!newIntervention.client}
                    className="w-full bg-green-600 text-white py-4 rounded-2xl text-lg font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
                >
                    <Save size={20} /> Valider
                </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : RAPPORT VOCAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white w-full md:max-w-xl rounded-t-[3rem] md:rounded-[3rem] flex flex-col animate-slide-up">
            <div className="p-8 text-center border-b border-gray-50">
                <h3 className="text-2xl font-black text-gray-800 flex items-center justify-center gap-3">
                   <Mic size={28} className="text-orange-500"/> Rapport Vocal
                </h3>
            </div>
            
            <div className="p-10 flex flex-col items-center justify-center min-h-[300px]">
                {recordingState === 'recording' && (
                    <>
                        <div className="w-40 h-40 bg-red-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                            <button onClick={handleStopRecording} className="w-32 h-32 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl"><Square size={40} fill="currentColor" /></button>
                        </div>
                        <p className="text-5xl font-black text-gray-800 font-mono">{formatTime(recordingDuration)}</p>
                        <p className="text-gray-400 mt-2 font-medium">Enregistrement...</p>
                    </>
                )}
                
                {recordingState === 'review' && (
                    <div className="w-full text-center">
                         <div className="bg-gray-900 text-white p-6 rounded-3xl mb-8">
                             <div className="flex items-center justify-center gap-6">
                                 <button onClick={handleRestart} className="p-4 bg-white/10 rounded-full hover:bg-white/20"><Trash2 size={24}/></button>
                                 <button onClick={handleTogglePlayback} className="w-20 h-20 bg-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                     {isPlaying ? <Pause size={32} fill="currentColor"/> : <Play size={32} fill="currentColor" className="ml-1"/>}
                                 </button>
                             </div>
                             <div className="mt-6 font-mono text-2xl font-bold">{formatTime(recordingDuration)}</div>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <button onClick={closeReportModal} className="py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold uppercase">Annuler</button>
                             <button onClick={handleSubmitReport} className="py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase shadow-lg">Envoyer</button>
                         </div>
                    </div>
                )}

                {recordingState === 'idle' && (
                     <div className="text-center">
                         <p className="text-gray-400 mb-6">Prêt à enregistrer ?</p>
                         <button onClick={handleStartRecording} className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl mx-auto"><Mic size={40}/></button>
                     </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Technicians;

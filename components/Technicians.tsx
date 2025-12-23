import React, { useState, useEffect, useRef } from 'react';
import { MOCK_INTERVENTIONS } from '../constants';
import { Intervention, Site } from '../types';
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
  Send,
  Volume2,
  Trash2,
  PartyPopper,
  ChevronRight,
  ClipboardCheck,
  CalendarPlus,
  Save,
  RotateCcw
} from 'lucide-react';

interface TechniciansProps {
  initialData?: Intervention[];
}

const Technicians: React.FC<TechniciansProps> = ({ initialData = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [interventions, setInterventions] = useState<Intervention[]>(initialData.length > 0 ? initialData : MOCK_INTERVENTIONS);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setInterventions(initialData);
    }
  }, [initialData]);

  // Modal States
  const [showReportModal, setShowReportModal] = useState(false);
  const [showNewInterventionModal, setShowNewInterventionModal] = useState(false);
  const [reportMode, setReportMode] = useState<'form' | 'voice'>('voice');
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState({ title: 'ENVOYÉ !', sub: 'Ton travail est bien enregistré.' });
  
  // Form State for Reports
  const [formReport, setFormReport] = useState({
    client: '',
    workDone: '',
    status: 'Terminé'
  });

  // Form State for New Intervention
  const [newIntervention, setNewIntervention] = useState({
    client: '',
    description: '',
    site: 'Abidjan',
    date: new Date().toISOString().split('T')[0]
  });

  // Voice Recording State
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'review'>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const timerRef = useRef<number | null>(null);

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const playbackTimerRef = useRef<number | null>(null);

  // --- Voice Logic ---
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

  const handleSubmitReport = () => {
    triggerCelebration('ENVOYÉ !', 'Ton travail est bien enregistré. 🚀');
    closeReportModal();
  };

  const handleCreateIntervention = () => {
    const id = `INT-${Math.floor(Math.random() * 900) + 100}`;
    const newItem: Intervention = {
      id,
      client: newIntervention.client,
      description: newIntervention.description,
      technician: 'Admin EBF', // Simulé
      status: 'En attente',
      date: newIntervention.date,
      site: newIntervention.site
    };
    
    setInterventions([newItem, ...interventions]);
    triggerCelebration('CRÉÉ !', 'La nouvelle intervention est planifiée. 📅');
    setShowNewInterventionModal(false);
    setNewIntervention({
        client: '',
        description: '',
        site: 'Abidjan',
        date: new Date().toISOString().split('T')[0]
    });
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
    <div className="space-y-6 relative">
      {/* Confettis Layer */}
      {showSuccessCelebration && (
        <div className="fixed inset-0 z-[100] pointer-events-none overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i} 
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#f97316', '#16a34a', '#3b82f6', '#eab308'][Math.floor(Math.random() * 4)],
                animationDelay: `${Math.random() * 2}s`,
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
              }}
            ></div>
          ))}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md">
             <div className="bg-white p-12 rounded-[4rem] shadow-2xl animate-bounce flex flex-col items-center border-8 border-orange-500 max-w-sm text-center">
                <PartyPopper size={120} className="text-orange-500 mb-6" />
                <h2 className="text-5xl font-black text-gray-800 tracking-tighter">{celebrationMessage.title}</h2>
                <p className="text-2xl text-gray-500 font-bold mt-4">{celebrationMessage.sub}</p>
             </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-gray-800 tracking-tight">Espace Techniciens 🛠️</h2>
          <p className="text-gray-500 font-medium text-lg">Gérez vos chantiers et envoyez vos rapports</p>
        </div>
        <div className="flex flex-wrap gap-4">
            {/* BOUTON NOUVELLE INTERVENTION */}
            <button 
              onClick={() => setShowNewInterventionModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-5 rounded-3xl flex items-center gap-4 transition-all shadow-xl active:scale-95 font-black text-lg uppercase tracking-wider group border-b-8 border-green-800"
            >
              <CalendarPlus size={28} className="group-hover:rotate-12 transition-transform" />
              Nouvelle Intervention
            </button>
            {/* BOUTON ÉCRIT */}
            <button 
              onClick={() => openFormReportAction()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-5 rounded-3xl flex items-center gap-4 transition-all shadow-xl active:scale-95 font-black text-lg uppercase tracking-wider group border-b-8 border-blue-800"
            >
              <FileText size={28} className="group-hover:rotate-12 transition-transform" />
              Rapport Écrit
            </button>
            {/* BOUTON VOCAL */}
            <button 
              onClick={openVoiceReportAction}
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-5 rounded-3xl flex items-center gap-4 transition-all shadow-xl active:scale-95 font-black text-lg uppercase tracking-wider group border-b-8 border-orange-700 pulse-soft"
            >
              <Mic size={32} className="group-hover:scale-110 transition-transform" />
              Rapport Vocal
            </button>
        </div>
      </div>

      <div className="relative group">
        <input
          type="text"
          placeholder="Rechercher un chantier..."
          className="w-full pl-16 pr-8 py-6 border-4 border-gray-100 rounded-[2.5rem] focus:ring-8 focus:ring-orange-500/10 focus:border-orange-500 bg-white shadow-sm font-black text-xl text-gray-700 transition-all outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-6 top-6 text-gray-300 group-focus-within:text-orange-500 transition-colors" size={32} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredInterventions.map((inter, idx) => (
          <div key={inter.id} className="bg-white rounded-[3rem] shadow-sm border-2 border-gray-50 overflow-hidden hover-lift group" style={{ animationDelay: `${idx * 0.1}s` }}>
            <div className="p-10">
              <div className="flex justify-between items-start mb-6">
                <span className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest
                  ${inter.status === 'En cours' ? 'bg-blue-100 text-blue-700' : 
                    inter.status === 'Terminé' ? 'bg-green-100 text-green-700' : 
                    'bg-gray-100 text-gray-700'}`}>
                  {inter.status}
                </span>
                <span className="text-xs text-gray-300 font-mono font-black">REF-{inter.id}</span>
              </div>
              <h3 className="font-black text-3xl text-gray-800 mb-3 group-hover:text-orange-500 transition-colors">{inter.client}</h3>
              <p className="text-gray-500 font-bold text-lg mb-8 line-clamp-2">{inter.description}</p>
              
              <div className="space-y-4 pt-8 border-t-2 border-gray-50">
                <div className="flex items-center gap-4 text-gray-600 font-black uppercase tracking-wider text-sm">
                  <div className="bg-orange-100 p-2 rounded-xl text-orange-600"><MapPin size={24} /></div>
                  {inter.site}
                </div>
                <div className="flex items-center gap-4 text-gray-600 font-black uppercase tracking-wider text-sm">
                  <div className="bg-orange-100 p-2 rounded-xl text-orange-600"><Calendar size={24} /></div>
                  {new Date(inter.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-10 py-6 flex justify-between items-center">
                 <button 
                    onClick={() => openFormReportAction(inter.client)}
                    className="text-gray-400 font-black text-xs uppercase tracking-widest hover:text-blue-600 flex items-center gap-2 transition-colors"
                 >
                    Détails chantiers <ChevronRight size={16}/>
                 </button>
                 <button 
                    onClick={openVoiceReportAction}
                    className="bg-white p-3 rounded-2xl shadow-sm text-orange-500 hover:bg-orange-500 hover:text-white transition-all"
                    title="Rapport Vocal Rapide"
                 >
                    <Mic size={24} />
                 </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL : NOUVELLE INTERVENTION */}
      {showNewInterventionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-slide-up border-8 border-gray-50">
            <div className="p-10 border-b-4 border-gray-50 flex justify-between items-center bg-green-50">
                <h3 className="text-3xl font-black text-gray-800 flex items-center gap-4">
                   <CalendarPlus size={40} className="text-green-600"/>
                   Nouvelle Intervention
                </h3>
                <button onClick={() => setShowNewInterventionModal(false)} className="p-4 bg-white rounded-full shadow-lg text-gray-400 hover:text-red-500 transition-all active:scale-90"><X size={32}/></button>
            </div>
            <div className="p-12 space-y-8">
                <div>
                    <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Nom du Client</label>
                    <input 
                        type="text" 
                        placeholder="Ex: Société Ivoire, M. Koffi..."
                        className="w-full p-6 bg-gray-50 border-4 border-gray-100 rounded-[2rem] focus:border-green-500 outline-none font-black text-2xl text-gray-700"
                        value={newIntervention.client}
                        onChange={(e) => setNewIntervention({...newIntervention, client: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Description du problème / Travaux</label>
                    <textarea 
                        rows={3}
                        placeholder="Décrivez ce qu'il y a à faire..."
                        className="w-full p-6 bg-gray-50 border-4 border-gray-100 rounded-[2rem] focus:border-green-500 outline-none font-bold text-xl text-gray-700 resize-none"
                        value={newIntervention.description}
                        onChange={(e) => setNewIntervention({...newIntervention, description: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Site</label>
                        <select 
                            className="w-full p-6 bg-gray-50 border-4 border-gray-100 rounded-[2rem] focus:border-green-500 outline-none font-black text-lg text-gray-700 appearance-none"
                            value={newIntervention.site}
                            onChange={(e) => setNewIntervention({...newIntervention, site: e.target.value as Site})}
                        >
                            <option value="Abidjan">📍 Abidjan</option>
                            <option value="Bouaké">📍 Bouaké</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Date prévue</label>
                        <input 
                            type="date"
                            className="w-full p-6 bg-gray-50 border-4 border-gray-100 rounded-[2rem] focus:border-green-500 outline-none font-black text-lg text-gray-700"
                            value={newIntervention.date}
                            onChange={(e) => setNewIntervention({...newIntervention, date: e.target.value})}
                        />
                    </div>
                </div>
                <button 
                    onClick={handleCreateIntervention}
                    disabled={!newIntervention.client || !newIntervention.description}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-8 rounded-[3rem] text-2xl font-black shadow-2xl flex items-center justify-center gap-6 transition-all active:scale-95 group border-b-8 border-green-900 mt-4"
                >
                    <Save size={36} />
                    PLANIFIER L'INTERVENTION
                </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL : RAPPORT VOCAL OU ÉCRIT */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-fade-in">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-slide-up border-8 border-gray-50">
            
            <div className={`p-10 border-b-4 border-gray-50 flex justify-between items-center ${reportMode === 'voice' ? 'bg-orange-50' : 'bg-blue-50'}`}>
                <h3 className="text-3xl font-black text-gray-800 flex items-center gap-4">
                   {reportMode === 'voice' ? <Mic size={40} className="text-orange-500 animate-pulse"/> : <FileText size={40} className="text-blue-600"/>}
                   {reportMode === 'voice' ? 'Rapport Vocal' : 'Rapport Écrit'}
                </h3>
                <button onClick={closeReportModal} className="p-4 bg-white rounded-full shadow-lg text-gray-400 hover:text-red-500 transition-all active:scale-90"><X size={32}/></button>
            </div>

            <div className="p-12 flex flex-col items-center">
                {reportMode === 'voice' ? (
                    <div className="w-full">
                        {recordingState === 'recording' && (
                            <div className="text-center space-y-12 py-10">
                                <div className="relative">
                                    <div className="w-48 h-48 rounded-full bg-red-100 flex items-center justify-center mx-auto border-[12px] border-white shadow-2xl">
                                        <button 
                                            onClick={handleStopRecording}
                                            className="w-36 h-36 bg-red-500 rounded-full flex items-center justify-center text-white shadow-2xl animate-pulse active:scale-90 transition-all"
                                        >
                                            <Square size={60} fill="currentColor" />
                                        </button>
                                    </div>
                                    <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 audio-wave">
                                        {[...Array(14)].map((_, i) => (
                                            <div key={i} className="wave-bar !bg-red-500 !w-2" style={{ animationDelay: `${i * 0.1}s`, height: `${Math.random() * 60 + 20}px` }}></div>
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-10">
                                    <p className="text-7xl font-black font-mono text-red-600 tracking-tighter">{formatTime(recordingDuration)}</p>
                                    <p className="text-3xl font-black text-gray-800 mt-8 italic">Parle maintenant, je t'écoute... 🎧</p>
                                </div>
                            </div>
                        )}

                        {recordingState === 'review' && (
                            <div className="w-full space-y-12 animate-fade-in">
                                <div className="bg-gray-900 rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden border-8 border-gray-800">
                                    <div className="absolute top-0 left-0 h-3 bg-orange-500" style={{ width: `${(playbackTime / recordingDuration) * 100}%`, transition: 'width 0.1s linear' }}></div>
                                    <div className="flex items-center justify-between mb-10">
                                        <div>
                                            <p className="text-sm font-black uppercase text-orange-500 tracking-widest mb-2">Message prêt</p>
                                            <p className="text-3xl font-black">{formatTime(recordingDuration)} enregistré</p>
                                        </div>
                                        <div className="bg-gray-800 p-5 rounded-3xl">
                                            <Volume2 className="text-orange-500" size={48} />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center gap-12">
                                        <button 
                                            onClick={handleRestart}
                                            className="p-6 bg-gray-800 rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-xl"
                                            title="Supprimer et recommencer"
                                        >
                                            <Trash2 size={40} />
                                        </button>
                                        <button 
                                            onClick={handleTogglePlayback}
                                            className="w-32 h-32 bg-orange-500 rounded-full flex items-center justify-center text-white shadow-2xl hover:bg-orange-600 active:scale-90 transition-all border-8 border-gray-800"
                                        >
                                            {isPlaying ? <Pause size={50} fill="currentColor" /> : <Play size={50} fill="currentColor" className="ml-2"/>}
                                        </button>
                                        <div className="p-6 bg-gray-800 rounded-full text-gray-700 opacity-20">
                                            <RotateCcw size={40} />
                                        </div>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSubmitReport}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-10 rounded-[3rem] text-4xl font-black shadow-2xl flex items-center justify-center gap-8 transition-all active:scale-95 group border-b-[12px] border-blue-900"
                                >
                                    <Send size={48} className="group-hover:translate-x-4 group-hover:-translate-y-4 transition-transform" />
                                    ENVOYER LE RAPPORT
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-full space-y-8 animate-fade-in">
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Client ou Chantier</label>
                                <input 
                                    type="text" 
                                    placeholder="Nom du client..."
                                    className="w-full p-6 bg-gray-50 border-4 border-gray-100 rounded-[2rem] focus:border-blue-500 outline-none font-black text-2xl text-gray-700"
                                    value={formReport.client}
                                    onChange={(e) => setFormReport({...formReport, client: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">Détails des travaux</label>
                                <textarea 
                                    rows={4}
                                    placeholder="Décrivez vos actions ici..."
                                    className="w-full p-6 bg-gray-50 border-4 border-gray-100 rounded-[2rem] focus:border-blue-500 outline-none font-bold text-xl text-gray-700 resize-none"
                                    value={formReport.workDone}
                                    onChange={(e) => setFormReport({...formReport, workDone: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-black text-gray-400 uppercase tracking-widest mb-3">État actuel du chantier</label>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    {['Terminé', 'En cours', 'Problème'].map((s) => (
                                        <button 
                                            key={s}
                                            onClick={() => setFormReport({...formReport, status: s as any})}
                                            className={`p-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border-4 ${formReport.status === s ? 'bg-blue-600 border-blue-800 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400'}`}
                                        >
                                            {s === 'Terminé' ? '✅ ' : s === 'En cours' ? '⏳ ' : '⚠️ '}{s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={handleSubmitReport}
                            disabled={!formReport.client || !formReport.workDone}
                            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-8 rounded-[3rem] text-2xl font-black shadow-2xl flex items-center justify-center gap-6 transition-all active:scale-95 group border-b-8 border-blue-900 mt-8"
                        >
                            <ClipboardCheck size={36} />
                            VALIDER ET ENVOYER
                        </button>
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

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
  User,
  Edit,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Info,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface TechniciansProps {
  initialData?: Intervention[];
}

type StatusFilterType = 'Tous' | 'En attente' | 'En cours' | 'Terminé avec rapport' | 'Terminé sans rapport';

const Technicians: React.FC<TechniciansProps> = ({ initialData = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('Tous');
  const [interventions, setInterventions] = useState<Intervention[]>(initialData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setInterventions(initialData);
  }, [initialData]);

  // Modals state
  const [showReportModal, setShowReportModal] = useState(false);
  const [showNewInterventionModal, setShowNewInterventionModal] = useState(false);
  const [editIntervention, setEditIntervention] = useState<Intervention | null>(null);
  const [viewIntervention, setViewIntervention] = useState<Intervention | null>(null);
  const [activeInterventionForReport, setActiveInterventionForReport] = useState<Intervention | null>(null);

  // Feedback state
  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState({ title: 'ENVOYÉ !', sub: 'Ton travail est bien enregistré.' });
  
  // Forms state
  const [formReport, setFormReport] = useState({ client: '', workDone: '', status: 'Terminé' });
  const [newIntervention, setNewIntervention] = useState({
    client: '',
    clientPhone: '',
    domain: 'Électricité' as 'Électricité' | 'Bâtiment' | 'Froid' | 'Plomberie',
    interventionType: 'Dépannage' as any,
    description: '',
    location: '',
    site: 'Abidjan' as Site,
    date: new Date().toISOString().split('T')[0]
  });

  // Audio recording state
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'review'>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);

  const timerRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordingState('review'); // On passe en mode écoute seulement quand le blob est prêt
      };

      mediaRecorder.start();
      setRecordingState('recording');
      setRecordingDuration(0);
      
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Erreur micro : impossible d'accéder au microphone.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleTogglePlayback = () => {
    if (!audioPreviewRef.current) return;
    if (isPlaying) {
      audioPreviewRef.current.pause();
    } else {
      audioPreviewRef.current.play().catch(console.error);
    }
  };

  const triggerCelebration = (title: string, sub: string) => {
    setCelebrationMessage({ title, sub });
    setShowSuccessCelebration(true);
    setTimeout(() => setShowSuccessCelebration(false), 3000);
  };

  const handleOpenReportForIntervention = (inter: Intervention) => {
      setActiveInterventionForReport(inter);
      setFormReport({ client: inter.client, workDone: '', status: 'Terminé' });
      setRecordingState('idle');
      setRecordingDuration(0);
      setAudioBlob(null);
      setAudioUrl(null);
      setShowReportModal(true);
  };

  const handleUpdateIntervention = async () => {
    if (!editIntervention) return;
    setIsSaving(true);
    try {
        const { error } = await supabase
            .from('interventions')
            .update({
                status: editIntervention.status,
                description: editIntervention.description,
                technician: editIntervention.technician,
                date: editIntervention.date,
                location: editIntervention.location,
                clientPhone: editIntervention.clientPhone
            })
            .eq('id', editIntervention.id);

        if (error) throw error;
        triggerCelebration('MIS À JOUR !', 'Le dossier a été modifié.');
        setEditIntervention(null);
    } catch (err: any) {
        alert("Erreur de mise à jour : " + err.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    const target = activeInterventionForReport || interventions.find(i => i.client === formReport.client);
    if (!target) {
        alert("Veuillez sélectionner un client.");
        return;
    }

    if (!audioBlob) {
        alert("Veuillez enregistrer un message vocal.");
        return;
    }
    
    setIsSaving(true);
    try {
      let audioPath = null;
      const fileName = `report_${target.id}_${Date.now()}.webm`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice_reports')
        .upload(fileName, audioBlob);
      
      if (uploadError) throw uploadError;
      audioPath = uploadData.path;

      const { error } = await supabase
        .from('interventions')
        .update({ 
            status: 'Terminé', 
            has_report: true, 
            description: formReport.workDone 
                ? `${formReport.workDone}\n(Audio: ${audioPath})` 
                : `Rapport vocal enregistré le ${new Date().toLocaleDateString()}`
        })
        .eq('id', target.id);
      
      if (error) throw error;

      triggerCelebration('RAPPORT TRANSMIS !', 'L\'intervention est maintenant terminée avec rapport.');
      setShowReportModal(false);
      setActiveInterventionForReport(null);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingState('idle');
    } catch (err: any) {
      alert("Erreur lors de la soumission : " + err.message);
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
        technician: 'À assigner',
        status: 'En attente',
        has_report: false
      }]);
      if (error) throw error;
      triggerCelebration('PLANIFIÉ !', 'Nouvelle intervention créée.');
      setShowNewInterventionModal(false);
      setNewIntervention({
        client: '',
        clientPhone: '',
        domain: 'Électricité',
        interventionType: 'Dépannage',
        description: '',
        location: '',
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

  const filteredInterventions = interventions.filter(i => {
    const matchesSearch = i.client.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'En attente') matchesStatus = i.status === 'En attente';
    else if (statusFilter === 'En cours') matchesStatus = i.status === 'En cours';
    else if (statusFilter === 'Terminé avec rapport') matchesStatus = i.status === 'Terminé' && i.has_report === true;
    else if (statusFilter === 'Terminé sans rapport') matchesStatus = i.status === 'Terminé' && i.has_report !== true;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusDisplay = (inter: Intervention) => {
      if (inter.status === 'Terminé') {
          return inter.has_report ? 'Terminé avec rapport' : 'Terminé sans rapport';
      }
      return inter.status;
  };

  const getStatusColorClass = (inter: Intervention) => {
      switch(inter.status) {
          case 'Terminé': 
              return inter.has_report ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-100';
          case 'En cours': return 'bg-orange-100 text-orange-700 border-orange-200';
          case 'En attente': return 'bg-blue-100 text-blue-700 border-blue-200';
          default: return 'bg-gray-100 text-gray-700';
      }
  };

  return (
    <div className="space-y-6 pb-20">
      {showSuccessCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
             <div className="bg-white p-10 rounded-[3rem] flex flex-col items-center border-8 border-orange-500 animate-bounce text-center shadow-2xl">
                <PartyPopper size={64} className="text-orange-500 mb-4" />
                <h2 className="text-3xl font-black uppercase tracking-tighter">{celebrationMessage.title}</h2>
                <p className="text-xl text-gray-500 font-bold uppercase tracking-widest mt-2">{celebrationMessage.sub}</p>
             </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Techniciens 🛠️</h2>
          <p className="text-gray-500 font-bold uppercase text-xs tracking-widest mt-1">Maintenance & Rapports vocaux</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setShowNewInterventionModal(true)} className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] md:text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
              <CalendarPlus size={18} /> Planifier
            </button>
            <button onClick={() => { setActiveInterventionForReport(null); setShowReportModal(true); }} className="flex-1 md:flex-none bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] md:text-xs flex items-center justify-center gap-2 shadow-lg pulse-soft transition-all active:scale-95">
              <Mic size={18} /> Rapport Rapide
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un client..."
              className="w-full pl-14 pr-4 py-4 md:py-5 bg-white rounded-[2rem] shadow-sm font-black text-lg md:text-xl border-4 border-transparent focus:border-orange-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
          </div>

          <div className="relative">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)}
                className="w-full pl-14 pr-12 py-4 md:py-5 bg-white rounded-[2rem] shadow-sm font-black text-lg md:text-xl border-4 border-transparent focus:border-blue-600 outline-none appearance-none transition-all cursor-pointer uppercase tracking-tight"
              >
                <option value="Tous">📊 Tous les dossiers</option>
                <option value="En attente">⏳ En Attente</option>
                <option value="En cours">🛠️ En Cours</option>
                <option value="Terminé avec rapport">✅ Terminé avec Rapport</option>
                <option value="Terminé sans rapport">❌ Terminé sans Rapport</option>
              </select>
              <FileText className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={24} />
              <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={24} />
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInterventions.map((inter) => (
          <div 
            key={inter.id} 
            onClick={() => setViewIntervention(inter)}
            className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 hover-lift relative group overflow-hidden flex flex-col cursor-pointer"
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors shadow-sm ${getStatusColorClass(inter)}`}>
                {getStatusDisplay(inter)}
              </span>
              <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setEditIntervention(inter); }}
                    className="p-2.5 bg-gray-50 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all active:scale-90"
                  >
                      <Edit size={16} strokeWidth={2.5}/>
                  </button>
                  <span className="text-[10px] text-gray-300 font-mono mt-2.5">#{inter.id.split('-')[1]}</span>
              </div>
            </div>
            
            <div className="mb-4">
                <h3 className="font-black text-2xl mb-1 text-gray-900 leading-tight tracking-tight uppercase italic">{inter.client}</h3>
                <div className="flex flex-col gap-1.5">
                    {inter.location && (
                        <div className="flex items-center gap-1.5 text-gray-400 text-xs font-black">
                            <MapPin size={14} className="text-orange-500"/>
                            {inter.location}
                        </div>
                    )}
                    {inter.clientPhone && (
                        <a 
                          href={`tel:${inter.clientPhone}`} 
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-blue-600 text-xs font-black hover:underline group-hover:translate-x-1 transition-transform w-fit"
                        >
                            <Phone size={14} className="text-blue-500"/>
                            {inter.clientPhone}
                        </a>
                    )}
                </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6 flex-1">
                <p className="text-gray-600 text-sm font-bold leading-relaxed line-clamp-3">{inter.description}</p>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-6">
                <div className="flex items-center gap-2 bg-orange-50 text-orange-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-orange-100">
                    <Briefcase size={12} /> {inter.domain || 'N/A'}
                </div>
                <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border border-blue-100">
                    <Layers size={12} /> {inter.interventionType || 'N/A'}
                </div>
            </div>

            <div className="flex items-center justify-between pt-5 border-t border-gray-100">
               <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        <MapPin size={12}/> {inter.site}
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                        <Calendar size={12}/> {new Date(inter.date).toLocaleDateString()}
                    </div>
               </div>
               
               <div className="flex items-center gap-2">
                   <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                       <User size={14} className="text-gray-400" />
                       <span className="text-[10px] font-black uppercase text-gray-600 tracking-tighter">{inter.technician}</span>
                   </div>
                   <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenReportForIntervention(inter); }}
                        className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-2"
                        title="Faire le rapport vocal"
                   >
                       <Mic size={16} />
                       <span className="text-[10px] font-black uppercase">Rapport</span>
                   </button>
               </div>
            </div>

            {inter.has_report && (
                <div className="absolute top-1/2 -right-8 rotate-45 bg-green-500 text-white px-10 py-1 text-[8px] font-black uppercase tracking-widest shadow-lg">Rapport Ok</div>
            )}
          </div>
        ))}
      </div>

      {/* --- MODAL REPORT VOCAL --- */}
      {showReportModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 animate-scale-in shadow-2xl relative overflow-hidden border-b-[12px] border-orange-500">
              <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Rapport Vocal</h3>
                    <p className="text-orange-500 font-bold text-[10px] uppercase tracking-widest mt-2">
                        {activeInterventionForReport ? `Pour : ${activeInterventionForReport.client}` : 'Compte-rendu général'}
                    </p>
                  </div>
                  <button onClick={() => { setShowReportModal(false); setActiveInterventionForReport(null); setAudioBlob(null); setAudioUrl(null); setRecordingState('idle'); }} className="p-3 bg-gray-100 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all shadow-sm"><X size={24}/></button>
              </div>

              <div className="flex flex-col items-center gap-8 py-6">
                  <div className={`w-40 h-40 rounded-full flex items-center justify-center shadow-2xl transition-all relative z-10 
                    ${recordingState === 'recording' ? 'bg-red-500 scale-110' : 'bg-orange-500 hover:scale-105 active:scale-95'}`}>
                      {recordingState === 'recording' && (
                          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></div>
                      )}
                      {recordingState === 'idle' ? (
                        <button onClick={handleStartRecording} className="text-white flex flex-col items-center"><Mic size={64} /><span className="text-[10px] font-black uppercase mt-1">Enregistrer</span></button>
                      ) : recordingState === 'recording' ? (
                        <button onClick={handleStopRecording} className="text-white flex flex-col items-center"><Square size={48} /><span className="text-[10px] font-black uppercase mt-1">Arrêter</span></button>
                      ) : (
                        <button onClick={handleTogglePlayback} className="text-white flex flex-col items-center">
                            {isPlaying ? <Pause size={64} /> : <Play size={64} />}
                            <span className="text-[10px] font-black uppercase mt-1">{isPlaying ? 'Pause' : 'Réécouter'}</span>
                        </button>
                      )}
                  </div>
                  
                  {audioUrl && (
                      <audio 
                        ref={audioPreviewRef} 
                        src={audioUrl} 
                        onPlay={() => setIsPlaying(true)} 
                        onPause={() => setIsPlaying(false)} 
                        onEnded={() => setIsPlaying(false)}
                        onTimeUpdate={(e) => setPlaybackTime(e.currentTarget.currentTime)}
                        className="hidden" 
                      />
                  )}

                  <div className="text-center">
                      <p className="text-6xl font-black font-mono tracking-tighter text-gray-950">
                        {formatTime(recordingState === 'review' ? playbackTime : recordingDuration)}
                      </p>
                      <p className="text-gray-400 font-bold uppercase text-[10px] mt-4 tracking-widest">
                          {recordingState === 'recording' ? 'CAPTURE AUDIO EN COURS...' : recordingState === 'review' ? 'AUDIO PRÊT POUR SOUMISSION' : 'PRÊT POUR LE VOCAL'}
                      </p>
                  </div>
              </div>

              {recordingState === 'review' && (
                <div className="space-y-5 animate-fade-in pt-4 border-t border-gray-100">
                   {!activeInterventionForReport && (
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lier au client</label>
                             <select 
                                className="w-full p-5 bg-gray-50 rounded-2xl font-black text-sm outline-none border-2 border-transparent focus:border-orange-500 transition-all appearance-none"
                                value={formReport.client}
                                onChange={(e) => setFormReport({...formReport, client: e.target.value})}
                            >
                                <option value="">Choisir un chantier...</option>
                                {interventions.filter(i => i.status !== 'Terminé').map(i => <option key={i.id} value={i.client}>{i.client}</option>)}
                            </select>
                        </div>
                   )}
                   <button 
                     onClick={handleSubmitReport} 
                     disabled={isSaving || (!activeInterventionForReport && !formReport.client)}
                     className="w-full py-6 bg-gray-950 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl flex justify-center items-center gap-3 hover:bg-black transition-all disabled:opacity-50 active:scale-95"
                   >
                     {isSaving ? <Loader2 className="animate-spin" size={24}/> : <CheckCircle2 size={24}/>}
                     {isSaving ? 'ENVOI...' : 'TRANSMETTRE ET TERMINER LE CHANTIER'}
                   </button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* MODAL DETAIL INTERVENTION */}
      {viewIntervention && (
          <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-md animate-fade-in p-0 md:p-6">
              <div className="bg-white w-full max-w-2xl rounded-t-[3rem] md:rounded-[4rem] flex flex-col overflow-hidden shadow-2xl animate-slide-up max-h-[95vh]">
                  <div className="p-8 md:p-12 pb-6 flex justify-between items-start sticky top-0 bg-white/80 backdrop-blur z-10 border-b border-gray-50">
                      <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                              <span className={`px-4 py-1.5 rounded-2xl text-[10px] md:text-xs font-black uppercase tracking-[0.2em] border shadow-sm ${getStatusColorClass(viewIntervention)}`}>
                                  {getStatusDisplay(viewIntervention)}
                              </span>
                              <span className="text-[10px] md:text-xs font-mono text-gray-400">ID: {viewIntervention.id}</span>
                          </div>
                          <h2 className="text-3xl md:text-5xl font-black text-gray-950 uppercase italic tracking-tighter leading-tight drop-shadow-sm">
                              {viewIntervention.client}
                          </h2>
                      </div>
                      <button 
                        onClick={() => setViewIntervention(null)}
                        className="p-4 bg-gray-100 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition-all shadow-md active:scale-90 ml-4"
                      >
                          <X size={24} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 md:p-12 pt-4 space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 flex flex-col gap-2">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} className="text-orange-500"/> Localisation</p>
                              <p className="text-lg font-bold text-gray-800 leading-snug">{viewIntervention.location || "Lieu non précisé"}</p>
                              {viewIntervention.location && (
                                  <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewIntervention.location + " " + viewIntervention.site)}`}
                                    target="_blank"
                                    className="text-orange-600 text-xs font-black uppercase mt-2 flex items-center gap-1 hover:underline w-fit"
                                  >
                                      Ouvrir Maps <ExternalLink size={12}/>
                                  </a>
                              )}
                          </div>
                          <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex flex-col gap-2">
                              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2"><Phone size={12} className="text-blue-500"/> Contact Client</p>
                              <a 
                                href={`tel:${viewIntervention.clientPhone}`}
                                className="text-2xl font-black text-blue-700 hover:underline tracking-tighter"
                              >
                                  {viewIntervention.clientPhone || "Non renseigné"}
                              </a>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2 border-b border-gray-100 pb-2">
                              <Info size={16} className="text-orange-500" /> Détails de l'intervention
                          </h4>
                          <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                               <p className="text-gray-700 text-lg md:text-xl font-medium leading-relaxed whitespace-pre-wrap">
                                   {viewIntervention.description}
                               </p>
                          </div>
                      </div>
                  </div>

                  <div className="p-8 md:p-12 pt-6 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                      <button 
                        onClick={() => { setEditIntervention(viewIntervention); setViewIntervention(null); }}
                        className="flex-1 py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-3"
                      >
                          <Edit size={20} /> Modifier dossier
                      </button>
                      <button 
                        onClick={() => { handleOpenReportForIntervention(viewIntervention); setViewIntervention(null); }}
                        className="flex-1 py-5 bg-orange-500 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-3"
                      >
                          <Mic size={20} /> Rapport Vocal
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL EDITION STATUT */}
      {editIntervention && (
        <div className="fixed inset-0 z-[80] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full rounded-t-[2.5rem] md:rounded-[3rem] p-8 md:p-10 animate-slide-up max-w-lg mx-auto shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
               <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic border-l-8 border-orange-500 pl-4 leading-none">Modifier Intervention</h3>
                   <button onClick={() => setEditIntervention(null)} className="p-3 bg-gray-100 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"><X size={24}/></button>
               </div>

               <div className="space-y-6">
                   <div className="space-y-3">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Statut d'avancement</label>
                       <div className="grid grid-cols-1 gap-3">
                           <button 
                             onClick={() => setEditIntervention({...editIntervention, status: 'En attente'})}
                             className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${editIntervention.status === 'En attente' ? 'bg-blue-50 border-blue-500' : 'bg-gray-50 border-transparent hover:bg-white'}`}
                           >
                               <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${editIntervention.status === 'En attente' ? 'border-blue-500' : 'border-gray-300'}`}>
                                   {editIntervention.status === 'En attente' && <div className="w-3 h-3 bg-blue-500 rounded-full"/>}
                               </div>
                               <div className="text-left">
                                   <p className={`font-black uppercase text-sm ${editIntervention.status === 'En attente' ? 'text-blue-700' : 'text-gray-500'}`}>En Attente</p>
                                   <p className="text-[10px] text-gray-400 font-bold tracking-tight">Dossier créé, en attente de travaux</p>
                               </div>
                               <AlertCircle className={`ml-auto ${editIntervention.status === 'En attente' ? 'text-blue-500' : 'text-gray-300'}`} size={20} />
                           </button>

                           <button 
                             onClick={() => setEditIntervention({...editIntervention, status: 'En cours'})}
                             className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${editIntervention.status === 'En cours' ? 'bg-orange-50 border-orange-500' : 'bg-gray-50 border-transparent hover:bg-white'}`}
                           >
                               <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${editIntervention.status === 'En cours' ? 'border-orange-500' : 'border-gray-300'}`}>
                                   {editIntervention.status === 'En cours' && <div className="w-3 h-3 bg-orange-500 rounded-full"/>}
                               </div>
                               <div className="text-left">
                                   <p className={`font-black uppercase text-sm ${editIntervention.status === 'En cours' ? 'text-orange-700' : 'text-gray-500'}`}>En Cours</p>
                                   <p className="text-[10px] text-gray-400 font-bold tracking-tight">Technicien actuellement sur le terrain</p>
                               </div>
                               <Clock className={`ml-auto ${editIntervention.status === 'En cours' ? 'text-orange-500' : 'text-gray-300'}`} size={20} />
                           </button>

                           <button 
                             onClick={() => setEditIntervention({...editIntervention, status: 'Terminé'})}
                             className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${editIntervention.status === 'Terminé' ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-transparent hover:bg-white'}`}
                           >
                               <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${editIntervention.status === 'Terminé' ? 'border-green-500' : 'border-gray-300'}`}>
                                   {editIntervention.status === 'Terminé' && <div className="w-3 h-3 bg-green-500 rounded-full"/>}
                               </div>
                               <div className="text-left">
                                   <p className={`font-black uppercase text-sm ${editIntervention.status === 'Terminé' ? 'text-green-700' : 'text-gray-500'}`}>Terminé</p>
                                   <p className="text-[10px] text-gray-400 font-bold tracking-tight">Travaux finalisés</p>
                               </div>
                               <CheckCircle2 className={`ml-auto ${editIntervention.status === 'Terminé' ? 'text-green-500' : 'text-gray-300'}`} size={20} />
                           </button>
                       </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Technicien</label>
                           <input type="text" value={editIntervention.technician} onChange={(e) => setEditIntervention({...editIntervention, technician: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-gray-300" />
                       </div>
                       <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                           <input type="date" value={editIntervention.date} onChange={(e) => setEditIntervention({...editIntervention, date: e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-gray-300" />
                       </div>
                   </div>

                   <button 
                     onClick={handleUpdateIntervention} 
                     disabled={isSaving}
                     className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95"
                   >
                       {isSaving ? <Loader2 className="animate-spin"/> : <CheckCircle2 size={20} />}
                       {isSaving ? 'Mise à jour...' : 'Sauvegarder'}
                   </button>
               </div>
           </div>
        </div>
      )}

      {/* MODAL NOUVELLE INTERVENTION */}
      {showNewInterventionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-8 md:p-12 animate-scale-in max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl border-t-[12px] border-green-600">
              <div className="flex justify-between items-center mb-10">
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Planifier Chantier</h3>
                  <button onClick={() => setShowNewInterventionModal(false)} className="p-3 bg-gray-100 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"><X size={24}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Client / Entreprise</label>
                    <input type="text" placeholder="Ex: Société Ivoire" className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={newIntervention.client} onChange={e => setNewIntervention({...newIntervention, client: e.target.value})}/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone</label>
                    <input type="tel" placeholder="+225..." className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none" value={newIntervention.clientPhone} onChange={e => setNewIntervention({...newIntervention, clientPhone: e.target.value})}/>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Domaine</label>
                    <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={newIntervention.domain} onChange={e => setNewIntervention({...newIntervention, domain: e.target.value as any})}>
                        <option value="Électricité">Électricité</option>
                        <option value="Bâtiment">Bâtiment</option>
                        <option value="Froid">Froid & Clim</option>
                        <option value="Plomberie">Plomberie</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Site</label>
                    <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={newIntervention.site} onChange={e => setNewIntervention({...newIntervention, site: e.target.value as any})}>
                        <option value="Abidjan">Abidjan</option>
                        <option value="Bouaké">Bouaké</option>
                        <option value="Korhogo">Korhogo</option>
                    </select>
                  </div>
                  <div className="col-span-full">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description Technique</label>
                    <textarea placeholder="..." className="w-full p-5 bg-gray-50 rounded-3xl font-bold h-28 resize-none" value={newIntervention.description} onChange={e => setNewIntervention({...newIntervention, description: e.target.value})} />
                  </div>
                  <button onClick={handleCreateIntervention} disabled={isSaving} className="col-span-full py-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">
                      {isSaving ? 'PLANIFICATION...' : 'VALIDER LA PLANIFICATION'}
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Technicians;

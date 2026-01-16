
import React, { useState, useEffect, useRef } from 'react';
import { Intervention, Employee } from '../types';
import { supabase } from '../lib/supabase';
import { 
  Search, 
  MapPin, 
  Mic, 
  X, 
  Square, 
  Play, 
  Pause,
  PartyPopper,
  CalendarPlus,
  Loader2,
  Phone,
  Edit,
  CheckCircle2,
  FileText,
  ChevronDown,
  User,
  RotateCcw,
  SendHorizontal,
  Save
} from 'lucide-react';

interface TechniciansProps {
  initialData?: Intervention[];
}

type StatusFilterType = 'Tous' | 'En attente' | 'En cours' | 'Terminé avec rapport' | 'Terminé sans rapport';
type Civility = 'M' | 'Mme' | 'Mlle' | 'Sté' | 'ONG' | 'Ets';

const Technicians: React.FC<TechniciansProps> = ({ initialData = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('Tous');
  const [interventions, setInterventions] = useState<Intervention[]>(initialData);
  const [techniciansList, setTechniciansList] = useState<Employee[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setInterventions(initialData);
    fetchTechnicians();
  }, [initialData]);

  const fetchTechnicians = async () => {
    const { data } = await supabase.from('employees').select('*').eq('status', 'Actif');
    if (data) setTechniciansList(data as Employee[]);
  };

  const [showReportModal, setShowReportModal] = useState(false);
  const [showNewInterventionModal, setShowNewInterventionModal] = useState(false);
  const [editIntervention, setEditIntervention] = useState<Intervention | null>(null);
  const [viewIntervention, setViewIntervention] = useState<Intervention | null>(null);
  const [activeInterventionForReport, setActiveInterventionForReport] = useState<Intervention | null>(null);

  const [showSuccessCelebration, setShowSuccessCelebration] = useState(false);
  
  const [formReport, setFormReport] = useState({ client: '', workDone: '' });
  
  // États séparés pour la création
  const [newCivility, setNewCivility] = useState<Civility>('M');
  const [newClientName, setNewClientName] = useState('');
  const [newIntervention, setNewIntervention] = useState({
    clientPhone: '',
    domain: 'Électricité' as any,
    interventionType: 'Dépannage' as any,
    description: '',
    location: '',
    site: 'Abidjan' as any,
    technician: '',
    date: new Date().toISOString().split('T')[0]
  });

  // États séparés pour l'édition
  const [editCivility, setEditCivility] = useState<Civility>('M');
  const [editClientName, setEditClientName] = useState('');

  // --- LOGIQUE ENREGISTREMENT ET LECTURE ---
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
  const streamRef = useRef<MediaStream | null>(null);

  const civilityOptions: Civility[] = ['M', 'Mme', 'Mlle', 'Sté', 'ONG', 'Ets'];

  // Helper pour parser le nom lors de l'ouverture de l'édition
  const parseClientName = (fullName: string) => {
      const parts = fullName.split(' ');
      let potentialCiv = parts[0];

      // Mapping de compatibilité pour les anciennes entrées
      if (potentialCiv === 'Société') potentialCiv = 'Sté';
      if (potentialCiv === 'Entreprise') potentialCiv = 'Ets';

      if (civilityOptions.includes(potentialCiv as Civility)) {
          return { civ: potentialCiv as Civility, name: parts.slice(1).join(' ') };
      }
      return { civ: 'M' as Civility, name: fullName };
  };

  const handleOpenEdit = (inter: Intervention) => {
      const { civ, name } = parseClientName(inter.client);
      setEditCivility(civ);
      setEditClientName(name);
      setEditIntervention(inter);
  };

  useEffect(() => {
    return () => {
      cleanupRecording();
    };
  }, []);

  const cleanupRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const handleStartRecording = async () => {
    try {
      cleanupRecording();
      setAudioBlob(null);
      setAudioUrl(null);
      setPlaybackTime(0);
      setIsPlaying(false);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      let mimeType = '';
      if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else {
        mimeType = 'audio/webm';
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        try {
            const blob = new Blob(chunksRef.current, { type: mimeType });
            setAudioBlob(blob);
            const url = URL.createObjectURL(blob);
            setAudioUrl(url);
            setRecordingState('review');
        } catch (e) {
            console.error("Erreur création blob audio:", e);
            alert("Erreur lors de la finalisation de l'audio.");
            setRecordingState('idle');
        }
        
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
      };
      
      mediaRecorder.onerror = (event) => {
          console.error("Erreur MediaRecorder:", event);
          alert("Une erreur est survenue pendant l'enregistrement.");
          handleStopRecording();
      };

      mediaRecorder.start(200);
      setRecordingState('recording');
      setRecordingDuration(0);
      
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error(err);
      alert("Impossible d'accéder au microphone. Vérifiez les permissions du navigateur.");
      setRecordingState('idle');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
        setRecordingState('idle');
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTogglePlayback = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!audioPreviewRef.current) return;
    
    if (isPlaying) {
      audioPreviewRef.current.pause();
    } else {
      if (audioPreviewRef.current.ended) {
          audioPreviewRef.current.currentTime = 0;
      }
      audioPreviewRef.current.play().catch(e => {
          console.error("Erreur lecture:", e);
          alert("Impossible de lire l'audio : " + e.message);
      });
    }
  };

  const handleMainButtonClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (recordingState === 'idle') handleStartRecording();
      else if (recordingState === 'recording') handleStopRecording();
      else handleTogglePlayback(e);
  };

  const triggerCelebration = () => {
    setShowSuccessCelebration(true);
    setTimeout(() => setShowSuccessCelebration(false), 3000);
  };

  const handleOpenReportForIntervention = (inter: Intervention) => {
      setActiveInterventionForReport(inter);
      setFormReport({ client: inter.client, workDone: '' });
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
        const fullClientName = `${editCivility} ${editClientName}`.trim();
        
        const { error } = await supabase
            .from('interventions')
            .update({
                client: fullClientName,
                clientPhone: editIntervention.clientPhone,
                domain: editIntervention.domain,
                interventionType: editIntervention.interventionType,
                description: editIntervention.description,
                location: editIntervention.location,
                site: editIntervention.site,
                technician: editIntervention.technician,
                date: editIntervention.date,
                status: editIntervention.status
            })
            .eq('id', editIntervention.id);

        if (error) throw error;
        triggerCelebration();
        setEditIntervention(null);
    } catch (err: any) {
        alert("Erreur : " + err.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    const target = activeInterventionForReport || interventions.find(i => i.client === formReport.client);
    if (!target) {
        alert("Veuillez sélectionner une intervention ou un client.");
        return;
    }
    if (!audioBlob) {
        alert("Erreur : L'audio n'est pas prêt ou est vide.");
        return;
    }
    
    setIsSaving(true);
    try {
      const timestamp = Date.now();
      const fileExt = audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
      const fileName = `report_${target.id}_${timestamp}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('voice_reports')
        .upload(fileName, audioBlob);
      
      if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error("Échec upload audio.");
      }

      const currentDesc = target.description || "";
      const additionalInfo = formReport.workDone ? `\nNote: ${formReport.workDone}` : "";
      const newDescription = `${currentDesc}${additionalInfo}\n\n[Rapport Vocal: ${fileName}]`.trim();

      const { error } = await supabase
        .from('interventions')
        .update({ 
            status: 'Terminé', 
            has_report: true, 
            description: newDescription
        })
        .eq('id', target.id);
      
      if (error) throw error;

      triggerCelebration();
      setShowReportModal(false);
      setRecordingState('idle');
      setAudioBlob(null);
      setAudioUrl(null);
      setFormReport({ client: '', workDone: '' });
      cleanupRecording();

      setInterventions(prev => prev.map(i => i.id === target.id ? { 
          ...i, 
          status: 'Terminé', 
          has_report: true, 
          description: newDescription
      } : i));

    } catch (err: any) {
      alert("Erreur de soumission : " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateIntervention = async () => {
    if (!newClientName || !newIntervention.description || !newIntervention.technician) {
      alert("Veuillez remplir le client, la description et choisir un technicien.");
      return;
    }
    setIsSaving(true);
    const id = `INT-${Math.floor(Math.random() * 9000) + 1000}`;
    const fullClientName = `${newCivility} ${newClientName}`.trim();

    try {
      const { error } = await supabase.from('interventions').insert([{
        id,
        client: fullClientName,
        ...newIntervention,
        status: 'En attente',
        has_report: false
      }]);
      if (error) throw error;
      triggerCelebration();
      setShowNewInterventionModal(false);
      setNewClientName('');
      setNewCivility('M');
      setNewIntervention({ ...newIntervention, description: '', location: '', clientPhone: '' });
    } catch (err: any) {
      alert("Erreur création : " + err.message);
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

  const getStatusColorClass = (inter: Intervention) => {
      switch(inter.status) {
          case 'Terminé': return inter.has_report ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700';
          case 'En cours': return 'bg-orange-100 text-orange-700';
          default: return 'bg-blue-100 text-blue-700';
      }
  };

  return (
    <div className="space-y-6 pb-20 relative">
      {showSuccessCelebration && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
             <div className="bg-white p-6 rounded-[2rem] text-center shadow-2xl animate-bounce border-4 border-orange-500 w-full max-w-xs">
                <PartyPopper size={40} className="text-orange-500 mx-auto mb-2" />
                <h2 className="text-lg font-black uppercase tracking-tight">RÉUSSI !</h2>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">L'action a été enregistrée.</p>
             </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between gap-4 px-1">
        <div>
          <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-gray-900">Techniciens 🛠️</h2>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Maintenance & Rapports</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setShowNewInterventionModal(true)} className="flex-1 md:flex-none bg-green-600 text-white px-4 py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><CalendarPlus size={14} /> Planifier</button>
            <button onClick={() => { setActiveInterventionForReport(null); setShowReportModal(true); }} className="flex-1 md:flex-none bg-orange-500 text-white px-4 py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"><Mic size={14} /> Nouveau Rapport</button>
        </div>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-1">
          <div className="relative">
            <input type="text" placeholder="Recherche client..." className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm font-bold text-sm outline-none border border-transparent focus:border-orange-500 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          </div>
          <div className="relative">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)} className="w-full pl-12 pr-10 py-4 bg-white rounded-2xl shadow-sm font-black text-[10px] outline-none appearance-none cursor-pointer uppercase tracking-widest text-gray-600 border border-transparent focus:border-orange-500 transition-all">
                <option value="Tous">📊 Tous les dossiers</option>
                <option value="En attente">⏳ En Attente</option>
                <option value="En cours">🛠️ En Cours</option>
                <option value="Terminé avec rapport">✅ Terminé + Rapport</option>
                <option value="Terminé sans rapport">❌ Terminé seul</option>
              </select>
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={20} />
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={18} />
          </div>
      </div>

      {/* Liste */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-1">
        {filteredInterventions.map((inter) => (
          <div key={inter.id} onClick={() => setViewIntervention(inter)} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover-lift relative overflow-hidden flex flex-col cursor-pointer transition-all">
            <div className="flex justify-between items-start mb-3">
              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColorClass(inter)}`}>
                {inter.status}
              </span>
              <button onClick={(e) => { e.stopPropagation(); handleOpenEdit(inter); }} className="p-2 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-lg active:bg-blue-50 transition-colors"><Edit size={14}/></button>
            </div>
            <h3 className="font-black text-xl mb-1 uppercase italic line-clamp-1">{inter.client}</h3>
            <div className="flex flex-col gap-1 mb-4">
                <p className="text-gray-400 text-[10px] font-bold flex items-center gap-1"><MapPin size={10}/> {inter.location}</p>
                <p className="text-orange-500 text-[9px] font-black uppercase flex items-center gap-1"><User size={10}/> {inter.technician}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4 flex-1 text-xs font-bold text-gray-600 line-clamp-2">{inter.description}</div>
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
               <div className="text-[9px] font-black uppercase text-gray-400 tracking-tighter">📅 {new Date(inter.date).toLocaleDateString()}</div>
               <button onClick={(e) => { e.stopPropagation(); handleOpenReportForIntervention(inter); }} className="p-2.5 bg-orange-500 text-white rounded-xl shadow-md flex items-center gap-2 active:scale-90 transition-transform"><Mic size={14} /><span className="text-[9px] font-black uppercase">Rapport</span></button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL RAPPORT VOCAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-[600] pointer-events-none flex items-center justify-center p-6">
           <div className="bg-white/95 backdrop-blur-3xl w-full max-w-sm rounded-[3.5rem] p-8 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.3)] relative border-b-[10px] border-orange-500 flex flex-col items-center animate-scale-in pointer-events-auto ring-1 ring-black/5">
              
              <button 
                onClick={() => { setShowReportModal(false); cleanupRecording(); setRecordingState('idle'); }} 
                className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full text-gray-400 active:bg-red-50 active:text-red-500 transition-all"
              >
                  <X size={20}/>
              </button>

              <div className="text-center mb-8 mt-2">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">Rapport Vocal</h3>
                  <p className="text-orange-500 font-bold text-[10px] uppercase mt-2 tracking-widest flex items-center justify-center gap-2 px-4 truncate">
                    {activeInterventionForReport ? <><CheckCircle2 size={12}/> {activeInterventionForReport.client}</> : 'Nouveau Rapport'}
                  </p>
              </div>

              <div className="relative flex flex-col items-center gap-8 py-4 w-full">
                  <div className="relative">
                      {recordingState === 'recording' && (
                          <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping scale-150"></div>
                      )}
                      <button 
                        onClick={handleMainButtonClick}
                        className={`w-36 h-36 md:w-44 md:h-44 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all active:scale-95 border-8 border-white
                          ${recordingState === 'recording' ? 'bg-red-500 text-white' : recordingState === 'review' ? 'bg-orange-500 text-white' : 'bg-gray-950 text-white'}`}
                      >
                          {recordingState === 'idle' && (
                              <div className="flex flex-col items-center">
                                  <Mic size={48} strokeWidth={2.5}/>
                                  <span className="text-[10px] font-black uppercase mt-3 tracking-widest">Lancer</span>
                              </div>
                          )}
                          {recordingState === 'recording' && (
                              <div className="flex flex-col items-center">
                                  <Square size={40} fill="white" />
                                  <span className="text-[10px] font-black uppercase mt-3 tracking-widest">Arrêter</span>
                              </div>
                          )}
                          {recordingState === 'review' && (
                              <div className="flex flex-col items-center">
                                  {isPlaying ? <Pause size={48} fill="white" /> : <Play size={48} fill="white" className="ml-2" />}
                                  <span className="text-[10px] font-black uppercase mt-3 tracking-widest">{isPlaying ? 'Lecture' : 'Réécoute'}</span>
                              </div>
                          )}
                      </button>
                  </div>

                  <div className="text-center">
                      <p className="text-6xl font-black font-mono text-gray-950 tabular-nums tracking-tighter leading-none">
                          {formatTime(recordingState === 'review' ? playbackTime : recordingDuration)}
                      </p>
                  </div>
              </div>

              {recordingState === 'review' && (
                <div className="w-full space-y-4 mt-8 animate-slide-up border-t border-gray-100 pt-8">
                   {!activeInterventionForReport && (
                        <div className="relative">
                            <select className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs border-2 border-transparent focus:border-orange-500 outline-none appearance-none uppercase tracking-wider" value={formReport.client} onChange={(e) => setFormReport({...formReport, client: e.target.value})}>
                                <option value="">Client...</option>
                                {interventions.filter(i => i.status !== 'Terminé').map(i => <option key={i.id} value={i.client}>{i.client}</option>)}
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16}/>
                        </div>
                   )}
                   <div className="flex gap-3">
                       <button onClick={() => { setRecordingState('idle'); cleanupRecording(); handleStartRecording(); }} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest active:bg-gray-200 flex items-center justify-center gap-2">
                           <RotateCcw size={14}/> Refaire
                       </button>
                       <button onClick={handleSubmitReport} disabled={isSaving} className="flex-[2] py-4 bg-gray-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex justify-center items-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
                        {isSaving ? <Loader2 className="animate-spin" size={14} /> : <SendHorizontal size={16}/>}
                        {isSaving ? 'ENVOI...' : 'TRANSMETTRE'}
                       </button>
                   </div>
                </div>
              )}
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
           </div>
        </div>
      )}

      {/* Modal Planification */}
      {showNewInterventionModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] p-6 md:p-10 shadow-2xl max-h-[92vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black uppercase italic tracking-tight text-gray-950">Nouvelle Mission</h3>
                  <button onClick={() => setShowNewInterventionModal(false)} className="p-3 bg-gray-100 rounded-full text-gray-500"><X size={20}/></button>
              </div>
              
              <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Client</label>
                        <div className="flex gap-2">
                            <select 
                                value={newCivility}
                                onChange={(e) => setNewCivility(e.target.value as Civility)}
                                className="bg-white rounded-xl font-bold text-xs px-2 outline-none border border-transparent focus:border-orange-500"
                            >
                                {civilityOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <input 
                                type="text" 
                                placeholder="Nom du client / raison sociale" 
                                className="w-full bg-transparent font-bold text-sm outline-none" 
                                value={newClientName} 
                                onChange={e => setNewClientName(e.target.value)}
                            />
                        </div>
                      </div>
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Téléphone</label>
                        <input type="text" placeholder="+225 XX XX XX XX" className="w-full bg-transparent font-bold text-sm outline-none" value={newIntervention.clientPhone} onChange={e => setNewIntervention({...newIntervention, clientPhone: e.target.value})}/>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1 block">Technicien (Chef de groupe)</label>
                        <select className="w-full bg-transparent font-black text-sm outline-none" value={newIntervention.technician} onChange={e => setNewIntervention({...newIntervention, technician: e.target.value})}>
                            <option value="">Choisir un technicien...</option>
                            {techniciansList.map(t => (
                              <option key={t.id} value={t.assignedName || t.name}>
                                {t.assignedName || t.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Date Intervention</label>
                        <input type="date" className="w-full bg-transparent font-bold text-sm outline-none" value={newIntervention.date} onChange={e => setNewIntervention({...newIntervention, date: e.target.value})}/>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Domaine</label>
                        <select className="w-full bg-transparent font-bold text-sm outline-none" value={newIntervention.domain} onChange={e => setNewIntervention({...newIntervention, domain: e.target.value as any})}>
                            <option value="Électricité">Électricité</option>
                            <option value="Plomberie">Plomberie</option>
                            <option value="Froid">Froid</option>
                            <option value="Bâtiment">Bâtiment</option>
                        </select>
                      </div>
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Type de mission</label>
                        <select className="w-full bg-transparent font-bold text-sm outline-none" value={newIntervention.interventionType} onChange={e => setNewIntervention({...newIntervention, interventionType: e.target.value as any})}>
                            <option value="Dépannage">Dépannage</option>
                            <option value="Installation">Installation</option>
                            <option value="Désinstallation">Désinstallation</option>
                            <option value="Entretien">Entretien</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Tuyauterie">Tuyauterie</option>
                            <option value="Appareillage">Appareillage</option>
                            <option value="Fillerie">Fillerie</option>
                            <option value="Rénovation">Rénovation</option>
                            <option value="Réhabilitation">Réhabilitation</option>
                            <option value="Expertise">Expertise</option>
                            <option value="Devis">Devis</option>
                        </select>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Site / Ville</label>
                        <select className="w-full bg-transparent font-bold text-sm outline-none" value={newIntervention.site} onChange={e => setNewIntervention({...newIntervention, site: e.target.value as any})}>
                            <option value="Abidjan">Abidjan</option>
                            <option value="Bouaké">Bouaké</option>
                            <option value="Korhogo">Korhogo</option>
                        </select>
                      </div>
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Lieu précis / Adresse</label>
                        <input type="text" placeholder="Ex: Cocody Riviera 3" className="w-full bg-transparent font-bold text-sm outline-none" value={newIntervention.location} onChange={e => setNewIntervention({...newIntervention, location: e.target.value})}/>
                      </div>
                  </div>

                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Instructions / Description</label>
                    <textarea placeholder="Détails de la mission..." className="w-full bg-transparent font-bold text-sm h-24 outline-none resize-none" value={newIntervention.description} onChange={e => setNewIntervention({...newIntervention, description: e.target.value})}/>
                  </div>

                  <button onClick={handleCreateIntervention} disabled={isSaving} className="w-full py-4 bg-gray-950 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest shadow-xl flex justify-center items-center gap-2 active:scale-95 transition-all disabled:opacity-50 mt-2">
                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CalendarPlus size={18}/>}
                    {isSaving ? 'EN COURS...' : 'CONFIRMER LA MISSION'}
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* Vue dossier */}
      {viewIntervention && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white w-full max-w-xl rounded-[3rem] p-8 md:p-10 shadow-2xl relative animate-slide-up">
                  <div className="flex justify-between items-start mb-6 text-gray-950">
                      <div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter">{viewIntervention.client}</h2>
                        <p className="text-orange-500 font-black uppercase text-[10px] mt-1 tracking-widest italic flex items-center gap-1"><User size={12}/> {viewIntervention.technician}</p>
                      </div>
                      <button onClick={() => setViewIntervention(null)} className="p-3 bg-gray-100 rounded-full active:bg-gray-200 transition-colors"><X size={20} /></button>
                  </div>
                  <div className="space-y-4">
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 font-bold text-blue-700 text-sm flex items-center gap-3"><Phone size={18}/> {viewIntervention.clientPhone || "Inconnu"}</div>
                      <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 text-gray-700 text-sm leading-relaxed font-medium min-h-[120px] max-h-[200px] overflow-y-auto whitespace-pre-wrap">{viewIntervention.description}</div>
                      <div className="flex gap-3 pt-4">
                          <button onClick={() => { handleOpenEdit(viewIntervention); setViewIntervention(null); }} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Modifier</button>
                          <button onClick={() => { handleOpenReportForIntervention(viewIntervention); setViewIntervention(null); }} className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg"><Mic size={18}/> Rapport</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Édition Complète */}
      {editIntervention && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 p-4 animate-fade-in backdrop-blur-sm">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] p-6 md:p-10 shadow-2xl animate-scale-in max-h-[92vh] overflow-y-auto">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-950">Modifier Mission</h3>
                  <button onClick={() => setEditIntervention(null)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
               </div>
               
               <div className="space-y-4">
                   <div className="bg-gray-900 p-4 rounded-2xl flex justify-between items-center">
                       <label className="text-white font-black uppercase text-xs tracking-widest">Statut Actuel</label>
                       <select 
                         value={editIntervention.status}
                         onChange={e => setEditIntervention({...editIntervention, status: e.target.value as any})}
                         className="bg-white text-gray-900 font-bold text-sm px-4 py-2 rounded-xl outline-none border-4 border-transparent focus:border-orange-500"
                       >
                           <option value="En attente">⏳ En Attente</option>
                           <option value="En cours">🛠️ En Cours</option>
                           <option value="Terminé">✅ Terminé</option>
                       </select>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Client</label>
                        <div className="flex gap-2">
                             <select 
                                value={editCivility}
                                onChange={(e) => setEditCivility(e.target.value as Civility)}
                                className="bg-white rounded-xl font-bold text-xs px-2 outline-none border border-transparent focus:border-orange-500"
                            >
                                {civilityOptions.map(opt => (
                                    <option key={opt} value={opt}>{opt}</option>
                                ))}
                            </select>
                            <input 
                                type="text" 
                                className="w-full bg-transparent font-bold text-sm outline-none" 
                                value={editClientName} 
                                onChange={e => setEditClientName(e.target.value)}
                            />
                        </div>
                      </div>
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Téléphone</label>
                        <input type="text" className="w-full bg-transparent font-bold text-sm outline-none" value={editIntervention.clientPhone || ''} onChange={e => setEditIntervention({...editIntervention, clientPhone: e.target.value})}/>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1 block">Technicien</label>
                        <select className="w-full bg-transparent font-black text-sm outline-none" value={editIntervention.technician} onChange={e => setEditIntervention({...editIntervention, technician: e.target.value})}>
                            <option value="">Choisir...</option>
                            {techniciansList.map(t => (
                              <option key={t.id} value={t.assignedName || t.name}>
                                {t.assignedName || t.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Date</label>
                        <input type="date" className="w-full bg-transparent font-bold text-sm outline-none" value={editIntervention.date} onChange={e => setEditIntervention({...editIntervention, date: e.target.value})}/>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Domaine</label>
                        <select className="w-full bg-transparent font-bold text-sm outline-none" value={editIntervention.domain || 'Électricité'} onChange={e => setEditIntervention({...editIntervention, domain: e.target.value as any})}>
                            <option value="Électricité">Électricité</option>
                            <option value="Plomberie">Plomberie</option>
                            <option value="Froid">Froid</option>
                            <option value="Bâtiment">Bâtiment</option>
                        </select>
                      </div>
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Type</label>
                        <select className="w-full bg-transparent font-bold text-sm outline-none" value={editIntervention.interventionType || 'Dépannage'} onChange={e => setEditIntervention({...editIntervention, interventionType: e.target.value as any})}>
                            <option value="Dépannage">Dépannage</option>
                            <option value="Installation">Installation</option>
                            <option value="Désinstallation">Désinstallation</option>
                            <option value="Entretien">Entretien</option>
                            <option value="Maintenance">Maintenance</option>
                            <option value="Tuyauterie">Tuyauterie</option>
                            <option value="Appareillage">Appareillage</option>
                            <option value="Fillerie">Fillerie</option>
                            <option value="Rénovation">Rénovation</option>
                            <option value="Réhabilitation">Réhabilitation</option>
                            <option value="Expertise">Expertise</option>
                            <option value="Devis">Devis</option>
                        </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Site</label>
                        <select className="w-full bg-transparent font-bold text-sm outline-none" value={editIntervention.site} onChange={e => setEditIntervention({...editIntervention, site: e.target.value as any})}>
                            <option value="Abidjan">Abidjan</option>
                            <option value="Bouaké">Bouaké</option>
                            <option value="Korhogo">Korhogo</option>
                        </select>
                      </div>
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Lieu précis</label>
                        <input type="text" className="w-full bg-transparent font-bold text-sm outline-none" value={editIntervention.location || ''} onChange={e => setEditIntervention({...editIntervention, location: e.target.value})}/>
                      </div>
                   </div>

                   <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Description</label>
                        <textarea className="w-full bg-transparent font-bold text-sm h-24 outline-none resize-none" value={editIntervention.description} onChange={e => setEditIntervention({...editIntervention, description: e.target.value})}/>
                   </div>

                   <button onClick={handleUpdateIntervention} disabled={isSaving} className="w-full py-4 bg-gray-950 text-white rounded-[1.5rem] font-black uppercase text-xs tracking-widest mt-4 shadow-xl flex items-center justify-center gap-2">
                     {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18}/>}
                     {isSaving ? 'ENREGISTREMENT...' : 'SAUVEGARDER LES MODIFICATIONS'}
                   </button>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Technicians;

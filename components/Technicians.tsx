
import React, { useState, useEffect, useRef } from 'react';
import { Intervention, Site, Employee } from '../types';
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
  User
} from 'lucide-react';

interface TechniciansProps {
  initialData?: Intervention[];
}

type StatusFilterType = 'Tous' | 'En attente' | 'En cours' | 'Terminé avec rapport' | 'Terminé sans rapport';

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
  const [celebrationMessage, setCelebrationMessage] = useState({ title: 'ENVOYÉ !', sub: 'Ton travail est bien enregistré.' });
  
  const [formReport, setFormReport] = useState({ client: '', workDone: '' });
  const [newIntervention, setNewIntervention] = useState({
    client: '',
    clientPhone: '',
    domain: 'Électricité' as 'Électricité' | 'Bâtiment' | 'Froid' | 'Plomberie',
    interventionType: 'Dépannage' as any,
    description: '',
    location: '',
    site: 'Abidjan' as Site,
    technician: '',
    date: new Date().toISOString().split('T')[0]
  });

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
        setRecordingState('review');
      };

      mediaRecorder.start();
      setRecordingState('recording');
      setRecordingDuration(0);
      
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = window.setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      alert("Erreur micro : vérifiez les permissions.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
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
        alert("Erreur : " + err.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    const target = activeInterventionForReport || interventions.find(i => i.client === formReport.client);
    if (!target || !audioBlob) {
        alert("Erreur : L'audio n'est pas prêt.");
        return;
    }
    
    setIsSaving(true);
    try {
      const fileName = `report_${target.id}_${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice_reports')
        .upload(fileName, audioBlob);
      
      if (uploadError) throw uploadError;

      const { error } = await supabase
        .from('interventions')
        .update({ 
            status: 'Terminé', 
            has_report: true, 
            description: formReport.workDone 
                ? `${formReport.workDone}\n(Audio: ${uploadData.path})` 
                : `Rapport vocal enregistré le ${new Date().toLocaleDateString()}`
        })
        .eq('id', target.id);
      
      if (error) throw error;

      triggerCelebration('RAPPORT TRANSMIS !', 'L\'intervention est maintenant terminée.');
      setShowReportModal(false);
      setRecordingState('idle');
      setAudioBlob(null);
      setAudioUrl(null);
    } catch (err: any) {
      alert("Erreur de soumission : " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateIntervention = async () => {
    if (!newIntervention.client || !newIntervention.description || !newIntervention.technician) {
      alert("Veuillez remplir le client, la description et choisir un technicien.");
      return;
    }
    setIsSaving(true);
    const id = `INT-${Math.floor(Math.random() * 9000) + 1000}`;
    try {
      const { error } = await supabase.from('interventions').insert([{
        id,
        ...newIntervention,
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
        technician: '',
        date: new Date().toISOString().split('T')[0]
      });
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
    <div className="space-y-6 pb-20">
      {showSuccessCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
             <div className="bg-white p-8 rounded-[2.5rem] text-center shadow-2xl animate-bounce border-4 border-orange-500 max-w-[80%]">
                <PartyPopper size={48} className="text-orange-500 mx-auto mb-4" />
                <h2 className="text-xl font-black uppercase tracking-tight">{celebrationMessage.title}</h2>
                <p className="text-sm text-gray-500 font-bold uppercase mt-1">{celebrationMessage.sub}</p>
             </div>
        </div>
      )}

      {/* Header compact mobile */}
      <div className="flex flex-col md:flex-row justify-between gap-4 px-1">
        <div>
          <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter">Techniciens 🛠️</h2>
          <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Maintenance & Rapports</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setShowNewInterventionModal(true)} className="flex-1 md:flex-none bg-green-600 text-white px-4 py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg"><CalendarPlus size={14} /> Planifier</button>
            <button onClick={() => { setActiveInterventionForReport(null); setShowReportModal(true); }} className="flex-1 md:flex-none bg-orange-500 text-white px-4 py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 shadow-lg"><Mic size={14} /> Rapport</button>
        </div>
      </div>

      {/* Recherche & Filtre ajustés */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 px-1">
          <div className="relative">
            <input type="text" placeholder="Recherche client..." className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl shadow-sm font-bold text-sm outline-none border border-transparent focus:border-orange-500" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
          </div>
          <div className="relative">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)} className="w-full pl-12 pr-10 py-4 bg-white rounded-2xl shadow-sm font-black text-[10px] outline-none appearance-none cursor-pointer uppercase tracking-widest text-gray-600">
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

      {/* Grid de cartes optimisée */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 px-1">
        {filteredInterventions.map((inter) => (
          <div key={inter.id} onClick={() => setViewIntervention(inter)} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover-lift relative overflow-hidden flex flex-col cursor-pointer">
            <div className="flex justify-between items-start mb-3">
              <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColorClass(inter)}`}>
                {inter.status}
              </span>
              <button onClick={(e) => { e.stopPropagation(); setEditIntervention(inter); }} className="p-2 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-lg"><Edit size={14}/></button>
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

      {/* MODAL RAPPORT VOCAL AJUSTÉ ET CENTRÉ (Compact Mobile) */}
      {showReportModal && (
        <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in">
           <div className="bg-white w-full max-w-lg md:rounded-[3rem] rounded-t-[3rem] p-6 md:p-10 shadow-2xl relative border-b-[8px] border-orange-500 flex flex-col items-center animate-slide-up">
              <button 
                onClick={() => { setShowReportModal(false); setRecordingState('idle'); setAudioBlob(null); setAudioUrl(null); }} 
                className="absolute top-4 right-4 p-2.5 bg-gray-100 rounded-full text-gray-500 active:scale-90"
              >
                  <X size={20}/>
              </button>

              <div className="text-center mb-6 mt-2">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">Rapport Vocal</h3>
                  <p className="text-orange-500 font-bold text-[10px] uppercase mt-1 tracking-widest flex items-center justify-center gap-1">
                    {activeInterventionForReport ? <><CheckCircle2 size={12}/> {activeInterventionForReport.client}</> : 'Rapport Libre'}
                  </p>
              </div>

              <div className="relative flex flex-col items-center justify-center gap-6 py-6 w-full">
                  <div className="relative flex items-center justify-center">
                      {recordingState === 'recording' && (
                          <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping scale-125"></div>
                      )}
                      
                      <button 
                        onClick={recordingState === 'idle' ? handleStartRecording : recordingState === 'recording' ? handleStopRecording : handleTogglePlayback}
                        className={`w-32 h-32 md:w-40 md:h-40 rounded-full flex flex-col items-center justify-center shadow-2xl transition-all active:scale-95
                          ${recordingState === 'recording' ? 'bg-red-500 scale-105' : recordingState === 'review' ? 'bg-orange-500' : 'bg-gray-900 hover:bg-orange-500'}`}
                      >
                          {recordingState === 'idle' && (
                              <div className="flex flex-col items-center text-white">
                                  <Mic size={40} />
                                  <span className="text-[8px] font-black uppercase mt-2 tracking-widest">Cliquer</span>
                              </div>
                          )}
                          {recordingState === 'recording' && (
                              <div className="flex flex-col items-center text-white">
                                  <Square size={36} />
                                  <span className="text-[8px] font-black uppercase mt-2 tracking-widest">Arrêter</span>
                              </div>
                          )}
                          {recordingState === 'review' && (
                              <div className="flex flex-col items-center text-white">
                                  {isPlaying ? <Pause size={40} /> : <Play size={40} />}
                                  <span className="text-[8px] font-black uppercase mt-2 tracking-widest">{isPlaying ? 'Lecture' : 'Réécouter'}</span>
                              </div>
                          )}
                      </button>
                  </div>

                  <div className="text-center">
                      <p className="text-4xl md:text-6xl font-black font-mono text-gray-950 tabular-nums">
                          {formatTime(recordingState === 'review' ? playbackTime : recordingDuration)}
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        {recordingState === 'recording' && <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>}
                        <p className="text-gray-400 font-bold uppercase text-[9px] tracking-widest">
                            {recordingState === 'recording' ? 'Enregistrement...' : recordingState === 'review' ? 'Prêt' : 'Prêt'}
                        </p>
                      </div>
                  </div>
              </div>

              {recordingState === 'review' && (
                <div className="w-full space-y-3 mt-4 animate-slide-up">
                   {!activeInterventionForReport && (
                        <select className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs border-2 border-transparent focus:border-orange-500 outline-none" value={formReport.client} onChange={(e) => setFormReport({...formReport, client: e.target.value})}>
                            <option value="">Client concerné...</option>
                            {interventions.filter(i => i.status !== 'Terminé').map(i => <option key={i.id} value={i.client}>{i.client}</option>)}
                        </select>
                   )}
                   <div className="flex gap-2">
                       <button onClick={() => { setRecordingState('idle'); setAudioBlob(null); handleStartRecording(); }} className="flex-1 py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-[10px] tracking-widest active:bg-gray-200">
                           Refaire
                       </button>
                       <button onClick={handleSubmitReport} disabled={isSaving} className="flex-[2] py-4 bg-gray-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl flex justify-center items-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
                        {isSaving ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={16}/>}
                        {isSaving ? 'ENVOI...' : 'TRANSMETTRE'}
                       </button>
                   </div>
                </div>
              )}
              {audioUrl && <audio ref={audioPreviewRef} src={audioUrl} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} onTimeUpdate={(e) => setPlaybackTime(e.currentTarget.currentTime)} className="hidden" />}
           </div>
        </div>
      )}

      {/* FORMULAIRE DE PLANIFICATION AJUSTÉ (Compact Mobile) */}
      {showNewInterventionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-black/70 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-6 md:p-10 shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-black uppercase italic tracking-tight">Nouveau Chantier</h3>
                  <button onClick={() => setShowNewInterventionModal(false)} className="p-2.5 bg-gray-100 rounded-full text-gray-500 active:bg-red-50"><X size={18}/></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Client Info */}
                  <div className="space-y-4">
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Client</label>
                        <input type="text" placeholder="Nom du client" className="w-full bg-transparent font-bold text-sm outline-none" value={newIntervention.client} onChange={e => setNewIntervention({...newIntervention, client: e.target.value})}/>
                      </div>
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Contact</label>
                        <input type="text" placeholder="+225 ..." className="w-full bg-transparent font-bold text-sm outline-none" value={newIntervention.clientPhone} onChange={e => setNewIntervention({...newIntervention, clientPhone: e.target.value})}/>
                      </div>
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Lieu</label>
                        <input type="text" placeholder="Adresse" className="w-full bg-transparent font-bold text-sm outline-none" value={newIntervention.location} onChange={e => setNewIntervention({...newIntervention, location: e.target.value})}/>
                      </div>
                  </div>

                  {/* Tech Details */}
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Domaine</label>
                            <select className="w-full bg-transparent font-bold text-[10px] outline-none" value={newIntervention.domain} onChange={e => setNewIntervention({...newIntervention, domain: e.target.value as any})}>
                                <option value="Électricité">Élec.</option>
                                <option value="Bâtiment">Bât.</option>
                                <option value="Froid">Froid</option>
                                <option value="Plomberie">Plomb.</option>
                            </select>
                        </div>
                        <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Date</label>
                            <input type="date" className="w-full bg-transparent font-bold text-[10px] outline-none" value={newIntervention.date} onChange={e => setNewIntervention({...newIntervention, date: e.target.value})}/>
                        </div>
                      </div>
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Site Principal</label>
                        <select className="w-full bg-transparent font-bold text-xs outline-none" value={newIntervention.site} onChange={e => setNewIntervention({...newIntervention, site: e.target.value as any})}>
                            <option value="Abidjan">Abidjan</option>
                            <option value="Bouaké">Bouaké</option>
                            <option value="Korhogo">Korhogo</option>
                        </select>
                      </div>
                      <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Type d'intervention</label>
                        <select className="w-full bg-transparent font-bold text-xs outline-none" value={newIntervention.interventionType} onChange={e => setNewIntervention({...newIntervention, interventionType: e.target.value as any})}>
                            <option value="Dépannage">Dépannage</option>
                            <option value="Installation">Installation</option>
                            <option value="Entretien">Entretien</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                      </div>
                  </div>
              </div>

              {/* Assignment & Desc */}
              <div className="mt-6 space-y-4 pt-4 border-t border-gray-50">
                  <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                    <label className="text-[9px] font-black text-orange-600 uppercase tracking-widest mb-1.5 block">Technicien assigné</label>
                    <select className="w-full bg-transparent font-black text-sm outline-none text-gray-800" value={newIntervention.technician} onChange={e => setNewIntervention({...newIntervention, technician: e.target.value})}>
                        <option value="">Sélectionner...</option>
                        {techniciansList.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                  
                  <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">Description des travaux</label>
                    <textarea placeholder="Instructions..." className="w-full bg-transparent font-bold text-sm h-24 outline-none resize-none" value={newIntervention.description} onChange={e => setNewIntervention({...newIntervention, description: e.target.value})}/>
                  </div>
                  
                  <button onClick={handleCreateIntervention} disabled={isSaving} className="w-full py-4 bg-gray-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl flex justify-center items-center gap-2 active:scale-95 transition-all disabled:opacity-50">
                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CalendarPlus size={18}/>}
                    {isSaving ? 'EN COURS...' : 'VALIDER LA PLANIFICATION'}
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* Vue d'un dossier optimisée */}
      {viewIntervention && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
              <div className="bg-white w-full max-w-xl rounded-[2.5rem] p-6 md:p-10 shadow-2xl relative animate-slide-up">
                  <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter">{viewIntervention.client}</h2>
                        <p className="text-orange-500 font-black uppercase text-[10px] mt-1 tracking-widest italic flex items-center gap-1"><User size={12}/> {viewIntervention.technician}</p>
                      </div>
                      <button onClick={() => setViewIntervention(null)} className="p-2 bg-gray-100 rounded-full active:bg-gray-200"><X size={18} /></button>
                  </div>
                  <div className="space-y-4">
                      <div className="flex gap-2">
                         <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg font-black text-[8px] uppercase">{viewIntervention.interventionType}</span>
                         <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-lg font-black text-[8px] uppercase">{viewIntervention.domain}</span>
                      </div>
                      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 font-bold text-blue-700 text-sm flex items-center gap-3"><Phone size={18}/> {viewIntervention.clientPhone || "Non renseigné"}</div>
                      <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 text-gray-700 text-sm leading-relaxed font-medium min-h-[100px]">{viewIntervention.description}</div>
                      <div className="flex gap-2 pt-2">
                          <button onClick={() => { setEditIntervention(viewIntervention); setViewIntervention(null); }} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest">Modifier</button>
                          <button onClick={() => { handleOpenReportForIntervention(viewIntervention); setViewIntervention(null); }} className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"><Mic size={16}/> Rapport</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Édition Statut/Tech ajustée */}
      {editIntervention && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 animate-fade-in">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-scale-in">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black uppercase italic tracking-tighter">Statut & Technicien</h3>
                  <button onClick={() => setEditIntervention(null)} className="p-2 bg-gray-50 rounded-full"><X size={18}/></button>
               </div>
               <div className="space-y-5">
                   <div className="grid grid-cols-1 gap-2">
                       {['En attente', 'En cours', 'Terminé'].map((s) => (
                           <button key={s} onClick={() => setEditIntervention({...editIntervention, status: s as any})} className={`w-full p-4 rounded-2xl font-black uppercase text-[10px] tracking-widest border-2 transition-all ${editIntervention.status === s ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-400'}`}>{s}</button>
                       ))}
                   </div>
                   <div className="pt-4 border-t border-gray-100">
                       <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Réassigner l'agent</label>
                       <select className="w-full p-4 bg-gray-50 rounded-2xl font-black text-xs outline-none border-2 border-transparent focus:border-orange-500 appearance-none" value={editIntervention.technician} onChange={e => setEditIntervention({...editIntervention, technician: e.target.value})}>
                            {techniciansList.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                       </select>
                   </div>
                   <button onClick={handleUpdateIntervention} disabled={isSaving} className="w-full py-4 bg-gray-950 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest mt-2 active:scale-95 transition-all">
                     {isSaving ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Valider'}
                   </button>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Technicians;

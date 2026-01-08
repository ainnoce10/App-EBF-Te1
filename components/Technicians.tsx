
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
  User,
  RefreshCw
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
             <div className="bg-white p-10 rounded-[3rem] text-center shadow-2xl animate-bounce border-8 border-orange-500">
                <PartyPopper size={64} className="text-orange-500 mx-auto mb-4" />
                <h2 className="text-3xl font-black uppercase">{celebrationMessage.title}</h2>
                <p className="text-xl text-gray-500 font-bold uppercase mt-2">{celebrationMessage.sub}</p>
             </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter">Techniciens 🛠️</h2>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">Maintenance & Rapports vocaux</p>
        </div>
        <div className="flex gap-2">
            <button onClick={() => setShowNewInterventionModal(true)} className="bg-green-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg"><CalendarPlus size={18} /> Planifier</button>
            <button onClick={() => { setActiveInterventionForReport(null); setShowReportModal(true); }} className="bg-orange-500 text-white px-6 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg"><Mic size={18} /> Rapport Rapide</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <input type="text" placeholder="Rechercher un client..." className="w-full pl-14 pr-4 py-5 bg-white rounded-[2rem] shadow-sm font-black text-xl outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
          </div>
          <div className="relative">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)} className="w-full pl-14 pr-12 py-5 bg-white rounded-[2rem] shadow-sm font-black text-xl outline-none appearance-none cursor-pointer uppercase text-xs tracking-widest">
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
          <div key={inter.id} onClick={() => setViewIntervention(inter)} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 hover-lift relative overflow-hidden flex flex-col cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getStatusColorClass(inter)}`}>
                {inter.status}
              </span>
              <button onClick={(e) => { e.stopPropagation(); setEditIntervention(inter); }} className="p-2.5 bg-gray-50 text-gray-400 hover:text-blue-600 rounded-xl"><Edit size={16}/></button>
            </div>
            <h3 className="font-black text-2xl mb-1 uppercase italic">{inter.client}</h3>
            <p className="text-gray-400 text-xs font-black mb-1 flex items-center gap-1"><MapPin size={12}/> {inter.location}</p>
            <p className="text-orange-500 text-[10px] font-black uppercase mb-4 flex items-center gap-1"><User size={12}/> {inter.technician}</p>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6 flex-1 text-sm font-bold text-gray-600 line-clamp-3">{inter.description}</div>
            <div className="flex items-center justify-between pt-5 border-t border-gray-100">
               <div className="text-[10px] font-black uppercase text-gray-400">📅 {new Date(inter.date).toLocaleDateString()}</div>
               <button onClick={(e) => { e.stopPropagation(); handleOpenReportForIntervention(inter); }} className="p-2.5 bg-orange-500 text-white rounded-xl shadow-md flex items-center gap-2"><Mic size={16} /><span className="text-[10px] font-black uppercase">Rapport</span></button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL RAPPORT VOCAL CENTRÉ OPTIMISÉ MOBILE */}
      {showReportModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-xl animate-fade-in">
           <div className="bg-white w-full h-full md:h-auto md:max-w-xl md:rounded-[4rem] flex flex-col items-center justify-center p-10 relative overflow-hidden">
              {/* Bouton de fermeture */}
              <button 
                onClick={() => { setShowReportModal(false); setRecordingState('idle'); setAudioBlob(null); setAudioUrl(null); }} 
                className="absolute top-10 right-10 p-4 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors active:scale-90"
              >
                  <X size={32}/>
              </button>

              <div className="text-center mb-16">
                  <h3 className="text-4xl font-black uppercase italic tracking-tighter">Rapport Vocal</h3>
                  <p className="text-orange-500 font-bold text-sm uppercase mt-4 tracking-widest flex items-center justify-center gap-2">
                    {activeInterventionForReport ? <><CheckCircle2 size={16}/> {activeInterventionForReport.client}</> : 'Rapport Libre'}
                  </p>
              </div>

              {/* ZONE CENTRALE D'ENREGISTREMENT */}
              <div className="relative flex flex-col items-center justify-center gap-12 w-full">
                  <div className="relative flex items-center justify-center">
                      {/* Animation d'onde pulsante */}
                      {recordingState === 'recording' && (
                          <div className="absolute inset-0 bg-red-500/30 rounded-full animate-ping scale-150"></div>
                      )}
                      
                      <button 
                        onClick={recordingState === 'idle' ? handleStartRecording : recordingState === 'recording' ? handleStopRecording : handleTogglePlayback}
                        className={`w-56 h-56 md:w-64 md:h-64 rounded-full flex flex-col items-center justify-center shadow-[0_20px_60px_rgba(0,0,0,0.2)] transition-all duration-300 active:scale-95
                          ${recordingState === 'recording' ? 'bg-red-500 scale-110' : recordingState === 'review' ? 'bg-orange-500' : 'bg-gray-900 hover:bg-orange-500'}`}
                      >
                          {recordingState === 'idle' && (
                              <div className="flex flex-col items-center text-white">
                                  <Mic size={80} />
                                  <span className="text-xs font-black uppercase mt-4 tracking-[0.2em]">Cliquer pour parler</span>
                              </div>
                          )}
                          {recordingState === 'recording' && (
                              <div className="flex flex-col items-center text-white">
                                  <Square size={70} />
                                  <span className="text-xs font-black uppercase mt-4 tracking-[0.2em]">Arrêter</span>
                              </div>
                          )}
                          {recordingState === 'review' && (
                              <div className="flex flex-col items-center text-white">
                                  {isPlaying ? <Pause size={80} /> : <Play size={80} />}
                                  <span className="text-xs font-black uppercase mt-4 tracking-[0.2em]">{isPlaying ? 'En lecture' : 'Réécouter'}</span>
                              </div>
                          )}
                      </button>
                  </div>

                  <div className="text-center">
                      <p className="text-7xl md:text-8xl font-black font-mono text-gray-950 tabular-nums">
                          {formatTime(recordingState === 'review' ? playbackTime : recordingDuration)}
                      </p>
                      <div className="flex items-center justify-center gap-3 mt-4">
                        {recordingState === 'recording' && <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>}
                        <p className="text-gray-400 font-bold uppercase text-sm tracking-[0.25em]">
                            {recordingState === 'recording' ? 'Enregistrement...' : recordingState === 'review' ? 'Prêt pour validation' : 'Attente Micro'}
                        </p>
                      </div>
                  </div>
              </div>

              {/* ACTIONS FINALES */}
              {recordingState === 'review' && (
                <div className="w-full max-w-sm space-y-6 mt-16 animate-slide-up">
                   {!activeInterventionForReport && (
                        <select className="w-full p-5 bg-gray-50 rounded-3xl font-black text-sm border-2 border-transparent focus:border-orange-500 outline-none shadow-inner" value={formReport.client} onChange={(e) => setFormReport({...formReport, client: e.target.value})}>
                            <option value="">Sélectionner le client concerné...</option>
                            {interventions.filter(i => i.status !== 'Terminé').map(i => <option key={i.id} value={i.client}>{i.client}</option>)}
                        </select>
                   )}
                   <div className="flex gap-4">
                       <button onClick={() => { setRecordingState('idle'); setAudioBlob(null); handleStartRecording(); }} className="flex-1 py-6 bg-gray-100 text-gray-400 rounded-3xl font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
                           <RefreshCw size={18}/> Refaire
                       </button>
                       <button onClick={handleSubmitReport} disabled={isSaving} className="flex-[2] py-6 bg-gray-950 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl flex justify-center items-center gap-3 disabled:opacity-50 active:scale-95 transition-all">
                        {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24}/>}
                        {isSaving ? 'ENVOI...' : 'TRANSMETTRE'}
                       </button>
                   </div>
                </div>
              )}
              {audioUrl && <audio ref={audioPreviewRef} src={audioUrl} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} onTimeUpdate={(e) => setPlaybackTime(e.currentTarget.currentTime)} className="hidden" />}
           </div>
        </div>
      )}

      {/* FORMULAIRE DE PLANIFICATION COMPLET RÉTABLI */}
      {showNewInterventionModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-10">
                  <h3 className="text-3xl font-black uppercase italic tracking-tight">Nouveau Dossier Chantier</h3>
                  <button onClick={() => setShowNewInterventionModal(false)} className="p-3 bg-gray-100 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors"><X size={24}/></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Colonne 1 : Client */}
                  <div className="space-y-6">
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Client / Entreprise</label>
                        <input type="text" placeholder="Nom complet" className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-orange-500 outline-none" value={newIntervention.client} onChange={e => setNewIntervention({...newIntervention, client: e.target.value})}/>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Contact Téléphonique</label>
                        <input type="text" placeholder="+225 ..." className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-orange-500 outline-none" value={newIntervention.clientPhone} onChange={e => setNewIntervention({...newIntervention, clientPhone: e.target.value})}/>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Lieu / Commune</label>
                        <input type="text" placeholder="Adresse précise" className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-orange-500 outline-none" value={newIntervention.location} onChange={e => setNewIntervention({...newIntervention, location: e.target.value})}/>
                      </div>
                  </div>

                  {/* Colonne 2 : Technique */}
                  <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Domaine</label>
                            <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs appearance-none cursor-pointer" value={newIntervention.domain} onChange={e => setNewIntervention({...newIntervention, domain: e.target.value as any})}>
                                <option value="Électricité">Électricité</option>
                                <option value="Bâtiment">Bâtiment</option>
                                <option value="Froid">Froid</option>
                                <option value="Plomberie">Plomberie</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Type</label>
                            <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs appearance-none cursor-pointer" value={newIntervention.interventionType} onChange={e => setNewIntervention({...newIntervention, interventionType: e.target.value as any})}>
                                <option value="Dépannage">Dépannage</option>
                                <option value="Installation">Installation</option>
                                <option value="Entretien">Entretien</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Devis">Devis / Expertise</option>
                            </select>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Site Principal</label>
                        <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold appearance-none cursor-pointer" value={newIntervention.site} onChange={e => setNewIntervention({...newIntervention, site: e.target.value as any})}>
                            <option value="Abidjan">Abidjan</option>
                            <option value="Bouaké">Bouaké</option>
                            <option value="Korhogo">Korhogo</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Date de début</label>
                        <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-orange-500 outline-none" value={newIntervention.date} onChange={e => setNewIntervention({...newIntervention, date: e.target.value})}/>
                      </div>
                  </div>
              </div>

              {/* Attribution & Description */}
              <div className="mt-10 pt-10 border-t border-gray-100 space-y-8">
                  <div className="bg-orange-50 p-6 rounded-[2.5rem] border-2 border-orange-100">
                    <label className="text-sm font-black text-orange-600 uppercase tracking-wider ml-1 mb-3 block italic">Technicien en charge (Obligatoire)</label>
                    <select className="w-full p-5 bg-white text-gray-900 rounded-2xl font-black shadow-sm border-2 border-transparent focus:border-orange-500 outline-none appearance-none cursor-pointer" value={newIntervention.technician} onChange={e => setNewIntervention({...newIntervention, technician: e.target.value})}>
                        <option value="">-- Sélectionner l'agent concerné --</option>
                        {techniciansList.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Détails des travaux à réaliser</label>
                    <textarea placeholder="Instructions spécifiques pour le technicien..." className="w-full p-5 bg-gray-50 rounded-3xl font-bold h-36 border-2 border-transparent focus:border-orange-500 outline-none resize-none" value={newIntervention.description} onChange={e => setNewIntervention({...newIntervention, description: e.target.value})}/>
                  </div>
                  
                  <button onClick={handleCreateIntervention} disabled={isSaving} className="w-full py-6 bg-gray-950 text-white rounded-[2.5rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl flex justify-center items-center gap-3 active:scale-95 transition-all disabled:opacity-50">
                    {isSaving ? <Loader2 className="animate-spin" /> : <CalendarPlus size={24}/>}
                    {isSaving ? 'PLANIFICATION EN COURS...' : 'VALIDER LA PLANIFICATION'}
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* Visualisation rapide d'un dossier */}
      {viewIntervention && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-fade-in">
              <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl overflow-hidden animate-slide-up relative">
                  <div className="flex justify-between items-start mb-8">
                      <div>
                        <h2 className="text-4xl font-black uppercase italic leading-none tracking-tighter">{viewIntervention.client}</h2>
                        <p className="text-orange-500 font-black uppercase text-xs mt-3 tracking-widest italic flex items-center gap-2"><User size={14}/> {viewIntervention.technician}</p>
                      </div>
                      <button onClick={() => setViewIntervention(null)} className="p-3 bg-gray-100 rounded-full hover:bg-red-50 hover:text-red-500 transition-colors"><X /></button>
                  </div>
                  <div className="space-y-6">
                      <div className="flex gap-2">
                         <span className="px-4 py-1 bg-blue-50 text-blue-600 rounded-xl font-black text-[10px] uppercase border border-blue-100">{viewIntervention.interventionType}</span>
                         <span className="px-4 py-1 bg-gray-50 text-gray-500 rounded-xl font-black text-[10px] uppercase border border-gray-100">{viewIntervention.domain}</span>
                      </div>
                      <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 font-bold text-blue-700 flex items-center gap-3"><Phone size={20}/> {viewIntervention.clientPhone || "Non renseigné"}</div>
                      <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 text-gray-700 leading-relaxed font-medium text-lg min-h-[150px]">{viewIntervention.description}</div>
                      <div className="flex gap-4">
                          <button onClick={() => { setEditIntervention(viewIntervention); setViewIntervention(null); }} className="flex-1 py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-lg">Modifier</button>
                          <button onClick={() => { handleOpenReportForIntervention(viewIntervention); setViewIntervention(null); }} className="flex-1 py-5 bg-orange-500 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-lg flex items-center justify-center gap-2"><Mic size={18}/> Rapport</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Édition du statut et technicien */}
      {editIntervention && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 animate-fade-in">
           <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
               <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">Modifier Dossier</h3>
                  <button onClick={() => setEditIntervention(null)} className="p-2 bg-gray-50 rounded-full"><X size={20}/></button>
               </div>
               <div className="space-y-6">
                   <div className="grid grid-cols-1 gap-2">
                       {['En attente', 'En cours', 'Terminé'].map((s) => (
                           <button key={s} onClick={() => setEditIntervention({...editIntervention, status: s as any})} className={`w-full p-5 rounded-2xl font-black uppercase text-xs tracking-widest border-2 transition-all ${editIntervention.status === s ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-400'}`}>{s}</button>
                       ))}
                   </div>
                   <div className="pt-4 border-t border-gray-100">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block italic">Réassigner l'agent</label>
                       <select className="w-full p-5 bg-gray-50 rounded-2xl font-black text-sm outline-none border-2 border-transparent focus:border-orange-500 appearance-none cursor-pointer" value={editIntervention.technician} onChange={e => setEditIntervention({...editIntervention, technician: e.target.value})}>
                            {techniciansList.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                       </select>
                   </div>
                   <button onClick={handleUpdateIntervention} disabled={isSaving} className="w-full py-5 bg-gray-950 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest mt-4 shadow-xl active:scale-95 transition-all">
                     {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Sauvegarder les modifications'}
                   </button>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Technicians;

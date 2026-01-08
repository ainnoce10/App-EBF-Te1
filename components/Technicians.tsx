
import React, { useState, useEffect, useRef } from 'react';
import { Intervention, Site } from '../types';
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
      // Forcer la récupération des dernières données
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      // Passage immédiat en mode review pour UI réactive
      setRecordingState('review');
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
        alert("Erreur : L'audio n'est pas prêt. Veuillez réessayer l'enregistrement.");
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
    if (!newIntervention.client || !newIntervention.description) return;
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
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilterType)} className="w-full pl-14 pr-12 py-5 bg-white rounded-[2rem] shadow-sm font-black text-xl outline-none appearance-none cursor-pointer uppercase">
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
            <p className="text-gray-400 text-xs font-black mb-4 flex items-center gap-1"><MapPin size={12}/> {inter.location}</p>
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-6 flex-1 text-sm font-bold text-gray-600 line-clamp-3">{inter.description}</div>
            <div className="flex items-center justify-between pt-5 border-t border-gray-100">
               <div className="text-[10px] font-black uppercase text-gray-400">📅 {new Date(inter.date).toLocaleDateString()}</div>
               <button onClick={(e) => { e.stopPropagation(); handleOpenReportForIntervention(inter); }} className="p-2.5 bg-orange-500 text-white rounded-xl shadow-md flex items-center gap-2"><Mic size={16} /><span className="text-[10px] font-black uppercase">Rapport</span></button>
            </div>
          </div>
        ))}
      </div>

      {showReportModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 shadow-2xl relative border-b-[12px] border-orange-500">
              <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-3xl font-black uppercase italic">Rapport Vocal</h3>
                    <p className="text-orange-500 font-bold text-[10px] uppercase mt-2">{activeInterventionForReport ? `Client : ${activeInterventionForReport.client}` : 'Rapport Rapide'}</p>
                  </div>
                  <button onClick={() => { setShowReportModal(false); setRecordingState('idle'); setAudioBlob(null); setAudioUrl(null); }} className="p-3 bg-gray-100 rounded-full"><X size={24}/></button>
              </div>

              <div className="flex flex-col items-center gap-8 py-6">
                  <div className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all ${recordingState === 'recording' ? 'bg-red-500 scale-110 animate-pulse' : 'bg-orange-500 hover:scale-105'}`}>
                      {recordingState === 'idle' && <button onClick={handleStartRecording} className="text-white flex flex-col items-center"><Mic size={48} /><span className="text-[10px] font-black uppercase mt-1">Enregistrer</span></button>}
                      {recordingState === 'recording' && <button onClick={handleStopRecording} className="text-white flex flex-col items-center"><Square size={40} /><span className="text-[10px] font-black uppercase mt-1">Arrêter</span></button>}
                      {recordingState === 'review' && <button onClick={handleTogglePlayback} className="text-white flex flex-col items-center">{isPlaying ? <Pause size={48} /> : <Play size={48} />}<span className="text-[10px] font-black uppercase mt-1">Écouter</span></button>}
                  </div>
                  <div className="text-center">
                      <p className="text-5xl font-black font-mono text-gray-950">{formatTime(recordingState === 'review' ? playbackTime : recordingDuration)}</p>
                      <p className="text-gray-400 font-bold uppercase text-[10px] mt-2 tracking-widest">{recordingState === 'recording' ? 'Enregistrement...' : recordingState === 'review' ? 'Prêt pour envoi' : 'Cliquer pour parler'}</p>
                  </div>
              </div>

              {recordingState === 'review' && (
                <div className="space-y-4 pt-4 border-t border-gray-100 animate-fade-in">
                   {!activeInterventionForReport && (
                        <select className="w-full p-4 bg-gray-50 rounded-2xl font-black text-sm" value={formReport.client} onChange={(e) => setFormReport({...formReport, client: e.target.value})}>
                            <option value="">Sélectionner le client...</option>
                            {interventions.filter(i => i.status !== 'Terminé').map(i => <option key={i.id} value={i.client}>{i.client}</option>)}
                        </select>
                   )}
                   <button onClick={handleSubmitReport} disabled={isSaving} className="w-full py-5 bg-gray-950 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-xl flex justify-center items-center gap-3 disabled:opacity-50 active:scale-95">
                     {isSaving ? <Loader2 className="animate-spin" /> : <CheckCircle2 size={24}/>}
                     {isSaving ? 'ENVOI...' : 'TRANSMETTRE'}
                   </button>
                </div>
              )}
              {audioUrl && <audio ref={audioPreviewRef} src={audioUrl} onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onEnded={() => setIsPlaying(false)} onTimeUpdate={(e) => setPlaybackTime(e.currentTarget.currentTime)} className="hidden" />}
           </div>
        </div>
      )}

      {showNewInterventionModal && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl">
              <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-black uppercase italic">Nouveau Chantier</h3>
                  <button onClick={() => setShowNewInterventionModal(false)} className="p-2 bg-gray-100 rounded-full"><X/></button>
              </div>
              <div className="space-y-4">
                  <input type="text" placeholder="Client" className="w-full p-4 bg-gray-50 rounded-2xl font-bold" value={newIntervention.client} onChange={e => setNewIntervention({...newIntervention, client: e.target.value})}/>
                  <textarea placeholder="Description" className="w-full p-4 bg-gray-50 rounded-2xl font-bold h-32" value={newIntervention.description} onChange={e => setNewIntervention({...newIntervention, description: e.target.value})}/>
                  <button onClick={handleCreateIntervention} disabled={isSaving} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase">Valider</button>
              </div>
           </div>
        </div>
      )}

      {viewIntervention && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-6">
              <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl overflow-hidden animate-slide-up">
                  <div className="flex justify-between items-start mb-6">
                      <h2 className="text-4xl font-black uppercase italic">{viewIntervention.client}</h2>
                      <button onClick={() => setViewIntervention(null)} className="p-3 bg-gray-100 rounded-full"><X /></button>
                  </div>
                  <div className="space-y-6">
                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 font-bold text-blue-700 flex items-center gap-2"><Phone size={18}/> {viewIntervention.clientPhone || "Non renseigné"}</div>
                      <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 text-gray-700 leading-relaxed font-medium">{viewIntervention.description}</div>
                      <div className="flex gap-4">
                          <button onClick={() => { setEditIntervention(viewIntervention); setViewIntervention(null); }} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase text-xs">Modifier</button>
                          <button onClick={() => { handleOpenReportForIntervention(viewIntervention); setViewIntervention(null); }} className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-black uppercase text-xs">Rapport Vocal</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {editIntervention && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
           <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl">
               <div className="flex justify-between mb-6"><h3 className="text-xl font-black uppercase italic">Modifier Statut</h3><button onClick={() => setEditIntervention(null)}><X/></button></div>
               <div className="space-y-4">
                   {['En attente', 'En cours', 'Terminé'].map((s) => (
                       <button key={s} onClick={() => setEditIntervention({...editIntervention, status: s as any})} className={`w-full p-4 rounded-xl font-bold border-2 transition-all ${editIntervention.status === s ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-100 text-gray-500'}`}>{s}</button>
                   ))}
                   <button onClick={handleUpdateIntervention} disabled={isSaving} className="w-full py-4 bg-gray-900 text-white rounded-xl font-black uppercase mt-4">Sauvegarder</button>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Technicians;

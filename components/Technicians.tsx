
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
  Save,
  CheckCircle2,
  Clock,
  AlertCircle,
  Navigation,
  FileText
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

  const handleOpenReportForIntervention = (inter: Intervention) => {
      setActiveInterventionForReport(inter);
      setFormReport({ client: inter.client, workDone: '', status: 'Terminé' });
      setRecordingState('idle');
      setRecordingDuration(0);
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
        triggerCelebration('MIS À JOUR !', 'Le statut a été modifié.');
        setEditIntervention(null);
    } catch (err: any) {
        alert("Erreur de mise à jour : " + err.message);
    } finally {
        setIsSaving(false);
    }
  };

  const handleSubmitReport = async () => {
    const target = activeInterventionForReport || interventions.find(i => i.client === formReport.client);
    if (!target) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('interventions')
        .update({ 
            status: 'Terminé', 
            has_report: true, 
            description: formReport.workDone || `Rapport vocal du ${new Date().toLocaleDateString()}` 
        })
        .eq('id', target.id);
      
      if (error) throw error;
      triggerCelebration('REPORTÉ !', 'Le rapport a été mis à jour.');
      setShowReportModal(false);
      setActiveInterventionForReport(null);
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
        technician: 'À assigner',
        status: 'En attente',
        has_report: false
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
                <h2 className="text-3xl font-black">{celebrationMessage.title}</h2>
                <p className="text-xl text-gray-500 font-bold">{celebrationMessage.sub}</p>
             </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-800 tracking-tight">Techniciens 🛠️</h2>
          <p className="text-gray-500 font-medium">Suivi des interventions et rapports vocaux</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
            <button onClick={() => setShowNewInterventionModal(true)} className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] md:text-xs flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
              <CalendarPlus size={18} /> Planifier
            </button>
            <button onClick={() => { setActiveInterventionForReport(null); setShowReportModal(true); }} className="flex-1 md:flex-none bg-orange-500 hover:bg-orange-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] md:text-xs flex items-center justify-center gap-2 shadow-lg pulse-soft transition-all active:scale-95">
              <Mic size={18} /> Vocal Rapide
            </button>
        </div>
      </div>

      <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un client..."
              className="w-full pl-14 pr-4 py-4 md:py-5 border-4 border-white rounded-[2rem] shadow-sm font-black text-lg md:text-xl outline-none focus:border-orange-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
          </div>

          {/* FILTRES PAR STATUT */}
          <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar pb-2">
              <button 
                onClick={() => setStatusFilter('Tous')}
                className={`px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all whitespace-nowrap border-2
                    ${statusFilter === 'Tous' ? 'bg-gray-900 border-gray-900 text-white shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-gray-200'}
                `}
              >
                Tous
              </button>
              <button 
                onClick={() => setStatusFilter('En attente')}
                className={`px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all whitespace-nowrap border-2
                    ${statusFilter === 'En attente' ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-blue-100 text-blue-500 hover:bg-blue-50'}
                `}
              >
                En Attente
              </button>
              <button 
                onClick={() => setStatusFilter('En cours')}
                className={`px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all whitespace-nowrap border-2
                    ${statusFilter === 'En cours' ? 'bg-orange-500 border-orange-500 text-white shadow-md' : 'bg-white border-orange-100 text-orange-600 hover:bg-orange-50'}
                `}
              >
                En Cours
              </button>
              <button 
                onClick={() => setStatusFilter('Terminé avec rapport')}
                className={`px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all whitespace-nowrap border-2
                    ${statusFilter === 'Terminé avec rapport' ? 'bg-green-600 border-green-600 text-white shadow-md' : 'bg-white border-green-100 text-green-600 hover:bg-green-50'}
                `}
              >
                Terminé + Rapport
              </button>
              <button 
                onClick={() => setStatusFilter('Terminé sans rapport')}
                className={`px-5 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all whitespace-nowrap border-2
                    ${statusFilter === 'Terminé sans rapport' ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-white border-red-100 text-red-500 hover:bg-red-50'}
                `}
              >
                Terminé SANS Rapport
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInterventions.map((inter) => (
          <div key={inter.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 hover-lift relative group overflow-hidden flex flex-col">
            <div className="flex justify-between items-start mb-4">
              <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-colors shadow-sm ${getStatusColorClass(inter)}`}>
                {getStatusDisplay(inter)}
              </span>
              <div className="flex gap-2">
                  <button 
                    onClick={() => setEditIntervention(inter)}
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
                        <a href={`tel:${inter.clientPhone}`} className="flex items-center gap-1.5 text-blue-600 text-xs font-black hover:underline group-hover:translate-x-1 transition-transform">
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
               
               <div className="flex flex-col items-end gap-2">
                   <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-xl border border-gray-200">
                       <User size={14} className="text-gray-400" />
                       <span className="text-[10px] font-black uppercase text-gray-600 tracking-tighter">{inter.technician}</span>
                       
                       {/* BOUTON RAPPORT VOCAL SPÉCIFIQUE */}
                       {inter.technician === 'À assigner' && (
                           <button 
                                onClick={() => handleOpenReportForIntervention(inter)}
                                className="ml-2 bg-orange-500 hover:bg-orange-600 text-white p-1.5 rounded-lg transition-all active:scale-95 shadow-md flex items-center gap-1.5"
                                title="Faire le rapport vocal"
                           >
                               <Mic size={14} />
                               <span className="text-[9px] font-black uppercase">Rapport</span>
                           </button>
                       )}
                   </div>
               </div>
            </div>

            {/* SI DÉJÀ UN RAPPORT - INDICATEUR VISUEL */}
            {inter.has_report && (
                <div className="absolute top-1/2 -right-8 rotate-45 bg-green-500 text-white px-10 py-1 text-[8px] font-black uppercase tracking-widest shadow-lg">Rapport Ok</div>
            )}
          </div>
        ))}
        {filteredInterventions.length === 0 && (
            <div className="col-span-full py-24 text-center bg-white/50 rounded-[3rem] border-4 border-dashed border-gray-200 flex flex-col items-center justify-center animate-pulse">
                <Search size={64} className="text-gray-200 mb-6" />
                <h4 className="text-2xl font-black text-gray-300 uppercase tracking-tighter">Aucune intervention trouvée</h4>
                <p className="text-gray-300 font-bold uppercase text-xs mt-2 tracking-widest">Essayez de modifier vos filtres ou la recherche</p>
            </div>
        )}
      </div>

      {/* --- MODAL EDITION STATUT --- */}
      {editIntervention && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="bg-white w-full rounded-t-[2.5rem] md:rounded-[3rem] p-8 md:p-10 animate-slide-up max-w-lg mx-auto shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
               <div className="flex justify-between items-center mb-8">
                   <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic border-l-8 border-orange-500 pl-4 leading-none">Modifier Intervention</h3>
                   <button onClick={() => setEditIntervention(null)} className="p-3 bg-gray-100 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"><X size={24}/></button>
               </div>

               <div className="space-y-6">
                   {/* STATUS SELECTOR */}
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
                                   <p className="text-[10px] text-gray-400 font-bold tracking-tight">Dossier créé, technicien à confirmer</p>
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
                                   <p className="text-[10px] text-gray-400 font-bold tracking-tight">Technicien sur site ou travaux débutés</p>
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
                                   <p className={`font-black uppercase text-sm ${editIntervention.status === 'Terminé' ? 'text-green-700' : 'text-gray-500'}`}>Exécuté / Terminé</p>
                                   <p className="text-[10px] text-gray-400 font-bold tracking-tight">Travaux finalisés et validés</p>
                               </div>
                               <CheckCircle2 className={`ml-auto ${editIntervention.status === 'Terminé' ? 'text-green-500' : 'text-gray-300'}`} size={20} />
                           </button>
                       </div>
                   </div>

                   {/* TECHNICIAN & DETAILS */}
                   <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Technicien</label>
                           <input 
                             type="text" 
                             value={editIntervention.technician} 
                             onChange={(e) => setEditIntervention({...editIntervention, technician: e.target.value})}
                             className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-gray-300 transition-all"
                           />
                       </div>
                       <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date</label>
                           <input 
                             type="date" 
                             value={editIntervention.date} 
                             onChange={(e) => setEditIntervention({...editIntervention, date: e.target.value})}
                             className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-gray-300 transition-all"
                           />
                       </div>
                   </div>
                   
                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lieu précis</label>
                       <input
                           type="text" 
                           value={editIntervention.location || ''} 
                           onChange={(e) => setEditIntervention({...editIntervention, location: e.target.value})}
                           className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-gray-300 transition-all"
                       />
                   </div>

                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone Client</label>
                       <input
                           type="tel" 
                           value={editIntervention.clientPhone || ''} 
                           onChange={(e) => setEditIntervention({...editIntervention, clientPhone: e.target.value})}
                           className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-gray-300 transition-all"
                       />
                   </div>

                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                       <textarea 
                           value={editIntervention.description} 
                           onChange={(e) => setEditIntervention({...editIntervention, description: e.target.value})}
                           className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-gray-300 h-24 resize-none transition-all"
                       />
                   </div>

                   <button 
                     onClick={handleUpdateIntervention} 
                     disabled={isSaving}
                     className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-black transition-all active:scale-95"
                   >
                       {isSaving ? <Loader2 className="animate-spin"/> : <Save size={20} />}
                       {isSaving ? 'Mise à jour...' : 'Sauvegarder les modifications'}
                   </button>
               </div>
           </div>
        </div>
      )}

      {/* MODAL REPORT VOCAL (LIÉ À UNE INTERVENTION OU GÉNÉRIQUE) */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-10 animate-scale-in shadow-2xl relative overflow-hidden border-b-[12px] border-orange-500">
              <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Rapport Vocal</h3>
                    <p className="text-orange-500 font-bold text-[10px] uppercase tracking-widest mt-2">{activeInterventionForReport ? `Pour : ${activeInterventionForReport.client}` : 'Compte-rendu général'}</p>
                  </div>
                  <button onClick={() => { setShowReportModal(false); setActiveInterventionForReport(null); }} className="p-3 bg-gray-100 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all shadow-sm"><X size={24}/></button>
              </div>

              <div className="flex flex-col items-center gap-10 py-10 relative">
                  <div className={`w-40 h-40 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer relative z-10 
                    ${recordingState === 'recording' ? 'bg-red-500 scale-110' : 'bg-orange-500 hover:scale-105'}`}>
                      {recordingState === 'recording' && (
                          <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-20"></div>
                      )}
                      {recordingState === 'idle' ? (
                        <button onClick={handleStartRecording} className="text-white flex flex-col items-center"><Mic size={64} /><span className="text-[10px] font-black uppercase mt-1">Démarrer</span></button>
                      ) : recordingState === 'recording' ? (
                        <button onClick={handleStopRecording} className="text-white flex flex-col items-center"><Square size={48} /><span className="text-[10px] font-black uppercase mt-1">Arrêter</span></button>
                      ) : (
                        <button onClick={handleTogglePlayback} className="text-white flex flex-col items-center">{isPlaying ? <Pause size={64} /> : <Play size={64} />}<span className="text-[10px] font-black uppercase mt-1">{isPlaying ? 'Pause' : 'Lire'}</span></button>
                      )}
                  </div>
                  
                  <div className="text-center">
                      <p className="text-6xl font-black font-mono tracking-tighter text-gray-950">
                        {formatTime(recordingState === 'review' ? playbackTime : recordingDuration)}
                      </p>
                      <p className="text-gray-400 font-bold uppercase text-[10px] mt-4 tracking-widest flex items-center justify-center gap-2">
                          {recordingState === 'recording' ? (
                              <> <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/> ENREGISTREMENT EN COURS...</>
                          ) : recordingState === 'review' ? (
                              <> <FileText size={14}/> RÉÉCOUTE DU RAPPORT</>
                          ) : 'PRÊT POUR LE VOCAL'}
                      </p>
                  </div>
              </div>

              {recordingState === 'review' && (
                <div className="space-y-5 animate-fade-in pt-4">
                   {!activeInterventionForReport && (
                        <div className="space-y-2">
                             <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sélectionner Client</label>
                             <select 
                                className="w-full p-5 bg-gray-50 rounded-2xl font-black text-sm outline-none border-2 border-transparent focus:border-orange-500 transition-all appearance-none"
                                value={formReport.client}
                                onChange={(e) => setFormReport({...formReport, client: e.target.value})}
                            >
                                <option value="">Choisir...</option>
                                {interventions.filter(i => i.status !== 'Terminé').map(i => <option key={i.id} value={i.client}>{i.client}</option>)}
                            </select>
                        </div>
                   )}
                   <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Notes textuelles (Optionnel)</label>
                       <textarea 
                         placeholder="Résumé rapide du travail..."
                         className="w-full p-5 bg-gray-50 rounded-2xl font-bold text-sm outline-none border-2 border-transparent focus:border-orange-500 h-24 resize-none transition-all"
                         value={formReport.workDone}
                         onChange={(e) => setFormReport({...formReport, workDone: e.target.value})}
                       />
                   </div>
                   <button 
                     onClick={handleSubmitReport} 
                     disabled={isSaving || (!activeInterventionForReport && !formReport.client)}
                     className="w-full py-6 bg-gray-950 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl flex justify-center items-center gap-3 hover:bg-black transition-all disabled:opacity-50 active:scale-95"
                   >
                     {isSaving ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle2 size={24}/>}
                     {isSaving ? 'TRANSMISSION...' : 'TRANSMETTRE AU BUREAU'}
                   </button>
                </div>
              )}
           </div>
        </div>
      )}

      {/* MODAL NOUVELLE INTERVENTION */}
      {showNewInterventionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
           <div className="bg-white w-full max-w-2xl rounded-[3.5rem] p-8 md:p-12 animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl border-t-[12px] border-green-600">
              <div className="flex justify-between items-center mb-10">
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Planifier Intervention</h3>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Nouveau dossier technique</p>
                  </div>
                  <button onClick={() => setShowNewInterventionModal(false)} className="p-3 bg-gray-100 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"><X size={24}/></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Client Name */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Client / Entreprise</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input type="text" placeholder="Ex: Société Ivoire" className="w-full pl-12 p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-green-500 transition-all shadow-inner" value={newIntervention.client} onChange={e => setNewIntervention({...newIntervention, client: e.target.value})}/>
                    </div>
                  </div>

                  {/* Client Phone */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Numéro Client</label>
                    <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input type="tel" placeholder="+225..." className="w-full pl-12 p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-green-500 transition-all shadow-inner" value={newIntervention.clientPhone} onChange={e => setNewIntervention({...newIntervention, clientPhone: e.target.value})}/>
                    </div>
                  </div>

                  {/* Domain */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Domaine</label>
                    <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-green-500 transition-all appearance-none" value={newIntervention.domain} onChange={e => setNewIntervention({...newIntervention, domain: e.target.value as any})}>
                        <option value="Électricité">⚡ Électricité</option>
                        <option value="Bâtiment">🏠 Bâtiment</option>
                        <option value="Froid">❄️ Froid & Clim</option>
                        <option value="Plomberie">💧 Plomberie</option>
                    </select>
                  </div>

                  {/* Intervention Type */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nature Travaux</label>
                    <select className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-green-500 transition-all appearance-none" value={newIntervention.interventionType} onChange={e => setNewIntervention({...newIntervention, interventionType: e.target.value as any})}>
                        <option value="Dépannage">Dépannage</option>
                        <option value="Installation">Installation</option>
                        <option value="Désinstallation">Désinstallation</option>
                        <option value="Entretien">Entretien</option>
                        <option value="Tuyauterie">Tuyauterie</option>
                        <option value="Appareillage">Appareillage</option>
                        <option value="Fillerie">Fillerie</option>
                        <option value="Rénovation">Rénovation</option>
                        <option value="Réhabilitation">Réhabilitation</option>
                        <option value="Expertise">Expertise</option>
                        <option value="Devis">Devis</option>
                        <option value="Maintenance">Maintenance</option>
                    </select>
                  </div>

                  {/* Site d'intervention */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Site EBF</label>
                    <div className="flex gap-2">
                        {(['Abidjan', 'Bouaké', 'Korhogo'] as Site[]).map(s => (
                            <button 
                                key={s} 
                                onClick={() => setNewIntervention({...newIntervention, site: s})}
                                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-tighter transition-all border-2 ${newIntervention.site === s ? 'bg-orange-500 border-orange-500 text-white shadow-md' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Date d'Intervention</label>
                    <input type="date" className="w-full p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-green-500 transition-all shadow-inner" value={newIntervention.date} onChange={e => setNewIntervention({...newIntervention, date: e.target.value})}/>
                  </div>

                  {/* Location */}
                  <div className="col-span-full space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Lieu Exact</label>
                    <div className="relative">
                        <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                        <input 
                            type="text" 
                            placeholder="Ex: Plateau, face à l'Immeuble Postel" 
                            className="w-full pl-12 p-4 bg-gray-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-green-500 transition-all shadow-inner"
                            value={newIntervention.location} 
                            onChange={e => setNewIntervention({...newIntervention, location: e.target.value})}
                        />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="col-span-full space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description Technique</label>
                    <textarea 
                        placeholder="Quels sont les travaux à effectuer ?" 
                        className="w-full p-5 bg-gray-50 rounded-3xl font-bold outline-none border-2 border-transparent focus:border-green-500 transition-all h-28 resize-none shadow-inner" 
                        value={newIntervention.description} 
                        onChange={e => setNewIntervention({...newIntervention, description: e.target.value})} 
                    />
                  </div>

                  <button 
                    onClick={handleCreateIntervention} 
                    disabled={isSaving} 
                    className="col-span-full mt-4 py-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-4"
                  >
                      {isSaving ? <Loader2 className="animate-spin" size={24}/> : <CalendarPlus size={24} />}
                      {isSaving ? 'PLANIFICATION EN COURS...' : 'VALIDER LA PLANIFICATION'}
                  </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Technicians;

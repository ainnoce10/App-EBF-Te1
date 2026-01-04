
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
  Trash2,
  PartyPopper,
  ChevronRight,
  CalendarPlus,
  Save,
  Zap,
  Home,
  Snowflake,
  Loader2
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
    domain: 'Électricité' as const,
    interventionType: 'Dépannage',
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
             <div className="bg-white p-10 rounded-[3rem] flex flex-col items-center border-8 border-orange-500 animate-bounce text-center">
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
            <button onClick={() => setShowNewInterventionModal(true)} className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg">
              <CalendarPlus size={18} /> Nouveau
            </button>
            <button onClick={() => setShowReportModal(true)} className="bg-orange-500 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs flex items-center gap-2 shadow-lg pulse-soft">
              <Mic size={18} /> Vocal
            </button>
        </div>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Rechercher client..."
          className="w-full pl-14 pr-4 py-4 border-4 border-white rounded-[2rem] shadow-sm font-bold outline-none focus:border-orange-500 transition-all"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={24} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInterventions.map((inter) => (
          <div key={inter.id} className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 hover-lift relative group">
            <div className="flex justify-between mb-4">
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${inter.status === 'Terminé' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{inter.status}</span>
              <span className="text-[10px] text-gray-300 font-mono">#{inter.id.split('-')[1]}</span>
            </div>
            <h3 className="font-black text-xl mb-2">{inter.client}</h3>
            <p className="text-gray-500 text-sm mb-6 line-clamp-2">{inter.description}</p>
            <div className="flex items-center gap-4 pt-4 border-t border-gray-50 text-[10px] font-black uppercase text-gray-400">
               <div className="flex items-center gap-1"><MapPin size={12}/> {inter.site}</div>
               <div className="flex items-center gap-1"><Calendar size={12}/> {new Date(inter.date).toLocaleDateString()}</div>
            </div>
            <button 
                onClick={() => { setFormReport({ ...formReport, client: inter.client }); setShowReportModal(true); }} 
                className="absolute bottom-4 right-4 p-3 bg-gray-50 rounded-2xl text-orange-500 opacity-0 group-hover:opacity-100
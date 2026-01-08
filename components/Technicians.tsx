
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

  const handleCreateIntervention = async
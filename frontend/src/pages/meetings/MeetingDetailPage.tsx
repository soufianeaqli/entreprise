import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import {
  ArrowLeft, RefreshCw, Calendar, Clock, MapPin, Video, Users,
  Trash2, CheckCircle2, FileText, AlertTriangle, XCircle, Paperclip,
} from 'lucide-react';
import { api, type Meeting } from '@/services/api';

const TYPE_LABELS: Record<string, string> = {
  regular: 'Réunion', weekly: 'Hebdomadaire', monthly: 'Mensuelle',
  special: 'Spéciale', training: 'Formation', evaluation: 'Évaluation',
};
const STATUS_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
  scheduled: 'info', in_progress: 'warning', completed: 'success', cancelled: 'danger',
};
const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Planifiée', in_progress: 'En cours', completed: 'Terminée', cancelled: 'Annulée',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [minutesForm, setMinutesForm] = useState({
    minutes_objective: '', minutes_summary: '', minutes_key_points: '', minutes_notes: '',
  });
  const [savingMinutes, setSavingMinutes] = useState(false);
  const [minutesSaved, setMinutesSaved] = useState(false);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.meetings.get(Number(id));
      setMeeting(data);
      setMinutesForm({
        minutes_objective: data.minutes_objective || '',
        minutes_summary: data.minutes_summary || '',
        minutes_key_points: data.minutes_key_points || '',
        minutes_notes: data.minutes_notes || '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleStatusChange = async (status: string) => {
    if (!meeting) return;
    try {
      const updated = await api.meetings.updateStatus(meeting.id, status);
      setMeeting(updated);
    } catch {}
  };

  const handleDelete = async () => {
    if (!meeting) return;
    try {
      await api.meetings.delete(meeting.id);
      navigate('/meetings');
    } catch {}
  };

  const handleSaveMinutes = async () => {
    if (!meeting) return;
    setSavingMinutes(true);
    setMinutesSaved(false);
    try {
      const updated = await api.meetings.updateMinutes(meeting.id, minutesForm);
      setMeeting(updated);
      setMinutesSaved(true);
      setTimeout(() => setMinutesSaved(false), 3000);
    } catch {} finally {
      setSavingMinutes(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-96"><RefreshCw className="w-6 h-6 text-primary-500 animate-spin" /></div>;
  }

  if (error || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-surface-500">{error || 'Réunion non trouvée'}</p>
        <Button onClick={() => navigate('/meetings')} variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>Retour</Button>
      </div>
    );
  }

  const hasMinutes = meeting.minutes_objective || meeting.minutes_summary || meeting.minutes_key_points || meeting.minutes_notes;

  return (
    <div className="space-y-6">
      <PageHeader
        title={meeting.title}
        description={`${TYPE_LABELS[meeting.type] || meeting.type} — ${meeting.date}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/meetings')}>Retour</Button>
            {meeting.status === 'scheduled' && <Button variant="outline" icon={<CheckCircle2 className="w-4 h-4" />} onClick={() => handleStatusChange('completed')}>Terminer</Button>}
            {meeting.status === 'scheduled' && <Button variant="outline" icon={<XCircle className="w-4 h-4" />} onClick={() => handleStatusChange('cancelled')}>Annuler</Button>}
            <Button variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteConfirm(true)}>Supprimer</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Informations générales</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={<Calendar className="w-4 h-4" />} label="Date" value={meeting.date} />
              <InfoItem icon={<Clock className="w-4 h-4" />} label="Heure" value={`${meeting.start_time} — ${meeting.end_time}`} />
              <InfoItem icon={<MapPin className="w-4 h-4" />} label="Lieu" value={meeting.location || '—'} />
              <InfoItem icon={<Video className="w-4 h-4" />} label="Lien" value={meeting.meeting_link || '—'} />
              <div className="col-span-2">
                <div className="flex items-center gap-2 text-surface-500 mb-1"><FileText className="w-4 h-4" /><span className="text-xs font-medium">Description</span></div>
                <p className="text-sm text-surface-900">{meeting.description || '—'}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-surface-100 pt-4">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Participants ({meeting.participants?.length ?? 0})</h3>
            {meeting.participants && meeting.participants.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {meeting.participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                    <Avatar name={p.full_name} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-surface-900">{p.full_name}</p>
                      <p className="text-xs text-surface-500">{p.matricule}</p>
                    </div>
                    <Badge variant={p.pivot_status === 'accepted' ? 'success' : p.pivot_status === 'declined' ? 'danger' : 'info'} className="ml-auto text-xs">
                      {p.pivot_status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-surface-400">Aucun participant</p>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-surface-900">Statut</h3>
              <Badge variant={STATUS_VARIANT[meeting.status] || 'info'} dot>{STATUS_LABELS[meeting.status]}</Badge>
            </div>
            <div className="space-y-3">
              <InfoItem icon={<AlertTriangle className="w-4 h-4" />} label="Priorité" value={meeting.priority} />
              {meeting.department && <InfoItem icon={<FileText className="w-4 h-4" />} label="Département" value={meeting.department.name} />}
              {meeting.rh_manager && <InfoItem icon={<Users className="w-4 h-4" />} label="Responsable" value={meeting.rh_manager.full_name} />}
            </div>
          </Card>

          {meeting.attachments && meeting.attachments.length > 0 && (
            <Card>
              <h3 className="text-lg font-semibold text-surface-900 mb-3">Pièces jointes</h3>
              <div className="space-y-2">
                {meeting.attachments.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 p-2 bg-surface-50 rounded-lg">
                    <Paperclip className="w-4 h-4 text-surface-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-surface-900 truncate">{a.original_name}</p>
                      <p className="text-xs text-surface-400">{formatFileSize(a.size)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-surface-900">Compte rendu</h3>
          <div className="flex items-center gap-3">
            {minutesSaved && <span className="text-sm text-emerald-600 font-medium">Enregistré</span>}
            <Button size="sm" onClick={handleSaveMinutes} disabled={savingMinutes}>{savingMinutes ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Objectif</label>
            <textarea className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:outline-none hover:border-surface-300 transition-all" rows={2} placeholder="Objectif de la réunion..." value={minutesForm.minutes_objective} onChange={(e) => setMinutesForm((f) => ({ ...f, minutes_objective: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Résumé</label>
            <textarea className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:outline-none hover:border-surface-300 transition-all" rows={3} placeholder="Résumé de la réunion..." value={minutesForm.minutes_summary} onChange={(e) => setMinutesForm((f) => ({ ...f, minutes_summary: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Points importants</label>
            <textarea className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:outline-none hover:border-surface-300 transition-all" rows={3} placeholder="Points importants discutés..." value={minutesForm.minutes_key_points} onChange={(e) => setMinutesForm((f) => ({ ...f, minutes_key_points: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Notes</label>
            <textarea className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:outline-none hover:border-surface-300 transition-all" rows={4} placeholder="Notes libres..." value={minutesForm.minutes_notes} onChange={(e) => setMinutesForm((f) => ({ ...f, minutes_notes: e.target.value }))} />
          </div>
        </div>

        {hasMinutes && (
          <div className="mt-6 pt-6 border-t border-surface-100">
            <h4 className="text-sm font-semibold text-surface-900 mb-4">Compte rendu enregistré</h4>
            <div className="space-y-4 bg-surface-50 rounded-xl p-5">
              {meeting.minutes_objective && (
                <MinutesBlock label="Objectif" value={meeting.minutes_objective} />
              )}
              {meeting.minutes_summary && (
                <MinutesBlock label="Résumé" value={meeting.minutes_summary} />
              )}
              {meeting.minutes_key_points && (
                <MinutesBlock label="Points importants" value={meeting.minutes_key_points} />
              )}
              {meeting.minutes_notes && (
                <MinutesBlock label="Notes" value={meeting.minutes_notes} />
              )}
            </div>
          </div>
        )}
      </Card>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Supprimer la réunion" size="sm">
        <p className="text-sm text-surface-600 mb-6">Êtes-vous sûr de vouloir supprimer <strong>{meeting.title}</strong> ?</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-surface-500 mb-1">{icon}<span className="text-xs font-medium">{label}</span></div>
      <p className="text-sm font-medium text-surface-900">{value}</p>
    </div>
  );
}

function MinutesBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-surface-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-surface-900 whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}

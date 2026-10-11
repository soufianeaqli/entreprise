import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft, RefreshCw, Briefcase, MapPin, Users, Clock, Calendar,
  GraduationCap, Star, Banknote,
  CheckCircle, Building2, User,
} from 'lucide-react';
import { api, type Recruitment } from '@/services/api';

const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 0 }).format(n);

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' | 'default' }> = {
  published: { label: 'Publiée', variant: 'success' },
  draft: { label: 'Brouillon', variant: 'warning' },
  closed: { label: 'Fermée', variant: 'danger' },
  archived: { label: 'Archivée', variant: 'default' },
};

const workModeLabels: Record<string, string> = {
  presentiel: 'Présentiel',
  hybride: 'Hybride',
  teletravail: 'Télétravail',
};

export default function RecruitmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [recruitment, setRecruitment] = useState<Recruitment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecruitment = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.recruitments.get(Number(id));
      setRecruitment(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecruitment(); }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (error || !recruitment) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-surface-500">{error || 'Offre introuvable'}</p>
        <Button onClick={() => navigate('/recruitments')} variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>Retour</Button>
      </div>
    );
  }

  const s = statusMap[recruitment.status] || { label: recruitment.status, variant: 'default' as const };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/recruitments')} />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-surface-900">{recruitment.title}</h1>
          <p className="text-sm text-surface-500">{recruitment.department?.name || 'Département non défini'} · {recruitment.contract_type}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={s.variant} dot>{s.label}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="flex items-center gap-3">
          <Users className="w-5 h-5 text-primary-500" />
          <div>
            <p className="text-lg font-bold text-surface-900">{recruitment.applications_count}</p>
            <p className="text-xs text-surface-500">Candidatures reçues</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <Briefcase className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-lg font-bold text-surface-900">{recruitment.positions_count}</p>
            <p className="text-xs text-surface-500">Postes à pourvoir</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <Banknote className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-lg font-bold text-surface-900">{recruitment.salary ? `${fmt(recruitment.salary)} MAD` : 'Non défini'}</p>
            <p className="text-xs text-surface-500">Salaire proposé</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-orange-500" />
          <div>
            <p className="text-lg font-bold text-surface-900">{recruitment.deadline || '—'}</p>
            <p className="text-xs text-surface-500">Date limite</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-surface-400" />
            <div>
              <p className="text-surface-500">Localisation</p>
              <p className="font-medium text-surface-900">{recruitment.location || 'Non définie'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-surface-400" />
            <div>
              <p className="text-surface-500">Mode de travail</p>
              <p className="font-medium text-surface-900">{workModeLabels[recruitment.work_mode] || recruitment.work_mode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-surface-400" />
            <div>
              <p className="text-surface-500">Expérience</p>
              <p className="font-medium text-surface-900">{recruitment.experience_level || 'Non définie'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-surface-400" />
            <div>
              <p className="text-surface-500">Études</p>
              <p className="font-medium text-surface-900">{recruitment.education_level || 'Non défini'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-surface-400" />
            <div>
              <p className="text-surface-500">Publication</p>
              <p className="font-medium text-surface-900">{recruitment.posted_date || '—'}</p>
            </div>
          </div>
          {recruitment.rh_manager && (
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-surface-400" />
              <div>
                <p className="text-surface-500">RH responsable</p>
                <p className="font-medium text-surface-900">{recruitment.rh_manager.full_name}</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {recruitment.description && (
          <Card>
            <CardHeader><CardTitle>Présentation du poste</CardTitle></CardHeader>
            <p className="text-sm text-surface-700 whitespace-pre-line">{recruitment.description}</p>
          </Card>
        )}
        {recruitment.missions && (
          <Card>
            <CardHeader><CardTitle>Missions principales</CardTitle></CardHeader>
            <p className="text-sm text-surface-700 whitespace-pre-line">{recruitment.missions}</p>
          </Card>
        )}
        {recruitment.skills && (
          <Card>
            <CardHeader><CardTitle>Compétences requises</CardTitle></CardHeader>
            <p className="text-sm text-surface-700 whitespace-pre-line">{recruitment.skills}</p>
          </Card>
        )}
        {recruitment.qualifications && (
          <Card>
            <CardHeader><CardTitle>Qualifications</CardTitle></CardHeader>
            <p className="text-sm text-surface-700 whitespace-pre-line">{recruitment.qualifications}</p>
          </Card>
        )}
        {recruitment.benefits && (
          <Card>
            <CardHeader><CardTitle>Avantages</CardTitle></CardHeader>
            <p className="text-sm text-surface-700 whitespace-pre-line">{recruitment.benefits}</p>
          </Card>
        )}
        {recruitment.additional_info && (
          <Card>
            <CardHeader><CardTitle>Informations complémentaires</CardTitle></CardHeader>
            <p className="text-sm text-surface-700 whitespace-pre-line">{recruitment.additional_info}</p>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Candidatures</CardTitle>
        </CardHeader>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-surface-300" />
          </div>
          <p className="text-surface-500 font-medium">Module candidatures à venir</p>
          <p className="text-sm text-surface-400 mt-1">Les candidatures seront gérées par le Responsable RH du département</p>
          {recruitment.applications_count > 0 && (
            <Badge variant="info" className="mt-3">{recruitment.applications_count} candidature{recruitment.applications_count > 1 ? 's' : ''} reçue{recruitment.applications_count > 1 ? 's' : ''}</Badge>
          )}
        </div>
      </Card>
    </div>
  );
}

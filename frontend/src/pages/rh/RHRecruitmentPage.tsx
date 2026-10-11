import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import {
  Briefcase,
  Users,
  Clock,
  Search,
  ChevronRight,
  FileText,
  CheckCircle,
  XCircle,
  Archive,
  Calendar,
} from 'lucide-react';
import { api, type RecruitmentAnnouncement, type CandidateStats } from '@/services/api';

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  draft: { label: 'Brouillon', variant: 'default' },
  published: { label: 'Publiée', variant: 'success' },
  closed: { label: 'Clôturée', variant: 'warning' },
  archived: { label: 'Archivée', variant: 'danger' },
};

export default function RHRecruitmentPage() {
  const { rhManager } = useAuth();
  const deptName = rhManager?.department?.name || 'votre département';
  const navigate = useNavigate();

  const [announcements, setAnnouncements] = useState<RecruitmentAnnouncement[]>([]);
  const [stats, setStats] = useState<CandidateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [annList, candStats] = await Promise.all([
        api.candidates.announcements(),
        api.candidates.stats(),
      ]);
      setAnnouncements(annList);
      setStats(candStats);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const filtered = announcements.filter((a) => {
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      (a.contract_type || '').toLowerCase().includes(q)
    );
  });

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-surface-500">Chargement des annonces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Recruitment</h1>
          <p className="text-surface-500 mt-1">
            Annonces du département{' '}
            <span className="font-semibold text-primary-600">{deptName}</span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Annonces"
          value={announcements.length}
          icon={<Briefcase className="w-5 h-5" />}
          iconBg="bg-primary-50 text-primary-600"
        />
        <StatCard
          title="Total candidatures"
          value={stats?.total || 0}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="En cours"
          value={(stats?.new || 0) + (stats?.cv_review || 0) + (stats?.interview_scheduled || 0) + (stats?.technical_test || 0) + (stats?.final_interview || 0)}
          icon={<Clock className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Acceptées"
          value={stats?.accepted || 0}
          icon={<CheckCircle className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
      </div>

      {/* Search */}
      <Card padding={false}>
        <div className="p-4 border-b border-surface-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Rechercher une annonce..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            />
          </div>
        </div>

        {/* Announcement Cards */}
        <div className="p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-surface-500">
              {announcements.length === 0
                ? 'Aucune annonce publiée dans votre département.'
                : 'Aucun résultat pour votre recherche.'}
            </div>
          ) : (
            filtered.map((ann) => (
              <button
                key={ann.id}
                onClick={() => navigate(`/rh/recruitment/${ann.id}`)}
                className="w-full text-left p-4 border border-surface-200 rounded-xl hover:border-primary-300 hover:bg-primary-50/30 transition-all group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-surface-900 group-hover:text-primary-700 transition-colors truncate">
                        {ann.title}
                      </h3>
                      <Badge variant={statusConfig[ann.status]?.variant || 'default'} dot size="sm">
                        {statusConfig[ann.status]?.label}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-surface-500 mt-2">
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5" />
                        {ann.contract_type}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {ann.positions_count} poste{ann.positions_count > 1 ? 's' : ''}
                      </span>
                      {ann.posted_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Publié le {formatDate(ann.posted_date)}
                        </span>
                      )}
                      {ann.deadline && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Deadline: {formatDate(ann.deadline)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-primary-500" />
                        <span className="text-lg font-bold text-surface-900">
                          {ann.pending_candidates_count}
                        </span>
                      </div>
                      <p className="text-[11px] text-surface-400">candidatures</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-surface-300 group-hover:text-primary-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

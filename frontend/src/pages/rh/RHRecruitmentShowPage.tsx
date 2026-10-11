import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Briefcase,
  Users,
  Calendar,
  Clock,
  ArrowLeft,
  Search,
  Eye,
  X,
  FileText,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  DollarSign,
  Target,
  Award,
  BookOpen,
  Sparkles,
  ListChecks,
} from 'lucide-react';
import { api, type RecruitmentAnnouncement, type Candidate, type CandidateStatus, type CandidateProfile, type CandidateDocument } from '@/services/api';

const statusConfig: Record<CandidateStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info'; color: string }> = {
  new: { label: 'Nouvelle', variant: 'info', color: 'bg-blue-100 text-blue-700' },
  cv_review: { label: 'CV en revue', variant: 'warning', color: 'bg-amber-100 text-amber-700' },
  interview_scheduled: { label: 'Entretien prévu', variant: 'default', color: 'bg-surface-100 text-surface-700' },
  technical_test: { label: 'Test technique', variant: 'default', color: 'bg-purple-100 text-purple-700' },
  final_interview: { label: 'Entretien final', variant: 'default', color: 'bg-indigo-100 text-indigo-700' },
  accepted: { label: 'Accepté', variant: 'success', color: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Refusé', variant: 'danger', color: 'bg-red-100 text-red-700' },
};

const statusFlow: CandidateStatus[] = ['new', 'cv_review', 'interview_scheduled', 'technical_test', 'final_interview', 'accepted', 'rejected'];

const CANDIDATES_PER_PAGE = 10;

export default function RHRecruitmentShowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { rhManager } = useAuth();
  const deptName = rhManager?.department?.name || 'votre département';

  const [announcement, setAnnouncement] = useState<RecruitmentAnnouncement | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState<Candidate | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [candidateDocuments, setCandidateDocuments] = useState<CandidateDocument[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [detailTab, setDetailTab] = useState<'info' | 'cv' | 'docs'>('info');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [ann, candList] = await Promise.all([
        api.candidates.announcement(Number(id)),
        api.candidates.byRecruitment(Number(id)),
      ]);
      setAnnouncement(ann);
      setCandidates(candList);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const filtered = candidates.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      c.full_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.cin || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / CANDIDATES_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * CANDIDATES_PER_PAGE, currentPage * CANDIDATES_PER_PAGE);

  const handleStatusChange = async (candidate: Candidate, newStatus: CandidateStatus, extra?: { interview_date?: string; interview_time?: string }) => {
    setActionLoading(candidate.id);
    try {
      await api.candidates.updateStatus(candidate.id, { status: newStatus, ...extra });
      loadData();
      if (showDetailModal?.id === candidate.id) {
        const updated = await api.candidates.get(candidate.id);
        setShowDetailModal(updated);
      }
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const openCandidateDetail = async (candidate: Candidate) => {
    setShowDetailModal(candidate);
    setLoadingProfile(true);
    setCandidateProfile(null);
    setCandidateDocuments([]);
    try {
      const data = await api.candidates.fullProfile(candidate.id);
      setCandidateProfile(data.profile);
      setCandidateDocuments(data.documents);
    } catch {
    } finally {
      setLoadingProfile(false);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-surface-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!announcement) {
    return (
      <div className="text-center py-12">
        <p className="text-surface-500">Annonce introuvable.</p>
        <button onClick={() => navigate('/rh/recruitment')} className="text-primary-600 text-sm mt-2 hover:underline">
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/rh/recruitment')}
          className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux annonces
        </button>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-surface-900">{announcement.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-surface-500 mt-2">
              <span className="flex items-center gap-1">
                <Briefcase className="w-4 h-4" />
                {announcement.contract_type}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {announcement.positions_count} poste{announcement.positions_count > 1 ? 's' : ''}
              </span>
              {announcement.salary && (
                <span className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {announcement.salary.toLocaleString('fr-MA')} DH
                </span>
              )}
              {announcement.deadline && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Deadline: {formatDate(announcement.deadline)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Announcement Details */}
      <Card padding={false}>
        <div className="p-5 space-y-5">
          {/* Description */}
          {announcement.description && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">
                <FileText className="w-3.5 h-3.5" />
                Description
              </h3>
              <p className="text-sm text-surface-700 whitespace-pre-wrap leading-relaxed">{announcement.description}</p>
            </div>
          )}

          {/* Missions */}
          {announcement.missions && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">
                <Target className="w-3.5 h-3.5" />
                Missions
              </h3>
              <p className="text-sm text-surface-700 whitespace-pre-wrap leading-relaxed">{announcement.missions}</p>
            </div>
          )}

          {/* Skills */}
          {announcement.skills && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">
                <Award className="w-3.5 h-3.5" />
                Compétences requises
              </h3>
              <p className="text-sm text-surface-700 whitespace-pre-wrap leading-relaxed">{announcement.skills}</p>
            </div>
          )}

          {/* Qualifications */}
          {announcement.qualifications && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">
                <GraduationCap className="w-3.5 h-3.5" />
                Qualifications
              </h3>
              <p className="text-sm text-surface-700 whitespace-pre-wrap leading-relaxed">{announcement.qualifications}</p>
            </div>
          )}

          {/* Benefits */}
          {announcement.benefits && (
            <div>
              <h3 className="flex items-center gap-2 text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                Avantages
              </h3>
              <p className="text-sm text-surface-700 whitespace-pre-wrap leading-relaxed">{announcement.benefits}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Candidates Table */}
      <Card padding={false}>
        <div className="p-4 border-b border-surface-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, CIN..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                <th className="px-4 py-3">Candidat</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">CIN</th>
                <th className="px-4 py-3">Candidature</th>
                <th className="px-4 py-3">Entretien</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-surface-500">
                    {candidates.length === 0 ? 'Aucune candidature pour cette annonce.' : 'Aucun résultat pour votre recherche.'}
                  </td>
                </tr>
              ) : (
                paginated.map((cand) => {
                  return (
                    <tr key={cand.id} className="hover:bg-surface-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold shrink-0">
                            {cand.first_name[0]}{cand.last_name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-surface-900 truncate">{cand.full_name}</p>
                            <p className="text-xs text-surface-500 truncate">{cand.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-surface-600 space-y-0.5">
                          {cand.phone && (
                            <p className="flex items-center gap-1"><Phone className="w-3 h-3" /> {cand.phone}</p>
                          )}
                          {cand.address && (
                            <p className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {cand.address}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-surface-600">{cand.cin || '-'}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-surface-600">{formatDate(cand.created_at)}</span>
                      </td>
                      <td className="px-4 py-3">
                        {cand.interview_date ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary-500" />
                            <span className="text-sm text-surface-700">{formatDate(cand.interview_date)}</span>
                            {cand.interview_time && <span className="text-xs text-surface-400 ml-1">{cand.interview_time}</span>}
                          </div>
                        ) : (
                          <span className="text-xs text-surface-400">Non planifié</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusConfig[cand.status]?.variant || 'default'} dot size="sm">
                          {statusConfig[cand.status]?.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openCandidateDetail(cand)}
                            className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors"
                            title="Voir détails"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {cand.status !== 'accepted' && cand.status !== 'rejected' && (
                            <button
                              onClick={() => handleStatusChange(cand, 'rejected')}
                              disabled={actionLoading === cand.id}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                              title="Supprimer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100">
            <p className="text-sm text-surface-500">
              {filtered.length} candidature{filtered.length > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-40 text-surface-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium ${
                    p === currentPage ? 'bg-primary-600 text-white' : 'text-surface-600 hover:bg-surface-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-40 text-surface-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDetailModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-white border-b border-surface-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="text-lg font-bold text-surface-900">Détails du candidat</h2>
              <button onClick={() => { setShowDetailModal(null); setDetailTab('info'); }} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Candidate Header */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold shrink-0">
                  {showDetailModal.first_name[0]}{showDetailModal.last_name[0]}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-surface-900">{showDetailModal.full_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={statusConfig[showDetailModal.status]?.variant || 'default'} dot size="md">
                      {statusConfig[showDetailModal.status]?.label}
                    </Badge>
                    <span className="text-xs text-surface-400">Postulé le {formatDate(showDetailModal.created_at)}</span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 p-1 bg-surface-100 rounded-xl">
                <button
                  onClick={() => setDetailTab('info')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    detailTab === 'info' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
                  }`}
                >
                  Informations
                </button>
                <button
                  onClick={() => setDetailTab('cv')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    detailTab === 'cv' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
                  }`}
                >
                  Mon CV
                </button>
                <button
                  onClick={() => setDetailTab('docs')}
                  className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    detailTab === 'docs' ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
                  }`}
                >
                  Documents
                </button>
              </div>

              {loadingProfile && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {/* Tab: Info */}
              {!loadingProfile && detailTab === 'info' && (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 bg-surface-50 rounded-xl">
                      <p className="text-xs text-surface-500 mb-0.5 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                      <p className="font-medium text-surface-800">{showDetailModal.email}</p>
                    </div>
                    <div className="p-3 bg-surface-50 rounded-xl">
                      <p className="text-xs text-surface-500 mb-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> Téléphone</p>
                      <p className="font-medium text-surface-800">{showDetailModal.phone || '-'}</p>
                    </div>
                    <div className="p-3 bg-surface-50 rounded-xl">
                      <p className="text-xs text-surface-500 mb-0.5">CIN</p>
                      <p className="font-medium text-surface-800">{showDetailModal.cin || '-'}</p>
                    </div>
                    <div className="p-3 bg-surface-50 rounded-xl">
                      <p className="text-xs text-surface-500 mb-0.5">Date de naissance</p>
                      <p className="font-medium text-surface-800">{formatDate(showDetailModal.birth_date)}</p>
                    </div>
                    {showDetailModal.address && (
                      <div className="col-span-2 p-3 bg-surface-50 rounded-xl">
                        <p className="text-xs text-surface-500 mb-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> Adresse</p>
                        <p className="font-medium text-surface-800">{showDetailModal.address}</p>
                      </div>
                    )}
                  </div>

                  {showDetailModal.interview_date && (
                    <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                      <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Entretien planifié
                      </p>
                      <p className="text-sm font-medium text-primary-800">
                        {formatDate(showDetailModal.interview_date)} à {showDetailModal.interview_time}
                      </p>
                      {showDetailModal.interview_notes && (
                        <p className="text-xs text-primary-600 mt-1">{showDetailModal.interview_notes}</p>
                      )}
                    </div>
                  )}

                  {showDetailModal.cover_letter && (
                    <div>
                      <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        Lettre de motivation
                      </p>
                      <p className="text-sm text-surface-700 bg-surface-50 p-4 rounded-xl whitespace-pre-wrap leading-relaxed">
                        {showDetailModal.cover_letter}
                      </p>
                    </div>
                  )}

                  {showDetailModal.notes && (
                    <div>
                      <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <ListChecks className="w-3.5 h-3.5" />
                        Notes RH
                      </p>
                      <p className="text-sm text-surface-700 bg-surface-50 p-4 rounded-xl whitespace-pre-wrap">
                        {showDetailModal.notes}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Tab: CV Profile */}
              {!loadingProfile && detailTab === 'cv' && (
                <>
                  {!candidateProfile ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-surface-500">Ce candidat n'a pas encore rempli son CV.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-3 bg-surface-50 rounded-xl">
                          <p className="text-xs text-surface-500 mb-0.5">Prénom</p>
                          <p className="font-medium text-surface-800">{candidateProfile.first_name || '-'}</p>
                        </div>
                        <div className="p-3 bg-surface-50 rounded-xl">
                          <p className="text-xs text-surface-500 mb-0.5">Nom</p>
                          <p className="font-medium text-surface-800">{candidateProfile.last_name || '-'}</p>
                        </div>
                        <div className="p-3 bg-surface-50 rounded-xl">
                          <p className="text-xs text-surface-500 mb-0.5 flex items-center gap-1"><Phone className="w-3 h-3" /> Téléphone</p>
                          <p className="font-medium text-surface-800">{candidateProfile.phone || '-'}</p>
                        </div>
                        <div className="p-3 bg-surface-50 rounded-xl">
                          <p className="text-xs text-surface-500 mb-0.5 flex items-center gap-1"><Calendar className="w-3 h-3" /> Date de naissance</p>
                          <p className="font-medium text-surface-800">{formatDate(candidateProfile.birth_date)}</p>
                        </div>
                        {candidateProfile.address && (
                          <div className="p-3 bg-surface-50 rounded-xl">
                            <p className="text-xs text-surface-500 mb-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> Adresse</p>
                            <p className="font-medium text-surface-800">{candidateProfile.address}{candidateProfile.city ? `, ${candidateProfile.city}` : ''}</p>
                          </div>
                        )}
                        {candidateProfile.education_level && (
                          <div className="p-3 bg-surface-50 rounded-xl">
                            <p className="text-xs text-surface-500 mb-0.5 flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Formation</p>
                            <p className="font-medium text-surface-800">{candidateProfile.education_level}</p>
                          </div>
                        )}
                        {candidateProfile.experience_level && (
                          <div className="p-3 bg-surface-50 rounded-xl">
                            <p className="text-xs text-surface-500 mb-0.5 flex items-center gap-1"><Briefcase className="w-3 h-3" /> Expérience</p>
                            <p className="font-medium text-surface-800">{candidateProfile.experience_level}</p>
                          </div>
                        )}
                      </div>

                      {candidateProfile.skills && (
                        <div className="p-4 bg-surface-50 rounded-xl">
                          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Compétences</p>
                          <p className="text-sm text-surface-700 whitespace-pre-wrap">{candidateProfile.skills}</p>
                        </div>
                      )}

                      {candidateProfile.languages && (
                        <div className="p-4 bg-surface-50 rounded-xl">
                          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Langues</p>
                          <p className="text-sm text-surface-700 whitespace-pre-wrap">{candidateProfile.languages}</p>
                        </div>
                      )}

                      {(candidateProfile.linkedin || candidateProfile.github || candidateProfile.portfolio) && (
                        <div className="p-4 bg-surface-50 rounded-xl">
                          <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Liens</p>
                          <div className="space-y-1">
                            {candidateProfile.linkedin && (
                              <a href={candidateProfile.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline block">{candidateProfile.linkedin}</a>
                            )}
                            {candidateProfile.github && (
                              <a href={candidateProfile.github} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline block">{candidateProfile.github}</a>
                            )}
                            {candidateProfile.portfolio && (
                              <a href={candidateProfile.portfolio} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-600 hover:underline block">{candidateProfile.portfolio}</a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Tab: Documents */}
              {!loadingProfile && detailTab === 'docs' && (
                <>
                  {candidateDocuments.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-surface-500">Aucun document téléchargé.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {candidateDocuments.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                              <FileText className="w-5 h-5 text-primary-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-surface-900">{doc.title}</p>
                              <p className="text-xs text-surface-500">{doc.file_name} · {doc.file_size_formatted}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={doc.category === 'cv' ? 'success' : 'default'} size="sm">
                              {doc.category_label}
                            </Badge>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg hover:bg-surface-200 text-surface-400 hover:text-surface-600 transition-colors"
                              title="Ouvrir"
                            >
                              <Eye className="w-4 h-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Status Actions */}
              {showDetailModal.status !== 'accepted' && showDetailModal.status !== 'rejected' && (
                <div className="border-t border-surface-100 pt-4 space-y-4">
                  <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider">Actions</p>

                  {showDetailModal.status !== 'interview_scheduled' && (
                    <div className="p-4 bg-surface-50 rounded-xl space-y-3">
                      <p className="text-sm font-medium text-surface-700">Planifier un entretien</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-surface-500 mb-1">Date</label>
                          <input
                            type="date"
                            id="interview-date"
                            className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-surface-500 mb-1">Heure</label>
                          <input
                            type="time"
                            id="interview-time"
                            className="w-full rounded-lg border border-surface-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const dateInput = document.getElementById('interview-date') as HTMLInputElement;
                          const timeInput = document.getElementById('interview-time') as HTMLInputElement;
                          if (!dateInput.value || !timeInput.value) {
                            alert('Veuillez sélectionner une date et une heure.');
                            return;
                          }
                          handleStatusChange(showDetailModal, 'interview_scheduled', {
                            interview_date: dateInput.value,
                            interview_time: timeInput.value,
                          });
                        }}
                        disabled={actionLoading === showDetailModal.id}
                        className="px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
                      >
                        {actionLoading === showDetailModal.id ? 'En cours...' : 'Planifier l\'entretien'}
                      </button>
                    </div>
                  )}

                  {showDetailModal.status === 'interview_scheduled' && (
                    <div className="p-4 bg-primary-50 rounded-xl border border-primary-100">
                      <p className="text-sm font-medium text-primary-800 mb-1">Entretien déjà planifié</p>
                      <p className="text-xs text-primary-600">
                        {formatDate(showDetailModal.interview_date)} à {showDetailModal.interview_time}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(showDetailModal, 'accepted')}
                      disabled={actionLoading === showDetailModal.id}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => handleStatusChange(showDetailModal, 'rejected')}
                      disabled={actionLoading === showDetailModal.id}
                      className="px-4 py-2 text-sm font-medium rounded-lg border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

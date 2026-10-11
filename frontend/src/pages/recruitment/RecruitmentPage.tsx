import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DataTable, Pagination, type Column } from '@/components/ui/DataTable';
import {
  Plus, Pencil, Trash2, Search, RefreshCw, Briefcase, Eye,
  Send, XCircle, Archive, Users, MapPin, Clock,
} from 'lucide-react';
import { api, ApiError, type Recruitment, type RecruitmentInput, type RecruitmentStats } from '@/services/api';
import { useFormAssistant } from '@/hooks/useFormAssistant';
import { FormAssistantPanel } from '@/components/ai/FormAssistantPanel';

const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 0 }).format(n);

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' | 'default' }> = {
  published: { label: 'Publiée', variant: 'success' },
  closed: { label: 'Fermée', variant: 'danger' },
  archived: { label: 'Archivée', variant: 'default' },
};

const workModeLabels: Record<string, string> = {
  presentiel: 'Présentiel',
  hybride: 'Hybride',
  teletravail: 'Télétravail',
};

const contractTypes = ['CDI', 'CDD', 'Stage', 'Alternance'];
const workModes = ['presentiel', 'hybride', 'teletravail'];
const experienceLevels = ['Junior (0-2 ans)', 'Confirmé (3-5 ans)', 'Senior (5+ ans)', 'Expert (10+ ans)', 'Sans expérience'];
const educationLevels = ['Sans diplôme', 'Bac', 'Bac+2', 'Bac+3', 'Bac+4', 'Bac+5', 'Doctorat'];

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-surface-900">{value}</p>
        <p className="text-sm text-surface-500">{label}</p>
      </div>
    </Card>
  );
}

export default function RecruitmentPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<Recruitment[]>([]);
  const [stats, setStats] = useState<RecruitmentStats | null>(null);
  const [departments, setDepartments] = useState<{ id: number; name: string; code: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Recruitment | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState<Recruitment | null>(null);

  const [formTitle, setFormTitle] = useState('');
  const [formDepartmentId, setFormDepartmentId] = useState('');
  const [formContractType, setFormContractType] = useState('CDI');
  const [formLocation, setFormLocation] = useState('');
  const [formWorkMode, setFormWorkMode] = useState('presentiel');
  const [formPositions, setFormPositions] = useState('1');
  const [formExperience, setFormExperience] = useState('');
  const [formEducation, setFormEducation] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formStatus, setFormStatus] = useState('published');
  const [formDescription, setFormDescription] = useState('');
  const [formMissions, setFormMissions] = useState('');
  const [formSkills, setFormSkills] = useState('');
  const [formQualifications, setFormQualifications] = useState('');
  const [formBenefits, setFormBenefits] = useState('');
  const [formAdditional, setFormAdditional] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listRes, statsRes, deptRes] = await Promise.all([
        api.recruitments.list(),
        api.recruitments.stats(),
        api.departments.list(),
      ]);
      setData(listRes);
      setStats(statsRes);
      setDepartments(deptRes.map((d: any) => ({ id: d.id, name: d.name, code: d.code })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = data.filter((r) => {
    const matchSearch = r.title.toLowerCase().includes(search.toLowerCase()) ||
      (r.department?.name && r.department.name.toLowerCase().includes(search.toLowerCase())) ||
      (r.location && r.location.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const resetForm = () => {
    setFormTitle('');
    setFormDepartmentId('');
    setFormContractType('CDI');
    setFormLocation('');
    setFormWorkMode('presentiel');
    setFormPositions('1');
    setFormExperience('');
    setFormEducation('');
    setFormSalary('');
    setFormDeadline('');
    setFormStatus('published');
    setFormDescription('');
    setFormMissions('');
    setFormSkills('');
    setFormQualifications('');
    setFormBenefits('');
    setFormAdditional('');
    setEditing(null);
  };

  const openCreateModal = () => { resetForm(); setSubmitError(null); setShowModal(true); };

  const openEditModal = (r: Recruitment) => {
    setEditing(r);
    setFormTitle(r.title);
    setFormDepartmentId(r.department_id ? String(r.department_id) : '');
    setFormContractType(r.contract_type);
    setFormLocation(r.location || '');
    setFormWorkMode(r.work_mode);
    setFormPositions(String(r.positions_count));
    setFormExperience(r.experience_level || '');
    setFormEducation(r.education_level || '');
    setFormSalary(r.salary ? String(r.salary) : '');
    setFormDeadline(r.deadline || '');
    setFormStatus(r.status);
    setFormDescription(r.description || '');
    setFormMissions(r.missions || '');
    setFormSkills(r.skills || '');
    setFormQualifications(r.qualifications || '');
    setFormBenefits(r.benefits || '');
    setFormAdditional(r.additional_info || '');
    setSubmitError(null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const payload: RecruitmentInput = {
      title: formTitle,
      department_id: formDepartmentId ? Number(formDepartmentId) : null,
      contract_type: formContractType,
      location: formLocation || null,
      work_mode: formWorkMode as any,
      positions_count: Number(formPositions),
      experience_level: formExperience || null,
      education_level: formEducation || null,
      salary: formSalary ? Number(formSalary) : null,
      deadline: formDeadline || null,
      status: formStatus as any,
      description: formDescription || null,
      missions: formMissions || null,
      skills: formSkills || null,
      qualifications: formQualifications || null,
      benefits: formBenefits || null,
      additional_info: formAdditional || null,
    };
    try {
      if (editing) {
        const updated = await api.recruitments.update(editing.id, payload);
        setData((prev) => prev.map((r) => (r.id === editing.id ? updated : r)));
      } else {
        const created = await api.recruitments.create(payload);
        setData((prev) => [created, ...prev]);
      }
      const s = await api.recruitments.stats();
      setStats(s);
      setShowModal(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      }
    }
  };

  const assistantContext = { title: formTitle, contract_type: formContractType, department_id: formDepartmentId, skills: formSkills };
  const { suggestions, loading: assistantLoading, error: assistantError, regenerate: regenerateSuggestions } = useFormAssistant({
    module: 'recruitment',
    context: assistantContext,
    enabled: showModal,
  });

  const insertSuggestion = (field: string, value: string) => {
    if (field === 'description') setFormDescription(value);
    else if (field === 'missions') setFormMissions(value);
    else if (field === 'skills') setFormSkills(value);
    else if (field === 'qualifications') setFormQualifications(value);
    else if (field === 'benefits') setFormBenefits(value);
    else if (field === 'additional_info') setFormAdditional(value);
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await api.recruitments.delete(deleting.id);
      setData((prev) => prev.filter((r) => r.id !== deleting.id));
      setDeleting(null);
      setShowDeleteConfirm(false);
      const s = await api.recruitments.stats();
      setStats(s);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-surface-500">{error}</p>
        <Button onClick={fetchData} variant="outline" icon={<RefreshCw className="w-4 h-4" />}>Réessayer</Button>
      </div>
    );
  }

  const columns: Column<Recruitment>[] = [
    {
      key: 'title',
      header: 'Offre',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
            <Briefcase className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-surface-900">{r.title}</p>
            <p className="text-xs text-surface-500">{r.department?.name || '—'} · {r.contract_type}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Localisation',
      render: (r) => (
        <span className="flex items-center gap-1 text-sm text-surface-600">
          <MapPin className="w-3.5 h-3.5 text-surface-400" />
          {r.location || '—'}
        </span>
      ),
    },
    {
      key: 'work_mode',
      header: 'Mode',
      render: (r) => <Badge variant="info">{workModeLabels[r.work_mode] || r.work_mode}</Badge>,
    },
    {
      key: 'positions_count',
      header: 'Postes',
      render: (r) => <span className="font-medium text-surface-900">{r.positions_count}</span>,
    },
    {
      key: 'applications_count',
      header: 'Candidatures',
      render: (r) => (
        <span className="flex items-center gap-1 text-sm text-surface-600">
          <Users className="w-3.5 h-3.5 text-surface-400" />
          {r.applications_count}
        </span>
      ),
    },
    {
      key: 'deadline',
      header: 'Date limite',
      render: (r) => <span className="flex items-center gap-1 text-sm text-surface-600"><Clock className="w-3.5 h-3.5 text-surface-400" />{r.deadline || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (r) => {
        const s = statusMap[r.status] || { label: r.status, variant: 'default' as const };
        return <Badge variant={s.variant} dot>{s.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recruitment"
        description="Gestion des offres de recrutement"
        action={
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
            Nouvelle offre
          </Button>
        }
      />

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total offres" value={String(stats.total)} icon={<Briefcase className="w-6 h-6 text-primary-600" />} color="bg-primary-50" />
          <StatCard label="Publiées" value={String(stats.published)} icon={<Send className="w-6 h-6 text-green-600" />} color="bg-green-50" />
          <StatCard label="Fermées" value={String(stats.closed)} icon={<XCircle className="w-6 h-6 text-red-500" />} color="bg-red-50" />
          <StatCard label="Archivées" value={String(stats.archived)} icon={<Archive className="w-6 h-6 text-surface-500" />} color="bg-surface-100" />
        </div>
      )}

      <Card padding={false}>
        <div className="p-4 border-b border-surface-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par titre, département, localisation..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <select
            className="px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          >
            <option value="all">Tous les statuts</option>
            {Object.entries(statusMap).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
        <DataTable
          columns={columns}
          data={paginated}
          actions={(r) => {
            const rec = r as Recruitment;
            return (
              <>
                <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => navigate(`/recruitments/${rec.id}`)} />
                <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEditModal(rec)} />
                <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => { setDeleting(rec); setShowDeleteConfirm(true); }} />
              </>
            );
          }}
          footer={<Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
        />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Modifier l\'offre' : 'Nouvelle offre'} size="xl">
        <div className="flex gap-6">
          <div className="flex-1 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <h4 className="text-sm font-semibold text-surface-700 mb-3 uppercase tracking-wide">Informations générales</h4>
            <div className="space-y-4">
              <Input label="Titre du poste" placeholder="Ex: Développeur Full Stack" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Département</label>
                  <select className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white" value={formDepartmentId} onChange={(e) => setFormDepartmentId(e.target.value)}>
                    <option value="">Sélectionner un département</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Type de contrat</label>
                  <select className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white" value={formContractType} onChange={(e) => setFormContractType(e.target.value)}>
                    {contractTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Localisation" placeholder="Ex: Casablanca" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} />
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Mode de travail</label>
                  <select className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white" value={formWorkMode} onChange={(e) => setFormWorkMode(e.target.value)}>
                    {workModes.map((m) => <option key={m} value={m}>{workModeLabels[m]}</option>)}
                  </select>
                </div>
                <Input label="Nombre de postes" type="number" placeholder="1" value={formPositions} onChange={(e) => setFormPositions(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Niveau d'expérience</label>
                  <select className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white" value={formExperience} onChange={(e) => setFormExperience(e.target.value)}>
                    <option value="">Sélectionner</option>
                    {experienceLevels.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Niveau d'études</label>
                  <select className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white" value={formEducation} onChange={(e) => setFormEducation(e.target.value)}>
                    <option value="">Sélectionner</option>
                    {educationLevels.map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Salaire (MAD)" type="number" placeholder="Optionnel" value={formSalary} onChange={(e) => setFormSalary(e.target.value)} />
                <Input label="Date limite" type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="border-t border-surface-100 pt-5">
            <h4 className="text-sm font-semibold text-surface-700 mb-3 uppercase tracking-wide">Description</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Présentation du poste</label>
                <textarea className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" rows={3} placeholder="Décrivez le poste..." value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Missions principales</label>
                <textarea className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" rows={3} placeholder="Listez les missions..." value={formMissions} onChange={(e) => setFormMissions(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Compétences requises</label>
                <textarea className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" rows={3} placeholder="Compétences techniques et soft skills..." value={formSkills} onChange={(e) => setFormSkills(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Qualifications</label>
                  <textarea className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" rows={3} placeholder="Diplômes, certifications..." value={formQualifications} onChange={(e) => setFormQualifications(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 mb-1">Avantages</label>
                  <textarea className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" rows={3} placeholder="Mutuelle, transport, formations..." value={formBenefits} onChange={(e) => setFormBenefits(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">Informations complémentaires</label>
                <textarea className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none" rows={2} placeholder="Détails supplémentaires..." value={formAdditional} onChange={(e) => setFormAdditional(e.target.value)} />
              </div>
            </div>
          </div>

          {submitError && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{submitError}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleSubmit}>{editing ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </div>
        <FormAssistantPanel
          suggestions={suggestions}
          loading={assistantLoading}
          error={assistantError}
          onInsert={insertSuggestion}
          onRegenerate={regenerateSuggestions}
        />
      </div>
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Supprimer l'offre" size="sm">
        <p className="text-sm text-surface-600 mb-6">
          Êtes-vous sûr de vouloir supprimer l'offre <strong>{deleting?.title}</strong> ?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}

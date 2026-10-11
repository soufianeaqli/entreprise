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
  Plus, Pencil, Trash2, Search, RefreshCw, DollarSign, TrendingUp, TrendingDown,
  Wallet, FolderOpen, AlertTriangle, CheckCircle, Eye,
} from 'lucide-react';
import { api, ApiError, type Project, type ProjectInput } from '@/services/api';
import { useFormAssistant } from '@/hooks/useFormAssistant';
import { FormAssistantPanel } from '@/components/ai/FormAssistantPanel';

const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 0 }).format(n);

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' | 'default' }> = {
  planned: { label: 'Planifié', variant: 'info' },
  in_progress: { label: 'En cours', variant: 'success' },
  completed: { label: 'Terminé', variant: 'default' },
  on_hold: { label: 'En pause', variant: 'warning' },
  cancelled: { label: 'Annulé', variant: 'danger' },
};

const expenseCategories = [
  'Salaires', 'Matériel', 'Hébergement', 'Marketing', 'Déplacements', 'Formation', 'Logiciels', 'Divers',
];

const paymentMethods = [
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'cash', label: 'Espèces' },
  { value: 'check', label: 'Chèque' },
  { value: 'mobile_payment', label: 'Paiement mobile' },
  { value: 'other', label: 'Autre' },
];

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

export default function FinancePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);

  const [formName, setFormName] = useState('');
  const [formClient, setFormClient] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formBudget, setFormBudget] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formManager, setFormManager] = useState('');
  const [formStatus, setFormStatus] = useState('planned');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [projRes, dashRes] = await Promise.all([
        api.finance.listProjects(),
        api.finance.dashboard(),
      ]);
      setProjects(projRes);
      setDashboard(dashRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase()) ||
      (p.manager && p.manager.toLowerCase().includes(search.toLowerCase())),
  );

  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const resetForm = () => {
    setFormName('');
    setFormClient('');
    setFormDescription('');
    setFormBudget('');
    setFormStartDate('');
    setFormEndDate('');
    setFormManager('');
    setFormStatus('planned');
    setEditingProject(null);
  };

  const openCreateModal = () => {
    resetForm();
    setSubmitError(null);
    setShowModal(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormName(project.name);
    setFormClient(project.client);
    setFormDescription(project.description || '');
    setFormBudget(String(project.budget));
    setFormStartDate(project.start_date);
    setFormEndDate(project.end_date || '');
    setFormManager(project.manager || '');
    setFormStatus(project.status);
    setSubmitError(null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const payload: ProjectInput = {
      name: formName,
      client: formClient,
      description: formDescription || null,
      budget: Number(formBudget),
      start_date: formStartDate,
      end_date: formEndDate || null,
      manager: formManager || null,
      status: formStatus as Project['status'],
    };
    try {
      if (editingProject) {
        const updated = await api.finance.updateProject(editingProject.id, payload);
        setProjects((prev) => prev.map((p) => (p.id === editingProject.id ? updated : p)));
      } else {
        const created = await api.finance.createProject(payload);
        setProjects((prev) => [created, ...prev]);
      }
      const dashRes = await api.finance.dashboard();
      setDashboard(dashRes);
      setShowModal(false);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      }
    }
  };

  const assistantContext = { name: formName, client: formClient, budget: formBudget, manager: formManager };
  const { suggestions, loading: assistantLoading, error: assistantError, regenerate: regenerateSuggestions } = useFormAssistant({
    module: 'budget',
    context: assistantContext,
    enabled: showModal,
  });

  const insertSuggestion = (field: string, value: string) => {
    if (field === 'description') setFormDescription(value);
  };

  const handleDelete = async () => {
    if (!deletingProject) return;
    try {
      await api.finance.deleteProject(deletingProject.id);
      setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));
      setDeletingProject(null);
      setShowDeleteConfirm(false);
      const dashRes = await api.finance.dashboard();
      setDashboard(dashRes);
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

  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'Projet',
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
            <FolderOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-surface-900">{p.name}</p>
            <p className="text-xs text-surface-500">{p.client}</p>
          </div>
        </div>
      ),
    },
    { key: 'budget', header: 'Budget', render: (p) => <span className="font-medium text-surface-900">{fmt(p.budget)} MAD</span> },
    { key: 'total_incomes', header: 'Revenus', render: (p) => <span className="font-medium text-green-600">{fmt(p.total_incomes)} MAD</span> },
    { key: 'total_expenses', header: 'Dépenses', render: (p) => <span className="font-medium text-red-500">{fmt(p.total_expenses)} MAD</span> },
    {
      key: 'result',
      header: 'Résultat',
      render: (p) => (
        <span className={`font-semibold ${p.result >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {p.result >= 0 ? '+' : ''}{fmt(p.result)} MAD
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Statut',
      render: (p) => {
        const s = statusMap[p.status] || { label: p.status, variant: 'default' as const };
        return <Badge variant={s.variant} dot>{s.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance"
        description="Gestion des budgets, revenus et dépenses"
        action={
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
            Nouveau projet
          </Button>
        }
      />

      {dashboard && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            label="Projets"
            value={String(dashboard.total_projects)}
            icon={<FolderOpen className="w-6 h-6 text-primary-600" />}
            color="bg-primary-50"
          />
          <StatCard
            label="Budget total"
            value={`${fmt(dashboard.total_budget)} MAD`}
            icon={<Wallet className="w-6 h-6 text-blue-600" />}
            color="bg-blue-50"
          />
          <StatCard
            label="Revenus totaux"
            value={`${fmt(dashboard.total_incomes)} MAD`}
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            color="bg-green-50"
          />
          <StatCard
            label="Dépenses totales"
            value={`${fmt(dashboard.total_expenses)} MAD`}
            icon={<TrendingDown className="w-6 h-6 text-red-500" />}
            color="bg-red-50"
          />
          <StatCard
            label={dashboard.total_result >= 0 ? 'Bénéfice total' : 'Perte totale'}
            value={`${dashboard.total_result >= 0 ? '+' : '-'}${fmt(Math.abs(dashboard.total_result))} MAD`}
            icon={dashboard.total_result >= 0
              ? <CheckCircle className="w-6 h-6 text-emerald-600" />
              : <AlertTriangle className="w-6 h-6 text-orange-500" />
            }
            color={dashboard.total_result >= 0 ? 'bg-emerald-50' : 'bg-orange-50'}
          />
        </div>
      )}

      {dashboard && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-lg font-bold text-surface-900">{fmt(dashboard.remaining_budget)} MAD</p>
              <p className="text-xs text-surface-500">Budget restant à encaisser</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-lg font-bold text-surface-900">{dashboard.profitable_projects}</p>
              <p className="text-xs text-surface-500">Projets rentables</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-lg font-bold text-surface-900">{dashboard.loss_projects}</p>
              <p className="text-xs text-surface-500">Projets en perte</p>
            </div>
          </Card>
        </div>
      )}

      <Card padding={false}>
        <div className="p-4 border-b border-surface-100">
          <Input
            placeholder="Rechercher un projet, client ou responsable..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <DataTable
          columns={columns}
          data={paginated}
          actions={(p) => {
            const project = p as Project;
            return (
              <>
                <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => navigate(`/finance/${project.id}`)} />
                <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEditModal(project)} />
                <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => { setDeletingProject(project); setShowDeleteConfirm(true); }} />
              </>
            );
          }}
          footer={<Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
        />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingProject ? 'Modifier le projet' : 'Nouveau projet'} size="xl">
        <div className="flex gap-6">
          <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Nom du projet" placeholder="Ex: Site e-commerce" value={formName} onChange={(e) => setFormName(e.target.value)} />
            <Input label="Client" placeholder="Nom du client" value={formClient} onChange={(e) => setFormClient(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
              rows={3}
              placeholder="Description du projet..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Budget prévu (MAD)" type="number" placeholder="Ex: 150000" value={formBudget} onChange={(e) => setFormBudget(e.target.value)} />
            <Input label="Responsable" placeholder="Nom du responsable" value={formManager} onChange={(e) => setFormManager(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date de début" type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
            <Input label="Date de fin" type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Statut</label>
            <select
              className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value)}
            >
              {Object.entries(statusMap).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>
          {submitError && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{submitError}</p>}

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleSubmit}>{editingProject ? 'Enregistrer' : 'Créer'}</Button>
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

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Supprimer le projet" size="sm">
        <p className="text-sm text-surface-600 mb-6">
          Êtes-vous sûr de vouloir supprimer le projet <strong>{deletingProject?.name}</strong> ? Tous les revenus et dépenses associés seront également supprimés.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}

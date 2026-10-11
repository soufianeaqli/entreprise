import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { DataTable, Pagination, type Column } from '@/components/ui/DataTable';
import { Plus, Pencil, Trash2, Search, Building2, RefreshCw, Eye, Sparkles } from 'lucide-react';
import { api, ApiError, type Department, type DepartmentInput, type RhManager } from '@/services/api';
import { useFormAssistant } from '@/hooks/useFormAssistant';
import { FormAssistantPanel } from '@/components/ai/FormAssistantPanel';

const EMPTY_FORM: DepartmentInput = {
  name: '', code: '', description: null, rh_manager_id: null,
  location: null, annual_budget: null, status: true,
};

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [data, setData] = useState<Department[]>([]);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<DepartmentInput>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [availableRh, setAvailableRh] = useState<RhManager[]>([]);

  const setField = (key: keyof DepartmentInput, value: DepartmentInput[keyof DepartmentInput]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFormErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.departments.list();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRh = async () => {
    try {
      const rh = await api.rhManagers.list();
      setAvailableRh(rh);
    } catch {}
  };

  useEffect(() => { fetchData(); fetchAvailableRh(); }, []);

  const filtered = data.filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.code.toLowerCase().includes(search.toLowerCase()),
  );

  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleDelete = async () => {
    if (!deletingDept) return;
    try {
      await api.departments.delete(deletingDept.id);
      setData((prev) => prev.filter((d) => d.id !== deletingDept.id));
      setDeletingDept(null);
      setShowDeleteConfirm(false);
    } catch {}
  };

  const openCreateModal = async () => {
    setEditingDept(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  };

  const openEditModal = async (dept: Department) => {
    setEditingDept(dept);
    setForm({
      name: dept.name,
      code: dept.code,
      description: dept.description,
      rh_manager_id: dept.rh_manager?.id ?? null,
      location: dept.location,
      annual_budget: dept.annual_budget,
      status: dept.status,
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setFormErrors({});
    try {
      if (editingDept) {
        const updated = await api.departments.update(editingDept.id, form);
        setData((prev) => prev.map((d) => d.id === editingDept.id ? updated : d));
      } else {
        const created = await api.departments.create(form);
        setData((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldErrors: Record<string, string> = {};
        for (const [field, messages] of Object.entries(err.errors)) {
          fieldErrors[field] = messages[0];
        }
        setFormErrors({ _server: err.message, ...fieldErrors });
      } else if (err instanceof Error) {
        setFormErrors({ _server: err.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const assistantContext = { name: form.name, code: form.code, location: form.location };
  const { suggestions, loading: assistantLoading, error: assistantError, regenerate: regenerateSuggestions } = useFormAssistant({
    module: 'department',
    context: assistantContext,
    enabled: showModal,
  });

  const insertSuggestion = (field: string, value: string) => {
    if (field === 'description') setField('description', value);
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

  const columns: Column<Department>[] = [
    {
      key: 'name',
      header: 'Département',
      render: (dept) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-surface-900">{dept.name}</p>
            <p className="text-xs text-surface-500 font-mono">{dept.code}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'rh_manager',
      header: 'RH Manager',
      render: (dept) => dept.rh_manager ? (
        <div>
          <p className="text-sm font-medium text-surface-900">{dept.rh_manager.full_name}</p>
          <p className="text-xs text-surface-500">{dept.rh_manager.matricule}</p>
        </div>
      ) : <span className="text-surface-400 text-sm">Non assigné</span>,
    },
    {
      key: 'location',
      header: 'Localisation',
      render: (dept) => <span className="text-sm text-surface-600">{dept.location || '—'}</span>,
    },
    {
      key: 'annual_budget',
      header: 'Budget annuel',
      render: (dept) => <span className="font-medium text-surface-900">{dept.annual_budget ? `${Number(dept.annual_budget).toLocaleString()} MAD` : '—'}</span>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (dept) => <Badge variant={dept.status ? 'success' : 'danger'} dot>{dept.status ? 'Actif' : 'Inactif'}</Badge>,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Organisation des départements de l'entreprise"
        action={
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
            Nouveau département
          </Button>
        }
      />

      <Card padding={false}>
        <div className="p-4 border-b border-surface-100">
          <Input
            placeholder="Rechercher par nom ou code..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <DataTable
          columns={columns}
          data={paginated}
          actions={(dept) => (
            <>
              <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => navigate(`/departments/${dept.id}`)} />
              <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEditModal(dept as Department)} />
              <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => { setDeletingDept(dept as Department); setShowDeleteConfirm(true); }} />
            </>
          )}
          footer={<Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
        />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingDept ? 'Modifier le département' : 'Nouveau département'} size="xl">
        <div className="flex gap-6">
          <div className="flex-1 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {formErrors._server && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{formErrors._server}</p>}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Nom du département *" placeholder="Ex: Ressources Humaines" value={form.name || ''} onChange={(e) => setField('name', e.target.value)} error={formErrors.name} />
            <Input label="Code *" placeholder="Ex: RH" value={form.code || ''} onChange={(e) => setField('code', e.target.value)} error={formErrors.code} className="uppercase" />
          </div>

          <Input label="Description" placeholder="Description du département" value={form.description || ''} onChange={(e) => setField('description', e.target.value || null)} error={formErrors.description} />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="RH Manager"
              value={form.rh_manager_id?.toString() || ''}
              onChange={(e) => setField('rh_manager_id', e.target.value ? Number(e.target.value) : null)}
              placeholder="Sélectionner un RH"
              options={availableRh.map((rh) => ({ value: rh.id.toString(), label: `${rh.full_name} (${rh.matricule})` }))}
              error={formErrors.rh_manager_id}
            />
            <Input label="Localisation" placeholder="Ex: Casablanca" value={form.location || ''} onChange={(e) => setField('location', e.target.value || null)} error={formErrors.location} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Budget annuel (MAD)" type="number" placeholder="Ex: 500000" value={form.annual_budget || ''} onChange={(e) => setField('annual_budget', e.target.value ? Number(e.target.value) : null)} error={formErrors.annual_budget} />
            <Select label="Statut" value={form.status ? 'active' : 'inactive'} onChange={(e) => setField('status', e.target.value === 'active')} options={[{ value: 'active', label: 'Actif' }, { value: 'inactive', label: 'Inactif' }]} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{editingDept ? 'Enregistrer' : 'Créer'}</Button>
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

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Supprimer le département" size="sm">
        <p className="text-sm text-surface-600 mb-6">
          Êtes-vous sûr de vouloir supprimer <strong>{deletingDept?.name}</strong> ({deletingDept?.code}) ?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { DataTable, Pagination, type Column } from '@/components/ui/DataTable';
import {
  Plus, Pencil, Trash2, Search, Power, RefreshCw, Eye,
  ChevronRight, ChevronLeft, Check, User, Briefcase, FileText, Shield,
} from 'lucide-react';
import { api, ApiError, type RhManager, type RhManagerInput, type Department } from '@/services/api';
import { useFormAssistant } from '@/hooks/useFormAssistant';
import { FormAssistantPanel } from '@/components/ai/FormAssistantPanel';

const EMPTY_FORM: RhManagerInput = {
  first_name: '', last_name: '', gender: 'male', birth_date: null,
  cin: null, phone: null, email: '', address: null, photo: null,
  department_id: null, hire_date: null, contract_type: 'CDI', salary: null,
  status: true, password: '', password_confirmation: '',
  contract_start_date: '', contract_end_date: null, trial_period: null,
  work_hours: '09:00 - 17:00', leave_days: 22, benefits: null, observations: null,
};

const STEPS = [
  { label: 'Informations personnelles', icon: User },
  { label: 'Informations professionnelles', icon: Briefcase },
  { label: 'Informations du contrat', icon: FileText },
  { label: 'Compte utilisateur', icon: Shield },
];

export default function RHManagementPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [data, setData] = useState<RhManager[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingRH, setEditingRH] = useState<RhManager | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingRH, setDeletingRH] = useState<RhManager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<RhManagerInput>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);

  const setField = (key: keyof RhManagerInput, value: RhManagerInput[keyof RhManagerInput]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFormErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rhList, deptList] = await Promise.all([api.rhManagers.list(), api.departments.list()]);
      setData(rhList);
      setDepartments(deptList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = data.filter(
    (rh) =>
      rh.full_name.toLowerCase().includes(search.toLowerCase()) ||
      rh.email.toLowerCase().includes(search.toLowerCase()) ||
      rh.matricule?.toLowerCase().includes(search.toLowerCase()),
  );

  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleToggleStatus = async (rh: RhManager) => {
    try {
      const updated = await api.rhManagers.toggleStatus(rh.id);
      setData((prev) => prev.map((r) => r.id === rh.id ? updated : r));
    } catch {}
  };

  const handleDelete = async () => {
    if (!deletingRH) return;
    try {
      await api.rhManagers.delete(deletingRH.id);
      setData((prev) => prev.filter((r) => r.id !== deletingRH.id));
      setDeletingRH(null);
      setShowDeleteConfirm(false);
    } catch {}
  };

  const openCreateModal = () => {
    setEditingRH(null);
    setForm({ ...EMPTY_FORM, contract_start_date: new Date().toISOString().split('T')[0] });
    setFormErrors({});
    setStep(0);
    setShowModal(true);
  };

  const openEditModal = (rh: RhManager) => {
    setEditingRH(rh);
    setForm({
      first_name: rh.first_name,
      last_name: rh.last_name,
      gender: rh.gender,
      birth_date: rh.birth_date,
      cin: rh.cin,
      phone: rh.phone,
      email: rh.email,
      address: rh.address,
      photo: rh.photo,
      department_id: null,
      hire_date: rh.hire_date,
      contract_type: rh.contract_type,
      salary: rh.salary,
      status: rh.status,
      password: null,
      password_confirmation: null,
    });
    setFormErrors({});
    setStep(0);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setFormErrors({});
    try {
      if (editingRH) {
        const updated = await api.rhManagers.update(editingRH.id, form);
        setData((prev) => prev.map((r) => r.id === editingRH.id ? updated : r));
      } else {
        const created = await api.rhManagers.create(form);
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

  const assistantContext = {
    first_name: form.first_name,
    last_name: form.last_name,
    department_id: form.department_id ? departments.find(d => d.id === form.department_id)?.name : null,
    contract_type: form.contract_type,
  };
  const { suggestions, loading: assistantLoading, error: assistantError, regenerate: regenerateSuggestions } = useFormAssistant({
    module: 'rh',
    context: assistantContext,
    enabled: showModal,
  });

  const insertSuggestion = (field: string, value: string) => {
    if (field === 'observations') {
      setField('observations', (form.observations || '') + (form.observations ? '\n\n' : '') + value);
    } else if (field === 'benefits') {
      setField('benefits', (form.benefits || '') + (form.benefits ? '\n\n' : '') + value);
    }
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

  const columns: Column<RhManager>[] = [
    {
      key: 'matricule',
      header: 'Matricule',
      render: (rh) => <span className="font-mono text-sm text-surface-600">{rh.matricule}</span>,
    },
    {
      key: 'full_name',
      header: 'Nom complet',
      render: (rh) => (
        <div className="flex items-center gap-3">
          <Avatar name={rh.full_name} size="sm" />
          <div>
            <p className="font-medium text-surface-900">{rh.full_name}</p>
            <p className="text-xs text-surface-500">{rh.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'phone', header: 'Téléphone', render: (rh) => rh.phone || '—' },
    {
      key: 'department',
      header: 'Département',
      render: (rh) => rh.department ? <Badge variant="info">{rh.department.name}</Badge> : <span className="text-surface-400">Non assigné</span>,
    },
    {
      key: 'contract_type',
      header: 'Contrat',
      render: (rh) => <Badge variant={rh.contract_type === 'CDI' ? 'success' : rh.contract_type === 'CDD' ? 'warning' : 'info'}>{rh.contract_type}</Badge>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (rh) => <Badge variant={rh.status ? 'success' : 'danger'} dot>{rh.status ? 'Actif' : 'Inactif'}</Badge>,
    },
  ];

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="space-y-6">
      <PageHeader
        title="RH Management"
        description="Gestion des responsables ressources humaines"
        action={
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
            Nouveau RH
          </Button>
        }
      />

      <Card padding={false}>
        <div className="p-4 border-b border-surface-100">
          <Input
            placeholder="Rechercher par nom, email ou matricule..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <DataTable
          columns={columns}
          data={paginated}
          actions={(rh) => (
            <>
              <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => navigate(`/rh/${rh.id}`)} />
              <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEditModal(rh as RhManager)} />
              <Button variant="ghost" size="sm" icon={<Power className="w-3.5 h-3.5" />} onClick={() => handleToggleStatus(rh as RhManager)} />
              <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => { setDeletingRH(rh as RhManager); setShowDeleteConfirm(true); }} />
            </>
          )}
          footer={<Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
        />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingRH ? 'Modifier le RH' : 'Nouveau Responsable RH'} description={editingRH ? 'Modifiez les informations du RH' : 'Créez un nouveau compte RH avec contrat automatique'} size="xl">
        <div className="flex gap-6">
          <div className="flex-1 space-y-6 max-h-[75vh] overflow-y-auto pr-2">
          {formErrors._server && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{formErrors._server}</p>}

          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isCompleted = i < step;
              const isCurrent = i === step;
              return (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all ${
                    isCompleted ? 'bg-primary-500 text-white' : isCurrent ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500' : 'bg-surface-100 text-surface-400'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${isCurrent ? 'text-primary-700' : isCompleted ? 'text-primary-600' : 'text-surface-400'}`}>{s.label}</span>
                  {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${isCompleted ? 'bg-primary-500' : 'bg-surface-200'}`} />}
                </div>
              );
            })}
          </div>

          <div className="bg-primary-50 rounded-full h-1.5 overflow-hidden">
            <div className="h-full bg-primary-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-surface-900">Informations personnelles</h4>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Prénom *" placeholder="Prénom" value={form.first_name || ''} onChange={(e) => setField('first_name', e.target.value)} error={formErrors.first_name} />
                <Input label="Nom *" placeholder="Nom" value={form.last_name || ''} onChange={(e) => setField('last_name', e.target.value)} error={formErrors.last_name} />
                <Select label="Genre *" value={form.gender || ''} onChange={(e) => setField('gender', e.target.value as 'male' | 'female')} options={[{ value: 'male', label: 'Masculin' }, { value: 'female', label: 'Féminin' }]} error={formErrors.gender} />
                <Input label="Date de naissance" type="date" value={form.birth_date || ''} onChange={(e) => setField('birth_date', e.target.value || null)} />
                <Input label="CIN" placeholder="Numéro CIN" value={form.cin || ''} onChange={(e) => setField('cin', e.target.value || null)} error={formErrors.cin} />
                <Input label="Email *" placeholder="email@hrplatform.com" type="email" value={form.email || ''} onChange={(e) => setField('email', e.target.value)} error={formErrors.email} />
                <Input label="Téléphone" placeholder="+212 6XX XXX XXX" value={form.phone || ''} onChange={(e) => setField('phone', e.target.value || null)} />
                <Input label="Adresse" placeholder="Adresse complète" value={form.address || ''} onChange={(e) => setField('address', e.target.value || null)} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-surface-900">Informations professionnelles</h4>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Département"
                  value={form.department_id?.toString() || ''}
                  onChange={(e) => setField('department_id', e.target.value ? Number(e.target.value) : null)}
                  placeholder="Sélectionner un département"
                  options={departments.map((d) => ({ value: d.id.toString(), label: `${d.name} (${d.code})` }))}
                />
                <Input label="Poste" value="Responsable RH" disabled />
                <Input label="Matricule" value="Généré automatiquement" disabled />
                <Input label="Date d'embauche" type="date" value={form.hire_date || ''} onChange={(e) => setField('hire_date', e.target.value || null)} />
                <Select label="Statut" value={form.status ? 'active' : 'inactive'} onChange={(e) => setField('status', e.target.value === 'active')} options={[{ value: 'active', label: 'Actif' }, { value: 'inactive', label: 'Inactif' }]} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-surface-900">Informations du contrat</h4>
              <div className="grid grid-cols-2 gap-4">
                <Select label="Type de contrat *" value={form.contract_type || ''} onChange={(e) => setField('contract_type', e.target.value as 'CDI' | 'CDD' | 'Stage')} options={[{ value: 'CDI', label: 'CDI' }, { value: 'CDD', label: 'CDD' }, { value: 'Stage', label: 'Stage' }]} error={formErrors.contract_type} />
                <Input label="Salaire (MAD)" type="number" placeholder="Ex: 15000" value={form.salary || ''} onChange={(e) => setField('salary', e.target.value ? Number(e.target.value) : null)} />
                <Input label="Date de début *" type="date" value={form.contract_start_date || ''} onChange={(e) => setField('contract_start_date', e.target.value)} error={formErrors.contract_start_date} />
                <Input label="Date de fin" type="date" value={form.contract_end_date || ''} onChange={(e) => setField('contract_end_date', e.target.value || null)} />
                <Input label="Période d'essai" placeholder="Ex: 3 mois" value={form.trial_period || ''} onChange={(e) => setField('trial_period', e.target.value || null)} />
                <Input label="Horaires de travail" placeholder="Ex: 09:00 - 17:00" value={form.work_hours || ''} onChange={(e) => setField('work_hours', e.target.value || null)} />
                <Input label="Jours de congés" type="number" placeholder="22" value={form.leave_days ?? ''} onChange={(e) => setField('leave_days', e.target.value ? Number(e.target.value) : null)} />
                <Input label="Avantages" placeholder="Avantages (optionnel)" value={form.benefits || ''} onChange={(e) => setField('benefits', e.target.value || null)} />
                <Input label="Observations" placeholder="Observations (optionnel)" value={form.observations || ''} onChange={(e) => setField('observations', e.target.value || null)} className="col-span-2" />
              </div>
            </div>
          )}

          {step === 3 && !editingRH && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-surface-900">Compte utilisateur</h4>
              <p className="text-xs text-surface-500">Le rôle RH sera attribué automatiquement.</p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Email de connexion *" placeholder="email@hrplatform.com" type="email" value={form.email || ''} onChange={(e) => setField('email', e.target.value)} error={formErrors.email} />
                <div />
                <Input label="Mot de passe *" type="password" placeholder="Minimum 6 caractères" value={form.password || ''} onChange={(e) => setField('password', e.target.value)} error={formErrors.password} />
                <Input label="Confirmer le mot de passe *" type="password" placeholder="Confirmer" value={form.password_confirmation || ''} onChange={(e) => setField('password_confirmation', e.target.value)} error={formErrors.password_confirmation} />
              </div>
            </div>
          )}

          {step === 3 && editingRH && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-surface-900">Modifier le mot de passe</h4>
              <p className="text-xs text-surface-500">Laissez vide pour conserver le mot de passe actuel.</p>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nouveau mot de passe" type="password" placeholder="Minimum 6 caractères" value={form.password || ''} onChange={(e) => setField('password', e.target.value)} error={formErrors.password} />
                <Input label="Confirmer" type="password" placeholder="Confirmer" value={form.password_confirmation || ''} onChange={(e) => setField('password_confirmation', e.target.value)} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="bg-surface-50 rounded-xl p-5 space-y-3">
              <h4 className="text-sm font-semibold text-surface-900">Résumé</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <SummaryItem label="Nom complet" value={`${form.first_name} ${form.last_name}`} />
                <SummaryItem label="Email" value={form.email} />
                <SummaryItem label="Genre" value={form.gender === 'male' ? 'Masculin' : 'Féminin'} />
                <SummaryItem label="Département" value={departments.find((d) => d.id === form.department_id)?.name || '—'} />
                <SummaryItem label="Type de contrat" value={form.contract_type} />
                <SummaryItem label="Salaire" value={form.salary ? `${Number(form.salary).toLocaleString()} MAD` : '—'} />
                <SummaryItem label="Date début contrat" value={form.contract_start_date || '—'} />
                <SummaryItem label="Date fin contrat" value={form.contract_end_date || 'CDI'} />
                <SummaryItem label="Période d'essai" value={form.trial_period || '—'} />
                <SummaryItem label="Jours de congés" value={form.leave_days?.toString() || '—'} />
              </div>
            </div>
          )}

          <div className="flex justify-between gap-3 pt-4 border-t border-surface-100">
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="secondary" icon={<ChevronLeft className="w-4 h-4" />} onClick={() => setStep((s) => s - 1)}>Précédent</Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
              {step < STEPS.length - 1 ? (
                <Button icon={<ChevronRight className="w-4 h-4" />} iconPosition="right" onClick={() => setStep((s) => s + 1)}>Suivant</Button>
              ) : (
                <Button onClick={handleSubmit} disabled={submitting}>
                  {submitting ? 'Création...' : editingRH ? 'Enregistrer' : 'Créer le RH & le contrat'}
                </Button>
              )}
              </div>
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

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Supprimer le RH" description="Cette action est irréversible" size="sm">
        <p className="text-sm text-surface-600 mb-6">
          Êtes-vous sûr de vouloir supprimer <strong>{deletingRH?.full_name}</strong> ({deletingRH?.matricule}) ?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-surface-500">{label}</p>
      <p className="font-medium text-surface-900">{value}</p>
    </div>
  );
}

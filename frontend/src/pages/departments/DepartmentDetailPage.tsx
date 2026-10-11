import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ArrowLeft, Pencil, Trash2, RefreshCw, Building2, MapPin, Wallet, Users, User } from 'lucide-react';
import { api, type Department, type DepartmentInput, type RhManager } from '@/services/api';

export default function DepartmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dept, setDept] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState<DepartmentInput>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [availableRh, setAvailableRh] = useState<RhManager[]>([]);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.departments.get(Number(id));
      setDept(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleDelete = async () => {
    if (!dept) return;
    try {
      await api.departments.delete(dept.id);
      navigate('/departments');
    } catch {}
  };

  const fetchAvailableRh = async () => {
    try {
      const rh = await api.rhManagers.available();
      setAvailableRh(rh);
    } catch {}
  };

  const openEditModal = async () => {
    if (!dept) return;
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
    await fetchAvailableRh();
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!dept) return;
    setSubmitting(true);
    try {
      const updated = await api.departments.update(dept.id, form);
      setDept(updated);
      setShowEditModal(false);
    } catch (err) {
      if (err instanceof Error) setFormErrors({ _server: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (key: keyof DepartmentInput, value: DepartmentInput[keyof DepartmentInput]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFormErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (error || !dept) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-surface-500">{error || 'Département non trouvé'}</p>
        <Button onClick={() => navigate('/departments')} variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={dept.name}
        description={`Code: ${dept.code}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/departments')}>Retour</Button>
            <Button variant="outline" icon={<Pencil className="w-4 h-4" />} onClick={openEditModal}>Modifier</Button>
            <Button variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteConfirm(true)}>Supprimer</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-20 h-20 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-600">
              <Building2 className="w-10 h-10" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-surface-900">{dept.name}</h3>
            <p className="text-sm text-surface-500 font-mono">{dept.code}</p>
            <Badge variant={dept.status ? 'success' : 'danger'} dot className="mt-2">{dept.status ? 'Actif' : 'Inactif'}</Badge>
          </div>
        </Card>

        <Card className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Informations générales</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoItem icon={<Building2 className="w-4 h-4" />} label="Nom" value={dept.name} />
              <InfoItem icon={<Building2 className="w-4 h-4" />} label="Code" value={dept.code} />
              <InfoItem icon={<MapPin className="w-4 h-4" />} label="Localisation" value={dept.location || '—'} />
              <InfoItem icon={<Wallet className="w-4 h-4" />} label="Budget annuel" value={dept.annual_budget ? `${Number(dept.annual_budget).toLocaleString()} MAD` : '—'} />
              <InfoItem icon={<Users className="w-4 h-4" />} label="Nombre d'employés" value={String(dept.employees_count)} />
              {dept.description && <InfoItem icon={<Building2 className="w-4 h-4" />} label="Description" value={dept.description} className="col-span-2" />}
            </div>
          </div>

          <div className="border-t border-surface-100 pt-4">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">RH Manager assigné</h3>
            {dept.rh_manager ? (
              <div className="flex items-center gap-4 p-4 bg-surface-50 rounded-xl">
                <Avatar name={dept.rh_manager.full_name} size="md" />
                <div>
                  <p className="font-medium text-surface-900">{dept.rh_manager.full_name}</p>
                  <p className="text-sm text-surface-500">{dept.rh_manager.matricule} — {dept.rh_manager.email}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-surface-50 rounded-xl">
                <User className="w-5 h-5 text-surface-400" />
                <p className="text-sm text-surface-500">Aucun RH assigné</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Modifier le département" size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {formErrors._server && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{formErrors._server}</p>}

          <div className="grid grid-cols-2 gap-4">
            <Input label="Nom *" value={form.name || ''} onChange={(e) => setField('name', e.target.value)} />
            <Input label="Code *" value={form.code || ''} onChange={(e) => setField('code', e.target.value)} className="uppercase" />
          </div>
          <Input label="Description" value={form.description || ''} onChange={(e) => setField('description', e.target.value || null)} />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="RH Manager"
              value={form.rh_manager_id?.toString() || ''}
              onChange={(e) => setField('rh_manager_id', e.target.value ? Number(e.target.value) : null)}
              placeholder="Sélectionner un RH"
              options={availableRh.map((rh) => ({ value: rh.id.toString(), label: `${rh.full_name} (${rh.matricule})` }))}
            />
            <Input label="Localisation" value={form.location || ''} onChange={(e) => setField('location', e.target.value || null)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Budget annuel (MAD)" type="number" value={form.annual_budget || ''} onChange={(e) => setField('annual_budget', e.target.value ? Number(e.target.value) : null)} />
            <Select label="Statut" value={form.status ? 'active' : 'inactive'} onChange={(e) => setField('status', e.target.value === 'active')} options={[{ value: 'active', label: 'Actif' }, { value: 'inactive', label: 'Inactif' }]} />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Annuler</Button>
            <Button onClick={handleUpdate} disabled={submitting}>Enregistrer</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Supprimer le département" size="sm">
        <p className="text-sm text-surface-600 mb-6">
          Êtes-vous sûr de vouloir supprimer <strong>{dept.name}</strong> ({dept.code}) ?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({ icon, label, value, className }: { icon: React.ReactNode; label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 text-surface-500 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-sm font-medium text-surface-900">{value}</p>
    </div>
  );
}

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
import { ArrowLeft, Pencil, Power, Trash2, RefreshCw, Mail, Phone, MapPin, Calendar, CreditCard, Building2, Key, UserCheck } from 'lucide-react';
import { api, type RhManager, type RhManagerInput } from '@/services/api';

export default function RHDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [rh, setRh] = useState<RhManager | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState<RhManagerInput>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordForm, setResetPasswordForm] = useState({ password: '', password_confirmation: '' });
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string | null>(null);
  const [resetPasswordError, setResetPasswordError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.rhManagers.get(Number(id));
      setRh(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleToggleStatus = async () => {
    if (!rh) return;
    try {
      const updated = await api.rhManagers.toggleStatus(rh.id);
      setRh(updated);
    } catch {}
  };

  const handleDelete = async () => {
    if (!rh) return;
    try {
      await api.rhManagers.delete(rh.id);
      navigate('/rh');
    } catch {}
  };

  const handleResetPassword = async () => {
    if (!rh) return;
    setResetPasswordLoading(true);
    setResetPasswordError(null);
    setResetPasswordSuccess(null);
    try {
      await api.auth.resetPassword(rh.id, resetPasswordForm);
      setResetPasswordSuccess('Mot de passe réinitialisé avec succès.');
      setResetPasswordForm({ password: '', password_confirmation: '' });
    } catch (err) {
      setResetPasswordError(err instanceof Error ? err.message : 'Erreur de réinitialisation');
    } finally {
      setResetPasswordLoading(false);
    }
  };

  const openEditModal = () => {
    if (!rh) return;
    setForm({
      first_name: rh.first_name,
      last_name: rh.last_name,
      gender: rh.gender,
      birth_date: rh.birth_date,
      cin: rh.cin,
      phone: rh.phone,
      email: rh.email,
      address: rh.address,
      hire_date: rh.hire_date,
      contract_type: rh.contract_type,
      salary: rh.salary,
      status: rh.status,
      password: null,
      password_confirmation: null,
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!rh) return;
    setSubmitting(true);
    try {
      const payload: RhManagerInput = { ...form };
      if (!payload.password) delete payload.password;
      if (!payload.password_confirmation) delete payload.password_confirmation;
      const updated = await api.rhManagers.update(rh.id, payload);
      setRh(updated);
      setShowEditModal(false);
    } catch (err) {
      if (err instanceof Error) setFormErrors({ _server: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (key: keyof RhManagerInput, value: RhManagerInput[keyof RhManagerInput]) => {
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

  if (error || !rh) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-surface-500">{error || 'RH non trouvé'}</p>
        <Button onClick={() => navigate('/rh')} variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={rh.full_name}
        description={`${rh.matricule} — ${rh.contract_type}`}
        action={
          <div className="flex gap-2">
            <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/rh')}>Retour</Button>
            <Button variant="outline" icon={<Pencil className="w-4 h-4" />} onClick={openEditModal}>Modifier</Button>
            <Button variant="outline" icon={<Power className="w-4 h-4" />} onClick={handleToggleStatus}>{rh.status ? 'Désactiver' : 'Activer'}</Button>
            <Button variant="danger" icon={<Trash2 className="w-4 h-4" />} onClick={() => setShowDeleteConfirm(true)}>Supprimer</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center py-4">
            <Avatar name={rh.full_name} size="lg" />
            <h3 className="mt-4 text-lg font-semibold text-surface-900">{rh.full_name}</h3>
            <p className="text-sm text-surface-500">{rh.matricule}</p>
            <Badge variant={rh.status ? 'success' : 'danger'} dot className="mt-2">{rh.status ? 'Actif' : 'Inactif'}</Badge>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="text-lg font-semibold text-surface-900 mb-4">Informations personnelles</h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoItem icon={<Mail className="w-4 h-4" />} label="Email" value={rh.email} />
            <InfoItem icon={<Phone className="w-4 h-4" />} label="Téléphone" value={rh.phone || '—'} />
            <InfoItem icon={<Calendar className="w-4 h-4" />} label="Date de naissance" value={rh.birth_date || '—'} />
            <InfoItem icon={<CreditCard className="w-4 h-4" />} label="CIN" value={rh.cin || '—'} />
            <InfoItem icon={<MapPin className="w-4 h-4" />} label="Adresse" value={rh.address || '—'} className="col-span-2" />
          </div>

          <h3 className="text-lg font-semibold text-surface-900 mt-6 mb-4">Informations professionnelles</h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoItem icon={<Building2 className="w-4 h-4" />} label="Département" value={rh.department ? `${rh.department.name} (${rh.department.code})` : 'Non assigné'} />
            <InfoItem icon={<Calendar className="w-4 h-4" />} label="Date d'embauche" value={rh.hire_date || '—'} />
            <InfoItem icon={<CreditCard className="w-4 h-4" />} label="Type de contrat" value={rh.contract_type} />
            <InfoItem icon={<CreditCard className="w-4 h-4" />} label="Salaire" value={rh.salary ? `${rh.salary.toLocaleString()} MAD` : '—'} />
          </div>

          <h3 className="text-lg font-semibold text-surface-900 mt-6 mb-4">Compte utilisateur</h3>
          <div className="grid grid-cols-2 gap-4">
            <InfoItem icon={<UserCheck className="w-4 h-4" />} label="Email de connexion" value={rh.email} />
            <InfoItem icon={<Key className="w-4 h-4" />} label="Rôle" value="Responsable RH" />
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" icon={<Key className="w-4 h-4" />} onClick={() => { setShowResetPasswordModal(true); setResetPasswordSuccess(null); setResetPasswordError(null); }}>
              Réinitialiser le mot de passe
            </Button>
          </div>
        </Card>
      </div>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Modifier le RH" size="xl">
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {formErrors._server && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{formErrors._server}</p>}

          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-3">Informations personnelles</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Prénom *" value={form.first_name || ''} onChange={(e) => setField('first_name', e.target.value)} />
              <Input label="Nom *" value={form.last_name || ''} onChange={(e) => setField('last_name', e.target.value)} />
              <Select label="Genre *" value={form.gender || ''} onChange={(e) => setField('gender', e.target.value as 'male' | 'female')} options={[{ value: 'male', label: 'Masculin' }, { value: 'female', label: 'Féminin' }]} />
              <Input label="Date de naissance" type="date" value={form.birth_date || ''} onChange={(e) => setField('birth_date', e.target.value || null)} />
              <Input label="CIN" value={form.cin || ''} onChange={(e) => setField('cin', e.target.value || null)} />
              <Input label="Email *" type="email" value={form.email || ''} onChange={(e) => setField('email', e.target.value)} />
              <Input label="Téléphone" value={form.phone || ''} onChange={(e) => setField('phone', e.target.value || null)} />
              <Input label="Adresse" value={form.address || ''} onChange={(e) => setField('address', e.target.value || null)} className="col-span-2" />
            </div>
          </div>

          <div className="border-t border-surface-100 pt-4">
            <h4 className="text-sm font-semibold text-surface-900 mb-3">Informations professionnelles</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Date d'embauche" type="date" value={form.hire_date || ''} onChange={(e) => setField('hire_date', e.target.value || null)} />
              <Select label="Type de contrat *" value={form.contract_type || ''} onChange={(e) => setField('contract_type', e.target.value as 'CDI' | 'CDD' | 'Stage')} options={[{ value: 'CDI', label: 'CDI' }, { value: 'CDD', label: 'CDD' }, { value: 'Stage', label: 'Stage' }]} />
              <Input label="Salaire (MAD)" type="number" value={form.salary || ''} onChange={(e) => setField('salary', e.target.value ? Number(e.target.value) : null)} />
              <Select label="Statut" value={form.status ? 'active' : 'inactive'} onChange={(e) => setField('status', e.target.value === 'active')} options={[{ value: 'active', label: 'Actif' }, { value: 'inactive', label: 'Inactif' }]} />
            </div>
          </div>

          <div className="border-t border-surface-100 pt-4">
            <h4 className="text-sm font-semibold text-surface-900 mb-3">Nouveau mot de passe (optionnel)</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Mot de passe" type="password" placeholder="Laisser vide pour ne pas changer" value={form.password || ''} onChange={(e) => setField('password', e.target.value || null)} />
              <Input label="Confirmer" type="password" value={form.password_confirmation || ''} onChange={(e) => setField('password_confirmation', e.target.value || null)} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Annuler</Button>
            <Button onClick={handleUpdate} disabled={submitting}>Enregistrer</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showResetPasswordModal} onClose={() => setShowResetPasswordModal(false)} title="Réinitialiser le mot de passe" description={`Pour le compte de ${rh.full_name}`} size="sm">
        <div className="space-y-4">
          {resetPasswordSuccess && <p className="text-sm text-green-600 bg-green-50 p-3 rounded-lg">{resetPasswordSuccess}</p>}
          {resetPasswordError && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{resetPasswordError}</p>}
          <Input label="Nouveau mot de passe *" type="password" placeholder="Minimum 6 caractères" value={resetPasswordForm.password} onChange={(e) => setResetPasswordForm((f) => ({ ...f, password: e.target.value }))} />
          <Input label="Confirmer *" type="password" placeholder="Confirmer le mot de passe" value={resetPasswordForm.password_confirmation} onChange={(e) => setResetPasswordForm((f) => ({ ...f, password_confirmation: e.target.value }))} />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="secondary" onClick={() => setShowResetPasswordModal(false)}>Annuler</Button>
          <Button onClick={handleResetPassword} disabled={resetPasswordLoading || !resetPasswordForm.password || !resetPasswordForm.password_confirmation}>
            {resetPasswordLoading ? 'Réinitialisation...' : 'Réinitialiser'}
          </Button>
        </div>
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Supprimer le RH" size="sm">
        <p className="text-sm text-surface-600 mb-6">
          Êtes-vous sûr de vouloir supprimer <strong>{rh.full_name}</strong> ({rh.matricule}) ?
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

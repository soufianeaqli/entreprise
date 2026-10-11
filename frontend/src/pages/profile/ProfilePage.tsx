import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Save, Lock, Loader2, CheckCircle2, Shield } from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [pwMsg, setPwMsg] = useState<string | null>(null);
  const [pwError, setPwError] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    if (!name.trim() || !email.trim()) {
      setSaveError('Le nom et l\'e-mail sont requis.');
      return;
    }
    setSaving(true);
    setSaveError(null);
    setSaveMsg(null);
    try {
      const res = await api.auth.updateProfile({ name, email });
      updateUser(res.user);
      setSaveMsg(res.message);
      setTimeout(() => setSaveMsg(null), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError('Tous les champs sont requis.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (newPassword.length < 8) {
      setPwError('Le nouveau mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    setChangingPassword(true);
    setPwError(null);
    setPwMsg(null);
    try {
      const res = await api.auth.updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      });
      setPwMsg(res.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwMsg(null), 3000);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return null;

  const createdDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Votre profil administrateur"
        action={
          <Button icon={<Save className="w-4 h-4" />} onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        }
      />

      {saveMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <p className="text-sm text-emerald-700">{saveMsg}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <div className="flex flex-col items-center text-center py-6">
              <Avatar name={user.name} size="xl" status="online" />
              <h3 className="mt-4 text-lg font-semibold text-surface-900">{user.name}</h3>
              <p className="text-sm text-surface-500">{user.email}</p>
              <div className="mt-3">
                <Badge variant="success" dot size="md">
                  Super Administrateur
                </Badge>
              </div>
            </div>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-surface-500" />
                <CardTitle>Informations</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-3">
              {[
                { label: 'Rôle', value: 'Super Admin' },
                { label: 'Compte créé', value: createdDate },
                { label: 'E-mail vérifié', value: user.email ? 'Oui' : 'Non' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between py-2 border-b border-surface-50 last:border-0">
                  <span className="text-sm text-surface-500">{stat.label}</span>
                  <span className="text-sm font-medium text-surface-900">{stat.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {/* Personal Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations personnelles</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              {saveError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-sm text-red-700">{saveError}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nom complet" value={name} onChange={(e) => setName(e.target.value)} />
                <Input label="Adresse e-mail" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              </div>
              <Input label="Rôle" value="Super Administrateur" disabled />
            </div>
          </Card>

          {/* Security */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-surface-500" />
                <CardTitle>Changer le mot de passe</CardTitle>
              </div>
            </CardHeader>
            <div className="space-y-4">
              {pwMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <p className="text-sm text-emerald-700">{pwMsg}</p>
                </div>
              )}
              {pwError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-100">
                  <p className="text-sm text-red-700">{pwError}</p>
                </div>
              )}
              <Input
                label="Mot de passe actuel"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  icon={changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                >
                  {changingPassword ? 'Enregistrement...' : 'Mettre à jour le mot de passe'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

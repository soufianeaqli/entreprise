import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Building2, Mail, User, Shield, Lock, Save, Loader2, Camera } from 'lucide-react';

export default function RHProfilePage() {
  const { user, rhManager, updateUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await api.auth.updateAvatar(fd);
      updateUser({ ...user!, avatar: res.user.avatar });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'upload");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.auth.updateProfile({ name, email: user!.email });
      updateUser({ ...user!, name });
      setSuccess('Profil mis à jour');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async () => {
    setSavingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    if (newPassword !== passwordConfirm) {
      setPasswordError('Les mots de passe ne correspondent pas');
      setSavingPassword(false);
      return;
    }
    try {
      await api.auth.updatePassword({
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: passwordConfirm,
      });
      setPasswordSuccess('Mot de passe mis à jour');
      setCurrentPassword('');
      setNewPassword('');
      setPasswordConfirm('');
      setTimeout(() => setPasswordSuccess(null), 3000);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Profile</h1>
        <p className="text-surface-500 mt-1">Votre profil et informations personnelles</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <div className="flex flex-col items-center text-center py-4">
            <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
              <Avatar src={user?.avatar || undefined} name={user?.name || 'RH'} size="xl" />
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            <h3 className="mt-4 text-lg font-semibold text-surface-900">{user?.name}</h3>
            <p className="text-sm text-surface-500">{rhManager?.matricule || 'RH-0001'}</p>
            <Badge variant="success" dot className="mt-2">Actif</Badge>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Informations personnelles</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <InfoItem icon={<User className="w-4 h-4" />} label="Nom complet" value={user?.name || '—'} />
              <InfoItem icon={<Mail className="w-4 h-4" />} label="Email" value={user?.email || '—'} />
              <InfoItem icon={<Shield className="w-4 h-4" />} label="Rôle" value="Responsable RH" />
              <InfoItem icon={<Building2 className="w-4 h-4" />} label="Département" value={rhManager?.department?.name || '—'} />
            </div>

            {success && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-sm text-emerald-700">{success}</p>
              </div>
            )}
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="border-t border-surface-100 pt-4">
              <h4 className="text-sm font-semibold text-surface-700 mb-3">Modifier le nom</h4>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Input label="Nom" icon={<User className="w-4 h-4" />} value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre nom" />
                </div>
                <Button onClick={handleSaveProfile} disabled={saving} icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-lg font-semibold text-surface-900 mb-4">Changer le mot de passe</h3>
            {passwordSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-sm text-emerald-700">{passwordSuccess}</p>
              </div>
            )}
            {passwordError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100">
                <p className="text-sm text-red-700">{passwordError}</p>
              </div>
            )}
            <div className="space-y-4">
              <Input label="Mot de passe actuel" icon={<Lock className="w-4 h-4" />} type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Votre mot de passe actuel" />
              <Input label="Nouveau mot de passe" icon={<Lock className="w-4 h-4" />} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Nouveau mot de passe (min. 8 caractères)" />
              <Input label="Confirmer le mot de passe" icon={<Lock className="w-4 h-4" />} type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="Confirmer le nouveau mot de passe" />
              <div className="flex justify-end pt-2">
                <Button onClick={handleSavePassword} disabled={savingPassword} icon={savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
                  {savingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-surface-500 mb-1">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-sm font-medium text-surface-900">{value}</p>
    </div>
  );
}

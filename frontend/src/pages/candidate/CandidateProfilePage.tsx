import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/services/api';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  User,
  Mail,
  Lock,
  Save,
  Loader2,
  Camera,
} from 'lucide-react';

export default function CandidateProfilePage() {
  const { user, updateUser } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

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
      const updated = await api.candidate.profile.update({
        first_name: name.split(' ')[0] || null,
        last_name: name.split(' ').slice(1).join(' ') || null,
      });
      updateUser({ ...user!, name });
      setSuccess('Profil enregistré avec succès');
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez vos informations de connexion
        </p>
      </div>

      {success && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <p className="text-sm text-emerald-700">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-100">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#16a34a]/10 flex items-center justify-center">
              <User className="w-4 h-4 text-[#16a34a]" />
            </div>
            <CardTitle>Photo de profil</CardTitle>
          </div>
        </CardHeader>
        <div className="flex items-center gap-4">
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            <Avatar src={user?.avatar || undefined} name={user?.name || 'Candidat'} size="xl" />
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          <div>
            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#16a34a]/10 flex items-center justify-center">
              <User className="w-4 h-4 text-[#16a34a]" />
            </div>
            <CardTitle>Informations de connexion</CardTitle>
          </div>
        </CardHeader>
        <div className="space-y-4">
          <Input
            label="Nom"
            icon={<User className="w-4 h-4" />}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom"
          />
          <Input
            label="Email"
            icon={<Mail className="w-4 h-4" />}
            value={email}
            disabled
            className="bg-gray-50"
          />
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#16a34a]/10 flex items-center justify-center">
              <Lock className="w-4 h-4 text-[#16a34a]" />
            </div>
            <CardTitle>Changer le mot de passe</CardTitle>
          </div>
        </CardHeader>
        {passwordSuccess && (
          <div className="px-6 pb-2">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <p className="text-sm text-emerald-700">{passwordSuccess}</p>
            </div>
          </div>
        )}
        {passwordError && (
          <div className="px-6 pb-2">
            <div className="p-3 rounded-xl bg-red-50 border border-red-100">
              <p className="text-sm text-red-700">{passwordError}</p>
            </div>
          </div>
        )}
        <div className="space-y-4">
          <Input
            label="Mot de passe actuel"
            icon={<Lock className="w-4 h-4" />}
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Votre mot de passe actuel"
          />
          <Input
            label="Nouveau mot de passe"
            icon={<Lock className="w-4 h-4" />}
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nouveau mot de passe (min. 8 caractères)"
          />
          <Input
            label="Confirmer le mot de passe"
            icon={<Lock className="w-4 h-4" />}
            type="password"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="Confirmer le nouveau mot de passe"
          />
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSavePassword}
              disabled={savingPassword}
              icon={savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            >
              {savingPassword ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

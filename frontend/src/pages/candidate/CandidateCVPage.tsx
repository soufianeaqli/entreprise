import { useState, useEffect } from 'react';
import { api, type CandidateProfile } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  Globe,
  Link,
  ExternalLink,
  Save,
  Loader2,
} from 'lucide-react';

const educationLevels = [
  'Sans diplôme',
  'Bac',
  'Bac+1',
  'Bac+2',
  'Bac+3',
  'Bac+4',
  'Bac+5',
  'Doctorat',
];

const experienceLevels = [
  'Stage',
  'Junior (0-2 ans)',
  'Confirmé (2-5 ans)',
  'Senior (5-10 ans)',
  'Expert (10+ ans)',
];

export default function CandidateCVPage() {
  const { candidateProfile, updateCandidateProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    birth_date: '',
    address: '',
    city: '',
    education_level: '',
    experience_level: '',
    skills: '',
    languages: '',
    linkedin: '',
    github: '',
    portfolio: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (candidateProfile) {
          setForm({
            first_name: candidateProfile.first_name || '',
            last_name: candidateProfile.last_name || '',
            phone: candidateProfile.phone || '',
            birth_date: candidateProfile.birth_date || '',
            address: candidateProfile.address || '',
            city: candidateProfile.city || '',
            education_level: candidateProfile.education_level || '',
            experience_level: candidateProfile.experience_level || '',
            skills: candidateProfile.skills || '',
            languages: candidateProfile.languages || '',
            linkedin: candidateProfile.linkedin || '',
            github: candidateProfile.github || '',
            portfolio: candidateProfile.portfolio || '',
          });
        } else {
          const profile = await api.candidate.profile.get();
          if (profile) {
            updateCandidateProfile(profile);
            setForm({
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              phone: profile.phone || '',
              birth_date: profile.birth_date || '',
              address: profile.address || '',
              city: profile.city || '',
              education_level: profile.education_level || '',
              experience_level: profile.experience_level || '',
              skills: profile.skills || '',
              languages: profile.languages || '',
              linkedin: profile.linkedin || '',
              github: profile.github || '',
              portfolio: profile.portfolio || '',
            });
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [candidateProfile, updateCandidateProfile]);

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const updated = await api.candidate.profile.update({
        first_name: form.first_name || null,
        last_name: form.last_name || null,
        phone: form.phone || null,
        birth_date: form.birth_date || null,
        address: form.address || null,
        city: form.city || null,
        education_level: form.education_level || null,
        experience_level: form.experience_level || null,
        skills: form.skills || null,
        languages: form.languages || null,
        linkedin: form.linkedin || null,
        github: form.github || null,
        portfolio: form.portfolio || null,
      });
      updateCandidateProfile(updated);
      setSuccess('CV enregistré avec succès');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#16a34a] animate-spin" />
          <p className="text-sm text-gray-500">Chargement de votre CV...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mon CV</h1>
          <p className="text-sm text-gray-500 mt-1">
            Renseignez vos informations professionnelles
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#16a34a]/10 flex items-center justify-center">
                <User className="w-4 h-4 text-[#16a34a]" />
              </div>
              <CardTitle>Informations personnelles</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Prénom"
                icon={<User className="w-4 h-4" />}
                value={form.first_name}
                onChange={(e) => updateField('first_name', e.target.value)}
                placeholder="Jean"
              />
              <Input
                label="Nom"
                icon={<User className="w-4 h-4" />}
                value={form.last_name}
                onChange={(e) => updateField('last_name', e.target.value)}
                placeholder="Dupont"
              />
            </div>
            <Input
              label="Téléphone"
              icon={<Phone className="w-4 h-4" />}
              value={form.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="+33 6 12 34 56 78"
            />
            <Input
              label="Date de naissance"
              icon={<Calendar className="w-4 h-4" />}
              type="date"
              value={form.birth_date}
              onChange={(e) => updateField('birth_date', e.target.value)}
            />
            <Input
              label="Adresse"
              icon={<MapPin className="w-4 h-4" />}
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
              placeholder="123 rue de la Paix"
            />
            <Input
              label="Ville"
              icon={<MapPin className="w-4 h-4" />}
              value={form.city}
              onChange={(e) => updateField('city', e.target.value)}
              placeholder="Paris"
            />
          </div>
        </Card>

        {/* Formation & Expérience */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#16a34a]/10 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-[#16a34a]" />
              </div>
              <CardTitle>Formation & Expérience</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Niveau d'éducation
              </label>
              <select
                value={form.education_level}
                onChange={(e) => updateField('education_level', e.target.value)}
                className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:outline-none hover:border-surface-300"
              >
                <option value="">Sélectionnez...</option>
                {educationLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Niveau d'expérience
              </label>
              <select
                value={form.experience_level}
                onChange={(e) => updateField('experience_level', e.target.value)}
                className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:outline-none hover:border-surface-300"
              >
                <option value="">Sélectionnez...</option>
                {experienceLevels.map((level) => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Compétences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#16a34a]/10 flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-[#16a34a]" />
              </div>
              <CardTitle>Compétences</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Compétences
              </label>
              <textarea
                value={form.skills}
                onChange={(e) => updateField('skills', e.target.value)}
                rows={4}
                placeholder="React, TypeScript, Node.js, Python..."
                className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:outline-none hover:border-surface-300 resize-none"
              />
              <p className="mt-1 text-xs text-surface-400">Séparez vos compétences par des virgules</p>
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Langues
              </label>
              <textarea
                value={form.languages}
                onChange={(e) => updateField('languages', e.target.value)}
                rows={3}
                placeholder="Français (natif), Anglais (courant), Arabe (notions)..."
                className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:outline-none hover:border-surface-300 resize-none"
              />
            </div>
          </div>
        </Card>

        {/* Liens externes */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#16a34a]/10 flex items-center justify-center">
                <ExternalLink className="w-4 h-4 text-[#16a34a]" />
              </div>
              <CardTitle>Liens externes</CardTitle>
            </div>
          </CardHeader>
          <div className="space-y-4">
            <Input
              label="LinkedIn"
              icon={<Link className="w-4 h-4" />}
              value={form.linkedin}
              onChange={(e) => updateField('linkedin', e.target.value)}
              placeholder="https://linkedin.com/in/votre-profil"
            />
            <Input
              label="GitHub"
              icon={<Link className="w-4 h-4" />}
              value={form.github}
              onChange={(e) => updateField('github', e.target.value)}
              placeholder="https://github.com/votre-username"
            />
            <Input
              label="Portfolio"
              icon={<Globe className="w-4 h-4" />}
              value={form.portfolio}
              onChange={(e) => updateField('portfolio', e.target.value)}
              placeholder="https://votre-site.com"
            />
          </div>
        </Card>
      </div>

      {/* Bottom save bar */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          size="lg"
          icon={saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        >
          {saving ? 'Enregistrement...' : 'Enregistrer le CV'}
        </Button>
      </div>
    </div>
  );
}

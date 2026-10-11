import { useState } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Building2, Save, Globe, MapPin, Phone, Mail } from 'lucide-react';

export default function CompanyPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company"
        description="Informations générales de l'entreprise"
        action={
          <Button icon={<Save className="w-4 h-4" />} onClick={handleSave}>
            {saved ? 'Enregistré !' : 'Enregistrer'}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations de l'entreprise</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                  <Building2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-surface-900">HR Platform</h3>
                  <p className="text-sm text-surface-500">Système de gestion des ressources humaines</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Nom de l'entreprise" defaultValue="HR Platform Inc." />
                <Input label="Secteur d'activité" defaultValue="Technologies de l'information" />
                <Input label="Date de création" type="date" defaultValue="2020-01-01" />
                <Input label="Nombre d'employés" defaultValue="156" type="number" />
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coordonnées</CardTitle>
            </CardHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Adresse" defaultValue="123 Avenue Mohammed V" icon={<MapPin className="w-4 h-4" />} />
              <Input label="Ville" defaultValue="Casablanca" />
              <Input label="Pays" defaultValue="Maroc" />
              <Input label="Code postal" defaultValue="20000" />
              <Input label="Téléphone" defaultValue="+212 522 000 000" icon={<Phone className="w-4 h-4" />} />
              <Input label="Email" defaultValue="contact@hrplatform.com" type="email" icon={<Mail className="w-4 h-4" />} />
              <Input label="Site web" defaultValue="https://hrplatform.com" icon={<Globe className="w-4 h-4" />} />
            </div>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              {[
                { label: 'Employés actifs', value: '156' },
                { label: 'Départements', value: '8' },
                { label: 'RH assignés', value: '12' },
                { label: 'Contrats actifs', value: '142' },
                { label: 'Années d\'activité', value: '5' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between py-2 border-b border-surface-50 last:border-0">
                  <span className="text-sm text-surface-500">{stat.label}</span>
                  <span className="text-sm font-semibold text-surface-900">{stat.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logo de l'entreprise</CardTitle>
            </CardHeader>
            <div className="flex flex-col items-center py-4">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white shadow-lg shadow-primary-500/20 mb-4">
                <Building2 className="w-12 h-12" />
              </div>
              <Button variant="outline" size="sm">Changer le logo</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

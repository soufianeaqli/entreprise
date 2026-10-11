import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DataTable, Pagination, type Column } from '@/components/ui/DataTable';
import { Plus, Pencil, Trash2, Search, Send, Archive, Eye, MapPin, Clock, Users, RefreshCw } from 'lucide-react';
import { api, type Annonce, type AnnonceInput } from '@/services/api';

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'default' }> = {
  published: { label: 'Publiée', variant: 'success' },
  draft: { label: 'Brouillon', variant: 'warning' },
  archived: { label: 'Archivée', variant: 'default' },
};

export default function AnnoncesPage() {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<Annonce[]>([]);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingAnnonce, setEditingAnnonce] = useState<Annonce | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAnnonce, setDeletingAnnonce] = useState<Annonce | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedAnnonce, setSelectedAnnonce] = useState<Annonce | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formType, setFormType] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formDeadline, setFormDeadline] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.annonces.list();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = data.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.department.toLowerCase().includes(search.toLowerCase()) ||
      a.location.toLowerCase().includes(search.toLowerCase()),
  );

  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handlePublish = async (annonce: Annonce) => {
    try {
      const updated = await api.annonces.publish(annonce.id);
      setData((prev) => prev.map((a) => a.id === annonce.id ? updated : a));
    } catch {}
  };

  const handleArchive = async (annonce: Annonce) => {
    try {
      const updated = await api.annonces.archive(annonce.id);
      setData((prev) => prev.map((a) => a.id === annonce.id ? updated : a));
    } catch {}
  };

  const handleDelete = async () => {
    if (!deletingAnnonce) return;
    try {
      await api.annonces.delete(deletingAnnonce.id);
      setData((prev) => prev.filter((a) => a.id !== deletingAnnonce.id));
      setDeletingAnnonce(null);
      setShowDeleteConfirm(false);
    } catch {}
  };

  const openCreateModal = () => {
    setEditingAnnonce(null);
    setFormTitle('');
    setFormDepartment('');
    setFormType('');
    setFormLocation('');
    setFormSalary('');
    setFormDescription('');
    setFormDeadline('');
    setShowModal(true);
  };

  const openEditModal = (annonce: Annonce) => {
    setEditingAnnonce(annonce);
    setFormTitle(annonce.title);
    setFormDepartment(annonce.department);
    setFormType(annonce.type);
    setFormLocation(annonce.location);
    setFormSalary(annonce.salary);
    setFormDescription(annonce.description);
    setFormDeadline(annonce.deadline || '');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const payload: AnnonceInput = {
      title: formTitle,
      department: formDepartment,
      type: formType,
      location: formLocation,
      salary: formSalary,
      description: formDescription,
      deadline: formDeadline || null,
    };
    try {
      if (editingAnnonce) {
        const updated = await api.annonces.update(editingAnnonce.id, payload);
        setData((prev) => prev.map((a) => a.id === editingAnnonce.id ? updated : a));
      } else {
        const created = await api.annonces.create({ ...payload, status: 'draft', applications: 0 });
        setData((prev) => [created, ...prev]);
      }
      setShowModal(false);
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

  const columns: Column<Annonce>[] = [
    {
      key: 'title',
      header: 'Annonce',
      render: (a) => (
        <div>
          <p className="font-medium text-surface-900">{a.title}</p>
          <p className="text-xs text-surface-500">{a.department} · {a.type}</p>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Lieu',
      render: (a) => (
        <div className="flex items-center gap-1.5 text-surface-600">
          <MapPin className="w-3.5 h-3.5 text-surface-400" />
          <span className="text-sm">{a.location}</span>
        </div>
      ),
    },
    { key: 'salary', header: 'Salaire' },
    {
      key: 'applications',
      header: 'Candidatures',
      render: (a) => (
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-surface-400" />
          <span className="font-medium text-surface-900">{a.applications}</span>
        </div>
      ),
    },
    { key: 'deadline', header: 'Date limite' },
    {
      key: 'status',
      header: 'Statut',
      render: (a) => {
        const s = statusMap[a.status];
        return <Badge variant={s.variant} dot>{s.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Annonces"
        description="Annonces de recrutement et publications d'offres"
        action={
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
            Nouvelle annonce
          </Button>
        }
      />

      <Card padding={false}>
        <div className="p-4 border-b border-surface-100">
          <Input
            placeholder="Rechercher une annonce..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <DataTable
          columns={columns}
          data={paginated}
          actions={(a) => {
            const annonce = a as Annonce;
            return (
              <>
                <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => { setSelectedAnnonce(annonce); setShowDetail(true); }} />
                {annonce.status !== 'published' && (
                  <Button variant="ghost" size="sm" icon={<Send className="w-3.5 h-3.5" />} onClick={() => handlePublish(annonce)} />
                )}
                {annonce.status === 'published' && (
                  <Button variant="ghost" size="sm" icon={<Archive className="w-3.5 h-3.5" />} onClick={() => handleArchive(annonce)} />
                )}
                <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEditModal(annonce)} />
                <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => { setDeletingAnnonce(annonce); setShowDeleteConfirm(true); }} />
              </>
            );
          }}
          footer={<Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
        />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingAnnonce ? "Modifier l'annonce" : "Nouvelle annonce"} size="lg">
        <div className="space-y-4">
          <Input label="Titre de l'annonce" placeholder="Ex: Développeur Full Stack" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Département" placeholder="Département" value={formDepartment} onChange={(e) => setFormDepartment(e.target.value)} />
            <Input label="Type de contrat" placeholder="CDI / CDD" value={formType} onChange={(e) => setFormType(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Lieu" placeholder="Ville ou Remote" value={formLocation} onChange={(e) => setFormLocation(e.target.value)} />
            <Input label="Fourchette de salaire" placeholder="Ex: 25,000 - 35,000 MAD" value={formSalary} onChange={(e) => setFormSalary(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1.5">Description</label>
            <textarea
              className="w-full rounded-lg border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-surface-900 placeholder:text-surface-400 transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:outline-none hover:border-surface-300 min-h-[100px] resize-none"
              placeholder="Décrivez le poste, les missions, les requirements..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date limite" type="date" value={formDeadline} onChange={(e) => setFormDeadline(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleSubmit}>{editingAnnonce ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Détails de l'annonce" size="lg">
        {selectedAnnonce && (
          <div className="space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-surface-900">{selectedAnnonce.title}</h3>
                <p className="text-sm text-surface-500 mt-1">{selectedAnnonce.department} · {selectedAnnonce.type}</p>
              </div>
              <Badge variant={statusMap[selectedAnnonce.status].variant} dot size="md">
                {statusMap[selectedAnnonce.status].label}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-surface-400" />
                <div>
                  <p className="text-xs text-surface-400">Lieu</p>
                  <p className="text-sm font-medium text-surface-900">{selectedAnnonce.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-surface-400" />
                <div>
                  <p className="text-xs text-surface-400">Date limite</p>
                  <p className="text-sm font-medium text-surface-900">{selectedAnnonce.deadline}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-surface-400">Salaire</p>
                <p className="text-sm font-medium text-surface-900">{selectedAnnonce.salary}</p>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-surface-400" />
                <div>
                  <p className="text-xs text-surface-400">Candidatures</p>
                  <p className="text-sm font-medium text-surface-900">{selectedAnnonce.applications}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-surface-400 uppercase tracking-wider mb-2">Description</p>
              <p className="text-sm text-surface-700 leading-relaxed">{selectedAnnonce.description}</p>
            </div>
            <div className="flex justify-end pt-4 border-t border-surface-100">
              <Button variant="secondary" onClick={() => setShowDetail(false)}>Fermer</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Supprimer l'annonce" size="sm">
        <p className="text-sm text-surface-600 mb-6">
          Êtes-vous sûr de vouloir supprimer <strong>{deletingAnnonce?.title}</strong> ?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}

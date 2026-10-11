import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { DataTable, Pagination, type Column } from '@/components/ui/DataTable';
import { Plus, Pencil, Trash2, Search, RefreshCw, FileText } from 'lucide-react';
import { api, type Contract, type ContractInput } from '@/services/api';

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  active: { label: 'Actif', variant: 'success' },
  expired: { label: 'Expiré', variant: 'danger' },
  pending: { label: 'En attente', variant: 'warning' },
};

export default function ContractsPage() {
  const [search, setSearch] = useState('');
  const [data, setData] = useState<Contract[]>([]);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingContract, setDeletingContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formEmployee, setFormEmployee] = useState('');
  const [formType, setFormType] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formSalary, setFormSalary] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.contracts.list();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = data.filter(
    (c) =>
      c.employee_name.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase()),
  );

  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const handleRenew = async (contract: Contract) => {
    try {
      const updated = await api.contracts.renew(contract.id);
      setData((prev) => prev.map((c) => c.id === contract.id ? updated : c));
    } catch {}
  };

  const handleDelete = async () => {
    if (!deletingContract) return;
    try {
      await api.contracts.delete(deletingContract.id);
      setData((prev) => prev.filter((c) => c.id !== deletingContract.id));
      setDeletingContract(null);
      setShowDeleteConfirm(false);
    } catch {}
  };

  const openCreateModal = () => {
    setEditingContract(null);
    setFormEmployee('');
    setFormType('');
    setFormDepartment('');
    setFormSalary('');
    setFormStartDate('');
    setFormEndDate('');
    setShowModal(true);
  };

  const openEditModal = (contract: Contract) => {
    setEditingContract(contract);
    setFormEmployee(contract.employee_name);
    setFormType(contract.type);
    setFormDepartment(contract.department);
    setFormSalary(contract.salary);
    setFormStartDate(contract.start_date || '');
    setFormEndDate(contract.end_date || '');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    const payload: ContractInput = {
      employee_name: formEmployee,
      type: formType,
      department: formDepartment,
      salary: formSalary,
      start_date: formStartDate || null,
      end_date: formEndDate || null,
    };
    try {
      if (editingContract) {
        const updated = await api.contracts.update(editingContract.id, payload);
        setData((prev) => prev.map((c) => c.id === editingContract.id ? updated : c));
      } else {
        const created = await api.contracts.create({ ...payload, status: 'active' });
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

  const columns: Column<Contract>[] = [
    {
      key: 'employee_name',
      header: 'Employé',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <p className="font-medium text-surface-900">{c.employee_name}</p>
            <p className="text-xs text-surface-500">{c.department}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (c) => (
        <Badge variant={c.type === 'CDI' ? 'success' : c.type === 'CDD' ? 'info' : 'warning'}>
          {c.type}
        </Badge>
      ),
    },
    { key: 'start_date', header: 'Début' },
    {
      key: 'end_date',
      header: 'Fin',
      render: (c) => <span>{c.end_date || '—'}</span>,
    },
    { key: 'salary', header: 'Salaire' },
    {
      key: 'status',
      header: 'Statut',
      render: (c) => {
        const s = statusMap[c.status];
        return <Badge variant={s.variant} dot>{s.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contracts"
        description="Gestion des contrats de travail"
        action={
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>
            Nouveau contrat
          </Button>
        }
      />

      <Card padding={false}>
        <div className="p-4 border-b border-surface-100">
          <Input
            placeholder="Rechercher un contrat..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            icon={<Search className="w-4 h-4" />}
          />
        </div>
        <DataTable
          columns={columns}
          data={paginated}
          actions={(c) => {
            const contract = c as Contract;
            return (
              <>
                {contract.status === 'expired' && (
                  <Button variant="ghost" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => handleRenew(contract)} />
                )}
                <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEditModal(contract)} />
                <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => { setDeletingContract(contract); setShowDeleteConfirm(true); }} />
              </>
            );
          }}
          footer={<Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
        />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingContract ? 'Modifier le contrat' : 'Nouveau contrat'}>
        <div className="space-y-4">
          <Input label="Employé" placeholder="Nom de l'employé" value={formEmployee} onChange={(e) => setFormEmployee(e.target.value)} />
          <Input label="Type" placeholder="CDI / CDD / Stage" value={formType} onChange={(e) => setFormType(e.target.value)} />
          <Input label="Département" placeholder="Département" value={formDepartment} onChange={(e) => setFormDepartment(e.target.value)} />
          <Input label="Salaire" placeholder="Ex: 25,000 MAD" value={formSalary} onChange={(e) => setFormSalary(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date de début" type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
            <Input label="Date de fin" type="date" value={formEndDate} onChange={(e) => setFormEndDate(e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleSubmit}>{editingContract ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Supprimer le contrat" size="sm">
        <p className="text-sm text-surface-600 mb-6">
          Êtes-vous sûr de vouloir supprimer le contrat de <strong>{deletingContract?.employee_name}</strong> ?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}

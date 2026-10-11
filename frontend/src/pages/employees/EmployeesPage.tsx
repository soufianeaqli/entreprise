import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { DataTable, Pagination, type Column } from '@/components/ui/DataTable';
import { Search, Eye, RefreshCw } from 'lucide-react';
import { api, type Contract } from '@/services/api';

type Employee = {
  id: number;
  name: string;
  department: string;
  type: string;
  salary: string;
  startDate: string;
  status: 'active' | 'inactive';
};

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  active: { label: 'Actif', variant: 'success' },
  inactive: { label: 'Inactif', variant: 'danger' },
};

export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const contracts = await api.contracts.list();
      const employees: Employee[] = contracts.map((c: Contract) => ({
        id: c.id,
        name: c.employee_name,
        department: c.department,
        type: c.type,
        salary: c.salary,
        startDate: c.start_date || '',
        status: c.status === 'active' ? 'active' as const : 'inactive' as const,
      }));
      setData(employees);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const departments = [...new Set(data.map((e) => e.department))];

  const filtered = data.filter((e) => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !deptFilter || e.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

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

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Employé',
      render: (e) => (
        <div className="flex items-center gap-3">
          <Avatar name={e.name} size="sm" />
          <div>
            <p className="font-medium text-surface-900">{e.name}</p>
            <p className="text-xs text-surface-500">{e.department}</p>
          </div>
        </div>
      ),
    },
    { key: 'type', header: 'Type' },
    { key: 'department', header: 'Département' },
    { key: 'startDate', header: 'Date d\'entrée' },
    {
      key: 'status',
      header: 'Statut',
      render: (e) => {
        const s = statusMap[e.status];
        return <Badge variant={s.variant} dot>{s.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Liste de tous les employés de l'entreprise"
      />

      <Card padding={false}>
        <div className="p-4 border-b border-surface-100">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Rechercher un employé..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-44">
              <Select
                options={departments.map((d) => ({ value: d, label: d }))}
                placeholder="Département"
                value={deptFilter}
                onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={paginated}
          actions={(e) => (
            <Button
              variant="ghost"
              size="sm"
              icon={<Eye className="w-3.5 h-3.5" />}
              onClick={() => { setSelectedEmployee(e as Employee); setShowDetail(true); }}
            />
          )}
          footer={
            <div className="flex items-center justify-between">
              <p className="text-sm text-surface-500">{filtered.length} employé(s) trouvé(s)</p>
              <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
            </div>
          }
        />
      </Card>

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Détails de l'employé" size="lg">
        {selectedEmployee && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={selectedEmployee.name} size="xl" />
              <div>
                <h3 className="text-lg font-semibold text-surface-900">{selectedEmployee.name}</h3>
                <p className="text-sm text-surface-500">{selectedEmployee.type}</p>
                <Badge variant={statusMap[selectedEmployee.status].variant} dot size="md" className="mt-2">
                  {statusMap[selectedEmployee.status].label}
                </Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 bg-surface-50 rounded-xl">
              <div>
                <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">Département</p>
                <p className="text-sm text-surface-900 mt-1">{selectedEmployee.department}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">Date d'entrée</p>
                <p className="text-sm text-surface-900 mt-1">{selectedEmployee.startDate}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">Type de contrat</p>
                <p className="text-sm text-surface-900 mt-1">{selectedEmployee.type}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-surface-400 uppercase tracking-wider">Salaire</p>
                <p className="text-sm text-surface-900 mt-1">{selectedEmployee.salary}</p>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setShowDetail(false)}>Fermer</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  Eye,
} from 'lucide-react';
import { api, type Employee, type EmployeeStats } from '@/services/api';

const EMPLOYEES_PER_PAGE = 8;

export default function RHEmployeesPage() {
  const { rhManager } = useAuth();
  const navigate = useNavigate();
  const deptName = rhManager?.department?.name || 'votre département';

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [stats, setStats] = useState<EmployeeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<Employee | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');


  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    gender: 'male' as 'male' | 'female',
    birth_date: '',
    cin: '',
    phone: '',
    email: '',
    address: '',
    department_id: 0,
    position: '',
    hire_date: '',
    contract_type: 'CDI',
    salary: '',
    status: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (rhManager?.department?.id) {
      setForm((prev) => ({ ...prev, department_id: rhManager!.department!.id }));
    }
  }, [rhManager]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [empList, empStats] = await Promise.all([
        api.employees.list(),
        api.employees.stats(),
      ]);
      setEmployees(empList);
      setStats(empStats);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const filtered = employees.filter((e) => {
    const q = searchQuery.toLowerCase();
    return (
      e.full_name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.matricule.toLowerCase().includes(q) ||
      (e.position || '').toLowerCase().includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / EMPLOYEES_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * EMPLOYEES_PER_PAGE, currentPage * EMPLOYEES_PER_PAGE);

  const resetForm = () => {
    setForm({
      first_name: '',
      last_name: '',
      gender: 'male',
      birth_date: '',
      cin: '',
      phone: '',
      email: '',
      address: '',
      department_id: rhManager?.department?.id || 0,
      position: '',
      hire_date: '',
      contract_type: 'CDI',
      salary: '',
      status: true,
    });
    setFormError('');
  };

  const openEditModal = (emp: Employee) => {
    setForm({
      first_name: emp.first_name,
      last_name: emp.last_name,
      gender: emp.gender,
      birth_date: emp.birth_date || '',
      cin: emp.cin || '',
      phone: emp.phone || '',
      email: emp.email,
      address: emp.address || '',
      department_id: emp.department_id,
      position: emp.position || '',
      hire_date: emp.hire_date || '',
      contract_type: emp.contract_type,
      salary: emp.salary?.toString() || '',
      status: emp.status,
    });
    setEditingEmployee(emp);
    setShowModal(true);
  };

  const handleSave = async () => {
    setFormError('');
    if (!form.first_name || !form.last_name || !form.email) {
      setFormError('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setFormLoading(true);
    try {
      if (editingEmployee) {
        await api.employees.update(editingEmployee.id, {
          ...form,
          salary: form.salary ? Number(form.salary) : undefined,
        });
      } else {
        await api.employees.create({
          ...form,
          salary: form.salary ? Number(form.salary) : undefined,
        });
      }
      setShowModal(false);
      resetForm();
      loadData();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erreur lors de la sauvegarde');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (emp: Employee) => {
    setActionLoading(emp.id);
    try {
      await api.employees.delete(emp.id);
      setShowDeleteConfirm(null);
      loadData();
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatSalary = (s: number | null) => {
    if (!s) return '-';
    return new Intl.NumberFormat('fr-MA', { style: 'decimal' }).format(s) + ' DH';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-surface-500">Chargement des employés...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Employees</h1>
          <p className="text-surface-500 mt-1">
            Employés du département{' '}
            <span className="font-semibold text-primary-600">{deptName}</span>
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value={stats?.total || 0} icon={<Users className="w-5 h-5" />} iconBg="bg-blue-50 text-blue-600" />
        <StatCard title="Actifs" value={stats?.active || 0} icon={<UserCheck className="w-5 h-5" />} iconBg="bg-emerald-50 text-emerald-600" />
        <StatCard title="Inactifs" value={stats?.inactive || 0} icon={<UserX className="w-5 h-5" />} iconBg="bg-red-50 text-red-600" />
        <StatCard title="Hommes / Femmes" value={`${stats?.male || 0} / ${stats?.female || 0}`} icon={<Users className="w-5 h-5" />} iconBg="bg-purple-50 text-purple-600" />
      </div>

      {/* Search */}
      <Card padding={false}>
        <div className="p-4 border-b border-surface-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Rechercher par nom, email, matricule, poste..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                <th className="px-4 py-3">Employé</th>
                <th className="px-4 py-3">Matricule</th>
                <th className="px-4 py-3">Poste</th>
                <th className="px-4 py-3">Contrat</th>
                <th className="px-4 py-3">Salaire</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-surface-500">
                    {employees.length === 0 ? 'Aucun employé dans votre département.' : 'Aucun résultat pour votre recherche.'}
                  </td>
                </tr>
              ) : (
                paginated.map((emp) => (
                  <tr key={emp.id} className="hover:bg-surface-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold shrink-0">
                          {emp.first_name[0]}{emp.last_name[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-surface-900 truncate">{emp.full_name}</p>
                          <p className="text-xs text-surface-500 truncate">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono text-surface-600">{emp.matricule}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-surface-700">{emp.position || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.contract_type === 'CDI' ? 'success' : emp.contract_type === 'CDD' ? 'warning' : 'info'} size="sm">
                        {emp.contract_type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-surface-700">{formatSalary(emp.salary)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={emp.status ? 'success' : 'danger'} dot size="sm">
                        {emp.status ? 'Actif' : 'Inactif'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/rh/employees/${emp.id}`)}
                          className="p-1.5 rounded-lg hover:bg-primary-50 text-primary-500 hover:text-primary-700 transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEditModal(emp)}
                          className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(emp)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-surface-400 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-surface-100">
            <p className="text-sm text-surface-500">
              {filtered.length} employé{filtered.length > 1 ? 's' : ''} trouvé{filtered.length > 1 ? 's' : ''}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-40 text-surface-500"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium ${
                    p === currentPage ? 'bg-primary-600 text-white' : 'text-surface-600 hover:bg-surface-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg hover:bg-surface-100 disabled:opacity-40 text-surface-500"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="sticky top-0 bg-white border-b border-surface-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-lg font-bold text-surface-900">
                {editingEmployee ? 'Modifier l\'employé' : 'Nouvel Employé'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {formError && (
                <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{formError}</div>
              )}

              {/* Personal Info */}
              <div>
                <h3 className="text-sm font-semibold text-surface-700 mb-3 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Informations personnelles
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-surface-600 mb-1">Prénom *</label>
                    <input
                      type="text"
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 mb-1">Nom *</label>
                    <input
                      type="text"
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 mb-1">Genre *</label>
                    <select
                      value={form.gender}
                      onChange={(e) => setForm({ ...form, gender: e.target.value as 'male' | 'female' })}
                      className="w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    >
                      <option value="male">Homme</option>
                      <option value="female">Femme</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 mb-1">Date de naissance</label>
                    <input
                      type="date"
                      value={form.birth_date}
                      onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 mb-1">CIN</label>
                    <input
                      type="text"
                      value={form.cin}
                      onChange={(e) => setForm({ ...form, cin: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 mb-1">Téléphone</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-surface-600 mb-1">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-surface-600 mb-1">Adresse</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    />
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div>
                <h3 className="text-sm font-semibold text-surface-700 mb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4" /> Informations professionnelles
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-surface-600 mb-1">Poste</label>
                    <input
                      type="text"
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 mb-1">Type de contrat</label>
                    <select
                      value={form.contract_type}
                      onChange={(e) => setForm({ ...form, contract_type: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    >
                      <option value="CDI">CDI</option>
                      <option value="CDD">CDD</option>
                      <option value="Stage">Stage</option>
                      <option value="Alternance">Alternance</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 mb-1">Date d'embauche</label>
                    <input
                      type="date"
                      value={form.hire_date}
                      onChange={(e) => setForm({ ...form, hire_date: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 mb-1">Salaire (DH)</label>
                    <input
                      type="number"
                      value={form.salary}
                      onChange={(e) => setForm({ ...form, salary: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-surface-600 mb-1">Statut</label>
                    <select
                      value={form.status ? 'active' : 'inactive'}
                      onChange={(e) => setForm({ ...form, status: e.target.value === 'active' })}
                      className="w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-surface-100 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={formLoading}
                className="px-5 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {formLoading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {editingEmployee ? 'Enregistrer' : 'Créer l\'employé'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-surface-900 mb-2">Supprimer l'employé</h3>
              <p className="text-sm text-surface-500 mb-6">
                Êtes-vous sûr de vouloir supprimer <span className="font-semibold text-surface-700">{showDeleteConfirm.full_name}</span> ?
                Cette action supprimera également le compte utilisateur et le contrat associés.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleDelete(showDeleteConfirm)}
                  disabled={actionLoading === showDeleteConfirm.id}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading === showDeleteConfirm.id && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

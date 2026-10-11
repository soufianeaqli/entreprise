import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Download,
  Eye,
} from 'lucide-react';
import { api, type Contract } from '@/services/api';

const CONTRACTS_PER_PAGE = 8;

const statusConfig: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  active: { label: 'Actif', variant: 'success' },
  expired: { label: 'Expiré', variant: 'danger' },
  pending: { label: 'En attente', variant: 'warning' },
};

export default function RHContractsPage() {
  const { rhManager } = useAuth();
  const deptName = rhManager?.department?.name || 'votre département';

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await api.contracts.list();
      setContracts(list);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const filtered = contracts.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchSearch = c.employee_name.toLowerCase().includes(q) || (c.department || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / CONTRACTS_PER_PAGE));
  const paginated = filtered.slice((currentPage - 1) * CONTRACTS_PER_PAGE, currentPage * CONTRACTS_PER_PAGE);

  const activeCount = contracts.filter((c) => c.status === 'active').length;
  const expiredCount = contracts.filter((c) => c.status === 'expired').length;
  const pendingCount = contracts.filter((c) => c.status === 'pending').length;

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const handleDownloadPdf = async (contractId: number) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(api.contracts.downloadPdf(contractId), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract_${contractId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePreviewPdf = async (contractId: number) => {
    const token = localStorage.getItem('auth_token');
    const res = await fetch(api.contracts.previewPdf(contractId), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-surface-500">Chargement des contrats...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Contracts</h1>
        <p className="text-surface-500 mt-1">
          Contrats du département{' '}
          <span className="font-semibold text-primary-600">{deptName}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total" value={contracts.length} icon={<FileText className="w-5 h-5" />} iconBg="bg-blue-50 text-blue-600" />
        <StatCard title="Actifs" value={activeCount} icon={<CheckCircle className="w-5 h-5" />} iconBg="bg-emerald-50 text-emerald-600" />
        <StatCard title="Expirés" value={expiredCount} icon={<AlertTriangle className="w-5 h-5" />} iconBg="bg-red-50 text-red-600" />
        <StatCard title="En attente" value={pendingCount} icon={<Clock className="w-5 h-5" />} iconBg="bg-amber-50 text-amber-600" />
      </div>

      {/* Filters */}
      <Card padding={false}>
        <div className="p-4 border-b border-surface-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Rechercher par employé, département..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            />
          </div>
          <div className="flex gap-1 bg-surface-100 rounded-xl p-1">
            {['all', 'active', 'expired', 'pending'].map((s) => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  statusFilter === s ? 'bg-white text-primary-700 shadow-sm' : 'text-surface-500 hover:text-surface-700'
                }`}
              >
                {s === 'all' ? 'Tous' : statusConfig[s]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-medium text-surface-500 uppercase tracking-wider">
                <th className="px-4 py-3">Employé</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Département</th>
                <th className="px-4 py-3">Date début</th>
                <th className="px-4 py-3">Date fin</th>
                <th className="px-4 py-3">Salaire</th>
                <th className="px-4 py-3">Statut</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-surface-500">
                    {contracts.length === 0 ? 'Aucun contrat dans votre département.' : 'Aucun résultat pour votre recherche.'}
                  </td>
                </tr>
              ) : (
                paginated.map((contract) => (
                  <tr key={contract.id} className="hover:bg-surface-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-semibold shrink-0">
                          {contract.employee_name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-surface-900">{contract.employee_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={contract.type === 'CDI' ? 'success' : contract.type === 'CDD' ? 'warning' : 'info'} size="sm">
                        {contract.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-surface-700">{contract.department || '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-surface-400" />
                        <span className="text-sm text-surface-600">{formatDate(contract.start_date)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-surface-600">{formatDate(contract.end_date)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-surface-700">{contract.salary ? `${Number(contract.salary).toLocaleString('fr-MA')} DH` : '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={statusConfig[contract.status]?.variant || 'default'} dot size="sm">
                        {statusConfig[contract.status]?.label || contract.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handlePreviewPdf(contract.id)}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Voir le PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdf(contract.id)}
                          className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                          title="Télécharger le PDF"
                        >
                          <Download className="w-4 h-4" />
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
              {filtered.length} contrat{filtered.length > 1 ? 's' : ''}
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
    </div>
  );
}

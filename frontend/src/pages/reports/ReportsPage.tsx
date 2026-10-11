import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PageHeader } from '@/components/ui/PageHeader';
import { DataTable, Pagination, type Column } from '@/components/ui/DataTable';
import {
  Search,
  Download,
  FileText,
  Users,
  Building2,
  Briefcase,
  DollarSign,
  Printer,
  FileSpreadsheet,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { api, type ReportCategory, type ReportData } from '@/services/api';

const categoryIcons: Record<string, React.ReactNode> = {
  users: <Users className="w-5 h-5" />,
  building: <Building2 className="w-5 h-5" />,
  'file-text': <FileText className="w-5 h-5" />,
  briefcase: <Briefcase className="w-5 h-5" />,
  'dollar-sign': <DollarSign className="w-5 h-5" />,
};

const statusFilters: Record<string, { value: string; label: string }[]> = {
  employees: [
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
  ],
  departments: [
    { value: 'active', label: 'Actif' },
    { value: 'inactive', label: 'Inactif' },
  ],
  contracts: [
    { value: 'active', label: 'Actif' },
    { value: 'expired', label: 'Expiré' },
    { value: 'pending', label: 'En attente' },
  ],
  recruitment: [
    { value: 'published', label: 'Publiée' },
    { value: 'draft', label: 'Brouillon' },
    { value: 'archived', label: 'Archivée' },
  ],
  financial: [],
};

const typeFilters: Record<string, { value: string; label: string }[]> = {
  contracts: [
    { value: 'CDI', label: 'CDI' },
    { value: 'CDD', label: 'CDD' },
    { value: 'Stage', label: 'Stage' },
  ],
};

function formatCurrency(value: unknown): string {
  if (typeof value !== 'number') return String(value ?? '—');
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M MAD`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}k MAD`;
  return `${value} MAD`;
}

export default function ReportsPage() {
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [sortKey] = useState('');
  const [sortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    api.reports.getCategories()
      .then((res) => setCategories(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const fetchReport = async (category: string) => {
    setSelectedCategory(category);
    setLoadingReport(true);
    setError(null);
    setSearch('');
    setStatusFilter('');
    setTypeFilter('');
    setPage(1);
    try {
      const params: Record<string, string> = {};
      const res = await api.reports.getData(category, params);
      setReportData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoadingReport(false);
    }
  };

  const fetchWithFilters = async () => {
    if (!selectedCategory) return;
    setLoadingReport(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.type = typeFilter;
      const res = await api.reports.getData(selectedCategory, params);
      setReportData(res.data);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoadingReport(false);
    }
  };

  useEffect(() => {
    if (selectedCategory) fetchWithFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, statusFilter, typeFilter]);

  const sortedRows = (() => {
    if (!reportData?.rows) return [];
    const rows = [...reportData.rows];
    if (sortKey) {
      rows.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
        }
        const cmp = String(aVal).localeCompare(String(bVal), 'fr');
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return rows;
  })();

  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / perPage));
  const paginated = sortedRows.slice((page - 1) * perPage, page * perPage);

  const dynamicColumns: Column<Record<string, unknown>>[] = reportData
    ? Object.entries(reportData.columns).map(([key, label]) => ({
        key,
        header: label,
        className: sortKey === key ? 'text-primary-600' : undefined,
        render: (row) => {
          const value = row[key];
          if (key === 'status') {
            const isActive = String(value).toLowerCase().includes('actif') || String(value).toLowerCase().includes('active') || String(value).toLowerCase().includes('publi');
            const isExpired = String(value).toLowerCase().includes('expir');
            return (
              <Badge variant={isActive ? 'success' : isExpired ? 'danger' : 'warning'} dot>
                {String(value)}
              </Badge>
            );
          }
          if (key === 'revenue' || key === 'expenses' || key === 'profit' || key === 'salary' || key === 'budget') {
            return <span className="font-medium text-surface-900">{formatCurrency(value)}</span>;
          }
          if (key === 'employees' || key === 'employees_count' || key === 'applications' || key === 'count') {
            return <span className="font-medium text-surface-900">{String(value ?? '—')}</span>;
          }
          return <span>{String(value ?? '—')}</span>;
        },
      }))
    : [];

  const summaryEntries = reportData?.summary ? Object.entries(reportData.summary) : [];

  const summaryLabels: Record<string, string> = {
    total_employees: 'Total employés',
    total_departments: 'Total départements',
    avg_per_department: 'Moy./département',
    total: 'Total',
    active: 'Actifs',
    expired: 'Expirés',
    pending: 'En attente',
    published: 'Publiées',
    draft: 'Brouillons',
    archived: 'Archivées',
    total_applications: 'Candidatures',
    total_contracts: 'Contrats',
    total_revenue: 'Revenus totaux',
    total_expenses: 'Dépenses totales',
    total_profit: 'Bénéfices totaux',
    avg_monthly_revenue: 'Revenus moy./mois',
    avg_monthly_expenses: 'Dépenses moy./mois',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Consultez et exportez les rapports de l'entreprise"
      />

      {/* Categories Grid */}
      {!selectedCategory && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <Card
              key={cat.id}
              className="hover:shadow-md hover:shadow-surface-200/50 transition-all duration-300 cursor-pointer group"
              padding={false}
            >
              <button
                onClick={() => fetchReport(cat.id)}
                className="w-full p-5 text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
                    {categoryIcons[cat.icon] || <FileText className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-surface-900">{cat.name}</h3>
                      <ChevronRight className="w-4 h-4 text-surface-300 group-hover:text-primary-500 transition-colors" />
                    </div>
                    <p className="text-xs text-surface-500 mt-1">{cat.description}</p>
                    <p className="text-xs text-surface-400 mt-2">{cat.record_count} enregistrements</p>
                  </div>
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}

      {/* Report View */}
      {selectedCategory && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setSelectedCategory(null); setReportData(null); }}>
              ← Retour
            </Button>
            <Badge variant="info" size="md">
              {reportData?.title}
            </Badge>
          </div>

          {/* Summary Cards */}
          {summaryEntries.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {summaryEntries.map(([key, value]) => (
                <Card key={key}>
                  <p className="text-xs font-medium text-surface-500 uppercase tracking-wider">
                    {summaryLabels[key] || key}
                  </p>
                  <p className="mt-1.5 text-xl font-bold text-surface-900">
                    {typeof value === 'number' && (key.includes('revenue') || key.includes('expenses') || key.includes('profit'))
                      ? formatCurrency(value)
                      : value}
                  </p>
                </Card>
              ))}
            </div>
          )}

          {/* Filters & Actions */}
          <Card padding={false}>
            <div className="p-4 border-b border-surface-100">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Rechercher..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    icon={<Search className="w-4 h-4" />}
                  />
                </div>
                {statusFilters[selectedCategory]?.length > 0 && (
                  <div className="w-44">
                    <Select
                      options={statusFilters[selectedCategory]}
                      placeholder="Statut"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    />
                  </div>
                )}
                {typeFilters[selectedCategory]?.length > 0 && (
                  <div className="w-40">
                    <Select
                      options={typeFilters[selectedCategory]}
                      placeholder="Type"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />}>
                    PDF
                  </Button>
                  <Button variant="outline" size="sm" icon={<FileSpreadsheet className="w-4 h-4" />}>
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" icon={<Printer className="w-4 h-4" />}>
                    Imprimer
                  </Button>
                </div>
              </div>
            </div>

            {loadingReport ? (
              <div className="flex items-center justify-center h-40">
                <RefreshCw className="w-5 h-5 text-primary-500 animate-spin" />
              </div>
            ) : (
              <DataTable
                columns={dynamicColumns}
                data={paginated}
                footer={
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-surface-500">{sortedRows.length} ligne(s)</p>
                    <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
                  </div>
                }
              />
            )}
          </Card>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-red-500 text-sm mb-3">{error}</p>
          <Button variant="outline" onClick={() => { setError(null); fetchReport(selectedCategory!); }}>
            Réessayer
          </Button>
        </div>
      )}
    </div>
  );
}

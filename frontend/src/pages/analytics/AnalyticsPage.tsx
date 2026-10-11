import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Users,
  UserCog,
  Building2,
  FileText,
  Briefcase,
  TrendingUp,
  DollarSign,
  BarChart3,
  RefreshCw,
  CalendarDays,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { api, type AnalyticsData } from '@/services/api';

const periodOptions = [
  { value: '7d', label: '7 jours' },
  { value: '30d', label: '30 jours' },
  { value: '3m', label: '3 mois' },
  { value: '6m', label: '6 mois' },
  { value: '12m', label: '12 mois' },
];

const COLORS = ['#16a34a', '#2563eb', '#9333ea', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const fmtK = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-surface-100 px-4 py-3">
      <p className="text-sm font-semibold text-surface-900 mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-xs text-surface-600">
          <span className="inline-block w-2 h-2 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
          {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
        </p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('12m');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.analytics.getAll(period);
      setData(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [period]);

  if (loading && !data) {
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

  if (!data) return null;

  const k = data.kpis;
  const fin = data.financial;
  const projects = data.projects;
  const recruitments = data.recruitments;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Tableaux de bord analytiques et indicateurs clés"
        action={
          <div className="flex items-center gap-2">
            <div className="flex bg-surface-100 rounded-lg p-0.5">
              {periodOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                    period === opt.value
                      ? 'bg-white text-surface-900 shadow-sm'
                      : 'text-surface-500 hover:text-surface-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Button variant="ghost" size="sm" icon={<RefreshCw className="w-4 h-4" />} onClick={fetchData}>Actualiser</Button>
          </div>
        }
      />

      {/* KPI Row 1: Core */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard title="Employés" value={k.total_employees} icon={<Users className="w-5 h-5" />} iconBg="bg-primary-50 text-primary-600" />
        <StatCard title="RH Managers" value={k.total_rh_managers} change={k.total_rh_active} changeLabel="actifs" icon={<UserCog className="w-5 h-5" />} iconBg="bg-blue-50 text-blue-600" />
        <StatCard title="Départements" value={k.total_departments} icon={<Building2 className="w-5 h-5" />} iconBg="bg-purple-50 text-purple-600" />
        <StatCard title="Contrats actifs" value={k.active_contracts} icon={<FileText className="w-5 h-5" />} iconBg="bg-emerald-50 text-emerald-600" />
        <StatCard title="Offres emploi" value={k.job_offers} change={k.published_offers} changeLabel="publiées" icon={<Briefcase className="w-5 h-5" />} iconBg="bg-amber-50 text-amber-600" />
        <StatCard title="Projets" value={k.total_projects} change={k.active_projects} changeLabel="en cours" icon={<BarChart3 className="w-5 h-5" />} iconBg="bg-cyan-50 text-cyan-600" />
      </div>

      {/* KPI Row 2: Financial */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Revenus totaux" value={`${fmtK(fin.revenue)} MAD`} change={fin.revenue_change} changeLabel="vs préc." icon={<DollarSign className="w-5 h-5" />} iconBg="bg-emerald-50 text-emerald-600" />
        <StatCard title="Dépenses totales" value={`${fmtK(fin.expenses)} MAD`} icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-red-50 text-red-500" />
        <StatCard title="Bénéfice net" value={`${fmtK(fin.profit)} MAD`} icon={<DollarSign className="w-5 h-5" />} iconBg="bg-blue-50 text-blue-600" />
        <StatCard title="Croissance" value={`${k.growth_rate}%`} icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-primary-50 text-primary-600" />
      </div>

      {/* KPI Row 3: Activity */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-surface-900">{data.meetings.total}</p>
            <p className="text-xs text-surface-500">Réunions ({data.meetings.upcoming} à venir)</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-surface-900">{fin.budget_used}%</p>
            <p className="text-xs text-surface-500">Budget utilisé</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-surface-900">{k.total_applications}</p>
            <p className="text-xs text-surface-500">Candidatures reçues</p>
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenus vs Dépenses</CardTitle>
            <CardDescription>Évolution mensuelle comparative</CardDescription>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_vs_expenses}>
                <defs>
                  <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="bGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${fmtK(v)}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenus" stroke="#16a34a" strokeWidth={2.5} fill="url(#aGrad)" />
                <Area type="monotone" dataKey="expenses" name="Dépenses" stroke="#ef4444" strokeWidth={2} fill="url(#bGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Croissance des employés</CardTitle>
            <CardDescription>Évolution du nombre total d'employés</CardDescription>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.employee_growth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Line type="monotone" dataKey="employees" name="Employés" stroke="#16a34a" strokeWidth={2.5} dot={{ fill: '#16a34a', r: 4, strokeWidth: 2, stroke: '#fff' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tendance recrutement</CardTitle>
            <CardDescription>Candidatures et embauches</CardDescription>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.recruitment_trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Legend />
                <Bar dataKey="applications" name="Candidatures" fill="#d1d5db" radius={[6, 6, 0, 0]} />
                <Bar dataKey="hired" name="Recrutés" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition départements</CardTitle>
            <CardDescription>Distribution des employés</CardDescription>
          </CardHeader>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.department_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {data.department_distribution.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} employés`, name]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-1.5 mt-1">
            {data.department_distribution.map((d, idx) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-surface-600 truncate">{d.name}</span>
                <span className="ml-auto font-medium text-surface-900">{d.value}</span>
              </div>
            ))}
            {data.department_distribution.length === 0 && (
              <p className="text-xs text-surface-400 text-center col-span-2 py-2">Aucune donnée</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statut contrats</CardTitle>
            <CardDescription>Répartition par statut</CardDescription>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.contracts_status} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="status" type="category" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Bar dataKey="count" name="Contrats" radius={[0, 6, 6, 0]}>
                  {data.contracts_status.map((entry, idx) => (
                    <Cell key={idx} fill={entry.status === 'Active' ? '#16a34a' : entry.status === 'Expirés' ? '#ef4444' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Monthly Growth */}
      <Card>
        <CardHeader>
          <CardTitle>Croissance mensuelle</CardTitle>
          <CardDescription>Évolution totale (employés + contrats actifs)</CardDescription>
        </CardHeader>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.monthly_growth}>
              <defs>
                <linearGradient id="gGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#16a34a" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total" name="Total" stroke="#16a34a" strokeWidth={2.5} fill="url(#gGrad)" dot={{ fill: '#16a34a', r: 3, strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Projects & Recruitments Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Vue des projets</CardTitle>
            <CardDescription>{projects.total} projet{projects.total > 1 ? 's' : ''} · Budget: {fmtK(projects.total_budget)} MAD</CardDescription>
          </CardHeader>
          <div className="px-5 pb-5">
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-xl bg-surface-50">
                <p className="text-lg font-bold text-surface-900">{fmtK(projects.total_income)}</p>
                <p className="text-xs text-surface-500">Revenus projets</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-surface-50">
                <p className="text-lg font-bold text-surface-900">{fmtK(projects.total_expenses)}</p>
                <p className="text-xs text-surface-500">Dépenses projets</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-surface-50">
                <p className={`text-lg font-bold ${projects.total_income - projects.total_expenses >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {fmtK(projects.total_income - projects.total_expenses)}
                </p>
                <p className="text-xs text-surface-500">Résultat</p>
              </div>
            </div>
            {projects.recent.length > 0 && (
              <div className="space-y-1.5">
                {projects.recent.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-surface-50 last:border-0">
                    <span className="text-surface-700 truncate">{p.name}</span>
                    <span className="text-xs text-surface-500 ml-2 shrink-0">{fmtK(p.budget)} MAD</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vue des recrutements</CardTitle>
            <CardDescription>{recruitments.total} offre{recruitments.total > 1 ? 's' : ''} · {recruitments.total_applications} candidature{recruitments.total_applications > 1 ? 's' : ''}</CardDescription>
          </CardHeader>
          <div className="px-5 pb-5">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="text-center p-3 rounded-xl bg-surface-50">
                <p className="text-lg font-bold text-surface-900">{recruitments.total_positions}</p>
                <p className="text-xs text-surface-500">Postes à pourvoir</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-surface-50">
                <p className="text-lg font-bold text-surface-900">{recruitments.total_applications}</p>
                <p className="text-xs text-surface-500">Candidatures totales</p>
              </div>
            </div>
            {Object.keys(recruitments.by_status).length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {Object.entries(recruitments.by_status).map(([status, count]) => (
                  <Badge key={status} variant={status === 'published' ? 'success' : status === 'draft' ? 'warning' : status === 'closed' ? 'danger' : 'default'}>
                    {status}: {count}
                  </Badge>
                ))}
              </div>
            )}
            {recruitments.recent.length > 0 && (
              <div className="space-y-1.5">
                {recruitments.recent.slice(0, 4).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-sm py-1.5 border-b border-surface-50 last:border-0">
                    <span className="text-surface-700 truncate">{r.title}</span>
                    <span className="text-xs text-surface-500 ml-2 shrink-0">{r.applications_count} candidature{r.applications_count > 1 ? 's' : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

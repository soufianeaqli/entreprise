import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Users,
  UserCog,
  Building2,
  FileText,
  Briefcase,
  DollarSign,
  TrendingUp,
  CalendarDays,
  Activity,
  ArrowUpRight,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { api, type AnalyticsData } from '@/services/api';

const COLORS = ['#16a34a', '#2563eb', '#9333ea', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 0 }).format(n);
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

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  published: 'success',
  draft: 'warning',
  closed: 'danger',
  archived: 'default',
  active: 'success',
  in_progress: 'info',
  completed: 'success',
  pending: 'warning',
  cancelled: 'danger',
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.analytics.getAll('12m');
      setAnalytics(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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

  if (!analytics) return null;

  const k = analytics.kpis;
  const fin = analytics.financial;
  const projects = analytics.projects;
  const recruitments = analytics.recruitments;

  return (
    <div className="space-y-6">
      {/* Row 1: Core KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="Employés"
          value={k.total_employees}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-primary-50 text-primary-600"
        />
        <StatCard
          title="RH Managers"
          value={k.total_rh_managers}
          change={k.total_rh_active}
          changeLabel="actifs"
          icon={<UserCog className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Départements"
          value={k.total_departments}
          icon={<Building2 className="w-5 h-5" />}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Contrats actifs"
          value={k.active_contracts}
          change={k.contracts_expired}
          changeLabel="expirés"
          icon={<FileText className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Offres emploi"
          value={k.job_offers}
          change={k.published_offers}
          changeLabel="publiées"
          icon={<Briefcase className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Projets"
          value={k.total_projects}
          change={k.active_projects}
          changeLabel="en cours"
          icon={<Activity className="w-5 h-5" />}
          iconBg="bg-cyan-50 text-cyan-600"
        />
      </div>

      {/* Row 2: Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Revenus totaux"
          value={`${fmtK(fin.revenue)} MAD`}
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Dépenses totales"
          value={`${fmtK(fin.expenses)} MAD`}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-red-50 text-red-500"
        />
        <StatCard
          title="Bénéfice net"
          value={`${fmtK(fin.profit)} MAD`}
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Croissance"
          value={`${k.growth_rate}%`}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-primary-50 text-primary-600"
        />
      </div>

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Revenus vs Dépenses</CardTitle>
            <CardDescription>Évolution mensuelle sur 12 mois</CardDescription>
          </CardHeader>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.revenue_vs_expenses}>
                <defs>
                  <linearGradient id="dashRevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#16a34a" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="dashExpGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${fmtK(v)}`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenus" stroke="#16a34a" strokeWidth={2.5} fill="url(#dashRevGrad)" />
                <Area type="monotone" dataKey="expenses" name="Dépenses" stroke="#ef4444" strokeWidth={2} fill="url(#dashExpGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition départements</CardTitle>
            <CardDescription>Distribution des employés par département</CardDescription>
          </CardHeader>
          <div className="flex items-center gap-6">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.department_distribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {analytics.department_distribution.map((_, idx) => (
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
            <div className="flex-1 grid grid-cols-1 gap-1.5">
              {analytics.department_distribution.map((d, idx) => (
                <div key={d.name} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="text-surface-600 truncate flex-1">{d.name}</span>
                  <span className="font-semibold text-surface-900">{d.value}</span>
                </div>
              ))}
              {analytics.department_distribution.length === 0 && (
                <p className="text-xs text-surface-400 text-center py-4">Aucune donnée</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recruitment Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Tendance recrutement</CardTitle>
            <CardDescription>Candidatures et recrutements mensuels</CardDescription>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.recruitment_trend}>
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

        {/* Employee Growth */}
        <Card>
          <CardHeader>
            <CardTitle>Croissance effectifs</CardTitle>
            <CardDescription>Évolution du nombre total d'employés</CardDescription>
          </CardHeader>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.employee_growth}>
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

      {/* Row 4: Contracts Status + Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Statut contrats</CardTitle>
            <CardDescription>Répartition par statut</CardDescription>
          </CardHeader>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.contracts_status} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis dataKey="status" type="category" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '12px' }} />
                <Bar dataKey="count" name="Contrats" radius={[0, 6, 6, 0]}>
                  {analytics.contracts_status.map((entry, idx) => (
                    <Cell key={idx} fill={entry.status === 'Active' ? '#16a34a' : entry.status === 'Expirés' ? '#ef4444' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/finance')}>
                <ArrowRight className="w-4 h-4" />
              </Button>
            }
          >
            <CardTitle>Projets récents</CardTitle>
            <CardDescription>{projects.total} projet{projects.total > 1 ? 's' : ''} au total</CardDescription>
          </CardHeader>
          <div className="space-y-2 px-5 pb-5">
            {projects.recent.length > 0 ? projects.recent.map((p) => (
              <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 transition-colors cursor-pointer" onClick={() => navigate(`/finance/${p.id}`)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 truncate">{p.name}</p>
                  <p className="text-xs text-surface-500">{fmt(p.budget)} MAD budget</p>
                </div>
                <Badge variant={statusVariant[p.status] || 'default'}>{p.status}</Badge>
              </div>
            )) : (
              <p className="text-sm text-surface-400 text-center py-4">Aucun projet</p>
            )}
          </div>
        </Card>

        {/* Recent Recruitments */}
        <Card>
          <CardHeader
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/recruitments')}>
                <ArrowRight className="w-4 h-4" />
              </Button>
            }
          >
            <CardTitle>Recrutements récents</CardTitle>
            <CardDescription>{recruitments.total} offre{recruitments.total > 1 ? 's' : ''}, {recruitments.total_applications} candidature{recruitments.total_applications > 1 ? 's' : ''}</CardDescription>
          </CardHeader>
          <div className="space-y-2 px-5 pb-5">
            {recruitments.recent.length > 0 ? recruitments.recent.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-50 transition-colors cursor-pointer" onClick={() => navigate(`/recruitments/${r.id}`)}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900 truncate">{r.title}</p>
                  <p className="text-xs text-surface-500">{r.department || 'N/A'} · {r.applications_count} candidature{r.applications_count > 1 ? 's' : ''}</p>
                </div>
                <Badge variant={statusVariant[r.status] || 'default'}>{r.status}</Badge>
              </div>
            )) : (
              <p className="text-sm text-surface-400 text-center py-4">Aucune offre</p>
            )}
          </div>
        </Card>
      </div>

      {/* Row 5: Activity Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="flex items-center gap-3 p-4">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-surface-900">{analytics.meetings.total}</p>
            <p className="text-xs text-surface-500">Réunions ({analytics.meetings.upcoming} à venir)</p>
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
    </div>
  );
}

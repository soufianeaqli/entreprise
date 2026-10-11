import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { useAuth } from '@/contexts/AuthContext';
import {
  Users,
  UserCheck,
  FileText,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Building2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
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
import { api, type RhDashboardData } from '@/services/api';

const COLORS = ['#16a34a', '#2563eb', '#9333ea', '#f59e0b', '#ef4444', '#06b6d4'];

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

export default function RHDashboardPage() {
  const { user, rhManager } = useAuth();
  const [dashboardData, setDashboardData] = useState<RhDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await api.rhDashboard.getData();
        setDashboardData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-surface-500">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-surface-500">{error}</p>
      </div>
    );
  }

  const deptName = rhManager?.department?.name || dashboardData?.department?.name || 'Département';
  const deptCode = rhManager?.department?.code || dashboardData?.department?.code || '';
  const kpis = dashboardData?.kpis;

  const activities = dashboardData?.recent_activities || [];
  const activityTypes = activities.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const activityData = Object.entries(activityTypes).map(([type, count]) => ({
    name: type === 'employee' ? 'Employés' : type === 'contract' ? 'Contrats' : 'Réunions',
    count,
  }));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">
            Bonjour, {user?.name?.split(' ')[0] || 'RH'} 👋
          </h1>
          <p className="text-surface-500 mt-1">
            Voici le tableau de bord de votre département
            <span className="font-semibold text-primary-600 ml-1">{deptName}</span>
            {deptCode && <span className="text-surface-400 ml-1">({deptCode})</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-50 border border-primary-100">
          <Building2 className="w-4 h-4 text-primary-600" />
          <span className="text-sm font-medium text-primary-700">{deptName}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          title="Total Employees"
          value={kpis?.total_employees || 0}
          icon={<Users className="w-5 h-5" />}
          iconBg="bg-blue-50 text-blue-600"
        />
        <StatCard
          title="Active Employees"
          value={kpis?.active_employees || 0}
          icon={<UserCheck className="w-5 h-5" />}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          title="Active Contracts"
          value={kpis?.active_contracts || 0}
          icon={<FileText className="w-5 h-5" />}
          iconBg="bg-purple-50 text-purple-600"
        />
        <StatCard
          title="Recruitment"
          value={kpis?.recruitment_in_progress || 0}
          icon={<Briefcase className="w-5 h-5" />}
          iconBg="bg-amber-50 text-amber-600"
        />
        <StatCard
          title="Meetings Today"
          value={kpis?.meetings_today || 0}
          icon={<CalendarDays className="w-5 h-5" />}
          iconBg="bg-cyan-50 text-cyan-600"
        />
        <StatCard
          title="Pending Tasks"
          value={kpis?.pending_tasks || 0}
          icon={<ClipboardList className="w-5 h-5" />}
          iconBg="bg-rose-50 text-rose-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Répartition des Activités</CardTitle>
            <CardDescription>Types d'activités récentes</CardDescription>
          </CardHeader>
          <div className="h-72 flex items-center justify-center">
            {activityData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {activityData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value: string) => <span className="text-xs text-surface-600">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-surface-400">Aucune donnée disponible</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Indicateurs Clés</CardTitle>
            <CardDescription>Aperçu de votre département</CardDescription>
          </CardHeader>
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { name: 'Employees', value: kpis?.total_employees || 0 },
                { name: 'Contracts', value: kpis?.active_contracts || 0 },
                { name: 'Recruitment', value: kpis?.recruitment_in_progress || 0 },
                { name: 'Meetings', value: kpis?.meetings_today || 0 },
              ]} barSize={40}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Nombre" radius={[6, 6, 0, 0]}>
                  {[0, 1, 2, 3].map((index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Activities */}
      {activities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Activités Récentes</CardTitle>
            <CardDescription>Dernières activités de votre département</CardDescription>
          </CardHeader>
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4 p-3 rounded-xl bg-surface-50 hover:bg-surface-100/50 transition-colors">
                <div className={
                  activity.type === 'employee' ? 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-blue-50 text-blue-600' :
                  activity.type === 'contract' ? 'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-purple-50 text-purple-600' :
                  'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-cyan-50 text-cyan-600'
                }>
                  {activity.type === 'employee' ? <Users className="w-4 h-4" /> :
                   activity.type === 'contract' ? <FileText className="w-4 h-4" /> :
                   <CalendarDays className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-700">{activity.text}</p>
                  <p className="text-xs text-surface-400 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

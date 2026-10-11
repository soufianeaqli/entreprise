import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Avatar } from '@/components/ui/Avatar';
import { DataTable, Pagination, type Column } from '@/components/ui/DataTable';
import {
  Plus, Pencil, Trash2, Search, RefreshCw, Eye, Calendar,
  Clock, Users, CheckCircle2, MapPin,
  Video, ArrowUpDown,
} from 'lucide-react';
import {
  api, ApiError, type Meeting, type MeetingInput, type MeetingStats,
  type MeetingDecision, type MeetingTask, type MeetingAttachment,
  type RhManager, type Department,
} from '@/services/api';
import { useFormAssistant } from '@/hooks/useFormAssistant';
import { FormAssistantPanel } from '@/components/ai/FormAssistantPanel';

const TABS = ['all', 'calendar', 'completed'] as const;
type Tab = typeof TABS[number];

const TYPE_LABELS: Record<string, string> = {
  regular: 'Réunion', weekly: 'Hebdomadaire', monthly: 'Mensuelle',
  special: 'Spéciale', training: 'Formation', evaluation: 'Évaluation',
};
const PRIORITY_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
  low: 'info', medium: 'success', high: 'warning', urgent: 'danger',
};
const STATUS_VARIANT: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
  scheduled: 'info', in_progress: 'warning', completed: 'success', cancelled: 'danger',
};
const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Planifiée', in_progress: 'En cours', completed: 'Terminée', cancelled: 'Annulée',
};
const PRIORITY_LABELS: Record<string, string> = {
  low: 'Basse', medium: 'Moyenne', high: 'Haute', urgent: 'Urgente',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const EMPTY_MEETING: MeetingInput = {
  title: '', description: null, type: 'regular', department_id: null,
  rh_manager_id: null, date: '', start_time: '09:00', end_time: '10:00',
  location: null, meeting_link: null, priority: 'medium', status: 'scheduled',
  participants: [],
};

export default function MeetingsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('all');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<Meeting[]>([]);
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingMeeting, setDeletingMeeting] = useState<Meeting | null>(null);
  const [form, setForm] = useState<MeetingInput>(EMPTY_MEETING);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [availableRh, setAvailableRh] = useState<RhManager[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sortField, setSortField] = useState<'date' | 'priority'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState('');
  const [filterPriority, setFilterPriority] = useState('');

  const setField = (key: keyof MeetingInput, value: MeetingInput[keyof MeetingInput]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setFormErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const statusParam = tab !== 'all' && tab !== 'calendar' ? tab : undefined;
      const [meetings, statsRes] = await Promise.all([
        api.meetings.list(statusParam),
        api.meetings.stats(),
      ]);
      setData(meetings);
      setStats(statsRes.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [tab]);

  const fetchFormDeps = async () => {
    try {
      const [rh, depts] = await Promise.all([api.rhManagers.list(), api.departments.list()]);
      setAvailableRh(rh);
      setDepartments(depts);
    } catch {}
  };

  const filtered = useMemo(() => {
    let result = data;

    if (tab === 'calendar') {
      result = result.filter((m) => m.status === 'scheduled');
    }

    if (search) {
      const s = search.toLowerCase();
      result = result.filter((m) =>
        m.title.toLowerCase().includes(s) ||
        m.department?.name?.toLowerCase().includes(s) ||
        m.rh_manager?.full_name?.toLowerCase().includes(s)
      );
    }

    if (filterType) result = result.filter((m) => m.type === filterType);
    if (filterPriority) result = result.filter((m) => m.priority === filterPriority);

    result = [...result].sort((a, b) => {
      if (sortField === 'date') {
        const cmp = a.date.localeCompare(b.date);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const order = { urgent: 0, high: 1, medium: 2, low: 3 };
      const cmp = (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [data, search, tab, filterType, filterPriority, sortField, sortDir]);

  const perPage = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const openCreateModal = async () => {
    setEditingMeeting(null);
    setForm({ ...EMPTY_MEETING, date: new Date().toISOString().split('T')[0] });
    setFormErrors({});
    await fetchFormDeps();
    setShowModal(true);
  };

  const openEditModal = async (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setForm({
      title: meeting.title,
      description: meeting.description,
      type: meeting.type,
      department_id: meeting.department?.id ?? null,
      rh_manager_id: meeting.rh_manager?.id ?? null,
      date: meeting.date,
      start_time: meeting.start_time,
      end_time: meeting.end_time,
      location: meeting.location,
      meeting_link: meeting.meeting_link,
      priority: meeting.priority,
      status: meeting.status,
      participants: meeting.participants?.map((p) => p.id) ?? [],
    });
    setFormErrors({});
    await fetchFormDeps();
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setFormErrors({});
    try {
      if (editingMeeting) {
        const updated = await api.meetings.update(editingMeeting.id, form);
        setData((prev) => prev.map((m) => m.id === editingMeeting.id ? updated : m));
      } else {
        const created = await api.meetings.create(form);
        setData((prev) => [created, ...prev]);
      }
      setShowModal(false);
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldErrors: Record<string, string> = {};
        for (const [field, messages] of Object.entries(err.errors)) {
          fieldErrors[field] = messages[0];
        }
        setFormErrors({ _server: err.message, ...fieldErrors });
      } else if (err instanceof Error) {
        setFormErrors({ _server: err.message });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingMeeting) return;
    try {
      await api.meetings.delete(deletingMeeting.id);
      setData((prev) => prev.filter((m) => m.id !== deletingMeeting.id));
      setDeletingMeeting(null);
      setShowDeleteConfirm(false);
    } catch {}
  };

  const toggleParticipant = (rhId: number) => {
    setForm((f) => {
      const current = f.participants ?? [];
      const updated = current.includes(rhId) ? current.filter((id) => id !== rhId) : [...current, rhId];
      return { ...f, participants: updated };
    });
  };

  const assistantContext = { title: form.title, type: form.type, department_id: form.department_id, priority: form.priority };
  const { suggestions, loading: assistantLoading, error: assistantError, regenerate: regenerateSuggestions } = useFormAssistant({
    module: 'meeting',
    context: assistantContext,
    enabled: showModal,
  });

  const insertSuggestion = (field: string, value: string) => {
    if (field === 'description') setField('description', value);
    else if (field === 'minutes_summary') setField('minutes_summary', value);
    else if (field === 'minutes_objective') setField('minutes_objective', value);
    else if (field === 'minutes_key_points') setField('minutes_key_points', value);
    else if (field === 'minutes_notes') setField('minutes_notes', value);
  };

  if (loading && !data.length) {
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

  const columns: Column<Meeting>[] = [
    {
      key: 'title',
      header: 'Réunion',
      render: (m) => (
        <div>
          <p className="font-medium text-surface-900">{m.title}</p>
          <p className="text-xs text-surface-500">{TYPE_LABELS[m.type] || m.type}</p>
        </div>
      ),
    },
    {
      key: 'department',
      header: 'Département',
      render: (m) => m.department ? <Badge variant="info">{m.department.name}</Badge> : <span className="text-surface-400 text-sm">—</span>,
    },
    {
      key: 'rh_manager',
      header: 'Responsable',
      render: (m) => m.rh_manager ? (
        <div className="flex items-center gap-2">
          <Avatar name={m.rh_manager.full_name} size="sm" />
          <span className="text-sm text-surface-700">{m.rh_manager.full_name}</span>
        </div>
      ) : <span className="text-surface-400 text-sm">—</span>,
    },
    {
      key: 'date',
      header: 'Date',
      render: (m) => (
        <div className="flex items-center gap-1.5 text-sm text-surface-700">
          <Calendar className="w-3.5 h-3.5 text-surface-400" />
          {m.date}
        </div>
      ),
    },
    {
      key: 'start_time',
      header: 'Heure',
      render: (m) => (
        <div className="flex items-center gap-1.5 text-sm text-surface-700">
          <Clock className="w-3.5 h-3.5 text-surface-400" />
          {m.start_time} — {m.end_time}
        </div>
      ),
    },
    {
      key: 'participants_count',
      header: 'Participants',
      render: (m) => (
        <div className="flex items-center gap-1.5 text-sm">
          <Users className="w-3.5 h-3.5 text-surface-400" />
          <span className="font-medium text-surface-900">{m.participants_count ?? m.participants?.length ?? 0}</span>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priorité',
      render: (m) => <Badge variant={PRIORITY_VARIANT[m.priority] || 'info'}>{PRIORITY_LABELS[m.priority] || m.priority}</Badge>,
    },
    {
      key: 'status',
      header: 'Statut',
      render: (m) => <Badge variant={STATUS_VARIANT[m.status] || 'info'} dot>{STATUS_LABELS[m.status] || m.status}</Badge>,
    },
  ];

  const statsCards = stats ? [
    { label: 'Total', value: stats.total, icon: <Calendar className="w-5 h-5" />, color: 'bg-primary-50 text-primary-600' },
    { label: "Aujourd'hui", value: stats.today, icon: <Clock className="w-5 h-5" />, color: 'bg-blue-50 text-blue-600' },
    { label: 'Terminées', value: stats.completed, icon: <CheckCircle2 className="w-5 h-5" />, color: 'bg-emerald-50 text-emerald-600' },
  ] : [];

  if (tab === 'calendar') {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Meetings & Events"
          description="Gestion des réunions et événements"
          action={<Button icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>Nouvelle réunion</Button>}
        />
        <Tabs tab={tab} setTab={setTab} />
        <CalendarView meetings={data} onMeetingClick={(m) => navigate(`/meetings/${m.id}`)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meetings & Events"
        description="Gestion des réunions et événements"
        action={<Button icon={<Plus className="w-4 h-4" />} onClick={openCreateModal}>Nouvelle réunion</Button>}
      />

      <Tabs tab={tab} setTab={setTab} />

      {stats && (
        <div className="grid grid-cols-3 gap-4">
          {statsCards.map((s) => (
            <Card key={s.label} className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>{s.icon}</div>
              <div>
                <p className="text-2xl font-bold text-surface-900">{s.value}</p>
                <p className="text-xs text-surface-500">{s.label}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card padding={false}>
        <div className="p-4 border-b border-surface-100 flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              placeholder="Rechercher par titre, département ou responsable..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              icon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex gap-2">
            <Select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setPage(1); }}
              options={[{ value: '', label: 'Tous les types' }, ...Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))]}
              placeholder="Type"
              className="w-40"
            />
            <Select
              value={filterPriority}
              onChange={(e) => { setFilterPriority(e.target.value); setPage(1); }}
              options={[{ value: '', label: 'Toutes priorités' }, ...Object.entries(PRIORITY_LABELS).map(([v, l]) => ({ value: v, label: l }))]}
              placeholder="Priorité"
              className="w-40"
            />
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowUpDown className="w-3.5 h-3.5" />}
              onClick={() => setSortDir((d) => d === 'asc' ? 'desc' : 'asc')}
            >
              {sortField === 'date' ? 'Date' : 'Priorité'} {sortDir === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>
        <DataTable
          columns={columns}
          data={paginated}
          actions={(m) => (
            <>
              <Button variant="ghost" size="sm" icon={<Eye className="w-3.5 h-3.5" />} onClick={() => navigate(`/meetings/${m.id}`)} />
              <Button variant="ghost" size="sm" icon={<Pencil className="w-3.5 h-3.5" />} onClick={() => openEditModal(m as Meeting)} />
              <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />} onClick={() => { setDeletingMeeting(m as Meeting); setShowDeleteConfirm(true); }} />
            </>
          )}
          footer={<Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />}
        />
      </Card>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingMeeting ? 'Modifier la réunion' : 'Nouvelle réunion'} size="xl">
        <div className="flex gap-6">
          <div className="flex-1 space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          {formErrors._server && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{formErrors._server}</p>}

          <div>
            <h4 className="text-sm font-semibold text-surface-900 mb-3">Informations générales</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Titre *" placeholder="Titre de la réunion" value={form.title || ''} onChange={(e) => setField('title', e.target.value)} className="col-span-2" />
              <Input label="Description" placeholder="Description..." value={form.description || ''} onChange={(e) => setField('description', e.target.value || null)} className="col-span-2" />
              <Select label="Type *" value={form.type || ''} onChange={(e) => setField('type', e.target.value)} options={Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
              <Select label="Priorité *" value={form.priority || ''} onChange={(e) => setField('priority', e.target.value)} options={Object.entries(PRIORITY_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
              <Select
                label="Département"
                value={form.department_id?.toString() || ''}
                onChange={(e) => setField('department_id', e.target.value ? Number(e.target.value) : null)}
                placeholder="Sélectionner"
                options={departments.map((d) => ({ value: d.id.toString(), label: d.name }))}
              />
              <Select
                label="Responsable RH"
                value={form.rh_manager_id?.toString() || ''}
                onChange={(e) => setField('rh_manager_id', e.target.value ? Number(e.target.value) : null)}
                placeholder="Sélectionner"
                options={availableRh.map((r) => ({ value: r.id.toString(), label: r.full_name }))}
              />
            </div>
          </div>

          <div className="border-t border-surface-100 pt-4">
            <h4 className="text-sm font-semibold text-surface-900 mb-3">Date & Lieu</h4>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Date *" type="date" value={form.date || ''} onChange={(e) => setField('date', e.target.value)} />
              <Input label="Statut" value={form.status || 'scheduled'} onChange={(e) => setField('status', e.target.value)} disabled />
              <Input label="Heure de début *" type="time" value={form.start_time || ''} onChange={(e) => setField('start_time', e.target.value)} />
              <Input label="Heure de fin *" type="time" value={form.end_time || ''} onChange={(e) => setField('end_time', e.target.value)} />
              <Input label="Salle / Lieu" placeholder="Ex: Salle de réunion A" value={form.location || ''} onChange={(e) => setField('location', e.target.value || null)} />
              <Input label="Lien Meet/Zoom" placeholder="https://..." value={form.meeting_link || ''} onChange={(e) => setField('meeting_link', e.target.value || null)} />
            </div>
          </div>

          <div className="border-t border-surface-100 pt-4">
            <h4 className="text-sm font-semibold text-surface-900 mb-3">Participants</h4>
            <div className="flex flex-wrap gap-2">
              {availableRh.map((rh) => {
                const selected = form.participants?.includes(rh.id);
                return (
                  <button
                    key={rh.id}
                    type="button"
                    onClick={() => toggleParticipant(rh.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all ${
                      selected
                        ? 'border-primary-300 bg-primary-50 text-primary-700'
                        : 'border-surface-200 bg-white text-surface-600 hover:border-surface-300'
                    }`}
                  >
                    <Avatar name={rh.full_name} size="sm" />
                    <span>{rh.full_name}</span>
                    {selected && <CheckCircle2 className="w-3.5 h-3.5 text-primary-500" />}
                  </button>
                );
              })}
              {availableRh.length === 0 && <p className="text-sm text-surface-400">Aucun RH disponible</p>}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button variant="secondary" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button onClick={handleSubmit} disabled={submitting}>{editingMeeting ? 'Enregistrer' : 'Créer'}</Button>
          </div>
        </div>
        <FormAssistantPanel
          suggestions={suggestions}
          loading={assistantLoading}
          error={assistantError}
          onInsert={insertSuggestion}
          onRegenerate={regenerateSuggestions}
        />
      </div>
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Supprimer la réunion" size="sm">
        <p className="text-sm text-surface-600 mb-6">
          Êtes-vous sûr de vouloir supprimer <strong>{deletingMeeting?.title}</strong> ?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}

function Tabs({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const labels: Record<Tab, string> = {
    all: 'All Meetings', calendar: 'Calendar', completed: 'Completed',
  };
  return (
    <div className="flex gap-1 bg-surface-100 rounded-xl p-1">
      {TABS.map((t) => (
        <button
          key={t}
          onClick={() => setTab(t)}
          className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === t ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          {labels[t]}
        </button>
      ))}
    </div>
  );
}

function CalendarView({ meetings, onMeetingClick }: { meetings: Meeting[]; onMeetingClick: (m: Meeting) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPadding = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const meetingByDate = useMemo(() => {
    const map: Record<string, Meeting[]> = {};
    meetings.forEach((m) => {
      if (!map[m.date]) map[m.date] = [];
      map[m.date].push(m);
    });
    return map;
  }, [meetings]);

  const today = new Date().toISOString().split('T')[0];

  const days = [];
  for (let i = 0; i < startPadding; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const frMonths = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  return (
    <Card>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month - 1, 1))}>←</Button>
          <h3 className="text-lg font-semibold text-surface-900">{frMonths[month]} {year}</h3>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month + 1, 1))}>→</Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())}>Aujourd'hui</Button>
        </div>
        <div className="flex gap-1 bg-surface-100 rounded-lg p-1">
          {(['month', 'week', 'day'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === mode ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500'
              }`}
            >
              {mode === 'month' ? 'Mois' : mode === 'week' ? 'Semaine' : 'Jour'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px bg-surface-200 rounded-lg overflow-hidden">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
          <div key={d} className="bg-surface-50 px-3 py-2 text-xs font-semibold text-surface-500 text-center">{d}</div>
        ))}
        {days.map((day, i) => {
          if (day === null) return <div key={`pad-${i}`} className="bg-white min-h-[100px]" />;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayMeetings = meetingByDate[dateStr] || [];
          const isToday = dateStr === today;

          return (
            <div key={day} className={`bg-white min-h-[100px] p-2 ${isToday ? 'ring-2 ring-primary-500 ring-inset' : ''}`}>
              <p className={`text-sm font-medium mb-1 ${isToday ? 'text-primary-600' : 'text-surface-700'}`}>{day}</p>
              <div className="space-y-1">
                {dayMeetings.slice(0, 3).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => onMeetingClick(m)}
                    className={`w-full text-left px-2 py-1 rounded text-xs font-medium truncate transition-all hover:opacity-80 ${
                      m.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      m.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      m.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                      m.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                      'bg-primary-100 text-primary-700'
                    }`}
                  >
                    {m.start_time?.slice(0, 5)} {m.title}
                  </button>
                ))}
                {dayMeetings.length > 3 && (
                  <p className="text-xs text-surface-400 px-2">+{dayMeetings.length - 3} de plus</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

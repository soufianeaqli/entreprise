import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ChevronLeft, ChevronRight, X, Clock, MapPin, Users, User,
  Briefcase, FileText, AlertTriangle, Calendar,
  Filter, Eye, EyeOff, Bell, ChevronDown,
} from 'lucide-react';
import { api, type CalendarEvent, type CalendarNotification, type CalendarEventType } from '@/services/api';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const HOUR_SLOTS = Array.from({ length: 12 }, (_, i) => i + 7);

const TYPE_CONFIG: Record<CalendarEventType, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  interview: { label: 'Entretien', color: '#3b82f6', bg: 'bg-blue-50 text-blue-700 border-blue-200', icon: <Briefcase className="w-3.5 h-3.5" /> },
  meeting: { label: 'Réunion', color: '#22c55e', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <Users className="w-3.5 h-3.5" /> },
  contract: { label: 'Contrat', color: '#ef4444', bg: 'bg-red-50 text-red-700 border-red-200', icon: <FileText className="w-3.5 h-3.5" /> },
  trial: { label: 'Essai', color: '#eab308', bg: 'bg-amber-50 text-amber-700 border-amber-200', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

const STATUS_MAP: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = {
  scheduled: { label: 'Planifiée', variant: 'info' },
  in_progress: { label: 'En cours', variant: 'warning' },
  completed: { label: 'Terminée', variant: 'success' },
  cancelled: { label: 'Annulée', variant: 'danger' },
  urgent: { label: 'Urgent', variant: 'danger' },
  warning: { label: 'Bientôt', variant: 'warning' },
  normal: { label: 'Normal', variant: 'default' },
  new: { label: 'Nouvelle', variant: 'info' },
  cv_review: { label: 'CV en revue', variant: 'warning' },
  interview_scheduled: { label: 'Entretien prévu', variant: 'info' },
  technical_test: { label: 'Test technique', variant: 'default' },
  final_interview: { label: 'Entretien final', variant: 'default' },
  accepted: { label: 'Accepté', variant: 'success' },
  rejected: { label: 'Refusé', variant: 'danger' },
};

type ViewMode = 'month' | 'week' | 'day';

export default function RHCalendarPage() {
  const { rhManager } = useAuth();
  const deptName = rhManager?.department?.name || 'votre département';

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notifications, setNotifications] = useState<CalendarNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [typeFilters, setTypeFilters] = useState<Set<CalendarEventType>>(new Set(['interview', 'meeting', 'contract', 'trial']));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showNotifications, setShowNotifications] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [evts, notifs] = await Promise.all([
        api.calendar.events(),
        api.calendar.notifications(),
      ]);
      setEvents(evts);
      setNotifications(notifs);
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredEvents = useMemo(
    () => events.filter((e) => typeFilters.has(e.type)),
    [events, typeFilters],
  );

  const toggleFilter = (type: CalendarEventType) => {
    setTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const dateKey = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

  const eventsForDate = (key: string) =>
    filteredEvents.filter((e) => e.date === key);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (view === 'month') d.setMonth(d.getMonth() + dir);
    else if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const headerLabel = useMemo(() => {
    if (view === 'month') return `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    if (view === 'week') {
      const start = new Date(currentDate);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return `${start.getDate()} ${MONTH_NAMES[start.getMonth()].substring(0, 3)} — ${end.getDate()} ${MONTH_NAMES[end.getMonth()].substring(0, 3)} ${end.getFullYear()}`;
    }
    return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }, [currentDate, view]);

  const formatTime = (t: string | null) => t ? t.substring(0, 5) : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-surface-500">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Notifications */}
      {showNotifications && notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.slice(0, 5).map((n, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${
                n.severity === 'danger'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : n.severity === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              <Bell className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="flex-1">{n.message}</span>
              <button onClick={() => setShowNotifications(false)} className="shrink-0 p-0.5 rounded hover:bg-white/50">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Calendar</h1>
          <p className="text-surface-500 mt-1">
            Planning du département{' '}
            <span className="font-semibold text-primary-600">{deptName}</span>
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <Card padding={false}>
        <div className="p-4 border-b border-surface-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-surface-100 text-surface-500">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-surface-900 min-w-[200px] text-center">{headerLabel}</h2>
            <button onClick={() => navigate(1)} className="p-2 rounded-xl hover:bg-surface-100 text-surface-500">
              <ChevronRight className="w-5 h-5" />
            </button>
            <button onClick={goToToday} className="px-3 py-1.5 text-xs font-medium bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 transition-colors">
              Aujourd'hui
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                showFilters ? 'bg-primary-100 text-primary-700' : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filtres
            </button>

            <div className="flex bg-surface-100 rounded-xl p-1">
              {(['month', 'week', 'day'] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    view === v ? 'bg-white text-primary-700 shadow-sm' : 'text-surface-500 hover:text-surface-700'
                  }`}
                >
                  {v === 'month' ? 'Mois' : v === 'week' ? 'Semaine' : 'Jour'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 border-b border-surface-100 bg-surface-50/50">
            <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Types d'événements</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TYPE_CONFIG) as CalendarEventType[]).map((type) => {
                const cfg = TYPE_CONFIG[type];
                const active = typeFilters.has(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleFilter(type)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                      active
                        ? cfg.bg
                        : 'bg-white text-surface-400 border-surface-200 hover:border-surface-300'
                    }`}
                  >
                    {active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {cfg.icon}
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="px-4 py-2 border-b border-surface-100 flex flex-wrap gap-3">
          {(Object.keys(TYPE_CONFIG) as CalendarEventType[]).map((type) => {
            const cfg = TYPE_CONFIG[type];
            return (
              <div key={type} className="flex items-center gap-1.5 text-xs text-surface-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color }} />
                {cfg.label}
              </div>
            );
          })}
        </div>

        {/* Calendar Content */}
        {view === 'month' && (
          <MonthView
            currentDate={currentDate}
            eventsForDate={eventsForDate}
            dateKey={dateKey}
            onSelectEvent={setSelectedEvent}
          />
        )}
        {view === 'week' && (
          <WeekView
            currentDate={currentDate}
            eventsForDate={eventsForDate}
            dateKey={dateKey}
            onSelectEvent={setSelectedEvent}
          />
        )}
        {view === 'day' && (
          <DayView
            currentDate={currentDate}
            events={filteredEvents}
            dateKey={dateKey}
            onSelectEvent={setSelectedEvent}
          />
        )}
      </Card>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}

// ── Month View ──────────────────────────────────────────────────────────────

function MonthView({
  currentDate,
  eventsForDate,
  dateKey,
  onSelectEvent,
}: {
  currentDate: Date;
  eventsForDate: (key: string) => CalendarEvent[];
  dateKey: (d: Date) => string;
  onSelectEvent: (e: CalendarEvent) => void;
}) {
  const today = dateKey(new Date());

  const days = useMemo(() => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDay = (firstDay.getDay() + 6) % 7;
    const result: Array<{ day: number; date: Date; isCurrentMonth: boolean }> = [];
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

    for (let i = startDay - 1; i >= 0; i--) {
      result.push({ day: prevMonth.getDate() - i, date: new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonth.getDate() - i), isCurrentMonth: false });
    }
    for (let d = 1; d <= lastDay.getDate(); d++) {
      result.push({ day: d, date: new Date(currentDate.getFullYear(), currentDate.getMonth(), d), isCurrentMonth: true });
    }
    const remaining = 42 - result.length;
    for (let d = 1; d <= remaining; d++) {
      result.push({ day: d, date: new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, d), isCurrentMonth: false });
    }
    return result;
  }, [currentDate]);

  return (
    <div className="grid grid-cols-7 gap-px bg-surface-100">
      {DAY_NAMES.map((d) => (
        <div key={d} className="bg-surface-50 px-2 py-2 text-center text-xs font-semibold text-surface-500">
          {d}
        </div>
      ))}
      {days.map((cell, i) => {
        const key = dateKey(cell.date);
        const dayEvents = eventsForDate(key);
        const isToday = key === today;

        return (
          <div
            key={i}
            className={`bg-white p-1.5 min-h-[80px] ${
              !cell.isCurrentMonth ? 'text-surface-300' : 'text-surface-700'
            }`}
          >
            <span className={`text-xs font-medium ${isToday ? 'w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center' : ''}`}>
              {cell.day}
            </span>
            <div className="mt-1 space-y-0.5">
              {dayEvents.slice(0, 3).map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  className="w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate hover:opacity-80 transition-opacity"
                  style={{ backgroundColor: evt.color + '20', color: evt.color, borderLeft: `2px solid ${evt.color}` }}
                  title={`${evt.title} — ${evt.subtitle}`}
                >
                  {formatTime(evt.time)} {evt.title}
                </button>
              ))}
              {dayEvents.length > 3 && (
                <p className="text-[9px] text-surface-400 px-1">+{dayEvents.length - 3} autre{dayEvents.length - 3 > 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function formatTime(t: string | null) {
  return t ? t.substring(0, 5) + ' ' : '';
}

// ── Week View ───────────────────────────────────────────────────────────────

function WeekView({
  currentDate,
  eventsForDate,
  dateKey,
  onSelectEvent,
}: {
  currentDate: Date;
  eventsForDate: (key: string) => CalendarEvent[];
  dateKey: (d: Date) => string;
  onSelectEvent: (e: CalendarEvent) => void;
}) {
  const today = dateKey(new Date());

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const getEventPosition = (evt: CalendarEvent) => {
    if (!evt.time) return { top: 0, height: 24 };
    const [h, m] = evt.time.split(':').map(Number);
    const top = (h - 7) * 60 + m;
    const endH = evt.end_time ? parseInt(evt.end_time.split(':')[0]) : h + 1;
    const endM = evt.end_time ? parseInt(evt.end_time.split(':')[1]) : m;
    const height = Math.max(24, (endH - h) * 60 + (endM - m));
    return { top: Math.max(0, top), height: Math.min(height, 60 * 14) };
  };

  return (
    <div className="overflow-auto max-h-[600px]">
      <div className="grid grid-cols-[60px_repeat(7,1fr)] min-w-[700px]">
        {/* Time column */}
        <div className="bg-surface-50 border-r border-surface-100">
          <div className="h-10 border-b border-surface-100" />
          {HOUR_SLOTS.map((h) => (
            <div key={h} className="h-[60px] border-b border-surface-100 px-2 flex items-start pt-1">
              <span className="text-[10px] text-surface-400">{String(h).padStart(2, '0')}:00</span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {weekDays.map((day) => {
          const key = dateKey(day);
          const dayEvents = eventsForDate(key);
          const isToday = key === today;

          return (
            <div key={key} className={`border-r border-surface-100 ${isToday ? 'bg-primary-50/20' : ''}`}>
              <div className={`h-10 border-b border-surface-100 flex items-center justify-center text-xs font-semibold ${isToday ? 'text-primary-700' : 'text-surface-600'}`}>
                <div className="text-center">
                  <div>{DAY_NAMES[(day.getDay() + 6) % 7]}</div>
                  <div className={`text-[10px] ${isToday ? 'w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center mx-auto' : ''}`}>
                    {day.getDate()}
                  </div>
                </div>
              </div>
              <div className="relative">
                {HOUR_SLOTS.map((h) => (
                  <div key={h} className="h-[60px] border-b border-surface-100" />
                ))}
                {dayEvents.map((evt) => {
                  const pos = getEventPosition(evt);
                  return (
                    <button
                      key={evt.id}
                      onClick={() => onSelectEvent(evt)}
                      className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[10px] leading-tight overflow-hidden hover:opacity-90 transition-opacity z-10"
                      style={{
                        top: `${pos.top}px`,
                        height: `${pos.height}px`,
                        backgroundColor: evt.color + '25',
                        color: evt.color,
                        borderLeft: `2px solid ${evt.color}`,
                      }}
                    >
                      <p className="font-semibold truncate">{evt.title}</p>
                      <p className="truncate opacity-70">{formatTime(evt.time)}{evt.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Day View ────────────────────────────────────────────────────────────────

function DayView({
  currentDate,
  events,
  dateKey,
  onSelectEvent,
}: {
  currentDate: Date;
  events: CalendarEvent[];
  dateKey: (d: Date) => string;
  onSelectEvent: (e: CalendarEvent) => void;
}) {
  const key = dateKey(currentDate);
  const todayEvents = useMemo(() => events.filter((e) => e.date === key), [events, key]);
  const isToday = key === dateKey(new Date());

  const getEventPosition = (evt: CalendarEvent) => {
    if (!evt.time) return { top: 0, height: 48 };
    const [h, m] = evt.time.split(':').map(Number);
    const top = (h - 7) * 60 + m;
    const endH = evt.end_time ? parseInt(evt.end_time.split(':')[0]) : h + 1;
    const endM = evt.end_time ? parseInt(evt.end_time.split(':')[1]) : m;
    const height = Math.max(48, (endH - h) * 60 + (endM - m));
    return { top: Math.max(0, top), height: Math.min(height, 60 * 14) };
  };

  return (
    <div className="overflow-auto max-h-[600px]">
      <div className="grid grid-cols-[60px_1fr] min-w-[400px]">
        <div className="bg-surface-50 border-r border-surface-100">
          <div className="h-12 border-b border-surface-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-surface-500">
              {currentDate.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
            </span>
          </div>
          {HOUR_SLOTS.map((h) => (
            <div key={h} className="h-[60px] border-b border-surface-100 px-2 flex items-start pt-1">
              <span className="text-[10px] text-surface-400">{String(h).padStart(2, '0')}:00</span>
            </div>
          ))}
        </div>

        <div className={`relative ${isToday ? 'bg-primary-50/20' : ''}`}>
          <div className="h-12 border-b border-surface-100" />
          {HOUR_SLOTS.map((h) => (
            <div key={h} className="h-[60px] border-b border-surface-100" />
          ))}
          {todayEvents.map((evt) => {
            const pos = getEventPosition(evt);
            const cfg = TYPE_CONFIG[evt.type];
            return (
              <button
                key={evt.id}
                onClick={() => onSelectEvent(evt)}
                className="absolute left-1 right-1 rounded-lg p-2 text-xs overflow-hidden hover:opacity-90 transition-opacity z-10"
                style={{
                  top: `${48 + pos.top}px`,
                  height: `${pos.height}px`,
                  backgroundColor: evt.color + '20',
                  color: evt.color,
                  borderLeft: `3px solid ${evt.color}`,
                }}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  {cfg.icon}
                  <span className="font-bold truncate">{evt.title}</span>
                </div>
                <p className="opacity-80 truncate">{evt.subtitle}</p>
                {evt.time && <p className="opacity-60 mt-0.5">{formatTime(evt.time)}{evt.end_time ? `—${formatTime(evt.end_time)}` : ''}</p>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Event Detail Modal ──────────────────────────────────────────────────────

function EventModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const cfg = TYPE_CONFIG[event.type];
  const statusInfo = STATUS_MAP[event.status];
  const d = event.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4">
        <div className="sticky top-0 bg-white border-b border-surface-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: event.color + '20', color: event.color }}>
              {cfg.icon}
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-900">{cfg.label}</h2>
              <p className="text-xs text-surface-400">{event.date} {event.time ? `à ${formatTime(event.time)}` : ''}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status */}
          {statusInfo && (
            <Badge variant={statusInfo.variant} dot size="md">
              {statusInfo.label}
            </Badge>
          )}

          {/* Interview Details */}
          {event.type === 'interview' && (
            <div className="space-y-4">
              <InfoRow icon={<User className="w-4 h-4" />} label="Candidat" value={d.candidate_name} />
              <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Poste" value={d.position} />
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Heure" value={d.interview_time || '-'} />
              {d.email && <InfoRow icon={<span className="text-xs">@</span>} label="Email" value={d.email} />}
              {d.phone && <InfoRow icon={<span className="text-xs">Tel</span>} label="Téléphone" value={d.phone} />}
              {d.cin && <InfoRow icon={<span className="text-xs">CIN</span>} label="CIN" value={d.cin} />}
              {d.interview_notes && <InfoRow icon={<FileText className="w-4 h-4" />} label="Notes" value={d.interview_notes} />}
              {d.cover_letter && (
                <div>
                  <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">Lettre de motivation</p>
                  <p className="text-sm text-surface-700 bg-surface-50 p-3 rounded-xl whitespace-pre-wrap">{d.cover_letter}</p>
                </div>
              )}
            </div>
          )}

          {/* Meeting Details */}
          {event.type === 'meeting' && (
            <div className="space-y-4">
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Horaires" value={`${formatTime(d.start_time)} — ${formatTime(d.end_time)}`} />
              {d.location && <InfoRow icon={<MapPin className="w-4 h-4" />} label="Lieu" value={d.location} />}
              {d.description && (
                <div>
                  <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">Description</p>
                  <p className="text-sm text-surface-700 bg-surface-50 p-3 rounded-xl whitespace-pre-wrap">{d.description}</p>
                </div>
              )}
              {d.participants_count > 0 && (
                <div>
                  <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">Participants ({d.participants_count})</p>
                  <div className="space-y-1">
                    {d.participants?.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-2 text-sm text-surface-700">
                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-[10px] font-bold">
                          {p.name?.split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        {p.name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {d.minutes_summary && (
                <div>
                  <p className="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-1">Compte rendu</p>
                  <p className="text-sm text-surface-700 bg-surface-50 p-3 rounded-xl whitespace-pre-wrap">{d.minutes_summary}</p>
                </div>
              )}
            </div>
          )}

          {/* Contract Details */}
          {event.type === 'contract' && (
            <div className="space-y-4">
              <InfoRow icon={<User className="w-4 h-4" />} label="Employé" value={d.employee_name} />
              <InfoRow icon={<FileText className="w-4 h-4" />} label="Type" value={d.type} />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date de fin" value={d.end_date} />
              {d.start_date && <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date de début" value={d.start_date} />}
              {d.salary && <InfoRow icon={<span className="text-xs">DH</span>} label="Salaire" value={`${Number(d.salary).toLocaleString('fr-MA')} DH`} />}
              <div className={`p-3 rounded-xl ${d.is_urgent ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${d.is_urgent ? 'text-red-600' : 'text-amber-600'}`} />
                  <span className={`text-sm font-medium ${d.is_urgent ? 'text-red-700' : 'text-amber-700'}`}>
                    Expire dans {d.days_remaining} jour{d.days_remaining > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Trial Period Details */}
          {event.type === 'trial' && (
            <div className="space-y-4">
              <InfoRow icon={<User className="w-4 h-4" />} label="Employé" value={d.employee_name} />
              <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Poste" value={d.position || '-'} />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date d'embauche" value={d.hire_date} />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="Fin de période d'essai" value={d.trial_end_date} />
              <div className={`p-3 rounded-xl ${d.is_urgent ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`w-4 h-4 ${d.is_urgent ? 'text-red-600' : 'text-amber-600'}`} />
                  <span className={`text-sm font-medium ${d.is_urgent ? 'text-red-700' : 'text-amber-700'}`}>
                    Se termine dans {d.days_remaining} jour{d.days_remaining > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-surface-400">{icon}</span>
      <div>
        <p className="text-xs text-surface-400">{label}</p>
        <p className="font-medium text-surface-800">{value || '-'}</p>
      </div>
    </div>
  );
}

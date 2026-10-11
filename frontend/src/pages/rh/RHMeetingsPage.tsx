import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  MapPin,
  Users,
} from 'lucide-react';
import { api, type Meeting } from '@/services/api';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-500',
  in_progress: 'bg-amber-500',
  completed: 'bg-emerald-500',
  cancelled: 'bg-red-400',
};

const statusLabels: Record<string, string> = {
  scheduled: 'Planifiée',
  in_progress: 'En cours',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

export default function RHMeetingsPage() {
  const { rhManager } = useAuth();
  const deptName = rhManager?.department?.name || 'votre département';

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await api.meetings.list();
      setMeetings(list);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const meetingsByDate = useMemo(() => {
    const map: Record<string, Meeting[]> = {};
    meetings.forEach((m) => {
      const key = m.date.substring(0, 10);
      if (!map[key]) map[key] = [];
      map[key].push(m);
    });
    return map;
  }, [meetings]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startDay = (firstDay.getDay() + 6) % 7;
    const totalDays = lastDay.getDate();

    const days: Array<{ day: number; date: Date; isCurrentMonth: boolean }> = [];
    const prevMonth = new Date(currentYear, currentMonth, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      days.push({ day: prevMonth.getDate() - i, date: new Date(currentYear, currentMonth - 1, prevMonth.getDate() - i), isCurrentMonth: false });
    }
    for (let d = 1; d <= totalDays; d++) {
      days.push({ day: d, date: new Date(currentYear, currentMonth, d), isCurrentMonth: true });
    }
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      days.push({ day: d, date: new Date(currentYear, currentMonth + 1, d), isCurrentMonth: false });
    }
    return days;
  }, [currentMonth, currentYear]);

  const dateKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = dateKey(new Date());

  const selectedMeetings = selectedDate ? meetingsByDate[dateKey(selectedDate)] || [] : [];

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else { setCurrentMonth(currentMonth - 1); }
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else { setCurrentMonth(currentMonth + 1); }
  };

  const formatTime = (t: string) => t ? t.substring(0, 5) : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-surface-500">Chargement des réunions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-surface-900">Meetings</h1>
        <p className="text-surface-500 mt-1">
          Calendrier des réunions —{' '}
          <span className="font-semibold text-primary-600">{deptName}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-surface-100 text-surface-500">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-surface-900">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-surface-100 text-surface-500">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px bg-surface-100 rounded-xl overflow-hidden">
            {DAY_NAMES.map((d) => (
              <div key={d} className="bg-surface-50 px-2 py-2 text-center text-xs font-semibold text-surface-500">
                {d}
              </div>
            ))}
            {calendarDays.map((cell, i) => {
              const key = dateKey(cell.date);
              const isToday = key === today;
              const isSelected = selectedDate && dateKey(selectedDate) === key;

              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(cell.date)}
                  className={`relative bg-white p-2 min-h-[72px] text-left transition-colors ${
                    !cell.isCurrentMonth ? 'text-surface-300' : 'text-surface-700'
                  } ${isSelected ? 'bg-primary-50 ring-2 ring-inset ring-primary-400' : 'hover:bg-surface-50'}`}
                >
                  <span className={`text-sm font-medium ${isToday ? 'w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center' : ''}`}>
                    {cell.day}
                  </span>
                  {cell.isCurrentMonth && (meetingsByDate[key] || []).length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {(meetingsByDate[key] || []).slice(0, 2).map((m, j) => (
                        <div
                          key={j}
                          className={`text-[10px] leading-tight px-1 py-0.5 rounded truncate ${
                            m.status === 'completed'
                              ? 'bg-emerald-50 text-emerald-700'
                              : m.status === 'cancelled'
                                ? 'bg-red-50 text-red-600'
                                : m.status === 'in_progress'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-blue-50 text-blue-700'
                          }`}
                          title={`${m.title} — ${formatTime(m.start_time)}`}
                        >
                          {m.title}
                        </div>
                      ))}
                      {(meetingsByDate[key] || []).length > 2 && (
                        <p className="text-[9px] text-surface-400 px-1">
                          +{(meetingsByDate[key] || []).length - 2} autre{(meetingsByDate[key] || []).length - 2 > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Day Detail */}
        <Card>
          {selectedDate ? (
            <div>
              <h3 className="text-sm font-bold text-surface-900 mb-1">
                {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-xs text-surface-400 mb-4">
                {selectedMeetings.length} réunion{selectedMeetings.length > 1 ? 's' : ''}
              </p>

              {selectedMeetings.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-surface-400">Aucune réunion ce jour</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedMeetings.map((m) => (
                    <div key={m.id} className="p-3 bg-surface-50 rounded-xl space-y-2">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-semibold text-surface-800 leading-tight">{m.title}</p>
                        <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${statusColors[m.status] || 'bg-surface-400'}`} />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-surface-500">
                        <Clock className="w-3 h-3" />
                        {formatTime(m.start_time)} - {formatTime(m.end_time)}
                      </div>
                      {m.location && (
                        <div className="flex items-center gap-1.5 text-xs text-surface-500">
                          <MapPin className="w-3 h-3" />
                          {m.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-xs text-surface-500">
                        <Users className="w-3 h-3" />
                        {m.participants_count || m.participants?.length || 0} participant{(m.participants_count || m.participants?.length || 0) > 1 ? 's' : ''}
                      </div>
                      <Badge variant={m.status === 'completed' ? 'success' : m.status === 'cancelled' ? 'danger' : m.status === 'in_progress' ? 'warning' : 'info'} size="sm">
                        {statusLabels[m.status] || m.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-sm text-surface-400">Sélectionnez un jour dans le calendrier</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

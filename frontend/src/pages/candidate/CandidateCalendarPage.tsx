import { useState, useEffect } from 'react';
import { api, type CandidateCalendarEvent } from '@/services/api';
import { Card } from '@/components/ui/Card';
import {
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  FileText,
  Loader2,
} from 'lucide-react';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const DAY_NAMES = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function formatDateStr(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function CandidateCalendarPage() {
  const [events, setEvents] = useState<CandidateCalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await api.candidate.calendar.events();
        setEvents(data ?? []);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));

  const getEventsForDate = (dateStr: string) =>
    events.filter((e) => e.date === dateStr);

  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-[#16a34a] animate-spin" />
          <p className="text-sm text-gray-500">Chargement du calendrier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Calendrier</h1>
        <p className="text-sm text-gray-500 mt-1">
          Consultez vos entretiens planifiés
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card>
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={prevMonth}
                className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-bold text-surface-900">
                {MONTH_NAMES[month]} {year}
              </h2>
              <button
                onClick={nextMonth}
                className="p-2 rounded-lg hover:bg-surface-100 text-surface-500 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {DAY_NAMES.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-surface-400 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayEvents = getEventsForDate(dateStr);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`relative p-2 rounded-lg text-sm transition-all min-h-[60px] flex flex-col items-center ${
                      isSelected
                        ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-300 font-semibold'
                        : isToday
                          ? 'bg-primary-50 text-primary-600 font-medium'
                          : 'hover:bg-surface-50 text-surface-700'
                    }`}
                  >
                    <span>{day}</span>
                    {dayEvents.length > 0 && (
                      <span className="mt-1 text-[9px] font-semibold leading-tight text-primary-700 bg-primary-100 rounded px-1 py-0.5 truncate w-full text-center">
                        Entretien
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Event Details */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-surface-700">
            {selectedDate
              ? `Événements du ${formatDateStr(selectedDate)}`
              : 'Sélectionnez une date'}
          </h3>

          {selectedDate && selectedEvents.length === 0 && (
            <Card>
              <p className="text-sm text-surface-500 text-center py-4">
                Aucun entretien prévu pour cette date.
              </p>
            </Card>
          )}

          {selectedEvents.map((event) => (
            <Card key={event.id}>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-surface-900">{event.title}</p>
                    {event.department && (
                      <p className="text-xs text-surface-400">{event.department}</p>
                    )}
                  </div>
                </div>

                {event.time && (
                  <div className="flex items-center gap-2 text-sm text-surface-600">
                    <Clock className="w-4 h-4 text-surface-400" />
                    {event.time}
                  </div>
                )}

                {event.notes && (
                  <div className="flex items-start gap-2 text-sm text-surface-600">
                    <FileText className="w-4 h-4 text-surface-400 mt-0.5 shrink-0" />
                    <p>{event.notes}</p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    event.status === 'accepted'
                      ? 'bg-emerald-100 text-emerald-700'
                      : event.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : event.status === 'interview_scheduled'
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-surface-100 text-surface-600'
                  }`}>
                    {event.status_label}
                  </span>
                </div>
              </div>
            </Card>
          ))}

          {/* Upcoming events */}
          <div className="pt-2">
            <h3 className="text-sm font-semibold text-surface-700 mb-3">Prochains entretiens</h3>
            {events.length === 0 ? (
              <Card>
                <p className="text-sm text-surface-500 text-center py-4">
                  Aucun entretien planifié.
                </p>
              </Card>
            ) : (
              <div className="space-y-2">
                {events
                  .filter((e) => e.date >= todayStr)
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .slice(0, 5)
                  .map((event) => (
                    <div
                      key={event.id}
                      onClick={() => setSelectedDate(event.date)}
                      className="p-3 rounded-xl border border-surface-200 hover:border-primary-300 hover:bg-primary-50/50 cursor-pointer transition-all"
                    >
                      <p className="text-sm font-medium text-surface-900">{event.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-surface-500">
                        <span>{formatDateStr(event.date)}</span>
                        {event.time && <span>{event.time}</span>}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

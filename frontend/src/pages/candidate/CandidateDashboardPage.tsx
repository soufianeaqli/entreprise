import { useState, useEffect } from 'react'
import { api, type CandidateDashboard, type CandidateApplication } from '@/services/api'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/Card'
import { StatCard } from '@/components/ui/StatCard'
import { Badge } from '@/components/ui/Badge'
import { Briefcase, Clock, CheckCircle, XCircle, Send, ArrowRight } from 'lucide-react'

const statusBadgeMap: Record<string, { label: string; color: string }> = {
  new: { label: 'Nouvelle', color: 'info' },
  cv_review: { label: 'En revue', color: 'warning' },
  interview_scheduled: { label: 'Entretien planifié', color: 'info' },
  technical_test: { label: 'Test technique', color: 'warning' },
  final_interview: { label: 'Entretien final', color: 'info' },
  accepted: { label: 'Acceptée', color: 'success' },
  rejected: { label: 'Refusée', color: 'danger' },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function CandidateDashboardPage() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<CandidateDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true)
        const data = await api.candidate.dashboard()
        setDashboard(data)
      } catch (err: any) {
        setError(err?.message || 'Erreur lors du chargement du tableau de bord')
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#16a34a] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Chargement du tableau de bord...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-md">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">{error}</p>
        </Card>
      </div>
    )
  }

  const stats = dashboard?.stats
  const recentApplications = dashboard?.recent_applications ?? []
  const isEmpty = recentApplications.length === 0 && (!stats || (stats.total === 0 && stats.pending === 0 && stats.accepted === 0 && stats.rejected === 0))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour, {user?.first_name || user?.email?.split('@')[0] || 'Candidat'}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Voici un résumé de vos candidatures
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total candidatures"
          value={stats?.total ?? 0}
          icon={<Briefcase className="w-5 h-5" />}
          color="#16a34a"
        />
        <StatCard
          title="En cours"
          value={stats?.pending ?? 0}
          icon={<Clock className="w-5 h-5" />}
          color="#f59e0b"
        />
        <StatCard
          title="Acceptées"
          value={stats?.accepted ?? 0}
          icon={<CheckCircle className="w-5 h-5" />}
          color="#16a34a"
        />
        <StatCard
          title="Refusées"
          value={stats?.rejected ?? 0}
          icon={<XCircle className="w-5 h-5" />}
          color="#ef4444"
        />
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">
            Candidatures récentes
          </h2>
          {recentApplications.length > 0 && (
            <a
              href="/candidate/applications"
              className="flex items-center gap-1 text-sm font-medium text-[#16a34a] hover:text-[#15803d] transition-colors"
            >
              Voir tout
              <ArrowRight className="w-4 h-4" />
            </a>
          )}
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-[#16a34a]/10 flex items-center justify-center mb-4">
              <Send className="w-7 h-7 text-[#16a34a]" />
            </div>
            <p className="text-gray-500 font-medium">
              Aucune candidature pour le moment
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Commencez à postuler pour voir vos candidatures ici
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentApplications.slice(0, 5).map((app: CandidateApplication) => {
              const status = statusBadgeMap[app.status] ?? {
                label: app.status,
                color: 'info',
              }
              return (
                <div
                  key={app.id}
                  className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {app.job_title || app.offer_title || 'Offre sans titre'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {app.department || 'Non précisé'}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <Badge color={status.color as any}>{status.label}</Badge>
                    <span className="text-xs text-gray-400 whitespace-nowrap">
                      {formatDate(app.created_at)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}

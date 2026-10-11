import { useState, useEffect } from 'react'
import { api, type CandidateApplication } from '@/services/api'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  History,
  Building2,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
} from 'lucide-react'

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function CandidateHistoryPage() {
  const [applications, setApplications] = useState<CandidateApplication[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true)
        const data = await api.candidate.applications.history()
        setApplications(data ?? [])
      } catch {
        setApplications([])
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#16a34a] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">
            Chargement de l'historique...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Historique des candidatures
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Consultez les résultats de vos candidatures passées
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <History className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-700 font-medium">
            Aucun historique de candidature
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Vos candidatures acceptées ou refusées apparaîtront ici
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const isAccepted = app.status === 'accepted'
            return (
              <Card
                key={app.id}
                className="hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 mb-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                          isAccepted
                            ? 'bg-emerald-50'
                            : 'bg-red-50'
                        }`}
                      >
                        {isAccepted ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {app.recruitment?.title || 'Offre sans titre'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1.5">
                          {app.recruitment?.department && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                              <Building2 className="w-3.5 h-3.5 text-gray-400" />
                              <span>{app.recruitment.department}</span>
                            </div>
                          )}
                          {app.recruitment?.location && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-500">
                              <MapPin className="w-3.5 h-3.5 text-gray-400" />
                              <span>{app.recruitment.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Calendar className="w-3.5 h-3.5 text-gray-400" />
                            <span>{formatDate(app.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:ml-4 shrink-0">
                    <Badge
                      variant={isAccepted ? 'success' : 'danger'}
                      dot
                    >
                      {isAccepted ? 'Acceptée' : 'Refusée'}
                    </Badge>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

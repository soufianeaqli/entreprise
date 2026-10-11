import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api, type Recruitment } from '@/services/api'
import { Card } from '@/components/ui/Card'
import {
  Briefcase,
  MapPin,
  Clock,
  ArrowLeft,
  Building2,
  Calendar,
  Banknote,
  GraduationCap,
  Award,
  CheckCircle,
  Send,
  Loader2,
  AlertCircle,
  BriefcaseBusiness,
  Globe,
} from 'lucide-react'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function parseList(text: string | null): string[] {
  if (!text) return []
  return text
    .split(/\n|;|,/)
    .map((s) => s.trim())
    .filter(Boolean)
}

const contractTypeColors: Record<string, string> = {
  CDI: 'bg-emerald-100 text-emerald-700',
  CDD: 'bg-blue-100 text-blue-700',
  Stage: 'bg-purple-100 text-purple-700',
  Alternance: 'bg-amber-100 text-amber-700',
  Freelance: 'bg-slate-100 text-slate-600',
}

const workModeLabels: Record<string, string> = {
  presentiel: 'Présentiel',
  hybride: 'Hybride',
  teletravail: 'Télétravail',
}

export default function CandidateAnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [announcement, setAnnouncement] = useState<Recruitment | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [alreadyApplied, setAlreadyApplied] = useState(false)

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!id) return
      try {
        setLoading(true)
        const data = await api.candidate.announcements.get(Number(id))
        setAnnouncement(data)
      } catch (err: any) {
        setError(err?.message || 'Erreur lors du chargement de l\'annonce')
      } finally {
        setLoading(false)
      }
    }
    fetchAnnouncement()
  }, [id])

  const handleApply = async () => {
    if (!id) return
    try {
      setApplying(true)
      await api.candidate.announcements.apply(Number(id))
      setApplied(true)
    } catch (err: any) {
      if (err?.message?.includes('409') || err?.message?.includes('déjà postulé') || err?.message?.includes('already')) {
        setAlreadyApplied(true)
      } else {
        setError(err?.message || 'Erreur lors de la candidature')
      }
    } finally {
      setApplying(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#16a34a] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Chargement de l'annonce...</p>
        </div>
      </div>
    )
  }

  if (error && !announcement) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-700 font-medium">{error}</p>
          <button
            onClick={() => navigate('/candidate/announcements')}
            className="mt-4 text-sm font-medium text-[#16a34a] hover:text-[#15803d] transition-colors"
          >
            Retour aux annonces
          </button>
        </Card>
      </div>
    )
  }

  if (!announcement) return null

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/candidate/announcements')}
        className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux annonces
      </button>

      <Card className="overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {announcement.title}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                {announcement.contract_type && (
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      contractTypeColors[announcement.contract_type] ??
                      'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {announcement.contract_type}
                  </span>
                )}
                {announcement.work_mode && (
                  <span className="text-xs font-medium px-3 py-1 rounded-full bg-gray-100 text-gray-600">
                    {workModeLabels[announcement.work_mode] ?? announcement.work_mode}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {announcement.department && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="w-5 h-5 text-[#16a34a] shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Département</p>
                  <p className="text-sm font-medium text-gray-900">{announcement.department.name}</p>
                </div>
              </div>
            )}
            {announcement.location && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-[#16a34a] shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Localisation</p>
                  <p className="text-sm font-medium text-gray-900">{announcement.location}</p>
                </div>
              </div>
            )}
            {announcement.salary != null && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Banknote className="w-5 h-5 text-[#16a34a] shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Salaire</p>
                  <p className="text-sm font-medium text-gray-900">
                    {Number(announcement.salary).toLocaleString('fr-FR')} MAD
                  </p>
                </div>
              </div>
            )}
            {announcement.experience_level && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <BriefcaseBusiness className="w-5 h-5 text-[#16a34a] shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Expérience</p>
                  <p className="text-sm font-medium text-gray-900">{announcement.experience_level}</p>
                </div>
              </div>
            )}
          </div>

          {announcement.education_level && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mb-6">
              <GraduationCap className="w-5 h-5 text-[#16a34a] shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Formation</p>
                <p className="text-sm font-medium text-gray-900">{announcement.education_level}</p>
              </div>
            </div>
          )}

          {announcement.description && (
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#16a34a]" />
                Description
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {announcement.description}
              </p>
            </div>
          )}

          {announcement.missions && (
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#16a34a]" />
                Missions
              </h2>
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {announcement.missions}
              </div>
            </div>
          )}

          {announcement.skills && (
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Award className="w-4 h-4 text-[#16a34a]" />
                Compétences requises
              </h2>
              <div className="flex flex-wrap gap-2">
                {parseList(announcement.skills).map((skill, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg bg-[#16a34a]/10 text-[#16a34a]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {announcement.qualifications && (
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#16a34a]" />
                Qualifications
              </h2>
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {announcement.qualifications}
              </div>
            </div>
          )}

          {announcement.benefits && (
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#16a34a]" />
                Avantages
              </h2>
              <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                {announcement.benefits}
              </div>
            </div>
          )}

          {announcement.deadline && (
            <div className="flex items-center gap-2 text-sm text-gray-500 pt-4 border-t border-gray-100">
              <Calendar className="w-4 h-4" />
              <span>Date limite de candidature : {formatDate(announcement.deadline)}</span>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 px-6 sm:px-8 py-5 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Clock className="w-3.5 h-3.5" />
            <span>Publiée le {formatDate(announcement.posted_date ?? announcement.created_at)}</span>
          </div>

          {applied ? (
            <div className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#16a34a]/10 text-[#16a34a] font-medium text-sm">
              <CheckCircle className="w-4 h-4" />
              Candidature envoyée avec succès
            </div>
          ) : alreadyApplied ? (
            <div className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-amber-50 text-amber-700 font-medium text-sm">
              <AlertCircle className="w-4 h-4" />
              Vous avez déjà postulé à cette offre
            </div>
          ) : (
            <button
              onClick={handleApply}
              disabled={applying}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#16a34a] text-white font-medium text-sm hover:bg-[#15803d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {applying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Postuler
                </>
              )}
            </button>
          )}
        </div>
      </Card>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        </Card>
      )}
    </div>
  )
}

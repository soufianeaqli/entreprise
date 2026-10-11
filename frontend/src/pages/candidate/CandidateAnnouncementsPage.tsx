import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type Recruitment, type PaginatedResponse } from '@/services/api'
import { Card } from '@/components/ui/Card'
import {
  Briefcase,
  MapPin,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Building2,
  Calendar,
} from 'lucide-react'

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function parseSkills(skills: string | null): string[] {
  if (!skills) return []
  return skills
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

const contractTypeLabels: Record<string, string> = {
  CDI: 'CDI',
  CDD: 'CDD',
  Stage: 'Stage',
  Alternance: 'Alternance',
  Freelance: 'Freelance',
}

const contractTypeColors: Record<string, string> = {
  CDI: 'bg-emerald-100 text-emerald-700',
  CDD: 'bg-blue-100 text-blue-700',
  Stage: 'bg-purple-100 text-purple-700',
  Alternance: 'bg-amber-100 text-amber-700',
  Freelance: 'bg-slate-100 text-slate-600',
}

export default function CandidateAnnouncementsPage() {
  const navigate = useNavigate()
  const [announcements, setAnnouncements] = useState<Recruitment[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    lastPage: 1,
    total: 0,
  })

  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [contractType, setContractType] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true)
        const params: Record<string, string | number> = { page }
        if (search) params.search = search
        if (department) params.department = department
        if (contractType) params.contract_type = contractType
        if (sort) params.sort = sort

        const res: PaginatedResponse<Recruitment> =
          await api.candidate.announcements.list(params as any)
        setAnnouncements(res.data ?? [])
        setPagination({
          currentPage: res.current_page,
          lastPage: res.last_page,
          total: res.total,
        })
      } catch {
        setAnnouncements([])
      } finally {
        setLoading(false)
      }
    }
    fetchAnnouncements()
  }, [search, department, contractType, sort, page])

  useEffect(() => {
    setPage(1)
  }, [search, department, contractType, sort])

  const handleCardClick = (id: number) => {
    navigate(`/candidate/announcements/${id}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Offres d'emploi
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Découvrez les postes disponibles et postulez
        </p>
      </div>

      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un poste, une compétence..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border rounded-lg transition-colors ${
              showFilters
                ? 'bg-[#16a34a] text-white border-[#16a34a]'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtres
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-100">
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] bg-white text-gray-700"
            >
              <option value="">Tous les départements</option>
            </select>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] bg-white text-gray-700"
            >
              <option value="">Tous les types de contrat</option>
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="Stage">Stage</option>
              <option value="Alternance">Alternance</option>
              <option value="Freelance">Freelance</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-[#16a34a] bg-white text-gray-700"
            >
              <option value="newest">Plus récentes</option>
              <option value="oldest">Plus anciennes</option>
              <option value="deadline">Date limite</option>
            </select>
          </div>
        )}
      </Card>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-[#16a34a] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">
              Chargement des offres...
            </p>
          </div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-[#16a34a]/10 flex items-center justify-center mb-4">
            <Briefcase className="w-8 h-8 text-[#16a34a]" />
          </div>
          <p className="text-gray-700 font-medium">
            Aucune offre disponible
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Revenez plus tard pour découvrir de nouvelles opportunités
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500">
            {pagination.total} offre{pagination.total > 1 ? 's' : ''} trouvée{pagination.total > 1 ? 's' : ''}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((item) => (
              <Card
                key={item.id}
                padding={false}
                className="hover:shadow-md hover:border-[#16a34a]/30 transition-all duration-200 cursor-pointer overflow-hidden"
                onClick={() => handleCardClick(item.id)}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-base font-semibold text-gray-900 line-clamp-2">
                      {item.title}
                    </h3>
                    {item.contract_type && (
                      <span
                        className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${
                          contractTypeColors[item.contract_type] ??
                          'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {contractTypeLabels[item.contract_type] ?? item.contract_type}
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {item.department && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{item.department.name}</span>
                      </div>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{item.location}</span>
                      </div>
                    )}
                    {item.deadline && (
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>Date limite : {formatDate(item.deadline)}</span>
                      </div>
                    )}
                  </div>

                  {item.skills && (
                    <div className="flex flex-wrap gap-1.5">
                      {parseSkills(item.skills)
                        .slice(0, 5)
                        .map((skill, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 rounded-md bg-[#16a34a]/10 text-[#16a34a] font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      {parseSkills(item.skills).length > 5 && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-500">
                          +{parseSkills(item.skills).length - 5}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Publiée le {formatDate(item.posted_date ?? item.created_at)}</span>
                  </div>
                  <span className="text-xs font-medium text-[#16a34a]">
                    Voir détails →
                  </span>
                </div>
              </Card>
            ))}
          </div>

          {pagination.lastPage > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Précédent
              </button>
              <span className="text-sm text-gray-500 px-3">
                Page {pagination.currentPage} / {pagination.lastPage}
              </span>
              <button
                onClick={() =>
                  setPage((p) => Math.min(pagination.lastPage, p + 1))
                }
                disabled={page === pagination.lastPage}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

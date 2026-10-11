import { useState, useEffect, useRef } from 'react'
import { api, type CandidateDocument, type CandidateDocumentCategory } from '@/services/api'
import { Card } from '@/components/ui/Card'
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  Replace,
  Loader2,
} from 'lucide-react'

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
const ACCEPTED_EXTENSIONS = '.pdf,.jpg,.jpeg,.png'
const MAX_SIZE = 10 * 1024 * 1024

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' o'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko'
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

interface DocumentCardProps {
  category: CandidateDocumentCategory
  title: string
  document: CandidateDocument | null
  onUpload: (category: CandidateDocumentCategory, file: File) => Promise<void>
  onDelete: (doc: CandidateDocument) => Promise<void>
  uploading: boolean
}

function DocumentCard({ category, title, document, onUpload, onDelete, uploading }: DocumentCardProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [deleting, setDeleting] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ACCEPTED_TYPES.includes(file.type)) {
      alert('Format non supporté. Veuillez choisir un fichier PDF, JPG, JPEG ou PNG.')
      e.target.value = ''
      return
    }

    if (file.size > MAX_SIZE) {
      alert('Le fichier est trop volumineux. Taille maximale : 10 Mo.')
      e.target.value = ''
      return
    }

    await onUpload(category, file)
    e.target.value = ''
  }

  const handlePreview = () => {
    if (!document) return
    window.open(document.url, '_blank')
  }

  const handleDelete = async () => {
    if (!document) return
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return
    setDeleting(true)
    try {
      await onDelete(document)
    } finally {
      setDeleting(false)
    }
  }

  const handleReplace = () => {
    inputRef.current?.click()
  }

  return (
    <Card className="flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-[#16a34a]/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-[#16a34a]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-400">
            {category === 'cv' ? 'PDF, JPG, JPEG, PNG' : 'PDF, JPG, JPEG, PNG'} · Max 10 Mo
          </p>
        </div>
      </div>

      {document ? (
        <>
          <div className="flex-1 bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <FileText className="w-4 h-4 text-gray-400" />
              <p className="text-sm font-medium text-gray-700 truncate">
                {document.file_name}
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{formatFileSize(document.file_size)}</span>
              <span>·</span>
              <span>{formatDate(document.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED_EXTENSIONS}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={handlePreview}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Aperçu
            </button>
            <button
              onClick={handleReplace}
              disabled={uploading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#16a34a] bg-[#16a34a]/5 border border-[#16a34a]/20 rounded-lg hover:bg-[#16a34a]/10 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Replace className="w-3.5 h-3.5" />
              )}
              Remplacer
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting || uploading}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              {deleting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Supprimer
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-lg p-8 mb-4 border-2 border-dashed border-gray-200">
            <FileText className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 text-center">
              Aucun fichier téléversé
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-white bg-[#16a34a] rounded-lg hover:bg-[#15803d] transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Téléversement...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Téléverser un fichier
              </>
            )}
          </button>
        </>
      )}
    </Card>
  )
}

export default function CandidateDocumentsPage() {
  const [documents, setDocuments] = useState<CandidateDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingCategory, setUploadingCategory] = useState<CandidateDocumentCategory | null>(null)

  const fetchDocuments = async () => {
    try {
      const data = await api.candidate.documents.list()
      setDocuments(data ?? [])
    } catch {
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [])

  const getDoc = (cat: CandidateDocumentCategory): CandidateDocument | null => {
    return documents.find((d) => d.category === cat) ?? null
  }

  const handleUpload = async (category: CandidateDocumentCategory, file: File) => {
    setUploadingCategory(category)
    try {
      const existing = getDoc(category)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)

      if (existing) {
        const updated = await api.candidate.documents.replace(existing.id, formData)
        setDocuments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)))
      } else {
        const created = await api.candidate.documents.upload(formData)
        setDocuments((prev) => [...prev, created])
      }
    } catch (err: any) {
      alert(err?.message || 'Erreur lors du téléversement.')
    } finally {
      setUploadingCategory(null)
    }
  }

  const handleDelete = async (doc: CandidateDocument) => {
    try {
      await api.candidate.documents.delete(doc.id)
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id))
    } catch (err: any) {
      alert(err?.message || 'Erreur lors de la suppression.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#16a34a] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">
            Chargement de vos documents...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes documents</h1>
        <p className="text-sm text-gray-500 mt-1">
          Gérez votre CV et votre lettre de motivation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DocumentCard
          category="cv"
          title="Curriculum Vitae"
          document={getDoc('cv')}
          onUpload={handleUpload}
          onDelete={handleDelete}
          uploading={uploadingCategory === 'cv'}
        />
        <DocumentCard
          category="cover_letter"
          title="Lettre de motivation"
          document={getDoc('cover_letter')}
          onUpload={handleUpload}
          onDelete={handleDelete}
          uploading={uploadingCategory === 'cover_letter'}
        />
      </div>
    </div>
  )
}

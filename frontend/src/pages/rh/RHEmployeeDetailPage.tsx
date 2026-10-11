import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft, User, Mail, Phone, MapPin, Calendar, Building2,
  FileText, Upload, Download, Trash2, Eye, X, Clock, Shield,
  Briefcase, CreditCard, History, ChevronDown, Replace,
  File, Image, AlertTriangle, Check, RefreshCw,
} from 'lucide-react';
import { api, type Employee, type EmployeeDocument, type DocumentCategory, type DocumentCategoryCounts, type Contract } from '@/services/api';

type TabId = 'overview' | 'documents' | 'contract' | 'history';

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
  { id: 'documents', label: 'Documents', icon: <FileText className="w-4 h-4" /> },
  { id: 'contract', label: 'Contract', icon: <CreditCard className="w-4 h-4" /> },
  { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
];

const CATEGORY_CONFIG: Record<DocumentCategory, { label: string; icon: React.ReactNode; color: string }> = {
  cv: { label: 'CV', icon: <FileText className="w-5 h-5" />, color: 'text-blue-600 bg-blue-50' },
  diploma: { label: 'Diplômes', icon: <Shield className="w-5 h-5" />, color: 'text-emerald-600 bg-emerald-50' },
  attestation: { label: 'Attestations', icon: <Check className="w-5 h-5" />, color: 'text-purple-600 bg-purple-50' },
  medical: { label: 'Certificats médicaux', icon: <AlertTriangle className="w-5 h-5" />, color: 'text-amber-600 bg-amber-50' },
  contract: { label: 'Contrat', icon: <CreditCard className="w-5 h-5" />, color: 'text-red-600 bg-red-50' },
};

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE = 10 * 1024 * 1024;

export default function RHEmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { rhManager } = useAuth();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  const [documents, setDocuments] = useState<EmployeeDocument[]>([]);
  const [docCategory, setDocCategory] = useState('all');
  const [docCounts, setDocCounts] = useState<DocumentCategoryCounts | null>(null);
  const [docLoading, setDocLoading] = useState(false);

  const [showUploadModal, setShowUploadModal] = useState<DocumentCategory | null>(null);
  const [uploadForm, setUploadForm] = useState({ title: '', file: null as File | null });
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const [previewDoc, setPreviewDoc] = useState<EmployeeDocument | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<EmployeeDocument | null>(null);
  const [replaceDoc, setReplaceDoc] = useState<EmployeeDocument | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const [history, setHistory] = useState<any[]>([]);

  const loadEmployee = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const emp = await api.employees.get(Number(id));
      setEmployee(emp);
    } catch {
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadDocuments = useCallback(async () => {
    if (!id) return;
    setDocLoading(true);
    try {
      const [docs, counts] = await Promise.all([
        api.employees.documents.list(Number(id), docCategory),
        api.employees.documents.categoryCounts(Number(id)),
      ]);
      setDocuments(docs);
      setDocCounts(counts);
    } catch {
    } finally {
      setDocLoading(false);
    }
  }, [id, docCategory]);

  const loadHistory = useCallback(async () => {
    if (!id) return;
    try {
      const h = await api.employees.documents.history(Number(id));
      setHistory(h);
    } catch {
    }
  }, [id]);

  useEffect(() => { loadEmployee(); }, [loadEmployee]);
  useEffect(() => { if (activeTab === 'documents') loadDocuments(); }, [activeTab, loadDocuments]);
  useEffect(() => { if (activeTab === 'history') loadHistory(); }, [activeTab, loadHistory]);

  const handleUpload = async () => {
    if (!uploadForm.file || !showUploadModal || !id) return;
    setUploadError('');
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadForm.file);
      fd.append('category', showUploadModal);
      fd.append('title', uploadForm.title || uploadForm.file.name);
      await api.employees.documents.upload(Number(id), fd);
      setShowUploadModal(null);
      setUploadForm({ title: '', file: null });
      loadDocuments();
    } catch (e: any) {
      setUploadError(e.message || 'Erreur lors de l\'upload');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleReplace = async () => {
    if (!uploadForm.file || !replaceDoc) return;
    setUploadError('');
    setUploadLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', uploadForm.file);
      if (uploadForm.title) fd.append('title', uploadForm.title);
      await api.employees.documents.replace(replaceDoc.id, fd);
      setReplaceDoc(null);
      setUploadForm({ title: '', file: null });
      loadDocuments();
    } catch (e: any) {
      setUploadError(e.message || 'Erreur lors du remplacement');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;
    setActionLoading(deleteDoc.id);
    try {
      await api.employees.documents.delete(deleteDoc.id);
      setDeleteDoc(null);
      loadDocuments();
    } catch {
    } finally {
      setActionLoading(null);
    }
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) return 'Type non autorisé (PDF, JPG, JPEG, PNG)';
    if (file.size > MAX_SIZE) return 'Fichier trop volumineux (max 10 MB)';
    return null;
  };

  const formatDate = (d: string | null) => {
    if (!d) return '-';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-surface-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-surface-500">Employé introuvable.</p>
        <button onClick={() => navigate('/rh/employees')} className="text-primary-600 text-sm mt-2 hover:underline">
          Retour à la liste
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/rh/employees')}
          className="flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux employés
        </button>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold shrink-0">
            {employee.photo ? (
              <img src={employee.photo} alt="" className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              `${employee.first_name[0]}${employee.last_name[0]}`
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-surface-900">{employee.full_name}</h1>
            <div className="flex items-center gap-3 mt-1 text-sm text-surface-500">
              <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" /> {employee.position || '-'}</span>
              <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" /> {employee.department?.name || '-'}</span>
              <Badge variant={employee.status ? 'success' : 'danger'} dot size="sm">
                {employee.status ? 'Actif' : 'Inactif'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-200">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'documents' && docCounts && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-surface-100 text-surface-600 rounded-full">
                  {Object.values(docCounts).reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab employee={employee} formatDate={formatDate} />
      )}
      {activeTab === 'documents' && (
        <DocumentsTab
          employeeId={employee.id}
          documents={documents}
          docCounts={docCounts}
          docCategory={docCategory}
          docLoading={docLoading}
          onCategoryChange={setDocCategory}
          onUpload={(cat) => { setShowUploadModal(cat); setUploadForm({ title: '', file: null }); setUploadError(''); }}
          onPreview={setPreviewDoc}
          onReplace={(doc) => { setReplaceDoc(doc); setUploadForm({ title: doc.title, file: null }); setUploadError(''); }}
          onDelete={setDeleteDoc}
          formatDate={formatDate}
        />
      )}
      {activeTab === 'contract' && (
        <ContractTab employee={employee} formatDate={formatDate} />
      )}
      {activeTab === 'history' && (
        <HistoryTab history={history} />
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadModal
          category={showUploadModal}
          form={uploadForm}
          loading={uploadLoading}
          error={uploadError}
          onChange={setUploadForm}
          onValidate={validateFile}
          onSubmit={handleUpload}
          onClose={() => setShowUploadModal(null)}
        />
      )}

      {/* Replace Modal */}
      {replaceDoc && (
        <UploadModal
          category={replaceDoc.category}
          form={uploadForm}
          loading={uploadLoading}
          error={uploadError}
          onChange={setUploadForm}
          onValidate={validateFile}
          onSubmit={handleReplace}
          onClose={() => setReplaceDoc(null)}
          isReplace
        />
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <PreviewModal doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}

      {/* Delete Confirmation */}
      {deleteDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDeleteDoc(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-surface-900 mb-2">Supprimer le document</h3>
            <p className="text-sm text-surface-600 mb-4">
              Êtes-vous sûr de vouloir supprimer <span className="font-semibold">{deleteDoc.title}</span> ?
              Cette action est irréversible.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteDoc(null)} className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-xl">
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={actionLoading === deleteDoc.id}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading === deleteDoc.id ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Overview Tab ────────────────────────────────────────────────────────────

function OverviewTab({ employee, formatDate }: { employee: Employee; formatDate: (d: string | null) => string }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">Informations personnelles</h3>
        <div className="space-y-3">
          <InfoRow icon={<User className="w-4 h-4" />} label="Nom complet" value={employee.full_name} />
          <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={employee.email} />
          <InfoRow icon={<Phone className="w-4 h-4" />} label="Téléphone" value={employee.phone || '-'} />
          <InfoRow icon={<MapPin className="w-4 h-4" />} label="Adresse" value={employee.address || '-'} />
          <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date de naissance" value={formatDate(employee.birth_date)} />
          <InfoRow icon={<span className="text-xs font-bold">CIN</span>} label="CIN" value={employee.cin || '-'} />
          <InfoRow icon={<span className="text-xs font-bold">{employee.gender === 'male' ? 'H' : 'F'}</span>} label="Genre" value={employee.gender === 'male' ? 'Homme' : 'Femme'} />
        </div>
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider mb-4">Informations professionnelles</h3>
        <div className="space-y-3">
          <InfoRow icon={<span className="text-xs font-mono">{employee.matricule}</span>} label="Matricule" value={employee.matricule} />
          <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Poste" value={employee.position || '-'} />
          <InfoRow icon={<Building2 className="w-4 h-4" />} label="Département" value={employee.department?.name || '-'} />
          <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date d'embauche" value={formatDate(employee.hire_date)} />
          <InfoRow icon={<FileText className="w-4 h-4" />} label="Type de contrat" value={employee.contract_type} />
          <InfoRow icon={<CreditCard className="w-4 h-4" />} label="Salaire" value={employee.salary ? `${employee.salary.toLocaleString('fr-MA')} DH` : '-'} />
        </div>
      </Card>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-surface-400 w-5 flex justify-center">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-surface-400">{label}</p>
        <p className="font-medium text-surface-800 truncate">{value}</p>
      </div>
    </div>
  );
}

// ── Documents Tab ───────────────────────────────────────────────────────────

function DocumentsTab({
  employeeId, documents, docCounts, docCategory, docLoading,
  onCategoryChange, onUpload, onPreview, onReplace, onDelete, formatDate,
}: {
  employeeId: number;
  documents: EmployeeDocument[];
  docCounts: DocumentCategoryCounts | null;
  docCategory: string;
  docLoading: boolean;
  onCategoryChange: (cat: string) => void;
  onUpload: (cat: DocumentCategory) => void;
  onPreview: (doc: EmployeeDocument) => void;
  onReplace: (doc: EmployeeDocument) => void;
  onDelete: (doc: EmployeeDocument) => void;
  formatDate: (d: string | null) => string;
}) {
  const categories: (DocumentCategory | 'all')[] = ['all', 'cv', 'diploma', 'attestation', 'medical', 'contract'];

  return (
    <div className="space-y-5">
      {/* Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {(Object.keys(CATEGORY_CONFIG) as DocumentCategory[]).filter(c => c !== 'contract').map((cat) => {
          const cfg = CATEGORY_CONFIG[cat];
          const count = docCounts?.[cat] || 0;
          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(docCategory === cat ? 'all' : cat)}
              className={`p-4 rounded-xl border text-left transition-all ${
                docCategory === cat
                  ? 'border-primary-300 bg-primary-50 ring-1 ring-primary-200'
                  : 'border-surface-200 hover:border-surface-300 hover:bg-surface-50'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${cfg.color}`}>
                {cfg.icon}
              </div>
              <p className="text-sm font-semibold text-surface-900">{cfg.label}</p>
              <p className="text-xs text-surface-500 mt-0.5">{count} document{count > 1 ? 's' : ''}</p>
            </button>
          );
        })}
      </div>

      {/* Upload Button */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-surface-500">
          {documents.length} document{documents.length > 1 ? 's' : ''}
          {docCategory !== 'all' && ` — ${CATEGORY_CONFIG[docCategory as DocumentCategory]?.label}`}
        </p>
        {docCategory !== 'all' && (
          <button
            onClick={() => onUpload(docCategory as DocumentCategory)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Ajouter
          </button>
        )}
      </div>

      {/* Documents List */}
      {docLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : documents.length === 0 ? (
        <Card>
          <div className="text-center py-10">
            <FileText className="w-10 h-10 text-surface-300 mx-auto mb-3" />
            <p className="text-sm text-surface-500">
              {docCategory === 'all' ? 'Aucun document pour cet employé.' : 'Aucun document dans cette catégorie.'}
            </p>
            {docCategory !== 'all' && (
              <button onClick={() => onUpload(docCategory as DocumentCategory)} className="text-primary-600 text-sm mt-2 hover:underline">
                Ajouter un document
              </button>
            )}
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const isImage = doc.file_type.startsWith('image/');
            return (
              <Card key={doc.id} padding={false}>
                <div className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${CATEGORY_CONFIG[doc.category]?.color || 'bg-surface-50 text-surface-600'}`}>
                    {isImage ? <Image className="w-5 h-5" /> : <File className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-surface-900 truncate">{doc.title}</p>
                    <div className="flex items-center gap-3 text-xs text-surface-500 mt-0.5">
                      <span>{doc.file_name}</span>
                      <span>•</span>
                      <span>{doc.file_size_formatted}</span>
                      <span>•</span>
                      <span>{formatDate(doc.created_at)}</span>
                    </div>
                    {doc.uploaded_by && (
                      <p className="text-[11px] text-surface-400 mt-0.5">
                        Ajouté par {doc.uploaded_by.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => onPreview(doc)}
                      className="p-2 rounded-lg hover:bg-blue-50 text-blue-500 hover:text-blue-600 transition-colors"
                      title="Aperçu"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={doc.url || '#'}
                      download={doc.file_name}
                      className="p-2 rounded-lg hover:bg-surface-100 text-surface-400 hover:text-surface-600 transition-colors"
                      title="Télécharger"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => onReplace(doc)}
                      className="p-2 rounded-lg hover:bg-amber-50 text-amber-500 hover:text-amber-600 transition-colors"
                      title="Remplacer"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(doc)}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Contract Tab ────────────────────────────────────────────────────────────

function ContractTab({ employee, formatDate }: { employee: Employee; formatDate: (d: string | null) => string }) {
  const contract = (employee as any).contract as Contract | undefined;

  const handleDownloadPdf = async () => {
    if (!contract) return;
    const token = localStorage.getItem('auth_token');
    const res = await fetch(api.contracts.downloadPdf(contract.id), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract_${contract.id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePreviewPdf = async () => {
    if (!contract) return;
    const token = localStorage.getItem('auth_token');
    const res = await fetch(api.contracts.previewPdf(contract.id), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (!contract) {
    return (
      <Card>
        <div className="text-center py-10">
          <CreditCard className="w-10 h-10 text-surface-300 mx-auto mb-3" />
          <p className="text-sm text-surface-500">Aucun contrat trouvé pour cet employé.</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-surface-400 uppercase tracking-wider">Contrat actuel</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviewPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <Eye className="w-4 h-4" />
              Voir
            </button>
            <button
              onClick={handleDownloadPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Télécharger
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow icon={<FileText className="w-4 h-4" />} label="Type" value={contract.type || '-'} />
          <InfoRow icon={<Building2 className="w-4 h-4" />} label="Département" value={contract.department || '-'} />
          <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date de début" value={formatDate(contract.start_date)} />
          <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date de fin" value={formatDate(contract.end_date)} />
          <InfoRow icon={<CreditCard className="w-4 h-4" />} label="Salaire" value={contract.salary ? `${Number(contract.salary).toLocaleString('fr-MA')} DH` : '-'} />
          <InfoRow icon={<Shield className="w-4 h-4" />} label="Statut" value={contract.status || '-'} />
          {contract.trial_period && <InfoRow icon={<Clock className="w-4 h-4" />} label="Période d'essai" value={contract.trial_period} />}
          {contract.work_hours && <InfoRow icon={<Clock className="w-4 h-4" />} label="Horaires" value={contract.work_hours} />}
          {contract.leave_days != null && <InfoRow icon={<Calendar className="w-4 h-4" />} label="Jours de congé" value={`${contract.leave_days} jours`} />}
          {contract.benefits && <InfoRow icon={<Check className="w-4 h-4" />} label="Avantages" value={contract.benefits} />}
          {contract.observations && (
            <div className="col-span-2">
              <InfoRow icon={<FileText className="w-4 h-4" />} label="Observations" value={contract.observations} />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

// ── History Tab ─────────────────────────────────────────────────────────────

function HistoryTab({ history }: { history: any[] }) {
  if (history.length === 0) {
    return (
      <Card>
        <div className="text-center py-10">
          <History className="w-10 h-10 text-surface-300 mx-auto mb-3" />
          <p className="text-sm text-surface-500">Aucun historique de documents.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card padding={false}>
      <div className="p-4 border-b border-surface-100">
        <h3 className="text-sm font-semibold text-surface-900">Historique des documents</h3>
      </div>
      <div className="divide-y divide-surface-100">
        {history.map((h, i) => (
          <div key={i} className="p-4 flex items-center gap-4 hover:bg-surface-50/50 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-surface-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-surface-900">{h.title}</p>
              <div className="flex items-center gap-2 text-xs text-surface-500 mt-0.5">
                <Badge variant="default" size="sm">{h.category_label}</Badge>
                <span>{h.file_name}</span>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs text-surface-500">{h.date}</p>
              <p className="text-[11px] text-surface-400">{h.uploaded_by}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Upload Modal ────────────────────────────────────────────────────────────

function UploadModal({
  category, form, loading, error, onChange, onValidate, onSubmit, onClose, isReplace,
}: {
  category: DocumentCategory;
  form: { title: string; file: File | null };
  loading: boolean;
  error: string;
  onChange: (f: { title: string; file: File | null }) => void;
  onValidate: (file: File) => string | null;
  onSubmit: () => void;
  onClose: () => void;
  isReplace?: boolean;
}) {
  const cfg = CATEGORY_CONFIG[category];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = onValidate(file);
    if (err) { alert(err); return; }
    onChange({ ...form, file, title: form.title || file.name });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="border-b border-surface-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.color}`}>{cfg.icon}</div>
            <h2 className="text-lg font-bold text-surface-900">{isReplace ? 'Remplacer' : 'Ajouter'} — {cfg.label}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 text-surface-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1">Titre *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
              placeholder="Nom du document"
              className="w-full px-3 py-2 text-sm border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-surface-600 mb-1">Fichier * (PDF, JPG, PNG — max 10 MB)</label>
            <div className="flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center px-4 py-6 border-2 border-dashed border-surface-200 rounded-xl cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
                <div className="text-center">
                  <Upload className="w-6 h-6 text-surface-400 mx-auto mb-1" />
                  <p className="text-xs text-surface-500">
                    {form.file ? form.file.name : 'Choisir un fichier'}
                  </p>
                </div>
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} />
              </label>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="border-t border-surface-100 px-6 py-4 flex items-center justify-end gap-3 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-surface-600 hover:bg-surface-100 rounded-xl">
            Annuler
          </button>
          <button
            onClick={onSubmit}
            disabled={loading || !form.file || !form.title}
            className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isReplace ? 'Remplacer' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Preview Modal ───────────────────────────────────────────────────────────

function PreviewModal({ doc, onClose }: { doc: EmployeeDocument; onClose: () => void }) {
  const isImage = doc.file_type.startsWith('image/');
  const isPdf = doc.file_type === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden mx-4 flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-100">
          <div>
            <h3 className="text-base font-bold text-surface-900">{doc.title}</h3>
            <p className="text-xs text-surface-400">{doc.file_name} • {doc.file_size_formatted}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={doc.url || '#'} download={doc.file_name} className="p-2 rounded-lg hover:bg-surface-100 text-surface-500" title="Télécharger">
              <Download className="w-4 h-4" />
            </a>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-100 text-surface-400">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-surface-50">
          {isImage && doc.url && (
            <img src={doc.url} alt={doc.title} className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg" />
          )}
          {isPdf && doc.url && (
            <iframe src={doc.url} className="w-full h-[70vh] rounded-xl border border-surface-200" title={doc.title} />
          )}
          {!isImage && !isPdf && (
            <div className="text-center py-10">
              <FileText className="w-12 h-12 text-surface-300 mx-auto mb-3" />
              <p className="text-sm text-surface-500">Aperçu non disponible pour ce type de fichier.</p>
              <a href={doc.url || '#'} download={doc.file_name} className="text-primary-600 text-sm mt-2 hover:underline inline-block">
                Télécharger le fichier
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

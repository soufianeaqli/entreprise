import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  ArrowLeft, RefreshCw, Plus, Trash2, TrendingUp, TrendingDown, Wallet,
  Calendar, User, FileText, CheckCircle, AlertTriangle, DollarSign,
} from 'lucide-react';
import { api, type Project, type ProjectIncome, type ProjectExpense } from '@/services/api';

const fmt = (n: number) => new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 0 }).format(n);

const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'info' | 'danger' | 'default' }> = {
  planned: { label: 'Planifié', variant: 'info' },
  in_progress: { label: 'En cours', variant: 'success' },
  completed: { label: 'Terminé', variant: 'default' },
  on_hold: { label: 'En pause', variant: 'warning' },
  cancelled: { label: 'Annulé', variant: 'danger' },
};

const expenseCategories = [
  'Salaires', 'Matériel', 'Hébergement', 'Marketing', 'Déplacements', 'Formation', 'Logiciels', 'Divers',
];

const paymentMethods = [
  { value: 'bank_transfer', label: 'Virement bancaire' },
  { value: 'cash', label: 'Espèces' },
  { value: 'check', label: 'Chèque' },
  { value: 'mobile_payment', label: 'Paiement mobile' },
  { value: 'other', label: 'Autre' },
];

const paymentMethodLabels: Record<string, string> = {
  bank_transfer: 'Virement',
  cash: 'Espèces',
  check: 'Chèque',
  mobile_payment: 'Mobile',
  other: 'Autre',
};

export default function FinanceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  const [incomeAmount, setIncomeAmount] = useState('');
  const [incomeDate, setIncomeDate] = useState('');
  const [incomeMethod, setIncomeMethod] = useState('bank_transfer');
  const [incomeRef, setIncomeRef] = useState('');
  const [incomeDesc, setIncomeDesc] = useState('');

  const [expenseCategory, setExpenseCategory] = useState('Salaires');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseDesc, setExpenseDesc] = useState('');
  const [expenseReceipt, setExpenseReceipt] = useState('');

  const [confirmDelete, setConfirmDelete] = useState<{ type: 'income' | 'expense'; id: number; label: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchProject = async (silent = false) => {
    if (!id) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await api.finance.getProject(Number(id));
      setProject(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const handleAddIncome = async () => {
    if (!project) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await api.finance.addIncome(project.id, {
        amount: Number(incomeAmount),
        date: incomeDate,
        payment_method: incomeMethod,
        reference: incomeRef || null,
        description: incomeDesc || null,
      });
      setShowIncomeModal(false);
      setIncomeAmount('');
      setIncomeDate('');
      setIncomeMethod('bank_transfer');
      setIncomeRef('');
      setIncomeDesc('');
      await fetchProject(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur lors de l'ajout du revenu");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddExpense = async () => {
    if (!project) return;
    setFormError(null);
    setSubmitting(true);
    try {
      await api.finance.addExpense(project.id, {
        category: expenseCategory,
        amount: Number(expenseAmount),
        date: expenseDate,
        description: expenseDesc || null,
        receipt: expenseReceipt || null,
      });
      setShowExpenseModal(false);
      setExpenseCategory('Salaires');
      setExpenseAmount('');
      setExpenseDate('');
      setExpenseDesc('');
      setExpenseReceipt('');
      await fetchProject(true);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erreur lors de l'ajout de la dépense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!confirmDelete) return;
    try {
      if (confirmDelete.type === 'income') {
        await api.finance.deleteIncome(confirmDelete.id);
      } else {
        await api.finance.deleteExpense(confirmDelete.id);
      }
      setConfirmDelete(null);
      await fetchProject(true);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <p className="text-surface-500">{error || 'Projet introuvable'}</p>
        <Button onClick={() => navigate('/finance')} variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>Retour</Button>
      </div>
    );
  }

  const s = statusMap[project.status] || { label: project.status, variant: 'default' as const };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={() => navigate('/finance')} />
        <div>
          <h1 className="text-2xl font-bold text-surface-900">{project.name}</h1>
          <p className="text-sm text-surface-500">{project.client}</p>
        </div>
        <div className="ml-auto">
          <Badge variant={s.variant} dot>{s.label}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="flex items-center gap-3">
          <Wallet className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-lg font-bold text-surface-900">{fmt(project.budget)} MAD</p>
            <p className="text-xs text-surface-500">Budget prévu</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-lg font-bold text-green-600">{fmt(project.total_incomes)} MAD</p>
            <p className="text-xs text-surface-500">Revenus encaissés</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <TrendingDown className="w-5 h-5 text-red-500" />
          <div>
            <p className="text-lg font-bold text-red-500">{fmt(project.total_expenses)} MAD</p>
            <p className="text-xs text-surface-500">Dépenses engagées</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          {project.result >= 0
            ? <CheckCircle className="w-5 h-5 text-emerald-500" />
            : <AlertTriangle className="w-5 h-5 text-orange-500" />
          }
          <div>
            <p className={`text-lg font-bold ${project.result >= 0 ? 'text-emerald-600' : 'text-orange-500'}`}>
              {project.result >= 0 ? '+' : ''}{fmt(project.result)} MAD
            </p>
            <p className="text-xs text-surface-500">{project.result >= 0 ? 'Bénéfice' : 'Perte'}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-lg font-bold text-surface-900">{fmt(project.remaining_budget)} MAD</p>
            <p className="text-xs text-surface-500">Reste à encaisser</p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-surface-500">Date de début</p>
            <p className="font-medium text-surface-900 flex items-center gap-1.5 mt-1">
              <Calendar className="w-3.5 h-3.5 text-surface-400" />
              {project.start_date}
            </p>
          </div>
          <div>
            <p className="text-surface-500">Date de fin</p>
            <p className="font-medium text-surface-900 flex items-center gap-1.5 mt-1">
              <Calendar className="w-3.5 h-3.5 text-surface-400" />
              {project.end_date || 'Non définie'}
            </p>
          </div>
          <div>
            <p className="text-surface-500">Responsable</p>
            <p className="font-medium text-surface-900 flex items-center gap-1.5 mt-1">
              <User className="w-3.5 h-3.5 text-surface-400" />
              {project.manager || 'Non assigné'}
            </p>
          </div>
          <div>
            <p className="text-surface-500">Taux de rentabilité</p>
            <p className={`font-semibold mt-1 ${project.profitability_rate >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              {project.profitability_rate}%
            </p>
          </div>
        </div>
        {project.description && (
          <div className="mt-4 pt-4 border-t border-surface-100">
            <p className="text-surface-500 text-sm">Description</p>
            <p className="text-sm text-surface-700 mt-1 flex items-start gap-1.5">
              <FileText className="w-3.5 h-3.5 text-surface-400 mt-0.5 shrink-0" />
              {project.description}
            </p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Historique des revenus</CardTitle>
            <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowIncomeModal(true)}>
              Ajouter
            </Button>
          </CardHeader>
          {project.incomes && project.incomes.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {project.incomes.map((income) => (
                <div key={income.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900">{fmt(income.amount)} MAD</p>
                      <p className="text-xs text-surface-500">
                        {income.date} · {paymentMethodLabels[income.payment_method] || income.payment_method}
                        {income.reference && ` · ${income.reference}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
                    onClick={() => setConfirmDelete({ type: 'income', id: income.id, label: `Revenu de ${fmt(income.amount)} MAD` })}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">Aucun revenu enregistré</p>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historique des dépenses</CardTitle>
            <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={() => setShowExpenseModal(true)}>
              Ajouter
            </Button>
          </CardHeader>
          {project.expenses && project.expenses.length > 0 ? (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {project.expenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-surface-900">{fmt(expense.amount)} MAD</p>
                      <p className="text-xs text-surface-500">
                        {expense.date} · {expense.category}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 className="w-3.5 h-3.5 text-red-400" />}
                    onClick={() => setConfirmDelete({ type: 'expense', id: expense.id, label: `Dépense de ${fmt(expense.amount)} MAD` })}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-surface-400 text-center py-8">Aucune dépense enregistrée</p>
          )}
        </Card>
      </div>

      <Modal isOpen={showIncomeModal} onClose={() => { setShowIncomeModal(false); setFormError(null); }} title="Ajouter un revenu">
        <div className="space-y-4">
          <Input label="Montant (MAD)" type="number" placeholder="Ex: 50000" value={incomeAmount} onChange={(e) => setIncomeAmount(e.target.value)} />
          <Input label="Date" type="date" value={incomeDate} onChange={(e) => setIncomeDate(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Méthode de paiement</label>
            <select
              className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              value={incomeMethod}
              onChange={(e) => setIncomeMethod(e.target.value)}
            >
              {paymentMethods.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <Input label="Référence (optionnel)" placeholder="N° facture, chèque..." value={incomeRef} onChange={(e) => setIncomeRef(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Description (optionnel)</label>
            <textarea
              className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
              rows={2}
              placeholder="Détails du paiement..."
              value={incomeDesc}
              onChange={(e) => setIncomeDesc(e.target.value)}
            />
          </div>
          {formError && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{formError}</p>}
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button variant="secondary" onClick={() => { setShowIncomeModal(false); setFormError(null); }}>Annuler</Button>
            <Button onClick={handleAddIncome} disabled={submitting}>{submitting ? 'Enregistrement...' : 'Ajouter'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showExpenseModal} onClose={() => { setShowExpenseModal(false); setFormError(null); }} title="Ajouter une dépense">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Catégorie</label>
            <select
              className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 bg-white"
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
            >
              {expenseCategories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <Input label="Montant (MAD)" type="number" placeholder="Ex: 12000" value={expenseAmount} onChange={(e) => setExpenseAmount(e.target.value)} />
          <Input label="Date" type="date" value={expenseDate} onChange={(e) => setExpenseDate(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Description (optionnel)</label>
            <textarea
              className="w-full px-3 py-2 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
              rows={2}
              placeholder="Détails de la dépense..."
              value={expenseDesc}
              onChange={(e) => setExpenseDesc(e.target.value)}
            />
          </div>
          <Input label="Pièce justificative (optionnel)" placeholder="N° facture, reçu..." value={expenseReceipt} onChange={(e) => setExpenseReceipt(e.target.value)} />
          {formError && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{formError}</p>}
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-100">
            <Button variant="secondary" onClick={() => { setShowExpenseModal(false); setFormError(null); }}>Annuler</Button>
            <Button onClick={handleAddExpense} disabled={submitting}>{submitting ? 'Enregistrement...' : 'Ajouter'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Confirmer la suppression" size="sm">
        <p className="text-sm text-surface-600 mb-6">
          Voulez-vous vraiment supprimer <strong>{confirmDelete?.label}</strong> ?
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Annuler</Button>
          <Button variant="danger" onClick={handleDeleteItem}>Supprimer</Button>
        </div>
      </Modal>
    </div>
  );
}

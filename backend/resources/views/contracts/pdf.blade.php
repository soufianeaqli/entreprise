<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; color: #1a1a1a; font-size: 12px; line-height: 1.6; }
        .header { text-align: center; border-bottom: 3px solid #16a34a; padding-bottom: 20px; margin-bottom: 30px; }
        .header h1 { font-size: 22px; color: #16a34a; margin-bottom: 5px; }
        .header p { font-size: 11px; color: #6b7280; }
        .title { text-align: center; font-size: 18px; font-weight: bold; margin: 25px 0; text-transform: uppercase; letter-spacing: 1px; color: #111827; }
        .section { margin-bottom: 20px; }
        .section-title { font-size: 13px; font-weight: bold; color: #16a34a; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 12px; text-transform: uppercase; }
        .info-grid { display: flex; flex-wrap: wrap; gap: 8px 30px; }
        .info-item { width: 45%; margin-bottom: 8px; }
        .info-label { font-size: 10px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .info-value { font-size: 12px; font-weight: 600; color: #111827; }
        .full-width { width: 100% !important; }
        .signature-section { margin-top: 50px; display: flex; justify-content: space-between; }
        .signature-block { width: 40%; text-align: center; }
        .signature-line { border-top: 1px solid #374151; margin-top: 60px; padding-top: 8px; }
        .signature-label { font-size: 11px; color: #6b7280; }
        .footer { text-align: center; margin-top: 40px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 10px; color: #9ca3af; }
        .badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
        .badge-active { background: #dcfce7; color: #166534; }
        .badge-pending { background: #fef9c3; color: #854d0e; }
        .badge-expired { background: #fee2e2; color: #991b1b; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $company['name'] }}</h1>
        <p>{{ $company['address'] }}</p>
    </div>

    <div class="title">Contrat de Travail</div>

    <div class="section">
        <div class="section-title">Informations de l'employé</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Nom complet</div>
                <div class="info-value">{{ $employee ? $employee->first_name . ' ' . $employee->last_name : $contract->employee_name }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Email</div>
                <div class="info-value">{{ $contract->employee_name }}</div>
            </div>
            @if($employee)
            <div class="info-item">
                <div class="info-label">Poste</div>
                <div class="info-value">{{ $employee->position ?? '-' }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Département</div>
                <div class="info-value">{{ $employee->department->name ?? $contract->department ?? '-' }}</div>
            </div>
            @endif
        </div>
    </div>

    <div class="section">
        <div class="section-title">Détails du contrat</div>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Type de contrat</div>
                <div class="info-value">{{ $contract->type ?? '-' }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Statut</div>
                <div class="info-value">
                    @if($contract->status === 'active')
                        <span class="badge badge-active">Actif</span>
                    @elseif($contract->status === 'pending')
                        <span class="badge badge-pending">En attente</span>
                    @else
                        <span class="badge badge-expired">Expiré</span>
                    @endif
                </div>
            </div>
            <div class="info-item">
                <div class="info-label">Date de début</div>
                <div class="info-value">{{ $contract->start_date ? $contract->start_date->format('d/m/Y') : '-' }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Date de fin</div>
                <div class="info-value">{{ $contract->end_date ? $contract->end_date->format('d/m/Y') : 'Indéterminée' }}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Salaire</div>
                <div class="info-value">{{ $contract->salary ? number_format((float)$contract->salary, 2, ',', ' ') . ' DH' : '-' }}</div>
            </div>
            @if($contract->trial_period)
            <div class="info-item">
                <div class="info-label">Période d'essai</div>
                <div class="info-value">{{ $contract->trial_period }}</div>
            </div>
            @endif
            @if($contract->work_hours)
            <div class="info-item">
                <div class="info-label">Horaires de travail</div>
                <div class="info-value">{{ $contract->work_hours }}</div>
            </div>
            @endif
            @if($contract->leave_days != null)
            <div class="info-item">
                <div class="info-label">Jours de congé</div>
                <div class="info-value">{{ $contract->leave_days }} jours</div>
            </div>
            @endif
        </div>
    </div>

    @if($contract->benefits)
    <div class="section">
        <div class="section-title">Avantages</div>
        <div class="info-value">{{ $contract->benefits }}</div>
    </div>
    @endif

    @if($contract->observations)
    <div class="section">
        <div class="section-title">Observations</div>
        <div class="info-value">{{ $contract->observations }}</div>
    </div>
    @endif

    <div class="signature-section">
        <div class="signature-block">
            <div class="signature-line">L'employeur</div>
            <div class="signature-label">Nom & Signature</div>
        </div>
        <div class="signature-block">
            <div class="signature-line">L'employé(e)</div>
            <div class="signature-label">Nom & Signature</div>
        </div>
    </div>

    <div class="footer">
        <p>Document généré le {{ now()->format('d/m/Y à H:i') }} — {{ $company['name'] }}</p>
    </div>
</body>
</html>

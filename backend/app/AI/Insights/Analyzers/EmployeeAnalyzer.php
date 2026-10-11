<?php

namespace App\AI\Insights\Analyzers;

use App\AI\Insights\Enums\InsightCategory;
use App\AI\Insights\Enums\InsightSeverity;
use App\AI\Insights\Insight;
use App\Models\Employee;
use App\Models\EmployeeDocument;

class EmployeeAnalyzer implements AnalyzerInterface
{
    public function getName(): string
    {
        return 'employee_analyzer';
    }

    public function analyze(): array
    {
        $insights = [];

        // Employees with no documents at all
        $employeesWithoutDocs = Employee::where('status', true)
            ->whereDoesntHave('documents')
            ->count();

        if ($employeesWithoutDocs > 0) {
            $insights[] = new Insight(
                rule: 'employee_missing_documents',
                title: $employeesWithoutDocs . ' employé(s) sans documents',
                description: 'Ces employés actifs n\'ont aucun document dans leur dossier. Demandez les pièces requises.',
                severity: InsightSeverity::Warning,
                category: InsightCategory::Employee,
                actions: [
                    ['label' => 'Voir les employés', 'route' => '/employees', 'method' => 'GET'],
                ],
            );
        }

        // Employees with no CIN (national ID)
        $noCin = Employee::where('status', true)
            ->whereNull('cin')
            ->count();

        if ($noCin > 0) {
            $insights[] = new Insight(
                rule: 'employee_missing_cin',
                title: $noCin . ' employé(s) sans CIN enregistré',
                description: 'La pièce d\'identité nationale est obligatoire. Vérifiez les dossiers incomplets.',
                severity: InsightSeverity::Info,
                category: InsightCategory::Employee,
                actions: [
                    ['label' => 'Voir les employés', 'route' => '/employees', 'method' => 'GET'],
                ],
            );
        }

        // Employees missing contract
        $noContract = Employee::where('status', true)
            ->whereDoesntHave('contract')
            ->count();

        if ($noContract > 0) {
            $insights[] = new Insight(
                rule: 'employee_missing_contract',
                title: $noContract . ' employé(s) actif(s) sans contrat',
                description: 'Des employés actifs n\'ont pas de contrat associé. Créez les contrats manquants.',
                severity: InsightSeverity::Critical,
                category: InsightCategory::Employee,
                actions: [
                    ['label' => 'Voir les employés', 'route' => '/employees', 'method' => 'GET'],
                    ['label' => 'Voir les contrats', 'route' => '/contracts', 'method' => 'GET'],
                ],
            );
        }

        // Employees missing email or phone
        $incompleteProfiles = Employee::where('status', true)
            ->where(function ($q) {
                $q->whereNull('phone')->orWhereNull('address');
            })
            ->count();

        if ($incompleteProfiles > 0) {
            $insights[] = new Insight(
                rule: 'employee_incomplete_profile',
                title: $incompleteProfiles . ' profil(s) employé incomplet(s)',
                description: 'Certains employés n\'ont pas de numéro de téléphone ou d\'adresse renseigné.',
                severity: InsightSeverity::Info,
                category: InsightCategory::Employee,
                actions: [
                    ['label' => 'Voir les employés', 'route' => '/employees', 'method' => 'GET'],
                ],
            );
        }

        return $insights;
    }
}

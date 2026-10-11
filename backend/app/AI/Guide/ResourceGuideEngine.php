<?php

namespace App\AI\Guide;

class FieldDefinition
{
    public function __construct(
        public readonly string $key,
        public readonly string $label,
        public readonly string $type,
        public readonly bool $required = true,
        public readonly ?string $description = null,
        public readonly array $options = [],
        public readonly ?string $suggestionPrompt = null,
        public readonly ?string $validationPattern = null,
        public readonly ?string $validationMessage = null,
        public readonly ?string $defaultValue = null,
        public readonly bool $autoGenerate = false,
        public readonly bool $confirmOnly = false,
    ) {}

    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'label' => $this->label,
            'type' => $this->type,
            'required' => $this->required,
            'description' => $this->description,
            'options' => $this->options,
            'auto_generate' => $this->autoGenerate,
        ];
    }
}

class ResourceGuideEngine
{
    /** @var array<string, array{label: string, fields: FieldDefinition[], tool: string, summary: string}> */
    private array $resources = [];

    public function __construct()
    {
        $this->registerDefaults();
    }

    public function getResource(string $type): ?array
    {
        return $this->resources[$type] ?? null;
    }

    public function getAll(): array
    {
        return $this->resources;
    }

    public function getResourceTypes(): array
    {
        return array_keys($this->resources);
    }

    public function getFields(string $resourceType): array
    {
        return $this->resources[$resourceType]['fields'] ?? [];
    }

    public function getRequiredFields(string $resourceType): array
    {
        return array_filter(
            $this->getFields($resourceType),
            fn(FieldDefinition $f) => $f->required
        );
    }

    public function getField(string $resourceType, string $fieldKey): ?FieldDefinition
    {
        foreach ($this->getFields($resourceType) as $field) {
            if ($field->key === $fieldKey) {
                return $field;
            }
        }
        return null;
    }

    public function formatForPrompt(string $resourceType): string
    {
        $resource = $this->getResource($resourceType);
        if (!$resource) return '';

        $lines = ["### Création de: {$resource['label']}"];
        $lines[] = "Outil à utiliser: {$resource['tool']}";
        $lines[] = '';

        foreach ($resource['fields'] as $field) {
            $req = $field->required ? '(obligatoire)' : '(optionnel)';
            $line = "- **{$field->label}** [{$field->key}] {$req} — {$field->type}";
            if ($field->description) {
                $line .= "\n  {$field->description}";
            }
            if (!empty($field->options)) {
                $line .= "\n  Valeurs: " . implode(', ', $field->options);
            }
            $lines[] = $line;
        }

        return implode("\n", $lines);
    }

    public function formatProgress(string $resourceType, array $collected): string
    {
        $fields = $this->getFields($resourceType);
        $total = count($fields);
        $done = count($collected);
        $pct = $total > 0 ? round(($done / $total) * 100) : 0;

        $bar = str_repeat('█', (int) ($pct / 10)) . str_repeat('░', 10 - (int) ($pct / 10));

        $lines = ["Progression: [{$bar}] {$pct}% ({$done}/{$total} champs)"];
        $lines[] = '';

        foreach ($fields as $field) {
            $value = $collected[$field->key] ?? null;
            $icon = $value !== null ? '✅' : ($field->required ? '⬜' : '◻️');
            $display = $value !== null ? $this->formatFieldValue($field, $value) : ($field->required ? 'En attente...' : 'Non rempli');
            $lines[] = "{$icon} **{$field->label}**: {$display}";
        }

        return implode("\n", $lines);
    }

    public function formatSummary(string $resourceType, array $collected): string
    {
        $lines = ["## Récapitulatif — {$this->resources[$resourceType]['label']}", ''];

        foreach ($this->getFields($resourceType) as $field) {
            $value = $collected[$field->key] ?? null;
            if ($value !== null) {
                $lines[] = "- **{$field->label}**: {$this->formatFieldValue($field, $value)}";
            }
        }

        $lines[] = '';
        $lines[] = 'Confirmez-vous la création avec ces informations ?';

        return implode("\n", $lines);
    }

    public function getNextField(string $resourceType, array $collected): ?FieldDefinition
    {
        foreach ($this->getFields($resourceType) as $field) {
            if (!array_key_exists($field->key, $collected)) {
                return $field;
            }
        }
        return null;
    }

    public function getSmartPrompt(string $resourceType, string $fieldKey, array $collected): string
    {
        $field = $this->getField($resourceType, $fieldKey);
        if (!$field) return '';

        $prompt = "Pour le champ « {$field->label}»";
        if ($field->description) {
            $prompt .= " ({$field->description})";
        }
        $prompt .= " — ";

        if (!empty($field->options)) {
            $prompt .= "Options: " . implode(', ', $field->options) . ". ";
        }

        if ($field->autoGenerate) {
            $prompt .= "Vous pouvez proposer des suggestions automatiques. ";
        }

        if (!empty($collected)) {
            $prompt .= "Contexte: " . implode(', ', array_map(
                fn($k, $v) => "{$k}={$v}",
                array_keys($collected),
                array_values($collected)
            ));
        }

        return $prompt;
    }

    private function formatFieldValue(FieldDefinition $field, mixed $value): string
    {
        if ($field->type === 'budget' || $field->type === 'salary') {
            return number_format((float) $value, 2, ',', ' ') . ' MAD';
        }
        return (string) $value;
    }

    private function registerDefaults(): void
    {
        // ── Department ──
        $this->resources['department'] = [
            'label' => 'Département',
            'tool' => 'create_department',
            'summary' => 'Création d\'un département',
            'fields' => [
                new FieldDefinition('name', 'Nom du département', 'text', true, 'Nom unique du département', autoGenerate: true, suggestionPrompt: 'Propose 3 noms professionnels pour un département basé sur le contexte'),
                new FieldDefinition('code', 'Code', 'text', true, 'Code court (2-5 caractères)', autoGenerate: true, suggestionPrompt: 'Génère un code court basé sur le nom'),
                new FieldDefinition('description', 'Description', 'textarea', false, 'Description détaillée du département et de ses missions', autoGenerate: true, suggestionPrompt: 'Génère 3 descriptions professionnelles pour ce département'),
                new FieldDefinition('location', 'Localisation', 'text', false, 'Bureau ou ville'),
                new FieldDefinition('annual_budget', 'Budget annuel', 'budget', false, 'Budget en MAD'),
            ],
        ];

        // ── RH Manager ──
        $this->resources['rh_manager'] = [
            'label' => 'Responsable RH',
            'tool' => 'create_rh_manager',
            'summary' => 'Création d\'un Responsable RH',
            'fields' => [
                new FieldDefinition('first_name', 'Prénom', 'text', true),
                new FieldDefinition('last_name', 'Nom', 'text', true),
                new FieldDefinition('email', 'Email', 'email', true, 'Email professionnel unique', validationPattern: '/^[^\s@]+@[^\s@]+\.[^\s@]+$/'),
                new FieldDefinition('phone', 'Téléphone', 'phone', true, 'Numéro de téléphone'),
                new FieldDefinition('gender', 'Genre', 'select', true, options: ['Homme', 'Femme']),
                new FieldDefinition('cin', 'CIN', 'text', true, 'Numéro CIN unique'),
                new FieldDefinition('address', 'Adresse', 'text', false),
                new FieldDefinition('birth_date', 'Date de naissance', 'date', false),
                new FieldDefinition('contract_type', 'Type de contrat', 'select', true, options: ['CDI', 'CDD', 'Stage', 'Freelance']),
                new FieldDefinition('salary', 'Salaire', 'salary', false, 'Salaire mensuel en MAD'),
            ],
        ];

        // ── Employee ──
        $this->resources['employee'] = [
            'label' => 'Employé',
            'tool' => 'create_employee',
            'summary' => 'Création d\'un employé',
            'fields' => [
                new FieldDefinition('first_name', 'Prénom', 'text', true),
                new FieldDefinition('last_name', 'Nom', 'text', true),
                new FieldDefinition('email', 'Email', 'email', true, 'Email professionnel unique'),
                new FieldDefinition('phone', 'Téléphone', 'phone', true),
                new FieldDefinition('gender', 'Genre', 'select', true, options: ['Homme', 'Femme']),
                new FieldDefinition('cin', 'CIN', 'text', true),
                new FieldDefinition('address', 'Adresse', 'text', false),
                new FieldDefinition('birth_date', 'Date de naissance', 'date', false),
                new FieldDefinition('department_id', 'Département', 'select', true, 'ID du département'),
                new FieldDefinition('position', 'Poste', 'text', true, 'Intitulé du poste', autoGenerate: true),
                new FieldDefinition('hire_date', 'Date d\'embauche', 'date', true),
                new FieldDefinition('contract_type', 'Type de contrat', 'select', true, options: ['CDI', 'CDD', 'Stage', 'Freelance']),
                new FieldDefinition('salary', 'Salaire', 'salary', false, 'Salaire mensuel en MAD'),
            ],
        ];

        // ── Meeting ──
        $this->resources['meeting'] = [
            'label' => 'Réunion',
            'tool' => 'create_meeting',
            'summary' => 'Planification d\'une réunion',
            'fields' => [
                new FieldDefinition('title', 'Titre', 'text', true, 'Titre de la réunion', autoGenerate: true, suggestionPrompt: 'Propose 3 titres professionnels pour une réunion basée sur le contexte'),
                new FieldDefinition('description', 'Description', 'textarea', false, 'Objectifs et ordre du jour', autoGenerate: true, suggestionPrompt: 'Génère une description professionnelle avec ordre du jour pour cette réunion'),
                new FieldDefinition('type', 'Type', 'select', true, options: ['Réunion d\'équipe', 'Point hebdomadaire', 'Réunion stratégique', 'Formation', 'Entretien', 'Autre']),
                new FieldDefinition('department_id', 'Département', 'select', false),
                new FieldDefinition('date', 'Date', 'date', true),
                new FieldDefinition('start_time', 'Heure début', 'time', true),
                new FieldDefinition('end_time', 'Heure fin', 'time', true),
                new FieldDefinition('location', 'Lieu', 'text', false, 'Salle ou lien visio'),
                new FieldDefinition('meeting_link', 'Lien visio', 'url', false, 'Lien Google Meet, Zoom, etc.'),
                new FieldDefinition('priority', 'Priorité', 'select', true, options: ['Basse', 'Moyenne', 'Haute', 'Urgente']),
            ],
        ];

        // ── Recruitment (Annonce) ──
        $this->resources['recruitment'] = [
            'label' => 'Annonce de recrutement',
            'tool' => 'create_recruitment',
            'summary' => 'Création d\'une annonce de recrutement',
            'fields' => [
                new FieldDefinition('title', 'Titre du poste', 'text', true, 'Ex: Développeur Full Stack Senior', autoGenerate: true, suggestionPrompt: 'Propose 3 titres professionnels pour une offre d\'emploi basée sur le contexte'),
                new FieldDefinition('department_id', 'Département', 'select', true),
                new FieldDefinition('contract_type', 'Type de contrat', 'select', true, options: ['CDI', 'CDD', 'Stage', 'Alternance', 'Freelance']),
                new FieldDefinition('location', 'Localisation', 'text', true, 'Ville ou remote'),
                new FieldDefinition('work_mode', 'Mode de travail', 'select', true, options: ['Présentiel', 'Remote', 'Hybride']),
                new FieldDefinition('positions_count', 'Nombre de postes', 'number', true, defaultValue: '1'),
                new FieldDefinition('experience_level', 'Expérience requise', 'select', true, options: ['Junior (0-2 ans)', 'Confirmé (3-5 ans)', 'Senior (5+ ans)', 'Expert (8+ ans)']),
                new FieldDefinition('education_level', 'Niveau d\'étude', 'select', false, options: ['Bac+2', 'Bac+3', 'Bac+4', 'Bac+5', 'Doctorat']),
                new FieldDefinition('salary', 'Fourchette salariale', 'text', false, 'Ex: 15000-20000 MAD'),
                new FieldDefinition('description', 'Description', 'textarea', true, 'Description du poste et missions', autoGenerate: true, suggestionPrompt: 'Génère 3 descriptions professionnelles et engageantes pour cette offre d\'emploi'),
                new FieldDefinition('missions', 'Missions', 'textarea', false, 'Liste des missions principales', autoGenerate: true, suggestionPrompt: 'Génère la liste des missions principales pour ce poste'),
                new FieldDefinition('skills', 'Compétences', 'textarea', false, 'Compétences techniques et soft skills', autoGenerate: true, suggestionPrompt: 'Génère la liste des compétences requises pour ce poste'),
                new FieldDefinition('qualifications', 'Qualifications', 'textarea', false, 'Diplômes et certifications'),
                new FieldDefinition('benefits', 'Avantages', 'textarea', false, 'Avantages sociaux', autoGenerate: true, suggestionPrompt: 'Propose une liste d\'avantages sociaux attractifs'),
                new FieldDefinition('deadline', 'Date limite', 'date', false),
            ],
        ];

        // ── Project (Budget) ──
        $this->resources['project'] = [
            'label' => 'Projet budgétaire',
            'tool' => 'create_project',
            'summary' => 'Création d\'un projet budgétaire',
            'fields' => [
                new FieldDefinition('name', 'Nom du projet', 'text', true, autoGenerate: true),
                new FieldDefinition('client', 'Client', 'text', false, 'Nom du client ou interne'),
                new FieldDefinition('description', 'Description', 'textarea', false, autoGenerate: true, suggestionPrompt: 'Génère une description professionnelle pour ce projet'),
                new FieldDefinition('budget', 'Budget', 'budget', true, 'Budget total en MAD'),
                new FieldDefinition('start_date', 'Date de début', 'date', true),
                new FieldDefinition('end_date', 'Date de fin', 'date', false),
                new FieldDefinition('manager', 'Responsable', 'text', false, 'Nom du chef de projet'),
                new FieldDefinition('status', 'Statut', 'select', true, options: ['Planifié', 'En cours', 'En pause', 'Terminé', 'Annulé'], defaultValue: 'Planifié'),
            ],
        ];
    }
}

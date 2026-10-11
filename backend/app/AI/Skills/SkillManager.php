<?php

namespace App\AI\Skills;

use App\AI\Tools\ToolRegistry;

class Skill
{
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly string $description,
        public readonly string $category,
        public readonly array $toolNames,
        public readonly array $requiredRoles = ['super_admin', 'rh'],
        public readonly array $workflows = [],
    ) {}

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'category' => $this->category,
            'tools' => $this->toolNames,
            'required_roles' => $this->requiredRoles,
            'workflows' => array_keys($this->workflows),
        ];
    }
}

class SkillManager
{
    /** @var Skill[] */
    private array $skills = [];

    public function __construct(
        private ToolRegistry $toolRegistry,
    ) {
        $this->registerDefaults();
    }

    public function register(Skill $skill): void
    {
        $this->skills[$skill->id] = $skill;
    }

    public function get(string $id): ?Skill
    {
        return $this->skills[$id] ?? null;
    }

    public function getAll(): array
    {
        return $this->skills;
    }

    /**
     * Find skills that contain a given tool name.
     */
    public function findByTool(string $toolName): array
    {
        return array_filter(
            $this->skills,
            fn(Skill $s) => in_array($toolName, $s->toolNames)
        );
    }

    /**
     * Get tools available for a given role.
     */
    public function getToolsForRole(string $role): array
    {
        $toolNames = [];
        foreach ($this->skills as $skill) {
            if (in_array($role, $skill->requiredRoles)) {
                $toolNames = array_merge($toolNames, $skill->toolNames);
            }
        }
        return array_unique($toolNames);
    }

    /**
     * Format skills as context for the system prompt.
     */
    public function formatForPrompt(string $role): string
    {
        $lines = [];
        foreach ($this->skills as $skill) {
            if (!in_array($role, $skill->requiredRoles)) continue;
            $toolList = implode(', ', $skill->toolNames);
            $lines[] = "- **{$skill->name}**: {$skill->description} [Outils: {$toolList}]";
        }
        return implode("\n", $lines);
    }

    private function registerDefaults(): void
    {
        $this->register(new Skill(
            id: 'hr_management',
            name: 'Gestion des RH',
            description: 'Créer, modifier, supprimer et rechercher des responsables RH',
            category: 'rh_managers',
            toolNames: ['create_rh_manager', 'update_rh_manager', 'delete_rh_manager'],
            requiredRoles: ['super_admin'],
            workflows: [
                'onboard_rh' => [
                    'description' => 'Processus complet d\'intégration d\'un RH',
                    'steps' => [
                        ['tool' => 'create_rh_manager', 'description' => 'Créer le profil RH'],
                        ['tool' => 'send_notification', 'description' => 'Notifier l\'administrateur'],
                    ],
                ],
            ],
        ));

        $this->register(new Skill(
            id: 'department_management',
            name: 'Gestion des Départements',
            description: 'Créer, modifier et supprimer des départements',
            category: 'departments',
            toolNames: ['create_department', 'update_department', 'delete_department', 'get_departments', 'get_department_by_name'],
            requiredRoles: ['super_admin'],
        ));

        $this->register(new Skill(
            id: 'employee_management',
            name: 'Gestion des Employés',
            description: 'Créer, modifier, supprimer et rechercher des employés',
            category: 'employees',
            toolNames: ['create_employee', 'update_employee', 'delete_employee', 'get_employees_count', 'get_employee_by_name', 'search_employees'],
            requiredRoles: ['super_admin', 'rh'],
            workflows: [
                'onboard_employee' => [
                    'description' => 'Processus complet d\'embauche d\'un employé',
                    'steps' => [
                        ['tool' => 'create_employee', 'description' => 'Créer l\'employé (compte + contrat auto-générés)'],
                        ['tool' => 'send_notification', 'description' => 'Envoyer les identifiants'],
                    ],
                ],
            ],
        ));

        $this->register(new Skill(
            id: 'recruitment_management',
            name: 'Gestion du Recrutement',
            description: 'Créer, publier, fermer et gérer les annonces de recrutement',
            category: 'recruitment',
            toolNames: ['create_recruitment', 'update_recruitment', 'publish_recruitment', 'close_recruitment', 'get_recruitment_announcements'],
            requiredRoles: ['super_admin', 'rh'],
            workflows: [
                'publish_job' => [
                    'description' => 'Créer et publier une annonce',
                    'steps' => [
                        ['tool' => 'create_recruitment', 'description' => 'Créer l\'annonce (brouillon)'],
                        ['tool' => 'publish_recruitment', 'description' => 'Publier l\'annonce'],
                    ],
                ],
            ],
        ));

        $this->register(new Skill(
            id: 'meeting_management',
            name: 'Gestion des Réunions',
            description: 'Planifier, modifier et annuler des réunions',
            category: 'meetings',
            toolNames: ['create_meeting', 'update_meeting', 'cancel_meeting', 'get_meetings_today', 'get_upcoming_meetings'],
            requiredRoles: ['super_admin', 'rh'],
        ));

        $this->register(new Skill(
            id: 'finance_management',
            name: 'Gestion Financière',
            description: 'Créer, modifier et supprimer des projets budgétaires',
            category: 'finance',
            toolNames: ['create_project', 'update_project', 'delete_project'],
            requiredRoles: ['super_admin'],
        ));

        $this->register(new Skill(
            id: 'notification_management',
            name: 'Notifications',
            description: 'Envoyer des notifications aux utilisateurs',
            category: 'notifications',
            toolNames: ['send_notification'],
            requiredRoles: ['super_admin', 'rh'],
        ));

        $this->register(new Skill(
            id: 'contract_management',
            name: 'Gestion des Contrats',
            description: 'Consulter les contrats et identifier les expirations',
            category: 'contracts',
            toolNames: ['get_contracts', 'get_expiring_contracts'],
            requiredRoles: ['super_admin', 'rh'],
        ));

        $this->register(new Skill(
            id: 'candidate_management',
            name: 'Gestion des Candidats',
            description: 'Consulter et gérer les candidatures',
            category: 'candidates',
            toolNames: ['get_candidates_count', 'get_candidate_by_name', 'get_candidates_by_status'],
            requiredRoles: ['super_admin', 'rh'],
        ));
    }
}

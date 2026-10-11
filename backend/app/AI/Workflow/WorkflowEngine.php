<?php

namespace App\AI\Workflow;

use App\AI\Tools\ToolRegistry;
use App\AI\Executor\ExecutionResult;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class WorkflowStep
{
    public function __construct(
        public readonly string $toolName,
        public readonly string $description,
        public readonly array $paramMapping = [],
        public readonly bool $required = true,
        public readonly ?string $condition = null,
    ) {}
}

class WorkflowDefinition
{
    public function __construct(
        public readonly string $id,
        public readonly string $name,
        public readonly string $description,
        /** @var WorkflowStep[] */
        public readonly array $steps,
        public readonly array $requiredRoles = ['super_admin'],
    ) {}

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'steps' => count($this->steps),
            'required_roles' => $this->requiredRoles,
        ];
    }
}

class WorkflowEngine
{
    /** @var WorkflowDefinition[] */
    private array $workflows = [];

    public function __construct()
    {
        $this->registerDefaults();
    }

    public function register(WorkflowDefinition $workflow): void
    {
        $this->workflows[$workflow->id] = $workflow;
    }

    public function get(string $id): ?WorkflowDefinition
    {
        return $this->workflows[$id] ?? null;
    }

    public function getAll(): array
    {
        return $this->workflows;
    }

    /**
     * Find workflows by keyword matching.
     */
    public function findMatching(string $message): array
    {
        $lower = mb_strtolower($message);
        $matches = [];

        $keywords = [
            'onboard_employee' => ['embaucher', 'embauche', 'nouvel employé', 'nouveau employé', 'ajouter un employé', 'créer un employé'],
            'onboard_rh' => ['nouveau rh', 'ajouter un rh', 'créer un rh', 'nouveau responsable'],
            'publish_job' => ['publier une annonce', 'publie l\'annonce', 'poster une offre', 'publie le recrutement'],
            'close_job' => ['fermer l\'annonce', 'ferme le recrutement', 'clôturer'],
            'cancel_meeting' => ['annuler la réunion', 'annule la réunion'],
        ];

        foreach ($keywords as $wfId => $terms) {
            foreach ($terms as $term) {
                if (str_contains($lower, $term)) {
                    $wf = $this->get($wfId);
                    if ($wf) {
                        $matches[] = $wf;
                    }
                    break;
                }
            }
        }

        return $matches;
    }

    /**
     * Build tool calls from a workflow definition, mapping parameters.
     */
    public function buildToolCalls(WorkflowDefinition $workflow, array $parameters): array
    {
        $toolCalls = [];
        foreach ($workflow->steps as $step) {
            $args = $parameters;
            // Apply param mapping if specified
            foreach ($step->paramMapping as $from => $to) {
                if (isset($args[$from])) {
                    $args[$to] = $args[$from];
                    unset($args[$from]);
                }
            }
            $toolCalls[] = [
                'id' => 'call_' . bin2hex(random_bytes(8)),
                'name' => $step->toolName,
                'arguments' => $args,
            ];
        }
        return $toolCalls;
    }

    /**
     * Format workflows as context for the system prompt.
     */
    public function formatForPrompt(): string
    {
        $lines = [];
        foreach ($this->workflows as $wf) {
            $stepList = implode(' → ', array_map(fn($s) => $s->description, $wf->steps));
            $lines[] = "- **{$wf->name}**: {$stepList}";
        }
        return implode("\n", $lines);
    }

    private function registerDefaults(): void
    {
        $this->register(new WorkflowDefinition(
            id: 'onboard_employee',
            name: 'Embauche complète',
            description: 'Processus complet d\'intégration d\'un nouvel employé',
            steps: [
                new WorkflowStep('create_employee', 'Créer l\'employé (compte + contrat auto-générés)'),
                new WorkflowStep('send_notification', 'Envoyer les identifiants de connexion'),
            ],
            requiredRoles: ['super_admin', 'rh'],
        ));

        $this->register(new WorkflowDefinition(
            id: 'onboard_rh',
            name: 'Intégration RH',
            description: 'Processus complet d\'intégration d\'un responsable RH',
            steps: [
                new WorkflowStep('create_rh_manager', 'Créer le profil RH (compte + contrat auto-générés)'),
                new WorkflowStep('send_notification', 'Notifier l\'administrateur'),
            ],
            requiredRoles: ['super_admin'],
        ));

        $this->register(new WorkflowDefinition(
            id: 'publish_job',
            name: 'Publication d\'offre',
            description: 'Créer et publier une annonce de recrutement',
            steps: [
                new WorkflowStep('create_recruitment', 'Créer l\'annonce (brouillon)'),
                new WorkflowStep('publish_recruitment', 'Publier l\'annonce'),
            ],
            requiredRoles: ['super_admin', 'rh'],
        ));

        $this->register(new WorkflowDefinition(
            id: 'cancel_meeting',
            name: 'Annulation de réunion',
            description: 'Annuler une réunion planifiée',
            steps: [
                new WorkflowStep('cancel_meeting', 'Annuler la réunion'),
                new WorkflowStep('send_notification', 'Notifier les participants'),
            ],
            requiredRoles: ['super_admin', 'rh'],
        ));
    }
}

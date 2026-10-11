<?php

namespace App\AI\Tools\Recruitment;

use App\AI\Tools\BaseActionTool;

class CreateAnnouncementTool extends BaseActionTool
{
    public function getName(): string
    {
        return 'create_recruitment';
    }

    public function getDescription(): string
    {
        return 'Crée une nouvelle annonce de recrutement (brouillon).';
    }

    public function getParameters(): array
    {
        return [
            'type' => 'object',
            'properties' => [
                'title' => ['type' => 'string', 'description' => 'Titre du poste'],
                'department_id' => ['type' => 'integer', 'description' => 'ID du département'],
                'contract_type' => ['type' => 'string', 'enum' => ['CDI', 'CDD', 'Stage'], 'description' => 'Type contrat'],
                'location' => ['type' => 'string', 'description' => 'Lieu'],
                'work_mode' => ['type' => 'string', 'enum' => ['on_site', 'remote', 'hybrid'], 'description' => 'Mode de travail'],
                'positions_count' => ['type' => 'integer', 'description' => 'Nombre de postes'],
                'experience_level' => ['type' => 'string', 'description' => 'Niveau d\'expérience requis'],
                'education_level' => ['type' => 'string', 'description' => 'Niveau d\'étude requis'],
                'salary' => ['type' => 'number', 'description' => 'Salaire proposé'],
                'deadline' => ['type' => 'string', 'description' => 'Date limite (YYYY-MM-DD)'],
                'description' => ['type' => 'string', 'description' => 'Description du poste'],
                'missions' => ['type' => 'string', 'description' => 'Missions principales'],
                'skills' => ['type' => 'string', 'description' => 'Compétences requises'],
                'qualifications' => ['type' => 'string', 'description' => 'Qualifications'],
                'benefits' => ['type' => 'string', 'description' => 'Avantages'],
            ],
            'required' => ['title', 'department_id', 'contract_type'],
        ];
    }

    protected function doExecute(array $parameters, int $userId, string $role): array
    {
        $this->requireFields($parameters, ['title', 'department_id', 'contract_type']);

        $service = app(\App\Services\RecruitmentService::class);

        $data = array_merge([
            'title' => $parameters['title'],
            'department_id' => $parameters['department_id'],
            'contract_type' => $parameters['contract_type'],
            'status' => 'draft',
        ], array_filter([
            'location' => $parameters['location'] ?? null,
            'work_mode' => $parameters['work_mode'] ?? 'on_site',
            'positions_count' => $parameters['positions_count'] ?? 1,
            'experience_level' => $parameters['experience_level'] ?? null,
            'education_level' => $parameters['education_level'] ?? null,
            'salary' => $parameters['salary'] ?? null,
            'deadline' => $parameters['deadline'] ?? null,
            'description' => $parameters['description'] ?? null,
            'missions' => $parameters['missions'] ?? null,
            'skills' => $parameters['skills'] ?? null,
            'qualifications' => $parameters['qualifications'] ?? null,
            'benefits' => $parameters['benefits'] ?? null,
        ], fn($v) => $v !== null));

        $recruitment = $service->create($data);

        return [
            'success' => true,
            'message' => "Annonce de recrutement '{$recruitment->title}' créée (brouillon).",
            'data' => ['id' => $recruitment->id, 'title' => $recruitment->title, 'status' => $recruitment->status],
        ];
    }

    public function requiresConfirmation(): bool
    {
        return true;
    }

    public function getCategory(): string
    {
        return 'recruitment';
    }
}

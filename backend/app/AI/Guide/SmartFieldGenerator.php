<?php

namespace App\AI\Guide;

use App\Models\Department;
use App\Models\RhManager;

class SmartFieldGenerator
{
    public function generateSuggestions(
        ResourceGuideEngine $engine,
        string $resourceType,
        string $fieldKey,
        array $collected,
    ): array {
        $field = $engine->getField($resourceType, $fieldKey);
        if (!$field) return [];

        $suggestions = match ($resourceType) {
            'department' => $this->departmentSuggestions($fieldKey, $collected),
            'employee' => $this->employeeSuggestions($fieldKey, $collected),
            'rh_manager' => $this->rhManagerSuggestions($fieldKey, $collected),
            'meeting' => $this->meetingSuggestions($fieldKey, $collected),
            'recruitment' => $this->recruitmentSuggestions($fieldKey, $collected),
            'project' => $this->projectSuggestions($fieldKey, $collected),
            default => [],
        };

        return $suggestions;
    }

    public function generateCode(string $name): string
    {
        $words = explode(' ', mb_strtoupper(trim($name)));
        if (count($words) === 1) {
            return mb_substr($words[0], 0, 4);
        }
        $code = '';
        foreach ($words as $word) {
            $code .= mb_substr($word, 0, 1);
        }
        return mb_substr($code, 0, 5);
    }

    // ── Department ──

    private function departmentSuggestions(string $field, array $data): array
    {
        return match ($field) {
            'description' => $this->generateDepartmentDescriptions($data),
            'code' => !empty($data['name']) ? [$this->generateCode($data['name'])] : [],
            default => [],
        };
    }

    private function generateDepartmentDescriptions(array $data): array
    {
        $name = $data['name'] ?? 'ce département';
        $location = $data['location'] ?? '';

        $locationPart = $location ? " basé à {$location}" : '';

        return [
            "Le département {$name}{$locationPart} est responsable de la coordination des activités, du développement des compétences et de l'atteinte des objectifs stratégiques fixés par la direction.",
            "Le département {$name}{$locationPart} assure la gestion opérationnelle au quotidien, accompagne l'évolution des équipes et contribue à l'amélioration continue des processus internes.",
            "Le département {$name}{$locationPart} pilote les projets qui lui sont confiés, collabore avec les autres services et veille au respect des standards de qualité de l'entreprise.",
        ];
    }

    // ── Employee ──

    private function employeeSuggestions(string $field, array $data): array
    {
        return match ($field) {
            'position' => $this->suggestPosition($data),
            default => [],
        };
    }

    private function suggestPosition(array $data): array
    {
        $deptId = $data['department_id'] ?? null;
        if (!$deptId) return [];

        $dept = Department::find($deptId);
        if (!$dept) return [];

        return match (mb_strtolower($dept->name)) {
            default => ["Chef d'équipe", "Chargé de projet", "Analyste", "Coordinateur"],
        };
    }

    // ── RH Manager ──

    private function rhManagerSuggestions(string $field, array $data): array
    {
        return match ($field) {
            'email' => !empty($data['first_name']) && !empty($data['last_name'])
                ? [mb_strtolower($data['first_name'] . '.' . $data['last_name'] . '@company.com')]
                : [],
            default => [],
        };
    }

    // ── Meeting ──

    private function meetingSuggestions(string $field, array $data): array
    {
        return match ($field) {
            'title' => $this->suggestMeetingTitles($data),
            'description' => $this->suggestMeetingDescription($data),
            'location' => ['Salle de réunion A', 'Salle de réunion B', 'Visioconférence'],
            default => [],
        };
    }

    private function suggestMeetingTitles(array $data): array
    {
        $type = $data['type'] ?? 'Réunion';
        return match ($type) {
            'Point hebdomadaire' => ['Point hebdomadaire — Équipe', 'Weekly Sync', 'Revue de sprint hebdomadaire'],
            'Réunion stratégique' => ['Comité stratégique', 'Session de planification stratégique', 'Revue trimestrielle'],
            'Formation' => ['Session de formation', 'Workshop — Compétences', 'Atelier pratique'],
            'Entretien' => ['Entretien individuel', 'Entretien annuel d\'évaluation', 'Entretien de suivi'],
            default => ['Réunion d\'équipe', 'Point de situation', 'Sync meeting'],
        };
    }

    private function suggestMeetingDescription(array $data): array
    {
        $title = $data['title'] ?? 'Réunion';
        return [
            "Ordre du jour :\n1. Accueil et introduction\n2. Revue des actions en cours\n3. Points bloquants\n4. Nouveaux sujets\n5. Actions à venir et conclusion",
            "Objectifs de la réunion « {$title}» :\n- Faire le point sur l'avancement des projets\n- Identifier les points bloquants\n- Définir les prochaines étapes\n- Valider les livrables attendus",
            "Cette réunion vise à coordonner les efforts de l'équipe, aligner les priorités et s'assurer que tous les membres disposent des informations nécessaires pour avancer efficacement.",
        ];
    }

    // ── Recruitment ──

    private function recruitmentSuggestions(string $field, array $data): array
    {
        return match ($field) {
            'title' => $this->suggestJobTitles($data),
            'description' => $this->suggestJobDescriptions($data),
            'missions' => $this->suggestJobMissions($data),
            'skills' => $this->suggestJobSkills($data),
            'benefits' => $this->suggestJobBenefits(),
            default => [],
        };
    }

    private function suggestJobTitles(array $data): array
    {
        return [
            'Développeur Full Stack Senior',
            'Ingénieur DevOps',
            'Chef de projet IT',
            'Data Analyst',
            'Designer UI/UX',
            'Responsable Marketing Digital',
        ];
    }

    private function suggestJobDescriptions(array $data): array
    {
        $title = $data['title'] ?? 'ce poste';
        $type = $data['contract_type'] ?? 'CDI';

        return [
            "Nous recherchons un(e) {$title} en {$type} pour rejoindre notre équipe dynamique. Vous participerez à des projets innovants et contribuerez directement à la croissance de l'entreprise.",
            "Dans le cadre de notre développement, nous ouvrons un poste de {$title} ({$type}). Ce poste offre une opportunité unique de travailler sur des projets à fort impact au sein d'un environnement stimulant.",
            "Rejoignez notre équipe en tant que {$title} ({$type}). Vous aurez l'occasion de mettre à profit votre expertise tout en développant de nouvelles compétences dans un cadre collaboratif et bienveillant.",
        ];
    }

    private function suggestJobMissions(array $data): array
    {
        return [
            "• Participation active aux projets de l'équipe\n• Réalisation des tâches dans les délais impartis\n• Collaboration avec les differentes équipes\n• Amélioration continue des processus\n• Reporting régulier à la hiérarchie",
            "• Conception et développement des solutions techniques\n• Code review et maintenance du code existant\n• Veille technologique et formation continue\n• Documentation technique\n• Support aux autres équipes",
        ];
    }

    private function suggestJobSkills(array $data): array
    {
        return [
            "• Maîtrise des outils et technologies modernes\n• Excellentes capacités de communication\n• Esprit d'équipe et proactivité\n• Rigueur et organisation\n• Capacité d'adaptation",
            "• Expérience préalable dans un poste similaire\n• Compétences analytiques et résolution de problèmes\n• Autonomie et sens des responsabilités\n• Maîtrise du français et de l'anglais",
        ];
    }

    private function suggestJobBenefits(): array
    {
        return [
            "• Mutuelle d'entreprise\n• Tickets restaurant\n• Télétravail partiel\n• Formation continue\n• Évolution de carrière",
            "• Package salarial attractif\n• Prime de performance\n• Congés supplémentaires\n• Ambiance de travail conviviale\n• Projets internationaux",
        ];
    }

    // ── Project ──

    private function projectSuggestions(string $field, array $data): array
    {
        return match ($field) {
            'description' => !empty($data['name'])
                ? [
                    "Ce projet vise à développer et déployer {$data['name']} en respectant les objectifs budgétaires et les délais définis. Il implique une coordination étroite entre les équipes techniques et métier.",
                    "{$data['name']} est un projet stratégique qui contribuera à l'amélioration de la performance globale de l'entreprise à travers l'optimisation des processus et l'innovation.",
                ]
                : [],
            default => [],
        };
    }
}

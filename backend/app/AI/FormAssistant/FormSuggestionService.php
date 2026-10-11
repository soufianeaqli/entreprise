<?php

namespace App\AI\FormAssistant;

use App\AI\Groq\GroqClient;
use Illuminate\Support\Facades\Log;

class FormSuggestionService
{
    private const SYSTEM_PROMPT = <<<'PROMPT'
Tu es un assistant RH expert qui aide à remplir des formulaires administratifs.
Génère des suggestions professionnelles, concises et adaptées au contexte marocain.
Réponds UNIQUEMENT avec un JSON valide contenant un tableau "suggestions".
Chaque suggestion a: "field" (nom du champ), "label" (intitulé lisible), "value" (texte suggéré).
Ne numérote pas. Ne commente pas. JSON uniquement.
PROMPT;

    public function __construct(
        private GroqClient $groq,
    ) {}

    public function generate(string $module, array $context): array
    {
        $prompt = $this->buildPrompt($module, $context);

        $messages = [
            ['role' => 'system', 'content' => self::SYSTEM_PROMPT],
            ['role' => 'user', 'content' => $prompt],
        ];

        try {
            $content = $this->groq->chat($messages);
            return $this->parseResponse($content);
        } catch (\Throwable $e) {
            Log::error('FormSuggestion generation failed', [
                'module' => $module,
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    private function buildPrompt(string $module, array $context): string
    {
        $contextJson = json_encode($context, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $prompts = $this->getModulePrompts();
        $modulePrompt = $prompts[$module] ?? $prompts['default'];
        return "Module: {$module}\n\nDonnées actuelles:\n{$contextJson}\n\n{$modulePrompt}";
    }

    private function getModulePrompts(): array
    {
        return [
            'department' => "L'utilisateur remplit un formulaire de création de département.\n"
                . "Le seul champ texte libre est 'description'.\n"
                . "Génère 3 à 5 suggestions pour le champ 'description' uniquement.\n"
                . "Chaque suggestion doit être une description professionnelle complète (2-4 phrases)\n"
                . "incluant les missions, les objectifs et la vision du département.\n"
                . "Utilise le nom du département et le contexte pour personnaliser.\n"
                . "field doit toujours être 'description'.",

            'rh' => "L'utilisateur remplit un formulaire d'ajout de manager RH.\n"
                . "Les champs texte libres sont: 'observations' et 'benefits'.\n"
                . "Génère 3 à 5 suggestions réparties entre ces champs:\n"
                . "- observations: Description du poste, missions, responsabilités (texte libre)\n"
                . "- benefits: Avantages, compétences techniques, soft skills (texte libre)\n"
                . "Personnalise selon le département et le type de contrat.",

            'recruitment' => "L'utilisateur crée une annonce de recrutement.\n"
                . "Les champs disponibles sont: description, missions, skills, qualifications, benefits, additional_info.\n"
                . "Génère 5 suggestions réparties entre ces champs:\n"
                . "- description: Description détaillée du poste\n"
                . "- missions: Missions principales (3-5 points)\n"
                . "- skills: Compétences techniques et technologiques\n"
                . "- qualifications: Formation et expérience requises\n"
                . "- benefits: Avantages proposés\n"
                . "- additional_info: Informations complémentaires\n"
                . "Adapte le contenu au titre du poste et au département.",

            'meeting' => "L'utilisateur planifie une réunion.\n"
                . "Les champs disponibles sont: description, minutes_summary, minutes_objective, minutes_key_points, minutes_notes.\n"
                . "Génère 5 suggestions réparties entre:\n"
                . "- description: Description de la réunion\n"
                . "- minutes_summary: Résumé de la réunion\n"
                . "- minutes_objective: Objectifs de la réunion\n"
                . "- minutes_key_points: Points clés à aborder\n"
                . "- minutes_notes: Notes supplémentaires\n"
                . "Base-toi sur le titre, le type et le département.",

            'budget' => "L'utilisateur crée un projet budgétaire.\n"
                . "Le seul champ texte libre est 'description'.\n"
                . "Génère 3 à 5 suggestions pour le champ 'description' uniquement.\n"
                . "Chaque suggestion doit être une description complète du projet (2-4 phrases)\n"
                . "incluant les objectifs, la portée et les livrables.\n"
                . "Utilise le nom du projet, le client et le montant pour personnaliser.\n"
                . "field doit toujours être 'description'.",

            'default' => "Génère des suggestions professionnelles pour les champs du formulaire "
                . "en fonction des données déjà fournies.",
        ];
    }

    private function parseResponse(string $content): array
    {
        $content = trim($content);

        $start = strpos($content, '{');
        $end = strrpos($content, '}');
        if ($start !== false && $end !== false) {
            $content = substr($content, $start, $end - $start + 1);
        }

        $decoded = json_decode($content, true);

        if (!is_array($decoded) || !isset($decoded['suggestions'])) {
            Log::warning('FormSuggestion invalid response format', ['content' => substr($content, 0, 200)]);
            return [];
        }

        return $decoded['suggestions'];
    }
}

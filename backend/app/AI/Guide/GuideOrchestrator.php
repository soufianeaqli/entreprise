<?php

namespace App\AI\Guide;

use App\AI\AIResponse;
use App\Models\User;
use Illuminate\Support\Facades\Log;

class GuideOrchestrator
{
    public function __construct(
        private ResourceGuideEngine $engine,
        private ConversationState $state,
        private SmartFieldGenerator $generator,
        private DuplicateChecker $checker,
    ) {}

    /**
     * Start a new creation guide for a resource type.
     */
    public function startGuide(int $userId, string $resourceType, array $initialData = []): AIResponse
    {
        $resource = $this->engine->getResource($resourceType);
        if (!$resource) {
            return AIResponse::text("Type de ressource inconnu : {$resourceType}");
        }

        $state = ConversationState::get($userId);
        $state->startGuide($resourceType);

        // Store any initial data provided by the user
        foreach ($initialData as $key => $value) {
            $field = $this->engine->getField($resourceType, $key);
            if ($field && $value !== null && $value !== '') {
                $state->setCollected($key, $value);
            }
        }

        // Get the first missing field
        $nextField = $this->engine->getNextField($resourceType, $state->collected);

        if (!$nextField) {
            // All fields collected — go to confirmation
            return $this->requestConfirmation($state);
        }

        $state->currentField = $nextField->key;
        $state->save();

        // Generate suggestions for this field
        $suggestions = $this->generator->generateSuggestions($this->engine, $resourceType, $nextField->key, $state->collected);
        if (!empty($suggestions)) {
            $state->setSuggestions($suggestions);
        }

        return $this->buildFieldPrompt($state, $nextField, $resource, $suggestions);
    }

    /**
     * Process a user response during the guide conversation.
     */
    public function processResponse(int $userId, string $userMessage): AIResponse
    {
        $state = ConversationState::get($userId);

        if (!$state->isActive()) {
            return AIResponse::text("Aucun processus de création en cours. Que souhaitez-vous créer ?");
        }

        // Handle confirmation step
        if ($state->status === 'confirming') {
            return $this->handleConfirmation($state, $userMessage);
        }

        // Handle suggestion selection
        if ($state->status === 'selecting_suggestion') {
            return $this->handleSuggestionSelection($state, $userMessage);
        }

        // Handle special commands
        $lower = mb_strtolower(trim($userMessage));
        if (in_array($lower, ['annuler', 'cancel', 'abandonner', 'stop'])) {
            $state->clear();
            return AIResponse::text("Processus de création annulé. Comment puis-je vous aider ?");
        }

        if ($lower === 'résumé' || $lower === 'resume' || $lower === 'récapitulatif') {
            $progress = $this->engine->formatProgress($state->resourceType, $state->collected);
            return AIResponse::text("Voici l'état actuel :\n\n{$progress}\n\nContinuez à remplir les champs manquants.");
        }

        // Handle suggestion request
        if (preg_match('/^(?:suggestion|idee|idée|propos(?:e|er)|g[eé]n[eé]r(?:e|er))$/i', $lower)) {
            return $this->handleSuggestionRequest($state);
        }

        // Handle skip for optional fields
        if (in_array($lower, ['passer', 'skip', 'suivant', 'next', 'non', 'non merci'])) {
            $field = $this->engine->getField($state->resourceType, $state->currentField);
            if ($field && !$field->required) {
                $state->collected[$state->currentField] = null;
                $state->save();
                return $this->moveToNextField($state);
            }
            return AIResponse::text("Ce champ est obligatoire. Veuillez fournir une valeur.");
        }

        // Handle number selection for suggestions
        if (preg_match('/^[0-9]$/', $lower) && !empty($state->suggestions)) {
            $index = (int) $lower - 1;
            if (isset($state->suggestions[$index])) {
                $value = $state->suggestions[$index];
                $field = $this->engine->getField($state->resourceType, $state->currentField);

                // For multi-line suggestions, the user selects the whole text
                if ($field && $field->type === 'textarea') {
                    $state->setCollected($state->currentField, $value);
                    $state->suggestions = [];
                    $state->save();
                    return $this->moveToNextField($state);
                }

                // For text fields, extract the key part
                $state->setCollected($state->currentField, $value);
                $state->suggestions = [];
                $state->save();
                return $this->moveToNextField($state);
            }
        }

        // Validate and store the user's value for the current field
        $field = $this->engine->getField($state->resourceType, $state->currentField);
        if (!$field) {
            return AIResponse::text("Erreur interne. Veuillez réessayer.");
        }

        $validationResult = $this->validateField($field, $userMessage, $state->collected);
        if ($validationResult !== true) {
            return AIResponse::text($validationResult);
        }

        // Store the value
        $normalizedValue = $this->normalizeFieldValue($field, $userMessage);
        $state->setCollected($field->key, $normalizedValue);
        $state->suggestions = [];

        // Check for duplicates with collected data so far
        $warnings = $this->checker->check($state->resourceType, $state->collected);
        if (!empty($warnings)) {
            $warningText = implode("\n", array_map(fn($w) => "⚠️ {$w}", $warnings));
            return AIResponse::text("Valeur enregistrée.\n\n{$warningText}\n\nSouhaitez-vous continuer ou corriger ?");
        }

        return $this->moveToNextField($state);
    }

    private function moveToNextField(ConversationState $state): AIResponse
    {
        $nextField = $this->engine->getNextField($state->resourceType, $state->collected);

        if (!$nextField) {
            return $this->requestConfirmation($state);
        }

        $state->currentField = $nextField->key;
        $state->save();

        $suggestions = $this->generator->generateSuggestions($this->engine, $state->resourceType, $nextField->key, $state->collected);
        if (!empty($suggestions)) {
            $state->setSuggestions($suggestions);
        }

        $resource = $this->engine->getResource($state->resourceType);
        return $this->buildFieldPrompt($state, $nextField, $resource, $suggestions);
    }

    private function buildFieldPrompt(
        ConversationState $state,
        FieldDefinition $field,
        array $resource,
        array $suggestions,
    ): AIResponse {
        $progress = $this->engine->formatProgress($state->resourceType, $state->collected);
        $fieldName = mb_strtolower($field->label);

        $prompt = "### Étape suivante : {$field->label}\n\n";

        if ($field->description) {
            $prompt .= "{$field->description}\n\n";
        }

        if ($field->type === 'select' && !empty($field->options)) {
            $prompt .= "**Options :**\n";
            foreach ($field->options as $i => $opt) {
                $prompt .= ($i + 1) . ". {$opt}\n";
            }
            $prompt .= "\n";
        }

        if (!empty($suggestions)) {
            $prompt .= "**Suggestions :**\n";
            foreach ($suggestions as $i => $s) {
                $preview = mb_strimwidth(str_replace("\n", ' ', $s), 0, 80, '...');
                $prompt .= ($i + 1) . ". {$preview}\n";
            }
            $prompt .= "\nTapez un numéro pour sélectionner une suggestion, ou entrez votre propre valeur.\n";
        }

        if (!$field->required) {
            $prompt .= "_Ce champ est optionnel. Tapez « passer» pour ignorer._\n";
        }

        $prompt .= "\n{$progress}";

        $responseType = !empty($suggestions) ? 'suggestions' : 'field_prompt';

        return new AIResponse(
            content: $prompt,
            type: 'guide',
            requiresConfirmation: false,
            guideState: [
                'status' => 'collecting',
                'resource_type' => $state->resourceType,
                'current_field' => $field->key,
                'field_label' => $field->label,
                'field_type' => $field->type,
                'field_required' => $field->required,
                'progress' => $state->step,
                'total_fields' => count($this->engine->getFields($state->resourceType)),
                'collected' => $state->collected,
                'suggestions' => $suggestions,
                'response_type' => $responseType,
                'resource_label' => $resource['label'],
            ],
        );
    }

    private function requestConfirmation(ConversationState $state): AIResponse
    {
        $summary = $this->engine->formatSummary($state->resourceType, $state->collected);
        $state->requestConfirmation($summary);

        $resource = $this->engine->getResource($state->resourceType);

        return new AIResponse(
            content: $summary,
            type: 'guide',
            requiresConfirmation: true,
            confirmationMessage: "Confirmez-vous la création de {$resource['label']} ?",
            guideState: [
                'status' => 'confirming',
                'resource_type' => $state->resourceType,
                'resource_label' => $resource['label'],
                'tool' => $resource['tool'],
                'collected' => $state->collected,
                'summary' => $summary,
            ],
        );
    }

    private function handleConfirmation(ConversationState $state, string $userMessage): AIResponse
    {
        $lower = mb_strtolower(trim($userMessage));

        if (in_array($lower, ['oui', 'yes', 'confirmer', 'confirm', 'valider', 'ok', "c'est bon", 'go'])) {
            $resource = $this->engine->getResource($state->resourceType);

            $result = [
                'action' => 'execute_tool',
                'tool' => $resource['tool'],
                'parameters' => $state->collected,
                'resource_type' => $state->resourceType,
                'resource_label' => $resource['label'],
            ];

            $state->markCompleted();
            $state->save();

            return new AIResponse(
                content: "Exécution de la création en cours...",
                type: 'guide',
                requiresConfirmation: false,
                guideState: [
                    'status' => 'executing',
                    'action' => 'execute_tool',
                    'tool' => $resource['tool'],
                    'parameters' => $state->collected,
                    'resource_type' => $state->resourceType,
                    'resource_label' => $resource['label'],
                ],
            );
        }

        if (in_array($lower, ['non', 'no', 'annuler', 'cancel', 'modifier'])) {
            $state->status = 'collecting';
            $nextField = $this->engine->getNextField($state->resourceType, $state->collected);
            if ($nextField) {
                $state->currentField = $nextField->key;
                $state->save();
                $resource = $this->engine->getResource($state->resourceType);
                $suggestions = $this->generator->generateSuggestions($this->engine, $state->resourceType, $nextField->key, $state->collected);
                return $this->buildFieldPrompt($state, $nextField, $resource, $suggestions);
            }
            $state->save();
            return AIResponse::text("Que souhaitez-vous modifier ? Donnez-moi le nom du champ.");
        }

        // Try to interpret as a field modification
        return AIResponse::text("Veuillez répondre par « oui» pour confirmer ou « non» pour modifier.");
    }

    private function handleSuggestionRequest(ConversationState $state): AIResponse
    {
        $field = $this->engine->getField($state->resourceType, $state->currentField);
        if (!$field) {
            return AIResponse::text("Erreur interne.");
        }

        $suggestions = $this->generator->generateSuggestions($this->engine, $state->resourceType, $field->key, $state->collected);

        if (empty($suggestions)) {
            return AIResponse::text("Je ne peux pas générer de suggestions pour ce champ. Veuillez saisir une valeur.");
        }

        $state->setSuggestions($suggestions);

        $prompt = "Voici mes suggestions pour « {$field->label}» :\n\n";
        foreach ($suggestions as $i => $s) {
            $preview = str_replace("\n", "\n> ", $s);
            $prompt .= "**{$i}.**\n> {$preview}\n\n";
        }
        $prompt .= "Tapez un numéro (1-" . count($suggestions) . ") pour sélectionner, ou entrez votre propre valeur.";

        return AIResponse::text($prompt);
    }

    private function handleSuggestionSelection(ConversationState $state, string $userMessage): AIResponse
    {
        return $this->processResponse($state->userId, $userMessage);
    }

    private function validateField(FieldDefinition $field, string $value, array $collected): true|string
    {
        $trimmed = trim($value);

        if ($field->required && empty($trimmed)) {
            return "Le champ « {$field->label}» est obligatoire. Veuillez fournir une valeur.";
        }

        if (!empty($trimmed) && $field->validationPattern) {
            if (!preg_match($field->validationPattern, $trimmed)) {
                return $field->validationMessage ?? "Le format du champ « {$field->label}» est invalide.";
            }
        }

        if ($field->type === 'email' && !empty($trimmed)) {
            if (!filter_var($trimmed, FILTER_VALIDATE_EMAIL)) {
                return "L'adresse email n'est pas valide.";
            }
        }

        if ($field->type === 'budget' || $field->type === 'salary') {
            $cleaned = str_replace([' ', ',', 'MAD', 'mad'], '', $trimmed);
            if (!is_numeric($cleaned) && !empty($trimmed)) {
                return "Veuillez entrer un montant numérique valide.";
            }
        }

        if ($field->type === 'date' && !empty($trimmed)) {
            $parsed = strtotime($trimmed);
            if ($parsed === false) {
                return "La date n'est pas au format attendu (JJ/MM/AAAA).";
            }
        }

        return true;
    }

    private function normalizeFieldValue(FieldDefinition $field, string $value): string
    {
        $trimmed = trim($value);

        if ($field->type === 'budget' || $field->type === 'salary') {
            $cleaned = str_replace([' ', ',', 'MAD', 'mad'], '', $trimmed);
            return (string) (float) $cleaned;
        }

        return $trimmed;
    }
}

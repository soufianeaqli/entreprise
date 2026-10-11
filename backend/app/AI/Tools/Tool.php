<?php

namespace App\AI\Tools;

interface Tool
{
    /**
     * Nom unique de l'outil
     */
    public function getName(): string;

    /**
     * Description de l'outil pour l'IA
     */
    public function getDescription(): string;

    /**
     * Paramètres acceptés par l'outil (format JSON Schema-like)
     */
    public function getParameters(): array;

    /**
     * Exécuter l'outil avec les paramètres fournis
     */
    public function execute(array $parameters, int $userId, string $role): mixed;

    /**
     * Indique si l'outil nécessite une confirmation avant exécution
     */
    public function requiresConfirmation(): bool;

    /**
     * Catégorie de l'outil pour le regroupement
     */
    public function getCategory(): string;
}

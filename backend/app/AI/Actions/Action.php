<?php

namespace App\AI\Actions;

interface Action
{
    /**
     * Nom unique de l'action
     */
    public function getName(): string;

    /**
     * Description de l'action pour l'IA
     */
    public function getDescription(): string;

    /**
     * Paramètres requis pour l'action
     */
    public function getParameters(): array;

    /**
     * Exécuter l'action
     */
    public function execute(array $parameters, int $userId, string $role): ActionResult;

    /**
     * Vérifier si l'utilisateur a les permissions pour cette action
     */
    public function authorize(int $userId, string $role): bool;

    /**
     * Indique si cette action est sensible (nécessite confirmation)
     */
    public function isSensitive(): bool;

    /**
     * Message de confirmation à afficher à l'utilisateur
     */
    public function getConfirmationMessage(array $parameters): string;
}

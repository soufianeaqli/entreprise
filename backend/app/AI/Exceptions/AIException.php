<?php

namespace App\AI\Exceptions;

use RuntimeException;

class AIException extends RuntimeException
{
    public static function apiKeyInvalid(): self
    {
        return new self('La clé API est invalide. Veuillez vérifier la configuration.', 422);
    }

    public static function quotaExceeded(): self
    {
        return new self('Le quota API est dépassé. Veuillez réessayer plus tard ou contacter l\'administrateur.', 429);
    }

    public static function networkError(string $detail = ''): self
    {
        $message = 'Erreur de connexion au service IA.';
        if ($detail) {
            $message .= ' ' . $detail;
        }
        return new self($message, 503);
    }

    public static function timeout(): self
    {
        return new self('La requête a pris trop de temps. Veuillez réessayer avec un message plus court.', 504);
    }

    public static function serverError(int $code = 500): self
    {
        return new self("Erreur du service IA (code: {$code}). Veuillez réessayer.", 500);
    }

    public static function configurationMissing(): self
    {
        return new self('La configuration de l\'assistant IA est manquante. Contactez l\'administrateur.', 500);
    }

    public static function messageTooLong(int $max): self
    {
        return new self("Le message dépasse la limite de {$max} caractères.", 422);
    }

    public static function planNotFound(): self
    {
        return new self("Le plan a expiré ou est introuvable. Veuillez retaper votre demande.", 404);
    }

    public static function permissionDenied(string $detail = ''): self
    {
        $message = "Vous n'avez pas les permissions nécessaires pour effectuer cette action.";
        if ($detail) {
            $message = $detail;
        }
        return new self($message, 403);
    }

    public static function missingParameters(array $missing): self
    {
        $list = implode(', ', $missing);
        return new self("Informations manquantes : {$list}. Veuillez fournir ces informations.", 422);
    }

    public static function rateLimited(): self
    {
        return new self("Le service IA est temporairement surchargé. Veuillez réessayer dans quelques secondes.", 429);
    }
}

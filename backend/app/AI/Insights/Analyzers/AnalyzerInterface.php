<?php

namespace App\AI\Insights\Analyzers;

use App\AI\Insights\Insight;

interface AnalyzerInterface
{
    /**
     * Nom unique de l'analyseur.
     */
    public function getName(): string;

    /**
     * Analyse les données et retourne les insights détectés.
     *
     * @return Insight[]
     */
    public function analyze(): array;
}

<?php

namespace App\AI\Insights;

use App\AI\Insights\Enums\InsightCategory;
use App\AI\Insights\Enums\InsightSeverity;

class Insight
{
    /**
     * @param array<string, mixed> $actions  Actions proposées [{label, route, method, params}]
     * @param array<string, mixed> $metadata Données contextuelles supplémentaires
     */
    public function __construct(
        public readonly string $rule,
        public readonly string $title,
        public readonly string $description,
        public readonly InsightSeverity $severity,
        public readonly InsightCategory $category,
        public readonly array $actions = [],
        public readonly array $metadata = [],
    ) {}

    public function toArray(): array
    {
        return [
            'rule' => $this->rule,
            'title' => $this->title,
            'description' => $this->description,
            'severity' => $this->severity->value,
            'category' => $this->category->value,
            'actions' => $this->actions,
            'metadata' => $this->metadata,
        ];
    }
}

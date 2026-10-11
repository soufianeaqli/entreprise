<?php

namespace App\AI\Insights\Enums;

enum InsightSeverity: string
{
    case Critical = 'critical';
    case Warning = 'warning';
    case Info = 'info';
    case Success = 'success';

    public function label(): string
    {
        return match ($this) {
            self::Critical => 'Critique',
            self::Warning => 'Attention',
            self::Info => 'Information',
            self::Success => 'Succès',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Critical => 'red',
            self::Warning => 'amber',
            self::Info => 'blue',
            self::Success => 'green',
        };
    }

    public function priority(): int
    {
        return match ($this) {
            self::Critical => 1,
            self::Warning => 2,
            self::Info => 3,
            self::Success => 4,
        };
    }
}

<?php

namespace App\AI\Insights\Enums;

enum InsightStatus: string
{
    case New = 'new';
    case Acknowledged = 'acknowledged';
    case Dismissed = 'dismissed';

    public function label(): string
    {
        return match ($this) {
            self::New => 'Nouvelle',
            self::Acknowledged => 'Traitée',
            self::Dismissed => 'Ignorée',
        };
    }
}

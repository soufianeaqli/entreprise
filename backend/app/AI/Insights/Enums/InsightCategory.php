<?php

namespace App\AI\Insights\Enums;

enum InsightCategory: string
{
    case Contract = 'contract';
    case Recruitment = 'recruitment';
    case Employee = 'employee';
    case Rh = 'rh';
    case Meeting = 'meeting';
    case Budget = 'budget';

    public function label(): string
    {
        return match ($this) {
            self::Contract => 'Contrats',
            self::Recruitment => 'Recrutement',
            self::Employee => 'Employés',
            self::Rh => 'Ressources Humaines',
            self::Meeting => 'Réunions',
            self::Budget => 'Budget',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::Contract => 'FileText',
            self::Recruitment => 'Briefcase',
            self::Employee => 'Users',
            self::Rh => 'UserCheck',
            self::Meeting => 'Calendar',
            self::Budget => 'DollarSign',
        };
    }
}

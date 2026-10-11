<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AnalyticsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'kpis' => $this->resource['kpis'] ?? [],
            'financial' => $this->resource['financial'] ?? [],
            'revenue_vs_expenses' => $this->resource['revenue_vs_expenses'] ?? [],
            'employee_growth' => $this->resource['employee_growth'] ?? [],
            'recruitment_trend' => $this->resource['recruitment_trend'] ?? [],
            'department_distribution' => $this->resource['department_distribution'] ?? [],
            'contracts_status' => $this->resource['contracts_status'] ?? [],
            'monthly_growth' => $this->resource['monthly_growth'] ?? [],
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        $totalIncomes = (float) $this->incomes()->sum('amount');
        $totalExpenses = (float) $this->expenses()->sum('amount');
        $result = $totalIncomes - $totalExpenses;
        $remaining = (float) $this->budget - $totalIncomes;
        $profitability = $totalIncomes > 0 ? round(($result / $totalIncomes) * 100, 1) : 0;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'client' => $this->client,
            'description' => $this->description,
            'budget' => (float) $this->budget,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'manager' => $this->manager,
            'status' => $this->status,
            'total_incomes' => $totalIncomes,
            'total_expenses' => $totalExpenses,
            'result' => $result,
            'remaining_budget' => $remaining,
            'profitability_rate' => $profitability,
            'incomes_count' => $this->incomes()->count(),
            'expenses_count' => $this->expenses()->count(),
            'incomes' => ProjectIncomeResource::collection($this->whenLoaded('incomes')),
            'expenses' => ProjectExpenseResource::collection($this->whenLoaded('expenses')),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

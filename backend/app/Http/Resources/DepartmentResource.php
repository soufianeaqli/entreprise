<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DepartmentResource extends JsonResource
{
    public static $wrap = null;

    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'description' => $this->description,
            'location' => $this->location,
            'annual_budget' => $this->annual_budget,
            'employees_count' => $this->employees_count,
            'status' => $this->status,
            'rh_manager' => $this->whenLoaded('rhManager', fn() => [
                'id' => $this->rhManager->id,
                'matricule' => $this->rhManager->matricule,
                'full_name' => $this->rhManager->full_name,
                'email' => $this->rhManager->email,
                'photo' => $this->rhManager->photo,
            ]),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}

<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'categories' => $this->resource['categories'] ?? null,
            'title' => $this->resource['title'] ?? null,
            'summary' => $this->resource['summary'] ?? null,
            'columns' => $this->resource['columns'] ?? null,
            'rows' => $this->resource['rows'] ?? [],
        ];
    }
}

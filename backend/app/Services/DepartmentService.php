<?php

namespace App\Services;

use App\Models\Department;

class DepartmentService
{
    public function getAll()
    {
        return Department::with('rhManager')->latest()->get();
    }

    public function getById(int $id)
    {
        return Department::with('rhManager')->findOrFail($id);
    }

    public function create(array $data): Department
    {
        return Department::create($data);
    }

    public function update(Department $department, array $data): Department
    {
        $department->update($data);
        return $department->fresh('rhManager');
    }

    public function delete(Department $department): void
    {
        $department->delete();
    }

    public function getAvailable(): \Illuminate\Support\Collection
    {
        $assignedIds = Department::pluck('rh_manager_id')->filter()->values();
        return \App\Models\RhManager::whereNotIn('id', $assignedIds)->get();
    }
}

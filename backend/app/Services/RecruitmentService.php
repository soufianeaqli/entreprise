<?php

namespace App\Services;

use App\Models\Recruitment;
use App\Models\Department;
use App\Models\RhManager;

class RecruitmentService
{
    public function getAll()
    {
        return Recruitment::with(['department', 'rhManager'])->latest()->get();
    }

    public function getById(int $id): Recruitment
    {
        return Recruitment::with(['department', 'rhManager'])->findOrFail($id);
    }

    public function create(array $data): Recruitment
    {
        if (empty($data['rh_manager_id']) && !empty($data['department_id'])) {
            $dept = Department::find($data['department_id']);
            if ($dept && $dept->rh_manager_id) {
                $data['rh_manager_id'] = $dept->rh_manager_id;
            }
        }

        if (empty($data['posted_date'])) {
            $data['posted_date'] = now()->toDateString();
        }

        $data['status'] = $data['status'] ?? 'published';

        $recruitment = Recruitment::create($data);
        return $recruitment->fresh(['department', 'rhManager']);
    }

    public function update(Recruitment $recruitment, array $data): Recruitment
    {
        if (isset($data['department_id']) && empty($data['rh_manager_id'])) {
            $dept = Department::find($data['department_id']);
            if ($dept && $dept->rh_manager_id) {
                $data['rh_manager_id'] = $dept->rh_manager_id;
            }
        }

        $recruitment->update($data);
        return $recruitment->fresh(['department', 'rhManager']);
    }

    public function delete(Recruitment $recruitment): void
    {
        $recruitment->delete();
    }

    public function updateStatus(Recruitment $recruitment, string $status): Recruitment
    {
        $recruitment->update(['status' => $status]);
        return $recruitment->fresh(['department', 'rhManager']);
    }

    public function getStats(): array
    {
        return [
            'total' => Recruitment::count(),
            'published' => Recruitment::where('status', 'published')->count(),
            'draft' => Recruitment::where('status', 'draft')->count(),
            'closed' => Recruitment::where('status', 'closed')->count(),
            'archived' => Recruitment::where('status', 'archived')->count(),
            'total_applications' => Recruitment::sum('applications_count'),
        ];
    }
}

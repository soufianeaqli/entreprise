<?php

namespace App\Services;

use App\Models\Candidate;
use App\Models\Recruitment;
use Illuminate\Database\Eloquent\Collection;

class CandidateService
{
    public function getAnnouncementsByDepartment(int $departmentId): Collection
    {
        return Recruitment::withCount(['candidates as pending_candidates_count' => function ($q) {
            $q->whereNotIn('status', ['accepted', 'rejected']);
        }])
            ->withCount('candidates as total_candidates_count')
            ->where('department_id', $departmentId)
            ->where('status', 'published')
            ->latest()
            ->get();
    }

    public function getAnnouncementById(int $id, int $departmentId): Recruitment
    {
        return Recruitment::withCount(['candidates as pending_candidates_count' => function ($q) {
            $q->whereNotIn('status', ['accepted', 'rejected']);
        }])
            ->withCount('candidates as total_candidates_count')
            ->where('id', $id)
            ->where('department_id', $departmentId)
            ->firstOrFail();
    }

    public function getCandidatesByRecruitment(int $recruitmentId, int $departmentId, ?string $status = null): Collection
    {
        $query = Candidate::with('recruitment')
            ->where('recruitment_id', $recruitmentId);

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        return $query->latest()->get();
    }

    public function getCandidateById(int $id, int $departmentId): Candidate
    {
        return Candidate::with(['recruitment', 'department'])
            ->where('id', $id)
            ->firstOrFail();
    }

    public function updateStatus(Candidate $candidate, string $status, ?array $extra = []): Candidate
    {
        $data = ['status' => $status];

        if (isset($extra['notes'])) {
            $data['notes'] = $extra['notes'];
        }
        if (isset($extra['interview_date'])) {
            $data['interview_date'] = $extra['interview_date'];
        }
        if (isset($extra['interview_time'])) {
            $data['interview_time'] = $extra['interview_time'];
        }
        if (isset($extra['interview_notes'])) {
            $data['interview_notes'] = $extra['interview_notes'];
        }

        $candidate->update($data);
        return $candidate->fresh(['recruitment', 'department']);
    }

    public function getStats(int $departmentId): array
    {
        $query = Candidate::where('department_id', $departmentId);

        return [
            'total' => (clone $query)->count(),
            'new' => (clone $query)->where('status', 'new')->count(),
            'cv_review' => (clone $query)->where('status', 'cv_review')->count(),
            'interview_scheduled' => (clone $query)->where('status', 'interview_scheduled')->count(),
            'technical_test' => (clone $query)->where('status', 'technical_test')->count(),
            'final_interview' => (clone $query)->where('status', 'final_interview')->count(),
            'accepted' => (clone $query)->where('status', 'accepted')->count(),
            'rejected' => (clone $query)->where('status', 'rejected')->count(),
        ];
    }
}

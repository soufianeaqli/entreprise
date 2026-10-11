<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\CandidateResource;
use App\Models\Candidate;
use App\Models\Employee;
use App\Services\CandidateService;
use App\Services\EmployeeService;
use App\Services\NotificationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CandidateController extends Controller
{
    public function __construct(
        private CandidateService $candidateService,
        private NotificationService $notificationService,
        private EmployeeService $employeeService
    ) {}

    public function announcements(Request $request): JsonResponse
    {
        $departmentId = $request->get('rh_department_id');
        $announcements = $this->candidateService->getAnnouncementsByDepartment($departmentId);
        return response()->json($announcements);
    }

    public function announcementShow(Request $request, int $id): JsonResponse
    {
        $departmentId = $request->get('rh_department_id');
        $announcement = $this->candidateService->getAnnouncementById($id, $departmentId);
        return response()->json($announcement);
    }

    public function candidates(Request $request, int $recruitmentId): JsonResponse
    {
        $departmentId = $request->get('rh_department_id');
        $status = $request->get('status');
        $candidates = $this->candidateService->getCandidatesByRecruitment($recruitmentId, $departmentId, $status);
        return response()->json(CandidateResource::collection($candidates));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $departmentId = $request->get('rh_department_id');
        $candidate = $this->candidateService->getCandidateById($id, $departmentId);
        return response()->json(new CandidateResource($candidate));
    }

    public function fullProfile(Request $request, int $id): JsonResponse
    {
        $departmentId = $request->get('rh_department_id');
        $candidate = $this->candidateService->getCandidateById($id, $departmentId);

        $profile = null;
        $documents = [];

        if ($candidate->user_id) {
            $profile = $candidate->user?->candidateProfile;
            $documents = $candidate->user?->candidateDocuments?->map(fn($doc) => [
                'id' => $doc->id,
                'category' => $doc->category,
                'category_label' => $doc->category_label,
                'title' => $doc->title,
                'file_name' => $doc->file_name,
                'file_path' => $doc->file_path,
                'file_type' => $doc->file_type,
                'file_size' => $doc->file_size,
                'file_size_formatted' => $doc->file_size_formatted,
                'url' => Storage::disk('public')->url($doc->file_path),
                'created_at' => $doc->created_at,
            ]) ?? [];
        }

        return response()->json([
            'candidate' => new CandidateResource($candidate),
            'profile' => $profile ? [
                'first_name' => $profile->first_name,
                'last_name' => $profile->last_name,
                'phone' => $profile->phone,
                'birth_date' => $profile->birth_date,
                'address' => $profile->address,
                'city' => $profile->city,
                'education_level' => $profile->education_level,
                'experience_level' => $profile->experience_level,
                'skills' => $profile->skills,
                'languages' => $profile->languages,
                'linkedin' => $profile->linkedin,
                'github' => $profile->github,
                'portfolio' => $profile->portfolio,
            ] : null,
            'documents' => $documents,
        ]);
    }

    public function updateStatus(Request $request, Candidate $candidate): JsonResponse
    {
        $data = $request->validate([
            'status' => 'required|in:new,cv_review,interview_scheduled,technical_test,final_interview,accepted,rejected',
            'notes' => 'nullable|string|max:2000',
            'interview_date' => 'nullable|date',
            'interview_time' => 'nullable|string|max:20',
            'interview_notes' => 'nullable|string|max:1000',
        ]);

        $status = $data['status'];
        $extra = collect($data)->except('status')->toArray();

        $candidate = $this->candidateService->updateStatus($candidate, $status, $extra);

        if ($status === 'accepted' && !Employee::where('email', $candidate->email)->exists()) {
            $this->employeeService->create([
                'first_name' => $candidate->first_name,
                'last_name' => $candidate->last_name,
                'gender' => $candidate->gender,
                'birth_date' => $candidate->birth_date,
                'cin' => $candidate->cin,
                'phone' => $candidate->phone,
                'email' => $candidate->email,
                'address' => $candidate->address,
                'photo' => $candidate->photo,
                'department_id' => $candidate->department_id,
                'position' => $candidate->recruitment?->title,
                'hire_date' => Carbon::today()->toDateString(),
                'contract_type' => $candidate->recruitment?->contract_type,
                'status' => true,
            ], $candidate->department_id);
        }

        if ($candidate->user_id) {
            $statusMessages = [
                'cv_review' => ['title' => 'CV en cours d\'analyse', 'message' => 'Votre candidature pour "' . $candidate->recruitment->title . '" est en cours d\'analyse.', 'type' => 'info'],
                'interview_scheduled' => ['title' => 'Entretien programmé', 'message' => 'Un entretien a été programmé pour votre candidature à "' . $candidate->recruitment->title . '".', 'type' => 'success'],
                'technical_test' => ['title' => 'Test technique', 'message' => 'Un test technique a été planifié pour votre candidature à "' . $candidate->recruitment->title . '".', 'type' => 'info'],
                'final_interview' => ['title' => 'Entretien final', 'message' => 'Un entretien final a été planifié pour votre candidature à "' . $candidate->recruitment->title . '".', 'type' => 'info'],
                'accepted' => ['title' => 'Candidature acceptée', 'message' => 'Félicitations ! Votre candidature pour "' . $candidate->recruitment->title . '" a été acceptée.', 'type' => 'success'],
                'rejected' => ['title' => 'Candidature refusée', 'message' => 'Votre candidature pour "' . $candidate->recruitment->title . '" n\'a pas été retenue.', 'type' => 'error'],
            ];

            if (isset($statusMessages[$status])) {
                $msg = $statusMessages[$status];
                $this->notificationService->createForCandidate(
                    $candidate->user_id,
                    $msg['title'],
                    $msg['message'],
                    $msg['type'],
                    '/candidate/applications'
                );
            }
        }

        return response()->json(new CandidateResource($candidate));
    }

    public function stats(Request $request): JsonResponse
    {
        $departmentId = $request->get('rh_department_id');
        return response()->json($this->candidateService->getStats($departmentId));
    }
}

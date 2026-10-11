<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Candidate;
use App\Models\CandidateDocument;
use App\Models\CandidateProfile;
use App\Models\CandidateApplication;
use App\Models\Recruitment;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class CandidatePortalController extends Controller
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    public function profile(Request $request): JsonResponse
    {
        $profile = $request->user()->candidateProfile;

        if (!$profile) {
            return response()->json(null);
        }

        return response()->json([
            'id' => $profile->id,
            'first_name' => $profile->first_name,
            'last_name' => $profile->last_name,
            'phone' => $profile->phone,
            'birth_date' => $profile->birth_date?->format('Y-m-d'),
            'address' => $profile->address,
            'city' => $profile->city,
            'education_level' => $profile->education_level,
            'experience_level' => $profile->experience_level,
            'skills' => $profile->skills,
            'languages' => $profile->languages,
            'linkedin' => $profile->linkedin,
            'github' => $profile->github,
            'portfolio' => $profile->portfolio,
            'photo' => $profile->photo,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'birth_date' => 'nullable|date',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:255',
            'education_level' => 'nullable|string|max:255',
            'experience_level' => 'nullable|string|max:255',
            'skills' => 'nullable|string',
            'languages' => 'nullable|string|max:255',
            'linkedin' => 'nullable|string|max:255',
            'github' => 'nullable|string|max:255',
            'portfolio' => 'nullable|string|max:255',
        ]);

        $profile = $request->user()->candidateProfile()->updateOrCreate(
            ['user_id' => $request->user()->id],
            $validated
        );

        return response()->json([
            'id' => $profile->id,
            'first_name' => $profile->first_name,
            'last_name' => $profile->last_name,
            'phone' => $profile->phone,
            'birth_date' => $profile->birth_date?->format('Y-m-d'),
            'address' => $profile->address,
            'city' => $profile->city,
            'education_level' => $profile->education_level,
            'experience_level' => $profile->experience_level,
            'skills' => $profile->skills,
            'languages' => $profile->languages,
            'linkedin' => $profile->linkedin,
            'github' => $profile->github,
            'portfolio' => $profile->portfolio,
            'photo' => $profile->photo,
        ]);
    }

    public function documents(Request $request): JsonResponse
    {
        $documents = CandidateDocument::where('user_id', $request->user()->id)->get();

        $result = $documents->map(fn($doc) => [
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
        ]);

        return response()->json($result);
    }

    public function uploadDocument(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'category' => 'required|in:cv,cover_letter',
            'title' => 'nullable|string|max:255',
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        $userId = $request->user()->id;

        CandidateDocument::where('user_id', $userId)
            ->where('category', $validated['category'])
            ->delete();

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $filePath = $file->store("candidate-documents/{$userId}", 'public');

        $categoryLabel = $validated['category'] === 'cv' ? 'CV' : 'Lettre de motivation';
        $title = $validated['title'] ?? $categoryLabel;

        $document = CandidateDocument::create([
            'user_id' => $userId,
            'category' => $validated['category'],
            'title' => $title,
            'file_name' => $fileName,
            'file_path' => $filePath,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);

        return response()->json([
            'id' => $document->id,
            'category' => $document->category,
            'category_label' => $document->category_label,
            'title' => $document->title,
            'file_name' => $document->file_name,
            'file_path' => $document->file_path,
            'file_type' => $document->file_type,
            'file_size' => $document->file_size,
            'file_size_formatted' => $document->file_size_formatted,
            'url' => Storage::disk('public')->url($document->file_path),
            'created_at' => $document->created_at,
        ], 201);
    }

    public function replaceDocument(Request $request, CandidateDocument $document): JsonResponse
    {
        if ($document->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        $request->validate([
            'file' => 'required|file|mimes:pdf,jpg,jpeg,png|max:10240',
        ]);

        if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $file = $request->file('file');
        $fileName = $file->getClientOriginalName();
        $filePath = $file->store("candidate-documents/{$document->user_id}", 'public');

        $document->update([
            'file_name' => $fileName,
            'file_path' => $filePath,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);

        return response()->json([
            'id' => $document->id,
            'category' => $document->category,
            'category_label' => $document->category_label,
            'title' => $document->title,
            'file_name' => $document->file_name,
            'file_path' => $document->file_path,
            'file_type' => $document->file_type,
            'file_size' => $document->file_size,
            'file_size_formatted' => $document->file_size_formatted,
            'url' => Storage::disk('public')->url($document->file_path),
            'created_at' => $document->created_at,
        ]);
    }

    public function downloadDocument(Request $request, $document): JsonResponse|\Symfony\Component\HttpFoundation\StreamedResponse
    {
        $doc = CandidateDocument::findOrFail($document);

        if ($doc->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if (!$doc->file_path || !Storage::disk('public')->exists($doc->file_path)) {
            return response()->json(['message' => 'Fichier introuvable.'], 404);
        }

        $diskPath = Storage::disk('public')->path($doc->file_path);

        return response()->streamDownload(function () use ($diskPath) {
            readfile($diskPath);
        }, $doc->file_name, [
            'Content-Type' => Storage::disk('public')->mimeType($doc->file_path),
            'Content-Disposition' => 'inline; filename="' . $doc->file_name . '"',
        ]);
    }

    public function deleteDocument(Request $request, $document): JsonResponse
    {
        $doc = CandidateDocument::findOrFail($document);

        if ($doc->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Non autorisé.'], 403);
        }

        if ($doc->file_path && Storage::disk('public')->exists($doc->file_path)) {
            Storage::disk('public')->delete($doc->file_path);
        }

        $doc->delete();

        return response()->json(null, 204);
    }

    public function announcements(Request $request): JsonResponse
    {
        $query = Recruitment::where('status', 'published')
            ->with('department')
            ->latest();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhere('location', 'like', "%{$search}%");
            });
        }

        if ($department = $request->input('department')) {
            $query->whereHas('department', fn($q) => $q->where('name', $department));
        }

        if ($contractType = $request->input('contract_type')) {
            $query->where('contract_type', $contractType);
        }

        if ($location = $request->input('location')) {
            $query->where('location', 'like', "%{$location}%");
        }

        $sort = $request->input('sort', 'latest');
        match ($sort) {
            'oldest' => $query->oldest(),
            'deadline' => $query->orderBy('deadline'),
            default => $query->latest(),
        };

        $announcements = $query->paginate(12);

        return response()->json($announcements);
    }

    public function announcementShow(int $id): JsonResponse
    {
        $recruitment = Recruitment::with('department')->findOrFail($id);

        if ($recruitment->status !== 'published') {
            return response()->json(['message' => 'Annonce non trouvée.'], 404);
        }

        return response()->json($recruitment);
    }

    public function apply(Request $request, int $recruitmentId): JsonResponse
    {
        $recruitment = Recruitment::findOrFail($recruitmentId);

        if ($recruitment->status !== 'published') {
            return response()->json(['message' => 'Cette annonce n\'est plus disponible.'], 404);
        }

        $userId = $request->user()->id;

        $exists = CandidateApplication::where('user_id', $userId)
            ->where('recruitment_id', $recruitmentId)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Vous avez déjà postulé à cette annonce.'], 409);
        }

        $user = $request->user();
        $profile = CandidateProfile::where('user_id', $userId)->first();
        $cvDoc = CandidateDocument::where('user_id', $userId)->where('category', 'cv')->first();

        $application = DB::transaction(function () use ($userId, $recruitmentId, $recruitment, $user, $profile, $cvDoc) {
            $application = CandidateApplication::create([
                'user_id' => $userId,
                'recruitment_id' => $recruitmentId,
                'department_id' => $recruitment->department_id,
                'status' => 'new',
            ]);

            Candidate::create([
                'user_id' => $userId,
                'first_name' => $profile?->first_name ?? $user->name,
                'last_name' => $profile?->last_name ?? '',
                'email' => $user->email,
                'phone' => $profile?->phone ?? null,
                'birth_date' => $profile?->birth_date ?? null,
                'address' => $profile?->address ? ($profile->city ? $profile->address . ', ' . $profile->city : $profile->address) : null,
                'recruitment_id' => $recruitmentId,
                'department_id' => $recruitment->department_id,
                'cover_letter' => null,
                'cv_file' => $cvDoc?->file_path ?? null,
                'status' => 'new',
            ]);

            return $application;
        });

        $this->notificationService->createForCandidate(
            $userId,
            'Candidature envoyée',
            "Votre candidature pour l'offre \"{$recruitment->title}\" a bien été enregistrée.",
            'success',
            '/candidate/applications'
        );

        if ($recruitment->department_id) {
            $userName = $profile ? trim(($profile->first_name ?? '') . ' ' . ($profile->last_name ?? '')) : $user->name;
            $this->notificationService->createForDepartmentRh(
                $recruitment->department_id,
                'Nouvelle candidature reçue',
                "{$userName} a postulé pour l'offre \"{$recruitment->title}\"",
                'info',
                "/rh/recruitment/{$recruitmentId}"
            );
        }

        return response()->json([
            'id' => $application->id,
            'status' => $application->status,
            'status_label' => $application->status_label,
            'created_at' => $application->created_at,
        ], 201);
    }

    public function myApplications(Request $request): JsonResponse
    {
        $applications = CandidateApplication::where('user_id', $request->user()->id)
            ->with('recruitment.department')
            ->latest()
            ->get();

        $result = $applications->map(fn($app) => [
            'id' => $app->id,
            'status' => $app->status,
            'status_label' => $app->status_label,
            'created_at' => $app->created_at,
            'recruitment' => [
                'id' => $app->recruitment->id,
                'title' => $app->recruitment->title,
                'contract_type' => $app->recruitment->contract_type,
                'location' => $app->recruitment->location,
                'department' => $app->recruitment->department?->name,
            ],
        ]);

        return response()->json($result);
    }

    public function applicationHistory(Request $request): JsonResponse
    {
        $applications = CandidateApplication::where('user_id', $request->user()->id)
            ->with('recruitment.department')
            ->whereIn('status', ['accepted', 'rejected'])
            ->latest()
            ->get();

        $result = $applications->map(fn($app) => [
            'id' => $app->id,
            'status' => $app->status,
            'status_label' => $app->status_label,
            'created_at' => $app->created_at,
            'recruitment' => [
                'id' => $app->recruitment->id,
                'title' => $app->recruitment->title,
                'contract_type' => $app->recruitment->contract_type,
                'location' => $app->recruitment->location,
                'department' => $app->recruitment->department?->name,
            ],
        ]);

        return response()->json($result);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $total = CandidateApplication::where('user_id', $userId)->count();
        $pending = CandidateApplication::where('user_id', $userId)
            ->whereIn('status', ['new', 'cv_review', 'interview_scheduled', 'technical_test', 'final_interview'])
            ->count();
        $accepted = CandidateApplication::where('user_id', $userId)
            ->where('status', 'accepted')
            ->count();
        $rejected = CandidateApplication::where('user_id', $userId)
            ->where('status', 'rejected')
            ->count();

        $recent = CandidateApplication::where('user_id', $userId)
            ->with('recruitment.department')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($app) => [
                'id' => $app->id,
                'status' => $app->status,
                'status_label' => $app->status_label,
                'created_at' => $app->created_at,
                'recruitment' => [
                    'title' => $app->recruitment->title,
                    'department' => $app->recruitment->department?->name,
                ],
            ]);

        return response()->json([
            'total_applications' => $total,
            'pending' => $pending,
            'accepted' => $accepted,
            'rejected' => $rejected,
            'recent_applications' => $recent,
        ]);
    }

    public function calendar(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $applications = CandidateApplication::where('user_id', $userId)
            ->with('recruitment')
            ->get();

        $events = [];

        foreach ($applications as $app) {
            $candidate = Candidate::where('user_id', $userId)
                ->where('recruitment_id', $app->recruitment_id)
                ->first();

            if ($candidate && $candidate->interview_date) {
                $events[] = [
                    'id' => $candidate->id,
                    'type' => 'interview',
                    'title' => 'Entretien - ' . $app->recruitment->title,
                    'date' => $candidate->interview_date->format('Y-m-d'),
                    'time' => $candidate->interview_time,
                    'notes' => $candidate->interview_notes,
                    'status' => $candidate->status,
                    'status_label' => $candidate->getStatusLabelAttribute(),
                    'department' => $app->recruitment->department?->name,
                ];
            }
        }

        return response()->json($events);
    }
}

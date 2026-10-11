<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRecruitmentRequest;
use App\Http\Requests\UpdateRecruitmentRequest;
use App\Http\Resources\RecruitmentResource;
use App\Models\Recruitment;
use App\Services\RecruitmentService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;

class RecruitmentController extends Controller
{
    public function __construct(
        private RecruitmentService $recruitmentService,
        private NotificationService $notificationService
    ) {}

    public function index(): JsonResponse
    {
        $recruitments = $this->recruitmentService->getAll();
        return response()->json(RecruitmentResource::collection($recruitments));
    }

    public function store(StoreRecruitmentRequest $request): JsonResponse
    {
        $recruitment = $this->recruitmentService->create($request->validated());

        $this->notificationService->createForAllAdmins(
            'Nouvelle offre de recrutement',
            "Une nouvelle offre a été créée : {$recruitment->title}",
            'success',
            "/recruitments/{$recruitment->id}"
        );

        if ($recruitment->department_id) {
            $this->notificationService->createForDepartmentRh(
                $recruitment->department_id,
                'Nouvelle offre dans votre département',
                "Une nouvelle offre de recrutement a été créée : {$recruitment->title}",
                'info',
                "/recruitments/{$recruitment->id}"
            );
        }

        return response()->json(new RecruitmentResource($recruitment), 201);
    }

    public function show(Recruitment $recruitment): JsonResponse
    {
        $recruitment = $this->recruitmentService->getById($recruitment->id);
        return response()->json(new RecruitmentResource($recruitment));
    }

    public function update(UpdateRecruitmentRequest $request, Recruitment $recruitment): JsonResponse
    {
        $recruitment = $this->recruitmentService->update($recruitment, $request->validated());
        return response()->json(new RecruitmentResource($recruitment));
    }

    public function destroy(Recruitment $recruitment): JsonResponse
    {
        $this->recruitmentService->delete($recruitment);
        return response()->json(null, 204);
    }

    public function stats(): JsonResponse
    {
        return response()->json($this->recruitmentService->getStats());
    }

    public function publish(Recruitment $recruitment): JsonResponse
    {
        $recruitment = $this->recruitmentService->updateStatus($recruitment, 'published');

        $this->notificationService->createForAllAdmins(
            'Offre publiée',
            "L'offre de recrutement \"{$recruitment->title}\" a été publiée",
            'success',
            "/recruitments/{$recruitment->id}"
        );

        if ($recruitment->department_id) {
            $this->notificationService->createForDepartmentRh(
                $recruitment->department_id,
                'Nouvelle offre publiée dans votre département',
                "L'offre \"{$recruitment->title}\" est maintenant visible par les candidats",
                'info',
                "/recruitments/{$recruitment->id}"
            );
        }

        return response()->json(new RecruitmentResource($recruitment));
    }

    public function draft(Recruitment $recruitment): JsonResponse
    {
        $recruitment = $this->recruitmentService->updateStatus($recruitment, 'draft');
        return response()->json(new RecruitmentResource($recruitment));
    }

    public function close(Recruitment $recruitment): JsonResponse
    {
        $recruitment = $this->recruitmentService->updateStatus($recruitment, 'closed');
        return response()->json(new RecruitmentResource($recruitment));
    }

    public function archive(Recruitment $recruitment): JsonResponse
    {
        $recruitment = $this->recruitmentService->updateStatus($recruitment, 'archived');
        return response()->json(new RecruitmentResource($recruitment));
    }
}

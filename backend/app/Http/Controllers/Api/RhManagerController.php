<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRhManagerRequest;
use App\Http\Requests\UpdateRhManagerRequest;
use App\Http\Resources\RhManagerResource;
use App\Models\RhManager;
use App\Services\RhManagerService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;

class RhManagerController extends Controller
{
    public function __construct(
        private RhManagerService $rhManagerService,
        private NotificationService $notificationService
    ) {}

    public function index()
    {
        $rhManagers = $this->rhManagerService->getAll();
        return RhManagerResource::collection($rhManagers);
    }

    public function store(StoreRhManagerRequest $request)
    {
        $rhManager = $this->rhManagerService->create($request->validated());

        $this->notificationService->createForAllAdmins(
            'Nouveau RH créé',
            "Un nouveau responsable RH a été créé : {$rhManager->first_name} {$rhManager->last_name}",
            'success',
            "/rh/{$rhManager->id}"
        );

        return new RhManagerResource($rhManager);
    }

    public function show(RhManager $rhManager)
    {
        $rhManager->load(['department', 'contract']);
        return new RhManagerResource($rhManager);
    }

    public function update(UpdateRhManagerRequest $request, RhManager $rhManager)
    {
        $rhManager = $this->rhManagerService->update($rhManager, $request->validated());

        $this->notificationService->createForAllAdmins(
            'RH modifié',
            "Les informations du RH {$rhManager->first_name} {$rhManager->last_name} ont été modifiées",
            'info',
            "/rh/{$rhManager->id}"
        );

        return new RhManagerResource($rhManager);
    }

    public function destroy(RhManager $rhManager): JsonResponse
    {
        $this->rhManagerService->delete($rhManager);
        return response()->json(null, 204);
    }

    public function toggleStatus(RhManager $rhManager)
    {
        $rhManager = $this->rhManagerService->toggleStatus($rhManager);

        $statusText = $rhManager->status ? 'activé' : 'désactivé';
        $this->notificationService->createForAllAdmins(
            'RH ' . ucfirst($statusText),
            "Le compte du RH {$rhManager->first_name} {$rhManager->last_name} a été {$statusText}",
            $rhManager->status ? 'success' : 'warning',
            "/rh/{$rhManager->id}"
        );

        return new RhManagerResource($rhManager);
    }

    public function available()
    {
        $rhManagers = $this->rhManagerService->getAvailable();
        return RhManagerResource::collection($rhManagers);
    }
}

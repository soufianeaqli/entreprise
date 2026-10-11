<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NotificationResource;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function __construct(
        private NotificationService $notificationService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $filter = $request->get('filter');
        $search = $request->get('search');

        $notifications = $this->notificationService->getForUser(
            $request->user()->id,
            $filter,
            $search
        );

        return response()->json(NotificationResource::collection($notifications));
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $count = $this->notificationService->getUnreadCount($request->user()->id);
        return response()->json(['count' => $count]);
    }

    public function recent(Request $request): JsonResponse
    {
        $notifications = $this->notificationService->getRecent($request->user()->id);
        return response()->json(NotificationResource::collection($notifications));
    }

    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $notification = $this->notificationService->markAsRead($id, $request->user()->id);
        return response()->json(new NotificationResource($notification));
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $count = $this->notificationService->markAllAsRead($request->user()->id);
        return response()->json(['message' => 'Toutes les notifications marquées comme lues.', 'updated' => $count]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->notificationService->delete($id, $request->user()->id);
        return response()->json(null, 204);
    }
}

<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\CalendarService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CalendarController extends Controller
{
    public function __construct(
        private CalendarService $calendarService
    ) {}

    public function events(Request $request): JsonResponse
    {
        $departmentId = $request->get('rh_department_id');
        $departmentName = $request->get('rh_department_name');
        $from = $request->get('from');
        $to = $request->get('to');

        $events = $this->calendarService->getEvents($departmentId, $departmentName, $from, $to);
        return response()->json($events);
    }

    public function notifications(Request $request): JsonResponse
    {
        $departmentId = $request->get('rh_department_id');
        $departmentName = $request->get('rh_department_name');

        $notifications = $this->calendarService->getNotifications($departmentId, $departmentName);
        return response()->json($notifications);
    }
}

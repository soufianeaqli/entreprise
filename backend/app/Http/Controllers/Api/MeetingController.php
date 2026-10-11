<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMeetingRequest;
use App\Http\Requests\UpdateMeetingRequest;
use App\Http\Resources\MeetingResource;
use App\Models\Meeting;
use App\Models\MeetingDecision;
use App\Models\MeetingTask;
use App\Services\MeetingService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MeetingController extends Controller
{
    public function __construct(
        private MeetingService $meetingService,
        private NotificationService $notificationService
    ) {}

    public function index(Request $request)
    {
        $status = $request->get('status');
        $meetings = $this->meetingService->getAll($status);
        return MeetingResource::collection($meetings);
    }

    public function store(StoreMeetingRequest $request)
    {
        $meeting = $this->meetingService->create($request->validated());

        if ($meeting->department_id) {
            $this->notificationService->createForDepartmentRh(
                $meeting->department_id,
                'Nouvelle réunion planifiée',
                "Une réunion \"{$meeting->title}\" a été planifiée pour le {$meeting->date->format('d/m/Y')}",
                'info',
                "/rh/meetings"
            );
        }

        return new MeetingResource($meeting);
    }

    public function show(Meeting $meeting)
    {
        $meeting = $this->meetingService->getById($meeting->id);
        return new MeetingResource($meeting);
    }

    public function update(UpdateMeetingRequest $request, Meeting $meeting)
    {
        $meeting = $this->meetingService->update($meeting, $request->validated());
        return new MeetingResource($meeting);
    }

    public function destroy(Meeting $meeting): JsonResponse
    {
        $this->meetingService->delete($meeting);
        return response()->json(null, 204);
    }

    public function updateStatus(Request $request, Meeting $meeting)
    {
        $request->validate(['status' => 'required|in:scheduled,in_progress,completed,cancelled']);
        $meeting = $this->meetingService->updateStatus($meeting, $request->status);
        return new MeetingResource($meeting);
    }

    public function updateMinutes(Request $request, Meeting $meeting)
    {
        $data = $request->validate([
            'minutes_summary' => 'nullable|string',
            'minutes_objective' => 'nullable|string',
            'minutes_key_points' => 'nullable|string',
            'minutes_notes' => 'nullable|string',
        ]);
        $meeting = $this->meetingService->updateMinutes($meeting, $data);
        return new MeetingResource($meeting);
    }

    public function upcoming()
    {
        $meetings = $this->meetingService->getUpcoming();
        return MeetingResource::collection($meetings);
    }

    public function calendar(Request $request)
    {
        $month = $request->get('month');
        $year = $request->get('year');
        $events = $this->meetingService->getCalendarEvents($month, $year);
        return MeetingResource::collection($events);
    }

    public function stats()
    {
        return response()->json(['success' => true, 'data' => $this->meetingService->getStats()]);
    }

    // ── Decisions ────────────────────────────────────────────────────────────

    public function addDecision(Request $request, Meeting $meeting)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);
        $decision = $this->meetingService->addDecision($meeting, $data);
        return response()->json($decision, 201);
    }

    public function deleteDecision(Meeting $meeting, int $decisionId): JsonResponse
    {
        $this->meetingService->deleteDecision($meeting, $decisionId);
        return response()->json(null, 204);
    }

    // ── Tasks ────────────────────────────────────────────────────────────────

    public function addTask(Request $request, Meeting $meeting)
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'assigned_to' => 'nullable|integer|exists:rh_managers,id',
            'due_date' => 'nullable|date',
            'priority' => 'nullable|in:low,medium,high,urgent',
        ]);
        $task = $this->meetingService->addTask($meeting, $data);
        return new MeetingResource($task->fresh('assignee'));
    }

    public function updateTask(Request $request, MeetingTask $task)
    {
        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'assigned_to' => 'nullable|integer|exists:rh_managers,id',
            'due_date' => 'nullable|date',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'status' => 'nullable|in:pending,in_progress,completed,cancelled',
        ]);
        $task = $this->meetingService->updateTask($task, $data);
        return response()->json($task);
    }

    public function deleteTask(MeetingTask $task): JsonResponse
    {
        $this->meetingService->deleteTask($task->id);
        return response()->json(null, 204);
    }

    // ── Attachments ──────────────────────────────────────────────────────────

    public function addAttachment(Request $request, Meeting $meeting)
    {
        $data = $request->validate([
            'filename' => 'required|string|max:255',
            'original_name' => 'required|string|max:255',
            'mime_type' => 'required|string|max:100',
            'size' => 'required|integer|min:0',
        ]);
        $attachment = $this->meetingService->addAttachment($meeting, $data);
        return response()->json($attachment, 201);
    }

    public function deleteAttachment(int $attachmentId): JsonResponse
    {
        $this->meetingService->deleteAttachment($attachmentId);
        return response()->json(null, 204);
    }
}

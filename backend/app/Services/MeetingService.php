<?php

namespace App\Services;

use App\Models\Meeting;
use App\Models\MeetingDecision;
use App\Models\MeetingTask;
use App\Models\MeetingAttachment;
use Carbon\Carbon;

class MeetingService
{
    public function getAll(?string $status = null)
    {
        $query = Meeting::with(['department', 'rhManager', 'participants', 'decisions', 'tasks.assignee', 'attachments'])
            ->withCount('participants');

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        return $query->orderBy('date', 'desc')->orderBy('start_time', 'desc')->get();
    }

    public function getById(int $id)
    {
        return Meeting::with(['department', 'rhManager', 'participants', 'decisions', 'tasks.assignee', 'attachments'])
            ->withCount('participants')
            ->findOrFail($id);
    }

    public function getUpcoming()
    {
        return Meeting::with(['department', 'rhManager', 'participants'])
            ->withCount('participants')
            ->where('status', 'scheduled')
            ->where('date', '>=', Carbon::today())
            ->orderBy('date', 'asc')
            ->orderBy('start_time', 'asc')
            ->get();
    }

    public function getCalendarEvents(?string $month = null, ?int $year = null)
    {
        $query = Meeting::with(['department', 'rhManager'])
            ->select('id', 'title', 'date', 'start_time', 'end_time', 'status', 'priority', 'type', 'location');

        if ($month && $year) {
            $query->whereMonth('date', $month)->whereYear('date', $year);
        }

        return $query->orderBy('date', 'asc')->orderBy('start_time', 'asc')->get();
    }

    public function getStats(): array
    {
        $today = Carbon::today();

        return [
            'total' => Meeting::count(),
            'today' => Meeting::where('date', $today)->count(),
            'upcoming' => Meeting::where('status', 'scheduled')->where('date', '>=', $today)->count(),
            'completed' => Meeting::where('status', 'completed')->count(),
            'cancelled' => Meeting::where('status', 'cancelled')->count(),
        ];
    }

    public function create(array $data): Meeting
    {
        $participants = $data['participants'] ?? [];
        unset($data['participants']);

        $meeting = Meeting::create($data);

        if (!empty($participants)) {
            $meeting->participants()->attach($participants);
        }

        return $meeting->load(['department', 'rhManager', 'participants']);
    }

    public function update(Meeting $meeting, array $data): Meeting
    {
        $participants = $data['participants'] ?? null;
        unset($data['participants']);

        $meeting->update($data);

        if ($participants !== null) {
            $meeting->participants()->sync($participants);
        }

        return $meeting->fresh(['department', 'rhManager', 'participants', 'decisions', 'tasks.assignee', 'attachments']);
    }

    public function delete(Meeting $meeting): void
    {
        $meeting->delete();
    }

    public function updateStatus(Meeting $meeting, string $status): Meeting
    {
        $meeting->update(['status' => $status]);
        return $meeting->fresh(['department', 'rhManager', 'participants']);
    }

    public function updateMinutes(Meeting $meeting, array $data): Meeting
    {
        $meeting->update($data);
        return $meeting->fresh(['department', 'rhManager', 'participants', 'decisions', 'tasks.assignee']);
    }

    public function addDecision(Meeting $meeting, array $data): MeetingDecision
    {
        return $meeting->decisions()->create($data);
    }

    public function deleteDecision(Meeting $meeting, int $decisionId): void
    {
        $meeting->decisions()->where('id', $decisionId)->delete();
    }

    public function addTask(Meeting $meeting, array $data): MeetingTask
    {
        return $meeting->tasks()->create($data);
    }

    public function updateTask(MeetingTask $task, array $data): MeetingTask
    {
        $task->update($data);
        return $task->fresh('assignee');
    }

    public function deleteTask(int $taskId): void
    {
        MeetingTask::where('id', $taskId)->delete();
    }

    public function addAttachment(Meeting $meeting, array $data): MeetingAttachment
    {
        return $meeting->attachments()->create($data);
    }

    public function deleteAttachment(int $attachmentId): void
    {
        MeetingAttachment::where('id', $attachmentId)->delete();
    }
}

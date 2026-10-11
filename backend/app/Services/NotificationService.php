<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class NotificationService
{
    public function createForUser(int $userId, string $role, string $title, string $message, string $type = 'info', ?string $link = null): Notification
    {
        return Notification::create([
            'user_id' => $userId,
            'role' => $role,
            'title' => $title,
            'message' => $message,
            'type' => $type,
            'link' => $link,
        ]);
    }

    public function createForAllAdmins(string $title, string $message, string $type = 'info', ?string $link = null): void
    {
        $admins = User::where('role', 'super_admin')->where('is_active', true)->get();

        foreach ($admins as $admin) {
            $this->createForUser($admin->id, 'super_admin', $title, $message, $type, $link);
        }
    }

    public function createForDepartmentRh(int $departmentId, string $title, string $message, string $type = 'info', ?string $link = null): void
    {
        $rhManagers = User::where('role', 'rh')
            ->where('is_active', true)
            ->whereHas('rhManager', fn($q) => $q->whereHas('department', fn($q2) => $q2->where('departments.id', $departmentId)))
            ->get();

        foreach ($rhManagers as $rh) {
            $this->createForUser($rh->id, 'rh', $title, $message, $type, $link);
        }
    }

    public function createForAllRh(string $title, string $message, string $type = 'info', ?string $link = null): void
    {
        $rhUsers = User::where('role', 'rh')->where('is_active', true)->get();

        foreach ($rhUsers as $rh) {
            $this->createForUser($rh->id, 'rh', $title, $message, $type, $link);
        }
    }

    public function createForCandidate(int $userId, string $title, string $message, string $type = 'info', ?string $link = null): Notification
    {
        return $this->createForUser($userId, 'candidate', $title, $message, $type, $link);
    }

    public function getForUser(int $userId, ?string $filter = null, ?string $search = null): LengthAwarePaginator
    {
        $query = Notification::where('user_id', $userId);

        if ($filter === 'unread') {
            $query->where('is_read', false);
        } elseif ($filter === 'read') {
            $query->where('is_read', true);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        return $query->latest()->paginate(15);
    }

    public function getUnreadCount(int $userId): int
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->count();
    }

    public function getRecent(int $userId, int $limit = 10): \Illuminate\Database\Eloquent\Collection
    {
        return Notification::where('user_id', $userId)
            ->latest()
            ->limit($limit)
            ->get();
    }

    public function markAsRead(int $notificationId, int $userId): Notification
    {
        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->firstOrFail();

        $notification->update(['is_read' => true]);

        return $notification;
    }

    public function markAllAsRead(int $userId): int
    {
        return Notification::where('user_id', $userId)
            ->where('is_read', false)
            ->update(['is_read' => true]);
    }

    public function delete(int $notificationId, int $userId): bool
    {
        $notification = Notification::where('id', $notificationId)
            ->where('user_id', $userId)
            ->firstOrFail();

        return $notification->delete();
    }
}

<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\RhManagerController;
use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\RecruitmentController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\MeetingController;
use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\RhDashboardController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\CandidateController;
use App\Http\Controllers\Api\CalendarController;
use App\Http\Controllers\Api\EmployeeDocumentController;
use App\Http\Controllers\Api\CandidatePortalController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\AIController;
use App\Http\Controllers\Api\AIExecutionController;
use App\Http\Controllers\Api\AIInsightController;
use App\Http\Controllers\Api\FormSuggestionController;
use App\Http\Controllers\Api\KnowledgeBaseController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    Route::post('auth/login', [AuthController::class, 'login']);
    Route::post('auth/register', [AuthController::class, 'register']);

    Route::middleware('auth:sanctum')->group(function () {

        Route::get('auth/me', [AuthController::class, 'me']);
        Route::put('auth/profile', [AuthController::class, 'updateProfile']);
        Route::post('auth/avatar', [AuthController::class, 'updateAvatar']);
        Route::put('auth/password', [AuthController::class, 'updatePassword']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::get('notifications', [NotificationController::class, 'index']);
        Route::get('notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::get('notifications/recent', [NotificationController::class, 'recent']);
        Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
        Route::patch('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
        Route::delete('notifications/{id}', [NotificationController::class, 'destroy']);

        Route::prefix('ai')->middleware('throttle:ai')->group(function () {
            Route::post('/chat', [AIController::class, 'chat']);
            Route::get('/tools', [AIController::class, 'tools']);
            Route::get('/executions', [AIExecutionController::class, 'index']);
            Route::get('/executions/{execution}', [AIExecutionController::class, 'show']);
            Route::post('/form-suggestions', [FormSuggestionController::class, 'generate']);
        });

        Route::prefix('ai-insights')->group(function () {
            Route::get('/', [AIInsightController::class, 'index']);
            Route::get('/stats', [AIInsightController::class, 'stats']);
            Route::get('/health-score', [AIInsightController::class, 'healthScore']);
            Route::post('/analyze', [AIInsightController::class, 'analyze']);
            Route::get('/{insight}', [AIInsightController::class, 'show']);
            Route::patch('/{insight}/acknowledge', [AIInsightController::class, 'acknowledge']);
            Route::patch('/{insight}/dismiss', [AIInsightController::class, 'dismiss']);
        });

        Route::middleware('role:super_admin')->prefix('knowledge-base')->group(function () {
            Route::get('/', [KnowledgeBaseController::class, 'index']);
            Route::post('/', [KnowledgeBaseController::class, 'store']);
            Route::get('/stats', [KnowledgeBaseController::class, 'stats']);
            Route::get('/search', [KnowledgeBaseController::class, 'search']);
            Route::get('/{knowledgeBase}', [KnowledgeBaseController::class, 'show']);
            Route::put('/{knowledgeBase}', [KnowledgeBaseController::class, 'update']);
            Route::delete('/{knowledgeBase}', [KnowledgeBaseController::class, 'destroy']);
            Route::get('/{knowledgeBase}/documents', [KnowledgeBaseController::class, 'documents']);
            Route::post('/{knowledgeBase}/documents', [KnowledgeBaseController::class, 'storeDocument']);
            Route::get('/{knowledgeBase}/documents/{document}', [KnowledgeBaseController::class, 'showDocument']);
            Route::put('/{knowledgeBase}/documents/{document}', [KnowledgeBaseController::class, 'updateDocument']);
            Route::delete('/{knowledgeBase}/documents/{document}', [KnowledgeBaseController::class, 'destroyDocument']);
        });

        Route::post('auth/users/{userId}/reset-password', [AuthController::class, 'resetPassword'])
            ->middleware('role:super_admin');
        Route::patch('auth/users/{userId}/toggle-status', [AuthController::class, 'toggleAccountStatus'])
            ->middleware('role:super_admin');

        Route::get('rh-dashboard', [RhDashboardController::class, 'index'])
            ->middleware('role:rh,super_admin');

        Route::middleware('role:super_admin')->group(function () {
            Route::get('rh-managers/available', [RhManagerController::class, 'available']);
            Route::apiResource('rh-managers', RhManagerController::class);
            Route::patch('rh-managers/{rhManager}/toggle-status', [RhManagerController::class, 'toggleStatus']);

            Route::get('departments/available', [DepartmentController::class, 'available']);
            Route::apiResource('departments', DepartmentController::class);
        });

        Route::middleware('department')->group(function () {
            Route::get('recruitments/stats', [RecruitmentController::class, 'stats']);
            Route::apiResource('recruitments', RecruitmentController::class);
            Route::patch('recruitments/{recruitment}/publish', [RecruitmentController::class, 'publish']);
            Route::patch('recruitments/{recruitment}/draft', [RecruitmentController::class, 'draft']);
            Route::patch('recruitments/{recruitment}/close', [RecruitmentController::class, 'close']);
            Route::patch('recruitments/{recruitment}/archive', [RecruitmentController::class, 'archive']);

            Route::get('recruitment/announcements', [CandidateController::class, 'announcements']);
            Route::get('recruitment/announcements/{id}', [CandidateController::class, 'announcementShow']);
            Route::get('recruitment/{recruitmentId}/candidates', [CandidateController::class, 'candidates']);
            Route::get('recruitment/candidates/{id}', [CandidateController::class, 'show']);
            Route::get('recruitment/candidates/{id}/full-profile', [CandidateController::class, 'fullProfile']);
            Route::patch('recruitment/candidates/{candidate}/status', [CandidateController::class, 'updateStatus']);
            Route::get('recruitment/stats', [CandidateController::class, 'stats']);

            Route::get('employees/stats', [EmployeeController::class, 'stats']);
            Route::apiResource('employees', EmployeeController::class);
            Route::patch('employees/{employee}/toggle-status', [EmployeeController::class, 'toggleStatus']);
            Route::post('employees/{employee}/reset-password', [EmployeeController::class, 'resetPassword']);

            Route::get('employees/{employee}/documents', [EmployeeDocumentController::class, 'index']);
            Route::post('employees/{employee}/documents', [EmployeeDocumentController::class, 'store']);
            Route::get('employees/{employee}/documents/history', [EmployeeDocumentController::class, 'history']);
            Route::get('employees/{employee}/documents/counts', [EmployeeDocumentController::class, 'categoryCounts']);
            Route::get('employee-documents/{document}', [EmployeeDocumentController::class, 'show']);
            Route::put('employee-documents/{document}/replace', [EmployeeDocumentController::class, 'replace']);
            Route::delete('employee-documents/{document}', [EmployeeDocumentController::class, 'destroy']);

            Route::apiResource('contracts', ContractController::class);
            Route::patch('contracts/{contract}/renew', [ContractController::class, 'renew']);
            Route::get('contracts/{contract}/pdf', [ContractController::class, 'previewPdf']);
            Route::get('contracts/{contract}/pdf/download', [ContractController::class, 'downloadPdf']);
            Route::post('contracts/{contract}/pdf/regenerate', [ContractController::class, 'regeneratePdf']);

            Route::get('meetings/stats', [MeetingController::class, 'stats']);
            Route::get('meetings/upcoming', [MeetingController::class, 'upcoming']);
            Route::get('meetings/calendar', [MeetingController::class, 'calendar']);
            Route::apiResource('meetings', MeetingController::class);
            Route::patch('meetings/{meeting}/status', [MeetingController::class, 'updateStatus']);
            Route::put('meetings/{meeting}/minutes', [MeetingController::class, 'updateMinutes']);
            Route::post('meetings/{meeting}/decisions', [MeetingController::class, 'addDecision']);
            Route::delete('meetings/{meeting}/decisions/{decisionId}', [MeetingController::class, 'deleteDecision']);
            Route::post('meetings/{meeting}/tasks', [MeetingController::class, 'addTask']);
            Route::patch('meetings/tasks/{task}', [MeetingController::class, 'updateTask']);
            Route::delete('meetings/tasks/{task}', [MeetingController::class, 'deleteTask']);
            Route::post('meetings/{meeting}/attachments', [MeetingController::class, 'addAttachment']);
            Route::delete('meetings/attachments/{attachmentId}', [MeetingController::class, 'deleteAttachment']);

            Route::get('calendar/events', [CalendarController::class, 'events']);
            Route::get('calendar/notifications', [CalendarController::class, 'notifications']);
        });

        Route::middleware('role:super_admin')->prefix('finance')->group(function () {
            Route::get('/dashboard', [FinanceController::class, 'dashboard']);
            Route::get('/projects', [FinanceController::class, 'index']);
            Route::post('/projects', [FinanceController::class, 'store']);
            Route::get('/projects/{project}', [FinanceController::class, 'show']);
            Route::put('/projects/{project}', [FinanceController::class, 'update']);
            Route::delete('/projects/{project}', [FinanceController::class, 'destroy']);
            Route::post('/projects/{project}/incomes', [FinanceController::class, 'addIncome']);
            Route::delete('/incomes/{incomeId}', [FinanceController::class, 'deleteIncome']);
            Route::post('/projects/{project}/expenses', [FinanceController::class, 'addExpense']);
            Route::delete('/expenses/{expenseId}', [FinanceController::class, 'deleteExpense']);
        });

        Route::middleware('role:super_admin')->prefix('analytics')->group(function () {
            Route::get('/', [AnalyticsController::class, 'index']);
            Route::get('/kpis', [AnalyticsController::class, 'kpis']);
            Route::get('/revenue-expenses', [AnalyticsController::class, 'revenueExpenses']);
            Route::get('/financial', [AnalyticsController::class, 'financial']);
        });

        Route::middleware('role:candidate')->prefix('candidate')->group(function () {
            Route::get('/dashboard', [CandidatePortalController::class, 'dashboard']);
            Route::get('/profile', [CandidatePortalController::class, 'profile']);
            Route::put('/profile', [CandidatePortalController::class, 'updateProfile']);

            Route::get('/documents', [CandidatePortalController::class, 'documents']);
            Route::post('/documents', [CandidatePortalController::class, 'uploadDocument']);
            Route::get('/documents/{document}/download', [CandidatePortalController::class, 'downloadDocument']);
            Route::put('/documents/{document}/replace', [CandidatePortalController::class, 'replaceDocument']);
            Route::delete('/documents/{document}', [CandidatePortalController::class, 'deleteDocument']);

            Route::get('/announcements', [CandidatePortalController::class, 'announcements']);
            Route::get('/announcements/{id}', [CandidatePortalController::class, 'announcementShow']);
            Route::post('/announcements/{id}/apply', [CandidatePortalController::class, 'apply']);

            Route::get('/applications', [CandidatePortalController::class, 'myApplications']);
            Route::get('/applications/history', [CandidatePortalController::class, 'applicationHistory']);
            Route::get('/calendar', [CandidatePortalController::class, 'calendar']);
        });
    });
});

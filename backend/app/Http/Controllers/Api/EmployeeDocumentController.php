<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEmployeeDocumentRequest;
use App\Http\Resources\EmployeeDocumentResource;
use App\Models\Employee;
use App\Models\EmployeeDocument;
use App\Services\EmployeeDocumentService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeDocumentController extends Controller
{
    public function __construct(
        private EmployeeDocumentService $documentService,
        private NotificationService $notificationService
    ) {}

    public function index(Request $request, Employee $employee): JsonResponse
    {
        $departmentId = $request->get('rh_department_id');
        if ($employee->department_id !== $departmentId) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $category = $request->get('category');
        $documents = $this->documentService->getByEmployee($employee->id, $category);
        return response()->json(EmployeeDocumentResource::collection($documents));
    }

    public function store(StoreEmployeeDocumentRequest $request, Employee $employee): JsonResponse
    {
        $departmentId = $request->get('rh_department_id');
        if ($employee->department_id !== $departmentId) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $document = $this->documentService->upload(
            $employee,
            $request->validated(),
            $request->file('file'),
            $request->user()->id
        );

        $this->notificationService->createForDepartmentRh(
            $departmentId,
            'Document ajouté',
            "Un document ({$document->category_label}) a été ajouté au dossier de {$employee->first_name} {$employee->last_name}",
            'info',
            "/rh/employees/{$employee->id}"
        );

        return response()->json(new EmployeeDocumentResource($document), 201);
    }

    public function show(EmployeeDocument $document): JsonResponse
    {
        $departmentId = request()->get('rh_department_id');
        if ($document->employee->department_id !== $departmentId) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        return response()->json(new EmployeeDocumentResource($document->load(['employee', 'uploader'])));
    }

    public function replace(StoreEmployeeDocumentRequest $request, EmployeeDocument $document): JsonResponse
    {
        $departmentId = $request->get('rh_department_id');
        if ($document->employee->department_id !== $departmentId) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $document = $this->documentService->replace(
            $document,
            $request->file('file'),
            $request->user()->id
        );

        if ($request->has('title')) {
            $document->update(['title' => $request->input('title')]);
        }

        $employee = $document->employee;
        $this->notificationService->createForDepartmentRh(
            $departmentId,
            'Document remplacé',
            "Un document ({$document->category_label}) du dossier de {$employee->first_name} {$employee->last_name} a été remplacé",
            'info',
            "/rh/employees/{$employee->id}"
        );

        return response()->json(new EmployeeDocumentResource($document));
    }

    public function destroy(EmployeeDocument $document): JsonResponse
    {
        $departmentId = request()->get('rh_department_id');
        if ($document->employee->department_id !== $departmentId) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $this->documentService->delete($document);
        return response()->json(null, 204);
    }

    public function history(Request $request, Employee $employee): JsonResponse
    {
        $departmentId = $request->get('rh_department_id');
        if ($employee->department_id !== $departmentId) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $history = $this->documentService->getHistory($employee->id);
        return response()->json($history);
    }

    public function categoryCounts(Request $request, Employee $employee): JsonResponse
    {
        $departmentId = $request->get('rh_department_id');
        if ($employee->department_id !== $departmentId) {
            return response()->json(['message' => 'Accès non autorisé.'], 403);
        }

        $counts = $this->documentService->getCategoryCounts($employee->id);
        return response()->json($counts);
    }
}

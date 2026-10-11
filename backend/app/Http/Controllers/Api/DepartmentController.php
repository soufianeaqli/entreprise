<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDepartmentRequest;
use App\Http\Requests\UpdateDepartmentRequest;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use App\Services\DepartmentService;
use Illuminate\Http\JsonResponse;

class DepartmentController extends Controller
{
    public function __construct(
        private DepartmentService $departmentService
    ) {}

    public function index()
    {
        $departments = $this->departmentService->getAll();
        return DepartmentResource::collection($departments);
    }

    public function store(StoreDepartmentRequest $request)
    {
        $department = $this->departmentService->create($request->validated());
        return new DepartmentResource($department->load('rhManager'));
    }

    public function show(Department $department)
    {
        $department->load('rhManager');
        return new DepartmentResource($department);
    }

    public function update(UpdateDepartmentRequest $request, Department $department)
    {
        $department = $this->departmentService->update($department, $request->validated());
        return new DepartmentResource($department);
    }

    public function destroy(Department $department): JsonResponse
    {
        $this->departmentService->delete($department);
        return response()->json(null, 204);
    }

    public function available()
    {
        $rhManagers = $this->departmentService->getAvailable();
        return \App\Http\Resources\RhManagerResource::collection($rhManagers);
    }
}

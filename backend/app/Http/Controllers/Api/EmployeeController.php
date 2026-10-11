<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEmployeeRequest;
use App\Http\Requests\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use App\Services\EmployeeService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function __construct(
        private EmployeeService $employeeService,
        private NotificationService $notificationService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $departmentId = $request->get('rh_department_id');
        $employees = $this->employeeService->getAll($departmentId);
        return response()->json(EmployeeResource::collection($employees));
    }

    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $departmentId = $request->get('rh_department_id');
        $employee = $this->employeeService->create($request->validated(), $departmentId);

        $this->notificationService->createForDepartmentRh(
            $departmentId,
            'Nouvel employé ajouté',
            "Un nouvel employé a été ajouté : {$employee->first_name} {$employee->last_name}",
            'success',
            "/rh/employees/{$employee->id}"
        );

        return response()->json(new EmployeeResource($employee), 201);
    }

    public function show(Employee $employee): JsonResponse
    {
        $employee = $this->employeeService->getById($employee->id);
        return response()->json(new EmployeeResource($employee));
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): JsonResponse
    {
        $employee = $this->employeeService->update($employee, $request->validated());
        return response()->json(new EmployeeResource($employee));
    }

    public function destroy(Employee $employee): JsonResponse
    {
        $this->employeeService->delete($employee);
        return response()->json(null, 204);
    }

    public function toggleStatus(Employee $employee): JsonResponse
    {
        $employee = $this->employeeService->toggleStatus($employee);
        return response()->json(new EmployeeResource($employee));
    }

    public function resetPassword(Employee $employee): JsonResponse
    {
        $result = $this->employeeService->resetPassword($employee);
        return response()->json(['message' => 'Mot de passe réinitialisé', 'password' => $result['password']]);
    }

    public function stats(Request $request): JsonResponse
    {
        $departmentId = $request->get('rh_department_id');
        return response()->json($this->employeeService->getStats($departmentId));
    }
}

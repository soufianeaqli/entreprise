<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\UpdateProjectRequest;
use App\Http\Requests\StoreIncomeRequest;
use App\Http\Requests\StoreExpenseRequest;
use App\Http\Resources\ProjectResource;
use App\Http\Resources\ProjectIncomeResource;
use App\Http\Resources\ProjectExpenseResource;
use App\Models\Project;
use App\Services\FinanceService;
use Illuminate\Http\JsonResponse;

class FinanceController extends Controller
{
    public function __construct(
        private FinanceService $financeService
    ) {}

    public function dashboard(): JsonResponse
    {
        return response()->json($this->financeService->getDashboardStats());
    }

    public function index(): JsonResponse
    {
        $projects = $this->financeService->getAllProjects();
        return response()->json(ProjectResource::collection($projects));
    }

    public function store(StoreProjectRequest $request): JsonResponse
    {
        $project = $this->financeService->createProject($request->validated());
        return response()->json(new ProjectResource($project), 201);
    }

    public function show(Project $project): JsonResponse
    {
        $project = $this->financeService->getProjectById($project->id);
        return response()->json(new ProjectResource($project));
    }

    public function update(UpdateProjectRequest $request, Project $project): JsonResponse
    {
        $project = $this->financeService->updateProject($project, $request->validated());
        return response()->json(new ProjectResource($project));
    }

    public function destroy(Project $project): JsonResponse
    {
        $this->financeService->deleteProject($project);
        return response()->json(null, 204);
    }

    public function addIncome(StoreIncomeRequest $request, Project $project): JsonResponse
    {
        $income = $this->financeService->addIncome($project, $request->validated());
        return response()->json(new ProjectIncomeResource($income), 201);
    }

    public function deleteIncome(int $incomeId): JsonResponse
    {
        $this->financeService->deleteIncome($incomeId);
        return response()->json(null, 204);
    }

    public function addExpense(StoreExpenseRequest $request, Project $project): JsonResponse
    {
        $expense = $this->financeService->addExpense($project, $request->validated());
        return response()->json(new ProjectExpenseResource($expense), 201);
    }

    public function deleteExpense(int $expenseId): JsonResponse
    {
        $this->financeService->deleteExpense($expenseId);
        return response()->json(null, 204);
    }
}

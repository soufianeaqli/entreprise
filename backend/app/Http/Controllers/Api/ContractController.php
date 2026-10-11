<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Services\ContractService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class ContractController extends Controller
{
    public function __construct(
        private ContractService $contractService,
        private NotificationService $notificationService
    ) {}

    public function index(): JsonResponse
    {
        $contracts = Contract::latest()->get();
        return response()->json($contracts);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'employee_name' => 'required|string|max:255',
            'type' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date',
            'salary' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,expired,pending',
            'trial_period' => 'nullable|string|max:255',
            'work_hours' => 'nullable|string|max:255',
            'leave_days' => 'nullable|integer',
            'benefits' => 'nullable|string',
            'observations' => 'nullable|string',
        ]);

        $contract = Contract::create($validated);

        $this->notificationService->createForAllAdmins(
            'Nouveau contrat créé',
            "Un contrat a été créé pour {$contract->employee_name} ({$contract->type})",
            'success',
            "/contracts/{$contract->id}"
        );

        return response()->json($contract, 201);
    }

    public function show(Contract $contract): JsonResponse
    {
        return response()->json($contract);
    }

    public function update(Request $request, Contract $contract): JsonResponse
    {
        $validated = $request->validate([
            'employee_name' => 'sometimes|string|max:255',
            'type' => 'nullable|string|max:255',
            'department' => 'nullable|string|max:255',
            'start_date' => 'sometimes|date',
            'end_date' => 'nullable|date',
            'salary' => 'nullable|string|max:255',
            'status' => 'nullable|in:active,expired,pending',
            'trial_period' => 'nullable|string|max:255',
            'work_hours' => 'nullable|string|max:255',
            'leave_days' => 'nullable|integer',
            'benefits' => 'nullable|string',
            'observations' => 'nullable|string',
        ]);

        $contract->update($validated);
        return response()->json($contract);
    }

    public function destroy(Contract $contract): JsonResponse
    {
        if ($contract->pdf_path && Storage::disk('public')->exists($contract->pdf_path)) {
            Storage::disk('public')->delete($contract->pdf_path);
        }
        $contract->delete();
        return response()->json(null, 204);
    }

    public function renew(Contract $contract): JsonResponse
    {
        $contract->update([
            'status' => 'active',
            'end_date' => null,
        ]);
        return response()->json($contract);
    }

    public function downloadPdf(Contract $contract): Response
    {
        $path = $this->contractService->ensurePdfExists($contract);
        $fileName = 'contract_' . $contract->id . '.pdf';

        return Storage::disk('public')->download($path, $fileName, [
            'Content-Type' => 'application/pdf',
        ]);
    }

    public function previewPdf(Contract $contract): Response
    {
        $path = $this->contractService->ensurePdfExists($contract);

        $content = Storage::disk('public')->get($path);

        return response($content, 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="contract_' . $contract->id . '.pdf"',
        ]);
    }

    public function regeneratePdf(Contract $contract): JsonResponse
    {
        $path = $this->contractService->generatePdf($contract);
        return response()->json([
            'pdf_path' => $path,
            'pdf_url' => Storage::disk('public')->url($path),
        ]);
    }
}

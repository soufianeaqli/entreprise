<?php

namespace App\Services;

use App\Models\Contract;
use App\Models\Employee;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class ContractService
{
    public function generatePdf(Contract $contract): string
    {
        $employee = Employee::where('email', $contract->employee_name)->first();

        $data = [
            'contract' => $contract,
            'employee' => $employee,
            'company' => [
                'name' => 'HR Platform',
                'address' => 'Casablanca, Maroc',
            ],
        ];

        $pdf = Pdf::loadView('contracts.pdf', $data);
        $pdf->setPaper('a4');

        $fileName = 'contract_' . $contract->id . '_' . time() . '.pdf';
        $path = 'contracts/' . $fileName;

        Storage::disk('public')->put($path, $pdf->output());

        if ($contract->pdf_path) {
            Storage::disk('public')->delete($contract->pdf_path);
        }

        $contract->update(['pdf_path' => $path]);

        return $path;
    }

    public function getPdfPath(Contract $contract): ?string
    {
        return $contract->pdf_path;
    }

    public function getPdfUrl(Contract $contract): ?string
    {
        if (!$contract->pdf_path) return null;
        return Storage::disk('public')->url($contract->pdf_path);
    }

    public function ensurePdfExists(Contract $contract): string
    {
        if (!$contract->pdf_path || !Storage::disk('public')->exists($contract->pdf_path)) {
            return $this->generatePdf($contract);
        }
        return $contract->pdf_path;
    }
}

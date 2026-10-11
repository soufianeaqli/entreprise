<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\EmployeeDocument;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class EmployeeDocumentService
{
    private const ALLOWED_TYPES = ['pdf', 'jpg', 'jpeg', 'png'];
    private const MAX_SIZE = 10 * 1024 * 1024;

    public function getByEmployee(int $employeeId, ?string $category = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = EmployeeDocument::with('uploader')
            ->where('employee_id', $employeeId);

        if ($category && $category !== 'all') {
            $query->where('category', $category);
        }

        return $query->latest()->get();
    }

    public function getById(int $id): EmployeeDocument
    {
        return EmployeeDocument::with(['employee', 'uploader'])->findOrFail($id);
    }

    public function upload(Employee $employee, array $data, UploadedFile $file, int $userId): EmployeeDocument
    {
        $this->validateFile($file);

        $path = $file->store('employee-documents/' . $employee->id, 'public');

        return EmployeeDocument::create([
            'employee_id' => $employee->id,
            'category' => $data['category'],
            'title' => $data['title'],
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'uploaded_by' => $userId,
        ]);
    }

    public function replace(EmployeeDocument $document, UploadedFile $file, int $userId): EmployeeDocument
    {
        $this->validateFile($file);

        Storage::disk('public')->delete($document->file_path);

        $path = $file->store('employee-documents/' . $document->employee_id, 'public');

        $document->update([
            'file_name' => $file->getClientOriginalName(),
            'file_path' => $path,
            'file_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
        ]);

        return $document->fresh(['uploader']);
    }

    public function delete(EmployeeDocument $document): void
    {
        Storage::disk('public')->delete($document->file_path);
        $document->delete();
    }

    public function getHistory(int $employeeId): array
    {
        return EmployeeDocument::with('uploader')
            ->where('employee_id', $employeeId)
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(fn($doc) => [
                'id' => $doc->id,
                'title' => $doc->title,
                'category' => $doc->category,
                'category_label' => $doc->category_label,
                'action' => 'uploaded',
                'file_name' => $doc->file_name,
                'date' => $doc->created_at->format('Y-m-d H:i'),
                'uploaded_by' => $doc->uploader?->name ?? 'Système',
            ])
            ->toArray();
    }

    public function getCategoryCounts(int $employeeId): array
    {
        $counts = EmployeeDocument::where('employee_id', $employeeId)
            ->selectRaw('category, count(*) as count')
            ->groupBy('category')
            ->pluck('count', 'category')
            ->toArray();

        return [
            'cv' => $counts['cv'] ?? 0,
            'diploma' => $counts['diploma'] ?? 0,
            'attestation' => $counts['attestation'] ?? 0,
            'medical' => $counts['medical'] ?? 0,
            'contract' => $counts['contract'] ?? 0,
        ];
    }

    private function validateFile(UploadedFile $file): void
    {
        $extension = strtolower($file->getClientOriginalExtension());

        if (!in_array($extension, self::ALLOWED_TYPES)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'file' => 'Type de fichier non autorisé. Autorisés: PDF, JPG, JPEG, PNG.',
            ]);
        }

        if ($file->getSize() > self::MAX_SIZE) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'file' => 'Le fichier ne doit pas dépasser 10 MB.',
            ]);
        }
    }
}

<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmployeeDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'category' => 'required|in:cv,diploma,attestation,medical,contract',
            'title' => 'required|string|max:255',
            'file' => 'required|file|max:10240|mimes:pdf,jpg,jpeg,png',
        ];
    }

    public function messages(): array
    {
        return [
            'file.mimes' => 'Type de fichier non autorisé. Autorisés: PDF, JPG, JPEG, PNG.',
            'file.max' => 'Le fichier ne doit pas dépasser 10 MB.',
        ];
    }
}

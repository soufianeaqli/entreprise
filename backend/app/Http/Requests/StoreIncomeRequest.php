<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreIncomeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => 'required|numeric|min:0.01',
            'date' => 'required|date',
            'payment_method' => 'required|string|in:bank_transfer,cash,check,mobile_payment,other',
            'reference' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ];
    }

    public function messages(): array
    {
        return [
            'amount.required' => 'Le montant est obligatoire.',
            'amount.numeric' => 'Le montant doit être un nombre.',
            'amount.min' => 'Le montant doit être supérieur à zéro.',
            'date.required' => 'La date est obligatoire.',
            'date.date' => 'La date doit être valide.',
            'payment_method.required' => 'La méthode de paiement est obligatoire.',
            'payment_method.in' => 'Méthode de paiement invalide.',
        ];
    }
}

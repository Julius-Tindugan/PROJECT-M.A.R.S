<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStaffRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:staff,email',
            'phone' => 'nullable|string|max:50',
            'active' => 'sometimes|boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Staff name is required.',
            'name.max' => 'Staff name cannot exceed 255 characters.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'This email is already registered.',
        ];
    }
}

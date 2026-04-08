<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStaffRequest extends FormRequest
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
        $staffId = $this->route('staff')->id ?? null;

        return [
            'name' => 'sometimes|string|max:255',
            'email' => 'nullable|email|unique:staff,email,' . $staffId,
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
            'name.max' => 'Staff name cannot exceed 255 characters.',
            'email.email' => 'Please provide a valid email address.',
            'email.unique' => 'This email is already registered.',
        ];
    }
}

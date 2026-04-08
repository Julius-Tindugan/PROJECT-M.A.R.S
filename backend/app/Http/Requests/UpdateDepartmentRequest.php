<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDepartmentRequest extends FormRequest
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
        $departmentId = $this->route('department')->id ?? null;

        return [
            'name' => 'sometimes|string|max:255|unique:departments,name,' . $departmentId,
            'active' => 'sometimes|boolean',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'name.unique' => 'This department already exists.',
            'name.max' => 'Department name cannot exceed 255 characters.',
        ];
    }
}

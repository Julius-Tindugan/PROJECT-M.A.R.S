<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTaskRequest extends FormRequest
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
            'description' => 'sometimes|string|max:1000',
            'department' => 'sometimes|string|max:255',
            'department_id' => 'sometimes|integer|exists:departments,id',
            'category' => 'sometimes|string|max:255',
            'category_id' => 'sometimes|integer|exists:categories,id',
            'staff' => 'sometimes|string|max:255',
            'staff_id' => 'sometimes|integer|exists:staff,id',
            'priority' => 'sometimes|string|in:Low,Medium,High,Critical',
            'priority_id' => 'sometimes|integer|exists:priorities,id',
            'status' => 'sometimes|string|in:Pending,In Progress,Completed',
            'status_id' => 'sometimes|integer|exists:statuses,id',
            'requester' => 'nullable|string|max:255',
            'date' => 'sometimes|date',
            'starttime' => 'nullable|date_format:H:i',
            'endtime' => 'nullable|date_format:H:i',
            'remarks' => 'nullable|string|max:2000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'description.max' => 'Description cannot exceed 1000 characters.',
            'date.date' => 'Please provide a valid date.',
            'starttime.date_format' => 'Start time must be in HH:MM format.',
            'endtime.date_format' => 'End time must be in HH:MM format.',
            'priority.in' => 'Priority must be Low, Medium, High, or Critical.',
            'status.in' => 'Status must be Pending, In Progress, or Completed.',
        ];
    }
}

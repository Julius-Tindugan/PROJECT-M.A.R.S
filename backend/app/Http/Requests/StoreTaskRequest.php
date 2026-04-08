<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTaskRequest extends FormRequest
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
            'description' => 'required|string|max:1000',
            'department' => 'required_without:department_id|string|max:255',
            'department_id' => 'required_without:department|integer|exists:departments,id',
            'category' => 'required_without:category_id|string|max:255',
            'category_id' => 'required_without:category|integer|exists:categories,id',
            'staff' => 'required_without:staff_id|string|max:255',
            'staff_id' => 'required_without:staff|integer|exists:staff,id',
            'priority' => 'sometimes|string|in:Low,Medium,High,Critical',
            'priority_id' => 'sometimes|integer|exists:priorities,id',
            'status' => 'sometimes|string|in:Pending,In Progress,Completed',
            'status_id' => 'sometimes|integer|exists:statuses,id',
            'requester' => 'nullable|string|max:255',
            'date' => 'required|date',
            'starttime' => 'nullable|date_format:H:i',
            'endtime' => 'nullable|date_format:H:i|after_or_equal:starttime',
            'remarks' => 'nullable|string|max:2000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'description.required' => 'Task description is required.',
            'description.max' => 'Description cannot exceed 1000 characters.',
            'department.required_without' => 'Department is required.',
            'category.required_without' => 'Category is required.',
            'staff.required_without' => 'Staff member is required.',
            'date.required' => 'Task date is required.',
            'date.date' => 'Please provide a valid date.',
            'starttime.date_format' => 'Start time must be in HH:MM format.',
            'endtime.date_format' => 'End time must be in HH:MM format.',
            'endtime.after_or_equal' => 'End time must be after or equal to start time.',
            'priority.in' => 'Priority must be Low, Medium, High, or Critical.',
            'status.in' => 'Status must be Pending, In Progress, or Completed.',
        ];
    }
}

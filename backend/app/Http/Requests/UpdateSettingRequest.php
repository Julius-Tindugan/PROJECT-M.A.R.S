<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateSettingRequest extends FormRequest
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
        $settingId = $this->route('setting')->id ?? null;

        return [
            'key' => 'sometimes|string|max:255|unique:settings,key,' . $settingId,
            'value' => 'sometimes',
            'type' => 'sometimes|in:string,integer,float,boolean,json',
            'description' => 'nullable|string',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'key.unique' => 'This setting key already exists.',
            'type.in' => 'Setting type must be one of: string, integer, float, boolean, json.',
        ];
    }
}

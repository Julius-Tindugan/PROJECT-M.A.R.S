<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreSettingRequest extends FormRequest
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
            'key' => 'required|string|max:255|unique:settings,key',
            'value' => 'required',
            'type' => 'required|in:string,integer,float,boolean,json',
            'description' => 'nullable|string',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'key.required' => 'Setting key is required.',
            'key.unique' => 'This setting key already exists.',
            'value.required' => 'Setting value is required.',
            'type.required' => 'Setting type is required.',
            'type.in' => 'Setting type must be one of: string, integer, float, boolean, json.',
        ];
    }
}

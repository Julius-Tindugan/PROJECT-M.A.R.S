<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Get all settings.
     */
    public function index(): JsonResponse
    {
        $settings = Setting::all()->map(fn($s) => [
            'id' => $s->id,
            'key' => $s->key,
            'value' => $s->typed_value,
            'type' => $s->type,
            'description' => $s->description,
        ]);

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Get a specific setting by key.
     */
    public function show(string $key): JsonResponse
    {
        $setting = Setting::where('key', $key)->first();

        if (!$setting) {
            return response()->json([
                'success' => false,
                'message' => 'Setting not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'key' => $setting->key,
                'value' => $setting->typed_value,
                'type' => $setting->type,
                'description' => $setting->description,
            ],
        ]);
    }

    /**
     * Update a setting.
     */
    public function update(Request $request, string $key): JsonResponse
    {
        $request->validate([
            'value' => 'required',
        ]);

        $setting = Setting::where('key', $key)->first();

        if (!$setting) {
            return response()->json([
                'success' => false,
                'message' => 'Setting not found',
            ], 404);
        }

        $setting->setTypedValue($request->value);
        $setting->save();

        return response()->json([
            'success' => true,
            'message' => 'Setting updated successfully',
            'data' => [
                'key' => $setting->key,
                'value' => $setting->typed_value,
            ],
        ]);
    }

    /**
     * Create or update a setting (upsert).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'key' => 'required|string|max:255',
            'value' => 'required',
            'type' => 'sometimes|string|in:string,integer,boolean,json,float',
            'description' => 'nullable|string|max:1000',
        ]);

        $setting = Setting::setValue(
            $validated['key'],
            $validated['value'],
            $validated['type'] ?? 'string',
            $validated['description'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'Setting saved successfully',
            'data' => [
                'key' => $setting->key,
                'value' => $setting->typed_value,
                'type' => $setting->type,
            ],
        ], 201);
    }

    /**
     * Delete a setting.
     */
    public function destroy(string $key): JsonResponse
    {
        $setting = Setting::where('key', $key)->first();

        if (!$setting) {
            return response()->json([
                'success' => false,
                'message' => 'Setting not found',
            ], 404);
        }

        $setting->delete();

        return response()->json([
            'success' => true,
            'message' => 'Setting deleted successfully',
        ]);
    }

    /**
     * Get all settings as key-value pairs.
     */
    public function all(): JsonResponse
    {
        return response()->json(Setting::getAllAsArray());
    }
}

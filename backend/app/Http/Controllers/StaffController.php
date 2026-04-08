<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreStaffRequest;
use App\Http\Requests\UpdateStaffRequest;
use App\Models\Staff;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    /**
     * Get all staff members.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Staff::query();

        // Filter by active status
        if ($request->has('active')) {
            $query->where('active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN));
        }

        // Order by name
        $query->orderBy('name', 'asc');

        $staff = $query->get();

        // Return as array of names for frontend compatibility
        if ($request->boolean('names_only', false)) {
            return response()->json($staff->pluck('name'));
        }

        return response()->json([
            'success' => true,
            'data' => $staff,
        ]);
    }

    /**
     * Create a new staff member.
     */
    public function store(StoreStaffRequest $request): JsonResponse
    {
        $staff = Staff::create([
            'name' => trim($request->name),
            'email' => $request->email,
            'phone' => $request->phone,
            'active' => $request->boolean('active', true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Staff member added successfully',
            'data' => $staff,
        ], 201);
    }

    /**
     * Get a specific staff member.
     */
    public function show(Staff $staff): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $staff->load('tasks'),
        ]);
    }

    /**
     * Update a staff member.
     */
    public function update(UpdateStaffRequest $request, Staff $staff): JsonResponse
    {
        if ($request->has('name')) {
            $staff->name = trim($request->name);
        }

        if ($request->has('email')) {
            $staff->email = $request->email;
        }

        if ($request->has('phone')) {
            $staff->phone = $request->phone;
        }

        if ($request->has('active')) {
            $staff->active = $request->boolean('active');
        }

        $staff->save();

        return response()->json([
            'success' => true,
            'message' => 'Staff member updated successfully',
            'data' => $staff,
        ]);
    }

    /**
     * Delete a staff member.
     */
    public function destroy(Staff $staff): JsonResponse
    {
        // Check if staff has tasks
        if ($staff->tasks()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete staff member with associated tasks. Deactivate instead.',
            ], 422);
        }

        $staff->delete();

        return response()->json([
            'success' => true,
            'message' => 'Staff member deleted successfully',
        ]);
    }

    /**
     * Get staff member statistics.
     */
    public function stats(Staff $staff): JsonResponse
    {
        $totalTasks = $staff->tasks()->count();
        $completedTasks = $staff->tasks()
            ->whereHas('status', fn($q) => $q->where('name', 'Completed'))
            ->count();
        $pendingTasks = $staff->tasks()
            ->whereHas('status', fn($q) => $q->where('name', 'Pending'))
            ->count();
        $inProgressTasks = $staff->tasks()
            ->whereHas('status', fn($q) => $q->where('name', 'In Progress'))
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $totalTasks,
                'completed' => $completedTasks,
                'pending' => $pendingTasks,
                'in_progress' => $inProgressTasks,
                'completion_rate' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0,
            ],
        ]);
    }
}

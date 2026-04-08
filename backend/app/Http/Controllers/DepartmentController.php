<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDepartmentRequest;
use App\Http\Requests\UpdateDepartmentRequest;
use App\Models\Department;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    /**
     * Get all departments.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Department::query();

        // Filter by active status
        if ($request->has('active')) {
            $query->where('active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN));
        }

        // Order by name
        $query->orderBy('name', 'asc');

        $departments = $query->get();

        // Return as array of names for frontend compatibility
        if ($request->boolean('names_only', false)) {
            return response()->json($departments->pluck('name'));
        }

        return response()->json([
            'success' => true,
            'data' => $departments,
        ]);
    }

    /**
     * Create a new department.
     */
    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        $department = Department::create([
            'name' => trim($request->name),
            'active' => $request->boolean('active', true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Department added successfully',
            'data' => $department,
        ], 201);
    }

    /**
     * Get a specific department.
     */
    public function show(Department $department): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $department->load('tasks'),
        ]);
    }

    /**
     * Update a department.
     */
    public function update(UpdateDepartmentRequest $request, Department $department): JsonResponse
    {
        if ($request->has('name')) {
            $department->name = trim($request->name);
        }

        if ($request->has('active')) {
            $department->active = $request->boolean('active');
        }

        $department->save();

        return response()->json([
            'success' => true,
            'message' => 'Department updated successfully',
            'data' => $department,
        ]);
    }

    /**
     * Delete a department.
     */
    public function destroy(Department $department): JsonResponse
    {
        // Check if department has tasks
        if ($department->tasks()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete department with associated tasks. Deactivate instead.',
            ], 422);
        }

        $department->delete();

        return response()->json([
            'success' => true,
            'message' => 'Department deleted successfully',
        ]);
    }

    /**
     * Get department statistics.
     */
    public function stats(Department $department): JsonResponse
    {
        $totalTasks = $department->tasks()->count();
        $completedTasks = $department->tasks()
            ->whereHas('status', fn($q) => $q->where('name', 'Completed'))
            ->count();
        $pendingTasks = $department->tasks()
            ->whereHas('status', fn($q) => $q->where('name', 'Pending'))
            ->count();
        $inProgressTasks = $department->tasks()
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

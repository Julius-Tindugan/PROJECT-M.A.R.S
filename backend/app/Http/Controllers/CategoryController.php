<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Get all categories.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Category::query();

        // Filter by active status
        if ($request->has('active')) {
            $query->where('active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN));
        }

        // Order by name
        $query->orderBy('name', 'asc');

        $categories = $query->get();

        // Return as array of names for frontend compatibility
        if ($request->boolean('names_only', false)) {
            return response()->json($categories->pluck('name'));
        }

        return response()->json([
            'success' => true,
            'data' => $categories,
        ]);
    }

    /**
     * Create a new category.
     */
    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::create([
            'name' => trim($request->name),
            'active' => $request->boolean('active', true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Category added successfully',
            'data' => $category,
        ], 201);
    }

    /**
     * Get a specific category.
     */
    public function show(Category $category): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $category->load('tasks'),
        ]);
    }

    /**
     * Update a category.
     */
    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        if ($request->has('name')) {
            $category->name = trim($request->name);
        }

        if ($request->has('active')) {
            $category->active = $request->boolean('active');
        }

        $category->save();

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully',
            'data' => $category,
        ]);
    }

    /**
     * Delete a category.
     */
    public function destroy(Category $category): JsonResponse
    {
        // Check if category has tasks
        if ($category->tasks()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category with associated tasks. Deactivate instead.',
            ], 422);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully',
        ]);
    }

    /**
     * Get category statistics.
     */
    public function stats(Category $category): JsonResponse
    {
        $totalTasks = $category->tasks()->count();
        $completedTasks = $category->tasks()
            ->whereHas('status', fn($q) => $q->where('name', 'Completed'))
            ->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total' => $totalTasks,
                'completed' => $completedTasks,
                'completion_rate' => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0,
            ],
        ]);
    }
}

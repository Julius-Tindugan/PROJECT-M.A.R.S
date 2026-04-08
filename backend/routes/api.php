<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SettingController;

/*
|--------------------------------------------------------------------------
| API Routes for M.A.R.S (Maintenance, Analytics, & Recording System)
|--------------------------------------------------------------------------
*/

// ============================================================
// API ROOT - Welcome/Status Endpoint
// ============================================================

Route::get('/', function () {
    return response()->json([
        'success' => true,
        'application' => 'M.A.R.S',
        'fullName' => 'Maintenance, Analytics, & Recording System',
        'version' => '1.0.0',
        'status' => 'operational',
        'endpoints' => [
            'dashboard' => '/api/dashboard/*',
            'tasks' => '/api/tasks',
            'departments' => '/api/departments',
            'categories' => '/api/categories',
            'staff' => '/api/staff',
            'reports' => '/api/reports',
            'settings' => '/api/settings',
        ],
        'documentation' => [
            'dashboard' => [
                'GET /api/dashboard/stats' => 'Get dashboard statistics',
                'GET /api/dashboard/weekly-trends' => 'Get weekly trends',
                'GET /api/dashboard/monthly-trends' => 'Get monthly trends',
                'GET /api/dashboard/category-distribution' => 'Get category distribution',
                'GET /api/dashboard/department-rankings' => 'Get department rankings',
                'GET /api/dashboard/pending-tasks' => 'Get pending tasks summary',
                'GET /api/dashboard/today' => 'Get today\'s summary',
            ],
            'tasks' => [
                'GET /api/tasks' => 'Get all tasks (with filtering & pagination)',
                'POST /api/tasks' => 'Create a new task',
                'GET /api/tasks/{id}' => 'Get specific task',
                'PUT /api/tasks/{id}' => 'Update a task',
                'DELETE /api/tasks/{id}' => 'Delete a task',
                'GET /api/tasks/pending' => 'Get pending tasks',
                'GET /api/tasks/recent' => 'Get recent tasks',
            ],
        ],
        'timestamp' => now()->toIso8601String(),
    ]);
});

// ============================================================
// DASHBOARD ROUTES
// ============================================================

Route::prefix('dashboard')->group(function () {
    Route::get('/stats', [DashboardController::class, 'stats']);
    Route::get('/weekly-trends', [DashboardController::class, 'weeklyTrends']);
    Route::get('/monthly-trends', [DashboardController::class, 'monthlyTrends']);
    Route::get('/category-distribution', [DashboardController::class, 'categoryDistribution']);
    Route::get('/departments', [DashboardController::class, 'departments']);
    Route::get('/department-rankings', [DashboardController::class, 'departmentRankings']);
    Route::get('/pending-tasks', [DashboardController::class, 'pendingTasks']);
    Route::get('/today', [DashboardController::class, 'todaySummary']);
});

// ============================================================
// TASKS ROUTES
// ============================================================

Route::prefix('tasks')->group(function () {
    Route::get('/', [TaskController::class, 'index']);
    Route::post('/', [TaskController::class, 'store']);
    Route::get('/pending', [TaskController::class, 'pending']);
    Route::get('/recent', [TaskController::class, 'recent']);
    Route::get('/by-date', [TaskController::class, 'getByDate']);
    Route::get('/date-range', [TaskController::class, 'getByDateRange']);
    Route::get('/{task}', [TaskController::class, 'show']);
    Route::put('/{task}', [TaskController::class, 'update']);
    Route::patch('/{task}', [TaskController::class, 'update']);
    Route::delete('/{task}', [TaskController::class, 'destroy']);
    Route::patch('/{task}/status', [TaskController::class, 'updateStatus']);
});

// ============================================================
// DEPARTMENTS ROUTES
// ============================================================

Route::prefix('departments')->group(function () {
    Route::get('/', [DepartmentController::class, 'index']);
    Route::post('/', [DepartmentController::class, 'store']);
    Route::get('/{department}', [DepartmentController::class, 'show']);
    Route::put('/{department}', [DepartmentController::class, 'update']);
    Route::patch('/{department}', [DepartmentController::class, 'update']);
    Route::delete('/{department}', [DepartmentController::class, 'destroy']);
    Route::get('/{department}/stats', [DepartmentController::class, 'stats']);
});

// ============================================================
// CATEGORIES ROUTES
// ============================================================

Route::prefix('categories')->group(function () {
    Route::get('/', [CategoryController::class, 'index']);
    Route::post('/', [CategoryController::class, 'store']);
    Route::get('/{category}', [CategoryController::class, 'show']);
    Route::put('/{category}', [CategoryController::class, 'update']);
    Route::patch('/{category}', [CategoryController::class, 'update']);
    Route::delete('/{category}', [CategoryController::class, 'destroy']);
    Route::get('/{category}/stats', [CategoryController::class, 'stats']);
});

// ============================================================
// STAFF ROUTES
// ============================================================

Route::prefix('staff')->group(function () {
    Route::get('/', [StaffController::class, 'index']);
    Route::post('/', [StaffController::class, 'store']);
    Route::get('/{staff}', [StaffController::class, 'show']);
    Route::put('/{staff}', [StaffController::class, 'update']);
    Route::patch('/{staff}', [StaffController::class, 'update']);
    Route::delete('/{staff}', [StaffController::class, 'destroy']);
    Route::get('/{staff}/stats', [StaffController::class, 'stats']);
});

// ============================================================
// REPORTS ROUTES
// ============================================================

Route::prefix('reports')->group(function () {
    Route::get('/item-rankings', [ReportController::class, 'itemRankings']);
    Route::get('/staff-performance', [ReportController::class, 'staffPerformance']);
    Route::get('/department-load', [ReportController::class, 'departmentLoad']);
    Route::get('/priority-distribution', [ReportController::class, 'priorityDistribution']);
    Route::get('/status-distribution', [ReportController::class, 'statusDistribution']);
    Route::get('/daily-trends', [ReportController::class, 'dailyTrends']);
    Route::get('/comprehensive', [ReportController::class, 'comprehensive']);
});

// ============================================================
// SETTINGS ROUTES
// ============================================================

Route::prefix('settings')->group(function () {
    Route::get('/', [SettingController::class, 'index']);
    Route::get('/all', [SettingController::class, 'all']);
    Route::post('/', [SettingController::class, 'store']);
    Route::get('/{key}', [SettingController::class, 'show']);
    Route::put('/{key}', [SettingController::class, 'update']);
    Route::delete('/{key}', [SettingController::class, 'destroy']);
});

// ============================================================
// UTILITY ROUTES
// ============================================================

Route::get('/priorities', function () {
    return response()->json(\App\Models\Priority::ordered()->get());
});

Route::get('/statuses', function () {
    return response()->json(\App\Models\Status::ordered()->get());
});

// Health check endpoint
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toIso8601String(),
        'service' => 'M.A.R.S API',
    ]);
});

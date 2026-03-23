<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::get('/dashboard/stats', function () {
    return response()->json([
        'totalTasks' => 487,
        'totalTasksTrend' => '+12% from last month',
        'mostFrequentIssue' => 'Printer Repair',
        'mostFrequentIssueCount' => 45,
        'topDepartment' => 'IT Support',
        'topDepartmentReports' => 145,
        'pending' => 89,
        'completed' => 398,
        'completionRate' => 81,
        'avgResponseTime' => '2.4 hrs',
        'resolutionRate' => '94.2%',
        'customerSatisfaction' => '4.8/5.0',
    ]);
});

Route::get('/dashboard/weekly-trends', function () {
    return response()->json([
        ['day' => 'Mon', 'tasks' => 24, 'resolved' => 18],
        ['day' => 'Tue', 'tasks' => 32, 'resolved' => 25],
        ['day' => 'Wed', 'tasks' => 28, 'resolved' => 22],
        ['day' => 'Thu', 'tasks' => 35, 'resolved' => 28],
        ['day' => 'Fri', 'tasks' => 42, 'resolved' => 35],
        ['day' => 'Sat', 'tasks' => 18, 'resolved' => 15],
        ['day' => 'Sun', 'tasks' => 12, 'resolved' => 10],
    ]);
});

Route::get('/dashboard/departments', function () {
    return response()->json([
        ['dept' => 'IT Support', 'volume' => 145],
        ['dept' => 'Network', 'volume' => 98],
        ['dept' => 'Hardware', 'volume' => 112],
        ['dept' => 'Software', 'volume' => 87],
        ['dept' => 'Infrastructure', 'volume' => 65],
    ]);
});

Route::post('/tasks', function (Request $request) {
    // Handle task creation
    $validated = $request->validate([
        'title' => 'required|string|max:255',
        'description' => 'nullable|string',
        'department' => 'required|string',
        'priority' => 'required|in:low,medium,high,critical',
    ]);

    // For now, just return success (add database logic later)
    return response()->json([
        'success' => true,
        'message' => 'Task created successfully',
        'task' => $validated,
    ], 201);
});

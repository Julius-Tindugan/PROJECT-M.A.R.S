<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\MetadataController;
use App\Http\Controllers\Api\TaskController;
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

Route::get('/tasks', [TaskController::class, 'index']);
Route::post('/tasks', [TaskController::class, 'store']);
Route::patch('/tasks/{taskCode}/status', [TaskController::class, 'updateStatus']);

Route::get('/dashboard/stats', [AnalyticsController::class, 'dashboardStats']);
Route::get('/dashboard/weekly-trends', [AnalyticsController::class, 'weeklyTrends']);
Route::get('/dashboard/monthly-trends', [AnalyticsController::class, 'monthlyTrends']);
Route::get('/dashboard/departments', [AnalyticsController::class, 'departments']);

Route::get('/analytics/categories', [AnalyticsController::class, 'categoryDistribution']);

Route::get('/rankings/departments', [AnalyticsController::class, 'departmentRankings']);
Route::get('/rankings/items', [AnalyticsController::class, 'itemRankings']);

Route::post('/metadata/reset', [MetadataController::class, 'reset']);
Route::get('/metadata/{type}', [MetadataController::class, 'index']);
Route::post('/metadata/{type}', [MetadataController::class, 'store']);
Route::put('/metadata/{type}/{id}', [MetadataController::class, 'update']);
Route::delete('/metadata/{type}/{id}', [MetadataController::class, 'destroy']);

<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Department;
use App\Models\Category;
use App\Models\Staff;
use App\Models\Status;
use App\Models\Priority;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics.
     */
    public function stats(): JsonResponse
    {
        // Total tasks
        $totalTasks = Task::count();

        // Get last month's task count for trend calculation
        $lastMonthTasks = Task::where('created_at', '<', Carbon::now()->startOfMonth())
            ->where('created_at', '>=', Carbon::now()->subMonth()->startOfMonth())
            ->count();

        $thisMonthTasks = Task::where('created_at', '>=', Carbon::now()->startOfMonth())->count();

        $trend = $lastMonthTasks > 0
            ? round((($thisMonthTasks - $lastMonthTasks) / $lastMonthTasks) * 100)
            : 0;

        $trendText = $trend >= 0 ? "+{$trend}% from last month" : "{$trend}% from last month";

        // Task counts by status
        $statusCounts = Task::select('status_id', DB::raw('count(*) as count'))
            ->groupBy('status_id')
            ->get()
            ->keyBy('status_id');

        $pendingStatus = Status::where('name', 'Pending')->first();
        $inProgressStatus = Status::where('name', 'In Progress')->first();
        $completedStatus = Status::where('name', 'Completed')->first();

        $pending = $statusCounts->get($pendingStatus?->id)?->count ?? 0;
        $inProgress = $statusCounts->get($inProgressStatus?->id)?->count ?? 0;
        $completed = $statusCounts->get($completedStatus?->id)?->count ?? 0;

        // Completion rate
        $completionRate = $totalTasks > 0 ? round(($completed / $totalTasks) * 100) : 0;

        // Most frequent issue (category)
        $topCategory = Task::select('category_id', DB::raw('count(*) as count'))
            ->groupBy('category_id')
            ->orderBy('count', 'desc')
            ->first();

        $mostFrequentIssue = $topCategory ? Category::find($topCategory->category_id)?->name : 'N/A';
        $mostFrequentIssueCount = $topCategory?->count ?? 0;

        // Top department
        $topDepartment = Task::select('department_id', DB::raw('count(*) as count'))
            ->groupBy('department_id')
            ->orderBy('count', 'desc')
            ->first();

        $topDeptName = $topDepartment ? Department::find($topDepartment->department_id)?->name : 'N/A';
        $topDeptReports = $topDepartment?->count ?? 0;

        // Average response time (from creation to completion)
        $avgResponseMinutes = Task::whereNotNull('starttime')
            ->whereNotNull('endtime')
            ->whereHas('status', fn($q) => $q->where('name', 'Completed'))
            ->get()
            ->filter(fn($t) => $t->duration_minutes !== null)
            ->avg('duration_minutes');

        $avgResponseTime = $avgResponseMinutes
            ? $this->formatDuration($avgResponseMinutes)
            : '0h';

        // Daily average
        $daysWithTasks = Task::selectRaw('DATE(date) as task_date')
            ->groupBy('task_date')
            ->get()
            ->count();

        $dailyAverage = $daysWithTasks > 0 ? round($totalTasks / $daysWithTasks) : 0;

        return response()->json([
            'totalTasks' => $totalTasks,
            'totalTasksTrend' => $trendText,
            'mostFrequentIssue' => $mostFrequentIssue,
            'mostFrequentIssueCount' => $mostFrequentIssueCount,
            'topDepartment' => $topDeptName,
            'topDepartmentReports' => $topDeptReports,
            'pending' => $pending,
            'inProgress' => $inProgress,
            'completed' => $completed,
            'completionRate' => $completionRate,
            'avgResponseTime' => $avgResponseTime,
            'dailyAverage' => $dailyAverage,
            'resolutionRate' => "{$completionRate}%",
            'customerSatisfaction' => 'N/A',
        ]);
    }

    /**
     * Get weekly task trends.
     */
    public function weeklyTrends(): JsonResponse
    {
        $days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        $trends = [];

        // Get data for the past week
        $startOfWeek = Carbon::now()->startOfWeek();

        foreach ($days as $index => $day) {
            $date = $startOfWeek->copy()->addDays($index);

            $tasksCount = Task::whereDate('date', $date)->count();
            $resolvedCount = Task::whereDate('date', $date)
                ->whereHas('status', fn($q) => $q->where('name', 'Completed'))
                ->count();

            $trends[] = [
                'day' => $day,
                'tasks' => $tasksCount,
                'resolved' => $resolvedCount,
            ];
        }

        return response()->json($trends);
    }

    /**
     * Get monthly task trends.
     */
    public function monthlyTrends(Request $request): JsonResponse
    {
        $months = $request->get('months', 6);
        $trends = [];

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();

            $tasksCount = Task::whereBetween('date', [$startOfMonth, $endOfMonth])->count();
            $resolvedCount = Task::whereBetween('date', [$startOfMonth, $endOfMonth])
                ->whereHas('status', fn($q) => $q->where('name', 'Completed'))
                ->count();

            $trends[] = [
                'month' => $date->format('M'),
                'tasks' => $tasksCount,
                'resolved' => $resolvedCount,
            ];
        }

        return response()->json($trends);
    }

    /**
     * Get category distribution.
     */
    public function categoryDistribution(): JsonResponse
    {
        $colors = ['#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#ef4444', '#6366f1', '#14b8a6'];

        $categories = Task::select('category_id', DB::raw('count(*) as count'))
            ->groupBy('category_id')
            ->orderBy('count', 'desc')
            ->get();

        $total = $categories->sum('count');

        $distribution = $categories->map(function ($item, $index) use ($total, $colors) {
            $category = Category::find($item->category_id);
            return [
                'category' => $category?->name ?? 'Unknown',
                'count' => $item->count,
                'percentage' => $total > 0 ? round(($item->count / $total) * 100) : 0,
                'color' => $colors[$index % count($colors)],
            ];
        })->values();

        return response()->json($distribution);
    }

    /**
     * Get department task volumes for dashboard.
     */
    public function departments(): JsonResponse
    {
        $departments = Task::select('department_id', DB::raw('count(*) as volume'))
            ->groupBy('department_id')
            ->orderBy('volume', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($item) {
                $dept = Department::find($item->department_id);
                return [
                    'dept' => $dept?->name ?? 'Unknown',
                    'volume' => $item->volume,
                ];
            });

        return response()->json($departments);
    }

    /**
     * Get department rankings with heat levels.
     */
    public function departmentRankings(): JsonResponse
    {
        // Get status IDs
        $completedStatusId = Status::where('name', 'Completed')->value('id');
        $pendingStatusId = Status::where('name', 'Pending')->value('id');
        $inProgressStatusId = Status::where('name', 'In Progress')->value('id');

        // Get task counts per department
        $deptStats = Task::select(
            'department_id',
            DB::raw('count(*) as total'),
            DB::raw("SUM(CASE WHEN status_id = {$completedStatusId} THEN 1 ELSE 0 END) as completed"),
            DB::raw("SUM(CASE WHEN status_id = {$pendingStatusId} THEN 1 ELSE 0 END) as pending"),
            DB::raw("SUM(CASE WHEN status_id = {$inProgressStatusId} THEN 1 ELSE 0 END) as in_progress")
        )
            ->groupBy('department_id')
            ->orderBy('total', 'desc')
            ->get();

        // Calculate average resolution time per department
        $avgTimes = [];
        foreach ($deptStats as $stat) {
            $avgMinutes = Task::where('department_id', $stat->department_id)
                ->whereNotNull('starttime')
                ->whereNotNull('endtime')
                ->get()
                ->filter(fn($t) => $t->duration_minutes !== null)
                ->avg('duration_minutes');

            $avgTimes[$stat->department_id] = $avgMinutes ?? 0;
        }

        // Determine heat level thresholds
        $maxTotal = $deptStats->max('total') ?? 0;
        $criticalThreshold = $maxTotal * 0.8;
        $highThreshold = $maxTotal * 0.6;
        $mediumThreshold = $maxTotal * 0.3;

        $rankings = $deptStats->map(function ($stat, $index) use ($avgTimes, $criticalThreshold, $highThreshold, $mediumThreshold) {
            $dept = Department::find($stat->department_id);
            $avgMinutes = $avgTimes[$stat->department_id] ?? 0;

            // Determine heat level based on total reports
            $heatLevel = 'low';
            if ($stat->total >= $criticalThreshold) {
                $heatLevel = 'critical';
            } elseif ($stat->total >= $highThreshold) {
                $heatLevel = 'high';
            } elseif ($stat->total >= $mediumThreshold) {
                $heatLevel = 'medium';
            }

            return [
                'rank' => $index + 1,
                'department' => $dept?->name ?? 'Unknown',
                'totalReports' => $stat->total,
                'resolved' => (int) $stat->completed,
                'pending' => (int) $stat->pending,
                'inProgress' => (int) $stat->in_progress,
                'avgResolutionTime' => $this->formatDuration($avgMinutes),
                'heatLevel' => $heatLevel,
            ];
        })->values();

        return response()->json($rankings);
    }

    /**
     * Get pending tasks for dashboard.
     */
    public function pendingTasks(): JsonResponse
    {
        // Get critical and high priority IDs for ordering
        $criticalPriorityId = Priority::where('name', 'Critical')->value('id') ?? 0;
        $highPriorityId = Priority::where('name', 'High')->value('id') ?? 0;
        $mediumPriorityId = Priority::where('name', 'Medium')->value('id') ?? 0;

        $tasks = Task::with(['department', 'category', 'staff', 'priority', 'status'])
            ->pending()
            ->orderByRaw("CASE
                WHEN priority_id = {$criticalPriorityId} THEN 1
                WHEN priority_id = {$highPriorityId} THEN 2
                WHEN priority_id = {$mediumPriorityId} THEN 3
                ELSE 4
            END")
            ->orderBy('date', 'asc')
            ->limit(10)
            ->get()
            ->map(fn($task) => [
                'id' => $task->taskid,
                'description' => $task->description,
                'department' => $task->department->name,
                'category' => $task->category->name,
                'staffName' => $task->staff->name,
                'priority' => $task->priority->name,
                'status' => $task->status->name,
                'date' => $task->date->format('Y-m-d'),
            ]);

        return response()->json($tasks);
    }

    /**
     * Get today's summary.
     */
    public function todaySummary(): JsonResponse
    {
        $today = Carbon::today();

        $totalToday = Task::whereDate('date', $today)->count();
        $completedToday = Task::whereDate('date', $today)
            ->whereHas('status', fn($q) => $q->where('name', 'Completed'))
            ->count();
        $pendingToday = Task::whereDate('date', $today)
            ->whereHas('status', fn($q) => $q->where('name', 'Pending'))
            ->count();
        $inProgressToday = Task::whereDate('date', $today)
            ->whereHas('status', fn($q) => $q->where('name', 'In Progress'))
            ->count();

        return response()->json([
            'date' => $today->format('Y-m-d'),
            'total' => $totalToday,
            'completed' => $completedToday,
            'pending' => $pendingToday,
            'inProgress' => $inProgressToday,
        ]);
    }

    /**
     * Format duration in minutes to human-readable string.
     */
    private function formatDuration(float $minutes): string
    {
        if ($minutes <= 0) {
            return '0h';
        }

        $hours = floor($minutes / 60);
        $mins = round($minutes % 60);

        if ($hours > 0 && $mins > 0) {
            return "{$hours}.{$mins} hrs";
        } elseif ($hours > 0) {
            return "{$hours} hrs";
        } else {
            return "{$mins} mins";
        }
    }
}

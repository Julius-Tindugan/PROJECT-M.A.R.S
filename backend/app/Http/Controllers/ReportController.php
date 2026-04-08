<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Department;
use App\Models\Category;
use App\Models\Staff;
use App\Models\Status;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReportController extends Controller
{
    /**
     * Get item rankings (most frequently reported items).
     */
    public function itemRankings(): JsonResponse
    {
        // Group by description + category to identify frequently reported items
        $items = Task::select(
            'description',
            'category_id',
            'department_id',
            DB::raw('count(*) as count'),
            DB::raw('MAX(date) as last_reported')
        )
            ->groupBy('description', 'category_id', 'department_id')
            ->orderBy('count', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($item, $index) {
                $category = Category::find($item->category_id);
                $department = Department::find($item->department_id);

                // Create a short item name from description
                $description = $item->description;
                $shortName = strlen($description) > 40
                    ? substr($description, 0, 40) . '...'
                    : $description;

                // Add department context if available
                $itemName = $department
                    ? "{$shortName} - {$department->name}"
                    : $shortName;

                return [
                    'rank' => $index + 1,
                    'item' => $itemName,
                    'category' => $category?->name ?? 'Unknown',
                    'reportCount' => $item->count,
                    'lastReported' => $item->last_reported,
                ];
            });

        return response()->json($items);
    }

    /**
     * Get staff performance report.
     */
    public function staffPerformance(): JsonResponse
    {
        $staffStats = Staff::with(['tasks' => function ($query) {
            $query->with(['status', 'priority']);
        }])->get()->map(function ($staff) {
            $tasks = $staff->tasks;
            $total = $tasks->count();
            $completed = $tasks->filter(fn($t) => $t->status?->name === 'Completed')->count();
            $pending = $tasks->filter(fn($t) => $t->status?->name === 'Pending')->count();
            $inProgress = $tasks->filter(fn($t) => $t->status?->name === 'In Progress')->count();

            // Calculate average resolution time
            $completedWithTime = $tasks->filter(fn($t) =>
                $t->status?->name === 'Completed' && $t->duration_minutes !== null
            );
            $avgTime = $completedWithTime->count() > 0
                ? $completedWithTime->avg('duration_minutes')
                : 0;

            return [
                'id' => $staff->id,
                'name' => $staff->name,
                'totalTasks' => $total,
                'completed' => $completed,
                'pending' => $pending,
                'inProgress' => $inProgress,
                'completionRate' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
                'avgResolutionTime' => $this->formatDuration($avgTime),
            ];
        })->sortByDesc('totalTasks')->values();

        return response()->json($staffStats);
    }

    /**
     * Get department load analysis report.
     */
    public function departmentLoad(Request $request): JsonResponse
    {
        $period = $request->get('period', 'month'); // week, month, quarter, year

        $startDate = match ($period) {
            'week' => Carbon::now()->startOfWeek(),
            'month' => Carbon::now()->startOfMonth(),
            'quarter' => Carbon::now()->startOfQuarter(),
            'year' => Carbon::now()->startOfYear(),
            default => Carbon::now()->startOfMonth(),
        };

        $departments = Department::active()->get()->map(function ($dept) use ($startDate) {
            $tasks = Task::where('department_id', $dept->id)
                ->where('date', '>=', $startDate)
                ->get();

            $total = $tasks->count();
            $completed = $tasks->filter(fn($t) => $t->status?->name === 'Completed')->count();
            $pending = $tasks->filter(fn($t) => $t->status?->name === 'Pending')->count();
            $inProgress = $tasks->filter(fn($t) => $t->status?->name === 'In Progress')->count();

            // Get category breakdown
            $categoryBreakdown = $tasks->groupBy('category_id')->map(function ($group, $categoryId) {
                $category = Category::find($categoryId);
                return [
                    'category' => $category?->name ?? 'Unknown',
                    'count' => $group->count(),
                ];
            })->values();

            return [
                'department' => $dept->name,
                'total' => $total,
                'completed' => $completed,
                'pending' => $pending,
                'inProgress' => $inProgress,
                'completionRate' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
                'categoryBreakdown' => $categoryBreakdown,
            ];
        })->sortByDesc('total')->values();

        return response()->json($departments);
    }

    /**
     * Get priority distribution report.
     */
    public function priorityDistribution(Request $request): JsonResponse
    {
        $period = $request->get('period', 'month');

        $startDate = match ($period) {
            'week' => Carbon::now()->startOfWeek(),
            'month' => Carbon::now()->startOfMonth(),
            'quarter' => Carbon::now()->startOfQuarter(),
            'year' => Carbon::now()->startOfYear(),
            default => Carbon::now()->startOfMonth(),
        };

        $colors = [
            'Low' => '#10b981',
            'Medium' => '#f59e0b',
            'High' => '#f97316',
            'Critical' => '#ef4444',
        ];

        $distribution = Task::select('priority_id', DB::raw('count(*) as count'))
            ->where('date', '>=', $startDate)
            ->groupBy('priority_id')
            ->get()
            ->map(function ($item) use ($colors) {
                $priority = \App\Models\Priority::find($item->priority_id);
                $name = $priority?->name ?? 'Unknown';

                return [
                    'priority' => $name,
                    'count' => $item->count,
                    'color' => $colors[$name] ?? '#6b7280',
                ];
            });

        $total = $distribution->sum('count');
        $distribution = $distribution->map(function ($item) use ($total) {
            $item['percentage'] = $total > 0 ? round(($item['count'] / $total) * 100) : 0;
            return $item;
        });

        return response()->json($distribution);
    }

    /**
     * Get status distribution report.
     */
    public function statusDistribution(): JsonResponse
    {
        $colors = [
            'Pending' => '#f59e0b',
            'In Progress' => '#3b82f6',
            'Completed' => '#10b981',
        ];

        $distribution = Task::select('status_id', DB::raw('count(*) as count'))
            ->groupBy('status_id')
            ->get()
            ->map(function ($item) use ($colors) {
                $status = Status::find($item->status_id);
                $name = $status?->name ?? 'Unknown';

                return [
                    'status' => $name,
                    'count' => $item->count,
                    'color' => $colors[$name] ?? '#6b7280',
                ];
            });

        $total = $distribution->sum('count');
        $distribution = $distribution->map(function ($item) use ($total) {
            $item['percentage'] = $total > 0 ? round(($item['count'] / $total) * 100) : 0;
            return $item;
        });

        return response()->json($distribution);
    }

    /**
     * Get daily task trends for a specific period.
     */
    public function dailyTrends(Request $request): JsonResponse
    {
        $days = $request->get('days', 30);
        $trends = [];

        for ($i = $days - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subDays($i);

            $tasksCount = Task::whereDate('date', $date)->count();
            $resolvedCount = Task::whereDate('date', $date)
                ->whereHas('status', fn($q) => $q->where('name', 'Completed'))
                ->count();

            $trends[] = [
                'date' => $date->format('Y-m-d'),
                'label' => $date->format('M d'),
                'tasks' => $tasksCount,
                'resolved' => $resolvedCount,
            ];
        }

        return response()->json($trends);
    }

    /**
     * Generate comprehensive report.
     */
    public function comprehensive(Request $request): JsonResponse
    {
        $startDate = $request->get('start_date', Carbon::now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

        // Total stats
        $tasks = Task::whereBetween('date', [$startDate, $endDate])->get();
        $total = $tasks->count();
        $completed = $tasks->filter(fn($t) => $t->status?->name === 'Completed')->count();
        $pending = $tasks->filter(fn($t) => $t->status?->name === 'Pending')->count();
        $inProgress = $tasks->filter(fn($t) => $t->status?->name === 'In Progress')->count();

        // By department
        $byDepartment = $tasks->groupBy('department_id')->map(function ($group, $deptId) {
            $dept = Department::find($deptId);
            return [
                'department' => $dept?->name ?? 'Unknown',
                'count' => $group->count(),
            ];
        })->sortByDesc('count')->values()->take(10);

        // By category
        $byCategory = $tasks->groupBy('category_id')->map(function ($group, $catId) {
            $cat = Category::find($catId);
            return [
                'category' => $cat?->name ?? 'Unknown',
                'count' => $group->count(),
            ];
        })->sortByDesc('count')->values()->take(10);

        // By staff
        $byStaff = $tasks->groupBy('staff_id')->map(function ($group, $staffId) {
            $staff = Staff::find($staffId);
            $completed = $group->filter(fn($t) => $t->status?->name === 'Completed')->count();
            return [
                'staff' => $staff?->name ?? 'Unknown',
                'total' => $group->count(),
                'completed' => $completed,
            ];
        })->sortByDesc('total')->values();

        return response()->json([
            'period' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
            'summary' => [
                'total' => $total,
                'completed' => $completed,
                'pending' => $pending,
                'inProgress' => $inProgress,
                'completionRate' => $total > 0 ? round(($completed / $total) * 100, 1) : 0,
            ],
            'byDepartment' => $byDepartment,
            'byCategory' => $byCategory,
            'byStaff' => $byStaff,
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

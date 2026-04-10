<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * @var list<string>
     */
    private array $chartPalette = [
        '#f59e0b',
        '#3b82f6',
        '#10b981',
        '#8b5cf6',
        '#ec4899',
        '#06b6d4',
        '#84cc16',
        '#f97316',
    ];

    public function dashboardStats(): JsonResponse
    {
        $statusIds = $this->statusIdMap();
        $pendingStatusId = $statusIds['pending'] ?? null;
        $inProgressStatusId = $statusIds['in_progress'] ?? null;
        $completedStatusId = $statusIds['completed'] ?? null;

        $totalTasks = DB::table('tasks')->count();
        $pending = $pendingStatusId ? DB::table('tasks')->where('status_id', $pendingStatusId)->count() : 0;
        $inProgress = $inProgressStatusId ? DB::table('tasks')->where('status_id', $inProgressStatusId)->count() : 0;
        $completed = $completedStatusId ? DB::table('tasks')->where('status_id', $completedStatusId)->count() : 0;

        $completionRate = $totalTasks > 0
            ? (int) round(($completed / $totalTasks) * 100)
            : 0;

        $mostFrequentCategory = DB::table('tasks as t')
            ->join('categories as c', 'c.id', '=', 't.category_id')
            ->select('c.name as category', DB::raw('COUNT(*) as total'))
            ->groupBy('c.id', 'c.name')
            ->orderByDesc('total')
            ->first();

        $topDepartment = DB::table('tasks as t')
            ->join('departments as d', 'd.id', '=', 't.department_id')
            ->select('d.name as department', DB::raw('COUNT(*) as total'))
            ->groupBy('d.id', 'd.name')
            ->orderByDesc('total')
            ->first();

        $currentMonthCount = DB::table('tasks')
            ->whereBetween('date', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])
            ->count();

        $previousMonthStart = now()->copy()->subMonthNoOverflow()->startOfMonth();
        $previousMonthEnd = now()->copy()->subMonthNoOverflow()->endOfMonth();

        $previousMonthCount = DB::table('tasks')
            ->whereBetween('date', [$previousMonthStart->toDateString(), $previousMonthEnd->toDateString()])
            ->count();

        $averageHours = $completedStatusId
            ? $this->averageDurationHoursForRows(
                DB::table('tasks')
                    ->where('status_id', $completedStatusId)
                    ->whereNotNull('starttime')
                    ->whereNotNull('endtime')
                    ->get(['starttime', 'endtime'])
            )
            : null;

        $avgResponseTime = $averageHours === null
            ? 'N/A'
            : number_format($averageHours, 1) . ' hrs';

        $daysElapsed = max((int) now()->day, 1);
        $dailyAverage = $currentMonthCount > 0
            ? (int) round($currentMonthCount / $daysElapsed)
            : 0;

        $resolutionRate = $totalTasks > 0
            ? number_format(($completed / $totalTasks) * 100, 1) . '%'
            : '0%';

        return response()->json([
            'totalTasks' => $totalTasks,
            'totalTasksTrend' => $this->formatTrend($currentMonthCount, $previousMonthCount),
            'mostFrequentIssue' => $mostFrequentCategory?->category ?? 'N/A',
            'mostFrequentIssueCount' => (int) ($mostFrequentCategory?->total ?? 0),
            'topDepartment' => $topDepartment?->department ?? 'N/A',
            'topDepartmentReports' => (int) ($topDepartment?->total ?? 0),
            'pending' => $pending,
            'inProgress' => $inProgress,
            'completed' => $completed,
            'completionRate' => $completionRate,
            'avgResponseTime' => $avgResponseTime,
            'dailyAverage' => $dailyAverage,
            'resolutionRate' => $resolutionRate,
            'customerSatisfaction' => $this->estimateCustomerSatisfaction($completionRate, $averageHours),
        ]);
    }

    public function weeklyTrends(): JsonResponse
    {
        $statusIds = $this->statusIdMap();
        $completedStatusId = $statusIds['completed'] ?? -1;

        $today = Carbon::today();
        $results = [];

        for ($offset = 6; $offset >= 0; $offset--) {
            $day = $today->copy()->subDays($offset);

            $tasksCount = DB::table('tasks')->whereDate('date', $day)->count();
            $resolvedCount = DB::table('tasks')
                ->whereDate('date', $day)
                ->where('status_id', $completedStatusId)
                ->count();

            $results[] = [
                'day' => $day->format('D'),
                'tasks' => $tasksCount,
                'resolved' => $resolvedCount,
            ];
        }

        return response()->json($results);
    }

    public function monthlyTrends(): JsonResponse
    {
        $statusIds = $this->statusIdMap();
        $completedStatusId = $statusIds['completed'] ?? -1;

        $results = [];

        for ($offset = 5; $offset >= 0; $offset--) {
            $month = now()->copy()->subMonths($offset);
            $monthStart = $month->copy()->startOfMonth()->toDateString();
            $monthEnd = $month->copy()->endOfMonth()->toDateString();

            $tasksCount = DB::table('tasks')
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->count();

            $resolvedCount = DB::table('tasks')
                ->whereBetween('date', [$monthStart, $monthEnd])
                ->where('status_id', $completedStatusId)
                ->count();

            $results[] = [
                'month' => $month->format('M'),
                'tasks' => $tasksCount,
                'resolved' => $resolvedCount,
            ];
        }

        return response()->json($results);
    }

    public function departments(): JsonResponse
    {
        $rows = DB::table('tasks as t')
            ->join('departments as d', 'd.id', '=', 't.department_id')
            ->select('d.name as dept', DB::raw('COUNT(*) as volume'))
            ->groupBy('d.id', 'd.name')
            ->orderByDesc('volume')
            ->limit(12)
            ->get();

        return response()->json($rows);
    }

    public function categoryDistribution(): JsonResponse
    {
        $totalTasks = DB::table('tasks')->count();

        if ($totalTasks === 0) {
            return response()->json([]);
        }

        $rows = DB::table('tasks as t')
            ->join('categories as c', 'c.id', '=', 't.category_id')
            ->select('c.name as category', DB::raw('COUNT(*) as count'))
            ->groupBy('c.id', 'c.name')
            ->orderByDesc('count')
            ->get();

        $distribution = $rows->values()->map(function ($row, int $index) use ($totalTasks) {
            $count = (int) $row->count;

            return [
                'category' => $row->category,
                'count' => $count,
                'percentage' => (int) round(($count / $totalTasks) * 100),
                'color' => $this->chartPalette[$index % count($this->chartPalette)],
            ];
        });

        return response()->json($distribution);
    }

    public function departmentRankings(): JsonResponse
    {
        $statusIds = $this->statusIdMap();
        $pendingStatusId = (int) ($statusIds['pending'] ?? -1);
        $inProgressStatusId = (int) ($statusIds['in_progress'] ?? -1);
        $completedStatusId = (int) ($statusIds['completed'] ?? -1);

        $rows = DB::table('tasks as t')
            ->join('departments as d', 'd.id', '=', 't.department_id')
            ->select(
                'd.id as department_id',
                'd.name as department',
                DB::raw('COUNT(*) as total_reports')
            )
            ->selectRaw("SUM(CASE WHEN t.status_id = {$completedStatusId} THEN 1 ELSE 0 END) as resolved")
            ->selectRaw("SUM(CASE WHEN t.status_id = {$pendingStatusId} THEN 1 ELSE 0 END) as pending")
            ->selectRaw("SUM(CASE WHEN t.status_id = {$inProgressStatusId} THEN 1 ELSE 0 END) as in_progress")
            ->groupBy('d.id', 'd.name')
            ->orderByDesc('total_reports')
            ->get();

        $rankings = $rows->values()->map(function ($row, int $index) use ($completedStatusId) {
            $avgHours = $completedStatusId > 0
                ? $this->averageDurationHoursForRows(
                    DB::table('tasks')
                        ->where('department_id', $row->department_id)
                        ->where('status_id', $completedStatusId)
                        ->whereNotNull('starttime')
                        ->whereNotNull('endtime')
                        ->get(['starttime', 'endtime'])
                )
                : null;

            $totalReports = (int) $row->total_reports;

            return [
                'rank' => $index + 1,
                'department' => $row->department,
                'totalReports' => $totalReports,
                'resolved' => (int) $row->resolved,
                'pending' => (int) $row->pending,
                'inProgress' => (int) $row->in_progress,
                'avgResolutionTime' => $avgHours === null ? 'N/A' : number_format($avgHours, 1) . ' hrs',
                'heatLevel' => $this->heatLevelForTotal($totalReports),
            ];
        });

        return response()->json($rankings);
    }

    public function itemRankings(): JsonResponse
    {
        $rows = DB::table('tasks as t')
            ->join('categories as c', 'c.id', '=', 't.category_id')
            ->join('departments as d', 'd.id', '=', 't.department_id')
            ->select(
                'c.name as category',
                'd.name as department',
                DB::raw('COUNT(*) as report_count'),
                DB::raw('MAX(t.date) as last_reported')
            )
            ->groupBy('c.id', 'c.name', 'd.id', 'd.name')
            ->orderByDesc('report_count')
            ->limit(10)
            ->get();

        $rankings = $rows->values()->map(function ($row, int $index) {
            $lastReported = $row->last_reported
                ? Carbon::parse($row->last_reported)->format('Y-m-d')
                : null;

            return [
                'rank' => $index + 1,
                'item' => sprintf('%s - %s', $row->category, $row->department),
                'category' => $row->category,
                'reportCount' => (int) $row->report_count,
                'lastReported' => $lastReported,
            ];
        });

        return response()->json($rankings);
    }

    private function formatTrend(int $currentMonthCount, int $previousMonthCount): string
    {
        if ($previousMonthCount === 0) {
            if ($currentMonthCount === 0) {
                return '0% from last month';
            }

            return '+100% from last month';
        }

        $trend = (($currentMonthCount - $previousMonthCount) / $previousMonthCount) * 100;
        $sign = $trend >= 0 ? '+' : '';

        return sprintf('%s%d%% from last month', $sign, (int) round($trend));
    }

    /**
     * @param \Illuminate\Support\Collection<int, object> $rows
     */
    private function averageDurationHoursForRows($rows): ?float
    {
        $durations = [];

        foreach ($rows as $row) {
            $minutes = $this->durationInMinutes((string) $row->starttime, (string) $row->endtime);

            if ($minutes !== null) {
                $durations[] = $minutes;
            }
        }

        if ($durations === []) {
            return null;
        }

        return (array_sum($durations) / count($durations)) / 60;
    }

    private function durationInMinutes(string $startTime, string $endTime): ?int
    {
        if ($startTime === '' || $endTime === '') {
            return null;
        }

        [$startHour, $startMinute] = array_map('intval', explode(':', substr($startTime, 0, 5)));
        [$endHour, $endMinute] = array_map('intval', explode(':', substr($endTime, 0, 5)));

        $start = ($startHour * 60) + $startMinute;
        $end = ($endHour * 60) + $endMinute;

        if ($end < $start) {
            $end += 24 * 60;
        }

        return $end - $start;
    }

    private function heatLevelForTotal(int $totalReports): string
    {
        if ($totalReports >= 40) {
            return 'critical';
        }

        if ($totalReports >= 30) {
            return 'high';
        }

        if ($totalReports >= 20) {
            return 'medium';
        }

        return 'low';
    }

    private function estimateCustomerSatisfaction(int $completionRate, ?float $averageHours): string
    {
        if ($averageHours === null) {
            return 'N/A';
        }

        $speedPenalty = min($averageHours / 12, 1.5);
        $baseScore = 3.0 + ($completionRate / 100) * 2.0 - $speedPenalty;
        $score = min(max($baseScore, 1.0), 5.0);

        return number_format($score, 1) . '/5.0';
    }

    /**
     * @return array<string, int>
     */
    private function statusIdMap(): array
    {
        $rows = DB::table('statuses')->get(['id', 'name']);
        $map = [];

        foreach ($rows as $row) {
            $key = strtolower(str_replace(' ', '_', trim((string) $row->name)));
            $map[$key] = (int) $row->id;
        }

        return $map;
    }
}

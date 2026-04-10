<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    public function index(): JsonResponse
    {
        $tasks = $this->baseJoinedTaskQuery()
            ->orderByDesc('t.date')
            ->orderByDesc('t.created_at')
            ->get()
            ->map(fn (object $task) => $this->toFrontendTask($task));

        return response()->json($tasks);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'description' => ['required', 'string'],
            'department' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:255'],
            'staffName' => ['required', 'string', 'max:255'],
            'priority' => ['required', 'string', Rule::in(['Low', 'Medium', 'High', 'Critical', 'low', 'medium', 'high', 'critical'])],
            'status' => ['required', 'string', Rule::in(['Pending', 'In Progress', 'Completed', 'pending', 'in_progress', 'in progress', 'completed'])],
            'date' => ['required', 'date_format:Y-m-d'],
            'startTime' => ['nullable', 'date_format:H:i'],
            'endTime' => ['nullable', 'date_format:H:i'],
            'remarks' => ['nullable', 'string'],
        ]);

        $normalizedStatus = $this->normalizeStatusLabel($validated['status']);
        $normalizedPriority = $this->normalizePriorityLabel($validated['priority']);

        $startTime = $validated['startTime'] ?? null;
        $endTime = $validated['endTime'] ?? null;

        if ($normalizedStatus === 'Completed') {
            $startTime = $startTime ?: '08:00';
            $endTime = $endTime ?: now()->format('H:i');
        }

        if ($normalizedStatus === 'In Progress' && ! $startTime) {
            $startTime = now()->format('H:i');
        }

        $departmentId = $this->resolveLookupId('departments', $validated['department']);
        $categoryId = $this->resolveLookupId('categories', $validated['category']);
        $staffId = $this->resolveLookupId('staff', $validated['staffName']);
        $priorityId = $this->resolveLookupId('priorities', $normalizedPriority);
        $statusId = $this->resolveLookupId('statuses', $normalizedStatus);

        $task = Task::query()->create([
            'taskid' => $this->generateTaskCode($validated['date']),
            'description' => $validated['description'],
            'department_id' => $departmentId,
            'category_id' => $categoryId,
            'staff_id' => $staffId,
            'priority_id' => $priorityId,
            'status_id' => $statusId,
            'requester' => $validated['staffName'],
            'date' => $validated['date'],
            'starttime' => $startTime,
            'endtime' => $endTime,
            'remarks' => $validated['remarks'] ?? null,
        ]);

        $taskRow = $this->findTaskByCode($task->taskid);

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully',
            'task' => $taskRow ? $this->toFrontendTask($taskRow) : null,
        ], 201);
    }

    public function updateStatus(Request $request, string $taskCode): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['Pending', 'In Progress', 'Completed', 'pending', 'in_progress', 'in progress', 'completed'])],
            'startTime' => ['nullable', 'date_format:H:i'],
            'endTime' => ['nullable', 'date_format:H:i'],
        ]);

        $task = Task::query()->where('taskid', $taskCode)->firstOrFail();

        $normalizedStatus = $this->normalizeStatusLabel($validated['status']);
        $statusId = $this->resolveLookupId('statuses', $normalizedStatus);
        $startTime = $validated['startTime'] ?? $this->toHourMinute($task->starttime);
        $endTime = $validated['endTime'] ?? $this->toHourMinute($task->endtime);

        if ($normalizedStatus === 'Completed') {
            $startTime = $startTime ?: '08:00';
            $endTime = $endTime ?: now()->format('H:i');
        }

        if ($normalizedStatus === 'In Progress' && ! $startTime) {
            $startTime = now()->format('H:i');
        }

        $task->status_id = $statusId;
        $task->starttime = $startTime;
        $task->endtime = $endTime;
        $task->save();

        $taskRow = $this->findTaskByCode($taskCode);

        return response()->json([
            'success' => true,
            'message' => 'Task status updated successfully',
            'task' => $taskRow ? $this->toFrontendTask($taskRow) : null,
        ]);
    }

    /**
     * @return array<string, string>
     */
    private function toFrontendTask(object $task): array
    {
        $date = (string) ($task->date ?? '');

        return [
            'id' => (string) ($task->taskid ?? ''),
            'description' => (string) ($task->description ?? ''),
            'department' => (string) ($task->department_name ?? ''),
            'category' => (string) ($task->category_name ?? ''),
            'staffName' => (string) ($task->staff_name ?? ''),
            'priority' => $this->toFrontendPriority((string) ($task->priority_name ?? 'Medium')),
            'status' => $this->toFrontendStatus((string) ($task->status_name ?? 'Pending')),
            'date' => $date !== '' ? substr($date, 0, 10) : '',
            'startTime' => $this->toHourMinute($task->starttime ?? null),
            'endTime' => $this->toHourMinute($task->endtime ?? null),
            'remarks' => (string) ($task->remarks ?? ''),
            'createdAt' => isset($task->created_at) && $task->created_at
                ? (string) $task->created_at
                : now()->toIso8601String(),
        ];
    }

    private function toFrontendPriority(string $priority): string
    {
        return match (strtolower(trim($priority))) {
            'low' => 'Low',
            'high' => 'High',
            'critical' => 'Critical',
            default => 'Medium',
        };
    }

    private function toFrontendStatus(string $status): string
    {
        $normalized = strtolower(str_replace(' ', '_', trim($status)));

        return match ($normalized) {
            'in_progress' => 'In Progress',
            'completed' => 'Completed',
            default => 'Pending',
        };
    }

    private function normalizeStatusLabel(string $status): string
    {
        $normalized = strtolower(str_replace(' ', '_', trim($status)));

        return match ($normalized) {
            'in_progress' => 'In Progress',
            'completed' => 'Completed',
            default => 'Pending',
        };
    }

    private function normalizePriorityLabel(string $priority): string
    {
        $normalized = strtolower(trim($priority));

        return match ($normalized) {
            'low' => 'Low',
            'high' => 'High',
            'critical' => 'Critical',
            default => 'Medium',
        };
    }

    private function toHourMinute(?string $time): string
    {
        if (! $time) {
            return '';
        }

        return substr($time, 0, 5);
    }

    private function generateTaskCode(string $date): string
    {
        $year = (int) date('Y', strtotime($date));
        $prefix = sprintf('T-%d-', $year);

        $latestTaskCode = Task::query()
            ->where('taskid', 'like', $prefix . '%')
            ->orderByDesc('taskid')
            ->value('taskid');

        $nextNumber = 1;

        if ($latestTaskCode && preg_match('/^T-\d{4}-(\d+)$/', $latestTaskCode, $matches)) {
            $nextNumber = ((int) $matches[1]) + 1;
        }

        return sprintf('T-%d-%03d', $year, $nextNumber);
    }

    private function resolveLookupId(string $table, string $name): int
    {
        $trimmedName = trim($name);

        $existing = DB::table($table)
            ->whereRaw('LOWER(name) = ?', [strtolower($trimmedName)])
            ->first();

        if ($existing) {
            return (int) $existing->id;
        }

        if (in_array($table, ['priorities', 'statuses'], true)) {
            abort(422, "Unknown {$table} value: {$trimmedName}");
        }

        $id = DB::table($table)->insertGetId([
            'name' => $trimmedName,
            'active' => 1,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return (int) $id;
    }

    private function findTaskByCode(string $taskCode): ?object
    {
        return $this->baseJoinedTaskQuery()
            ->where('t.taskid', $taskCode)
            ->first();
    }

    private function baseJoinedTaskQuery()
    {
        return DB::table('tasks as t')
            ->leftJoin('departments as d', 'd.id', '=', 't.department_id')
            ->leftJoin('categories as c', 'c.id', '=', 't.category_id')
            ->leftJoin('staff as s', 's.id', '=', 't.staff_id')
            ->leftJoin('priorities as p', 'p.id', '=', 't.priority_id')
            ->leftJoin('statuses as st', 'st.id', '=', 't.status_id')
            ->select([
                't.*',
                'd.name as department_name',
                'c.name as category_name',
                's.name as staff_name',
                'p.name as priority_name',
                'st.name as status_name',
            ]);
    }
}

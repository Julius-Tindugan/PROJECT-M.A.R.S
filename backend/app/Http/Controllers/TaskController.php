<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Models\Task;
use App\Models\TaskHistory;
use App\Models\Department;
use App\Models\Category;
use App\Models\Staff;
use App\Models\Priority;
use App\Models\Status;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TaskController extends Controller
{
    /**
     * Get all tasks with filtering, sorting, and pagination.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Task::with(['department', 'category', 'staff', 'priority', 'status']);

        // Search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('taskid', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('requester', 'like', "%{$search}%")
                    ->orWhere('remarks', 'like', "%{$search}%")
                    ->orWhereHas('department', fn($dq) => $dq->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('category', fn($cq) => $cq->where('name', 'like', "%{$search}%"))
                    ->orWhereHas('staff', fn($sq) => $sq->where('name', 'like', "%{$search}%"));
            });
        }

        // Filter by status
        if ($request->filled('status')) {
            $statusName = $request->status;
            $query->whereHas('status', fn($q) => $q->where('name', $statusName));
        }

        // Filter by status ID
        if ($request->filled('status_id')) {
            $query->where('status_id', $request->status_id);
        }

        // Filter by department
        if ($request->filled('department')) {
            $deptName = $request->department;
            $query->whereHas('department', fn($q) => $q->where('name', $deptName));
        }

        // Filter by department ID
        if ($request->filled('department_id')) {
            $query->where('department_id', $request->department_id);
        }

        // Filter by category
        if ($request->filled('category')) {
            $catName = $request->category;
            $query->whereHas('category', fn($q) => $q->where('name', $catName));
        }

        // Filter by category ID
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Filter by staff
        if ($request->filled('staff')) {
            $staffName = $request->staff;
            $query->whereHas('staff', fn($q) => $q->where('name', $staffName));
        }

        // Filter by staff ID
        if ($request->filled('staff_id')) {
            $query->where('staff_id', $request->staff_id);
        }

        // Filter by priority
        if ($request->filled('priority')) {
            $priorityName = $request->priority;
            $query->whereHas('priority', fn($q) => $q->where('name', $priorityName));
        }

        // Filter by priority ID
        if ($request->filled('priority_id')) {
            $query->where('priority_id', $request->priority_id);
        }

        // Filter by date range
        if ($request->filled('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }

        // Filter by specific date
        if ($request->filled('date')) {
            $query->whereDate('date', $request->date);
        }

        // Sorting
        $sortField = $request->get('sort', 'created_at');
        $sortDirection = $request->get('order', 'desc');

        // Map frontend sort fields to database columns
        $sortMap = [
            'id' => 'taskid',
            'date' => 'date',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
            'department' => 'department_id',
            'category' => 'category_id',
            'staff' => 'staff_id',
            'priority' => 'priority_id',
            'status' => 'status_id',
        ];

        $dbSortField = $sortMap[$sortField] ?? 'created_at';
        $query->orderBy($dbSortField, $sortDirection);

        // Pagination
        if ($request->boolean('paginate', true)) {
            $perPage = $request->get('per_page', 20);
            $tasks = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $this->transformTasks($tasks->items()),
                'meta' => [
                    'current_page' => $tasks->currentPage(),
                    'last_page' => $tasks->lastPage(),
                    'per_page' => $tasks->perPage(),
                    'total' => $tasks->total(),
                ],
            ]);
        }

        // No pagination - return all results
        $tasks = $query->get();

        return response()->json([
            'success' => true,
            'data' => $this->transformTasks($tasks),
        ]);
    }

    /**
     * Create a new task.
     */
    public function store(StoreTaskRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Resolve IDs from names if not provided
        $departmentId = $validated['department_id'] ?? $this->resolveId(Department::class, $validated['department']);
        $categoryId = $validated['category_id'] ?? $this->resolveId(Category::class, $validated['category']);
        $staffId = $validated['staff_id'] ?? $this->resolveId(Staff::class, $validated['staff']);

        // Default priority to "Medium" if not provided
        $priorityId = $validated['priority_id']
            ?? ($validated['priority'] ?? null ? $this->resolveId(Priority::class, $validated['priority']) : null)
            ?? Priority::where('name', 'Medium')->value('id');

        // Default status to "Pending" if not provided
        $statusId = $validated['status_id']
            ?? ($validated['status'] ?? null ? $this->resolveId(Status::class, $validated['status']) : null)
            ?? Status::where('name', 'Pending')->value('id');

        $task = Task::create([
            'taskid' => Task::generateTaskId(),
            'description' => $validated['description'],
            'department_id' => $departmentId,
            'category_id' => $categoryId,
            'staff_id' => $staffId,
            'priority_id' => $priorityId,
            'status_id' => $statusId,
            'requester' => $validated['requester'] ?? null,
            'date' => $validated['date'],
            'starttime' => $validated['starttime'] ?? null,
            'endtime' => $validated['endtime'] ?? null,
            'remarks' => $validated['remarks'] ?? null,
        ]);

        $task->load(['department', 'category', 'staff', 'priority', 'status']);

        return response()->json([
            'success' => true,
            'message' => 'Task created successfully',
            'data' => $this->transformTask($task),
        ], 201);
    }

    /**
     * Get a specific task.
     */
    public function show(Task $task): JsonResponse
    {
        $task->load(['department', 'category', 'staff', 'priority', 'status', 'history']);

        return response()->json([
            'success' => true,
            'data' => $this->transformTask($task, true),
        ]);
    }

    /**
     * Update a task.
     */
    /**
     * Update a task.
     */
    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $validated = $request->validated();

        $originalData = $task->toArray();

        // Update fields
        if (isset($validated['description'])) {
            $task->description = $validated['description'];
        }

        if (isset($validated['department_id'])) {
            $task->department_id = $validated['department_id'];
        } elseif (isset($validated['department'])) {
            $task->department_id = $this->resolveId(Department::class, $validated['department']);
        }

        if (isset($validated['category_id'])) {
            $task->category_id = $validated['category_id'];
        } elseif (isset($validated['category'])) {
            $task->category_id = $this->resolveId(Category::class, $validated['category']);
        }

        if (isset($validated['staff_id'])) {
            $task->staff_id = $validated['staff_id'];
        } elseif (isset($validated['staff'])) {
            $task->staff_id = $this->resolveId(Staff::class, $validated['staff']);
        }

        if (isset($validated['priority_id'])) {
            $task->priority_id = $validated['priority_id'];
        } elseif (isset($validated['priority'])) {
            $task->priority_id = $this->resolveId(Priority::class, $validated['priority']);
        }

        if (isset($validated['status_id'])) {
            $task->status_id = $validated['status_id'];
        } elseif (isset($validated['status'])) {
            $task->status_id = $this->resolveId(Status::class, $validated['status']);
        }

        if (array_key_exists('requester', $validated)) {
            $task->requester = $validated['requester'];
        }

        if (isset($validated['date'])) {
            $task->date = $validated['date'];
        }

        if (array_key_exists('starttime', $validated)) {
            $task->starttime = $validated['starttime'];
        }

        if (array_key_exists('endtime', $validated)) {
            $task->endtime = $validated['endtime'];
        }

        if (array_key_exists('remarks', $validated)) {
            $task->remarks = $validated['remarks'];
        }

        // Track changes for history
        $changes = $task->getDirty();
        foreach ($changes as $field => $newValue) {
            TaskHistory::recordChange($task, $field, $originalData[$field] ?? null, $newValue);
        }

        $task->save();
        $task->load(['department', 'category', 'staff', 'priority', 'status']);

        return response()->json([
            'success' => true,
            'message' => 'Task updated successfully',
            'data' => $this->transformTask($task),
        ]);
    }

    /**
     * Delete a task.
     */
    public function destroy(Task $task): JsonResponse
    {
        $task->delete();

        return response()->json([
            'success' => true,
            'message' => 'Task deleted successfully',
        ]);
    }

    /**
     * Update only the status of a task.
     */
    public function updateStatus(Request $request, Task $task): JsonResponse
    {
        $validated = $request->validate([
            'status' => 'required_without:status_id|string',
            'status_id' => 'required_without:status|exists:statuses,id',
        ]);

        $oldStatus = $task->status->name;

        if (isset($validated['status_id'])) {
            $task->status_id = $validated['status_id'];
        } else {
            $task->status_id = $this->resolveId(Status::class, $validated['status']);
        }

        $task->save();
        $task->load('status');

        TaskHistory::recordChange($task, 'status', $oldStatus, $task->status->name);

        return response()->json([
            'success' => true,
            'message' => 'Task status updated successfully',
            'data' => [
                'id' => $task->taskid,
                'status' => $task->status->name,
            ],
        ]);
    }

    /**
     * Get tasks for a specific date (for calendar view).
     */
    public function getByDate(Request $request): JsonResponse
    {
        $request->validate([
            'date' => 'required|date',
        ]);

        $tasks = Task::with(['department', 'category', 'staff', 'priority', 'status'])
            ->whereDate('date', $request->date)
            ->orderBy('starttime', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $this->transformTasks($tasks),
        ]);
    }

    /**
     * Get tasks for a date range (for calendar view).
     */
    public function getByDateRange(Request $request): JsonResponse
    {
        $request->validate([
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
        ]);

        $tasks = Task::with(['department', 'category', 'staff', 'priority', 'status'])
            ->whereBetween('date', [$request->start_date, $request->end_date])
            ->orderBy('date', 'asc')
            ->orderBy('starttime', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $this->transformTasks($tasks),
        ]);
    }

    /**
     * Get pending tasks.
     */
    public function pending(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 10);

        // Get priority IDs for ordering
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
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $this->transformTasks($tasks),
        ]);
    }

    /**
     * Get recent tasks.
     */
    public function recent(Request $request): JsonResponse
    {
        $limit = $request->get('limit', 5);

        $tasks = Task::with(['department', 'category', 'staff', 'priority', 'status'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json([
            'success' => true,
            'data' => $this->transformTasks($tasks),
        ]);
    }

    /**
     * Resolve entity ID from name.
     */
    private function resolveId(string $modelClass, string $name): int
    {
        $entity = $modelClass::where('name', $name)->first();

        if (!$entity) {
            // Create the entity if it doesn't exist
            $entity = $modelClass::create(['name' => $name]);
        }

        return $entity->id;
    }

    /**
     * Transform a task for API response (frontend-compatible format).
     */
    private function transformTask(Task $task, bool $includeHistory = false): array
    {
        $data = [
            'id' => $task->taskid,
            'taskId' => $task->taskid,
            'dbId' => $task->id,
            'description' => $task->description,
            'department' => $task->department->name,
            'category' => $task->category->name,
            'staffName' => $task->staff->name,
            'priority' => $task->priority->name,
            'status' => $task->status->name,
            'requestedBy' => $task->requester,
            'date' => $task->date->format('Y-m-d'),
            'startTime' => $task->starttime ? substr($task->starttime, 0, 5) : '',
            'endTime' => $task->endtime ? substr($task->endtime, 0, 5) : '',
            'remarks' => $task->remarks ?? '',
            'createdAt' => $task->created_at->toIso8601String(),
            'updatedAt' => $task->updated_at->toIso8601String(),
        ];

        if ($includeHistory && $task->relationLoaded('history')) {
            $data['history'] = $task->history->map(fn($h) => [
                'field' => $h->field,
                'oldValue' => $h->oldvalue,
                'newValue' => $h->newvalue,
                'changedAt' => $h->created_at->toIso8601String(),
            ])->toArray();
        }

        return $data;
    }

    /**
     * Transform multiple tasks.
     */
    private function transformTasks($tasks): array
    {
        return collect($tasks)->map(fn($task) => $this->transformTask($task))->toArray();
    }
}

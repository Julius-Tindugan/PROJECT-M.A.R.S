<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'taskid',
        'description',
        'department_id',
        'category_id',
        'staff_id',
        'priority_id',
        'status_id',
        'requester',
        'date',
        'starttime',
        'endtime',
        'remarks',
    ];

    protected $casts = [
        'date' => 'date',
        'department_id' => 'integer',
        'category_id' => 'integer',
        'staff_id' => 'integer',
        'priority_id' => 'integer',
        'status_id' => 'integer',
    ];

    /**
     * Get the department that owns this task.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    /**
     * Get the category that owns this task.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the staff member assigned to this task.
     */
    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    /**
     * Get the priority level of this task.
     */
    public function priority(): BelongsTo
    {
        return $this->belongsTo(Priority::class);
    }

    /**
     * Get the status of this task.
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(Status::class);
    }

    /**
     * Get the history records for this task.
     */
    public function history(): HasMany
    {
        return $this->hasMany(TaskHistory::class)->orderBy('created_at', 'desc');
    }

    /**
     * Generate a unique task ID in the format T-YYYY-XXX.
     */
    public static function generateTaskId(): string
    {
        $year = date('Y');
        $prefix = 'T';

        // Get the last task of this year
        $lastTask = self::where('taskid', 'like', "{$prefix}-{$year}-%")
            ->orderBy('taskid', 'desc')
            ->first();

        if ($lastTask) {
            // Extract the sequence number and increment
            $lastNumber = (int) substr($lastTask->taskid, -3);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return sprintf('%s-%s-%03d', $prefix, $year, $newNumber);
    }

    /**
     * Scope to filter tasks by date range.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('date', [$startDate, $endDate]);
    }

    /**
     * Scope to filter tasks by status name.
     */
    public function scopeWithStatus($query, $statusName)
    {
        return $query->whereHas('status', function ($q) use ($statusName) {
            $q->where('name', $statusName);
        });
    }

    /**
     * Scope to filter pending tasks.
     */
    public function scopePending($query)
    {
        return $query->withStatus('Pending');
    }

    /**
     * Scope to filter in-progress tasks.
     */
    public function scopeInProgress($query)
    {
        return $query->withStatus('In Progress');
    }

    /**
     * Scope to filter completed tasks.
     */
    public function scopeCompleted($query)
    {
        return $query->withStatus('Completed');
    }

    /**
     * Get the duration of the task in minutes.
     */
    public function getDurationMinutesAttribute(): ?int
    {
        if (!$this->starttime || !$this->endtime) {
            return null;
        }

        $start = Carbon::parse($this->starttime);
        $end = Carbon::parse($this->endtime);

        return $end->diffInMinutes($start);
    }

    /**
     * Get a formatted duration string.
     */
    public function getFormattedDurationAttribute(): ?string
    {
        $minutes = $this->duration_minutes;

        if ($minutes === null) {
            return null;
        }

        $hours = floor($minutes / 60);
        $mins = $minutes % 60;

        if ($hours > 0) {
            return "{$hours}h {$mins}m";
        }

        return "{$mins}m";
    }
}

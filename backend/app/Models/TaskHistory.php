<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TaskHistory extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     */
    protected $table = 'history';

    /**
     * Indicates if the model should be timestamped.
     * This table only has created_at, not updated_at.
     */
    public $timestamps = false;

    protected $fillable = [
        'task_id',
        'field',
        'oldvalue',
        'newvalue',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::creating(function ($history) {
            $history->created_at = now();
        });
    }

    /**
     * Get the task that this history record belongs to.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Create a history record for a task field change.
     */
    public static function recordChange(Task $task, string $field, $oldValue, $newValue): self
    {
        return self::create([
            'task_id' => $task->id,
            'field' => $field,
            'oldvalue' => is_array($oldValue) ? json_encode($oldValue) : (string) $oldValue,
            'newvalue' => is_array($newValue) ? json_encode($newValue) : (string) $newValue,
        ]);
    }
}

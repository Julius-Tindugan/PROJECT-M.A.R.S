<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Staff extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     * Laravel expects 'staffs' by default, but our table is 'staff'.
     */
    protected $table = 'staff';

    protected $fillable = [
        'name',
        'email',
        'phone',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    /**
     * Get all tasks assigned to this staff member.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Scope to get only active staff members.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Get the count of tasks for this staff member.
     */
    public function getTaskCountAttribute(): int
    {
        return $this->tasks()->count();
    }

    /**
     * Get the count of completed tasks for this staff member.
     */
    public function getCompletedTaskCountAttribute(): int
    {
        return $this->tasks()
            ->whereHas('status', function ($query) {
                $query->where('name', 'Completed');
            })
            ->count();
    }
}

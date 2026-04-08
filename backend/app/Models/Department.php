<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Department extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'active',
    ];

    protected $casts = [
        'active' => 'boolean',
    ];

    /**
     * Get all tasks for this department.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Scope to get only active departments.
     */
    public function scopeActive($query)
    {
        return $query->where('active', true);
    }

    /**
     * Get the count of tasks for this department.
     */
    public function getTaskCountAttribute(): int
    {
        return $this->tasks()->count();
    }
}

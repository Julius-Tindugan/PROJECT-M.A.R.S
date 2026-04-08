<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Status extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'order',
        'color',
    ];

    protected $casts = [
        'order' => 'integer',
    ];

    /**
     * Get all tasks with this status.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Scope to order statuses by their display order.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order', 'asc');
    }

    /**
     * Check if this is the "Pending" status.
     */
    public function isPending(): bool
    {
        return $this->name === 'Pending';
    }

    /**
     * Check if this is the "In Progress" status.
     */
    public function isInProgress(): bool
    {
        return $this->name === 'In Progress';
    }

    /**
     * Check if this is the "Completed" status.
     */
    public function isCompleted(): bool
    {
        return $this->name === 'Completed';
    }
}

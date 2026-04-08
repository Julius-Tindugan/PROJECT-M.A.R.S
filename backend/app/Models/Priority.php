<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Priority extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'level',
        'color',
    ];

    protected $casts = [
        'level' => 'integer',
    ];

    /**
     * Get all tasks with this priority.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }

    /**
     * Scope to order priorities by level.
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('level', 'asc');
    }
}

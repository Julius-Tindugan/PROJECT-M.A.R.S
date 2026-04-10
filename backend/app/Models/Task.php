<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    /**
     * @var list<string>
     */
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

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }
}

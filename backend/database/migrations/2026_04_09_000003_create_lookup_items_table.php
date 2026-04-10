<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('departments')) {
            Schema::create('departments', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->boolean('active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('categories')) {
            Schema::create('categories', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->boolean('active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('staff')) {
            Schema::create('staff', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('email')->nullable()->unique();
                $table->string('phone')->nullable();
                $table->boolean('active')->default(true);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('priorities')) {
            Schema::create('priorities', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->unsignedTinyInteger('level');
                $table->string('color', 20);
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('statuses')) {
            Schema::create('statuses', function (Blueprint $table) {
                $table->id();
                $table->string('name')->unique();
                $table->unsignedTinyInteger('order');
                $table->string('color', 20);
                $table->timestamps();
            });
        }

        DB::table('departments')->insertOrIgnore($this->departmentRows());
        DB::table('categories')->insertOrIgnore($this->categoryRows());
        DB::table('staff')->insertOrIgnore($this->staffRows());
        DB::table('priorities')->insertOrIgnore($this->priorityRows());
        DB::table('statuses')->insertOrIgnore($this->statusRows());
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('statuses');
        Schema::dropIfExists('priorities');
        Schema::dropIfExists('staff');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('departments');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function departmentRows(): array
    {
        $timestamp = now()->toDateTimeString();

        $names = [
            'Emergency Room (ER)',
            'Radiology',
            'Billing',
            'Pharmacy',
            'Cashier',
            'Laboratory',
            'OPD (Outpatient)',
            'IPD (Inpatient)',
            'ICU',
            'Operating Room',
            'Medical Records',
            'Human Resources',
            'Admitting',
            'Nursing Station 1',
            'Nursing Station 2',
            'Administration',
        ];

        $rows = [];

        foreach ($names as $name) {
            $rows[] = [
                'name' => $name,
                'active' => 1,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        }

        return $rows;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function categoryRows(): array
    {
        $timestamp = now()->toDateTimeString();

        $names = [
            'Computer Hardware',
            'Network',
            'Printer',
            'Software',
            'CCTV',
            'Bizbox System Encoding',
            'Email/Communication',
            'Server Maintenance',
            'Data Backup',
            'System Installation',
        ];

        $rows = [];

        foreach ($names as $name) {
            $rows[] = [
                'name' => $name,
                'active' => 1,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        }

        return $rows;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function staffRows(): array
    {
        $timestamp = now()->toDateTimeString();

        $names = [
            'John Santos',
            'Maria Garcia',
            'Carlos Reyes',
            'Ana Cruz',
            'Miguel Torres',
        ];

        $rows = [];

        foreach ($names as $name) {
            $rows[] = [
                'name' => $name,
                'email' => null,
                'phone' => null,
                'active' => 1,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ];
        }

        return $rows;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function priorityRows(): array
    {
        $timestamp = now()->toDateTimeString();

        return [
            [
                'name' => 'Low',
                'level' => 1,
                'color' => '#22c55e',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'name' => 'Medium',
                'level' => 2,
                'color' => '#f59e0b',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'name' => 'High',
                'level' => 3,
                'color' => '#f97316',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'name' => 'Critical',
                'level' => 4,
                'color' => '#ef4444',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function statusRows(): array
    {
        $timestamp = now()->toDateTimeString();

        return [
            [
                'name' => 'Pending',
                'order' => 1,
                'color' => '#6b7280',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'name' => 'In Progress',
                'order' => 2,
                'color' => '#3b82f6',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
            [
                'name' => 'Completed',
                'order' => 3,
                'color' => '#22c55e',
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ],
        ];
    }
};

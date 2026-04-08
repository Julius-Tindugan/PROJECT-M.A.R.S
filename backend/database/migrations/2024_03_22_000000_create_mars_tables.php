<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * M.A.R.S (Maintenance, Analytics, & Recording System) Database Schema
     */
    public function up(): void
    {
        // Departments table - Hospital departments
        Schema::create('departments', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // Categories table - Task/issue categories
        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // Staff table - IT staff members
        Schema::create('staff', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->nullable()->unique();
            $table->string('phone')->nullable();
            $table->boolean('active')->default(true);
            $table->timestamps();
        });

        // Priorities table - Task priority levels
        Schema::create('priorities', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->integer('level'); // 1=Low, 2=Medium, 3=High, 4=Critical
            $table->string('color')->nullable(); // For UI display
            $table->timestamps();
        });

        // Statuses table - Task statuses
        Schema::create('statuses', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->integer('order'); // Display order
            $table->string('color')->nullable(); // For UI display
            $table->timestamps();
        });

        // Tasks table - Main task/issue tracking
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('taskid')->unique(); // T-2024-001 format
            $table->text('description');
            $table->foreignId('department_id')->constrained('departments')->onDelete('restrict');
            $table->foreignId('category_id')->constrained('categories')->onDelete('restrict');
            $table->foreignId('staff_id')->constrained('staff')->onDelete('restrict');
            $table->foreignId('priority_id')->constrained('priorities')->onDelete('restrict');
            $table->foreignId('status_id')->constrained('statuses')->onDelete('restrict');
            $table->string('requester')->nullable(); // Person who requested the task
            $table->date('date'); // Task date
            $table->time('starttime')->nullable(); // Start time
            $table->time('endtime')->nullable(); // End time
            $table->text('remarks')->nullable();
            $table->timestamps();

            // Indexes for common queries
            $table->index('date');
            $table->index(['department_id', 'date']);
            $table->index(['category_id', 'date']);
            $table->index(['staff_id', 'date']);
            $table->index(['status_id', 'date']);
            $table->index(['priority_id', 'date']);
        });

        // Task history table - Audit trail for task changes
        Schema::create('history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->string('field'); // Field that changed
            $table->text('oldvalue')->nullable();
            $table->text('newvalue')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['task_id', 'created_at']);
        });

        // Settings table - System configuration
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->text('value')->nullable();
            $table->string('type')->default('string'); // string, integer, boolean, json
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop tables in reverse order (respecting foreign keys)
        Schema::dropIfExists('settings');
        Schema::dropIfExists('history');
        Schema::dropIfExists('tasks');
        Schema::dropIfExists('statuses');
        Schema::dropIfExists('priorities');
        Schema::dropIfExists('staff');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('departments');
    }
};

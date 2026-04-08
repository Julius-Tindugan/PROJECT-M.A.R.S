<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class MarsSeeder extends Seeder
{
    /**
     * Seed the MARS database tables.
     */
    public function run(): void
    {
        $now = Carbon::now();

        // ============================================================
        // DEPARTMENTS
        // ============================================================
        $departments = [
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

        foreach ($departments as $name) {
            DB::table('departments')->insert([
                'name' => $name,
                'active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ============================================================
        // CATEGORIES
        // ============================================================
        $categories = [
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

        foreach ($categories as $name) {
            DB::table('categories')->insert([
                'name' => $name,
                'active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ============================================================
        // STAFF
        // ============================================================
        $staffMembers = [
            ['name' => 'John Vincent Rosales', 'email' => 'john.rosales@hospital.com'],
            ['name' => 'Mar Lindon Grantoza', 'email' => 'mar.grantoza@hospital.com'],
        ];

        foreach ($staffMembers as $staff) {
            DB::table('staff')->insert([
                'name' => $staff['name'],
                'email' => $staff['email'],
                'active' => true,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ============================================================
        // PRIORITIES
        // ============================================================
        $priorities = [
            ['name' => 'Low', 'level' => 1, 'color' => '#22c55e'],
            ['name' => 'Medium', 'level' => 2, 'color' => '#f59e0b'],
            ['name' => 'High', 'level' => 3, 'color' => '#f97316'],
            ['name' => 'Critical', 'level' => 4, 'color' => '#ef4444'],
        ];

        foreach ($priorities as $priority) {
            DB::table('priorities')->insert([
                'name' => $priority['name'],
                'level' => $priority['level'],
                'color' => $priority['color'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ============================================================
        // STATUSES
        // ============================================================
        $statuses = [
            ['name' => 'Pending', 'order' => 1, 'color' => '#6b7280'],
            ['name' => 'In Progress', 'order' => 2, 'color' => '#3b82f6'],
            ['name' => 'Completed', 'order' => 3, 'color' => '#22c55e'],
        ];

        foreach ($statuses as $status) {
            DB::table('statuses')->insert([
                'name' => $status['name'],
                'order' => $status['order'],
                'color' => $status['color'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ============================================================
        // SETTINGS (Default System Configuration)
        // ============================================================
        $settings = [
            ['key' => 'task_id_prefix', 'value' => 'T', 'type' => 'string', 'description' => 'Prefix for task IDs'],
            ['key' => 'task_id_year_format', 'value' => 'Y', 'type' => 'string', 'description' => 'Year format in task ID'],
            ['key' => 'default_priority', 'value' => '2', 'type' => 'integer', 'description' => 'Default priority level (Medium)'],
            ['key' => 'default_status', 'value' => '1', 'type' => 'integer', 'description' => 'Default status (Pending)'],
            ['key' => 'system_name', 'value' => 'M.A.R.S', 'type' => 'string', 'description' => 'System name'],
            ['key' => 'system_full_name', 'value' => 'Maintenance, Analytics, & Recording System', 'type' => 'string', 'description' => 'Full system name'],
            ['key' => 'heat_threshold_low', 'value' => '15', 'type' => 'integer', 'description' => 'Low heat threshold for department ranking'],
            ['key' => 'heat_threshold_medium', 'value' => '25', 'type' => 'integer', 'description' => 'Medium heat threshold for department ranking'],
            ['key' => 'heat_threshold_high', 'value' => '35', 'type' => 'integer', 'description' => 'High heat threshold for department ranking'],
        ];

        foreach ($settings as $setting) {
            DB::table('settings')->insert([
                'key' => $setting['key'],
                'value' => $setting['value'],
                'type' => $setting['type'],
                'description' => $setting['description'],
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }

        // ============================================================
        // SAMPLE TASKS
        // ============================================================
        $this->seedSampleTasks($now);
    }

    /**
     * Seed sample tasks for development and testing.
     */
    private function seedSampleTasks(Carbon $now): void
    {
        $tasks = [
            [
                'taskid' => 'T-2024-001',
                'description' => 'Desktop computer not booting - replaced faulty RAM module',
                'department_id' => 1, // Emergency Room (ER)
                'category_id' => 1, // Computer Hardware
                'staff_id' => 1,
                'priority_id' => 4, // Critical
                'status_id' => 3, // Completed
                'requester' => 'Dr. Maria Santos',
                'date' => Carbon::now()->subDays(5)->format('Y-m-d'),
                'starttime' => '08:30',
                'endtime' => '10:15',
                'remarks' => 'RAM module replaced successfully. System running normally.',
            ],
            [
                'taskid' => 'T-2024-002',
                'description' => 'PACS system connectivity issues - reconfigured network switch',
                'department_id' => 2, // Radiology
                'category_id' => 2, // Network
                'staff_id' => 2,
                'priority_id' => 3, // High
                'status_id' => 3, // Completed
                'requester' => 'Tech. Juan Cruz',
                'date' => Carbon::now()->subDays(5)->format('Y-m-d'),
                'starttime' => '09:00',
                'endtime' => '11:30',
                'remarks' => 'Network switch port reconfigured. PACS connection restored.',
            ],
            [
                'taskid' => 'T-2024-003',
                'description' => 'Receipt printer paper jam - cleared jam and replaced roller',
                'department_id' => 3, // Billing
                'category_id' => 3, // Printer
                'staff_id' => 1,
                'priority_id' => 2, // Medium
                'status_id' => 3, // Completed
                'requester' => 'Ana Reyes',
                'date' => Carbon::now()->subDays(4)->format('Y-m-d'),
                'starttime' => '10:45',
                'endtime' => '11:00',
                'remarks' => 'Roller replaced. Advised staff on proper paper loading.',
            ],
            [
                'taskid' => 'T-2024-004',
                'description' => 'Encoding new medicine inventory into Bizbox system',
                'department_id' => 4, // Pharmacy
                'category_id' => 6, // Bizbox System Encoding
                'staff_id' => 2,
                'priority_id' => 2, // Medium
                'status_id' => 2, // In Progress
                'requester' => 'Pharm. Lisa Torres',
                'date' => Carbon::now()->format('Y-m-d'),
                'starttime' => '08:00',
                'endtime' => null,
                'remarks' => 'Currently encoding 150 new items. Expected completion by EOD.',
            ],
            [
                'taskid' => 'T-2024-005',
                'description' => 'POS software update required - scheduling update',
                'department_id' => 5, // Cashier
                'category_id' => 4, // Software
                'staff_id' => 1,
                'priority_id' => 1, // Low
                'status_id' => 1, // Pending
                'requester' => 'Miguel Garcia',
                'date' => Carbon::now()->addDays(1)->format('Y-m-d'),
                'starttime' => null,
                'endtime' => null,
                'remarks' => 'Scheduled for after business hours.',
            ],
            [
                'taskid' => 'T-2024-006',
                'description' => 'Lab workstation monitor flickering - replaced display cable',
                'department_id' => 6, // Laboratory
                'category_id' => 1, // Computer Hardware
                'staff_id' => 1,
                'priority_id' => 3, // High
                'status_id' => 3, // Completed
                'requester' => 'Lab Tech. Pedro Ramos',
                'date' => Carbon::now()->subDays(6)->format('Y-m-d'),
                'starttime' => '14:00',
                'endtime' => '15:30',
                'remarks' => 'VGA cable was loose. Replaced with new HDMI cable.',
            ],
            [
                'taskid' => 'T-2024-007',
                'description' => 'WiFi connectivity drop - replaced access point',
                'department_id' => 9, // ICU
                'category_id' => 2, // Network
                'staff_id' => 2,
                'priority_id' => 4, // Critical
                'status_id' => 3, // Completed
                'requester' => 'Nurse Supervisor Elena',
                'date' => Carbon::now()->subDays(6)->format('Y-m-d'),
                'starttime' => '16:00',
                'endtime' => '18:00',
                'remarks' => 'Old AP was malfunctioning. Installed new UniFi AP.',
            ],
            [
                'taskid' => 'T-2024-008',
                'description' => 'Weekly backup verification and cleanup',
                'department_id' => 11, // Medical Records
                'category_id' => 9, // Data Backup
                'staff_id' => 1,
                'priority_id' => 3, // High
                'status_id' => 3, // Completed
                'requester' => 'Records Officer',
                'date' => Carbon::now()->subDays(7)->format('Y-m-d'),
                'starttime' => '07:00',
                'endtime' => '08:30',
                'remarks' => 'All backups verified. Old logs cleaned up.',
            ],
            [
                'taskid' => 'T-2024-009',
                'description' => 'Wristband printer not working - replaced print head',
                'department_id' => 13, // Admitting
                'category_id' => 3, // Printer
                'staff_id' => 2,
                'priority_id' => 3, // High
                'status_id' => 3, // Completed
                'requester' => 'Admitting Staff',
                'date' => Carbon::now()->subDays(7)->format('Y-m-d'),
                'starttime' => '11:00',
                'endtime' => '13:00',
                'remarks' => 'Print head was worn out. New head installed and calibrated.',
            ],
            [
                'taskid' => 'T-2024-010',
                'description' => 'Camera #5 offline in parking area - power supply replaced',
                'department_id' => 16, // Administration
                'category_id' => 5, // CCTV
                'staff_id' => 1,
                'priority_id' => 2, // Medium
                'status_id' => 3, // Completed
                'requester' => 'Security Chief',
                'date' => Carbon::now()->subDays(7)->format('Y-m-d'),
                'starttime' => '14:00',
                'endtime' => '16:00',
                'remarks' => 'Power adapter was faulty. Replaced with new 12V adapter.',
            ],
            [
                'taskid' => 'T-2024-011',
                'description' => 'HRIS software login issues - password reset and cache cleared',
                'department_id' => 12, // Human Resources
                'category_id' => 4, // Software
                'staff_id' => 1,
                'priority_id' => 1, // Low
                'status_id' => 3, // Completed
                'requester' => 'HR Manager',
                'date' => Carbon::now()->subDays(8)->format('Y-m-d'),
                'starttime' => '09:00',
                'endtime' => '09:30',
                'remarks' => 'User password reset. Browser cache cleared.',
            ],
            [
                'taskid' => 'T-2024-012',
                'description' => 'Keyboard replacement - spilled coffee damage',
                'department_id' => 7, // OPD (Outpatient)
                'category_id' => 1, // Computer Hardware
                'staff_id' => 2,
                'priority_id' => 1, // Low
                'status_id' => 3, // Completed
                'requester' => 'OPD Staff',
                'date' => Carbon::now()->subDays(8)->format('Y-m-d'),
                'starttime' => '10:30',
                'endtime' => '11:00',
                'remarks' => 'Replaced with spare keyboard from inventory.',
            ],
            [
                'taskid' => 'T-2024-013',
                'description' => 'Medical imaging transfer slow - bandwidth optimization',
                'department_id' => 10, // Operating Room
                'category_id' => 2, // Network
                'staff_id' => 1,
                'priority_id' => 4, // Critical
                'status_id' => 2, // In Progress
                'requester' => 'OR Supervisor',
                'date' => Carbon::now()->format('Y-m-d'),
                'starttime' => '11:00',
                'endtime' => null,
                'remarks' => 'Analyzing network traffic. QoS rules being configured.',
            ],
            [
                'taskid' => 'T-2024-014',
                'description' => 'Medication label printer maintenance required',
                'department_id' => 14, // Nursing Station 1
                'category_id' => 3, // Printer
                'staff_id' => 2,
                'priority_id' => 2, // Medium
                'status_id' => 1, // Pending
                'requester' => 'Head Nurse',
                'date' => Carbon::now()->addDays(1)->format('Y-m-d'),
                'starttime' => null,
                'endtime' => null,
                'remarks' => 'Scheduled for routine maintenance.',
            ],
            [
                'taskid' => 'T-2024-015',
                'description' => 'Email server sync issues - Outlook configuration fix',
                'department_id' => 16, // Administration
                'category_id' => 7, // Email/Communication
                'staff_id' => 1,
                'priority_id' => 2, // Medium
                'status_id' => 3, // Completed
                'requester' => 'Admin Staff',
                'date' => Carbon::now()->subDays(9)->format('Y-m-d'),
                'starttime' => '08:00',
                'endtime' => '10:00',
                'remarks' => 'Outlook profile recreated. Exchange sync restored.',
            ],
            [
                'taskid' => 'T-2024-016',
                'description' => 'Invoice printer faded prints - replaced toner cartridge',
                'department_id' => 5, // Cashier
                'category_id' => 3, // Printer
                'staff_id' => 1,
                'priority_id' => 2, // Medium
                'status_id' => 3, // Completed
                'requester' => 'Cashier Supervisor',
                'date' => Carbon::now()->subDays(10)->format('Y-m-d'),
                'starttime' => '14:00',
                'endtime' => '14:30',
                'remarks' => 'New toner installed. Print quality restored.',
            ],
            [
                'taskid' => 'T-2024-017',
                'description' => 'CPU overheating - cleaned fans and reapplied thermal paste',
                'department_id' => 3, // Billing
                'category_id' => 1, // Computer Hardware
                'staff_id' => 2,
                'priority_id' => 3, // High
                'status_id' => 3, // Completed
                'requester' => 'Billing Staff',
                'date' => Carbon::now()->subDays(10)->format('Y-m-d'),
                'starttime' => '15:00',
                'endtime' => '17:00',
                'remarks' => 'Heavy dust buildup. Full cleaning performed.',
            ],
            [
                'taskid' => 'T-2024-018',
                'description' => 'Drug inventory system connectivity restored',
                'department_id' => 4, // Pharmacy
                'category_id' => 2, // Network
                'staff_id' => 1,
                'priority_id' => 3, // High
                'status_id' => 3, // Completed
                'requester' => 'Pharmacy Head',
                'date' => Carbon::now()->subDays(11)->format('Y-m-d'),
                'starttime' => '09:00',
                'endtime' => '10:30',
                'remarks' => 'Network cable was damaged. Replaced with new Cat6.',
            ],
            [
                'taskid' => 'T-2024-019',
                'description' => 'Nurse station camera angle adjustment',
                'department_id' => 8, // IPD (Inpatient)
                'category_id' => 5, // CCTV
                'staff_id' => 2,
                'priority_id' => 1, // Low
                'status_id' => 3, // Completed
                'requester' => 'Nursing Supervisor',
                'date' => Carbon::now()->subDays(11)->format('Y-m-d'),
                'starttime' => '11:00',
                'endtime' => '11:30',
                'remarks' => 'Camera repositioned per nursing supervisor request.',
            ],
            [
                'taskid' => 'T-2024-020',
                'description' => 'Patient monitoring software update installation',
                'department_id' => 15, // Nursing Station 2
                'category_id' => 4, // Software
                'staff_id' => 1,
                'priority_id' => 3, // High
                'status_id' => 1, // Pending
                'requester' => 'Department Head',
                'date' => Carbon::now()->addDays(2)->format('Y-m-d'),
                'starttime' => null,
                'endtime' => null,
                'remarks' => 'Update downloaded. Waiting for approval from dept head.',
            ],
        ];

        foreach ($tasks as $task) {
            DB::table('tasks')->insert([
                'taskid' => $task['taskid'],
                'description' => $task['description'],
                'department_id' => $task['department_id'],
                'category_id' => $task['category_id'],
                'staff_id' => $task['staff_id'],
                'priority_id' => $task['priority_id'],
                'status_id' => $task['status_id'],
                'requester' => $task['requester'],
                'date' => $task['date'],
                'starttime' => $task['starttime'],
                'endtime' => $task['endtime'],
                'remarks' => $task['remarks'],
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
        }
    }
}

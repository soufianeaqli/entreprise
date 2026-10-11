<?php

namespace App\Console\Commands;

use App\AI\Insights\InsightEngine;
use App\Models\User;
use App\Models\Notification;
use Illuminate\Console\Command;

class AIInsightsAnalyzeCommand extends Command
{
    protected $signature = 'ai:insights-analyze';
    protected $description = 'Run AI Insights analysis and generate notifications for critical findings';

    public function handle(InsightEngine $engine): int
    {
        $this->info('Running AI Insights analysis...');

        $result = $engine->run();

        $this->info("Found " . count($result['insights']) . " insights, saved {$result['saved']}.");

        // Generate notifications for critical insights
        $this->generateNotifications($result['insights']);

        $this->info('Analysis complete.');

        return self::SUCCESS;
    }

    private function generateNotifications(array $insights): void
    {
        $superAdmins = User::where('role', 'super_admin')->get();

        foreach ($insights as $insight) {
            if ($insight->severity->value !== 'critical') {
                continue;
            }

            foreach ($superAdmins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'role' => 'super_admin',
                    'title' => 'Alerte IA : ' . $insight->title,
                    'message' => $insight->description,
                    'type' => 'warning',
                    'link' => '/ai-insights',
                ]);
            }
        }
    }
}

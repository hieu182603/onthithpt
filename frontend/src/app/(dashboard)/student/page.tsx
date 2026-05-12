"use client";

import { DailyStreak } from '@/components/dashboard/DailyStreak';
import { ProficiencyChart } from '@/components/dashboard/ProficiencyChart';
import { WeakTopics } from '@/components/dashboard/WeakTopics';
import { StatsCards } from '@/components/dashboard/StatsCards';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { WeaknessHeatmap } from '@/components/dashboard/WeaknessHeatmap';
import { SmartQuizRecommendation } from '@/components/dashboard/SmartQuizRecommendation';
import { useAuthSession } from '@/lib/auth';

export default function StudentDashboardPage() {
  const session = useAuthSession();
  const displayName = session?.user?.fullName || 'Học Sinh';

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-8">
      <header className="mb-6 md:mb-8 border-b-2 border-foreground pb-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-foreground mb-2 tracking-tight">
          Chào bạn, {displayName}!
        </h1>
        <p className="text-lg text-muted-foreground font-medium">
          Hãy tiếp tục hành trình học tập hôm nay
        </p>
      </header>

      <StatsCards />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-4">
          <DailyStreak />
        </div>
        <div className="lg:col-span-8">
          <SmartQuizRecommendation />
        </div>
      </div>

      <ProficiencyChart />

      <WeaknessHeatmap />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        <div className="lg:col-span-7">
          <WeakTopics />
        </div>
        <div className="lg:col-span-5">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
}

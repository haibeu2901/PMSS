import React from "react";
import { Users, BookOpen, Briefcase, DoorOpen } from "lucide-react";
import { StatsCard } from "@/features/dashboard/components/StatsCard";
import { UserRolePieChart } from "@/features/dashboard/components/UserRolePieChart";
import { RecentUsersList } from "@/features/dashboard/components/RecentUsersList";
import { QuickActions } from "@/features/dashboard/components/QuickActions";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useDashboardStats } from "@/features/dashboard/api/useDashboard";

export const DashboardPage: React.FC = () => {
  const { data: stats, isLoading } = useDashboardStats();

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary/80 to-primary/60 rounded-2xl p-8 shadow-lg">
        <div className="flex flex-col gap-2">
          <h2 className="text-4xl font-bold text-white tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-white/90 text-lg font-medium">
            Welcome back, Administrator. Here's what's happening today.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <StatsCard
              icon={Users}
              title="Total Users"
              value={stats?.totalUsers.toLocaleString() || "0"}
              trend={5}
              bgColor="bg-gradient-to-br from-[#1E5BB8] to-[#154288]"
              iconBg="bg-white/20"
            />
            <StatsCard
              icon={BookOpen}
              title="Active Courses"
              value={stats?.totalCourses.toLocaleString() || "0"}
              trend={12}
              bgColor="bg-gradient-to-br from-slate-600 to-slate-700"
              iconBg="bg-white/20"
            />
            <StatsCard
              icon={Briefcase}
              title="Ongoing Projects"
              value={stats?.totalProjects.toLocaleString() || "0"}
              trend={2}
              bgColor="bg-gradient-to-br from-[#1E5BB8] to-[#154288]"
              iconBg="bg-white/20"
            />
            <StatsCard
              icon={DoorOpen}
              title="Total Classes"
              value={stats?.totalClasses.toLocaleString() || "0"}
              trend={8}
              bgColor="bg-gradient-to-br from-slate-600 to-slate-700"
              iconBg="bg-white/20"
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Charts + Recent Users */}
      {!isLoading && stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <UserRolePieChart data={stats.usersByRole} />
          <RecentUsersList users={stats.recentUsers} />
        </div>
      )}
    </div>
  );
};

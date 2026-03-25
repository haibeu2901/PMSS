import React from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Clock, UserCircle2 } from "lucide-react";
import type { DashboardUserNode } from "@/features/dashboard/api/useDashboard";

interface RecentUsersListProps {
  users: DashboardUserNode[];
}

const ROLE_BADGE: Record<string, string> = {
  Student: "bg-blue-100 text-blue-700",
  Teacher: "bg-purple-100 text-purple-700",
  Admin: "bg-amber-100 text-amber-700",
};

const AVATAR_COLOR: Record<string, string> = {
  Student: "bg-blue-500",
  Teacher: "bg-purple-500",
  Admin: "bg-amber-500",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export const RecentUsersList: React.FC<RecentUsersListProps> = ({ users }) => {
  return (
    <Card className="border-0 shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-gradient-to-br from-green-400 to-emerald-500 w-10 h-10 rounded-xl flex items-center justify-center">
            <UserCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Recent Users
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Latest registered accounts
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {users.map((user) => (
            <div
              key={user.userId}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-full ${AVATAR_COLOR[user.role] || "bg-gray-400"} flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>

              {/* Role + Time */}
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_BADGE[user.role] || "bg-gray-100 text-gray-600"}`}
                >
                  {user.role}
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(user.createdAt)}
                </span>
              </div>
            </div>
          ))}

          {users.length === 0 && (
            <p className="text-center text-slate-400 py-6 text-sm">
              No users yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

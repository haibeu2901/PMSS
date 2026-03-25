import React from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, BookPlus, CalendarPlus, FolderPlus } from "lucide-react";

const actions = [
  {
    label: "Add User",
    description: "Register new account",
    icon: UserPlus,
    color: "from-[#1E5BB8] to-[#154288]",
    hoverColor: "hover:from-[#1a51a8] hover:to-[#103878]",
    path: "/admin/users",
  },
  {
    label: "Add Course",
    description: "Create new course",
    icon: BookPlus,
    color: "from-slate-600 to-slate-700",
    hoverColor: "hover:from-slate-700 hover:to-slate-800",
    path: "/admin/courses",
  },
  {
    label: "Add Semester",
    description: "Set up new semester",
    icon: CalendarPlus,
    color: "from-[#1E5BB8] to-[#154288]",
    hoverColor: "hover:from-[#1a51a8] hover:to-[#103878]",
    path: "/admin/semesters",
  },
  {
    label: "Add Class",
    description: "Open a new class",
    icon: FolderPlus,
    color: "from-slate-600 to-slate-700",
    hoverColor: "hover:from-slate-700 hover:to-slate-800",
    path: "/admin/classes",
  },
];

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
        Quick Actions
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`bg-gradient-to-br ${action.color} ${action.hoverColor} rounded-xl p-4 text-white text-left transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0`}
            >
              <Icon className="w-6 h-6 mb-3 opacity-90" />
              <p className="font-semibold text-sm">{action.label}</p>
              <p className="text-xs opacity-80 mt-0.5">{action.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

import React from "react";
import { Edit, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import type { User } from "@/types";

export interface UserTableProps {
  users: User[];
  onEdit?: (user: User) => void;
  onDelete?: (user: User) => void;
}

export const UserTable: React.FC<UserTableProps> = ({
  users,
  onEdit,
  onDelete,
}) => {
  // Generate avatar background color based on role
  const getAvatarClass = (role: User["role"]) => {
    const map: Record<string, string> = {
      ADMIN: "bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300",
      TEACHER: "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
      STUDENT:
        "bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
    };
    return map[role.toUpperCase()] || "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300";
  };

  // Format role for display
  const formatRole = (role: string) => {
    return role.charAt(0) + role.slice(1).toLowerCase();
  };

  // Get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card>
      <Table>
        <TableHeader>
          <tr>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>GitHub</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.userId}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${getAvatarClass(user.role)}`}
                    >
                      {getInitials(user.name)}
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {user.name}
                    </div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-slate-600 dark:text-slate-300">
                {formatRole(user.role)}
              </TableCell>
              <TableCell className="text-slate-600 dark:text-slate-300">
                {user.githubUsername || "-"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit?.(user)}
                    className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                    title="Edit user"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete?.(user)}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                    title="Delete user"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
};

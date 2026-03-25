import { useQuery } from "@tanstack/react-query";
import { gql } from "graphql-request";
import { graphqlClient } from "@/lib/graphql";

// GraphQL queries for dashboard statistics
export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    users {
      nodes {
        userId
        name
        email
        role
        createdAt
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
    }
    courses {
      nodes {
        courseId
      }
    }
    projects {
      nodes {
        projectId
      }
    }
    classes {
      nodes {
        classId
      }
    }
  }
`;

export interface DashboardUserNode {
  userId: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface DashboardStatsResponse {
  users: { nodes: Array<DashboardUserNode> };
  courses: { nodes: Array<{ courseId: string }> };
  projects: { nodes: Array<{ projectId: string }> };
  classes: { nodes: Array<{ classId: string }> };
}

export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalProjects: number;
  totalClasses: number;
  usersByRole: Array<{ role: string; count: number; color: string }>;
  recentUsers: Array<DashboardUserNode>;
}

// Query keys
export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
};

const ROLE_COLORS: Record<string, string> = {
  Student: "#3b82f6",
  Teacher: "#8b5cf6",
  Admin: "#f59e0b",
};

// Fetch dashboard statistics using GraphQL
export const useDashboardStats = () => {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async (): Promise<DashboardStats> => {
      const data =
        await graphqlClient.request<DashboardStatsResponse>(
          GET_DASHBOARD_STATS,
        );

      const roleCounts = data.users.nodes.reduce<Record<string, number>>(
        (acc, user) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        },
        {},
      );

      const usersByRole = Object.entries(roleCounts).map(([role, count]) => ({
        role,
        count,
        color: ROLE_COLORS[role] || "#6b7280",
      }));

      const recentUsers = [...data.users.nodes]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 8);

      return {
        totalUsers: data.users.nodes.length,
        totalCourses: data.courses.nodes.length,
        totalProjects: data.projects.nodes.length,
        totalClasses: data.classes.nodes.length,
        usersByRole,
        recentUsers,
      };
    },
  });
};

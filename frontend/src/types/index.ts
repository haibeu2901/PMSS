// Database Schema Types - Matched to Backend
// Backend uses GUIDs (strings) for IDs

// ============================================
// ENUMS
// ============================================

// Role from REST API (login): "Admin", "Teacher", "Student" (PascalCase)
// Role from GraphQL: "ADMIN", "TEACHER", "STUDENT" (UPPERCASE)
export type UserRole =
  | "Admin"
  | "Teacher"
  | "Student"
  | "ADMIN"
  | "TEACHER"
  | "STUDENT";

// ============================================
// CORE ENTITIES
// ============================================

export interface User {
  userId: string;
  name: string;
  email: string;
  githubUsername: string | null;
  githubEmail: string | null;
  role: UserRole;
  avatar?: string; // Optional, for UI (computed from name)
  createdAt: string;
  updatedAt: string;
}

export interface Semester {
  semesterId: string;
  name: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  courseId: string;
  code: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  classId: string;
  semesterId: string;
  courseId: string;
  classCode: string;
  teacherId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  projectId: string;
  classId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClassEnrollment {
  classId: string;
  userId: string;
  courseId: string;
  enrolledAt: string;
}

export interface ProjectMember {
  projectId: string;
  userId: string;
  joinedAt: string;
}

// ============================================
// DTOs (Data Transfer Objects from Backend)
// ============================================

export interface ClassDto {
  classId: string;
  semesterId: string;
  semesterName: string;
  courseId: string;
  courseCode: string;
  courseName: string;
  classCode: string;
  teacherId: string;
  teacherName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassEnrollmentDto {
  classId: string;
  className: string;
  courseCode: string;
  courseName: string;
  classCode: string;
  semesterName: string;
  teacherName: string;
  userId: string;
  studentName: string;
  studentEmail: string;
  courseId: string;
  enrolledAt: string;
}

export interface ProjectMemberDto {
  projectId: string;
  projectName: string;
  userId: string;
  userName: string;
  userEmail: string;
  githubUsername: string | null;
  joinedAt: string;
}

export interface ProjectDto {
  projectId: string;
  classId: string;
  className: string;
  courseCode: string;
  courseName: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  class?: {
    teacher?: {
      userId: string;
      name: string;
    };
  };
}

export interface GithubRepoDto {
  githubRepoId: string;
  projectId: string;
  projectName: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  repoOwnerName: string;
  repoName: string;
  repoUrl: string;
  isPrivate: boolean;
  contributorCount: number;
  createdAt: string;
  updatedAt: string;
  contributors: RepoContributorDto[];
}

export interface RepoContributorDto {
  githubUsername: string;
  githubEmail: string | null;
  userId: string | null;
  userFullName: string | null;
  addedAt: string;
}

export interface JiraConfigDto {
  jiraConfigId: string;
  projectId: string;
  projectName: string;
  jiraUrl: string;
  email: string;
  apiTokenMasked: string;
  projectKey: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectGithubContributionDto {
  projectId: string;
  projectName: string;
  semesterStartDate: string;
  semesterEndDate: string;
  totalCommitsInSemester: number;
  totalAdditionsInSemester: number;
  totalDeletionsInSemester: number;
  repositories: RepoContributionDto[];
  overallCommitsOverTime: WeeklyCommitDto[];
  contributors: ContributorStatsDto[];
}

export interface RepoContributionDto {
  githubRepoId: string;
  repoOwnerName: string;
  repoName: string;
  repoUrl: string;
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
  lastSyncedAt: string | null;
}

export interface WeeklyCommitDto {
  weekStart: string;
  weekEnd: string;
  commitCount: number;
}

export interface ContributorStatsDto {
  githubUsername: string;
  githubEmail: string | null;
  userId: string | null;
  userFullName: string | null;
  totalCommits: number;
  totalAdditions: number;
  totalDeletions: number;
  weeklyActivity: WeeklyContributorActivityDto[];
}

export interface WeeklyContributorActivityDto {
  weekStart: string;
  weekEnd: string;
  commits: number;
  additions: number;
  deletions: number;
}

export interface GithubContributionReportSummaryDto {
  reportId: string;
  projectId: string;
  periodStart: string;
  periodEnd: string;
  totalCommits: number;
  contributorCount: number;
  activeContributorCount: number;
  executiveSummary: string;
  modelProvider: string;
  modelName: string;
  createdAt: string;
}

export interface GithubContributionReportDto extends GithubContributionReportSummaryDto {
  insightsJson: string;
  markdownContent: string;
}

// ============================================
// SUPPORTING TYPES
// ============================================

export interface Campus {
  id: string;
  name: string;
  code: string;
}

// ============================================
// AUTH TYPES
// ============================================

export interface LoginDto {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  token: string;
  expiresAt: string;
  userId: string;
  name: string;
  email: string;
  role: string; // "Admin", "Teacher", "Student"
}

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
}

// ============================================
// DASHBOARD
// ============================================

export interface DashboardStats {
  totalUsers: number;
  totalUsersTrend: number;
  activeCourses: number;
  activeCoursesTrend: number;
  ongoingProjects: number;
  ongoingProjectsTrend: number;
}

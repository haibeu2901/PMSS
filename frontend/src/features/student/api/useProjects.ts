import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { graphqlClient } from "@/lib/graphql";
import { gql } from "graphql-request";
import type {
  ProjectMemberDto,
  GithubRepoDto,
  JiraConfigDto,
  ProjectGithubContributionDto,
  GithubContributionReportDto,
  GithubContributionReportSummaryDto,
} from "@/types";
import {
  GET_USER_PROJECTS,
  GET_PROJECT_MEMBERS_LIST,
  GET_PROJECT_MEMBERSHIP,
  GET_PROJECT,
  GET_GITHUB_REPO,
  transformToProjectMemberDto,
  transformToProjectDto,
  transformToGithubRepoDto,
  type GetProjectMembersResponse,
  type GetUserProjectsResponse,
  type GetProjectMembersListResponse,
  type GetProjectMembershipResponse,
  type GetProjectsResponse,
  type GetProjectResponse,
  type GetGithubReposResponse,
  type GetGithubRepoResponse,
} from "./projectQueries";

// ============================================
// PROJECT MEMBERS - GraphQL
// ============================================

interface ProjectMemberFilterParams {
  projectId?: string;
  userId?: string;
}

export const useProjectMembers = (filterParams?: ProjectMemberFilterParams) => {
  return useQuery({
    queryKey: ["project-members", filterParams],
    queryFn: async () => {
      // Use conditional query to avoid null filter errors
      if (filterParams?.userId) {
        // Filter by userId  - use GET_USER_PROJECTS
        const data = await graphqlClient.request<GetUserProjectsResponse>(
          GET_USER_PROJECTS,
          { userId: filterParams.userId },
        );
        return data.projectMembers.nodes.map(transformToProjectMemberDto);
      } else if (filterParams?.projectId) {
        // Filter by projectId - use GET_PROJECT_MEMBERS_LIST
        const data = await graphqlClient.request<GetProjectMembersListResponse>(
          GET_PROJECT_MEMBERS_LIST,
          { projectId: filterParams.projectId },
        );
        return data.projectMembers.nodes.map(transformToProjectMemberDto);
      } else {
        // Get all project members
        const data = await graphqlClient.request<GetProjectMembersResponse>(gql`
          query GetAllProjectMembers {
            projectMembers {
              nodes {
                projectId
                userId
                joinedAt
                project {
                  projectId
                  name
                  description
                  classId
                  class {
                    classCode
                    courseId
                    course {
                      code
                      name
                    }
                  }
                }
                user {
                  userId
                  name
                  email
                  role
                }
              }
            }
          }
        `);
        return data.projectMembers.nodes.map(transformToProjectMemberDto);
      }
    },
  });
};

// Get all projects a user is member of - GraphQL
export const useUserProjects = (userId: string) => {
  return useQuery({
    queryKey: ["project-members", "user", userId],
    queryFn: async () => {
      const data = await graphqlClient.request<GetUserProjectsResponse>(
        GET_USER_PROJECTS,
        { userId },
      );
      return data.projectMembers.nodes.map(transformToProjectMemberDto);
    },
    enabled: !!userId,
  });
};

// Get all members of a project - GraphQL
export const useProjectMembersList = (projectId: string) => {
  return useQuery({
    queryKey: ["project-members", "project", projectId],
    queryFn: async () => {
      const data = await graphqlClient.request<GetProjectMembersListResponse>(
        GET_PROJECT_MEMBERS_LIST,
        { projectId },
      );
      return data.projectMembers.nodes.map(transformToProjectMemberDto);
    },
    enabled: !!projectId,
  });
};

// Get specific membership - GraphQL
export const useProjectMembership = (projectId: string, userId: string) => {
  return useQuery({
    queryKey: ["project-members", projectId, userId],
    queryFn: async () => {
      const data = await graphqlClient.request<GetProjectMembershipResponse>(
        GET_PROJECT_MEMBERSHIP,
        { projectId, userId },
      );
      // Return first node or null if no membership found
      return data.projectMembers.nodes.length > 0
        ? transformToProjectMemberDto(data.projectMembers.nodes[0])
        : null;
    },
    enabled: !!projectId && !!userId,
  });
};

// Add member to project
interface CreateProjectMemberDto {
  projectId: string;
  userId: string;
}

export const useAddProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProjectMemberDto) => {
      const response = await apiClient.post<ProjectMemberDto>(
        `/api/v1/projects/${data.projectId}/members`,
        { userId: data.userId },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

// Remove member from project
interface RemoveProjectMemberData {
  projectId: string;
  userId: string;
}

export const useRemoveProjectMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, userId }: RemoveProjectMemberData) => {
      await apiClient.delete(`/api/v1/projects/${projectId}/members/${userId}`);
      return { projectId, userId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

// ============================================
// PROJECTS - GraphQL
// ============================================

interface ProjectFilterParams {
  classId?: string;
  courseId?: string;
}

export const useProjects = (filterParams?: ProjectFilterParams) => {
  return useQuery({
    queryKey: ["projects", filterParams],
    queryFn: async () => {
      // Use conditional query to avoid null filter errors
      let query;
      let variables = {};

      if (filterParams?.classId) {
        // Filter by classId
        query = gql`
          query GetProjectsByClass($classId: UUID!) {
            projects(where: { classId: { eq: $classId } }) {
              nodes {
                projectId
                name
                description
                classId
                createdAt
                updatedAt
                class {
                  classId
                  classCode
                  courseId
                  semesterId
                  course {
                    courseId
                    code
                    name
                  }
                  semester {
                    semesterId
                    name
                  }
                  teacher {
                    userId
                    name
                  }
                }
              }
            }
          }
        `;
        variables = { classId: filterParams.classId };
      } else if (filterParams?.courseId) {
        // Filter by courseId
        query = gql`
          query GetProjectsByCourse($courseId: UUID!) {
            projects(where: { class: { courseId: { eq: $courseId } } }) {
              nodes {
                projectId
                name
                description
                classId
                createdAt
                updatedAt
                class {
                  classId
                  classCode
                  courseId
                  semesterId
                  course {
                    courseId
                    code
                    name
                  }
                  semester {
                    semesterId
                    name
                  }
                  teacher {
                    userId
                    name
                  }
                }
              }
            }
          }
        `;
        variables = { courseId: filterParams.courseId };
      } else {
        // Get all projects
        query = gql`
          query GetAllProjects {
            projects {
              nodes {
                projectId
                name
                description
                classId
                createdAt
                updatedAt
                class {
                  classId
                  classCode
                  courseId
                  semesterId
                  course {
                    courseId
                    code
                    name
                  }
                  semester {
                    semesterId
                    name
                  }
                  teacher {
                    userId
                    name
                  }
                }
              }
            }
          }
        `;
      }

      const data = await graphqlClient.request<GetProjectsResponse>(
        query,
        variables,
      );
      return data.projects.nodes.map(transformToProjectDto);
    },
  });
};

export const useProject = (projectId: string) => {
  return useQuery({
    queryKey: ["projects", projectId],
    queryFn: async () => {
      const data = await graphqlClient.request<GetProjectResponse>(
        GET_PROJECT,
        { projectId },
      );
      return data.projects.nodes.length > 0
        ? transformToProjectDto(data.projects.nodes[0] as any)
        : null;
    },
    enabled: !!projectId,
  });
};

// Create project mutation
interface CreateProjectDto {
  classId: string;
  name: string;
  description?: string;
}

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProjectDto) => {
      const response = await apiClient.post<any>("/api/v1/projects", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
    },
  });
};

// Update project mutation
interface UpdateProjectDto {
  projectId: string;
  name?: string;
  description?: string;
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, ...data }: UpdateProjectDto) => {
      const response = await apiClient.put<any>(
        `/api/v1/projects/${projectId}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
};

// Delete project mutation
export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      await apiClient.delete(`/api/v1/projects/${projectId}`);
      return projectId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project-members"] });
    },
  });
};

// ============================================
// JIRA CONFIG
// ============================================

export const useJiraConfig = (projectId: string) => {
  return useQuery({
    queryKey: ["jira-config", projectId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<JiraConfigDto>(
          `/api/jira/config/${projectId}`,
        );
        return response.data;
      } catch (error: any) {
        // 404 means no config exists - return null instead of throwing
        // Check both Axios style (if switched in future) and native Error message from ApiClient
        if (
          error?.response?.status === 404 ||
          error?.message?.includes("404") ||
          error?.message?.includes("not found") ||
          error?.message?.includes("No Jira configuration found")
        ) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!projectId,
  });
};

interface CreateJiraConfigDto {
  projectId: string;
  jiraUrl: string;
  email: string;
  apiToken: string;
  projectKey: string;
}

export const useCreateJiraConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateJiraConfigDto) => {
      const response = await apiClient.post<JiraConfigDto>(`/api/jira/config`, {
        projectId: data.projectId,
        jiraUrl: data.jiraUrl,
        email: data.email,
        apiToken: data.apiToken,
        projectKey: data.projectKey,
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["jira-config", variables.projectId],
      });
    },
  });
};

interface UpdateJiraConfigDto {
  projectId: string;
  jiraUrl?: string;
  email?: string;
  apiToken?: string;
  projectKey?: string;
  isActive?: boolean;
}

export const useUpdateJiraConfig = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, ...data }: UpdateJiraConfigDto) => {
      const response = await apiClient.put<JiraConfigDto>(
        `/api/jira/config/${projectId}`,
        data,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["jira-config", variables.projectId],
      });
    },
  });
};

// ============================================
// JIRA SRS
// ============================================

export interface GenerateSrsFileResponse {
  success: boolean;
  filePath: string;
  data?: string;
}

export interface ListSrsFilesResponse {
  projectId: string;
  files: string[];
  count: number;
}

export const useListSrsFiles = (projectId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ["jira-srs-files", projectId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<ListSrsFilesResponse>(
          `/api/jira/srs/files/${projectId}`,
        );
        return response.data;
      } catch (error: any) {
        if (
          error?.message?.includes("400") ||
          error?.message?.includes("404")
        ) {
          return { projectId, files: [], count: 0 };
        }
        throw error;
      }
    },
    enabled: !!projectId && enabled,
  });
};

export interface GenerateSrsOptions {
  usePaidModel?: boolean;
  modelOption?: string;
}

export const useGenerateSrs = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      ...options
    }: {
      projectId: string;
    } & GenerateSrsOptions) => {
      // Use URLSearchParams to pass parameters in query string for GET request
      const params = new URLSearchParams();
      if (options.usePaidModel)
        params.append("usePaidModel", String(options.usePaidModel));
      if (options.modelOption)
        params.append("modelOption", options.modelOption);

      const response = await apiClient.get<string>(
        `/api/v1/projects/${projectId}/srs/markdown?${params.toString()}`,
      );
      console.log(response.data);
      // The response is already the data we want (markdown string)
      return { success: true, filePath: "", data: response.data };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["jira-srs-files", variables.projectId],
      });
    },
  });
};

// ============================================
// GITHUB REPOS - GraphQL
// ============================================

interface GithubRepoFilterParams {
  projectId?: string;
}

export const useGithubRepos = (filterParams?: GithubRepoFilterParams) => {
  return useQuery({
    queryKey: ["github-repos", filterParams],
    queryFn: async () => {
      // Use conditional query to avoid null filter errors
      if (filterParams?.projectId) {
        // Filter by projectId
        const query = gql`
          query GetGithubReposByProject($projectId: UUID!) {
            githubRepos(where: { projectId: { eq: $projectId } }) {
              nodes {
                githubRepoId
                projectId
                repoOwnerName
                repoName
                isPrivate
                apiToken
                totalCommits
                totalAdditions
                totalDeletions
                lastSyncedAt
                createdAt
                updatedAt
                project {
                  projectId
                  name
                  classId
                  class {
                    classCode
                    courseId
                    course {
                      code
                      name
                    }
                  }
                }
              }
            }
          }
        `;
        const data = await graphqlClient.request<GetGithubReposResponse>(
          query,
          { projectId: filterParams.projectId },
        );
        return data.githubRepos.nodes.map(transformToGithubRepoDto);
      } else {
        // Get all repos
        const query = gql`
          query GetAllGithubRepos {
            githubRepos {
              nodes {
                githubRepoId
                projectId
                repoOwnerName
                repoName
                isPrivate
                apiToken
                totalCommits
                totalAdditions
                totalDeletions
                lastSyncedAt
                createdAt
                updatedAt
                project {
                  projectId
                  name
                  classId
                  class {
                    classCode
                    courseId
                    course {
                      code
                      name
                    }
                  }
                }
              }
            }
          }
        `;
        const data = await graphqlClient.request<GetGithubReposResponse>(query);
        return data.githubRepos.nodes.map(transformToGithubRepoDto);
      }
    },
  });
};

export const useGithubRepo = (githubRepoId: string) => {
  return useQuery({
    queryKey: ["github-repos", githubRepoId],
    queryFn: async () => {
      const data = await graphqlClient.request<GetGithubRepoResponse>(
        GET_GITHUB_REPO,
        { githubRepoId },
      );
      return data.githubRepos.nodes.length > 0
        ? transformToGithubRepoDto(data.githubRepos.nodes[0] as any)
        : null;
    },
    enabled: !!githubRepoId,
  });
};

export const useProjectGithubContributions = (
  projectId: string,
  hasRepos: boolean = true,
) => {
  return useQuery({
    queryKey: ["github-contributions", projectId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<ProjectGithubContributionDto>(
          `/api/v1/projects/${projectId}/github-contributions`,
        );
        return response.data;
      } catch (error: any) {
        // Return null if no contributions found (404) instead of throwing error
        if (error.response?.status === 404) {
          return null;
        }
        throw error;
      }
    },
    enabled: !!projectId && hasRepos, // Only fetch when project has repos
  });
};

export const useGithubContributionReports = (
  projectId: string,
  take: number = 10,
) => {
  return useQuery({
    queryKey: ["github-reports", projectId, take],
    queryFn: async () => {
      const response = await apiClient.get<
        GithubContributionReportSummaryDto[]
      >(`/api/v1/projects/${projectId}/github-reports`, { take });
      return response.data;
    },
    enabled: !!projectId,
  });
};

export const useGithubContributionReport = (
  projectId: string,
  reportId?: string | null,
) => {
  return useQuery({
    queryKey: ["github-report-detail", projectId, reportId],
    queryFn: async () => {
      const response = await apiClient.get<GithubContributionReportDto>(
        `/api/v1/projects/${projectId}/github-reports/${reportId}`,
      );
      return response.data;
    },
    enabled: !!projectId && !!reportId,
  });
};

export interface GenerateGithubContributionReportOptions {
  usePaidModel?: boolean;
  modelOption?: string;
  recentWeeks?: number;
  includeMermaidDiagrams?: boolean;
}

export const useGithubReportMermaidBlocks = (
  projectId: string,
  reportId?: string | null,
) => {
  return useQuery({
    queryKey: ["github-report-mermaid-blocks", projectId, reportId],
    queryFn: async () => {
      const response = await apiClient.get<{ blocks: string[] }>(
        `/api/v1/projects/${projectId}/github-reports/${reportId}/mermaid/blocks`,
      );
      return response.data.blocks;
    },
    enabled: !!projectId && !!reportId,
  });
};

export const useGenerateGithubContributionReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      projectId,
      ...options
    }: {
      projectId: string;
    } & GenerateGithubContributionReportOptions) => {
      const response = await apiClient.post<GithubContributionReportDto>(
        `/api/v1/projects/${projectId}/github-reports`,
        options,
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["github-reports", variables.projectId],
      });
    },
  });
};

interface CreateGithubRepoDto {
  projectId: string;
  repoOwnerName: string;
  repoName: string;
  isPrivate: boolean;
  apiToken?: string;
}

export const useCreateGithubRepo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      ...data
    }: CreateGithubRepoDto & { userId: string }) => {
      const response = await apiClient.post<GithubRepoDto>(
        `/api/v1/github-repos`,
        data,
        {
          headers: {
            "X-User-Id": userId,
          },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github-repos"] });
      queryClient.invalidateQueries({ queryKey: ["github-contributions"] });
    },
  });
};

interface UpdateGithubRepoDto {
  repoId: string;
  userId: string;
  repoOwnerName: string;
  repoName: string;
  isPrivate: boolean;
  apiToken?: string;
}

export const useUpdateGithubRepo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ repoId, userId, ...data }: UpdateGithubRepoDto) => {
      const response = await apiClient.put<GithubRepoDto>(
        `/api/v1/github-repos/${repoId}`,
        data,
        {
          headers: {
            "X-User-Id": userId,
          },
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github-repos"] });
      queryClient.invalidateQueries({ queryKey: ["github-contributions"] });
    },
  });
};

export const useDeleteGithubRepo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      repoId,
      userId,
    }: {
      repoId: string;
      userId: string;
    }) => {
      await apiClient.delete(`/api/v1/github-repos/${repoId}`, {
        headers: {
          "X-User-Id": userId,
        },
      });
      return { repoId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github-repos"] });
      queryClient.invalidateQueries({ queryKey: ["github-contributions"] });
    },
  });
};

// Sync GitHub data for a project
export const useSyncProjectGithub = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await apiClient.post<any>(
        `/api/v1/github-sync/projects/${projectId}`,
        {},
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github-contributions"] });
      queryClient.invalidateQueries({ queryKey: ["github-repos"] });
    },
  });
};

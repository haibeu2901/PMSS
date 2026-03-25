import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { graphqlClient } from "@/lib/graphql";
import { apiClient } from "@/lib/api";
import { gql } from "graphql-request";
import type { Class } from "@/types";

// GraphQL Query with related data
export const GET_CLASSES = gql`
  query GetClasses {
    classes {
      nodes {
        classId
        semesterId
        courseId
        classCode
        teacherId
        createdAt
        updatedAt
        course {
          courseId
          code
          name
        }
        teacher {
          userId
          name
          email
        }
        semester {
          semesterId
          name
        }
      }
    }
  }
`;

export interface ClassWithRelations extends Class {
  course?: {
    courseId: string;
    code: string;
    name: string;
  };
  teacher?: {
    userId: string;
    name: string;
    email: string;
  };
  semester?: {
    semesterId: string;
    name: string;
  };
}

export interface GetClassesResponse {
  classes: {
    nodes: ClassWithRelations[];
  };
}

// GraphQL Query for single class by ID
export const GET_CLASS_BY_ID = gql`
  query GetClassById($classId: UUID!) {
    classes(where: { classId: { eq: $classId } }) {
      nodes {
        classId
        semesterId
        courseId
        classCode
        teacherId
        createdAt
        updatedAt
        course {
          courseId
          code
          name
        }
        teacher {
          userId
          name
          email
        }
        semester {
          semesterId
          name
        }
      }
    }
  }
`;

export interface GetClassByIdResponse {
  classes: {
    nodes: ClassWithRelations[];
  };
}

// Query keys
export const classKeys = {
  all: ["classes"] as const,
  lists: () => [...classKeys.all, "list"] as const,
  list: (filters: any) => [...classKeys.lists(), filters] as const,
  details: () => [...classKeys.all, "detail"] as const,
  detail: (id: string) => [...classKeys.details(), id] as const,
};

// ... existing queries ...

// Fetch all classes via GraphQL
export const useClasses = () => {
  return useQuery({
    queryKey: classKeys.all,
    queryFn: async () => {
      const data = await graphqlClient.request<GetClassesResponse>(GET_CLASSES);
      return data.classes.nodes;
    },
  });
};

// Fetch single class via GraphQL
export const useClass = (classId: string) => {
  return useQuery({
    queryKey: classKeys.detail(classId),
    queryFn: async () => {
      const data = await graphqlClient.request<GetClassByIdResponse>(
        GET_CLASS_BY_ID,
        { classId },
      );
      // Return the first node from the filtered result
      return data.classes.nodes[0] || null;
    },
    enabled: !!classId,
  });
};

// Create class mutation
export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      semesterId: string;
      courseId: string;
      classCode: string;
      teacherId: string;
    }) => {
      const response = await apiClient.post<Class>("/api/v1/classes", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
};

// Update class mutation
export const useUpdateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Class> }) => {
      const response = await apiClient.put<Class>(
        `/api/v1/classes/${id}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
};

// Delete class mutation
export const useDeleteClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/v1/classes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: classKeys.all });
    },
  });
};

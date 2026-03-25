import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Search, FolderKanban, ArrowRight, Plus } from "lucide-react";
import {
  useUserProjects,
  useCreateProject,
  useAddProjectMember,
} from "../api/useProjects";
import { useUserEnrollments } from "../api/useEnrollments";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { ProjectMemberDto } from "@/types";

export function StudentWorkspaceListPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const navigate = useNavigate();

  const { data: projectMemberships = [], isLoading } = useUserProjects(
    user?.userId || "",
  );

  // Get user's enrolled classes for dropdown
  const { data: enrollments = [] } = useUserEnrollments(user?.userId || "");

  const createProjectMutation = useCreateProject();
  const addMemberMutation = useAddProjectMember();

  const filteredProjects = projectMemberships.filter((membership) =>
    membership.projectName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !projectName.trim() || !user) return;

    try {
      // Step 1: Create project
      const result = await createProjectMutation.mutateAsync({
        classId: selectedClassId,
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
      });

      // Step 2: Add current user as member
      await addMemberMutation.mutateAsync({
        projectId: result.projectId,
        userId: user.userId,
      });

      // Reset form and close modal
      setShowCreateModal(false);
      setSelectedClassId("");
      setProjectName("");
      setProjectDescription("");

      toast.success("Project created successfully");

      // Navigate to the new project workspace
      navigate(`/student/workspace/${result.projectId}`);
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create project. Please try again.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Workspace</h1>
          <p className="text-sm text-gray-500">
            View and manage your project workspaces
          </p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Projects */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">
          Loading workspace...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No projects found" : "No projects yet"}
          </h3>
          <p className="text-gray-500">
            {searchTerm
              ? "Try a different search term"
              : "You haven't joined any projects yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((membership) => (
            <ProjectWorkspaceCard
              key={membership.projectId}
              membership={membership}
              onClick={() =>
                navigate(`/student/workspace/${membership.projectId}`)
              }
            />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Project"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          {/* Class Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Class <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              placeholder="Choose a class..."
              options={enrollments.map((enrollment) => ({
                value: enrollment.classId,
                label: `${enrollment.classCode} - ${enrollment.courseName} (${enrollment.semesterName})`,
              }))}
              required
            />
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>

          {/* Project Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <Textarea
              value={projectDescription}
              onChange={(e) => setProjectDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                !selectedClassId ||
                !projectName.trim() ||
                createProjectMutation.isPending
              }
            >
              {createProjectMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

// ============================================
// PROJECT WORKSPACE CARD
// ============================================

interface ProjectWorkspaceCardProps {
  membership: ProjectMemberDto;
  onClick: () => void;
}

function ProjectWorkspaceCard({
  membership,
  onClick,
}: ProjectWorkspaceCardProps) {
  return (
    <Card
      className="p-4 hover:shadow-lg transition-shadow cursor-pointer group"
      onClick={onClick}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
              {membership.projectName}
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Joined {new Date(membership.joinedAt).toLocaleDateString()}
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {membership.projectName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600">{membership.userName}</p>
          </div>
        </div>

        {membership.githubUsername && (
          <Badge variant="secondary">@{membership.githubUsername}</Badge>
        )}
      </div>
    </Card>
  );
}

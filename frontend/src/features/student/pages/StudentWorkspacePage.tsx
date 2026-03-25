import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  Info,
  CheckSquare,
  Github,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import {
  useProject,
  useUpdateProject,
  useDeleteProject,
} from "../api/useProjects";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ProjectInfoTab } from "../components/ProjectInfoTab";
import { ProjectJiraTab } from "../components/ProjectJiraTab";
import { ProjectGithubTab } from "../components/ProjectGithubTab";

export function StudentWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("info");
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const { data: project, isLoading, error } = useProject(projectId || "");
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();

  // Check if user is a student (can edit/delete)
  const isStudent = user?.role === "Student" || user?.role === "STUDENT";

  if (!projectId) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">No project selected</p>
          <Button
            onClick={() => navigate("/student/workspace")}
            className="mt-4"
          >
            Go to Workspace
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-gray-500">
          Loading project...
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-red-500 mb-4">Failed to load project</p>
          <Button onClick={() => navigate("/student/workspace")}>
            Go to Workspace
          </Button>
        </div>
      </div>
    );
  }

  const handleEditProject = () => {
    setEditName(project?.name || "");
    setEditDescription(project?.description || "");
    setShowEditModal(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !editName.trim()) return;

    try {
      await updateProjectMutation.mutateAsync({
        projectId,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
      });
      toast.success("Project updated successfully");
      setShowEditModal(false);
    } catch (error) {
      console.error("Failed to update project:", error);
      toast.error("Failed to update project. Please try again.");
    }
  };

  const handleDeleteProject = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectId) return;

    try {
      await deleteProjectMutation.mutateAsync(projectId);
      toast.success("Project deleted successfully");
      navigate("/student/workspace");
    } catch (error) {
      console.error("Failed to delete project:", error);
      toast.error("Failed to delete project. Please try again.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/student/workspace")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          <p className="text-sm text-gray-500">
            {project.courseCode} • {project.className}
          </p>
        </div>
        {/* Edit and Delete buttons - Only for Students */}
        {isStudent && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleEditProject}
              className="flex items-center gap-2"
            >
              <Pencil className="w-4 h-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteProject}
              disabled={deleteProjectMutation.isPending}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              {deleteProjectMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">
            <Info className="w-4 h-4 mr-2" />
            Info
          </TabsTrigger>
          <TabsTrigger value="jira">
            <CheckSquare className="w-4 h-4 mr-2" />
            Jira
          </TabsTrigger>
          <TabsTrigger value="github">
            <Github className="w-4 h-4 mr-2" />
            GitHub
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info">
          <ProjectInfoTab project={project} />
        </TabsContent>

        <TabsContent value="jira">
          <ProjectJiraTab projectId={project.projectId} />
        </TabsContent>

        <TabsContent value="github">
          <ProjectGithubTab projectId={project.projectId} />
        </TabsContent>
      </Tabs>

      {/* Edit Project Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Project"
      >
        <form onSubmit={handleUpdateProject} className="space-y-4">
          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
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
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              placeholder="Enter project description"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!editName.trim() || updateProjectMutation.isPending}
            >
              {updateProjectMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete "${project.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteProjectMutation.isPending}
      />
    </div>
  );
}

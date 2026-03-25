import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  FolderKanban,
  Plus,
  Search,
  ArrowRight,
  UserPlus,
} from "lucide-react";
import {
  useProjects,
  useCreateProject,
  useAddProjectMember,
  useUserProjects,
} from "../api/useProjects";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function StudentClassProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { classId } = useParams<{ classId: string }>();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Get all projects for this class
  const { data: allProjects = [], isLoading } = useProjects({
    classId,
  });
  const createProjectMutation = useCreateProject();
  const addMemberMutation = useAddProjectMember();

  // Get user's joined projects to check membership
  const { data: userProjects = [] } = useUserProjects(user?.userId || "");

  const filteredProjects = allProjects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Check if current user is member of a project
  const isUserMember = (projectId: string) => {
    return userProjects.some((p) => p.projectId === projectId);
  };

  const handleJoinProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      await addMemberMutation.mutateAsync({
        projectId,
        userId: user.userId,
      });
      toast.success("Joined project successfully");
      // Navigate to workspace after joining
      navigate(`/student/workspace/${projectId}`);
    } catch (error) {
      console.error("Failed to join project:", error);
      toast.error("Failed to join project. Please try again.");
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !projectName.trim() || !user) return;

    try {
      // Step 1: Create project
      const result = await createProjectMutation.mutateAsync({
        classId,
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
      });

      // Step 2: Add current user as member
      await addMemberMutation.mutateAsync({
        projectId: result.projectId,
        userId: user.userId,
      });

      toast.success("Project created successfully");

      // Navigate to the new project workspace
      navigate(`/student/workspace/${result.projectId}`);

      setProjectName("");
      setProjectDescription("");
      setShowCreateForm(false);
    } catch (error) {
      console.error("Failed to save project:", error);
      toast.error("Failed to save project. Please try again.");
    }
  };

  if (!classId) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Invalid class</p>
          <Button onClick={() => navigate("/student/classes")} className="mt-4">
            Back to Classes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/student/classes")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">Class Projects</h1>
          <p className="text-sm text-gray-500">
            View and manage projects for this class
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-gray-500">
          Loading projects...
        </div>
      ) : allProjects.length === 0 ? (
        /* No projects yet - Show create form */
        <div className="max-w-2xl mx-auto">
          <Card className="p-8">
            <div className="text-center mb-6">
              <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No projects yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first project for this class
              </p>
            </div>

            {!showCreateForm ? (
              <div className="text-center">
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Button>
              </div>
            ) : (
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Enter project description (optional)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setProjectName("");
                      setProjectDescription("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={createProjectMutation.isPending}
                  >
                    Create Project
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      ) : (
        /* Has projects - Show list */
        <div className="space-y-4">
          {/* Search & Create Button */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </div>

          {/* Create Form Modal */}
          {showCreateForm && (
            <Card className="p-6 border-2 border-blue-500">
              <h3 className="text-lg font-semibold mb-4">Create New Project</h3>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Enter project name"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                    placeholder="Enter project description (optional)"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setProjectName("");
                      setProjectDescription("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    isLoading={createProjectMutation.isPending}
                  >
                    Create Project
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <FolderKanban className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No projects found
              </h3>
              <p className="text-gray-500">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProjects.map((project) => {
                const isMember = isUserMember(project.projectId);

                return (
                  <Card
                    key={project.projectId}
                    className="p-4 hover:shadow-lg transition-shadow group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                            {project.name}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            Created{" "}
                            {new Date(project.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        {isMember && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            Joined
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-medium text-sm">
                            {project.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-600">
                            {project.courseName}
                          </p>
                        </div>
                      </div>

                      {project.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      {/* Action Button */}
                      <div className="pt-2">
                        {isMember ? (
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() =>
                              navigate(
                                `/student/workspace/${project.projectId}`,
                              )
                            }
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Open Workspace
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            onClick={(e) =>
                              handleJoinProject(project.projectId, e)
                            }
                            isLoading={addMemberMutation.isPending}
                          >
                            <UserPlus className="w-4 h-4 mr-2" />
                            Join Project
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

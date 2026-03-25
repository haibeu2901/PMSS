import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Users,
  Mail,
  UserPlus,
  Trash2,
} from "lucide-react";
import { useClass } from "../api/useClasses";
import {
  useClassEnrollments,
  useUnenrollment,
} from "@/features/student/api/useEnrollments";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { Card } from "@/components/ui/Card";
import { AddStudentModal } from "../components/AddStudentModal";
import { ConfirmDialog } from "@/components/ui/Modal";
import { toast } from "react-hot-toast";

export function ClassDetailPage() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("info");
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<string | null>(null);

  const {
    data: classData,
    isLoading: isClassLoading,
    error: classError,
  } = useClass(classId || "");
  const { data: enrollments, isLoading: isEnrollmentsLoading } =
    useClassEnrollments(classId || "");

  const unenrollMutation = useUnenrollment();

  const handleRemoveStudent = async () => {
    if (!classId || !studentToRemove) return;

    try {
      await unenrollMutation.mutateAsync({
        classId,
        userId: studentToRemove,
      });
      toast.success("Student removed successfully");
      setStudentToRemove(null);
    } catch (error) {
      console.error("Failed to remove student:", error);
      toast.error("Failed to remove student");
    }
  };

  if (!classId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Invalid class ID</p>
      </div>
    );
  }

  if (isClassLoading || isEnrollmentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (classError || !classData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Failed to load class details</p>
      </div>
    );
  }

  const studentCount = enrollments?.length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={() => navigate("/admin/classes")}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {classData.classCode}
          </h1>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
            {classData.course && (
              <span>
                {classData.course.code} - {classData.course.name}
              </span>
            )}
            {classData.semester && <span>• {classData.semester.name}</span>}
            <span>
              • {studentCount} {studentCount === 1 ? "student" : "students"}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            Class Info
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Students ({studentCount})
          </TabsTrigger>
        </TabsList>

        {/* Class Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Class Code
                </label>
                <p className="text-base text-gray-900 dark:text-gray-100 mt-1">
                  {classData.classCode}
                </p>
              </div>
              {classData.course && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Course
                  </label>
                  <p className="text-base text-gray-900 dark:text-gray-100 mt-1">
                    {classData.course.code} - {classData.course.name}
                  </p>
                </div>
              )}
              {classData.semester && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Semester
                  </label>
                  <p className="text-base text-gray-900 dark:text-gray-100 mt-1">
                    {classData.semester.name}
                  </p>
                </div>
              )}
              {classData.teacher && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Teacher
                  </label>
                  <p className="text-base text-gray-900 dark:text-gray-100 mt-1">
                    {classData.teacher.name} ({classData.teacher.email})
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Created At
                  </label>
                  <p className="text-base text-gray-900 dark:text-gray-100 mt-1">
                    {new Date(classData.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Updated At
                  </label>
                  <p className="text-base text-gray-900 dark:text-gray-100 mt-1">
                    {new Date(classData.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => setIsAddStudentModalOpen(true)}
              className="flex items-center gap-2"
              size="sm"
            >
              <UserPlus className="w-4 h-4" />
              Add Student
            </Button>
          </div>

          {!enrollments || enrollments.length === 0 ? (
            <Card className="p-6">
              <p className="text-gray-500 text-center">
                No students enrolled in this class yet
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.userId} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                        {enrollment.studentName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                          {enrollment.studentName}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <Mail className="w-4 h-4" />
                          {enrollment.studentEmail}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                        <div className="font-medium">Enrolled</div>
                        <div>
                          {new Date(enrollment.enrolledAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                        onClick={() => setStudentToRemove(enrollment.userId)}
                        title="Remove student"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {classId && (
        <AddStudentModal
          isOpen={isAddStudentModalOpen}
          onClose={() => setIsAddStudentModalOpen(false)}
          classId={classId}
        />
      )}

      {/* Remove Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!studentToRemove}
        onClose={() => setStudentToRemove(null)}
        onConfirm={handleRemoveStudent}
        title="Remove Student"
        message="Are you sure you want to remove this student from the class? This action cannot be undone."
        confirmText="Remove"
        variant="danger"
        isLoading={unenrollMutation.isPending}
      />
    </div>
  );
}

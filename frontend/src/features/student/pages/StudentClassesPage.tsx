import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Plus, Search, BookOpen, Users, GraduationCap } from "lucide-react";
import { useUserEnrollments, useUnenrollment } from "../api/useEnrollments";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { ClassEnrollmentDto } from "@/types";

export function StudentClassesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [classToUnenroll, setClassToUnenroll] = useState<string | null>(null);

  const { data: enrollments = [], isLoading } = useUserEnrollments(
    user?.userId || "",
  );
  const unenrollMutation = useUnenrollment();

  // Filter enrolled classes by search term
  const filteredEnrollments = enrollments.filter((enrollment) =>
    [
      enrollment.courseName,
      enrollment.courseCode,
      enrollment.classCode,
      enrollment.semesterName,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const handleUnenroll = (classId: string) => {
    setClassToUnenroll(classId);
  };

  const handleConfirmUnenroll = async () => {
    if (!classToUnenroll || !user) return;

    try {
      await unenrollMutation.mutateAsync({
        classId: classToUnenroll,
        userId: user.userId,
      });
      toast.success("Unenrolled from class successfully");
      setClassToUnenroll(null);
    } catch (error) {
      console.error("Failed to unenroll:", error);
      toast.error("Failed to unenroll from class");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Classes</h1>
          <p className="text-sm text-gray-500">Manage your class enrollments</p>
        </div>
        <Button onClick={() => navigate("/student/enroll")}>
          <Plus className="w-4 h-4 mr-2" />
          Enroll in Class
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search classes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Enrolled Classes */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : filteredEnrollments.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No classes found" : "No enrolled classes"}
          </h3>
          <p className="text-gray-500 mb-4">
            {searchTerm
              ? "Try a different search term"
              : "Start by enrolling in a class"}
          </p>
          {!searchTerm && (
            <Button onClick={() => navigate("/student/enroll")}>
              Enroll in Class
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEnrollments.map((enrollment) => (
            <ClassEnrollmentCard
              key={enrollment.classId}
              enrollment={enrollment}
              onUnenroll={handleUnenroll}
              navigate={navigate}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={!!classToUnenroll}
        onClose={() => setClassToUnenroll(null)}
        onConfirm={handleConfirmUnenroll}
        title="Unenroll from Class"
        message="Are you sure you want to unenroll from this class?"
        confirmText="Unenroll"
        cancelText="Cancel"
        variant="danger"
        isLoading={unenrollMutation.isPending}
      />
    </div>
  );
}

// ============================================
// CLASS ENROLLMENT CARD
// ============================================

interface ClassEnrollmentCardProps {
  enrollment: ClassEnrollmentDto;
  onUnenroll: (classId: string) => void;
  navigate: (path: string) => void;
}

function ClassEnrollmentCard({
  enrollment,
  onUnenroll,
  navigate,
}: ClassEnrollmentCardProps) {
  return (
    <Card className="p-4 hover:shadow-lg transition-shadow">
      <div className="space-y-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {enrollment.courseName}
            </h3>
            <p className="text-sm text-gray-500">{enrollment.courseCode}</p>
          </div>
          <Badge variant="info">{enrollment.classCode}</Badge>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <GraduationCap className="w-4 h-4" />
            <span>{enrollment.semesterName}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Users className="w-4 h-4" />
            <span>{enrollment.teacherName}</span>
          </div>
          <div className="text-gray-500 text-xs">
            Enrolled: {new Date(enrollment.enrolledAt).toLocaleDateString()}
          </div>
        </div>

        <div className="pt-3 border-t flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUnenroll(enrollment.classId)}
            className="flex-1"
          >
            Unenroll
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              navigate(`/student/classes/${enrollment.classId}/projects`)
            }
            className="flex-1"
          >
            View Projects
          </Button>
        </div>
      </div>
    </Card>
  );
}

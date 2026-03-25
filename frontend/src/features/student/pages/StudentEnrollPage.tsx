import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowLeft, Search, BookOpen, Calendar, User } from "lucide-react";
import { useAvailableClasses } from "../api/useClasses";
import { useUserEnrollments, useCreateEnrollment } from "../api/useEnrollments";
import { useAuth } from "@/features/auth/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export function StudentEnrollPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: allClasses = [], isLoading } = useAvailableClasses();
  const { data: enrollments = [] } = useUserEnrollments(user?.userId || "");
  const createEnrollmentMutation = useCreateEnrollment();

  // Get enrolled class IDs
  const enrolledClassIds = new Set(enrollments.map((e) => e.classId));

  // Filter available classes (not yet enrolled)
  const availableClasses = allClasses.filter(
    (c) => !enrolledClassIds.has(c.classId),
  );

  // Filter by search term
  const filteredClasses = availableClasses.filter((classItem) =>
    [
      classItem.courseName,
      classItem.courseCode,
      classItem.classCode,
      classItem.semesterName,
      classItem.teacherName,
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const handleEnroll = async (classId: string) => {
    if (!user) return;

    try {
      await createEnrollmentMutation.mutateAsync({
        classId,
        userId: user.userId,
      });
      toast.success("Enrolled in class successfully");
      // Navigate back to classes page after successful enrollment
      navigate("/student/classes");
    } catch (error) {
      console.error("Failed to enroll:", error);
      toast.error("Failed to enroll in class");
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">
            Available Classes
          </h1>
          <p className="text-sm text-gray-500">Select a class to enroll in</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by course, class code, semester, or teacher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Classes Table */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : filteredClasses.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? "No classes found" : "No available classes"}
          </h3>
          <p className="text-gray-500">
            {searchTerm
              ? "Try a different search term"
              : "All available classes have been enrolled"}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Semester
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClasses.map((classItem) => (
                <tr
                  key={classItem.classId}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Badge variant="info">{classItem.classCode}</Badge>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {classItem.courseName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {classItem.courseCode}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {classItem.semesterName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-900">
                        {classItem.teacherName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <Button
                      size="sm"
                      onClick={() => handleEnroll(classItem.classId)}
                      isLoading={createEnrollmentMutation.isPending}
                    >
                      Enroll
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary */}
      {!isLoading && filteredClasses.length > 0 && (
        <div className="text-sm text-gray-500 text-center">
          Showing {filteredClasses.length} available{" "}
          {filteredClasses.length === 1 ? "class" : "classes"}
        </div>
      )}
    </div>
  );
}

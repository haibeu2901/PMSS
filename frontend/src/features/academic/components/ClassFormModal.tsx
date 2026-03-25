import React, { useState, useEffect } from "react";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  useCreateClass,
  useUpdateClass,
  useDeleteClass,
  type ClassWithRelations,
} from "../api/useClasses";
import {
  useCreateEnrollment,
  useUnenrollment,
  useClassEnrollments,
} from "@/features/student/api/useEnrollments";
import { useSemesters } from "../api/useSemesters";
import { useCourses } from "../api/useCourses";
import { useUsers, useUsersWithFilters } from "@/features/users/api/useUsers";
import toast from "react-hot-toast";

interface ClassFormData {
  semesterId: string;
  courseId: string;
  classCode: string;
  teacherId: string;
}

const initialFormData: ClassFormData = {
  semesterId: "",
  courseId: "",
  classCode: "",
  teacherId: "",
};

interface ClassFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData?: ClassWithRelations | null;
  mode: "create" | "edit";
}

export const ClassFormModal: React.FC<ClassFormModalProps> = ({
  isOpen,
  onClose,
  classData,
  mode,
}) => {
  const [formData, setFormData] = useState<ClassFormData>(initialFormData);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<ClassFormData>>({});

  const createMutation = useCreateClass();
  const updateMutation = useUpdateClass();

  // Enrollment mutations
  const enrollMutation = useCreateEnrollment(); // Using student feature hook
  const unenrollMutation = useUnenrollment();

  const { data: semesters = [] } = useSemesters();
  const { data: courses = [] } = useCourses();
  const { data: users, isLoading: isLoadingUsers } = useUsers();

  // Fetch students for selection
  const { data: allStudents } = useUsersWithFilters({ role: "STUDENT" });

  // Fetch existing enrollments if editing
  const { data: existingEnrollments } = useClassEnrollments(
    mode === "edit" && classData ? classData.classId : "",
  );

  // Filter teachers only (check both formats: GraphQL returns UPPERCASE, REST may return PascalCase)
  const teachers = (users || []).filter(
    (u) => u.role === "TEACHER" || u.role === "Teacher",
  );

  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    enrollMutation.isPending ||
    unenrollMutation.isPending;

  useEffect(() => {
    if (classData && mode === "edit") {
      setFormData({
        semesterId: classData.semesterId,
        courseId: classData.courseId,
        classCode: classData.classCode,
        teacherId: classData.teacherId,
      });
    } else {
      setFormData(initialFormData);
      setSelectedStudentIds([]); // Clear selections for new class
    }
    setErrors({});
  }, [classData, mode, isOpen]);

  // Sync initial enrollments when editing
  useEffect(() => {
    if (mode === "edit" && existingEnrollments) {
      // Handle both camelCase and PascalCase
      const enrolledIds = existingEnrollments.map(
        (e: any) => e.userId || e.UserId || e.studentId,
      );
      setSelectedStudentIds(enrolledIds.filter((id: any) => !!id));
    }
  }, [existingEnrollments, mode]);

  const validate = (): boolean => {
    const newErrors: Partial<ClassFormData> = {};

    if (mode === "create") {
      if (!formData.semesterId) {
        newErrors.semesterId = "Semester is required";
      }

      if (!formData.courseId) {
        newErrors.courseId = "Course is required";
      }
    }

    if (!formData.classCode.trim()) {
      newErrors.classCode = "Class code is required";
    }

    if (!formData.teacherId) {
      newErrors.teacherId = "Teacher is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      let targetClassId = classData?.classId;

      if (mode === "create") {
        const newClass = await createMutation.mutateAsync({
          semesterId: formData.semesterId,
          courseId: formData.courseId,
          classCode: formData.classCode,
          teacherId: formData.teacherId,
        });
        targetClassId = newClass.classId;
      } else if (classData) {
        await updateMutation.mutateAsync({
          id: classData.classId,
          data: {
            classCode: formData.classCode,
            teacherId: formData.teacherId,
          },
        });
      }

      // Handle Enrollments if classId is available
      if (targetClassId) {
        // Find students to Enroll
        // Try to get IDs regardless of casing

        const normalizedCurrentIds =
          mode === "edit" && existingEnrollments
            ? existingEnrollments.map(
                (e: any) => e.userId || e.UserId || e.studentId,
              )
            : [];

        const studentsToEnroll = selectedStudentIds.filter(
          (id) => !normalizedCurrentIds.includes(id),
        );
        const studentsToUnenroll = normalizedCurrentIds.filter(
          (id: string) => !selectedStudentIds.includes(id),
        );

        // Process enrollments
        await Promise.all([
          // Map studentId consistently to userId for the student hook
          ...studentsToEnroll.map((studentId) =>
            enrollMutation.mutateAsync({
              classId: targetClassId!,
              userId: studentId,
            }),
          ),
          ...studentsToUnenroll.map((studentId: string) =>
            unenrollMutation.mutateAsync({
              classId: targetClassId!,
              userId: studentId,
            }),
          ),
        ]);
      }

      toast.success(
        mode === "create"
          ? "Class created successfully"
          : "Class updated successfully",
      );
      onClose();
    } catch (error) {
      console.error("Failed to save class:", error);
      toast.error("Failed to save class");
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof ClassFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const semesterOptions = semesters.map((s) => ({
    value: s.semesterId,
    label: s.name,
  }));

  const courseOptions = courses.map((c) => ({
    value: c.courseId,
    label: `${c.code} - ${c.name}`,
  }));

  const teacherOptions = teachers.map((t) => ({
    value: t.userId,
    label: `${t.name} (${t.email})`,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Create New Class" : "Edit Class"}
      description={
        mode === "create"
          ? "Set up a new class for a course and semester."
          : "Update the class information."
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Semester *"
            name="semesterId"
            value={formData.semesterId}
            onChange={handleChange}
            options={semesterOptions}
            placeholder="Select semester"
            error={errors.semesterId}
            disabled={mode === "edit"}
          />

          <Select
            label="Course *"
            name="courseId"
            value={formData.courseId}
            onChange={handleChange}
            options={courseOptions}
            placeholder="Select course"
            error={errors.courseId}
            disabled={mode === "edit"}
          />

          <Input
            label="Class Code *"
            name="classCode"
            value={formData.classCode}
            onChange={handleChange}
            placeholder="e.g., SE1801, SE1802"
            error={errors.classCode}
          />

          <Select
            label="Teacher *"
            name="teacherId"
            value={formData.teacherId}
            onChange={handleChange}
            options={teacherOptions}
            placeholder={
              isLoadingUsers
                ? "Loading teachers..."
                : teachers.length === 0
                  ? "No teachers available"
                  : "Select teacher"
            }
            error={errors.teacherId}
            disabled={isLoadingUsers}
          />
        </div>

        {/* Student Enrollment Section */}
        <div className="space-y-2 mt-4">
          <label className="block text-sm font-medium text-gray-700">
            Enrolled Students
          </label>
          <div className="border rounded-md max-h-60 overflow-y-auto bg-gray-50 border-gray-200">
            {allStudents && allStudents.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {allStudents.map((student) => (
                  <label
                    key={student.userId}
                    className="flex items-center space-x-3 p-3 hover:bg-gray-100 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedStudentIds.includes(student.userId)}
                      onChange={() => handleStudentToggle(student.userId)}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 flex-1">
                      <span className="font-medium">{student.name}</span>
                      <span className="text-gray-500 ml-1">
                        &lt;{student.email}&gt;
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-gray-500 italic">
                {isLoadingUsers ? "Loading students..." : "No students found."}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Select students to enroll in this class.
          </p>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {mode === "create" ? "Create Class" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Delete confirmation dialog
interface DeleteClassDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassWithRelations | null;
}

export const DeleteClassDialog: React.FC<DeleteClassDialogProps> = ({
  isOpen,
  onClose,
  classData,
}) => {
  const deleteMutation = useDeleteClass();

  const handleConfirm = async () => {
    if (!classData) return;

    try {
      await deleteMutation.mutateAsync(classData.classId);
      toast.success("Class deleted successfully");
      onClose();
    } catch (error) {
      console.error("Failed to delete class:", error);
      toast.error("Failed to delete class");
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete Class"
      message={`Are you sure you want to delete class "${classData?.classCode}"? This will also remove all enrollments and projects.`}
      confirmText="Delete"
      variant="danger"
      isLoading={deleteMutation.isPending}
    />
  );
};

import React, { useState, useEffect } from "react";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import {
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from "../api/useCourses";
import type { Course } from "@/types";
import toast from "react-hot-toast";

interface CourseFormData {
  code: string;
  name: string;
  description: string;
}

const initialFormData: CourseFormData = {
  code: "",
  name: "",
  description: "",
};

interface CourseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: Course | null;
  mode: "create" | "edit";
}

export const CourseFormModal: React.FC<CourseFormModalProps> = ({
  isOpen,
  onClose,
  course,
  mode,
}) => {
  const [formData, setFormData] = useState<CourseFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<CourseFormData>>({});

  const createMutation = useCreateCourse();
  const updateMutation = useUpdateCourse();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (course && mode === "edit") {
      setFormData({
        code: course.code,
        name: course.name,
        description: course.description || "",
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [course, mode, isOpen]);

  const validate = (): boolean => {
    const newErrors: Partial<CourseFormData> = {};

    if (!formData.code.trim()) {
      newErrors.code = "Course code is required";
    } else if (!/^[A-Z]{2,4}\d{3}$/.test(formData.code.toUpperCase())) {
      newErrors.code = "Invalid format (e.g., SWP391, PRN231)";
    }

    if (!formData.name.trim()) {
      newErrors.name = "Course name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const payload = {
      code: formData.code.toUpperCase(),
      name: formData.name,
      description: formData.description || undefined,
    };

    try {
      if (mode === "create") {
        await createMutation.mutateAsync(payload);
      } else if (course) {
        await updateMutation.mutateAsync({
          id: course.courseId,
          data: payload,
        });
      }
      toast.success(
        mode === "create"
          ? "Course created successfully"
          : "Course updated successfully",
      );
      onClose();
    } catch (error) {
      console.error("Failed to save course:", error);
      toast.error("Failed to save course");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof CourseFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Create New Course" : "Edit Course"}
      description={
        mode === "create"
          ? "Add a new course to the curriculum."
          : "Update the course information."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Course Code *"
            name="code"
            value={formData.code}
            onChange={handleChange}
            placeholder="e.g., SWP391"
            error={errors.code}
          />

          <Input
            label="Course Name *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter course name"
            error={errors.name}
          />
        </div>

        <Textarea
          label="Description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief description of the course content..."
          rows={4}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : mode === "create"
                ? "Create Course"
                : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Delete confirmation dialog
interface DeleteCourseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  course: Course | null;
}

export const DeleteCourseDialog: React.FC<DeleteCourseDialogProps> = ({
  isOpen,
  onClose,
  course,
}) => {
  const deleteMutation = useDeleteCourse();

  const handleConfirm = async () => {
    if (!course) return;

    try {
      await deleteMutation.mutateAsync(course.courseId);
      toast.success("Course deleted successfully");
      onClose();
    } catch (error) {
      console.error("Failed to delete course:", error);
      toast.error("Failed to delete course");
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete Course"
      message={`Are you sure you want to delete "${course?.code} - ${course?.name}"? This will also affect all related classes.`}
      confirmText="Delete"
      variant="danger"
      isLoading={deleteMutation.isPending}
    />
  );
};

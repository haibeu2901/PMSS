import React, { useState, useEffect } from "react";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  useCreateSemester,
  useUpdateSemester,
  useDeleteSemester,
  type CreateSemesterInput,
} from "../api/useSemesters";
import type { Semester } from "@/types";
import toast from "react-hot-toast";

interface SemesterFormData {
  name: string;
  startDate: string;
  endDate: string;
}

const initialFormData: SemesterFormData = {
  name: "",
  startDate: "",
  endDate: "",
};

// Helper to format date for input
const formatDateForInput = (dateString: string): string => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
};

interface SemesterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  semester?: Semester | null;
  mode: "create" | "edit";
}

export const SemesterFormModal: React.FC<SemesterFormModalProps> = ({
  isOpen,
  onClose,
  semester,
  mode,
}) => {
  const [formData, setFormData] = useState<SemesterFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<SemesterFormData>>({});

  const createMutation = useCreateSemester();
  const updateMutation = useUpdateSemester();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (semester && mode === "edit") {
      setFormData({
        name: semester.name,
        startDate: formatDateForInput(semester.startDate),
        endDate: formatDateForInput(semester.endDate),
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [semester, mode, isOpen]);

  const validate = (): boolean => {
    const newErrors: Partial<SemesterFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Semester name is required";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const payload: CreateSemesterInput = {
      name: formData.name,
      startDate: new Date(formData.startDate).toISOString(),
      endDate: new Date(formData.endDate).toISOString(),
    };

    try {
      if (mode === "create") {
        await createMutation.mutateAsync(payload);
      } else if (semester) {
        await updateMutation.mutateAsync({
          id: semester.semesterId,
          data: payload,
        });
      }
      toast.success(
        mode === "create"
          ? "Semester created successfully"
          : "Semester updated successfully",
      );
      onClose();
    } catch (error) {
      console.error("Failed to save semester:", error);
      toast.error("Failed to save semester");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof SemesterFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Create New Semester" : "Edit Semester"}
      description={
        mode === "create"
          ? "Define a new academic term with start and end dates."
          : "Update the semester information."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Semester Name *"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="e.g., Spring 2026, Fall 2026"
          error={errors.name}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date *"
            name="startDate"
            type="date"
            value={formData.startDate}
            onChange={handleChange}
            error={errors.startDate}
          />

          <Input
            label="End Date *"
            name="endDate"
            type="date"
            value={formData.endDate}
            onChange={handleChange}
            error={errors.endDate}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading
              ? "Saving..."
              : mode === "create"
                ? "Create Semester"
                : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Delete confirmation dialog
interface DeleteSemesterDialogProps {
  isOpen: boolean;
  onClose: () => void;
  semester: Semester | null;
}

export const DeleteSemesterDialog: React.FC<DeleteSemesterDialogProps> = ({
  isOpen,
  onClose,
  semester,
}) => {
  const deleteMutation = useDeleteSemester();

  const handleConfirm = async () => {
    if (!semester) return;

    try {
      await deleteMutation.mutateAsync(semester.semesterId);
      toast.success("Semester deleted successfully");
      onClose();
    } catch (error) {
      console.error("Failed to delete semester:", error);
      toast.error("Failed to delete semester");
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete Semester"
      message={`Are you sure you want to delete "${semester?.name}"? This will also affect all related classes and projects.`}
      confirmText="Delete"
      variant="danger"
      isLoading={deleteMutation.isPending}
    />
  );
};

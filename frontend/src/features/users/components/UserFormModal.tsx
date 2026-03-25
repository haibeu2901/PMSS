import React, { useState, useEffect } from "react";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { useCreateUser, useUpdateUser, useDeleteUser } from "../api/useUsers";
import type { User, UserRole } from "@/types";
import toast from "react-hot-toast";

// Form data type
interface UserFormData {
  name: string;
  email: string;
  password: string;
  githubUsername: string;
  githubEmail: string;
  role: UserRole;
}

const initialFormData: UserFormData = {
  name: "",
  email: "",
  password: "",
  githubUsername: "",
  githubEmail: "",
  role: "STUDENT",
};

const roleOptions = [
  { value: "ADMIN", label: "Admin" },
  { value: "TEACHER", label: "Teacher" },
  { value: "STUDENT", label: "Student" },
];

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  mode: "create" | "edit";
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  user,
  mode,
}) => {
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();

  const isLoading = createMutation.isPending || updateMutation.isPending;

  useEffect(() => {
    if (user && mode === "edit") {
      setFormData({
        name: user.name,
        email: user.email,
        password: "",
        githubUsername: user.githubUsername || "",
        githubEmail: user.githubEmail || "",
        role: user.role,
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [user, mode, isOpen]);

  const validate = (): boolean => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (mode === "create" && !formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          githubUsername: formData.githubUsername || undefined,
          githubEmail: formData.githubEmail || undefined,
          role: formData.role,
        });
      } else if (user) {
        await updateMutation.mutateAsync({
          id: user.userId,
          data: {
            name: formData.name,
            email: formData.email,
            githubUsername: formData.githubUsername || undefined,
            githubEmail: formData.githubEmail || undefined,
            role: formData.role,
          },
        });
      }
      toast.success(
        mode === "create"
          ? "User created successfully"
          : "User updated successfully",
      );
      onClose();
    } catch (error) {
      console.error("Failed to save user:", error);
      toast.error("Failed to save user");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof UserFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Add New User" : "Edit User"}
      description={
        mode === "create"
          ? "Fill in the details to create a new user account."
          : "Update the user's information."
      }
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter full name"
            error={errors.name}
          />

          <Input
            label="Email *"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="user@example.com"
            error={errors.email}
          />

          {mode === "create" && (
            <Input
              label="Password *"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 6 characters"
              error={errors.password}
            />
          )}

          <Select
            label="Role *"
            name="role"
            value={formData.role}
            onChange={handleChange}
            options={roleOptions}
          />

          <Input
            label="GitHub Username"
            name="githubUsername"
            value={formData.githubUsername}
            onChange={handleChange}
            placeholder="github-username"
          />

          <Input
            label="GitHub Email"
            name="githubEmail"
            type="email"
            value={formData.githubEmail}
            onChange={handleChange}
            placeholder="github@example.com"
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
                ? "Create User"
                : "Save Changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Delete confirmation dialog
interface DeleteUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const deleteMutation = useDeleteUser();

  const handleConfirm = async () => {
    if (!user) return;

    try {
      await deleteMutation.mutateAsync(user.userId);
      toast.success("User deleted successfully");
      onClose();
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user");
    }
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      title="Delete User"
      message={`Are you sure you want to delete "${user?.name}"? This action cannot be undone.`}
      confirmText="Delete"
      variant="danger"
      isLoading={deleteMutation.isPending}
    />
  );
};

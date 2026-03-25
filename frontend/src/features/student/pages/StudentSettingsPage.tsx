import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import {
  useUser,
  useUpdateUser,
  useUpdatePassword,
} from "@/features/users/api/useUsers";
import { useAuth } from "@/features/auth/context/AuthContext";
import { User, Mail, Github, Lock } from "lucide-react";

export function StudentSettingsPage() {
  const { user: authUser } = useAuth();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const { data: user, isLoading } = useUser(authUser?.userId || "");
  const updateMutation = useUpdateUser();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    githubUsername: "",
    githubEmail: "",
  });

  // Update form data when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        githubUsername: user.githubUsername || "",
        githubEmail: user.githubEmail || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !user) return;

    try {
      await updateMutation.mutateAsync({
        id: authUser.userId,
        data: {
          name: formData.name,
          email: formData.email,
          githubUsername: formData.githubUsername || undefined,
          githubEmail: formData.githubEmail || undefined,
          role: user.role,
        },
      });
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-gray-500">
          Loading settings...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center py-12 text-red-500">
          Failed to load user data
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500">Manage your account settings</p>
      </div>

      {/* Profile Information */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
              <span className="text-blue-600 font-bold text-2xl">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.role}</p>
            </div>
          </div>

          <Input
            label="Full Name"
            icon={User}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Email"
            type="email"
            icon={Mail}
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />

          <Input
            label="GitHub Username"
            icon={Github}
            value={formData.githubUsername}
            onChange={(e) =>
              setFormData({ ...formData, githubUsername: e.target.value })
            }
            placeholder="your-username"
          />

          <Input
            label="GitHub Email"
            type="email"
            icon={Mail}
            value={formData.githubEmail}
            onChange={(e) =>
              setFormData({ ...formData, githubEmail: e.target.value })
            }
            placeholder="github@example.com"
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button type="submit" isLoading={updateMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Security */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Security</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Lock className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Password</p>
                <p className="text-sm text-gray-500">Change your password</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowPasswordModal(true)}
            >
              Change
            </Button>
          </div>
        </div>
      </Card>

      {/* Password Change Modal */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        userId={authUser?.userId || ""}
      />
    </div>
  );
}

// ============================================
// CHANGE PASSWORD MODAL
// ============================================

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

function ChangePasswordModal({
  isOpen,
  onClose,
  userId,
}: ChangePasswordModalProps) {
  const updatePasswordMutation = useUpdatePassword();
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    try {
      await updatePasswordMutation.mutateAsync({
        id: userId,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });
      toast.success("Password changed successfully!");
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      onClose();
    } catch (error) {
      console.error("Failed to change password:", error);
      toast.error(
        "Failed to change password. Please check your current password.",
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Current Password"
          type="password"
          required
          value={formData.currentPassword}
          onChange={(e) =>
            setFormData({ ...formData, currentPassword: e.target.value })
          }
        />

        <Input
          label="New Password"
          type="password"
          required
          value={formData.newPassword}
          onChange={(e) =>
            setFormData({ ...formData, newPassword: e.target.value })
          }
          minLength={6}
        />

        <Input
          label="Confirm New Password"
          type="password"
          required
          value={formData.confirmPassword}
          onChange={(e) =>
            setFormData({ ...formData, confirmPassword: e.target.value })
          }
          minLength={6}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={updatePasswordMutation.isPending}>
            Change Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}

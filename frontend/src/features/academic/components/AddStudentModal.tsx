import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useUsersWithFilters } from "@/features/users/api/useUsers";
import {
  useBulkEnrollment,
  useClassEnrollments,
} from "@/features/student/api/useEnrollments";
import { toast } from "react-hot-toast";
import { Loader2, Search, UserPlus } from "lucide-react";

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  classId,
}) => {
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all students
  const { data: allStudents, isLoading: isLoadingStudents } =
    useUsersWithFilters({
      role: "STUDENT",
      search: searchTerm,
    });

  // Fetch current enrollments to filter them out
  const { data: currentEnrollments, isLoading: isLoadingEnrollments } =
    useClassEnrollments(classId);

  const bulkEnrollMutation = useBulkEnrollment();

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedStudentIds([]);
      setSearchTerm("");
    }
  }, [isOpen]);

  // Filter out students who are already enrolled
  const availableStudents = React.useMemo(() => {
    if (!allStudents) return [];

    // Get IDs of currently enrolled students
    const enrolledIds = currentEnrollments?.map((e) => e.userId) || [];

    return allStudents.filter(
      (student) => !enrolledIds.includes(student.userId),
    );
  }, [allStudents, currentEnrollments]);

  // Client-side filtering if search query isn't handled by API or if we want instant feedback
  // (Assuming useUsersWithFilters might debounce or requires submit)
  // For now let's rely on useUsersWithFilters handling the query if it accepts it, or just filter client side if the list is small.
  // The hook implementation seemed to support 'query'.

  const handleToggleStudent = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === availableStudents.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(availableStudents.map((s) => s.userId));
    }
  };

  const handleSubmit = async () => {
    if (selectedStudentIds.length === 0) return;

    try {
      await bulkEnrollMutation.mutateAsync({
        classId,
        userIds: selectedStudentIds,
      });

      toast.success(
        `Successfully added ${selectedStudentIds.length} student(s)`,
      );
      onClose();
    } catch (error) {
      console.error("Failed to enroll students:", error);
      toast.error("Failed to enroll students");
    }
  };

  const isLoading = isLoadingStudents || isLoadingEnrollments;
  const isSubmitting = bulkEnrollMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Students to Class"
      description="Select students to enroll in this class."
      size="lg"
    >
      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Student List */}
        <div className="border rounded-md h-80 overflow-y-auto bg-gray-50 border-gray-200">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : availableStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <p>No available students found.</p>
              {searchTerm && (
                <p className="text-xs">Try adjusting your search.</p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {/* Header with Select All */}
              <div className="p-3 bg-gray-100 flex items-center justify-between sticky top-0 border-b">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={
                      selectedStudentIds.length === availableStudents.length &&
                      availableStudents.length > 0
                    }
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Select All
                  </span>
                </label>
                <span className="text-xs text-gray-500">
                  {selectedStudentIds.length} selected
                </span>
              </div>

              {/* Students */}
              {availableStudents.map((student) => (
                <label
                  key={student.userId}
                  className="flex items-center space-x-3 p-3 hover:bg-white cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedStudentIds.includes(student.userId)}
                    onChange={() => handleToggleStudent(student.userId)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {student.name}
                    </div>
                    <div className="text-sm text-gray-500">{student.email}</div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="primary"
            disabled={isSubmitting || selectedStudentIds.length === 0}
            isLoading={isSubmitting}
            className="flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Add{" "}
            {selectedStudentIds.length > 0
              ? `${selectedStudentIds.length} Students`
              : "Students"}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

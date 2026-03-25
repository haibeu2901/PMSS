import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import {
  useGithubRepos,
  useProjectGithubContributions,
  useCreateGithubRepo,
  useUpdateGithubRepo,
  useDeleteGithubRepo,
  useSyncProjectGithub,
  useGithubContributionReports,
  useGenerateGithubContributionReport,
  useGithubContributionReport,
  useGithubReportMermaidBlocks,
  type GenerateGithubContributionReportOptions,
} from "../api/useProjects";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getAuthToken } from "@/features/auth/api/authApi";
import type {
  GithubRepoDto,
  GithubContributionReportSummaryDto,
} from "@/types";
import { CommitsOverTimeChart } from "./CommitsOverTimeChart";
import { ContributorCard } from "./ContributorCard";
import {
  Github,
  ExternalLink,
  Plus,
  Trash2,
  GitBranch,
  RefreshCw,
  Pencil,
  Sparkles,
  FileText,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

const REST_API_BASE_URL = import.meta.env.VITE_REST_API_URL;

interface ProjectGithubTabProps {
  projectId: string;
  readOnly?: boolean;
}

export function ProjectGithubTab({
  projectId,
  readOnly = false,
}: ProjectGithubTabProps) {
  const { user } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRepo, setEditingRepo] = useState<GithubRepoDto | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [repoIdToDelete, setRepoIdToDelete] = useState<string | null>(null);

  const { data: repos = [], isLoading } = useGithubRepos({ projectId });
  const hasRepos = repos.length > 0;
  const { data: contributions } = useProjectGithubContributions(
    projectId,
    hasRepos,
  );
  const syncMutation = useSyncProjectGithub();
  const deleteMutation = useDeleteGithubRepo();
  const {
    data: reportHistory = [],
    isLoading: isReportHistoryLoading,
    isFetching: isReportHistoryFetching,
  } = useGithubContributionReports(projectId);
  const generateReportMutation = useGenerateGithubContributionReport();
  const isReportListLoading = isReportHistoryLoading || isReportHistoryFetching;

  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  const handleEdit = (repo: GithubRepoDto) => {
    setEditingRepo(repo);
  };

  const handleDelete = (repoId: string) => {
    setRepoIdToDelete(repoId);
  };

  const handleConfirmDelete = async () => {
    if (!user || !repoIdToDelete) return;

    try {
      await deleteMutation.mutateAsync({
        repoId: repoIdToDelete,
        userId: user.userId,
      });
      toast.success("Repository deleted successfully");
      setRepoIdToDelete(null);
    } catch (error) {
      console.error("Failed to delete repo:", error);
      toast.error("Failed to delete repository");
    }
  };

  const handleGenerateReport = async (
    options: GenerateGithubContributionReportOptions,
  ) => {
    try {
      await generateReportMutation.mutateAsync({ projectId, ...options });
      setShowReportModal(false);
      toast.success(
        "Report generated! The history list will show it once the backend finishes saving.",
      );
    } catch (error: any) {
      console.error("Failed to generate report:", error);
      toast.error(
        `Failed to generate report: ${error?.message || "Unknown error"}. Ensure GitHub Models token or OpenAI key is configured.`,
      );
    }
  };

  const handleToggleReport = (reportId: string) => {
    setExpandedReportId((prev) => (prev === reportId ? null : reportId));
  };

  const handleSync = async () => {
    try {
      const result = await syncMutation.mutateAsync(projectId);
      toast.success(
        `Sync completed! ${result?.successfulSyncs || 0}/${result?.totalRepositories || 0} repositories synced successfully.`,
      );
    } catch (error: any) {
      console.error("Failed to sync GitHub data:", error);
      toast.error(
        `Failed to sync GitHub data: ${error.response?.data?.message || error.message || "Unknown error"}`,
      );
    }
  };

  return (
    <div className="space-y-6">
      {contributions &&
        contributions.overallCommitsOverTime &&
        contributions.overallCommitsOverTime.length > 0 && (
          <CommitsOverTimeChart
            data={contributions.overallCommitsOverTime}
            title="Commits over time"
            subtitle={`Weekly from ${new Date(contributions.semesterStartDate).toLocaleDateString()} to ${new Date(contributions.semesterEndDate).toLocaleDateString()}`}
          />
        )}

      {contributions && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <GitBranch className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Commits</p>
                <p className="text-2xl font-bold text-gray-900">
                  {contributions.totalCommitsInSemester}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                <span className="text-lg font-bold text-green-600">+</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Additions</p>
                <p className="text-2xl font-bold text-green-600">
                  {contributions.totalAdditionsInSemester.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>

          <Card className="border-gray-200 bg-white p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                <span className="text-lg font-bold text-red-600">-</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Deletions</p>
                <p className="text-2xl font-bold text-red-600">
                  {contributions.totalDeletionsInSemester.toLocaleString()}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card className="border-gray-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            GitHub Repositories
          </h2>
          <div className="flex gap-2">
            {repos.length > 0 && (
              <Button
                variant="outline"
                onClick={handleSync}
                isLoading={syncMutation.isPending}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Data
              </Button>
            )}
            {!readOnly && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Repository
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-gray-500">
            Loading repositories...
          </div>
        ) : repos.length === 0 ? (
          <div className="py-12 text-center">
            <Github className="mx-auto mb-4 h-16 w-16 text-gray-300" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">
              No Repositories Connected
            </h3>
            <p className="mb-4 text-gray-500">
              Connect a GitHub repository to track your project's development.
            </p>
            {!readOnly && (
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Repository
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {repos.map((repo) => (
              <GithubRepoCard
                key={repo.githubRepoId}
                repo={repo}
                onEdit={handleEdit}
                onDelete={handleDelete}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}
      </Card>

      <Card className="border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              <h2 className="text-lg font-semibold text-gray-900">
                AI Contribution Reports
              </h2>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Generate AI-written summaries backed by your synced GitHub data
              and keep a history for quick reviews.
            </p>
          </div>
          <Button onClick={() => setShowReportModal(true)} disabled={!hasRepos}>
            <Sparkles className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </div>

        {!hasRepos ? (
          <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
            Connect at least one repository before generating reports.
          </div>
        ) : isReportListLoading ? (
          <div className="mt-6 flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Fetching reports...
          </div>
        ) : reportHistory.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600">
            No reports yet. Generate your first summary to see it here.
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {reportHistory.map((report) => (
              <GithubReportHistoryItem
                key={report.reportId}
                report={report}
                projectId={projectId}
                isExpanded={expandedReportId === report.reportId}
                onToggle={() => handleToggleReport(report.reportId)}
              />
            ))}
          </div>
        )}
      </Card>

      {contributions &&
        contributions.contributors &&
        contributions.contributors.length > 0 && (
          <div className="space-y-3">
            {contributions.contributors.map((contributor, index) => (
              <ContributorCard
                key={contributor.githubUsername}
                contributor={contributor}
                rank={index + 1}
              />
            ))}
          </div>
        )}

      <GenerateReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        onGenerate={handleGenerateReport}
        isSubmitting={generateReportMutation.isPending}
        hasRepos={hasRepos}
      />

      <CreateRepoModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        projectId={projectId}
      />

      {editingRepo && (
        <EditRepoModal
          isOpen
          onClose={() => setEditingRepo(null)}
          repo={editingRepo}
        />
      )}

      <ConfirmDialog
        isOpen={!!repoIdToDelete}
        onClose={() => setRepoIdToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Repository"
        message="Are you sure you want to delete this repository connection? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

interface GenerateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (
    options: GenerateGithubContributionReportOptions,
  ) => Promise<void>;
  isSubmitting: boolean;
  hasRepos: boolean;
}

interface ReportFormState {
  recentWeeks: string;
  includeMermaidDiagrams: boolean;
}

const createDefaultReportFormState = (): ReportFormState => ({
  recentWeeks: "",
  includeMermaidDiagrams: false,
});

function GenerateReportModal({
  isOpen,
  onClose,
  onGenerate,
  isSubmitting,
  hasRepos,
}: GenerateReportModalProps) {
  const [formState, setFormState] = useState<ReportFormState>(() =>
    createDefaultReportFormState(),
  );

  useEffect(() => {
    if (!isOpen) {
      setFormState(createDefaultReportFormState());
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRepos || isSubmitting) return;

    const payload: GenerateGithubContributionReportOptions = {
      includeMermaidDiagrams: formState.includeMermaidDiagrams,
    };

    if (formState.recentWeeks) {
      payload.recentWeeks = Number(formState.recentWeeks);
    }

    await onGenerate(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Contribution Report"
      description="Pick optional parameters, then let the AI summarize the latest GitHub activity."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Limit to recent weeks (optional)"
          type="number"
          min={1}
          max={52}
          value={formState.recentWeeks}
          onChange={(e) =>
            setFormState({ ...formState, recentWeeks: e.target.value })
          }
          placeholder="e.g. 4"
          helpText="Keeps the report focused on the most recent activity window"
        />

        <div className="space-y-3 rounded-lg border border-gray-200 p-4">
          <label className="flex items-start gap-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={formState.includeMermaidDiagrams}
              onChange={(e) =>
                setFormState({
                  ...formState,
                  includeMermaidDiagrams: e.target.checked,
                })
              }
              className="h-4 w-4 rounded border-gray-300 text-indigo-600"
            />
            <div>
              <p className="font-medium text-gray-900">
                Include Mermaid diagrams
              </p>
              <p className="text-xs text-gray-500">
                Adds architecture/activity diagrams for better visual
                storytelling.
              </p>
            </div>
          </label>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={!hasRepos || isSubmitting}
          isLoading={isSubmitting}
        >
          <Sparkles className="mr-2 h-4 w-4" /> Generate Report
        </Button>
      </form>
    </Modal>
  );
}

interface GithubReportDetailViewProps {
  projectId: string;
  reportId: string;
}

function GithubReportDetailView({
  projectId,
  reportId,
}: GithubReportDetailViewProps) {
  const { data, isLoading, isError } = useGithubContributionReport(
    projectId,
    reportId,
  );
  const { data: mermaidBlocks } = useGithubReportMermaidBlocks(
    projectId,
    reportId,
  );
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingMermaid, setIsDownloadingMermaid] = useState(false);

  const handleDownload = async () => {
    if (!projectId || !reportId) return;
    try {
      setIsDownloading(true);
      await downloadGithubReportMarkdown(projectId, reportId);
    } catch (error: any) {
      console.error("Failed to download report:", error);
      toast.error(
        error?.message || "Unable to download the report. Please try again.",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadMermaid = async () => {
    if (!projectId || !reportId) return;
    try {
      setIsDownloadingMermaid(true);
      if (!REST_API_BASE_URL) {
        throw new Error("REST API base URL is not configured");
      }

      const token = getAuthToken();
      const response = await fetch(
        `${REST_API_BASE_URL}/api/v1/projects/${projectId}/github-reports/${reportId}/mermaid`,
        {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to download mermaid file");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `github-contribution-report-${reportId}.mmd`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error: any) {
      console.error("Failed to download mermaid:", error);
      toast.error(
        error?.message ||
          "Unable to download the mermaid file. Please try again.",
      );
    } finally {
      setIsDownloadingMermaid(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8 text-gray-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading full report...
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="py-8 text-center text-sm text-red-600">
        Unable to load report detail. Please try refreshing.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 p-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Report Details
          </h3>
          <p className="text-xs text-gray-500">
            Generated via {data.modelProvider} · {data.modelName}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {mermaidBlocks && mermaidBlocks.length > 0 && (
            <Button
              onClick={handleDownloadMermaid}
              isLoading={isDownloadingMermaid}
              size="sm"
              variant="outline"
            >
              <GitBranch className="mr-2 h-4 w-4" /> Download Mermaid
            </Button>
          )}
          <Button onClick={handleDownload} isLoading={isDownloading} size="sm">
            <FileText className="mr-2 h-4 w-4" /> Download Markdown
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <DetailStat
          label="Total Commits"
          value={data.totalCommits.toLocaleString()}
        />
        <DetailStat
          label="Contributors"
          value={`${data.activeContributorCount}/${data.contributorCount}`}
          hint="Active / Total"
        />
        <DetailStat
          label="Period"
          value={`${new Date(data.periodStart).toLocaleDateString()} → ${new Date(data.periodEnd).toLocaleDateString()}`}
        />
        <DetailStat
          label="Created"
          value={new Date(data.createdAt).toLocaleString()}
        />
      </div>

      <div className="space-y-4">
        <h4 className="border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800">
          Executive Summary
        </h4>
        <p className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700 shadow-sm">
          {data.executiveSummary || "No executive summary provided."}
        </p>
      </div>

      {mermaidBlocks && mermaidBlocks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800">
              Diagram Code Blocks
            </h4>
            <a
              href="https://mermaid.live"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline"
            >
              Open Mermaid Live Editor
            </a>
          </div>
          <div className="space-y-4">
            {mermaidBlocks.map((block: string, index: number) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
              >
                <div className="flex items-center justify-between border-b border-gray-200 bg-gray-100 px-4 py-2">
                  <span className="font-mono text-xs font-medium text-gray-600">
                    Mermaid Block #{index + 1}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      navigator.clipboard.writeText(block);
                      toast.success("Copied to clipboard!");
                    }}
                  >
                    <span className="text-xs">Copy Code</span>
                  </Button>
                </div>
                <div className="max-h-60 overflow-auto bg-white p-4">
                  <pre className="font-mono text-xs text-gray-700 whitespace-pre">
                    {block}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <h4 className="border-b border-gray-200 pb-2 text-sm font-semibold text-gray-800">
          Full Markdown Content
        </h4>
        <div className="max-h-96 overflow-y-auto rounded-lg border border-gray-900/10 bg-gray-50 p-4 font-mono text-xs text-gray-800 shadow-inner whitespace-pre-wrap">
          {data.markdownContent}
        </div>
      </div>
    </div>
  );
}

interface GithubReportHistoryItemProps {
  report: GithubContributionReportSummaryDto;
  isExpanded: boolean;
  onToggle: () => void;
  projectId: string;
}

function GithubReportHistoryItem({
  report,
  isExpanded,
  onToggle,
  projectId,
}: GithubReportHistoryItemProps) {
  const provider = report.modelProvider?.toLowerCase();
  const providerLabel = provider === "openai" ? "OpenAI" : "GitHub Models";
  const badgeVariant = provider === "openai" ? "success" : "info";

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border transition-all duration-200 ${
        isExpanded
          ? "border-indigo-200 bg-indigo-50/30 ring-1 ring-indigo-100"
          : "border-gray-200 bg-gray-50 hover:border-gray-300"
      } p-4`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileText className="h-4 w-4 text-gray-400" />
            <span>
              {new Date(report.periodStart).toLocaleDateString()} –{" "}
              {new Date(report.periodEnd).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-1 text-base font-semibold text-gray-900">
            {report.totalCommits} commits · {report.activeContributorCount}{" "}
            active contributors
          </p>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {report.executiveSummary || "No executive summary provided."}
          </p>
        </div>
        <div className="flex flex-col items-start gap-2 text-sm text-gray-600 md:items-end">
          <Badge variant={badgeVariant}>
            {providerLabel} · {report.modelName}
          </Badge>
          <span className="text-xs text-gray-500">
            Saved {new Date(report.createdAt).toLocaleString()}
          </span>
          <Button
            variant={isExpanded ? "secondary" : "outline"}
            size="sm"
            onClick={onToggle}
            className="w-full md:w-auto"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="mr-1 h-4 w-4" /> Hide Detail
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-4 w-4" /> View Detail
              </>
            )}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300 border-t border-indigo-100 pt-4">
          <GithubReportDetailView
            projectId={projectId}
            reportId={report.reportId}
          />
        </div>
      )}
    </div>
  );
}

interface DetailStatProps {
  label: string;
  value: string | number;
  hint?: string;
}

function DetailStat({ label, value, hint }: DetailStatProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-900">{value}</p>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

async function downloadGithubReportMarkdown(
  projectId: string,
  reportId: string,
) {
  if (!REST_API_BASE_URL) {
    throw new Error("REST API base URL is not configured");
  }

  const token = getAuthToken();
  const response = await fetch(
    `${REST_API_BASE_URL}/api/v1/projects/${projectId}/github-reports/${reportId}/markdown`,
    {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to download report");
  }

  const blob = await response.blob();
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = `github-contribution-report-${reportId}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
}

interface GithubRepoCardProps {
  repo: GithubRepoDto;
  onEdit: (repo: GithubRepoDto) => void;
  onDelete: (repoId: string) => void;
  readOnly?: boolean;
}

function GithubRepoCard({
  repo,
  onEdit,
  onDelete,
  readOnly = false,
}: GithubRepoCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 hover:bg-gray-50">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
        <Github className="h-6 w-6 text-gray-700" />
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900">
            {repo.repoOwnerName}/{repo.repoName}
          </p>
          <Badge variant={repo.isPrivate ? "warning" : "secondary"}>
            {repo.isPrivate ? "Private" : "Public"}
          </Badge>
        </div>
        <div className="mt-1 flex items-center gap-4 text-sm text-gray-500">
          <span>Added {new Date(repo.createdAt).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={repo.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-700"
        >
          <ExternalLink className="h-5 w-5" />
        </a>
        {!readOnly && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(repo)}
              className="hover:bg-blue-50"
            >
              <Pencil className="h-4 w-4 text-blue-500" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(repo.githubRepoId)}
              className="hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

interface CreateRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

function CreateRepoModal({ isOpen, onClose, projectId }: CreateRepoModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    repoOwnerName: "",
    repoName: "",
    isPrivate: false,
    apiToken: "",
  });

  const createMutation = useCreateGithubRepo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be signed in to connect repositories.");
      return;
    }

    try {
      await createMutation.mutateAsync({
        projectId,
        userId: user.userId,
        repoOwnerName: formData.repoOwnerName.trim(),
        repoName: formData.repoName.trim(),
        isPrivate: formData.isPrivate,
        apiToken: formData.apiToken.trim() || undefined,
      });
      setFormData({
        repoOwnerName: "",
        repoName: "",
        isPrivate: false,
        apiToken: "",
      });
      onClose();
    } catch (error: any) {
      console.error("Failed to create repo:", error);
      toast.error(
        error?.message || "Unable to add repository. Please try again.",
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add GitHub Repository">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">
          <p className="mb-1 font-medium text-blue-900">
            📌 GitHub Token Required
          </p>
          <p className="mb-2 text-blue-800">
            Get your token at:{" "}
            <a
              href="https://github.com/settings/tokens/new?description=PMSS&scopes=repo"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium underline hover:text-blue-900"
            >
              github.com/settings/tokens
            </a>
          </p>
          <p className="text-xs text-blue-700">
            Generate token → Select{" "}
            <code className="rounded bg-blue-100 px-1">repo</code> scope → Copy
            token (starts with{" "}
            <code className="rounded bg-blue-100 px-1">ghp_</code>)
          </p>
        </div>

        <Input
          label="Repository Owner"
          required
          value={formData.repoOwnerName}
          onChange={(e) =>
            setFormData({ ...formData, repoOwnerName: e.target.value })
          }
          placeholder="username or organization"
        />

        <Input
          label="Repository Name"
          required
          value={formData.repoName}
          onChange={(e) =>
            setFormData({ ...formData, repoName: e.target.value })
          }
          placeholder="repository-name"
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPrivate"
            checked={formData.isPrivate}
            onChange={(e) =>
              setFormData({ ...formData, isPrivate: e.target.checked })
            }
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="isPrivate" className="text-sm text-gray-700">
            Private Repository
          </label>
        </div>

        <Input
          label="GitHub Personal Access Token"
          type="password"
          required
          value={formData.apiToken}
          onChange={(e) =>
            setFormData({ ...formData, apiToken: e.target.value })
          }
          placeholder="ghp_xxxxxxxxxxxxxxxxx"
          helpText="Stored securely and used only for syncing commits"
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={createMutation.isPending}>
            Save Connection
          </Button>
        </div>
      </form>
    </Modal>
  );
}

interface EditRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
  repo: GithubRepoDto;
}

function EditRepoModal({ isOpen, onClose, repo }: EditRepoModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    repoOwnerName: repo.repoOwnerName,
    repoName: repo.repoName,
    isPrivate: repo.isPrivate,
    apiToken: "",
  });
  const updateMutation = useUpdateGithubRepo();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        repoOwnerName: repo.repoOwnerName,
        repoName: repo.repoName,
        isPrivate: repo.isPrivate,
        apiToken: "",
      });
    }
  }, [isOpen, repo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be signed in to edit repositories.");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        repoId: repo.githubRepoId,
        userId: user.userId,
        repoOwnerName: formData.repoOwnerName.trim(),
        repoName: formData.repoName.trim(),
        isPrivate: formData.isPrivate,
        ...(formData.apiToken.trim()
          ? { apiToken: formData.apiToken.trim() }
          : {}),
      });
      onClose();
    } catch (error: any) {
      console.error("Failed to update repo:", error);
      toast.error(
        error?.message || "Unable to update repository. Please try again.",
      );
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit GitHub Repository">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Repository Owner"
          required
          value={formData.repoOwnerName}
          onChange={(e) =>
            setFormData({ ...formData, repoOwnerName: e.target.value })
          }
        />

        <Input
          label="Repository Name"
          required
          value={formData.repoName}
          onChange={(e) =>
            setFormData({ ...formData, repoName: e.target.value })
          }
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="edit-isPrivate"
            checked={formData.isPrivate}
            onChange={(e) =>
              setFormData({ ...formData, isPrivate: e.target.checked })
            }
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="edit-isPrivate" className="text-sm text-gray-700">
            Private Repository
          </label>
        </div>

        <Input
          label="GitHub Personal Access Token"
          type="password"
          value={formData.apiToken}
          onChange={(e) =>
            setFormData({ ...formData, apiToken: e.target.value })
          }
          placeholder="Leave blank to keep existing token"
          helpText="Provide a new token only if you need to rotate credentials"
        />

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={updateMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

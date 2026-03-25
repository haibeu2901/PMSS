using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PMSS.API.Services;
using System.Security.Claims;
using PMSS.Application.Interfaces.Services;

namespace PMSS.API.Controllers;

/// <summary>
/// RESTful API controller for generating SRS documents from Jira data
/// </summary>
[ApiController]
[Produces("application/json")]
[Authorize]
public class SrsController : ControllerBase
{
    private const int LinkTtlMinutes = 60;

    private readonly ISrsGenerationService _srsGenerationService;
    private readonly IAiSrsGenerationService _aiSrsGenerationService;
    private readonly TemporaryDownloadStore _downloadStore;
    private readonly IGithubContributionReportService _githubContributionReportService;

    public SrsController(
        ISrsGenerationService srsGenerationService,
        IAiSrsGenerationService aiSrsGenerationService,
        TemporaryDownloadStore downloadStore,
        IGithubContributionReportService githubContributionReportService)
    {
        _srsGenerationService = srsGenerationService;
        _aiSrsGenerationService = aiSrsGenerationService;
        _downloadStore = downloadStore;
        _githubContributionReportService = githubContributionReportService;
    }

    /// <summary>
    /// Retrieve a generated file by temporary token
    /// </summary>
    /// <param name="token">The temporary file token</param>
    [HttpGet("api/v1/generated-files/{token}")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult DownloadGeneratedFile(string token)
    {
        if (!_downloadStore.TryGet(token, out var stored) || stored == null)
            return NotFound(new { success = false, message = "Generated file link has expired or is invalid." });

        return File(stored.Data, stored.ContentType, stored.FileName);
    }

    /// <summary>
    /// Generate an IEEE/ISO 29148 SRS document from Jira issues for a project (rule-based JSON)
    /// </summary>
    /// <param name="projectId">The unique identifier of the project</param>
    /// <returns>Structured SRS document</returns>
    /// <response code="200">Returns the generated SRS document</response>
    /// <response code="404">If the project or Jira configuration is not found</response>
    /// <response code="502">If the Jira API request fails</response>
    [HttpGet("api/v1/projects/{projectId:guid}/srs")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> GenerateSrs(Guid projectId)
    {
        var result = await _srsGenerationService.GenerateSrsAsync(projectId);

        if (!result.Success)
            return NotFound(result);

        return Ok(result);
    }

    /// <summary>
    /// Generate an AI-powered SRS document as a .docx file from Jira issues for a project
    /// </summary>
    /// <param name="projectId">The unique identifier of the project</param>
    /// <param name="usePaidModel">Set to true to use the paid OpenAI model (no token limit) for a more comprehensive SRS</param>
    /// <param name="modelOption">Optional model version for the AI generation</param>
    /// <param name="downloadAsLink">Set to true to receive a temporary link for the generated file</param>
    /// <returns>A downloadable .docx file containing the SRS document or a download link</returns>
    /// <response code="200">Returns the generated .docx file or a download link</response>
    /// <response code="404">If the project or Jira configuration is not found</response>
    /// <response code="502">If the Jira or AI API request fails</response>
    [HttpGet("api/v1/projects/{projectId:guid}/srs/docx")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> GenerateSrsDocx(
        Guid projectId,
        [FromQuery] bool usePaidModel = false,
        [FromQuery] string? modelOption = null,
        [FromQuery] bool downloadAsLink = false)
    {
        var result = await _aiSrsGenerationService.GenerateSrsDocxAsync(projectId, usePaidModel, modelOption);

        if (!result.Success)
            return NotFound(result);

        if (result.Data is not { Length: > 0 })
            return UnprocessableEntity(new { success = false, message = "The AI model returned empty content. Please try again." });

        const string contentType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        var fileName = $"SRS_{projectId:N}.docx";

        if (!downloadAsLink)
            return File(result.Data!, contentType, fileName);

        return Ok(BuildDownloadLinkResponse(result.Data!, contentType, fileName));
    }

    /// <summary>
    /// Generate an AI-powered SRS document as a Markdown file from Jira issues for a project
    /// </summary>
    /// <param name="projectId">The unique identifier of the project</param>
    /// <param name="usePaidModel">Set to true to use the paid OpenAI model (no token limit) for a more comprehensive SRS</param>
    /// <param name="modelOption">Optional model version for the AI generation</param>
    /// <param name="downloadAsLink">Set to true to receive a temporary link for the generated file</param>
    /// <returns>A downloadable .md file containing the SRS document or a download link</returns>
    /// <response code="200">Returns the generated .md file or a download link</response>
    /// <response code="404">If the project or Jira configuration is not found</response>
    /// <response code="502">If the Jira or AI API request fails</response>
    [HttpGet("api/v1/projects/{projectId:guid}/srs/markdown")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> GenerateSrsMarkdown(
        Guid projectId,
        [FromQuery] bool usePaidModel = false,
        [FromQuery] string? modelOption = null,
        [FromQuery] bool downloadAsLink = false)
    {
        var result = await _aiSrsGenerationService.GenerateSrsMarkdownAsync(projectId, usePaidModel, modelOption);

        if (!result.Success)
            return NotFound(result);

        if (string.IsNullOrWhiteSpace(result.Data))
            return UnprocessableEntity(new { success = false, message = "The AI model returned empty content. Please try again." });

        var bytes = System.Text.Encoding.UTF8.GetBytes(result.Data!);
        const string contentType = "text/markdown";
        var fileName = $"SRS_{projectId:N}.md";

        if (!downloadAsLink)
            return File(bytes, contentType, fileName);

        return Ok(BuildDownloadLinkResponse(bytes, contentType, fileName));
    }

    /// <summary>
    /// Generate an AI-powered GitHub project report as a Markdown file for a project
    /// </summary>
    /// <param name="projectId">The unique identifier of the project</param>
    /// <param name="usePaidModel">Set to true to use the paid OpenAI model for a more comprehensive report</param>
    /// <param name="modelOption">Optional model version for the AI generation</param>
    /// <param name="downloadAsLink">Set to true to receive a temporary link for the generated file</param>
    /// <returns>A downloadable .md file containing the GitHub report or a download link</returns>
    /// <response code="200">Returns the generated .md file or a download link</response>
    /// <response code="404">If the project or GitHub repository configuration is not found</response>
    /// <response code="502">If the GitHub or AI API request fails</response>
    [HttpGet("api/v1/projects/{projectId:guid}/github-report/markdown")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> GenerateGithubReportMarkdown(
        Guid projectId,
        [FromQuery] bool usePaidModel = false,
        [FromQuery] string? modelOption = null,
        [FromQuery] bool downloadAsLink = false,
        [FromQuery] int recentWeeks = 12,
        [FromQuery] bool includeMermaidDiagrams = false)
    {
        Guid? userId = null;
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (Guid.TryParse(userIdClaim, out var parsedUserId))
            userId = parsedUserId;

        var result = await _githubContributionReportService.GenerateAndSaveAsync(
            projectId,
            userId,
            usePaidModel,
            modelOption,
            recentWeeks,
            includeMermaidDiagrams);

        if (!result.Success)
            return NotFound(result);

        if (result.Data == null || string.IsNullOrWhiteSpace(result.Data.MarkdownContent))
            return UnprocessableEntity(new { success = false, message = "The AI model returned empty content. Please try again." });

        var bytes = System.Text.Encoding.UTF8.GetBytes(result.Data.MarkdownContent);
        const string contentType = "text/markdown";
        var fileName = $"GitHub_Report_{projectId:N}.md";

        if (!downloadAsLink)
            return File(bytes, contentType, fileName);

        return Ok(BuildDownloadLinkResponse(bytes, contentType, fileName));
    }

    private object BuildDownloadLinkResponse(byte[] data, string contentType, string fileName)
    {
        var token = _downloadStore.Save(data, contentType, fileName, TimeSpan.FromMinutes(LinkTtlMinutes));
        // Build an absolute URL so the link works when deployed behind proxies/load-balancers
        var downloadUrl = Url.Action(
            nameof(DownloadGeneratedFile),
            "Srs",
            new { token },
            Request.Scheme,
            Request.Host.Value);

        return new
        {
            success = true,
            downloadUrl,
            fileName,
            expiresInSeconds = LinkTtlMinutes * 60
        };
    }
}

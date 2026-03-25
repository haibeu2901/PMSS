using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Web;
using Microsoft.Extensions.Options;
using PMSS.Application.Interfaces.Repositories;
using PMSS.Application.Interfaces.Services;
using PMSS.Infrastructure.Configuration;
using PMSS.Infrastructure.Utilities;

namespace PMSS.Infrastructure.Services;

/// <summary>
/// Service for interacting with Jira REST API (v3)
/// Uses the /rest/api/3/search/jql endpoint
/// Email and API Token are from JiraConfig (shared credentials)
/// </summary>
public class JiraApiService : IJiraApiService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IJiraConfigRepository _jiraConfigRepository;
    private readonly string _encryptionKey;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public JiraApiService(
        IHttpClientFactory httpClientFactory,
        IJiraConfigRepository jiraConfigRepository,
        IOptions<JwtSettings> jwtSettings)
    {
        _httpClientFactory = httpClientFactory;
        _jiraConfigRepository = jiraConfigRepository;
        _encryptionKey = jwtSettings.Value.SecretKey;
    }

    /// <inheritdoc />
    public async Task<string> FetchRawJiraIssuesAsync(Guid projectId)
    {
        var jiraConfig = await _jiraConfigRepository.GetActiveConfigByProjectIdAsync(projectId);

        if (jiraConfig == null)
        {
            throw new InvalidOperationException($"No active Jira configuration found for project ID: {projectId}");
        }

        if (string.IsNullOrWhiteSpace(jiraConfig.JiraUrl))
            throw new InvalidOperationException("Jira URL is not configured");

        if (string.IsNullOrWhiteSpace(jiraConfig.Email))
            throw new InvalidOperationException("Jira Email is not configured");

        if (string.IsNullOrWhiteSpace(jiraConfig.ApiToken))
            throw new InvalidOperationException("Jira API Token is not configured");

        if (string.IsNullOrWhiteSpace(jiraConfig.ProjectKey))
            throw new InvalidOperationException("Jira Project Key is not configured");

        var client = _httpClientFactory.CreateClient();

        // Decrypt the API token before use
        var decryptedToken = AesEncryptionHelper.Decrypt(jiraConfig.ApiToken, _encryptionKey);

        // Set up Basic Authentication (Email:ApiToken encoded in Base64)
        var authToken = Convert.ToBase64String(Encoding.ASCII.GetBytes($"{jiraConfig.Email}:{decryptedToken}"));
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", authToken);
        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        // Build the Jira search endpoint URL
        // Use "fields=*all" and expand changelog/renderedFields so we capture custom fields, attachments, worklogs, and history
        var jql = $"project = {jiraConfig.ProjectKey} ORDER BY created DESC";
        var fields = "*all";

        var baseUrl = $"{jiraConfig.JiraUrl.TrimEnd('/')}/rest/api/3/search/jql";
        var allIssues = new List<JsonElement>();
        int startAt = 0;
        int total;

        // Paginate through all Jira issues to ensure nothing is missed
        do
        {
            // Include expand parameters to retrieve changelog/history and rendered fields (e.g., HTML for descriptions/comments)
            var searchUrl = $"{baseUrl}" +
                            $"?jql={HttpUtility.UrlEncode(jql)}" +
                            $"&fields={fields}" +
                            $"&expand=changelog,renderedFields" +
                            $"&startAt={startAt}" +
                            $"&maxResults=100";

            var response = await client.GetAsync(searchUrl);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                throw new HttpRequestException($"Jira API request failed with status {response.StatusCode}: {errorContent}");
            }

            var rawPage = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(rawPage);
            var root = doc.RootElement;

            total = root.TryGetProperty("total", out var totalEl) ? totalEl.GetInt32() : 0;

            if (root.TryGetProperty("issues", out var issuesArray) && issuesArray.ValueKind == JsonValueKind.Array)
            {
                foreach (var issue in issuesArray.EnumerateArray())
                    allIssues.Add(issue.Clone());
            }

            startAt += 100;
        } while (startAt < total);

        // Return a combined JSON with all issues
        // To ensure we capture every possible piece of information, perform a per-issue detailed fetch
        // This will include any fields or expansions that the search endpoint might omit for some field types
        var detailedIssues = new List<JsonElement>(allIssues.Count);

        foreach (var issue in allIssues)
        {
            try
            {
                if (!issue.TryGetProperty("key", out var keyEl) || keyEl.ValueKind != JsonValueKind.String)
                {
                    detailedIssues.Add(issue);
                    continue;
                }

                var issueKey = keyEl.GetString();
                if (string.IsNullOrWhiteSpace(issueKey))
                {
                    detailedIssues.Add(issue);
                    continue;
                }

                // Fetch full issue details including changelog, rendered fields, names, schema, operations, editmeta, properties, transitions
                var issueUrl = $"{jiraConfig.JiraUrl.TrimEnd('/')}/rest/api/3/issue/{HttpUtility.UrlEncode(issueKey)}" +
                               "?expand=changelog,renderedFields,names,schema,operations,editmeta,properties,transitions";

                var issueResp = await client.GetAsync(issueUrl);
                if (!issueResp.IsSuccessStatusCode)
                {
                    // If detailed fetch fails for this issue, fall back to the issue returned by search
                    detailedIssues.Add(issue);
                    continue;
                }

                var issueRaw = await issueResp.Content.ReadAsStringAsync();
                using var issueDoc = JsonDocument.Parse(issueRaw);
                detailedIssues.Add(issueDoc.RootElement.Clone());
            }
            catch
            {
                // In case of any unexpected error, include the original issue and continue
                detailedIssues.Add(issue);
            }
        }

        return JsonSerializer.Serialize(new { issues = detailedIssues, total = detailedIssues.Count }, JsonOptions);
    }
}

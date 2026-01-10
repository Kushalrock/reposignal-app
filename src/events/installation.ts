/**
 * Installation event handlers
 * Handles installation.created and installation_repositories.added webhook events
 * 
 * Flow:
 * 1. Installation created -> Add repositories with state='off', fetch metadata from GitHub
 * 2. User completes setup via /setup/complete (handled by backend)
 * 3. Backend updates repository states to 'public' based on user selection
 * 
 * Metadata collection:
 * - Uses GitHub description as reposignalDescription
 * - Fetches languages from GitHub API
 * - Parses frameworks/domains from repository topics
 * - Matches against canonical values from /meta endpoints
 */

import type { Probot, Context } from 'probot';
import { backendAPI } from '../services/backend-api.js';
import { logger } from '../services/logger.js';

/**
 * Normalize string for matching: lowercase and remove spaces
 */
function normalizeForMatching(str: string): string {
  return str.toLowerCase().replace(/\s+/g, '');
}

/**
 * Fetch repository details from GitHub and add metadata
 */
async function addRepositoryWithMetadata(
  context: Context,
  installationId: number,
  repo: { id: number; full_name: string; name: string }
) {
  const [owner, name] = repo.full_name.split('/');
  console.log(`[addRepositoryWithMetadata] Starting for repo: ${repo.full_name} (ID: ${repo.id})`);
  console.log(`[addRepositoryWithMetadata] Owner: ${owner}, Name: ${name}`);
  
  try {
    // Fetch full repository details from GitHub (payload has limited info)
    console.log(`[addRepositoryWithMetadata] Fetching repository details from GitHub...`);
    const { data: repoData } = await context.octokit.repos.get({
      owner,
      repo: name,
    });
    console.log(`[addRepositoryWithMetadata] Repository details fetched. Stars: ${repoData.stargazers_count}, Forks: ${repoData.forks_count}`);

    // Add repository with state 'off' and use GitHub description
    console.log(`[addRepositoryWithMetadata] Adding repository to backend with state='off'...`);
    await backendAPI.addRepository({
      installationId,
      githubRepoId: repo.id,
      owner,
      name,
      reposignalDescription: repoData.description || undefined,
      state: 'off',
      starsCount: repoData.stargazers_count,
      forksCount: repoData.forks_count,
      openIssuesCount: repoData.open_issues_count,
    });
    console.log(`[addRepositoryWithMetadata] Repository added to backend successfully.`);

    // Fetch repository languages from GitHub
    console.log(`[addRepositoryWithMetadata] Fetching languages from GitHub...`);
    const { data: languagesData } = await context.octokit.repos.listLanguages({
      owner,
      repo: name,
    });
    console.log(`[addRepositoryWithMetadata] Languages fetched: ${Object.keys(languagesData).join(', ') || 'none'}`);

    // Get canonical metadata from backend
    console.log(`[addRepositoryWithMetadata] Fetching canonical metadata from backend...`);
    const [allLanguages, allFrameworks, allDomains] = await Promise.all([
      backendAPI.getLanguages(),
      backendAPI.getFrameworks(),
      backendAPI.getDomains(),
    ]);
    console.log(`[addRepositoryWithMetadata] Canonical metadata fetched. Languages: ${allLanguages.length}, Frameworks: ${allFrameworks.length}, Domains: ${allDomains.length}`);

    // Map GitHub API languages to canonical matchingNames
    console.log(`[addRepositoryWithMetadata] Mapping GitHub languages to canonical values...`);
    const languagesFromAPI = Object.entries(languagesData)
      .map(([lang, bytes]) => {
        const normalized = normalizeForMatching(lang);
        const canonical = allLanguages.find(
          (l) => l.matchingName === normalized
        );
        return canonical ? { matchingName: canonical.matchingName, bytes } : null;
      })
      .filter((l): l is { matchingName: string; bytes: number } => l !== null);

    // Get topics from repository
    const topics = repoData.topics || [];
    console.log(`[addRepositoryWithMetadata] Repository topics: ${topics.join(', ') || 'none'}`);
    
    // Parse languages from topics (topics can contain languages too)
    const languagesFromTopics = topics
      .map((topic) => {
        const normalized = normalizeForMatching(topic);
        const canonical = allLanguages.find(
          (l) => l.matchingName === normalized
        );
        // Only include if not already in languagesFromAPI
        if (canonical && !languagesFromAPI.find(l => l.matchingName === canonical.matchingName)) {
          return { matchingName: canonical.matchingName, bytes: 0 };
        }
        return null;
      })
      .filter((l): l is { matchingName: string; bytes: number } => l !== null);

    // Combine languages from API and topics
    const languages = [...languagesFromAPI, ...languagesFromTopics];
    console.log(`[addRepositoryWithMetadata] Languages from API: ${languagesFromAPI.map(l => l.matchingName).join(', ') || 'none'}`);
    console.log(`[addRepositoryWithMetadata] Languages from topics: ${languagesFromTopics.map(l => l.matchingName).join(', ') || 'none'}`);
    console.log(`[addRepositoryWithMetadata] Final languages list: ${languages.map(l => l.matchingName).join(', ') || 'none'}`);

    // Parse frameworks from topics/tags
    const frameworks = topics
      .map((topic) => {
        const normalized = normalizeForMatching(topic);
        const canonical = allFrameworks.find(
          (f) => f.matchingName === normalized
        );
        return canonical
          ? { matchingName: canonical.matchingName, source: 'inferred' as const }
          : null;
      })
      .filter((f): f is { matchingName: string; source: 'inferred' } => f !== null);

    // Parse domains from topics/tags
    console.log(`[addRepositoryWithMetadata] Parsing domains from topics...`);
    const domains = topics
      .map((topic) => {
        const normalized = normalizeForMatching(topic);
        const canonical = allDomains.find(
          (d) => d.matchingName === normalized
        );
        return canonical ? canonical.matchingName : null;
      })
      .filter((d): d is string => d !== null);
    console.log(`[addRepositoryWithMetadata] Frameworks parsed: ${frameworks.map(f => f.matchingName).join(', ') || 'none'}`);
    console.log(`[addRepositoryWithMetadata] Domains parsed: ${domains.join(', ') || 'none'}`);

    // Update repository metadata
    if (languages.length > 0 || frameworks.length > 0 || domains.length > 0 || topics.length > 0) {
      console.log(`[addRepositoryWithMetadata] Updating repository metadata...`);
      await backendAPI.updateRepositoryMetadata({
        githubRepoId: repo.id,
        languages: languages.length > 0 ? languages : undefined,
        frameworks: frameworks.length > 0 ? frameworks : undefined,
        domains: domains.length > 0 ? domains : undefined,
        tags: topics.length > 0 ? topics : undefined,
        starsCount: repoData.stargazers_count,
        forksCount: repoData.forks_count,
        openIssuesCount: repoData.open_issues_count,
        actor: {
          type: 'system',
        },
      });
      console.log(`[addRepositoryWithMetadata] Repository metadata updated successfully.`);
    } else {
      console.log(`[addRepositoryWithMetadata] No metadata to update (all arrays empty).`);
    }

    console.log(`[addRepositoryWithMetadata] Completed successfully for ${owner}/${name}`);
    context.log.info(`Repository ${owner}/${name} added with metadata`);
  } catch (error) {
    console.error(`[addRepositoryWithMetadata] ERROR: Failed to add repository ${owner}/${name}:`, error);
    context.log.error({ error }, `Failed to add repository ${owner}/${name} with metadata`);
  }
}

export function registerInstallationHandlers(app: Probot) {
  /**
   * installation.created
   * When the GitHub App is installed on a user or org
   */
  app.on('installation.created', async (context: Context<'installation.created'>) => {
    const { installation, repositories } = context.payload;
    console.log(`[installation.created] Event triggered for installation ID: ${installation.id}`);
    console.log(`[installation.created] Account type: ${installation.account?.type}, Account login: ${installation.account?.login}`);
    console.log(`[installation.created] Number of repositories: ${repositories?.length || 0}`);

    try {
      // Sync installation with backend (creates installation and sets up 30-minute setup window)
      console.log(`[installation.created] Syncing installation with backend...`);
      const syncResult = await backendAPI.syncInstallation({
        installation: {
          githubInstallationId: installation.id,
          accountType: installation.account?.type === 'Organization' ? 'org' as const : 'user' as const,
          accountLogin: installation.account?.login || '',
        },
      });
      console.log(`[installation.created] Installation synced successfully. Backend installation ID: ${syncResult.id}`);

      // Add all repositories with metadata (state = 'off' initially)
      if (repositories && repositories.length > 0) {
        console.log(`[installation.created] Starting to add ${repositories.length} repositories...`);
        for (const repo of repositories) {
          console.log(`[installation.created] Processing repository: ${repo.full_name}`);
          await addRepositoryWithMetadata(context, syncResult.id, repo);
          console.log(`[installation.created] Repository ${repo.full_name} processed successfully.`);
          
          // Log repository addition
          console.log(`[installation.created] Logging repository_added event...`);
          await logger.logSystem(
            'repository_added',
            'repo',
            `repo#${repo.id}`
          );
          console.log(`[installation.created] Repository_added event logged.`);
        }
        console.log(`[installation.created] All ${repositories.length} repositories added successfully.`);
      } else {
        console.log(`[installation.created] No repositories to add.`);
      }

      // Log installation creation
      console.log(`[installation.created] Logging installation_created event...`);
      await logger.logSystem(
        'installation_created',
        'installation',
        `installation#${installation.id}`
      );
      console.log(`[installation.created] Installation_created event logged.`);

      console.log(`[installation.created] COMPLETED: Installation ${installation.id} created with ${repositories?.length || 0} repositories`);
      context.log.info(`Installation created: ${installation.id} with ${repositories?.length || 0} repositories`);
    } catch (error) {
      console.error(`[installation.created] ERROR: Failed to handle installation.created:`, error);
      context.log.error({ error }, 'Failed to handle installation.created');
    }
  });

  /**
   * installation_repositories.added
   * When repositories are added to an existing installation
   */
  app.on('installation_repositories.added', async (context: Context<'installation_repositories.added'>) => {
    const { installation, repositories_added } = context.payload;
    console.log(`[installation_repositories.added] Event triggered for installation ID: ${installation.id}`);
    console.log(`[installation_repositories.added] Account type: ${installation.account?.type}, Account login: ${installation.account?.login}`);
    console.log(`[installation_repositories.added] Number of repositories added: ${repositories_added.length}`);

    try {
      // First sync the installation to ensure it exists
      console.log(`[installation_repositories.added] Syncing installation with backend...`);
      const syncResult = await backendAPI.syncInstallation({
        installation: {
          githubInstallationId: installation.id,
          accountType: installation.account?.type === 'Organization' ? 'org' : 'user',
          accountLogin: installation.account?.login || '',
        },
      });
      console.log(`[installation_repositories.added] Installation synced successfully. Backend installation ID: ${syncResult.id}`);

      // Add each repository with metadata (state = 'off' initially)
      console.log(`[installation_repositories.added] Starting to add ${repositories_added.length} repositories...`);
      for (const repo of repositories_added) {
        console.log(`[installation_repositories.added] Processing repository: ${repo.full_name}`);
        await addRepositoryWithMetadata(context, syncResult.id, repo);
        console.log(`[installation_repositories.added] Repository ${repo.full_name} processed successfully.`);
        
        // Log repository addition
        console.log(`[installation_repositories.added] Logging repository_added event for repo#${repo.id}...`);
        await logger.logSystem(
          'repository_added',
          'repo',
          `repo#${repo.id}`
        );
        console.log(`[installation_repositories.added] Repository_added event logged.`);
      }

      console.log(`[installation_repositories.added] COMPLETED: Added ${repositories_added.length} repositories to installation ${installation.id}`);
      context.log.info(`Added ${repositories_added.length} repositories to installation ${installation.id}`);
    } catch (error) {
      console.error(`[installation_repositories.added] ERROR: Failed to handle installation_repositories.added:`, error);
      context.log.error({ error }, 'Failed to handle installation_repositories.added');
    }
  });
}

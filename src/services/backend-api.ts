/**
 * Backend API client
 * All bot → backend communication goes through this service
 * Uses ONLY /bot/* endpoints as defined in utils/openapi.ts
 */

import type { LogEntry, IssueType, RepoState } from '../types/index.js';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';
const BOT_API_KEY = process.env.BOT_API_KEY;

if (!BOT_API_KEY) {
  throw new Error('BOT_API_KEY environment variable is required');
}

export interface CanonicalLanguage {
  id: number;
  matchingName: string;
  displayName: string;
}

export interface CanonicalFramework {
  id: number;
  matchingName: string;
  displayName: string;
  category: string;
}

export interface CanonicalDomain {
  id: number;
  matchingName: string;
  displayName: string;
}

class BackendAPI {
  private headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${BOT_API_KEY}`,
  };

  /**
   * POST /bot/installations/sync
   * Sync GitHub App installation with repositories
   */
  async syncInstallation(data: {
    installation: {
      githubInstallationId: number;
      accountType: 'user' | 'org';
      accountLogin: string;
      setupCompleted?: boolean;
    };
    repositories?: Array<{
      githubRepoId: number;
      owner: string;
      name: string;
      state?: RepoState;
    }>;
  }) {
    const response = await fetch(`${BACKEND_URL}/bot/installations/sync`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync installation: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * POST /bot/issues/classify
   * Classify GitHub issue (difficulty, issueType, hidden are all optional and independent)
   */
  async classifyIssue(data: {
    githubRepoId: number;
    githubIssueId: number;
    difficulty?: number | null;
    issueType?: IssueType | null;
    hidden?: boolean | null;
    actor: {
      type: 'user' | 'bot' | 'system';
      githubId?: number | null;
      username?: string | null;
    };
  }) {
    const response = await fetch(`${BACKEND_URL}/bot/issues/classify`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to classify issue: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * POST /bot/repositories/add
   * Add repository to installation with full metadata
   */
  async addRepository(data: {
    installationId: number;
    githubRepoId: number;
    owner: string;
    name: string;
    reposignalDescription?: string;
    state?: RepoState;
    starsCount?: number;
    forksCount?: number;
    openIssuesCount?: number;
  }) {
    const response = await fetch(`${BACKEND_URL}/bot/repositories/add`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to add repository: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * POST /bot/repositories/metadata
   * Update repository metadata (languages, frameworks, domains, tags, stats)
   */
  async updateRepositoryMetadata(data: {
    githubRepoId: number;
    languages?: Array<{
      matchingName: string;
      bytes: number;
    }>;
    frameworks?: Array<{
      matchingName: string;
      source: 'inferred' | 'maintainer';
    }>;
    domains?: string[];
    tags?: string[];
    starsCount?: number;
    forksCount?: number;
    openIssuesCount?: number;
    actor: {
      type: 'system' | 'bot' | 'user';
      githubId?: number | null;
      username?: string | null;
    };
  }) {
    const response = await fetch(`${BACKEND_URL}/bot/repositories/metadata`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update repository metadata: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * GET /meta/languages
   * Fetch all canonical languages
   */
  async getLanguages(): Promise<CanonicalLanguage[]> {
    const response = await fetch(`${BACKEND_URL}/meta/languages`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch languages: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * GET /meta/frameworks
   * Fetch all canonical frameworks
   * Returns hierarchical object organized by category, flattens to array
   */
  async getFrameworks(): Promise<CanonicalFramework[]> {
    const response = await fetch(`${BACKEND_URL}/meta/frameworks`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch frameworks: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Data comes as { frontend: [...], backend: [...], mobile: [...], ... }
    // Flatten it to a single array
    const frameworks: CanonicalFramework[] = [];
    for (const category in data) {
      if (Array.isArray(data[category])) {
        frameworks.push(...data[category]);
      }
    }
    
    console.log(`[backendAPI.getFrameworks] Fetched and flattened ${frameworks.length} frameworks from ${Object.keys(data).length} categories`);
    return frameworks;
  }

  /**
   * GET /meta/domains
   * Fetch all canonical domains
   */
  async getDomains(): Promise<CanonicalDomain[]> {
    const response = await fetch(`${BACKEND_URL}/meta/domains`, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch domains: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * POST /bot/repositories/{id}/settings
   * Update repository settings (state, allowUnclassified, etc.)
   */
  async updateRepositorySettings(data: {
    repoId: number;
    reposignalDescription?: string | null;
    state?: RepoState;
    allowUnclassified?: boolean;
    allowClassification?: boolean;
    allowInference?: boolean;
    feedbackEnabled?: boolean;
    actor?: {
      githubId?: number;
      username?: string;
    };
  }) {
    const response = await fetch(`${BACKEND_URL}/bot/repositories/${data.repoId}/settings`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update repository settings: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * DELETE /bot/issues
   * Delete GitHub issue from database
   */
  async deleteIssue(data: {
    githubRepoId: number;
    githubIssueId: number;
    actor: {
      type: 'bot' | 'user';
      githubId?: number;
      username?: string;
    };
  }) {
    const response = await fetch(`${BACKEND_URL}/bot/issues`, {
      method: 'DELETE',
      headers: this.headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to delete issue: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * POST /bot/feedback
   * Submit feedback on issue
   */
  async submitFeedback(data: {
    githubPrId: number;
    githubRepoId: number;
    difficultyRating?: number | null;
    responsivenessRating?: number | null;
  }) {
    const response = await fetch(`${BACKEND_URL}/bot/feedback`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to submit feedback: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * POST /bot/logs
   * Write activity log
   */
  async writeLog(log: LogEntry) {
    const response = await fetch(`${BACKEND_URL}/bot/logs`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        context: log.context,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to write log: ${response.statusText}`);
    }

    return response.json();
  }
}

export const backendAPI = new BackendAPI();

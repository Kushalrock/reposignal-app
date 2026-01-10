/**
 * Type definitions for the Reposignal bot
 */

export type ActorType = 'system' | 'bot' | 'maintainer' | 'contributor';
export type EntityType = 'repo' | 'issue' | 'installation' | 'feedback' | 'comment';
export type IssueType = 'docs' | 'bug' | 'feature' | 'refactor' | 'test' | 'infra';
export type RepoState = 'off' | 'public' | 'paused';

export interface LogEntry {
  actorType: ActorType;
  actorGithubId?: number | null;
  actorUsername?: string | null;
  action: string;
  entityType: EntityType;
  entityId: string;
  context?: Record<string, any> | null;
}

export interface CleanupJob {
  owner: string;
  repo: string;
  commentId: number;
  issueNumber?: number;
  installationId: number;
}

/**
 * Maintainer command handlers
 * Parses and executes slash commands from maintainers
 */

import type { Context } from 'probot';
import { backendAPI } from '../services/backend-api.js';
import { scheduleCleanup } from '../queues/cleanup.js';
import type { IssueType } from '../types/index.js';

/**
 * Check if user has write, maintain, or admin permission
 */
async function hasMaintainerPermission(
  context: Context<'issue_comment.created'>,
  owner: string,
  repo: string,
  username: string
): Promise<boolean> {
  try {
    const { data: permission } = await context.octokit.repos.getCollaboratorPermissionLevel({
      owner,
      repo,
      username,
    });
    return ['write', 'maintain', 'admin'].includes(permission.permission);
  } catch {
    return false;
  }
}

/**
 * Parse difficulty command: /reposignal difficulty <1-5>
 */
function parseDifficultyCommand(body: string): number | null {
  const match = body.match(/\/reposignal\s+difficulty\s+([1-5])/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Parse type command: /reposignal type <docs|bug|feature|refactor|test|infra>
 */
function parseTypeCommand(body: string): IssueType | null {
  const match = body.match(/\/reposignal\s+type\s+(docs|bug|feature|refactor|test|infra)/i);
  if (match) {
    return match[1].toLowerCase() as IssueType;
  }
  return null;
}

/**
 * Check for hide command: /reposignal hide
 */
function isHideCommand(body: string): boolean {
  return /\/reposignal\s+hide/i.test(body);
}

/**
 * Handle maintainer commands on issue comments
 */
export async function handleMaintainerCommand(context: Context<'issue_comment.created'>) {
  const { comment, issue, repository, sender } = context.payload;
  console.log(context.payload);

  // Only process commands (ignore regular comments)
  if (!comment.body.includes('/reposignal')) {
    return;
  }

  // Check permissions (silent ignore if unauthorized)
  const hasPermission = await hasMaintainerPermission(
    context,
    repository.owner.login,
    repository.name,
    sender.login
  );

  if (!hasPermission) {
    context.log.info(`User ${sender.login} lacks maintainer permission - ignoring command`);
    return;
  }

  try {
    const difficulty = parseDifficultyCommand(comment.body);
    const issueType = parseTypeCommand(comment.body);
    const shouldHide = isHideCommand(comment.body);

    // Actor info for all classification calls (backend handles logging)
    const actor = {
      type: 'user' as const,
      githubId: sender.id,
      username: sender.login,
    };

    // Build confirmation message
    const changes: string[] = [];
    
    // Handle any classification command (difficulty, type, or hide - all independent)
    if (difficulty !== null || issueType !== null || shouldHide) {
      await backendAPI.classifyIssue({
        githubRepoId: repository.id,
        githubIssueId: issue.id,
        difficulty: difficulty ?? undefined,
        issueType: issueType ?? undefined,
        hidden: shouldHide ? true : undefined,
        actor,
      });

      // Build confirmation message
      if (difficulty !== null) {
        changes.push(`difficulty ${difficulty}`);
      }
      if (issueType !== null) {
        changes.push(`type ${issueType}`);
      }
      if (shouldHide) {
        changes.push('hidden from discovery');
      }

      // Post confirmation
      const confirmation = await context.octokit.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: issue.number,
        body: `✅ Issue updated: ${changes.join(', ')}`,
      });

      // Schedule cleanup of both command and confirmation
      await scheduleCleanup({
        owner: repository.owner.login,
        repo: repository.name,
        commentId: comment.id,
        issueNumber: issue.number,
        installationId: context.payload.installation!.id,
      }, 60000); // 1 minute

      await scheduleCleanup({
        owner: repository.owner.login,
        repo: repository.name,
        commentId: confirmation.data.id,
        issueNumber: issue.number,
        installationId: context.payload.installation!.id,
      }, 60000); // 1 minute

      context.log.info(`Issue #${issue.number} updated by ${sender.login}: ${changes.join(', ')}`);
    }
  } catch (error) {
    context.log.error({ error }, 'Failed to handle maintainer command');
  }
}

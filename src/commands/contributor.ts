/**
 * Contributor command handlers
 * Handles feedback commands from PR authors (ANONYMOUS)
 */

import type { Context } from 'probot';
import { backendAPI } from '../services/backend-api.js';
import { logger } from '../services/logger.js';
import { scheduleCleanup } from '../queues/cleanup.js';

/**
 * Parse difficulty rating: /reposignal rate difficulty <1-5>
 */
function parseDifficultyRating(body: string): number | null {
  const match = body.match(/\/reposignal\s+rate\s+difficulty\s+([1-5])/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Parse responsiveness rating: /reposignal rate responsiveness <1-5>
 */
function parseResponsivenessRating(body: string): number | null {
  const match = body.match(/\/reposignal\s+rate\s+responsiveness\s+([1-5])/i);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Check if comment is in a merged PR thread by the PR author
 */
async function isValidFeedbackContext(
  context: Context<'issue_comment.created'>,
  owner: string,
  repo: string,
  issueNumber: number,
  commenterId: number
): Promise<{ valid: boolean; prId?: number }> {
  try {
    // Get PR details
    const { data: pr } = await context.octokit.pulls.get({
      owner,
      repo,
      pull_number: issueNumber,
    });

    // Check: PR is merged, commenter is PR author
    if (pr.merged && pr.user?.id === commenterId) {
      return { valid: true, prId: pr.id };
    }

    return { valid: false };
  } catch {
    return { valid: false };
  }
}

/**
 * Handle contributor feedback commands on PR comments
 */
export async function handleContributorFeedback(context: Context<'issue_comment.created'>) {
  const { comment, issue, repository, sender } = context.payload;

  // Only process feedback commands
  if (!comment.body.includes('/reposignal rate')) {
    return;
  }

  // Validate context: merged PR, PR author commenting
  const { valid, prId } = await isValidFeedbackContext(
    context,
    repository.owner.login,
    repository.name,
    issue.number,
    sender.id
  );

  if (!valid || !prId) {
    // Silent ignore if not valid
    context.log.info('Feedback command in invalid context - ignoring');
    return;
  }

  try {
    const difficultyRating = parseDifficultyRating(comment.body);
    const responsivenessRating = parseResponsivenessRating(comment.body);

    // At least one rating must be provided
    if (difficultyRating === null && responsivenessRating === null) {
      return;
    }

    // Submit feedback (ANONYMOUS - no actor info sent)
    await backendAPI.submitFeedback({
      githubPrId: prId,
      githubRepoId: repository.id,
      difficultyRating,
      responsivenessRating,
    });

    // Manual logging needed here - feedback endpoint doesn't require actor (anonymous)
    await logger.logContributor(
      'feedback_received',
      'repo',
      `repo#${repository.id}`,
      {
        difficulty_rating: difficultyRating,
        responsiveness_rating: responsivenessRating,
      }
    );

    // Post confirmation
    const confirmation = await context.octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: issue.number,
      body: `✅ Thank you for your anonymous feedback!`,
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

    context.log.info(`Anonymous feedback received on PR #${issue.number}`);
  } catch (error) {
    context.log.error({ error }, 'Failed to handle contributor feedback');
  }
}

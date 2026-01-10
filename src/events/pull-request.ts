/**
 * Pull request event handlers
 * Handles pull_request.closed webhook event
 */

import type { Probot, Context } from 'probot';
import { logger } from '../services/logger.js';
import { scheduleCleanup } from '../queues/cleanup.js';
import { backendAPI } from '../services/backend-api.js';

export function registerPullRequestHandlers(app: Probot) {
  /**
   * pull_request.closed
   * Post feedback nudge when PR is merged
   */
  app.on('pull_request.closed', async (context: Context<'pull_request.closed'>) => {
    const { pull_request, repository } = context.payload;

    // Only process merged PRs
    if (!pull_request.merged) {
      return;
    }

    try {
      // Post one feedback nudge
      const comment = await context.octokit.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: pull_request.number,
        body: `🎉 Thanks for your contribution!\n\nHelp us improve by sharing your experience:\n\n\`/reposignal rate difficulty <1-5>\`\n\`/reposignal rate responsiveness <1-5>\`\n\nYour feedback is anonymous and helps future contributors.`,
      });

      // Log the feedback prompt (bot actor - autonomous action)
      await logger.logBot(
        'feedback_prompted',
        'repo',
        `repo#${repository.id}`,
        { prNumber: pull_request.number }
      );

      // Schedule cleanup (delete the nudge after 1 hour)
      await scheduleCleanup({
        owner: repository.owner.login,
        repo: repository.name,
        commentId: comment.data.id,
        issueNumber: pull_request.number,
        installationId: context.payload.installation!.id,
      }, 3600000); // 1 hour

      context.log.info(`Posted feedback nudge on PR #${pull_request.number}`);

      // Delete the issue from database when PR is merged
      if (pull_request.head.repo) {
        try {
          // Find the linked issue (PRs can close issues)
          // The issue number is typically in the PR body or linked via GitHub
          // For now, we'll use the PR number as the issue number if they match
          // In a more robust implementation, you'd parse the PR body for "closes #X" or use GitHub's API
          
          // Check if there's a linked issue by looking at the PR
          const linkedIssues = pull_request.body?.match(/(close[sd]?|fix(e[sd])?|resolve[sd]?)\s+#(\d+)/gi);
          
          if (linkedIssues) {
            for (const match of linkedIssues) {
              const issueNumber = parseInt(match.match(/#(\d+)/)![1]);
              
              await backendAPI.deleteIssue({
                githubRepoId: repository.id,
                githubIssueId: issueNumber,
                actor: {
                  type: 'bot',
                },
              });

              await logger.logBot(
                'issue_deleted',
                'issue',
                `issue#${issueNumber}`,
                { 
                  reason: 'pr_merged',
                  prNumber: pull_request.number,
                  repoId: repository.id 
                }
              );

              context.log.info(`Deleted issue #${issueNumber} after PR #${pull_request.number} was merged`);
            }
          }
        } catch (error) {
          context.log.error({ error }, 'Failed to delete issue after PR merge');
          // Don't throw - this shouldn't block the feedback flow
        }
      }
    } catch (error) {
      context.log.error({ error }, 'Failed to handle pull_request.closed');
    }
  });
}

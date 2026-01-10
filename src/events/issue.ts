/**
 * Issue event handlers
 * Handles issues.opened webhook event
 */

import type { Probot, Context } from 'probot';
import { logger } from '../services/logger.js';
import { scheduleCleanup } from '../queues/cleanup.js';

export function registerIssueHandlers(app: Probot) {
  /**
   * issues.opened
   * Post subtle nudge when issue is opened
   */
  app.on('issues.opened', async (context: Context<'issues.opened'>) => {
    const { issue, repository } = context.payload;

    try {
      // Post one subtle nudge
      const comment = await context.octokit.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: issue.number,
        body: `👋 Thanks for opening this issue! Maintainers can classify it using:\n\n\`/reposignal difficulty <1-5>\`\n\`/reposignal type <docs|bug|feature|refactor|test|infra>\`\n\nOr hide it from discovery: \`/reposignal hide\``,
      });

      // Log the nudge (bot actor - autonomous action)
      await logger.logBot(
        'issue_nudge_posted',
        'issue',
        `issue#${issue.id}`,
        { issueNumber: issue.number }
      );

      // Schedule cleanup (delete the nudge after 5 minutes)
      await scheduleCleanup({
        owner: repository.owner.login,
        repo: repository.name,
        commentId: comment.data.id,
        issueNumber: issue.number,
        installationId: context.payload.installation!.id,
      }, 300000); // 5 minutes

      context.log.info(`Posted nudge on issue #${issue.number}`);
    } catch (error) {
      context.log.error({ error }, 'Failed to handle issues.opened');
    }
  });
}

/**
 * Comment event handlers
 * Routes comments to maintainer or contributor command handlers
 */

import type { Probot, Context } from 'probot';
import { handleMaintainerCommand } from '../commands/maintainer.js';
import { handleContributorFeedback } from '../commands/contributor.js';

export function registerCommentHandlers(app: Probot) {
  /**
   * issue_comment.created
   * Route to appropriate command handler
   */
  app.on('issue_comment.created', async (context: Context<'issue_comment.created'>) => {
    const { comment } = context.payload;

    // Check if comment contains a command
    if (!comment.body.includes('/reposignal')) {
      return;
    }

    // Route to appropriate handler based on command type
    if (comment.body.includes('/reposignal rate')) {
      // Contributor feedback command
      await handleContributorFeedback(context);
    } else {
      // Maintainer command (difficulty, type, hide)
      await handleMaintainerCommand(context);
    }
  });
}

/**
 * Reposignal GitHub Bot
 * 
 * A Probot-based GitHub App that helps maintainers classify issues
 * and collects anonymous feedback from contributors.
 * 
 * Features:
 * - Installation sync with backend
 * - Issue classification via slash commands
 * - Anonymous contributor feedback
 * - Automatic message cleanup via BullMQ
 * 
 * All data is stored in the backend via /bot/* endpoints.
 * The bot owns ZERO persistent state.
 */

import { Probot } from 'probot';
import { registerInstallationHandlers } from './events/installation.js';
import { registerIssueHandlers } from './events/issue.js';
import { registerCommentHandlers } from './events/comment.js';
import { registerPullRequestHandlers } from './events/pull-request.js';
import { initCleanupWorker } from './queues/cleanup.js';

export default (app: Probot) => {
  // Initialize cleanup worker (pass app for authentication)
  initCleanupWorker(app);

  // Register event handlers
  registerInstallationHandlers(app);
  registerIssueHandlers(app);
  registerCommentHandlers(app);
  registerPullRequestHandlers(app);

  app.log.info('Reposignal bot loaded successfully');
};

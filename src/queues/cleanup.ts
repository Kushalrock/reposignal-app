/**
 * BullMQ cleanup queue
 * Handles scheduled deletion of bot messages
 */

import { Queue, Worker } from 'bullmq';
import type { CleanupJob } from '../types/index.js';
import { logger } from '../services/logger.js';
import type { Probot } from 'probot';

const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_USERNAME = process.env.REDIS_USERNAME;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD;

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  ...(REDIS_USERNAME && { username: REDIS_USERNAME }),
  ...(REDIS_PASSWORD && { password: REDIS_PASSWORD }),
};

// Create cleanup queue
export const cleanupQueue = new Queue<CleanupJob>('reposignal-cleanup', {
  connection,
});

/**
 * Schedule a cleanup job
 * @param job - Cleanup job details
 * @param delayMs - Delay in milliseconds before cleanup
 */
export async function scheduleCleanup(job: CleanupJob, delayMs: number) {
  await cleanupQueue.add('delete-comment', job, {
    delay: delayMs,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  });
}

/**
 * Initialize cleanup worker
 * Processes cleanup jobs by deleting comments
 */
export function initCleanupWorker(app: Probot) {
  const worker = new Worker<CleanupJob>(
    'reposignal-cleanup',
    async (job) => {
      const { owner, repo, commentId, issueNumber, installationId } = job.data;

      try {
        // Get authenticated octokit instance from Probot with installation ID
        const octokit = await app.auth(installationId);

        // Delete the comment
        await octokit.issues.deleteComment({
          owner,
          repo,
          comment_id: commentId,
        });

        // Log cleanup (system actor)
        await logger.logSystem(
          'comment_cleaned_up',
          'comment',
          `comment#${commentId}`,
          { owner, repo, issueNumber }
        );

        console.log(`Deleted comment ${commentId} from ${owner}/${repo}#${issueNumber}`);
      } catch (error) {
        console.error('Failed to delete comment:', error);
        throw error; // Will trigger retry
      }
    },
    {
      connection,
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`Cleanup job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Cleanup job ${job?.id} failed:`, err);
  });

  return worker;
}

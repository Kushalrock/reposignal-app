/**
 * Logger service for the bot
 * Wraps backend API logging with proper actor rules
 */

import { backendAPI } from './backend-api.js';
import type { LogEntry } from '../types/index.js';

class Logger {
  /**
   * Log with system actor (for autonomous events)
   */
  async logSystem(
    action: string,
    entityType: LogEntry['entityType'],
    entityId: string,
    context?: Record<string, any>
  ) {
    await backendAPI.writeLog({
      actorType: 'system',
      actorGithubId: null,
      actorUsername: null,
      action,
      entityType,
      entityId,
      context,
    });
  }

  /**
   * Log with bot actor (for autonomous inference/actions)
   */
  async logBot(
    action: string,
    entityType: LogEntry['entityType'],
    entityId: string,
    context?: Record<string, any>
  ) {
    await backendAPI.writeLog({
      actorType: 'bot',
      actorGithubId: null,
      actorUsername: null,
      action,
      entityType,
      entityId,
      context,
    });
  }

  /**
   * Log with maintainer actor (for human-triggered actions)
   */
  async logMaintainer(
    githubId: number,
    username: string,
    action: string,
    entityType: LogEntry['entityType'],
    entityId: string,
    context?: Record<string, any>
  ) {
    await backendAPI.writeLog({
      actorType: 'maintainer',
      actorGithubId: githubId,
      actorUsername: username,
      action,
      entityType,
      entityId,
      context,
    });
  }

  /**
   * Log with contributor actor (ALWAYS ANONYMOUS for feedback)
   */
  async logContributor(
    action: string,
    entityType: LogEntry['entityType'],
    entityId: string,
    context?: Record<string, any>
  ) {
    await backendAPI.writeLog({
      actorType: 'contributor',
      actorGithubId: null,
      actorUsername: null,
      action,
      entityType,
      entityId,
      context,
    });
  }
}

export const logger = new Logger();

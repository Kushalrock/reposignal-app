/**
 * OpenAPI / Swagger documentation for Reposignal API
 * 
 * This file generates the OpenAPI specification based on actual implemented routes.
 * It serves as the single source of truth for API documentation.
 */

export const openAPISpec = {
  openapi: '3.0.0',
  info: {
    title: 'Reposignal API',
    description:
      'Reposignal is an issue-first discovery platform that surfaces work units (issues) with repository context. It helps developers discover and contribute to meaningful open source work.',
    version: '1.0.0',
    contact: {
      name: 'Reposignal Team',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local development server',
    },
    {
      url: 'https://api.reposignal.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Bearer token for authentication (session token for users, API key for bots)',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                description: 'Error code identifier',
              },
              message: {
                type: 'string',
                description: 'Human-readable error message',
              },
              details: {
                type: 'object',
                description: 'Additional error context',
              },
            },
            required: ['code', 'message'],
          },
        },
      },
      CanonicalLanguage: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          matchingName: { type: 'string' },
          displayName: { type: 'string' },
        },
        required: ['id', 'matchingName', 'displayName'],
      },
      CanonicalFramework: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          matchingName: { type: 'string' },
          displayName: { type: 'string' },
          category: { type: 'string' },
          source: {
            type: 'string',
            enum: ['inferred', 'maintainer'],
            description: 'Present when attached to a repository',
          },
        },
        required: ['id', 'matchingName', 'displayName'],
      },
      CanonicalDomain: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          matchingName: { type: 'string' },
          displayName: { type: 'string' },
        },
        required: ['id', 'matchingName', 'displayName'],
      },
      Issue: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
          },
          githubIssueId: {
            type: 'number',
          },
          difficulty: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            nullable: true,
            description: 'Difficulty rating (1-5, null if unclassified)',
          },
          issueType: {
            type: 'string',
            enum: ['docs', 'bug', 'feature', 'refactor', 'test', 'infra'],
            nullable: true,
          },
          hidden: {
            type: 'boolean',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      Repository: {
        type: 'object',
        properties: {
          githubRepoId: {
            type: 'number',
          },
          owner: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          starsCount: {
            type: 'integer',
          },
          forksCount: {
            type: 'integer',
          },
          openIssuesCount: {
            type: 'integer',
          },
          domains: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/CanonicalDomain',
            },
            description: 'Repository domains (max 2), canonical objects',
          },
          frameworks: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/CanonicalFramework',
            },
            description: 'Repository frameworks (max 3), canonical objects with source',
          },
          languages: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/CanonicalLanguage',
            },
            description: 'Programming languages used (canonical objects)',
          },
        },
      },
      DiscoveryResult: {
        type: 'object',
        properties: {
          score: {
            type: 'number',
            description:
              'Ranking score (base 100, with bonuses for difficulty match, domain, framework, language, responsiveness, and repo signals)',
          },
          issue: {
            $ref: '#/components/schemas/Issue',
          },
          repository: {
            $ref: '#/components/schemas/Repository',
          },
          feedback: {
            type: 'object',
            nullable: true,
            properties: {
              avgDifficultyBucket: {
                type: 'integer',
                nullable: true,
              },
              avgResponsivenessBucket: {
                type: 'integer',
                nullable: true,
              },
            },
          },
        },
      },
      Profile: {
        type: 'object',
        properties: {
          githubUserId: {
            type: 'number',
          },
          username: {
            type: 'string',
          },
          avatarUrl: {
            type: 'string',
            nullable: true,
          },
          bio: {
            type: 'string',
            nullable: true,
          },
          links: {
            type: 'object',
            nullable: true,
            additionalProperties: true,
            description: 'Optional external links or profile metadata',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      LogEntry: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
          },
          actorType: {
            type: 'string',
            enum: ['system', 'user', 'bot'],
          },
          actorGithubId: {
            type: 'number',
            nullable: true,
          },
          actorUsername: {
            type: 'string',
            nullable: true,
          },
          action: {
            type: 'string',
          },
          entityType: {
            type: 'string',
          },
          entityId: {
            type: 'string',
          },
          context: {
            type: 'object',
            nullable: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        operationId: 'healthCheck',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: {
                      type: 'string',
                    },
                    timestamp: {
                      type: 'string',
                      format: 'date-time',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // PUBLIC ROUTES (NO AUTH)
    '/public/discovery': {
      get: {
        tags: ['Discovery'],
        summary: 'Discover issues with issue-first ranking',
        operationId: 'discoverRepositories',
        description:
          'Returns a ranked list of discoverable issues with repository context. Rankings are based on difficulty match, domain, framework, language, and responsiveness.',
        parameters: [
          {
            name: 'difficulty',
            in: 'query',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 5,
            },
            description: 'Filter by exact difficulty level',
          },
          {
            name: 'domainIds',
            in: 'query',
            schema: {
              type: 'array',
              items: {
                type: 'integer',
              },
            },
            style: 'form',
            explode: true,
            description: 'Filter by repository domains via canonical IDs (comma-separated)',
          },
          {
            name: 'domainMatchingNames',
            in: 'query',
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            style: 'form',
            explode: true,
            description: 'Filter by repository domains via canonical matchingName (comma-separated)',
          },
          {
            name: 'frameworkIds',
            in: 'query',
            schema: {
              type: 'array',
              items: {
                type: 'integer',
              },
            },
            style: 'form',
            explode: true,
            description: 'Filter by repository frameworks via canonical IDs (comma-separated)',
          },
          {
            name: 'frameworkMatchingNames',
            in: 'query',
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            style: 'form',
            explode: true,
            description: 'Filter by repository frameworks via canonical matchingName (comma-separated)',
          },
          {
            name: 'languageIds',
            in: 'query',
            schema: {
              type: 'array',
              items: {
                type: 'integer',
              },
            },
            style: 'form',
            explode: true,
            description: 'Filter by languages via canonical IDs (comma-separated)',
          },
          {
            name: 'languageMatchingNames',
            in: 'query',
            schema: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            style: 'form',
            explode: true,
            description: 'Filter by languages via canonical matchingName (comma-separated)',
          },
          {
            name: 'includeUnclassified',
            in: 'query',
            schema: {
              type: 'boolean',
              default: true,
            },
            description: 'Include unclassified issues from repositories that allow them. When false, only returns issues with difficulty ratings.',
          },
          {
            name: 'limit',
            in: 'query',
            schema: {
              type: 'integer',
              default: 20,
              minimum: 1,
              maximum: 100,
            },
            description: 'Number of results to return',
          },
          {
            name: 'offset',
            in: 'query',
            schema: {
              type: 'integer',
              default: 0,
              minimum: 0,
            },
            description: 'Number of results to skip for pagination',
          },
        ],
        responses: {
          '200': {
            description: 'List of discoverable issues ranked by relevance',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/DiscoveryResult',
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid filter parameters',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },

    '/meta/languages': {
      get: {
        tags: ['Meta'],
        summary: 'List canonical languages',
        operationId: 'listLanguages',
        responses: {
          '200': {
            description: 'Canonical languages',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CanonicalLanguage' },
                },
              },
            },
          },
        },
      },
    },

    '/meta/frameworks': {
      get: {
        tags: ['Meta'],
        summary: 'List canonical frameworks grouped by category',
        operationId: 'listFrameworks',
        responses: {
          '200': {
            description: 'Canonical frameworks',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CanonicalFramework' },
                },
              },
            },
          },
        },
      },
    },

    '/meta/domains': {
      get: {
        tags: ['Meta'],
        summary: 'List canonical domains',
        operationId: 'listDomains',
        responses: {
          '200': {
            description: 'Canonical domains',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/CanonicalDomain' },
                },
              },
            },
          },
        },
      },
    },

    '/public/repositories/{id}': {
      get: {
        tags: ['Repositories'],
        summary: 'Get public repository details',
        operationId: 'getRepositoryDetail',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'GitHub repository ID',
          },
        ],
        responses: {
          '200': {
            description: 'Repository details',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Repository',
                },
              },
            },
          },
          '404': {
            description: 'Repository not found or not public',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },

    '/public/repositories/{id}/issues': {
      get: {
        tags: ['Issues'],
        summary: 'Get public issues for a repository',
        operationId: 'getRepositoryIssues',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'GitHub repository ID',
          },
          {
            name: 'limit',
            in: 'query',
            schema: {
              type: 'integer',
              default: 50,
              minimum: 1,
            },
            description: 'Number of issues to return',
          },
          {
            name: 'offset',
            in: 'query',
            schema: {
              type: 'integer',
              default: 0,
              minimum: 0,
            },
            description: 'Number of issues to skip',
          },
        ],
        responses: {
          '200': {
            description: 'List of visible (non-hidden) issues',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/Issue',
                  },
                },
              },
            },
          },
          '404': {
            description: 'Repository not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },

    '/public/repositories/{id}/stats': {
      get: {
        tags: ['Statistics'],
        summary: 'Get repository statistics',
        operationId: 'getRepositoryStats',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'GitHub repository ID',
          },
        ],
        responses: {
          '200': {
            description: 'Repository statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
          '404': {
            description: 'Repository not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },

    '/public/users/{username}': {
      get: {
        tags: ['User Profile'],
        summary: 'Get public user profile',
        operationId: 'getPublicUserProfile',
        parameters: [
          {
            name: 'username',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
            description: 'GitHub username of the profile to fetch',
          },
        ],
        responses: {
          '200': {
            description: 'Public profile data',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Profile',
                },
              },
            },
          },
          '404': {
            description: 'User not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },

    // SETUP ROUTES (PUBLIC, NO AUTH)
    '/setup/context': {
      get: {
        tags: ['Setup'],
        summary: 'Get setup context for first-time installation',
        operationId: 'setupContext',
        description:
          'Returns setup context including repositories and setup expiration time. Validates installation with GitHub. No authentication required.',
        parameters: [
          {
            name: 'installation_id',
            in: 'query',
            required: true,
            schema: {
              type: 'number',
            },
            description: 'GitHub App installation ID',
          },
        ],
        responses: {
          '200': {
            description: 'Setup context returned successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    accountLogin: {
                      type: 'string',
                      description: 'GitHub account login (user or org)',
                    },
                    repositories: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: {
                            type: 'number',
                          },
                          owner: {
                            type: 'string',
                          },
                          name: {
                            type: 'string',
                          },
                          state: {
                            type: 'string',
                            enum: ['off', 'public', 'paused'],
                          },
                        },
                      },
                      description: 'List of repositories to configure',
                    },
                    setupExpiresAt: {
                      type: 'string',
                      format: 'date-time',
                      description: 'ISO timestamp when setup window expires',
                    },
                  },
                  required: ['accountLogin', 'repositories', 'setupExpiresAt'],
                },
              },
            },
          },
          '400': {
            description: 'Invalid input (missing or non-numeric installation_id)',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '403': {
            description: 'Installation is invalid or has been revoked',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '404': {
            description: 'Installation not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '409': {
            description: 'Setup has already been completed for this installation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '410': {
            description: 'Setup window has expired',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '502': {
            description: 'GitHub API is unavailable',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },

    '/setup/complete': {
      post: {
        tags: ['Setup'],
        summary: 'Complete first-time installation setup',
        operationId: 'setupComplete',
        description:
          'Completes the setup process by validating the installation with GitHub and updating repository configurations. No authentication required.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  installation_id: {
                    type: 'number',
                    description: 'GitHub App installation ID',
                  },
                  repositories: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        repoId: {
                          type: 'number',
                          description: 'Internal repository ID',
                        },
                        state: {
                          type: 'string',
                          enum: ['off', 'public', 'paused'],
                          description: 'Repository state after setup',
                        },
                      },
                      required: ['repoId', 'state'],
                    },
                    description: 'Repositories to configure with their desired states',
                  },
                  settings: {
                    type: 'object',
                    properties: {
                      allowUnclassified: {
                        type: 'boolean',
                        description: 'Allow unclassified issues',
                      },
                      allowClassification: {
                        type: 'boolean',
                        description: 'Allow AI issue classification',
                      },
                      allowInference: {
                        type: 'boolean',
                        description: 'Allow AI inference on issues',
                      },
                      feedbackEnabled: {
                        type: 'boolean',
                        description: 'Enable feedback collection',
                      },
                    },
                    required: ['allowUnclassified', 'allowClassification', 'allowInference', 'feedbackEnabled'],
                    description: 'Repository settings to apply',
                  },
                },
                required: ['installation_id', 'repositories', 'settings'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Setup completed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request body or parameters',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '403': {
            description: 'Installation is invalid or has been revoked',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '404': {
            description: 'Installation not found',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '409': {
            description: 'Setup has already been completed for this installation',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '410': {
            description: 'Setup window has expired',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '502': {
            description: 'GitHub API is unavailable',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },

    // AUTH ROUTES
    '/auth/github/login': {
      get: {
        tags: ['Authentication'],
        summary: 'Initiate GitHub OAuth login',
        operationId: 'githubLogin',
        description: 'Redirects to GitHub OAuth authorization',
        responses: {
          '302': {
            description: 'Redirect to GitHub OAuth',
          },
        },
      },
    },

    '/auth/github/callback': {
      get: {
        tags: ['Authentication'],
        summary: 'GitHub OAuth callback',
        operationId: 'githubCallback',
        description: 'Handles GitHub OAuth callback and creates session',
        parameters: [
          {
            name: 'code',
            in: 'query',
            required: true,
            schema: {
              type: 'string',
            },
            description: 'GitHub authorization code',
          },
        ],
        responses: {
          '302': {
            description: 'Redirect after successful authentication',
          },
          '400': {
            description: 'Missing authorization code',
          },
          '500': {
            description: 'Authentication failed',
          },
        },
      },
    },

    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Get current authenticated user',
        operationId: 'getCurrentUser',
        description: 'Returns the currently authenticated user information',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Current user information',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    githubId: {
                      type: 'number',
                      description: 'GitHub user ID',
                    },
                    username: {
                      type: 'string',
                      description: 'GitHub username',
                    },
                  },
                  required: ['githubId', 'username'],
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - authentication required or invalid/expired session',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/auth/logout': {
      post: {
        tags: ['Authentication'],
        summary: 'Logout user',
        operationId: 'logout',
        responses: {
          '200': {
            description: 'Successfully logged out',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    // USER ROUTES (REQUIRE AUTH)
    '/user/profile': {
      post: {
        tags: ['User Profile'],
        summary: 'Update user profile',
        operationId: 'updateProfile',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  avatarUrl: {
                    type: 'string',
                    nullable: true,
                  },
                  bio: {
                    type: 'string',
                    nullable: true,
                  },
                  links: {
                    type: 'object',
                    nullable: true,
                    additionalProperties: true,
                    description: 'Optional external links or profile metadata',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Profile updated successfully',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Profile',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - invalid or missing session token',
          },
          '500': {
            description: 'Failed to update profile',
          },
        },
      },
    },

    '/user/repositories/{id}/settings': {
      post: {
        tags: ['User Repositories'],
        summary: 'Update repository settings',
        operationId: 'updateRepositorySettings',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'Repository ID',
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  state: {
                    type: 'string',
                    enum: ['off', 'public', 'paused'],
                    description: 'Repository visibility state',
                  },
                  allowUnclassified: {
                    type: 'boolean',
                    description: 'Allow unclassified issues in discovery',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Settings updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Repository not found',
          },
        },
      },
    },

    '/user/repositories/{id}/logs': {
      get: {
        tags: ['User Repositories'],
        summary: 'Get repository activity logs',
        operationId: 'getRepositoryLogs',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: {
              type: 'integer',
            },
            description: 'Repository ID',
          },
          {
            name: 'limit',
            in: 'query',
            schema: {
              type: 'integer',
              default: 50,
              minimum: 1,
            },
          },
          {
            name: 'offset',
            in: 'query',
            schema: {
              type: 'integer',
              default: 0,
              minimum: 0,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Activity logs',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/LogEntry',
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },

    // BOT ROUTES (REQUIRE API KEY)
    '/bot/installations/sync': {
      post: {
        tags: ['Bot - Installations'],
        summary: 'Sync GitHub App installation with repositories',
        operationId: 'syncInstallation',
        description:
          'Syncs the GitHub App installation and repositories from a webhook. Sets up a 30-minute setup window for first-time configuration. Requires bot API key authentication.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  installation: {
                    type: 'object',
                    properties: {
                      githubInstallationId: {
                        type: 'number',
                        description: 'GitHub App installation ID',
                      },
                      accountType: {
                        type: 'string',
                        enum: ['user', 'org'],
                        description: 'Type of account installing the app',
                      },
                      accountLogin: {
                        type: 'string',
                        description: 'Username or organization name',
                      },
                      setupCompleted: {
                        type: 'boolean',
                        description: 'Optional - whether initial setup has completed',
                      },
                    },
                    required: ['githubInstallationId', 'accountType', 'accountLogin'],
                  },
                  repositories: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        githubRepoId: {
                          type: 'number',
                        },
                        owner: {
                          type: 'string',
                        },
                        name: {
                          type: 'string',
                        },
                        state: {
                          type: 'string',
                          enum: ['off', 'public', 'paused'],
                        },
                      },
                      required: ['githubRepoId', 'owner', 'name'],
                    },
                    description: 'Optional - list of repositories in the installation',
                  },
                },
                required: ['installation'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Installation and repositories synced successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    id: {
                      type: 'number',
                    },
                    githubInstallationId: {
                      type: 'number',
                    },
                    accountType: {
                      type: 'string',
                    },
                    accountLogin: {
                      type: 'string',
                    },
                    setupCompleted: {
                      type: 'boolean',
                    },
                    setupAllowedUntil: {
                      type: 'string',
                      format: 'date-time',
                      description: 'Expiration time of the 30-minute setup window',
                    },
                    createdAt: {
                      type: 'string',
                      format: 'date-time',
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized - invalid or missing API key',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
          '500': {
            description: 'Failed to sync installation or repositories',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/Error',
                },
              },
            },
          },
        },
      },
    },

    '/bot/issues/classify': {
      post: {
        tags: ['Bot - Issues'],
        summary: 'Classify GitHub issue',
        operationId: 'classifyIssue',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  githubRepoId: {
                    type: 'number',
                    description: 'GitHub repository ID',
                  },
                  githubIssueId: {
                    type: 'number',
                    description: 'GitHub issue number',
                  },
                  difficulty: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 5,
                    nullable: true,
                    description: 'Issue difficulty rating (1-5)',
                  },
                  issueType: {
                    type: 'string',
                    enum: ['docs', 'bug', 'feature', 'refactor', 'test', 'infra'],
                    nullable: true,
                    description: 'Issue type classification',
                  },
                  hidden: {
                    type: 'boolean',
                    description: 'Whether the issue should be hidden from discovery',
                  },
                  actor: {
                    type: 'object',
                    description: 'User who performed the classification',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['user'],
                      },
                      githubId: {
                        type: 'number',
                      },
                      username: {
                        type: 'string',
                      },
                    },
                    required: ['type', 'githubId', 'username'],
                  },
                },
                required: ['githubRepoId', 'githubIssueId', 'actor'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Issue classified',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },

    '/bot/issues': {
      delete: {
        tags: ['Bot - Issues'],
        summary: 'Delete GitHub issue',
        operationId: 'deleteIssue',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  githubRepoId: {
                    type: 'number',
                    description: 'GitHub repository ID',
                  },
                  githubIssueId: {
                    type: 'number',
                    description: 'GitHub issue ID to delete',
                  },
                  actor: {
                    type: 'object',
                    description: 'Actor performing the deletion',
                    oneOf: [
                      {
                        type: 'object',
                        properties: {
                          type: {
                            type: 'string',
                            enum: ['bot'],
                          },
                        },
                        required: ['type'],
                      },
                      {
                        type: 'object',
                        properties: {
                          type: {
                            type: 'string',
                            enum: ['user'],
                          },
                          githubId: {
                            type: 'number',
                          },
                          username: {
                            type: 'string',
                          },
                        },
                        required: ['type', 'githubId', 'username'],
                      },
                    ],
                  },
                },
                required: ['githubRepoId', 'githubIssueId', 'actor'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Issue deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                    },
                    deletedIssueId: {
                      type: 'number',
                      description: 'ID of the deleted issue',
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Issue or repository not found',
          },
          '500': {
            description: 'Server error',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      type: 'string',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },

    '/bot/repositories/add': {
      post: {
        tags: ['Bot - Repositories'],
        summary: 'Add repository to installation',
        operationId: 'addRepository',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  installationId: {
                    type: 'number',
                    description: 'Reposignal installation ID',
                  },
                  githubRepoId: {
                    type: 'number',
                    description: 'GitHub repository ID',
                  },
                  owner: {
                    type: 'string',
                    description: 'Repository owner (user or org)',
                  },
                  name: {
                    type: 'string',
                    description: 'Repository name',
                  },
                  reposignalDescription: {
                    type: 'string',
                    description: 'Custom repository description for Reposignal',
                  },
                  state: {
                    type: 'string',
                    enum: ['off', 'public', 'paused'],
                    default: 'off',
                    description: 'Repository state',
                  },
                  starsCount: {
                    type: 'number',
                    default: 0,
                  },
                  forksCount: {
                    type: 'number',
                    default: 0,
                  },
                  openIssuesCount: {
                    type: 'number',
                    default: 0,
                  },
                },
                required: ['installationId', 'githubRepoId', 'owner', 'name'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Repository added or already exists',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                    },
                    error: {
                      type: 'string',
                      nullable: true,
                    },
                    repository: {
                      $ref: '#/components/schemas/Repository',
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },

    '/bot/repositories/{id}/settings': {
      post: {
        tags: ['Bot - Repositories'],
        summary: 'Update repository settings',
        operationId: 'updateRepositorySettingsBot',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'Repository ID',
            schema: {
              type: 'integer',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  reposignalDescription: {
                    type: 'string',
                    nullable: true,
                    description: 'Custom repository description for Reposignal',
                  },
                  state: {
                    type: 'string',
                    enum: ['off', 'public', 'paused'],
                    description: 'Repository visibility state',
                  },
                  allowUnclassified: {
                    type: 'boolean',
                    description: 'Allow issues without difficulty/type classification',
                  },
                  allowClassification: {
                    type: 'boolean',
                    description: 'Allow bot to classify issues',
                  },
                  allowInference: {
                    type: 'boolean',
                    description: 'Allow bot to infer frameworks',
                  },
                  feedbackEnabled: {
                    type: 'boolean',
                    description: 'Enable contributor feedback collection',
                  },
                  actor: {
                    type: 'object',
                    description: 'Optional actor information for audit logging',
                    properties: {
                      githubId: {
                        type: 'number',
                      },
                      username: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Settings updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Repository not found',
          },
          '500': {
            description: 'Failed to update settings',
          },
        },
      },
    },

    '/bot/repositories/metadata': {
      post: {
        tags: ['Bot - Repositories'],
        summary: 'Update repository metadata (bulk)',
        operationId: 'updateRepositoryMetadata',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  githubRepoId: {
                    type: 'number',
                  },
                  languages: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        matchingName: {
                          type: 'string',
                          description: 'Canonical matchingName from /meta/languages',
                        },
                        bytes: {
                          type: 'number',
                        },
                      },
                    },
                  },
                  frameworks: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        matchingName: {
                          type: 'string',
                          description: 'Canonical matchingName from /meta/frameworks',
                        },
                        source: {
                          type: 'string',
                          enum: ['inferred', 'maintainer'],
                        },
                      },
                    },
                  },
                  domains: {
                    type: 'array',
                    items: {
                      type: 'string',
                      description: 'Canonical matchingName from /meta/domains',
                    },
                  },
                  tags: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                  starsCount: {
                    type: 'number',
                  },
                  forksCount: {
                    type: 'number',
                  },
                  openIssuesCount: {
                    type: 'number',
                  },
                  actor: {
                    type: 'object',
                    description: 'Actor performing the metadata update',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['system', 'bot', 'user'],
                      },
                      githubId: {
                        type: 'number',
                        nullable: true,
                      },
                      username: {
                        type: 'string',
                        nullable: true,
                      },
                    },
                    required: ['type'],
                  },
                },
                required: ['githubRepoId', 'actor'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Metadata updated',
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },

    '/bot/repositories/domains/add': {
      post: {
        tags: ['Bot - Repositories'],
        summary: 'Add domains to repository (max 2)',
        operationId: 'addDomains',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  githubRepoId: {
                    type: 'number',
                  },
                  owner: {
                    type: 'string',
                  },
                  name: {
                    type: 'string',
                  },
                  domains: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                  actor: {
                    type: 'object',
                    description: 'Actor performing the action',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['user', 'system', 'bot'],
                      },
                      githubId: {
                        type: 'number',
                        nullable: true,
                      },
                      username: {
                        type: 'string',
                        nullable: true,
                      },
                    },
                    required: ['type'],
                  },
                },
                required: ['githubRepoId', 'owner', 'name', 'domains', 'actor'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Domains added',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: {
                      type: 'boolean',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Invalid request or limit exceeded',
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },

    '/bot/repositories/domains': {
      delete: {
        tags: ['Bot - Repositories'],
        summary: 'Delete domain from repository',
        operationId: 'deleteDomain',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  githubRepoId: {
                    type: 'number',
                  },
                  owner: {
                    type: 'string',
                  },
                  name: {
                    type: 'string',
                  },
                  domain: {
                    type: 'string',
                  },
                  actor: {
                    type: 'object',
                    description: 'Actor performing the action',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['user', 'system', 'bot'],
                      },
                      githubId: {
                        type: 'number',
                        nullable: true,
                      },
                      username: {
                        type: 'string',
                        nullable: true,
                      },
                    },
                    required: ['type'],
                  },
                },
                required: ['githubRepoId', 'owner', 'name', 'domain', 'actor'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Domain deleted',
          },
          '400': {
            description: 'Invalid request',
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },

    '/bot/repositories/tags/add': {
      post: {
        tags: ['Bot - Repositories'],
        summary: 'Add tags to repository (max 5)',
        operationId: 'addTags',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  githubRepoId: {
                    type: 'number',
                  },
                  owner: {
                    type: 'string',
                  },
                  name: {
                    type: 'string',
                  },
                  tags: {
                    type: 'array',
                    items: {
                      type: 'string',
                    },
                  },
                  actor: {
                    type: 'object',
                    description: 'Actor performing the action',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['user', 'system', 'bot'],
                      },
                      githubId: {
                        type: 'number',
                        nullable: true,
                      },
                      username: {
                        type: 'string',
                        nullable: true,
                      },
                    },
                    required: ['type'],
                  },
                },
                required: ['githubRepoId', 'owner', 'name', 'tags', 'actor'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Tags added',
          },
          '400': {
            description: 'Invalid request or limit exceeded',
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },

    '/bot/repositories/tags': {
      delete: {
        tags: ['Bot - Repositories'],
        summary: 'Delete tag from repository',
        operationId: 'deleteTag',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  githubRepoId: {
                    type: 'number',
                  },
                  owner: {
                    type: 'string',
                  },
                  name: {
                    type: 'string',
                  },
                  tag: {
                    type: 'string',
                  },
                  actor: {
                    type: 'object',
                    description: 'Actor performing the action',
                    properties: {
                      type: {
                        type: 'string',
                        enum: ['user', 'system', 'bot'],
                      },
                      githubId: {
                        type: 'number',
                        nullable: true,
                      },
                      username: {
                        type: 'string',
                        nullable: true,
                      },
                    },
                    required: ['type'],
                  },
                },
                required: ['githubRepoId', 'owner', 'name', 'tag', 'actor'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Tag deleted',
          },
          '400': {
            description: 'Invalid request',
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },

    '/bot/feedback': {
      post: {
        tags: ['Bot - Feedback'],
        summary: 'Submit feedback on issue',
        operationId: 'submitFeedback',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  githubPrId: {
                    type: 'number',
                  },
                  githubRepoId: {
                    type: 'number',
                  },
                  difficultyRating: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 5,
                    nullable: true,
                  },
                  responsivenessRating: {
                    type: 'integer',
                    minimum: 1,
                    maximum: 5,
                    nullable: true,
                  },
                },
                required: ['githubPrId', 'githubRepoId'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Feedback submitted',
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },

    '/bot/logs': {
      post: {
        tags: ['Bot - Logs'],
        summary: 'Write activity log',
        operationId: 'writeLog',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  action: {
                    type: 'string',
                  },
                  entityType: {
                    type: 'string',
                  },
                  entityId: {
                    type: 'string',
                  },
                  context: {
                    type: 'object',
                    nullable: true,
                  },
                },
                required: ['action', 'entityType', 'entityId'],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Log written',
          },
          '401': {
            description: 'Unauthorized',
          },
        },
      },
    },
  },
};

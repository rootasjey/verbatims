export default defineEventHandler(() => {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'Verbatims API',
      version: '0.149.0',
      description: `Public API for browsing and managing quotes, authors, references, and collections.

Authentication: most endpoints require an API key via \`Authorization: Bearer vbt_xxx\` header.

Permissions: each API key has a set of permissions (\`read\`, \`write:quotes\`, \`write:authors\`, \`write:references\`, \`write:collections\`, or \`*\` for all). Write operations on authors and references require the key owner to be a moderator or admin.`,
      contact: { url: 'https://verbat.im' },
    },
    servers: [
      { url: '/api/v1', description: 'Verbatims API v1' },
    ],
    paths: {
      '/health': {
        get: {
          summary: 'Health check',
          description: 'Public endpoint to verify API availability and database connectivity.',
          tags: ['System'],
          responses: {
            '200': {
              description: 'API is healthy',
              content: {
                'application/json': {
                  example: { success: true, data: { status: 'healthy', database: 'ok', response_time_ms: 12, timestamp: '2025-01-01T00:00:00Z' } },
                },
              },
            },
          },
        },
      },
      '/me': {
        get: {
          summary: 'Current API key info',
          description: 'Returns details about the authenticated API key.',
          tags: ['System'],
          security: [{ apiKey: [] }],
          responses: {
            '200': {
              description: 'API key details',
              content: {
                'application/json': {
                  example: { success: true, data: { key_id: 1, name: 'My Key', key_prefix: 'vbt_a1b2c3', permissions: ['read', 'write:quotes'], read_rate_limit: 1000, read_window: 3600, write_rate_limit: 1000, write_window: 3600, user_role: 'user' } },
                },
              },
            },
          },
        },
      },
      '/quotes': {
        get: {
          summary: 'List approved quotes',
          description: 'Paginated list of approved quotes with optional filtering.',
          tags: ['Quotes'],
          security: [{ apiKey: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1, minimum: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
            { name: 'language', in: 'query', schema: { type: 'string', enum: ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la', 'ar', 'ko'] }, description: 'Filter by language code' },
            { name: 'author_id', in: 'query', schema: { type: 'integer' }, description: 'Filter by author ID' },
            { name: 'reference_id', in: 'query', schema: { type: 'integer' }, description: 'Filter by reference ID' },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search quote content' },
            { name: 'tag', in: 'query', schema: { type: 'string' }, description: 'Filter by tag name' },
            { name: 'sort_by', in: 'query', schema: { type: 'string', enum: ['created_at', 'updated_at', 'views_count', 'likes_count', 'shares_count', 'name'], default: 'created_at' } },
            { name: 'sort_order', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'], default: 'desc' } },
          ],
          responses: {
            '200': {
              description: 'Paginated list of quotes',
              content: { 'application/json': { example: { success: true, data: [{ id: 1, content: '...', language: 'en', stats: { views: 42, likes: 7, shares: 3 }, featured: false, author: { id: 1, name: 'Author', fictional: false, image_url: null, description: null }, reference: null, tags: [], created_at: '...', updated_at: '...' }], pagination: { page: 1, limit: 20, total: 100, totalPages: 5, hasMore: true } } } },
            },
          },
        },
        post: {
          summary: 'Create a quote',
          description: 'Creates a new quote in draft status. The quote will be associated with the API key owner and requires moderation before being publicly visible.',
          tags: ['Quotes'],
          security: [{ apiKey: ['write:quotes'] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 4000, description: 'Quote content' },
                    language: { type: 'string', enum: ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la', 'ar', 'ko'], default: 'en' },
                    author_id: { type: 'integer', nullable: true, description: 'ID of an existing author' },
                    reference_id: { type: 'integer', nullable: true, description: 'ID of an existing reference' },
                    new_author: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', minLength: 1, maxLength: 200 },
                        is_fictional: { type: 'boolean', default: false },
                        job: { type: 'string', nullable: true },
                        description: { type: 'string', nullable: true },
                      },
                      description: 'Create a new author inline',
                    },
                    new_reference: {
                      type: 'object',
                      properties: {
                        name: { type: 'string', minLength: 1, maxLength: 200 },
                        primary_type: { type: 'string', default: 'other' },
                        original_language: { type: 'string', default: 'en' },
                        description: { type: 'string', nullable: true },
                        release_date: { type: 'string', nullable: true },
                      },
                      description: 'Create a new reference inline',
                    },
                    tags: { type: 'array', items: { type: 'number' }, maxItems: 20, description: 'Tag IDs to associate' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Quote created' },
            '400': { description: 'Validation error or invalid author/reference ID' },
            '409': { description: 'Similar quote already exists' },
          },
        },
      },
      '/quotes/{id}': {
        get: {
          summary: 'Get a single quote',
          tags: ['Quotes'],
          security: [{ apiKey: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: {
            '200': { description: 'Quote details with author, reference, and tags' },
            '404': { description: 'Quote not found' },
          },
        },
        put: {
          summary: 'Update a quote',
          description: 'Updates a quote. Users can only update their own quotes; moderators and admins can update any quote.',
          tags: ['Quotes'],
          security: [{ apiKey: ['write:quotes'] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 3000 },
                    language: { type: 'string', enum: ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la', 'ar', 'ko'] },
                    author_id: { type: 'integer', nullable: true },
                    reference_id: { type: 'integer', nullable: true },
                    new_author: { type: 'object', properties: { name: { type: 'string' }, is_fictional: { type: 'boolean' } } },
                    new_reference: { type: 'object', properties: { name: { type: 'string' }, primary_type: { type: 'string' }, original_language: { type: 'string' } } },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Quote updated' },
            '403': { description: 'Not authorized to update this quote' },
            '404': { description: 'Quote not found' },
          },
        },
        delete: {
          summary: 'Delete a quote',
          description: 'Deletes a quote. Users can only delete their own quotes; moderators and admins can delete any quote.',
          tags: ['Quotes'],
          security: [{ apiKey: ['write:quotes'] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: {
            '200': { description: 'Quote deleted' },
            '403': { description: 'Not authorized to delete this quote' },
            '404': { description: 'Quote not found' },
          },
        },
      },
      '/quotes/random': {
        get: {
          summary: 'Get random quotes',
          description: 'Returns random approved quotes. Useful for discovery features.',
          tags: ['Quotes'],
          security: [{ apiKey: [] }],
          parameters: [
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 1, maximum: 10 } },
          ],
          responses: { '200': { description: 'Array of random quotes' } },
        },
      },
      '/quotes/search': {
        get: {
          summary: 'Search quotes, authors, and references',
          description: 'Full-text search across multiple entity types.',
          tags: ['Search'],
          security: [{ apiKey: [] }],
          parameters: [
            { name: 'q', in: 'query', required: true, schema: { type: 'string', minLength: 2 }, description: 'Search query (min 2 characters)' },
            { name: 'type', in: 'query', schema: { type: 'string', enum: ['quotes', 'authors', 'references'], default: 'quotes' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
          ],
          responses: { '200': { description: 'Search results with pagination' } },
        },
      },
      '/authors': {
        get: {
          summary: 'List authors',
          description: 'Paginated list of authors with optional search.',
          tags: ['Authors'],
          security: [{ apiKey: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name' },
          ],
          responses: { '200': { description: 'Paginated list of authors' } },
        },
        post: {
          summary: 'Create an author',
          description: 'Creates a new author. Requires moderator or admin role.',
          tags: ['Authors'],
          security: [{ apiKey: ['write:authors'] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 200 },
                    is_fictional: { type: 'boolean', default: false },
                    job: { type: 'string', nullable: true },
                    description: { type: 'string', nullable: true },
                    birth_date: { type: 'string', nullable: true },
                    birth_location: { type: 'string', nullable: true },
                    death_date: { type: 'string', nullable: true },
                    death_location: { type: 'string', nullable: true },
                    image_url: { type: 'string', nullable: true, description: 'URL or /blob/ path' },
                    socials: { type: 'object', additionalProperties: { type: 'string' }, nullable: true, description: 'Social media links' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Author created' },
            '403': { description: 'Insufficient role (requires moderator or admin)' },
            '409': { description: 'Author with this name already exists' },
          },
        },
      },
      '/authors/{id}': {
        get: {
          summary: 'Get a single author',
          tags: ['Authors'],
          security: [{ apiKey: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: {
            '200': { description: 'Author details' },
            '404': { description: 'Author not found' },
          },
        },
        put: {
          summary: 'Update an author',
          description: 'Updates an existing author. Requires moderator or admin role.',
          tags: ['Authors'],
          security: [{ apiKey: ['write:authors'] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 200 },
                    is_fictional: { type: 'boolean' },
                    job: { type: 'string', nullable: true },
                    description: { type: 'string', nullable: true },
                    birth_date: { type: 'string', nullable: true },
                    birth_location: { type: 'string', nullable: true },
                    death_date: { type: 'string', nullable: true },
                    death_location: { type: 'string', nullable: true },
                    image_url: { type: 'string', nullable: true },
                    socials: { type: 'object', additionalProperties: { type: 'string' }, nullable: true },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Author updated' },
            '403': { description: 'Insufficient role' },
            '404': { description: 'Author not found' },
            '409': { description: 'Name conflict' },
          },
        },
      },
      '/references': {
        get: {
          summary: 'List references',
          description: 'Paginated list of references with optional filtering.',
          tags: ['References'],
          security: [{ apiKey: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
            { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Search by name' },
            { name: 'type', in: 'query', schema: { type: 'string' }, description: 'Filter by primary type' },
          ],
          responses: { '200': { description: 'Paginated list of references' } },
        },
        post: {
          summary: 'Create a reference',
          description: 'Creates a new reference. Requires moderator or admin role.',
          tags: ['References'],
          security: [{ apiKey: ['write:references'] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'primary_type'],
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 200 },
                    primary_type: { type: 'string', minLength: 1, maxLength: 100, description: 'Type of reference (e.g. film, book, game)' },
                    secondary_type: { type: 'string', nullable: true },
                    description: { type: 'string', nullable: true },
                    release_date: { type: 'string', nullable: true },
                    original_language: { type: 'string', nullable: true },
                    image_url: { type: 'string', nullable: true },
                    urls: { type: 'object', additionalProperties: true, nullable: true, description: 'External URLs' },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Reference created' },
            '403': { description: 'Insufficient role' },
            '409': { description: 'Reference with this name already exists' },
          },
        },
      },
      '/references/{id}': {
        get: {
          summary: 'Get a single reference',
          tags: ['References'],
          security: [{ apiKey: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          responses: {
            '200': { description: 'Reference details' },
            '404': { description: 'Reference not found' },
          },
        },
        put: {
          summary: 'Update a reference',
          description: 'Updates an existing reference. Requires moderator or admin role.',
          tags: ['References'],
          security: [{ apiKey: ['write:references'] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 200 },
                    primary_type: { type: 'string' },
                    secondary_type: { type: 'string', nullable: true },
                    description: { type: 'string', nullable: true },
                    release_date: { type: 'string', nullable: true },
                    original_language: { type: 'string', nullable: true },
                    image_url: { type: 'string', nullable: true },
                    urls: { type: 'object', additionalProperties: true, nullable: true },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Reference updated' },
            '403': { description: 'Insufficient role' },
            '404': { description: 'Reference not found' },
            '409': { description: 'Name conflict' },
          },
        },
      },
      '/tags': {
        get: {
          summary: 'List tags',
          description: 'Paginated list of tags with usage counts.',
          tags: ['Tags'],
          security: [{ apiKey: [] }],
          parameters: [
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 50, maximum: 100 } },
          ],
          responses: { '200': { description: 'Paginated list of tags' } },
        },
      },
      '/collections': {
        post: {
          summary: 'Create a collection',
          description: 'Creates a new quote collection for the authenticated user.',
          tags: ['Collections'],
          security: [{ apiKey: ['write:collections'] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name'],
                  properties: {
                    name: { type: 'string', minLength: 2, maxLength: 100 },
                    description: { type: 'string', nullable: true },
                    is_public: { type: 'boolean', default: true },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Collection created' },
            '409': { description: 'Collection name already exists for this user' },
          },
        },
      },
      '/collections/{id}/quotes': {
        post: {
          summary: 'Add a quote to a collection',
          description: 'Adds an approved quote to a collection. User must own the collection.',
          tags: ['Collections'],
          security: [{ apiKey: ['write:collections'] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Collection ID' },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['quote_id'],
                  properties: {
                    quote_id: { type: 'integer', description: 'ID of the approved quote to add' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Quote added to collection' },
            '403': { description: 'Access denied' },
            '404': { description: 'Collection or quote not found' },
            '409': { description: 'Quote already in collection' },
          },
        },
      },
      '/collections/{id}/quotes/{quoteId}': {
        delete: {
          summary: 'Remove a quote from a collection',
          description: 'Removes a quote from a collection. User must own the collection.',
          tags: ['Collections'],
          security: [{ apiKey: ['write:collections'] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'Collection ID' },
            { name: 'quoteId', in: 'path', required: true, schema: { type: 'integer' }, description: 'Quote ID' },
          ],
          responses: {
            '200': { description: 'Quote removed from collection' },
            '403': { description: 'Access denied' },
            '404': { description: 'Collection or quote not found in collection' },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        apiKey: {
          type: 'http',
          scheme: 'bearer',
          description: 'API key with `vbt_` prefix. Create one from your dashboard.',
        },
      },
    },
    tags: [
      { name: 'System', description: 'System and health endpoints' },
      { name: 'Quotes', description: 'Quote CRUD and discovery' },
      { name: 'Authors', description: 'Author management' },
      { name: 'References', description: 'Reference management' },
      { name: 'Tags', description: 'Tag listing' },
      { name: 'Collections', description: 'Collection management' },
      { name: 'Search', description: 'Full-text search' },
    ],
  }

  return spec
})

<template>
  <div class="min-h-screen">
    <header class="mt-10 md:mt-6 p-8">
      <h1 class="font-title text-5xl md:text-6xl lg:text-7xl font-600 text-center line-height-none uppercase">
        Developers
      </h1>
      <p class="italic font-body text-md md:text-base text-center text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
        Integrate Verbatims quotes into your applications with the public API.
      </p>
    </header>

    <div class="mt-8 max-w-4xl mx-auto px-8 pb-16 space-y-16">
      <!-- Overview -->
      <section>
        <h2 class="font-serif text-2xl font-200 text-gray-900 dark:text-gray-100 mb-4">Overview</h2>
        <p class="font-body text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          The Verbatims API provides programmatic access to our curated collection of quotes, authors, and references.
          All responses are in JSON format and follow a consistent structure.
        </p>
        <p class="font-body text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-2">
          Base URL: <code class="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-sm">{{ siteUrl }}</code>
        </p>
      </section>

      <!-- Authentication -->
      <section>
        <h2 class="font-serif text-2xl font-200 text-gray-900 dark:text-gray-100 mb-4">Authentication</h2>
        <p class="font-body text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
          All API requests require an API key sent via the <code class="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-sm">Authorization</code> header.
          You can manage your keys from your <NuxtLink to="/dashboard/developer" class="underline underline-offset-2 decoration-gray-300 dark:decoration-gray-600 hover:decoration-gray-500">developer dashboard</NuxtLink>.
        </p>

        <div class="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 p-4 rounded-sm">
          <div class="font-mono text-xs text-gray-700 dark:text-gray-300 space-y-1.5">
            <p><span class="text-gray-400"># Replace with your actual key</span></p>
            <p>curl {{ siteUrl }}/api/v1/me \<br />
            &nbsp;&nbsp;-H "Authorization: Bearer vbt_your_api_key_here"</p>
          </div>
        </div>
      </section>

      <!-- Rate Limiting -->
      <section>
        <h2 class="font-serif text-2xl font-200 text-gray-900 dark:text-gray-100 mb-4">Rate Limiting</h2>
        <p class="font-body text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Rate limits depend on your API key's tier. Response headers include your remaining quota:
        </p>
        <div class="mt-3 font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 p-3 rounded-sm">
          <p>X-RateLimit-Remaining: <span class="text-gray-700 dark:text-gray-300">987</span></p>
          <p>X-RateLimit-Reset: <span class="text-gray-700 dark:text-gray-300">1696000000</span></p>
        </div>
        <div class="mt-4 space-y-2">
          <div class="flex items-center gap-3 text-sm">
            <span class="font-sans text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400">free</span>
            <span class="font-body text-xs text-gray-500 dark:text-gray-400">1,000 requests per hour</span>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <span class="font-sans text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">pro</span>
            <span class="font-body text-xs text-gray-500 dark:text-gray-400">10,000 requests per hour</span>
          </div>
          <div class="flex items-center gap-3 text-sm">
            <span class="font-sans text-xs px-2 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">enterprise</span>
            <span class="font-body text-xs text-gray-500 dark:text-gray-400">Custom rate limits</span>
          </div>
        </div>
      </section>

      <!-- Response Format -->
      <section>
        <h2 class="font-serif text-2xl font-200 text-gray-900 dark:text-gray-100 mb-4">Response Format</h2>
        <p class="font-body text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
          All responses follow a consistent JSON structure:
        </p>
        <div class="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 p-4 rounded-sm">
          <pre class="font-mono text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">{{ JSON.stringify(responseExample, null, 2) }}</pre>
        </div>
      </section>

      <!-- Endpoints -->
      <section>
        <h2 class="font-serif text-2xl font-200 text-gray-900 dark:text-gray-100 mb-6">Endpoints</h2>

        <!-- Quotes -->
        <DevelopersEndpointBlock
          method="GET"
          path="/api/v1/quotes"
          description="List approved quotes with pagination, filtering, and search."
        >
          <template #params>
            <DevelopersParamRow name="page" type="integer" default-val="1" desc="Page number" />
            <DevelopersParamRow name="limit" type="integer" default-val="20" desc="Items per page (max 100)" />
            <DevelopersParamRow name="language" type="string" default-val="—" desc="Filter by language (e.g. en, fr)" />
            <DevelopersParamRow name="author_id" type="integer" default-val="—" desc="Filter by author ID" />
            <DevelopersParamRow name="reference_id" type="integer" default-val="—" desc="Filter by reference ID" />
            <DevelopersParamRow name="tag" type="string" default-val="—" desc="Filter by tag name" />
            <DevelopersParamRow name="search" type="string" default-val="—" desc="Search in quote content" />
            <DevelopersParamRow name="sort_by" type="string" default-val="created_at" desc="created_at, updated_at, views_count, likes_count" />
            <DevelopersParamRow name="sort_order" type="string" default-val="desc" desc="asc or desc" />
          </template>
        </DevelopersEndpointBlock>

        <DevelopersEndpointBlock
          method="GET"
          path="/api/v1/quotes/{id}"
          description="Get a single approved quote by ID with full details."
        >
          <template #params>
            <DevelopersParamRow name="id" type="integer" required desc="Quote ID" />
          </template>
        </DevelopersEndpointBlock>

        <DevelopersEndpointBlock
          method="GET"
          path="/api/v1/random"
          description="Get one or more random quotes."
        >
          <template #params>
            <DevelopersParamRow name="limit" type="integer" default-val="1" desc="Number of random quotes (max 10)" />
          </template>
        </DevelopersEndpointBlock>

        <!-- Authors -->
        <DevelopersEndpointBlock
          method="GET"
          path="/api/v1/authors"
          description="List authors sorted by popularity."
        >
          <template #params>
            <DevelopersParamRow name="page" type="integer" default-val="1" desc="Page number" />
            <DevelopersParamRow name="limit" type="integer" default-val="20" desc="Items per page (max 100)" />
            <DevelopersParamRow name="search" type="string" default-val="—" desc="Search by name" />
          </template>
        </DevelopersEndpointBlock>

        <DevelopersEndpointBlock
          method="GET"
          path="/api/v1/authors/{id}"
          description="Get a single author by ID."
        >
          <template #params>
            <DevelopersParamRow name="id" type="integer" required desc="Author ID" />
          </template>
        </DevelopersEndpointBlock>

        <!-- References -->
        <DevelopersEndpointBlock
          method="GET"
          path="/api/v1/references"
          description="List references (sources) sorted by popularity."
        >
          <template #params>
            <DevelopersParamRow name="page" type="integer" default-val="1" desc="Page number" />
            <DevelopersParamRow name="limit" type="integer" default-val="20" desc="Items per page (max 100)" />
            <DevelopersParamRow name="search" type="string" default-val="—" desc="Search by name" />
            <DevelopersParamRow name="type" type="string" default-val="—" desc="Filter by type (film, book, tv_series, ...)" />
          </template>
        </DevelopersEndpointBlock>

        <DevelopersEndpointBlock
          method="GET"
          path="/api/v1/references/{id}"
          description="Get a single reference by ID."
        >
          <template #params>
            <DevelopersParamRow name="id" type="integer" required desc="Reference ID" />
          </template>
        </DevelopersEndpointBlock>

        <!-- Tags -->
        <DevelopersEndpointBlock
          method="GET"
          path="/api/v1/tags"
          description="List tags sorted by quote count."
        >
          <template #params>
            <DevelopersParamRow name="page" type="integer" default-val="1" desc="Page number" />
            <DevelopersParamRow name="limit" type="integer" default-val="50" desc="Items per page (max 100)" />
          </template>
        </DevelopersEndpointBlock>

        <!-- Search -->
        <DevelopersEndpointBlock
          method="GET"
          path="/api/v1/search"
          description="Search across quotes, authors, or references."
        >
          <template #params>
            <DevelopersParamRow name="q" type="string" required desc="Search query (min 2 characters)" />
            <DevelopersParamRow name="type" type="string" default-val="quotes" desc="Scope: quotes, authors, or references" />
            <DevelopersParamRow name="page" type="integer" default-val="1" desc="Page number" />
            <DevelopersParamRow name="limit" type="integer" default-val="20" desc="Items per page (max 100)" />
          </template>
        </DevelopersEndpointBlock>

        <!-- Me -->
        <DevelopersEndpointBlock
          method="GET"
          path="/api/v1/me"
          description="Get information about the current API key."
        />
      </section>

      <!-- Example -->
      <section>
        <h2 class="font-serif text-2xl font-200 text-gray-900 dark:text-gray-100 mb-4">Example</h2>
        <p class="font-body text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
          Fetch the 5 most recent quotes in French:
        </p>
        <div class="bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 p-4 rounded-sm">
          <pre class="font-mono text-xs text-gray-700 dark:text-gray-300 overflow-x-auto whitespace-pre-wrap">{{ exampleCurl }}</pre>
        </div>
      </section>

      <!-- Status -->
      <section>
        <h2 class="font-serif text-2xl font-200 text-gray-900 dark:text-gray-100 mb-4">API Status</h2>
        <p class="font-body text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          Check the real-time availability of the Verbatims API on our
          <NuxtLink to="/status" class="underline underline-offset-2 decoration-gray-300 dark:decoration-gray-600 hover:decoration-gray-500">status page</NuxtLink>.
        </p>
      </section>

      <!-- Errors -->
      <section>
        <h2 class="font-serif text-2xl font-200 text-gray-900 dark:text-gray-100 mb-4">Error Codes</h2>
        <div class="space-y-2">
          <div class="flex items-start gap-4 text-sm">
            <code class="font-mono text-xs text-red-600 dark:text-red-400 shrink-0 w-8">401</code>
            <span class="font-body text-xs text-gray-600 dark:text-gray-400">Missing, invalid, or inactive API key</span>
          </div>
          <div class="flex items-start gap-4 text-sm">
            <code class="font-mono text-xs text-red-600 dark:text-red-400 shrink-0 w-8">429</code>
            <span class="font-body text-xs text-gray-600 dark:text-gray-400">Rate limit exceeded. Check <code class="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1">X-RateLimit-Reset</code> header</span>
          </div>
          <div class="flex items-start gap-4 text-sm">
            <code class="font-mono text-xs text-red-600 dark:text-red-400 shrink-0 w-8">404</code>
            <span class="font-body text-xs text-gray-600 dark:text-gray-400">Resource not found</span>
          </div>
          <div class="flex items-start gap-4 text-sm">
            <code class="font-mono text-xs text-orange-600 dark:text-orange-400 shrink-0 w-8">400</code>
            <span class="font-body text-xs text-gray-600 dark:text-gray-400">Invalid request parameters</span>
          </div>
          <div class="flex items-start gap-4 text-sm">
            <code class="font-mono text-xs text-red-600 dark:text-red-400 shrink-0 w-8">500</code>
            <span class="font-body text-xs text-gray-600 dark:text-gray-400">Internal server error</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Developers - Verbatims API Documentation' })

const runtimeConfig = useRuntimeConfig()
const siteUrl = runtimeConfig.public?.siteUrl || 'https://verbatims.cc'

const responseExample = {
  success: true,
  data: [
    {
      id: 1,
      content: "The only way to do great work is to love what you do.",
      language: "en",
      stats: { views: 15234, likes: 892, shares: 431 },
      featured: true,
      author: { id: 42, name: "Steve Jobs", fictional: false, image_url: null },
      reference: { id: 7, name: "Stanford Commencement Speech", type: "speech" },
      tags: [{ name: "inspiration", color: "#3B82F6" }],
      created_at: 1700000000000,
      updated_at: 1700000000000,
    }
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasMore: false },
}

const exampleCurl = `curl -H "Authorization: Bearer vbt_your_key_here" \\
  "${siteUrl}/api/v1/quotes?language=fr&limit=5&sort_by=created_at&sort_order=desc" \\
  | python3 -m json.tool`
</script>

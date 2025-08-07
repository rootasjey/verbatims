<template>
  <main class="prose mx-auto max-w-3xl px-5 py-12">
    <div class="mt-8">
      <h1>Privacy Policy</h1>
      <p class="text-sm text-gray-500 relative -top-2">Effective date: {{ effectiveDate }}</p>
    </div>

    <section>
      <h2>1 • Introduction and scope</h2>
      <p>
        We take your privacy seriously. This Privacy Policy explains what data we collect when you use our platform, how we use it, where it’s processed, and the choices and rights you have. Our goal is simple: measure how the platform is used so we can make it better—without ads, tracking profiles, or selling data.
      </p>
      <p>This policy applies to all use of our platform, services, and related pages.</p>
    </section>

    <section>
      <h2>2 • What data we collect</h2>
      <p>We only collect what’s necessary to measure audience and platform/service usage (analytics/usage metrics). This may include:</p>
      <ul>
        <li><strong>Device and technical information:</strong> browser type/version, operating system, screen size, preferred language, and privacy-preserving identifiers generated for analytics.</li>
        <li><strong>Usage data:</strong> pages viewed, time on page, navigation paths, event counts (e.g., button clicks), referring/exit pages, and approximate location at the city/region level derived from IP for aggregate analytics.</li>
        <li><strong>Log data:</strong> minimal server logs for reliability and security (timestamps, request URLs, status codes, and IP addresses).</li>
      </ul>
      <p>
        We do not collect personal data beyond what’s needed for these measurements unless you explicitly provide it (for example, if you sign up, submit content, or contact support). Any optional personal information you provide is used only for the purpose you provided it for.
      </p>
    </section>

    <section>
      <h2>3 • How we use data</h2>
      <ul>
        <li>Understand how people use the platform</li>
        <li>Improve performance, reliability, and accessibility</li>
        <li>Prioritize features and fix issues</li>
      </ul>
      <p>We do not use your data for advertising or profiling. No behavioral ads. No cross-site tracking.</p>
    </section>

    <section>
      <h2>4 • Third parties</h2>
      <p>We do not share, sell, or rent your data to third parties.</p>
      <p><strong>Infrastructure provider: Cloudflare</strong></p>
      <ul>
        <li>We deploy our platform on Cloudflare. Cloudflare acts as an infrastructure provider and processor, helping us deliver the service securely and quickly (e.g., CDN, DDoS protection, caching, edge routing).</li>
        <li>As part of operating the service, traffic may transit through Cloudflare’s network and be processed according to Cloudflare’s security measures. Cloudflare may temporarily process IP addresses and request metadata to provide its services.</li>
      </ul>
      <p>We do not allow third-party analytics scripts that collect data for advertising or create user profiles.</p>
    </section>

    <section>
      <h2>5 • Data location and transfers</h2>
      <p>
        By default, data does not leave our platform except as necessary for delivery and protection through Cloudflare’s infrastructure. This means:
      </p>
      <ul>
        <li>Requests and minimal logs may be processed through Cloudflare’s global network to route and protect traffic.</li>
        <li>Cloudflare uses appropriate security controls and industry-standard protections to safeguard data in transit and at rest within its systems.</li>
        <li>Where data may be transferred across regions to ensure availability and security, such transfers are protected by Cloudflare’s compliance frameworks and safeguards.</li>
      </ul>
    </section>

    <section>
      <h2>6 • Legal basis for processing</h2>
      <p>Where applicable (e.g., under GDPR), our legal bases are:</p>
      <ul>
        <li><strong>Legitimate interests:</strong> Measuring service usage, ensuring reliability and security, and improving the platform in a privacy-preserving manner.</li>
        <li><strong>Consent:</strong> If we ever request optional data beyond what’s necessary for analytics and service operation, we will ask for your explicit consent.</li>
      </ul>
    </section>

    <section>
      <h2>7 • Data retention</h2>
      <ul>
        <li><strong>Analytics and usage metrics:</strong> Retained only as long as necessary to analyze trends and improve the service. We aim to aggregate and/or anonymize data as early as possible.</li>
        <li><strong>Server and security logs:</strong> Kept for a limited period needed for troubleshooting, reliability, and security, then deleted or anonymized.</li>
      </ul>
      <p>When retention is no longer needed for the purposes stated above, we delete or irreversibly anonymize data according to standardized schedules.</p>
    </section>

    <section>
      <h2>8 • Your rights</h2>
      <p>Depending on your location, you may have rights to:</p>
      <ul>
        <li>Access your data</li>
        <li>Correct inaccurate data</li>
        <li>Delete your data</li>
        <li>Object to or restrict certain processing</li>
        <li>Receive a copy (data portability), where applicable</li>
      </ul>
      <p>
        To request an export or exercise your rights, contact us at
        <a href="mailto:privacy@verbatims.co">privacy@verbatims.co</a> with the email you used on the platform (if any). We may need to verify your identity to protect your account and data. We respond within the timeframes required by law.
      </p>
    </section>

    <section>
      <h2>9 • Security</h2>
      <ul>
        <li>Transport Layer Security (TLS) for data in transit</li>
        <li>Hardened infrastructure and access controls</li>
        <li>Least-privilege access and logging for administrative operations</li>
        <li>Cloudflare’s network-level protections (e.g., DDoS mitigation, WAF, caching) to help secure traffic and improve reliability</li>
      </ul>
      <p>While no system is perfectly secure, we continuously improve our safeguards to reduce risk.</p>
    </section>

    <section>
      <h2>10 • Children’s privacy</h2>
      <p>
        Our platform is not directed to children under the age of 13 (or the equivalent age of digital consent in your jurisdiction). We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, contact us and we will take appropriate steps to delete it.
      </p>
    </section>

    <section>
      <h2>11 • Changes to this policy</h2>
      <p>
        We may update this Privacy Policy to reflect improvements to the platform, changes in our practices, or legal requirements. We’ll post updates here and revise the effective date at the top. For significant changes, we’ll provide a more prominent notice.
      </p>
    </section>

    <section>
      <h2>12 • Contact us</h2>
      <p>Questions, privacy requests, or concerns? Reach us at:</p>
      <ul>
        <li>Email: <a href="mailto:privacy@verbatims.co">privacy@verbatims.co</a></li>
        <li>Address: Yvelines, France</li>
      </ul>

      <p class="font-medium mt-6">No ads. No profiling. Privacy-first by design.</p>
    </section>
  </main>
</template>

<script setup lang="ts">
useHead({
  title: 'Privacy Policy',
  meta: [
    { name: 'robots', content: 'index,follow' },
    { name: 'description', content: 'Privacy-first policy: analytics-only, no ads, no profiling, Cloudflare as infrastructure provider.' },
  ],
});

const effectiveDate = new Date().toLocaleDateString('fr-FR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
</script>

<style scoped>
/* Smooth anchor offset for in-page links */
.prose :where(h1, h2) {
  scroll-margin-top: 6rem;
}

/* Slightly tighter readable measure and improved rhythm */
.prose {
  line-height: 1.75;
}

/* Headings: clear hierarchy and spacing */
.prose :where(h1) {
  font-family: 'Gambetta';
  font-size: clamp(1.875rem, 1.2rem + 2vw, 2.25rem);
  line-height: 0.6;
  margin-bottom: 0.8em;
}
.prose :where(h2) {
  font-size: 1.0rem;
  line-height: 1.3;
  font-weight: 800;
  font-family: 'Gambetta';
  margin-top: 2.2em;
  margin-bottom: 0.8em;
}

/* Paragraphs and lists spacing */
.prose :where(p) {
  font-family: 'Nunito';
  margin-top: 1em;
  margin-bottom: 1em;
}
.prose :where(ul, ol) {
  font-family: 'Nunito';
  margin-top: 1em;
  margin-bottom: 1.25em;
  padding-left: 1.4em;
}
.prose :where(li + li) {
  margin-top: 0.4em;
}

/* Strong emphasis slightly toned for long-form text */
.prose :where(strong) {
  font-weight: 600;
}

/* Links: subtle underline that appears on hover/focus */
.prose :where(a) {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 0.08em;
}
.prose :where(a:hover, a:focus-visible) {
  text-decoration-thickness: 0.12em;
}

/* Improve focus outlines for accessibility */
.prose :where(a:focus-visible) {
  outline: 2px solid #3b82f6; /* blue-500 in light */
  outline-offset: 2px;
  border-radius: 2px; /* subtle rounding like terms page */
}

/* Blockquotes: calmer style */
.prose :where(blockquote) {
  font-style: italic;
  color: #374151; /* gray-700 */
  border-left: 3px solid #E5E7EB; /* gray-200 */
  padding-left: 1rem;
  margin: 1.25em 0;
}

/* Sections get a gentle separation */
.prose :where(section + section) {
  margin-top: 2.5rem;
  padding-top: 0.25rem;
  border-top: 1px solid rgba(17, 24, 39, 0.06); /* gray-900 @ 6% */
}

/* Small meta line under title */
.prose :where(p.text-sm) {
  margin-top: -0.5rem;
  margin-bottom: 1.5rem;
  color: #6B7280; /* gray-500 (ensure if Tailwind isn't loaded) */
}

/* Dark mode via prefers-dark class */
.prefers-dark .prose :where(a:focus-visible) {
  outline-color: #a9c3ff;
}
.prefers-dark .prose :where(blockquote) {
  color: #9CA3AF; /* gray-400/300 for dark readability */
  border-left-color: #374151; /* gray-700 */
}
.prefers-dark .prose :where(section + section) {
  border-top-color: rgba(229, 231, 235, 0.08); /* gray-200 @ 8% */
}
.prefers-dark .prose :where(p.text-sm) {
  color: #9CA3AF; /* gray-400 */
}

/* Dark mode via OS preference */
@media (prefers-color-scheme: dark) {
  .prose :where(a:focus-visible) {
    outline-color: #a9c3ff;
  }
  .prose :where(blockquote) {
    color: #9CA3AF; /* gray-400/300 for dark readability */
    border-left-color: #374151; /* gray-700 */
  }
  .prose :where(section + section) {
    border-top-color: rgba(229, 231, 235, 0.08); /* gray-200 @ 8% */
  }
  .prose :where(p.text-sm) {
    color: #9CA3AF; /* gray-400 */
  }
}
</style>
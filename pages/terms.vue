<template>
  <div class="tos-root" :class="{ 'prefers-dark': isDark }">
    <a class="skip-link" href="#main">Skip to content</a>

    <header class="tos-header" role="banner">
      <div class="container">
        <h1 class="title">Terms of Service</h1>
        <p class="subtitle">
          Clear, simple terms for using our quotes platform.
        </p>
        <p class="meta">
          <span aria-label="Version">Version 0.1</span>
          <span aria-hidden="true">•</span>
          <time datetime="2025-07-08">Last updated: 8 August 2025</time>
        </p>
      </div>
    </header>

    <div class="tos-body">
      <main id="main" class="content" role="main">
        <section
          v-for="item in toc"
          :key="item.id"
          :id="item.id"
          class="section"
          :aria-labelledby="item.id + '-title'"
        >
          <header class="section-header">
            <h2 :id="item.id + '-title'">
              <span class="sec-num">{{ item.num }}.</span> {{ item.title }}
            </h2>
          </header>

          <div class="section-body">
            <!-- 1) Introduction and Acceptance -->
            <template v-if="item.id === 'introduction-and-acceptance'">
              <p>
                These Terms of Service (“Terms”) govern your access to and use of our quotes platform, including websites, apps, and related services (collectively, the “Service”). By accessing or using the Service, you agree to be bound by these Terms and our Privacy Policy. If you do not agree, do not use the Service.
              </p>
              <p>
                We aim for clarity and fairness. If anything is unclear, please contact us before continuing to use the Service.
              </p>
            </template>

            <!-- 2) Eligibility -->
            <template v-else-if="item.id === 'eligibility'">
              <p>
                You may use the Service only if you:
              </p>
              <ul>
                <li>Are at least the age of majority in your jurisdiction or have verifiable parental consent;</li>
                <li>Can form a binding contract with us; and</li>
                <li>Comply with these Terms and all applicable laws.</li>
              </ul>
              <p>
                If you access the Service on behalf of an organization, you represent that you are authorized to bind that organization to these Terms.
              </p>
            </template>

            <!-- 3) Account Registration and Security -->
            <template v-else-if="item.id === 'account-registration-and-security'">
              <p>
                When creating an account, provide accurate information and keep it updated. You are responsible for maintaining the confidentiality of your credentials and for activity under your account. Notify us promptly of any unauthorized use or security incident.
              </p>
              <ul>
                <li>Use a strong, unique password and update it periodically.</li>
                <li>Limit access to your device and log out after use.</li>
                <li>We may suspend or terminate accounts for violations of these Terms.</li>
              </ul>
            </template>

            <!-- 4) User-Generated Content -->
            <template v-else-if="item.id === 'user-generated-content'">
              <p>
                You may submit quotes, commentary, attribution details, source references, images, and related materials (“User Content”). You are solely responsible for your User Content, including ensuring accuracy of attributions and sources.
              </p>
              <h3>Source Accuracy</h3>
              <ul>
                <li>Provide best-effort verification of author identity and original source.</li>
                <li>Include citations (e.g., book title, publication, date) when available.</li>
                <li>Do not knowingly misattribute or fabricate quotations.</li>
              </ul>
              <p>
                We do not endorse User Content and are not obligated to monitor it, but we may review, flag, or remove content that violates these Terms or applicable law.
              </p>
            </template>

            <!-- 5) Intellectual Property -->
            <template v-else-if="item.id === 'intellectual-property'">
              <p>
                The Service, including text, UI design, logos, trademarks, trade dress, code, and other proprietary material (“Platform Content”), is owned by us or our licensors and is protected by intellectual property laws.
              </p>
              <ul>
                <li>You may not use our trademarks or branding without express written permission.</li>
                <li>Except as permitted by these Terms, you may not copy, modify, distribute, or create derivative works of the Platform Content.</li>
              </ul>
              <p>
                Quotes themselves may be in the public domain or subject to rights. You are responsible for ensuring your use complies with applicable law.
              </p>
            </template>

            <!-- 6) License to Your Content and Content Moderation -->
            <template v-else-if="item.id === 'license-and-moderation'">
              <p>
                By posting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, host, store, reproduce, modify (e.g., for formatting), publish, display, and distribute your User Content for operating, promoting, and improving the Service.
              </p>
              <p>
                We may moderate or remove User Content that we reasonably believe violates these Terms, infringes rights, or risks harm. We may also suspend features or impose limits to protect Service integrity.
              </p>
            </template>

            <!-- 7) Prohibited Uses -->
            <template v-else-if="item.id === 'prohibited-uses'">
              <p>Do not misuse the Service. Prohibited activities include:</p>
              <ul>
                <li>Scraping, crawling, or harvesting data without permission;</li>
                <li>Spam, fraud, impersonation, harassment, or abusive conduct;</li>
                <li>Misattributing quotes or fabricating sources;</li>
                <li>Bypassing access controls or rate limits;</li>
                <li>Uploading malware or interfering with Service functionality;</li>
                <li>Automating submissions to manipulate rankings or attribution;</li>
                <li>Using outputs in ways that violate third-party rights or applicable law;</li>
                <li>Improper AI use, including training models on non-permitted data from the Service or reproducing substantial portions without permission or a license.</li>
              </ul>
            </template>

            <!-- 8) Community Guidelines -->
            <template v-else-if="item.id === 'community-guidelines'">
              <p>We encourage a calm, literary, respectful culture. Please:</p>
              <ul>
                <li>Attribute quotations accurately and add sources when possible;</li>
                <li>Use inclusive language and avoid personal attacks;</li>
                <li>Report inaccuracies or policy violations via in-app tools;</li>
                <li>Celebrate diverse voices and contexts around quotations.</li>
              </ul>
            </template>

            <!-- 9) Attribution and Fair Use of Quotes -->
            <template v-else-if="item.id === 'attribution-and-fair-use'">
              <p>
                Many quotations are short and may qualify as fair use or be in the public domain. However, longer excerpts, images, or context may be protected. When sharing or embedding quotes from the Service:
              </p>
              <ul>
                <li>Include author name and source reference when available;</li>
                <li>Avoid reproducing substantial portions from protected works;</li>
                <li>Provide a link back to the quote page when feasible;</li>
                <li>Respect any applicable licenses or restrictions indicated in the Service.</li>
              </ul>
            </template>

            <!-- 10) DMCA/Copyright and Takedown Policy -->
            <template v-else-if="item.id === 'dmca'">
              <p>
                We respect intellectual property rights. If you believe content infringes your copyright, send a notice with sufficient detail (identification of the work, the infringing material, your contact info, a statement of good faith, and your signature) to our designated agent at the contact below. We may remove or disable content and, where appropriate, terminate repeat infringers.
              </p>
              <p>
                Counter-notices should follow applicable law and include required statements under penalty of perjury. We may restore content upon receipt of a valid counter-notice unless we receive notice of legal action.
              </p>
            </template>

            <!-- 11) Privacy and Data Processing -->
            <template v-else-if="item.id === 'privacy'">
              <p>
                Your use of the Service is subject to our Privacy Policy, which explains how we collect, use, and share information. Please review it to understand our practices and your choices.
              </p>
              <p>
                See: <NuxtLink to="/privacy" class="inline-link">Privacy Policy</NuxtLink>.
              </p>
            </template>

            <!-- 12) Third-Party Services and Links -->
            <template v-else-if="item.id === 'third-party'">
              <p>
                The Service may link to or integrate with third-party services. We are not responsible for their content, policies, or practices. Your use of third-party services is governed by their terms and policies.
              </p>
            </template>

            <!-- 13) Subscriptions, Billing, and Refunds -->
            <template v-else-if="item.id === 'billing'">
              <p>
                If we offer paid features, the following may apply: pricing, billing cycle, renewal, taxes, and refund eligibility. You authorize us or our payment processor to charge your payment method for applicable fees. Unless stated otherwise, subscriptions renew automatically until canceled.
              </p>
              <ul>
                <li>We may update prices with reasonable notice;</li>
                <li>Refunds are granted where required by law or our posted policy;</li>
                <li>Chargebacks or unpaid fees may result in suspension.</li>
              </ul>
            </template>

            <!-- 14) Disclaimers and Limitation of Liability -->
            <template v-else-if="item.id === 'disclaimers'">
              <p>
                The Service is provided “as is” and “as available.” We make no warranties of accuracy, reliability, or fitness for a particular purpose. Quotes and attributions can be incomplete or contested; use your judgment and verify sources.
              </p>
              <p>
                To the maximum extent permitted by law, we are not liable for indirect, incidental, special, consequential, or exemplary damages arising from your use of the Service.
              </p>
            </template>

            <!-- 15) Indemnification -->
            <template v-else-if="item.id === 'indemnification'">
              <p>
                You will indemnify and hold us harmless from claims, damages, and expenses (including reasonable legal fees) arising from your use of the Service, your User Content, or your violation of these Terms or applicable law.
              </p>
            </template>

            <!-- 16) Termination -->
            <template v-else-if="item.id === 'termination'">
              <p>
                You may stop using the Service at any time. We may suspend or terminate your access if we reasonably believe you violated these Terms, created risk, or caused harm. Upon termination, certain sections survive, including intellectual property, disclaimers, limitation of liability, and indemnification.
              </p>
            </template>

            <!-- 17) Governing Law and Dispute Resolution -->
            <template v-else-if="item.id === 'governing-law'">
              <p>
                These Terms are governed by the laws of the jurisdiction specified by our principal place of business, without regard to conflict-of-law principles. Disputes will be resolved in the courts located there, unless otherwise required by applicable law.
              </p>
              <p>
                Where permitted, you agree to resolve disputes on an individual basis and waive participation in class actions.
              </p>
            </template>

            <!-- 18) Changes to These Terms -->
            <template v-else-if="item.id === 'changes'">
              <p>
                We may update these Terms from time to time. We will post the updated Terms and revise the “Last updated” date. Material changes will be notified through the Service or by other reasonable means. Your continued use after changes become effective constitutes acceptance of the revised Terms.
              </p>
            </template>

            <!-- 19) Contact Information -->
            <template v-else-if="item.id === 'contact'">
              <p>
                Questions or notices can be sent to:
              </p>
              <address class="contact" aria-label="Contact information">
                Quotes Platform Legal<br />
                123 Literary Lane, Suite 4<br />
                Paris, France<br />
                legal@example.com
              </address>
            </template>
          </div>
          <hr class="divider" aria-hidden="true" />
        </section>

        <footer class="doc-end" aria-label="Document end">
          <p>
            This document contains sample, non-binding legal copy for placeholder purposes only. Replace with counsel-reviewed language before production use.
          </p>
        </footer>
      </main>

      <nav
        class="toc"
        aria-label="In-page navigation"
        role="navigation"
      >
        <details :open="tocOpen" @toggle="onDetailsToggle">
          <summary class="toc-summary" :aria-expanded="tocOpen">
            <span class="toc-icon" aria-hidden="true">☰</span>
            Contents
          </summary>
          <ol class="toc-list">
            <li v-for="item in toc" :key="item.id">
              <a :href="'#' + item.id" class="toc-link" @click="closeTocOnMobile">
                {{ item.title }}
              </a>
            </li>
          </ol>
        </details>
      </nav>
    </div>
  </div>
</template>

<script setup lang="ts">
const isDark = usePreferredDark()
const tocOpen = ref(true)

useSeoMeta({
  title: 'Terms of Service — Verbatims',
  ogTitle: 'Terms of Service — Verbatims',
  description: 'Clear, accessible Terms for using our quotes platform. Read about eligibility, content, attribution, and more.',
  ogDescription: 'Clear, accessible Terms for using our quotes platform. Read about eligibility, content, attribution, and more.'
})

const toc = [
  { num: 1, id: 'introduction-and-acceptance', title: 'Introduction and Acceptance' },
  { num: 2, id: 'eligibility', title: 'Eligibility' },
  { num: 3, id: 'account-registration-and-security', title: 'Account Registration and Security' },
  { num: 4, id: 'user-generated-content', title: 'User-Generated Content' },
  { num: 5, id: 'intellectual-property', title: 'Intellectual Property' },
  { num: 6, id: 'license-and-moderation', title: 'License to Your Content and Content Moderation' },
  { num: 7, id: 'prohibited-uses', title: 'Prohibited Uses' },
  { num: 8, id: 'community-guidelines', title: 'Community Guidelines' },
  { num: 9, id: 'attribution-and-fair-use', title: 'Attribution and Fair Use of Quotes' },
  { num: 10, id: 'dmca', title: 'DMCA/Copyright and Takedown Policy' },
  { num: 11, id: 'privacy', title: 'Privacy and Data Processing' },
  { num: 12, id: 'third-party', title: 'Third-Party Services and Links' },
  { num: 13, id: 'billing', title: 'Subscriptions, Billing, and Refunds' },
  { num: 14, id: 'disclaimers', title: 'Disclaimers and Limitation of Liability' },
  { num: 15, id: 'indemnification', title: 'Indemnification' },
  { num: 16, id: 'termination', title: 'Termination' },
  { num: 17, id: 'governing-law', title: 'Governing Law and Dispute Resolution' },
  { num: 18, id: 'changes', title: 'Changes to These Terms' },
  { num: 19, id: 'contact', title: 'Contact Information' },
] as const

function closeTocOnMobile() {
  if (window.matchMedia('(max-width: 900px)').matches) {
    tocOpen.value = false
  }
}
function onDetailsToggle(e: Event) {
  const target = e.currentTarget as HTMLDetailsElement | null
  if (target) {
    tocOpen.value = target.open
  }
}

// Default TOC to closed on small screens to reduce initial scroll clutter
onMounted(() => {
  if (window.matchMedia('(max-width: 900px)').matches) {
    tocOpen.value = false
  }
})
</script>

<style scoped>
/* Fluid type scale and modern system font stacks for performance */
:root {
  --font-serif: ui-serif, "Georgia", Cambria, "Times New Roman", Times, serif;
  --font-sans: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", sans-serif;

  /* Core tokens still used elsewhere on the page */
  --bg: #ffffff;
  --line: #e7e7e9;
  --shadow: 0 1px 1px rgba(0,0,0,0.03), 0 8px 30px rgba(0,0,0,0.06);
}

.tos-root.prefers-dark {
  --bg: #0e0f12;
  --line: #23252b;
  --shadow: 0 1px 1px rgba(0,0,0,0.2), 0 8px 30px rgba(0,0,0,0.35);
}

/* Respect user’s system preference automatically */
@media (prefers-color-scheme: dark) {
  .tos-root {
    --bg: #0e0f12;
    --line: #23252b;
    --shadow: 0 1px 1px rgba(0,0,0,0.2), 0 8px 30px rgba(0,0,0,0.35);
  }
}

/* Global */
.tos-root {
  background: var(--bg);
  color: #1b1b1b;
  min-height: 100%;
}
.tos-root.prefers-dark {
  color: #e7e7ea;
}
@media (prefers-color-scheme: dark) {
  .tos-root {
    color: #e7e7ea;
  }
}

.container {
  margin: 0 auto;
  margin-left: 6.5rem;
  padding: 1.5rem clamp(1rem, 3vw, 2rem);
}

.tos-header {
  /* border-bottom: 1px dashed gray; */
  /* Sticky removed to avoid overlap with AppHeader */
  background: color-mix(in oklab, var(--bg), transparent 0%);
  backdrop-filter: saturate(120%) blur(6px);
  z-index: 30;
}

.title {
  font-family: 'Gambetta';
  font-weight: 600;
  font-size: 2.25rem;
  letter-spacing: 0.2px;
  margin: 1.2rem 0 0.4rem;
  line-height: 1.1;
}

.subtitle {
  font-family: 'Gambetta';
  font-size: 1rem;
  color: #555;
  margin: 0 0 0.4rem;
}

.meta {
  font-size: clamp(0.88rem, 0.83rem + 0.22vw, 0.98rem);
  color: #6a6a6a;
  display: flex;
  gap: 0.5rem;
  align-items: baseline;
}

/* Body Layout */
.tos-body {
  display: grid;
  grid-template-columns: 1fr 280px ;
  gap: 2rem;
  align-items: start;
  padding: 1rem clamp(1rem, 3vw, 2rem);
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 900px) {
  .container {
    margin-left: 0;
    padding: 1rem 1rem;
  }

  .tos-body {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0.5rem 1rem;
  }

  .content {
    max-width: 100%;
  }

  .section {
    scroll-margin-top: 64px;
  }

  .toc {
    position: static;
    width: 100%;
    border-radius: 10px;
    box-shadow: none;
    border: 1px solid var(--line);
    background: color-mix(in oklab, var(--bg), transparent 0%);
  }

  .toc-summary {
    padding: 0.85rem 1rem;
    font-size: clamp(1.00rem, 0.94rem + 0.30vw, 1.125rem);
  }

  .toc-list {
    font-size: 0.875rem;
    padding: 0.25rem 0.75rem 0.75rem 1.25rem;
  }

  .toc-link {
    display: block;
    padding: 0.6rem 0.25rem;
  }
}

/* TOC */
.toc {
  position: sticky;
  top: calc(64px + 1rem);
  align-self: start;
  border: 1px solid var(--line);
  border-radius: 12px;
  box-shadow: var(--shadow);
  background: color-mix(in oklab, var(--bg), transparent 0%);
}

.toc-summary {
  font-family: 'Gambetta';
  font-size: clamp(1.00rem, 0.94rem + 0.30vw, 1.125rem);
  font-weight: 600;
  cursor: pointer;
  list-style: none;
  padding: 0.9rem 1rem;
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.toc-icon {
  font-size: 1rem;
  opacity: 0.7;
}

.toc-list {
  font-size: 0.75rem;
  margin: 0;
  padding: 0.4rem 0.75rem 0.9rem 1.25rem;
  list-style: decimal;
}

.toc-link {
  display: inline-block;
  padding: 0.4rem 0;
  color: #555;
  text-decoration: none;
  border-radius: 8px;
  outline-offset: 3px;
}
.tos-root.prefers-dark .toc-link {
  color: #b6b8bf;
}
@media (prefers-color-scheme: dark) {
  .tos-root .toc-link {
    color: #b6b8bf;
  }
}

.toc-link:hover,
.toc-link:focus-visible {
  color: #1b1b1b;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}
.tos-root.prefers-dark .toc-link:hover,
.tos-root.prefers-dark .toc-link:focus-visible {
  color: #e7e7ea;
}
@media (prefers-color-scheme: dark) {
  .tos-root .toc-link:hover,
  .tos-root .toc-link:focus-visible {
    color: #e7e7ea;
  }
}

/* Content */
.content {
  font-family: Inter;
  line-height: 1.65;
  letter-spacing: 0.2px;
  max-width: 74ch;
  margin-inline: auto;
  scroll-behavior: smooth; /* smooth anchor scrolling */
}

.section {
  scroll-margin-top: 100px; /* for sticky header */
}

.section-header h2 {
  font-family: 'Gambetta';
  font-size: 1.2rem;
  font-weight: 600;
  line-height: 1.2;
  margin: 1.6rem 0 0.6rem;
  color: inherit;
}

.sec-num {
  color: #3a66d6;
  font-weight: 600;
}
.tos-root.prefers-dark .sec-num {
  color: #7aa2ff;
}
@media (prefers-color-scheme: dark) {
  .tos-root .sec-num {
    color: #7aa2ff;
  }
}

.section-body p {
  font-size: 0.9rem;
  font-family: 'Nunito';
  color: #1b1b1b;
  margin: 0.4rem 0 0.9rem;
}
.tos-root.prefers-dark .section-body p {
  color: #e7e7ea;
}
@media (prefers-color-scheme: dark) {
  .tos-root .section-body p {
    color: #e7e7ea;
  }
}

.section-body ul {
  padding-left: 1.1rem;
  margin: 0.2rem 0 1rem;
}

.section-body li {
  margin: 0.2rem 0;
}

.section-body h3, .section-body h4 {
  font-family: 'Gambetta';
  font-weight: 600;
  margin-top: 1rem;
  margin-bottom: 0.4rem;
  color: #1b1b1b;
}
.tos-root.prefers-dark .section-body h3,
.tos-root.prefers-dark .section-body h4 {
  color: #e7e7ea;
}
@media (prefers-color-scheme: dark) {
  .tos-root .section-body h3,
  .tos-root .section-body h4 {
    color: #e7e7ea;
  }
}

/* Links */
.inline-link {
  color: #3a66d6;
  text-decoration: none;
  border-radius: 6px;
  outline-offset: 3px;
}
.tos-root.prefers-dark .inline-link {
  color: #7aa2ff;
}
@media (prefers-color-scheme: dark) {
  .tos-root .inline-link {
    color: #7aa2ff;
  }
}

.inline-link:hover,
.inline-link:focus-visible {
  color: #244fb8;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 3px;
}
.tos-root.prefers-dark .inline-link:hover,
.tos-root.prefers-dark .inline-link:focus-visible {
  color: #5e86ea;
}
@media (prefers-color-scheme: dark) {
  .tos-root .inline-link:hover,
  .tos-root .inline-link:focus-visible {
    color: #5e86ea;
  }
}

/* Dividers */
.divider {
  border: none;
  border-top: 1px solid var(--line);
  margin: 1.6rem 0;
  opacity: 0.9;
}

/* Footer note */
.doc-end p {
  font-size: clamp(0.88rem, 0.83rem + 0.22vw, 0.98rem);
  color: #555;
  margin-top: 2rem;
}
.tos-root.prefers-dark .doc-end p {
  color: #b6b8bf;
}
@media (prefers-color-scheme: dark) {
  .tos-root .doc-end p {
    color: #b6b8bf;
  }
}

/* Address */
.contact {
  font-style: normal;
  line-height: 1.6;
  color: #1b1b1b;
}
.tos-root.prefers-dark .contact {
  color: #e7e7ea;
}
@media (prefers-color-scheme: dark) {
  .tos-root .contact {
    color: #e7e7ea;
  }
}

/* Skip link */
.skip-link {
  position: absolute;
  left: -999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}

.skip-link:focus {
  position: fixed;
  left: 1rem;
  top: 1rem;
  width: auto;
  height: auto;
  background: #ffffff;
  color: #1b1b1b;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 2px solid #8bb4ff;
  z-index: 1000;
}
.tos-root.prefers-dark .skip-link:focus {
  background: #0e0f12;
  color: #e7e7ea;
  border-color: #a9c3ff;
}
@media (prefers-color-scheme: dark) {
  .tos-root .skip-link:focus {
    background: #0e0f12;
    color: #e7e7ea;
    border-color: #a9c3ff;
  }
}

/* Focus styles */
a:focus-visible,
button:focus-visible,
summary:focus-visible,
.toc-link:focus-visible,
.inline-link:focus-visible {
  outline: 2px solid #8bb4ff;
  outline-offset: 3px;
  border-radius: 6px;
}
.tos-root.prefers-dark a:focus-visible,
.tos-root.prefers-dark button:focus-visible,
.tos-root.prefers-dark summary:focus-visible,
.tos-root.prefers-dark .toc-link:focus-visible,
.tos-root.prefers-dark .inline-link:focus-visible {
  outline-color: #a9c3ff;
}
@media (prefers-color-scheme: dark) {
  .tos-root a:focus-visible,
  .tos-root button:focus-visible,
  .tos-root summary:focus-visible,
  .tos-root .toc-link:focus-visible,
  .tos-root .inline-link:focus-visible {
    outline-color: #a9c3ff;
  }
}

/* Microinteractions */
.toc,
.toc-link,
.inline-link,
.section-header h2,
.title {
  transition: color 160ms ease, background-color 160ms ease, border-color 160ms ease, text-decoration-color 160ms ease, box-shadow 160ms ease;
}
</style>
# Cloudflare setup — `home2host.com`

Reference for the Cloudflare configuration shipped 2026-06-25. Captures every toggle we touched, every default we left alone, and what changes at the Vercel DNS switch. **Read this when:** you need to remember why a setting is the way it is, you're about to flip the origin from Hostinger to Vercel, or something looks off in Cloudflare and you want to compare to the known-good state.

## Account context

- **Plan**: Free (covers ~90% of what a marketing site needs; revisit if traffic patterns ever justify Pro).
- **Login**: GitHub SSO using `velislavvelchev` GitHub account. **No Cloudflare-native password set.** Auth posture is inherited from GitHub — so GitHub 2FA + GitHub recovery codes are the only access-restore path. If GitHub access is lost, Cloudflare access is lost too. Keep GitHub recovery codes durably stored.
- **Cloudflare nameservers assigned**: `kobe.ns.cloudflare.com` + `lola.ns.cloudflare.com` (random per-zone). Set at Hostinger registrar 2026-06-25.

## Domain registration vs DNS split

- **Hostinger remains the registrar** — holds the domain ownership, handles WHOIS, renewals, expiry. Domain expires 2026-09-11 per [[infrastructure-domain-and-mailbox]].
- **Cloudflare is the DNS provider** — answers all DNS queries, proxies web traffic, runs security/cache. Hostinger's "Manage DNS records" panel is now **functionally dead** — any edits there are ignored. All DNS changes happen in Cloudflare from this point on.

## DNS records — proxy status (the critical configuration)

Set during onboarding (Phase 2). The trap to avoid: Cloudflare's default is to proxy **everything proxyable**, which breaks mail. Six records were flipped to DNS-only (gray cloud) before continuing.

### Proxied (orange cloud) — web traffic

| Record | Type | Why proxied |
|---|---|---|
| `home2host.com` → 77.37.76.87, 92.112.198.111 | A × 2 | Web traffic to WP origin; protected by Cloudflare |
| `home2host.com` → IPv6 × 2 | AAAA × 2 | Same as above, IPv6 |
| `www.home2host.com` → `www.home2host.com` (CNAME) | CNAME | Alternate hostname for the same web traffic |

### DNS only (gray cloud) — mail + non-web

| Record | Type | Why **NOT** proxied |
|---|---|---|
| `ftp` → 46.202.158.229 | A | Cloudflare doesn't proxy FTP protocol; proxying breaks FTP access |
| `autoconfig` → `autoconfig.mail.hostinger.com` | CNAME | Email client auto-discovery (Thunderbird) — proxying breaks mailbox setup |
| `autodiscover` → `autodiscover.mail.hostinger.com` | CNAME | Same, for Microsoft Outlook |
| `hostingermail-a/b/c.…` | CNAME × 3 | Hostinger's DKIM signing CNAME chain — proxying breaks DKIM signatures → outbound mail goes to spam |

### Always DNS only (Cloudflare can't proxy these)

| Record | Type | Notes |
|---|---|---|
| `mx1.hostinger.com` (priority 5), `mx2.hostinger.com` (priority 10) | MX × 2 | Inbound mail to `info@home2host.com` |
| `_dmarc` → `v=DMARC1; p=…` | TXT | DMARC policy |
| `home2host.com` → `v=spf1 include:_spf.mail.hostinger.com …` | TXT | SPF — authorizes outbound mail origins |

There is no flat DKIM TXT record — Hostinger does DKIM signing through the three `hostingermail-*` CNAMEs (delegated DKIM, standard Hostinger setup).

## SSL/TLS configuration

### Encryption mode: **Automatic SSL/TLS (recommended)**

Cloudflare auto-scans the origin and picks the most secure mode the origin currently supports. At time of setup, Cloudflare detected Hostinger's origin and selected **"Currently running: Full"** (not strict). This is the right choice during the WP → Vercel transition:

- Hostinger's cert chain doesn't validate strictly enough for Full (Strict). If we'd forced Full (Strict), the site would have broken on Cloudflare activation.
- Vercel's cert is Let's Encrypt → validates strictly. After the DNS switch, Automatic will auto-upgrade to Full (Strict) without us touching anything.

Manual Full (Strict) is an option to revisit post-launch *only* as a "no surprises" preference — not a security gain at our scale.

### Edge Certificates

| Setting | Value | Reason |
|---|---|---|
| Always Use HTTPS | ON | Edge-level `http://` → `https://` redirect |
| Automatic HTTPS Rewrites | ON | Rewrites `http://` URLs in HTML to `https://` (prevents mixed content during WP → Vercel) |
| Minimum TLS Version | **TLS 1.2** | Visitor↔Cloudflare leg only (origin negotiation is separate). Blocks ~no real-world browsers; aligns with modern compliance. **Does NOT affect Hostinger compatibility** — that's a different negotiation. |
| TLS 1.3 | ON | Modern ciphers, faster handshakes |
| Opportunistic Encryption | ON | Default |
| **HSTS** | **OFF** ⚠ | **Deliberately left off.** Once enabled, browsers refuse plain HTTP for the configured duration (months/years), even if you disable HSTS later. Turn ON only after the Vercel cutover is fully stable (~1 week post-launch). |

### Universal SSL (free Cloudflare cert)

- **Status**: Active for `*.home2host.com` + `home2host.com`
- Auto-renewing
- No action required

### Skipped: Advanced Certificate Manager (ACM)

- $120/year for features we don't need: multi-level wildcards, custom CA, custom CSR, dedicated certs
- Universal SSL covers everything

## Security configuration

### Bot Fight Mode: **ON**

- Free tier
- Blocks known-bad bots (heuristics, threat intel, suspicious request patterns)
- No false-positive risk for real users at our scale

### Browser Integrity Check: **ON**

- Default
- Blocks requests with missing or junk User-Agent (almost always bots)

### Security Level: **deprecated in newer UI**

Cloudflare retired the classic Off/Low/Medium/High slider in 2024. Replaced by the granular controls (Bot Fight Mode + Browser Integrity Check + Managed Rules + custom rules). Don't go hunting for it — it doesn't exist.

### AI Labyrinth (Beta): **deferred decision**

- Available, not enabled
- Adds hidden `nofollow` honeypot links targeting bots that ignore `robots.txt`
- Doesn't affect real users; Beta tag is the only reservation
- Decision: leave for now, revisit if AI-scraper bandwidth becomes visible

### Block AI bots: **OFF (deliberate)**

- Cloudflare-managed rule that blocks AI training crawlers (GPTBot, ClaudeBot, Google-Extended, Meta-ExternalAgent, etc.)
- **Tradeoff**: blocking protects content IP from training-data scraping; allowing keeps discoverability via AI-powered search (Perplexity, ChatGPT search, Claude web search, Google AI Overviews).
- For Home2Host (small marketing site looking to acquire managed properties), discoverability via AI search is a real prospective traffic source. Allowing.
- Revisit if (a) bandwidth visibly degrades from AI scrapers, or (b) blog posts become high-value enough that IP protection outweighs discoverability.

### Managed WAF rules: **not available on Free** (Pro+ required)

The named Managed Rulesets UI is paywalled. Cloudflare's baseline DDoS + WAF protections still run automatically without UI control. Don't pay for Pro just for this; the baseline + Bot Fight + custom rules cover our threat model.

### Custom WAF rules: **none yet (5 free slots reserved)**

Custom rules deferred to post-DNS-switch. The most useful candidates are:

- Block requests to known WP attack paths (`/wp-login.php`, `/xmlrpc.php`, `/wp-content/*.php` patterns, `/wp-config.php` probes) — these will be 100% attacker traffic on the new Vercel/Next.js site. **Can't add today** because they'd block legit WP admin access while WP is still live.
- Block requests with empty User-Agent header (marginal benefit; deprioritized).
- Block known-bad ASNs (only useful if attack volume warrants it; not preemptively).

Park the WP-paths rule as a post-DNS-switch task (see [roadmap.md](roadmap.md) Stage 6 follow-ups).

### Rate limiting: **1 rule active**

Free tier gives 1 rate limiting rule. Used on `/admin` to protect the future Payload admin from brute-force attacks at the edge.

| Field | Value |
|---|---|
| Rule name | `admin-brute-force-protection` |
| Match | URI Path contains `/admin` |
| Threshold | 20 requests per 10 seconds |
| Action | Block for 10 seconds |
| Counted by | IP address |

**Free-tier limitations to know:**
- Block duration locked to **10 seconds** (Pro+ unlocks longer durations).
- Period locked to **10 seconds**.

The 10-second block is incremental defense — won't stop a determined attacker (they wait 10s and retry), but kills burst attacks at the edge before they reach Vercel compute. **The real admin protection is Payload's account lockout** (5 attempts → 15 min lock, [`src/payload.config.ts`](../src/payload.config.ts) `users.auth: { maxLoginAttempts, lockTime }`). Cloudflare's rule is the first ring; Payload's lockout is the load-bearing one.

Note: today the rule applies to `/admin` on the WP site (which doesn't have an `/admin` path — WP uses `/wp-admin/`), so it does nothing until DNS switch. Harmless until then.

## Performance + caching configuration

### Speed → Optimization

| Setting | State | Notes |
|---|---|---|
| HTTP/2 | Enabled (default) | |
| HTTP/3 | Enabled | Cloudflare's QUIC support; falls back to H2 on older clients |
| HTTP/2 to Origin | Enabled (default) | Cloudflare↔origin uses H2 |
| 0-RTT Connection Resumption | Enabled | Faster repeated TLS handshakes |
| Always use HTTPS | Enabled | Mirrors the Edge Certificate setting |
| TLS 1.3 | Enabled | |
| Early Hints | Enabled | LCP improvement via early link preload hints |
| Enhanced HTTP/2 Prioritization | Locked (Pro) | Skipped |

### Deprecated / removed by Cloudflare (don't go hunting for these)

| Old setting | Why missing |
|---|---|
| Auto Minify (HTML/CSS/JS) | Deprecated 2024 — broke too many edge cases (JSON-LD comments, special whitespace). Modern build tools (Next.js) minify in production builds anyway. |
| Brotli | Now always-on by default; no toggle. |
| Rocket Loader | Relocated/hidden in newer UIs — was a 2015-era jQuery feature that breaks modern frameworks. We wanted it OFF anyway. |

### Caching → Configuration

| Setting | Value | Reason |
|---|---|---|
| Caching Level | Standard (default) | |
| Browser Cache TTL | Respect Existing Headers | Origin (Next.js post-cutover) sets correct `Cache-Control` per-route; don't override |
| Crawler Hints | ON | Tells search engines when content updated, reduces crawl noise |
| Always Online | ON | If origin goes down, Cloudflare serves the last-cached version — free safety net |

### Caching → Cache Rules

Two rules added (free tier allows 10 cache rules):

| Rule name | Match | Action | Purpose |
|---|---|---|---|
| `bypass-admin-cache` | URI Path starts with `/admin` | Bypass cache | Prevent Cloudflare from caching authenticated Payload admin pages |
| `bypass-api-cache` | URI Path starts with `/api` | Bypass cache | Prevent caching of API responses (REST + GraphQL + custom routes) |

Both rules are no-ops on the current WP origin (those paths don't exist). They activate the moment DNS switches to Vercel.

## What changes at the Vercel DNS switch

The whole point of putting Cloudflare in front *before* the cutover: the DNS switch becomes a Cloudflare edit, not a registrar nameserver change. Propagation is seconds (Cloudflare's edge) instead of hours.

### The cutover playbook

1. **Vercel side**: Project Settings → Domains → add `home2host.com`. Vercel will tell you the target — either A record at their anycast IP (`76.76.21.21`) or CNAME to `cname.vercel-dns.com`. Note which.
2. **Cloudflare DNS**: edit the two `home2host.com` A records → change content from Hostinger IPs (`77.37.76.87`, `92.112.198.111`) to Vercel's. Keep the orange cloud (proxied).
3. **Cloudflare DNS**: delete the two AAAA records (`2a02:4780:51:9b43:4bec:c5d0:2606:756e`, `2a02:4780:4f:cc6b:27d1:60bd:3861:56b5`) — Vercel handles IPv6 itself.
4. **Vercel env vars**: set `NEXT_PUBLIC_SERVER_URL=https://home2host.com` on Production + Preview + Development. Critical: without this, server-side admin auth breaks (see [[payload-serverurl-csrf-trap]] memory note).
5. **Redeploy Vercel** (un-tick "Use existing build cache") so the new env var bakes into the runtime config.
6. **Verify**: `https://home2host.com` should now serve the new Next.js site. Hard-refresh, check headers for `cf-ray` + the right content.

### Don't touch (these stay pointing at Hostinger)

- MX records → Hostinger keeps handling mail. `info@home2host.com` deliveries continue uninterrupted.
- SPF / DMARC TXT
- `autoconfig` / `autodiscover` CNAMEs
- `hostingermail-a/b/c` CNAMEs (Hostinger DKIM)
- `ftp` A record (if FTP access is still needed for the WP site as a backup)

### Post-cutover Cloudflare changes worth making

These were deferred today; revisit after launch is stable:

- **Encryption mode**: confirm Automatic SSL/TLS has upgraded from "Currently running: Full" → "Full (Strict)" (Vercel's cert validates strictly). Cosmetic verification; no action expected.
- **HSTS**: enable in SSL/TLS → Edge Certificates after ~1 week of stable HTTPS. Start with `max-age=300` (5 min) for testing, then bump to `max-age=31536000` (1 year). Once enabled, HSTS is sticky — be confident HTTPS won't break before turning on.
- **Custom WAF rules**: add the WP-attack-path blocker rule (`/wp-login.php`, `/xmlrpc.php`, `/wp-config.php` probes → block). These will be 100% attacker traffic on the new site.
- **Always Online**: still ON. Worth keeping.

### Rollback playbook — Vercel → Hostinger WP

The full operation if you need to switch back to WP after going live on Vercel. Designed to be runnable end-to-end without re-deriving anything. **Time-to-rollback target: under 5 minutes.**

#### When to roll back

Don't roll back for cosmetic glitches or a single broken page — fix forward. Roll back if:

- The site is broadly unreachable (5xx errors across most pages)
- A critical user-facing flow is broken with no quick fix (contact form catastrophically failing, all blog posts 500'ing, admin completely locked)
- A security incident is unfolding that's harder to contain than to revert
- Performance is so degraded (10s+ TTFB) that staying live is worse than reverting

The bar is "noticeably worse than the old WP site for real users." Not "I noticed a typo."

#### Steps (in order)

1. **Cloudflare → DNS** → edit the two `home2host.com` A records → change content **back to the Hostinger IPs**:
   - `77.37.76.87`
   - `92.112.198.111`
   - Both stay orange-cloud (proxied)
2. **Cloudflare → DNS** → **re-add the two AAAA records** that were deleted at switch time (Vercel handles its own IPv6, but Hostinger needs them). Captured 2026-06-26 before the switch:
   - `home2host.com` AAAA `2a02:4780:51:9b43:4bec:c5d0:2606:756e`
   - `home2host.com` AAAA `2a02:4780:4f:cc6b:27d1:60bd:3861:56b5`
   - Both orange-cloud (proxied)
3. **Cloudflare → Caching → Configuration** → click **"Purge Everything"** at the bottom of the page. This clears any cached Vercel content from Cloudflare's edge so visitors see WP immediately instead of stale Vercel responses for cached assets.
4. **Vercel (optional, for hygiene only)**: in Project → Settings → Domains, remove `home2host.com` from the Vercel project. Not strictly required — Vercel will just serve 404s for that hostname which nobody will reach anymore — but it prevents future confusion.
5. **Verify**: hard-refresh `home2host.com` in incognito. Should serve WP. Response headers should show `server: cloudflare` (Cloudflare still in front) and the body should be the WP HTML.

#### Why this works in seconds

- Cloudflare's DNS records propagate at the edge (their own anycast network), not through the global registrar→TLD→nameserver hierarchy. Edit lands across their 300+ POPs in ~5 seconds globally.
- No registrar-level nameserver change happens during rollback — Hostinger's nameservers stay pointing at Cloudflare throughout. The rollback is entirely contained within Cloudflare.
- HSTS is deliberately off (see SSL/TLS section above) so no browser is forcing HTTPS-only behavior that could mask a cert problem during the switch.
- Cloudflare's Universal SSL cert covers `home2host.com` regardless of origin — no TLS hiccup during rollback.

#### What WP loses during the rollback period

- Any blog posts, apartment additions, or Global edits made on the new site between launch and rollback **do not exist on WP**. WP serves the content as of launch day.
- If the owner adds new WP content during the rollback period and you later switch forward to Vercel again, that WP content **won't be on Vercel** either. Lesson: during a rollback period, **freeze content edits on both systems** until the path forward is decided.

#### Forward again after rollback

If the issue gets fixed on Vercel and you want to switch forward again, repeat the original DNS switch (Cloudflare DNS edit: Hostinger IPs → Vercel anycast `76.76.21.21`, delete AAAA), purge Cloudflare cache. Same 5 minutes.

### Pre-switch IPv6 capture — done 2026-06-26

The two `home2host.com` AAAA values were captured from Cloudflare's DNS panel before the Vercel switch and embedded into the rollback playbook above. No further action needed; the rollback steps can be followed verbatim.

## Verification commands

To confirm Cloudflare is actually in the request path:

```bash
# Response headers from a Cloudflare-proxied request
curl -sI https://home2host.com
# Expected: server: cloudflare, cf-ray: <id>, cf-cache-status: <DYNAMIC|HIT|MISS>

# Force connection to a Cloudflare anycast IP (bypasses local DNS cache)
curl -sI --resolve home2host.com:443:104.21.81.86 https://home2host.com
# Same expected headers

# Check nameservers globally (bypass local resolver)
nslookup -type=NS home2host.com 8.8.8.8
# Expected: kobe.ns.cloudflare.com + lola.ns.cloudflare.com

# Check what A records resolve to
nslookup home2host.com 8.8.8.8
# Expected after propagation: Cloudflare anycast IPs (104.21.x.x or 172.67.x.x ranges)

# Global propagation status (visual)
# https://dnschecker.org/#A/home2host.com
```

If the curl shows `server: hcdn` (Hostinger CDN) instead of `server: cloudflare`, your local DNS resolver is still caching the old Hostinger IPs. Real visitors aren't affected — see "Bypass local DNS cache" below.

## Bypass local DNS cache (for owner)

ISP-level DNS caches can hold stale records for up to 24h after nameserver changes. To verify Cloudflare locally without waiting:

1. Switch your system DNS to Cloudflare's `1.1.1.1` / `1.0.0.1` (and IPv6: `2606:4700:4700::1111` / `:1001`).
2. `ipconfig /flushdns` (Windows admin shell).
3. Visit `chrome://net-internals/#dns` → Clear host cache.
4. Reload home2host.com in incognito → check headers for `cf-ray` / `server: cloudflare`.

Real visitors hitting any other DNS resolver (Google, Quad9, their own ISP) will see Cloudflare immediately — global propagation completed within minutes.

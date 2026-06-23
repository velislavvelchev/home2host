// One-shot helper: fetch the EN translation of a live-site blog post and
// emit a clean Markdown-ish dump (title + excerpt + body with headings/lists)
// so the owner can paste it into the Payload admin EN locale.
//
// Usage: node scripts/fetch-en-blog.mjs <slug>
// Example: node scripts/fetch-en-blog.mjs bansko-perfect-for-rental-apartments
//
// Zero deps — uses fetch + a small HTML walker tuned for Astra's
// entry-content markup that the live WP theme emits.

const arg = process.argv[2]
if (!arg) {
  console.error('Usage: node scripts/fetch-en-blog.mjs <slug-or-full-url>')
  process.exit(1)
}

const url = arg.startsWith('http') ? arg : `https://home2host.com/en/${arg}/`
const slug = arg.startsWith('http') ? arg.split('/').filter(Boolean).pop() : arg
const res = await fetch(url, { headers: { 'user-agent': 'h2h-en-pull/1.0' } })
if (!res.ok) {
  console.error(`HTTP ${res.status} for ${url}`)
  process.exit(1)
}
const html = await res.text()

const decode = (s) =>
  s
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '…')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16)))

const stripTags = (s) => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()

const titleMatch = html.match(/<h1[^>]*class="entry-title"[^>]*>([\s\S]*?)<\/h1>/i)
  || html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
const title = titleMatch ? stripTags(titleMatch[1]) : ''

const bodyMatch = html.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/article>/i)
  || html.match(/<div[^>]*class="[^"]*entry-content[^"]*"[^>]*>([\s\S]*?)<footer/i)
const rawBody = bodyMatch ? bodyMatch[1] : ''

const blocks = []
const blockRe = /<(h[1-6]|p|ul|ol|blockquote)([^>]*)>([\s\S]*?)<\/\1>/gi
let m
while ((m = blockRe.exec(rawBody)) !== null) {
  const [, tag, , inner] = m
  const t = tag.toLowerCase()
  if (t === 'ul' || t === 'ol') {
    const items = []
    const liRe = /<li[^>]*>([\s\S]*?)<\/li>/gi
    let li
    while ((li = liRe.exec(inner)) !== null) items.push(stripTags(li[1]))
    if (!items.length) continue
    items.forEach((it, i) => blocks.push(t === 'ol' ? `${i + 1}. ${it}` : `- ${it}`))
    blocks.push('')
    continue
  }
  const txt = stripTags(inner)
  if (!txt) continue
  if (t === 'h1' || t === 'h2') blocks.push('', `## ${txt}`, '')
  else if (t === 'h3') blocks.push('', `### ${txt}`, '')
  else if (t.startsWith('h')) blocks.push('', `#### ${txt}`, '')
  else if (t === 'blockquote') blocks.push(`> ${txt}`, '')
  else blocks.push(txt, '')
}

const body = blocks.join('\n').replace(/\n{3,}/g, '\n\n').trim()
const firstPara = body.split(/\n\n/).find((b) => !b.startsWith('#') && b.length > 30) ?? ''
const excerpt = firstPara.length > 240 ? firstPara.slice(0, 237).replace(/\s+\S*$/, '') + '…' : firstPara

const bar = '='.repeat(72)
console.log(bar)
console.log(`SLUG:    ${slug}`)
console.log(`EN URL:  ${url}`)
console.log(bar)
console.log()
console.log('--- TITLE (EN) ---')
console.log(title)
console.log()
console.log('--- EXCERPT (EN, suggested) ---')
console.log(excerpt)
console.log()
console.log('--- BODY (EN, paste into Lexical editor) ---')
console.log(body)
console.log()

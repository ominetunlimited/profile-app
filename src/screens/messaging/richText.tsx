import type { ReactNode } from 'react'

/**
 * Controlled, safe message formatting. A small tokenizer maps a fixed subset
 * of syntax straight to React elements — user text is only ever rendered as
 * React text nodes, never as HTML, so there is no injection surface.
 *
 * Supported: *bold*, _italic_, ~strike~, `code`, bare http(s) links,
 * "- " bullets, "1. " numbered lines, "> " quotes, blank-line paragraphs.
 */
const INLINE = /(?<![\w*])\*[^*\n]+\*(?![\w*])|(?<![\w_])_[^_\n]+_(?![\w_])|(?<![\w~])~[^~\n]+~(?![\w~])|`[^`\n]+`|https?:\/\/[^\s<]+/g

function inline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let i = 0
  for (const match of text.matchAll(INLINE)) {
    const start = match.index ?? 0
    if (start > last) out.push(text.slice(last, start))
    let token = match[0]
    const key = `${keyBase}-${i++}`
    if (token.startsWith('http')) {
      const trailing = token.match(/[.,;:!?)]+$/)?.[0] ?? ''
      if (trailing) token = token.slice(0, -trailing.length)
      let safe = false
      try {
        const u = new URL(token)
        safe = u.protocol === 'https:' || u.protocol === 'http:'
      } catch {
        safe = false
      }
      out.push(
        safe ? (
          <a key={key} href={token} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2 break-all">
            {token}
          </a>
        ) : (
          token
        ),
      )
      if (trailing) out.push(trailing)
    } else if (token.startsWith('`')) {
      out.push(
        <code key={key} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.85em]">
          {token.slice(1, -1)}
        </code>,
      )
    } else if (token.startsWith('*')) {
      out.push(<strong key={key}>{token.slice(1, -1)}</strong>)
    } else if (token.startsWith('_')) {
      out.push(<em key={key}>{token.slice(1, -1)}</em>)
    } else {
      out.push(<s key={key}>{token.slice(1, -1)}</s>)
    }
    last = start + match[0].length
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function RichText({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n')
  const blocks: ReactNode[] = []
  let i = 0
  let key = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^>\s?/.test(line)) {
      const quoted: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i])) quoted.push(lines[i++].replace(/^>\s?/, ''))
      blocks.push(
        <blockquote key={key++} className="my-1 border-s-2 border-current/40 ps-2 opacity-90">
          {quoted.map((q, n) => (
            <div key={n}>{inline(q, `q${key}-${n}`)}</div>
          ))}
        </blockquote>,
      )
    } else if (/^- /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^- /.test(lines[i])) items.push(lines[i++].slice(2))
      blocks.push(
        <ul key={key++} className="my-1 list-disc ps-5">
          {items.map((it, n) => (
            <li key={n}>{inline(it, `u${key}-${n}`)}</li>
          ))}
        </ul>,
      )
    } else if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) items.push(lines[i++].replace(/^\d+\. /, ''))
      blocks.push(
        <ol key={key++} className="my-1 list-decimal ps-5">
          {items.map((it, n) => (
            <li key={n}>{inline(it, `o${key}-${n}`)}</li>
          ))}
        </ol>,
      )
    } else if (line.trim() === '') {
      blocks.push(<div key={key++} className="h-2" />)
      i++
    } else {
      blocks.push(
        <div key={key++} className="whitespace-pre-wrap break-words">
          {inline(line, `p${key}`)}
        </div>,
      )
      i++
    }
  }
  return <>{blocks}</>
}

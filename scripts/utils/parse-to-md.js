import TurndownService from 'turndown'
import hljs from 'highlight.js'

const getLang = (node) => {
  const { textContent } = node
  const classes = [
    ['cli', 'bash'],
    ['js', 'javascript'],
    ['go', 'go'],
  ]
  const [, lang] =
    classes.find(
      ([c, v]) => node.className.includes(c) || node.className.includes(v),
    ) || []
  if (lang) return lang
  const { language } = hljs.highlightAuto(textContent, [
    'bash',
    'shell',
    'javascript',
    'typescript',
    'css',
    'html',
    'jsx',
    'zsh',
    'json',
    'go',
  ])
  return language
}

const turndown = new TurndownService()
turndown.addRule('customPreCodeBlock', {
  filter: function (node) {
    return node.tagName === 'PRE' && node.textContent
  },
  replacement: function (content, node) {
    const { textContent } = node

    return `\n\n\`\`\` ${getLang(node)}\n${textContent.trim()}\n\`\`\`\n\n`
  },
})
turndown.addRule('customHN', {
  filter: function (node) {
    return /^H[0-9]$/.test(node.tagName) && node.textContent
  },
  replacement: function (content, node) {
    const { textContent, tagName } = node

    return `\n\n${'#'.repeat(
      Number(tagName.replace('H', '')),
    )} ${textContent.replace(/^#|#$/g, '')}\n\n`
  },
})

export const parseToMd = (html) => turndown.turndown(html)

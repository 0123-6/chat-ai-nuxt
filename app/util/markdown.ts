import hljs from 'highlight.js'
import {Marked} from 'marked'
import {markedHighlight} from 'marked-highlight'

// 创建配置好的 marked 实例
export const marked = new Marked(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, {language: lang}).value
        } catch {
          // 高亮失败，降级到自动检测
        }
      }
      return hljs.highlightAuto(code).value
    },
  }),
  {
    breaks: true,
    gfm: true,
  },
)

// 将 Markdown 字符串转为 HTML
export const renderMarkdown = (content: string | undefined): string => {
  if (!content) return ''
  return marked.parse(content) as string
}

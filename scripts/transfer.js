import { dirname, join, relative } from 'node:path'
import { readAllFile } from './utils.js'
import { fileURLToPath } from 'node:url'
import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { ensureFile } from 'fs-extra'

const filename = fileURLToPath(import.meta.url)
;(async () => {
  const { files } = await readAllFile(dirname(filename), {
    shouldReadFile: (p) => p.endsWith('.log'),
    readFileAsync: async (p) => JSON.parse(await readFile(p, 'utf-8'))
  })
  if (files.length > 1) {
    throw Error(`there are ${files.length} logs to copy: 
  ${files.map((i) => i.relativePath).join('\n')}`)
  }
  const [{ relativePath, content }] = files
  console.log(
    `start to copy ${relativePath} after 5 second which containes ${content.length} tasks
you can prevent through enter "control+c"`
  )
  await new Promise((r) => setTimeout(r, 5000))
  const titleMap = new Map([
    ['html', { text: 'html', items: [] }],
    ['javascript', { text: 'javascript', items: [] }],
    ['es6', { text: 'es6', items: [] }],
    ['typescript', { text: 'typescript', items: [] }],
    ['webapi', { text: 'webapi', items: [] }]
  ])
  content.forEach(({ content: { renamePath, titles } }) => {
    const [t1, t2] = titles.filter(Boolean)
    titleMap
      .get(t1)
      .items.push({ text: t2, link: renamePath.replace(/^src\//, '') })
  })
  await Promise.all(
    content
      .map(async (item) => {
        const fielpath = join(filename, '../../', item.content.renamePath)
        await ensureFile(fielpath)
        await copyFile(item.absolutePath, fielpath)
      })
      .concat([
        writeFile(
          join(filename, `../rename-${relativePath}`),
          JSON.stringify(
            {
              '/basic/': [...titleMap.values()]
            },
            null,
            2
          ),
          'utf-8'
        )
      ])
  )
  console.log('transfer success')
})()

import { join, relative } from 'node:path'
import { readAllFile } from './utils/read-all-file.js'
import { fileURLToPath } from 'node:url'
import { copyFile, readFile, writeFile } from 'node:fs/promises'

const filename = fileURLToPath(import.meta.url)
;(async () => {
  const transferPath = join(filename, '../../transfer')
  const { files } = await readAllFile(transferPath, {
    shouldReadFile: (p) => p.endsWith('.md'),
    readFileAsync: async (p) => {
      const text = await readFile(p, 'utf-8')
      const title = text.match(/(^|\n\r?)#\s(.*)\n/)?.[2]?.trim() || ''
      const h2 = []
      text.replace(/(^|\n\r?)##\s(.*)\n/g, (_, __, m) => h2.push(m.trim()))
      const relativePath = relative(transferPath, p)
      return {
        title,
        h2,
        path: p,
        relativePath,
        renamePath: join('src', 'basic', relativePath),
        titles: ['', relativePath.replace(/[\\/].*$/, ''), '', title]
      }
    }
  })
  console.log(files.length)
  await writeFile(
    join(filename, `../origin${Date.now()}.log`),
    JSON.stringify(files, null, 2),
    'utf-8'
  )
})()

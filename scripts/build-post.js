import { ensureDir, exists } from 'fs-extra'
import { rename } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const renameFiles = ['llms-full.txt', 'llms.txt']

const filename = fileURLToPath(import.meta.url)

const toRename = async () => {
  const dir = join(filename, '../../.vitepress/dist')
  const targetDir = join(dir, 'assets/llms')
  await ensureDir(targetDir)
  await Promise.all(
    renameFiles.map(async (fileName) => {
      const filePath = join(dir, fileName)
      if (!(await exists(filePath))) return
      await rename(filePath, join(targetDir, fileName))
      console.log(
        `renamed .vitepress/dist/${fileName} => .vitepress/dist/assets/llm/${fileName}`,
      )
    }),
  )
}

toRename()

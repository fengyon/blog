import { readdir, readFile, lstat } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'

/**
 * 读取所有的文件
 * @param { string } absolutePath 绝对路径
 * @param { { shouldReadDir: (absolutePath: string) => Promise<boolean>, shouldReadFile: (absolutePath: string) => Promise<boolean>, readFileAsync: (absolutePath: string) => Promise<any> } } hooks
 * @returns { Promise<{dirs: Array<{absolutePath: string, relativePath: string}>, files: Array<{absolutePath: string, content: any, relativePath: string}>> } 返回promise，完成了resolve, 失败reject
 */
export const readAllFile = async (absolutePath, hooks = {}) => {
  const shouldReadDir = hooks.shouldReadDir?.bind(hooks) || (() => true)
  const shouldReadFile = hooks.shouldReadFile?.bind(hooks) || (() => true)
  const readFileAsync = hooks.readFileAsync?.bind(hooks) || readFile

  const dirs = []
  const files = []

  const toRead = async (paths) =>
    Promise.all(
      paths.map(async (firstPath) => {
        const fileType = await lstat(firstPath)
        switch (true) {
          case fileType.isDirectory(): {
            const isShouldReadDir = await shouldReadDir(firstPath)
            if (!isShouldReadDir) break
            dirs.push({
              absolutePath: firstPath,
              relativePath: relative(absolutePath, firstPath),
            })
            const newPaths = await readdir(firstPath)
            await toRead(newPaths.map((i) => join(firstPath, i)))
            break
          }
          case fileType.isFile(): {
            const isShouldReadFile = await shouldReadFile(firstPath)
            if (!isShouldReadFile) break
            const content = await readFileAsync(firstPath)
            files.push({
              absolutePath: firstPath,
              relativePath: relative(absolutePath, firstPath),
              content,
            })
            break
          }
          default:
            throw Error(`error the file wasn't read ${firstPath}`)
        }
      }),
    )

  await toRead([absolutePath])

  const sortByPath = () => (a, b) =>
    a.absolutePath.match(/[/\\]/g).length -
      b.absolutePath.match(/[/\\]/g).length || (a > b ? 1 : -1)
  dirs.sort(sortByPath())
  files.sort(sortByPath())

  return { dirs, files }
}

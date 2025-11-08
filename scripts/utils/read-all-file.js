import { readdir, readFile, lstat } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'

const forEachChildrenDeep = (arr, fn) =>
  arr.forEach((item) => {
    item.children && forEachChildrenDeep(item.children, fn)
    fn(item)
  })

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

  const toRead = async (paths) => {
    const result = await Promise.all(
      paths.map(async (firstPath) => {
        const fileType = await lstat(firstPath)
        switch (true) {
          case fileType.isDirectory(): {
            const isShouldReadDir = await shouldReadDir(firstPath)
            if (!isShouldReadDir) return null
            const newPaths = await readdir(firstPath)
            const children = await toRead(
              newPaths.map((i) => join(firstPath, i)),
            )
            return {
              absolutePath: firstPath,
              relativePath: relative(absolutePath, firstPath),
              children,
            }
          }
          case fileType.isFile(): {
            const isShouldReadFile = await shouldReadFile(firstPath)
            if (!isShouldReadFile) return null
            const content = await readFileAsync(firstPath)
            return {
              absolutePath: firstPath,
              relativePath: relative(absolutePath, firstPath),
              content,
            }
          }
          default:
            throw Error(`error the file wasn't read ${firstPath}`)
        }
      }),
    )
    return result.filter(Boolean)
  }

  const result = await toRead([absolutePath])
  const dirs = []
  const files = []
  forEachChildrenDeep(result, (item) =>
    item.children ? dirs.push(item) : files.push(item),
  )
  return { dirs, files }
}

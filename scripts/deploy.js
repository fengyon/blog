import chalk from 'chalk'
import { ensureDir, exists } from 'fs-extra'
import { execSync } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const gitPath = 'git@github.com:fengyon/fengyon.github.io.git'
const projectName = 'fengyon.github.io'

const delay = (ms) => new Promise((res) => setTimeout(res, ms))

const deployDir = join(
  fileURLToPath(import.meta.url),
  '../../deploy',
  projectName,
)

const execSyncWithLog = (...args) => {
  console.log('start exec: ', ...args)
  execSync(...args)
  console.log('end exec: ', ...args)
}

const main = async () => {
  if (!(await exists(join(deployDir)))) {
    await ensureDir(dirname(deployDir))
    execSyncWithLog(`cd "${dirname(deployDir)}" && git clone ${gitPath}`)
  } else {
    console.log(`${deployDir} exsits`)
  }
  console.log(
    chalk.red('！！！将在5s后删除所有历史提交，如有异常，请及时中断'),
  )
  await delay(5000)

  // ！！！删除所有历史提交
  execSyncWithLog(
    `cd "${deployDir}" && rm -rf * && git checkout --orphan temp && git branch -D main && git checkout -b main`,
  )
  await Promise.all(
    [
      ['.gitignore', '.DS_Store\n.AppleDouble\n.LSOverride'],
      ['CNAME', 'hookall.pages.dev'],
      ['.nojekyll', '*.txt'],
    ].map(async ([name, content]) =>
      writeFile(join(deployDir, name), content, 'utf-8'),
    ),
  )
  execSyncWithLog(
    `cp -r ${join(deployDir, '../../.vitepress/dist')}/. ${deployDir}`,
  )
  execSyncWithLog(
    `cd "${deployDir}" && git add . && git commit -m "feat: update build sources" && git push origin main -f`,
  )
}

main()

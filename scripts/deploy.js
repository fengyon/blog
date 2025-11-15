import { ensureDir, exists } from 'fs-extra'
import { execSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const gitPath = 'git@github.com:fengyon/fengyon.github.io.git'
const projectName = 'fengyon.github.io'

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
  execSyncWithLog(`cd "${deployDir}" && git pull && rm -rf *`)
  execSyncWithLog('echo "hookall.pages.dev" > CNAME')
  execSyncWithLog(
    `cp -r ${join(deployDir, '../../.vitepress/dist')}/. ${deployDir}`,
  )

  execSyncWithLog(
    `cd "${deployDir}" && git add . && git commit -m "feat: update build sources" && git push`,
  )
}

main()

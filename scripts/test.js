import { existsSync } from 'fs'
import { Socket } from 'net'
import puppeteer from 'puppeteer-core'
import chalk from 'chalk'
import { Launcher } from 'chrome-launcher'
import { exec } from 'child_process'
import { ROOT_DIR } from './utils/const.js'

const delay = (ms) => new Promise((res) => setTimeout(res, ms))

const logger = {
  log: (msg) => console.log(chalk.gray(msg)),
  success: (msg) => console.log(chalk.green(msg)),
  error: (msg) => console.log(chalk.red(msg)),
}

const tcpPing = (host, port = 80, timeout = 2000) =>
  new Promise((resolve, reject) => {
    const socket = new Socket()
      .connect(port, host, () => socket.destroy() && resolve())
      .on('error', () => socket.destroy() && reject())
      .setTimeout(timeout, () => socket.destroy() && reject())
  })

const testAllPage = async (pageUrl) => {
  logger.log('open browser')
  const browser = await puppeteer.launch({
    headless: false,
    ignoreHTTPSErrors: true,
    executablePath: Launcher.getInstallations().find((item) =>
      existsSync(item),
    ),
    ignoreDefaultArgs: ['--disable-extensions'],
  })
  logger.log('opened browser')
  const visited = new Set()
  const links = new Set([pageUrl])
  const noH1links = new Set()
  try {
    const page = await browser.newPage()
    while (links.size) {
      const { value: link } = links.values().next()
      links.delete(link)
      await page.goto(link, { waitUntil: ['domcontentloaded', 'load'] })
      visited.add(link)
      logger.log('goto ' + link + ' success')
      const { hrefs, title } = await page.evaluate(async () => {
        await new Promise(requestIdleCallback)
        const hrefs = [
          ...(document.querySelectorAll('a[href]') || []),
        ].map((e) => e.href.replace(/#[^#]+$/, '').replace(/\.html$/, ''))
        return {
          hrefs,
          title: document.querySelector(
            '#VPContent > div > div > div.content > main > div > div > h1',
          )?.textContent,
        }
      })
      hrefs.forEach(
        (href) =>
          !visited.has(href) &&
          href.startsWith(pageUrl) &&
          links.add(href),
      )
      !title && noH1links.add(link)
    }
    let i = 1
    noH1links.delete(pageUrl)
    noH1links.forEach((link) => logger.error(`${i++}. ${link} no h1`))
    logger.log(
      `total: ${visited.size}, success: ${chalk.green(
        visited.size - noH1links.size,
      )}, error: ${chalk.red(noH1links.size)}`,
    )
    return noH1links.size === 0
  } finally {
    browser.close()
  }
}
const main = async () => {
  const port = 5173

  try {
    await tcpPing('localhost', port)
  } catch {
    const childProcess = exec('npm start', {
      cwd: ROOT_DIR,
    }).on('error', (error) => {
      console.error(error)
      process.exit(1)
    })
    process.on('exit', () =>
      logger.log(`childProcess killed: ${childProcess.kill()}`),
    )
    await delay(5000)
    await tcpPing('localhost', port)
  }

  logger.success(`server start: http://localhost:${port}`)

  const success = await testAllPage(`http://localhost:${port}/`)
  process.exit(success ? 0 : 1)
}

main()

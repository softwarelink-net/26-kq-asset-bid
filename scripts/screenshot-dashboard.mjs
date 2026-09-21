#!/usr/bin/env node
import { mkdirSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = join(fileURLToPath(import.meta.url), '..', '..')
const outPath = join(root, 'docs', 'assets', 'dashboard-preview.png')
const publicOut = join(root, 'public', 'docs', 'assets', 'dashboard-preview.png')
mkdirSync(dirname(outPath), { recursive: true })
mkdirSync(dirname(publicOut), { recursive: true })

const base = process.argv[2] || 'http://127.0.0.1:5173'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', (msg) => console.log('[console]', msg.type(), msg.text()))
page.on('pageerror', (err) => console.log('[pageerror]', err.message))

await page.goto(`${base}/login`, { waitUntil: 'domcontentloaded', timeout: 60000 })
await page.evaluate(() => {
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch {}
})
await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 })
await page.waitForSelector('input[autocomplete="username"]', { timeout: 30000 })
await page.fill('input[autocomplete="username"]', 'admin')
await page.fill('input[autocomplete="current-password"]', 'Admin@2026')
await page.click('button[type="submit"]')
await page.waitForSelector('text=柯桥经开区国资运营全景态势大屏', { timeout: 60000 })
await page.waitForTimeout(4000)
await page.waitForFunction(() => {
  const canvases = document.querySelectorAll('canvas')
  return canvases.length >= 1
}, { timeout: 20000 }).catch(() => {})
await page.waitForTimeout(800)
await page.screenshot({ path: outPath, fullPage: false })
copyFileSync(outPath, publicOut)
await browser.close()
console.log(`[screenshot] saved => ${outPath}`)
console.log(`[screenshot] copied => ${publicOut}`)

import puppeteer from 'puppeteer'
export const puppeteerRender = async (html: string): Promise<Buffer> => {
  const browser = await puppeteer.launch({
    headless: 'new',
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 1024, height: 810 })
  await page.setContent(html)
  const buffer = await page.screenshot({ fullPage: true })
  await browser.close()

  return buffer
}

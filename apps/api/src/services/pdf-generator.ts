import puppeteer, { type Browser } from 'puppeteer'

let browserPromise: Promise<Browser> | null = null

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH ?? undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    })
  }
  return browserPromise
}

/**
 * Generate a PDF from an HTML string.
 * Returns the PDF as a Buffer ready to stream as a download.
 */
export async function generatePdf(html: string): Promise<Buffer> {
  const browser = await getBrowser()
  const page = await browser.newPage()

  try {
    await page.setContent(html, {
      waitUntil: 'networkidle0',
      timeout: 15000,
    })

    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '15mm', right: '12mm', bottom: '20mm', left: '12mm' },
      displayHeaderFooter: false,
      printBackground: true,
    })

    return Buffer.from(pdf)
  } finally {
    await page.close()
  }
}

/**
 * Clean up the browser instance. Call on process shutdown.
 */
export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise
    await browser.close()
    browserPromise = null
  }
}

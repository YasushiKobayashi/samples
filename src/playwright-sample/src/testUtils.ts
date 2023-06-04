import AxeBuilder from '@axe-core/playwright'

export const baseUrl = 'http://localhost:3000/'
export const baseDir = 'test-results/screenshots'

const axeRunner = async (page: Page, disableRules: string[] = []) => {
  const results = await new AxeBuilder({ page })
    .disableRules(['image-alt', 'color-contrast', 'meta-viewport', 'link-name', ...disableRules])
    .analyze()

  if (results.violations.length > 0) {
    const title = await page.title()
    const url = page.url()
    console.error(title, url, results.violations)
    // test.fail()
  }
}

let i = 1
export const testPage = async (page: Page, basePath: string, disableRules: string[] = []) => {
  await axeRunner(page, disableRules)
  // eslint-disable-next-line no-plusplus
  await page.screenshot({ path: `${basePath}/${i++}.png`, fullPage: true })
}

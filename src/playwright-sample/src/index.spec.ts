/* eslint-disable no-plusplus */

import { expect, test } from '@playwright/test'

import { baseDir, baseUrl, testPage } from './testUtils'

test.describe.parallel('test', () => {
  test('success', async ({ page }, testInfo) => {
    let i = 1
    const basePath = `${baseDir}/${testInfo.title}`
    await page.goto(baseUrl)
    await testPage(page, basePath)

    await page.getByLabel('First Name').fill('hoge')
    await expect(await page.getByLabel('First Name').inputValue()).toBe('hoge')

    await page.screenshot({ path: `${basePath}/${i++}.png`, fullPage: true })
    await testPage(page, basePath)

    await page.getByLabel('Last Name').fill('huga')
    await expect(await page.getByLabel('Last Name').inputValue()).toBe('huga')
    await page.screenshot({ path: `${basePath}/${i++}.png`, fullPage: true })
    await testPage(page, basePath)

    await page.getByRole('button', { name: 'submit' }).click()
    await page.screenshot({ path: `${basePath}/${i++}.png`, fullPage: true })
    await testPage(page, basePath)

    await expect(await page.getByLabel('First Name').inputValue()).toBe('')
    await expect(await page.getByLabel('Last Name').inputValue()).toBe('')
  })

  // test('failure', async ({ page }, testInfo) => {
  //   let i = 1
  //   const basePath = `${baseDir}/${testInfo.title}`
  //   await page.goto(baseUrl);
  //   await page.screenshot({ path: `${basePath}/${i++}.png`, fullPage: true })
  //
  //   await page.getByLabel('First Name').fill('hoge');
  //   await expect(await page.getByLabel('First Name').inputValue()).toBe('hoge');
  //   await page.getByLabel('email').fill('hoge');
  // })
})

import { axeRunner } from '@/testUtils/axeRunner'
import {
  composeStoriesWithMsw,
  registerMswCleanup,
  renderStory,
} from '@/testUtils/storybookMswSetup'

import * as stories from './UserCard.story'

registerMswCleanup()
const { Primary, NotFound } = composeStoriesWithMsw(stories)

describe('atoms/UserCard', () => {
  it('Primary: 取得した user 情報を表示する', async () => {
    const container = await renderStory(Primary)
    expect(await axeRunner(container)).toHaveNoViolations()
  })

  it('NotFound: 404 ならエラーメッセージを表示する', async () => {
    const container = await renderStory(NotFound)
    expect(await axeRunner(container)).toHaveNoViolations()
  })
})

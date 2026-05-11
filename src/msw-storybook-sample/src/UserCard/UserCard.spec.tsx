import {
  composeStoriesWithMsw,
  registerMswCleanup,
  renderStory,
} from '@/testUtils/storybookMswSetup'

import * as stories from './UserCard.story'

registerMswCleanup()
const { Primary, NotFound } = composeStoriesWithMsw(stories)

describe('UserCard', () => {
  it('Primary: 取得した user 情報を表示する', async () => {
    await renderStory(Primary)
  })

  it('NotFound: 404 ならエラーメッセージを表示する', async () => {
    await renderStory(NotFound)
  })
})

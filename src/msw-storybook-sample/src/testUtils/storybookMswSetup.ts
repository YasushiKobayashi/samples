import { composeStories } from '@storybook/react-vite'
import { getWorker } from 'msw-storybook-addon'
import { afterAll } from 'vitest'

import preview from '../../.storybook/preview'

// composeStories の第 2 引数で preview を渡すと、
// preview.loaders (= mswLoader) が Story 実行時に走る。
export const composeStoriesWithMsw = <T extends Parameters<typeof composeStories>[0]>(stories: T) =>
  composeStories(stories, preview as Parameters<typeof composeStories>[1])

let cleanupRegistered = false
export const registerMswCleanup = () => {
  if (cleanupRegistered) return
  cleanupRegistered = true
  afterAll(async () => {
    const worker = getWorker()
    if (worker && 'close' in worker && typeof worker.close === 'function') {
      await worker.close()
    }
  })
}

interface RunnableStory {
  run: (options?: { canvasElement?: HTMLElement }) => Promise<void>
}

export const renderStory = async (Story: RunnableStory): Promise<HTMLElement> => {
  const canvasElement = document.createElement('div')
  document.body.appendChild(canvasElement)
  await Story.run({ canvasElement })
  return canvasElement
}

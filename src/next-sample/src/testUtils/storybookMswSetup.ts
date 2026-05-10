import { composeStories } from '@storybook/react'
import { getWorker } from 'msw-storybook-addon'
import { afterAll } from 'vitest'

import preview from '../../.storybook/preview'

// composeStories の第2引数で preview を明示的に渡すことで、
// setProjectAnnotations のグローバル副作用を避けつつ
// preview.loaders (= mswLoader) を Story 実行時に走らせる。
export const composeStoriesWithMsw = <T extends Parameters<typeof composeStories>[0]>(stories: T) =>
  composeStories(stories, preview as Parameters<typeof composeStories>[1])

// MSW server / worker は process / browser に常駐するため
// テストファイル間でハンドラーが残らないよう afterAll で1度だけ閉じる。
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

// Story を vitest からそのまま実行するためのラッパー。
// canvasElement を作って Story.run に渡し、loaders/decorators/play を Storybook と同じ順序で実行させる。
export const renderStory = async (Story: RunnableStory): Promise<HTMLElement> => {
  const canvasElement = document.createElement('div')
  document.body.appendChild(canvasElement)
  await Story.run({ canvasElement })
  return canvasElement
}

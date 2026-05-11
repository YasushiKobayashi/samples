import type { Meta, StoryObj } from '@storybook/react-vite'
import { delay, http, HttpResponse } from 'msw'
import { expect, within } from 'storybook/test'

import { UserCard } from './UserCard'

export default {
  title: 'UserCard',
  component: UserCard,
} as Meta<typeof UserCard>
type Story = StoryObj<typeof UserCard>

export const Primary: Story = {
  args: { userId: 1 },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/users/:id', ({ params }) =>
          HttpResponse.json({
            id: Number(params.id),
            name: 'LeBron James',
            email: 'lebron@example.com',
          }),
        ),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    expect(await canvas.findByText('LeBron James')).toBeInTheDocument()
    expect(canvas.getByText('lebron@example.com')).toBeInTheDocument()
  },
}

export const NotFound: Story = {
  args: { userId: 999 },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/users/:id', async () => {
          await delay(50)
          return new HttpResponse(null, { status: 404 })
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const alert = await canvas.findByRole('alert')
    expect(alert).toHaveTextContent('読み込みに失敗しました: status 404')
  },
}

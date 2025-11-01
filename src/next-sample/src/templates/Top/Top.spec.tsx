import * as React from 'react'
import { act, cleanup, render, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { vi } from 'vitest'

import { axeRunner } from '@/testUtils/axeRunner'
import { Top } from './Top'

describe('templates/Top', () => {
  afterEach(() => {
    cleanup()
  })

  it('Snap Shot', async () => {
    const submit = vi.fn()
    const props = { submit }

    const { container, asFragment, getByLabelText, getByRole } = render(<Top {...props} />)
    expect(asFragment()).toMatchSnapshot()

    await act(async () => {
      const user = userEvent.setup()
      await waitFor(async () => {
        await user.type(getByLabelText('First Name'), 'LeBron')
        await user.type(getByLabelText('Last Name'), 'James')
        await user.click(getByRole('button', { name: 'submit' }))
      })

      expect(submit).toHaveBeenCalledWith({
        firstName: 'LeBron',
        lastName: 'James',
      })
      expect(submit).toHaveBeenCalledTimes(1)
      expect(await axeRunner(container)).toHaveNoViolations()
    })
  })
})

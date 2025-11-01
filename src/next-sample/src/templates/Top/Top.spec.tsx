import * as React from 'react'
import { act, cleanup, fireEvent, render } from '@testing-library/react'
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
      fireEvent.change(getByLabelText('First Name'), { target: { value: 'LeBron' } })
      fireEvent.change(getByLabelText('Last Name'), { target: { value: 'James' } })
      fireEvent.click(getByRole('button', { name: 'submit' }))

      expect(submit).toHaveBeenCalledWith({
        firstName: 'LeBron',
        lastName: 'James',
      })
      expect(submit).toHaveBeenCalledTimes(1)
      expect(await axeRunner(container)).toHaveNoViolations()
    })
  })
})

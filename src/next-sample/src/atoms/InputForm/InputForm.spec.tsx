import * as React from 'react'
import { act, render, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { vi } from 'vitest'

import { axeRunner } from '@/testUtils/axeRunner'
import { InputForm } from './InputForm'

describe('atoms/InputForm', () => {
  it('Snap Shot', async () => {
    const onChange = vi.fn()
    const props = {
      id: 'id',
      label: 'label',
      val: '',
      onChange,
    }

    const { container, asFragment, getByLabelText } = render(<InputForm {...props} />)
    expect(asFragment()).toMatchSnapshot()

    await act(async () => {
      const user = userEvent.setup()
      await waitFor(async () => {
        await user.type(getByLabelText('label'), 'v')
      })
      expect(onChange).toHaveBeenCalledWith('v')
      expect(await axeRunner(container)).toHaveNoViolations()
    })
  })
})

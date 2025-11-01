import * as React from 'react'
import { act, fireEvent, render } from '@testing-library/react'
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
      fireEvent.change(getByLabelText('label'), { target: { value: 'v' } })
      expect(onChange).toHaveBeenCalledWith('v')
      expect(await axeRunner(container)).toHaveNoViolations()
    })
  })
})

import * as React from 'react'

import { InputForm } from '@/atoms/InputForm/InputForm'

interface Form {
  firstName: string
  lastName: string
}

const initialState: Form = {
  firstName: '',
  lastName: '',
}

interface Props {
  submit: (val: Form) => void
}

export const Top: React.FC<Props> = ({ submit }) => {
  const [form, setForm] = React.useState<Form>({ ...initialState })

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    submit(form)
  }

  return (
    <form onSubmit={onSubmit}>
      <div style={{ marginBottom: 16 }}>
        <InputForm
          val={form.firstName}
          id="firstName"
          label="First Name"
          onChange={v => setForm({ ...form, firstName: v })}
        />
      </div>
      <div style={{ marginBottom: 16 }}>
        <InputForm
          val={form.lastName}
          id="lastName"
          label="Last Name"
          onChange={v => setForm({ ...form, lastName: v })}
        />
      </div>
      <button type="submit">submit</button>
    </form>
  )
}

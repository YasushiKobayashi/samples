import * as React from 'react'

interface Props {
  id: string
  label: string
  val: string
  onChange: (v: string) => void
}

const InputForm: React.FC<Props> = ({ id, label, val, onChange }) => {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input type="text" id={id} value={val} onChange={e => onChange(e.currentTarget.value)} />
    </div>
  )
}

const initialState = {
  firstName: '',
  lastName: '',
}

const Pages: React.FC = () => {
  const [form, setForm] = React.useState({ ...initialState })

  const submit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    setForm(initialState)
  }

  console.log(form)

  return (
    <form onSubmit={submit}>
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

export default Pages

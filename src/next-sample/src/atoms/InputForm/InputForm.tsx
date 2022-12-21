import * as React from 'react'

interface Props {
  id: string
  label: string
  val: string
  onChange: (v: string) => void
}

export const InputForm: React.FC<Props> = ({ id, label, val, onChange }) => {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input type="text" id={id} value={val} onChange={e => onChange(e.currentTarget.value)} />
    </div>
  )
}

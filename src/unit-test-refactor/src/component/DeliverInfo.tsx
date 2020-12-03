import * as React from 'react'

import { getUserFullAddress, UserType } from '@/models/user'

interface Props {
  user: UserType
}

export const DeliverInfo: React.FC<Props> = ({ user }) => {
  return (
    <>
      <h2>配送先情報</h2>
      <p>{`${user.name}様`}</p>
      <p>{`〒${getUserFullAddress(user)}`}</p>
    </>
  )
}

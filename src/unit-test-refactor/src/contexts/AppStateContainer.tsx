import * as React from 'react'
import { createContainer } from 'unstated-next'

import { UserType } from '@/models/user'

interface StateType {
  user?: UserType
}

const initialState = {}

const useApp = (state: StateType = initialState) => {
  const [user, updateUser] = React.useState<UserType | undefined>(state?.user)

  return {
    user,
    updateUser,
  }
}

export const AppStateContainer = createContainer(useApp)

import * as React from 'react'

export const Bad: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  return (
    <>
      {isAdmin && <p>adminにはこれを見せるよ</p>}
      {!isAdmin && <p>userにはこっち見せるよ</p>}
      <p>両方に見せるよ</p>
      {isAdmin && <p>adminだけこの情報も見せるよ</p>}
    </>
  )
}

export const Better: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  if (isAdmin) {
    return (
      <>
        <p>adminにはこれを見せるよ</p>
        <p>両方に見せるよ</p>
        <p>adminだけこの情報も見せるよ</p>
      </>
    )
  }

  return (
    <>
      <p>userにはこっち見せるよ</p>
      <p>両方に見せるよ</p>
    </>
  )
}

const AdminComponent = () => {
  return (
    <>
      <p>adminにはこれを見せるよ</p>
      <p>両方に見せるよ</p>
      <p>adminだけこの情報も見せるよ</p>
    </>
  )
}

const UserComponent = () => {
  return (
    <>
      <p>userにはこっち見せるよ</p>
      <p>両方に見せるよ</p>
    </>
  )
}

export const Good: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  if (isAdmin) {
    return <AdminComponent />
  }

  return <UserComponent />
}

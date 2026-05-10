import * as React from 'react'

interface User {
  id: number
  name: string
  email: string
}

interface Props {
  userId: number
}

export const UserCard: React.FC<Props> = ({ userId }) => {
  const [user, setUser] = React.useState<User | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    setUser(null)
    setError(null)
    fetch(`/api/users/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error(`status ${res.status}`)
        return res.json() as Promise<User>
      })
      .then(data => {
        if (!cancelled) setUser(data)
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  if (error) return <p role="alert">読み込みに失敗しました: {error}</p>
  if (!user) return <p>Loading...</p>

  return (
    <section aria-label="user card">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </section>
  )
}

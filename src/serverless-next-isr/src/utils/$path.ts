export const pagesPath = {
  $404: {
    $url: (url?: { hash?: string }) => ({ pathname: '/404' as const, hash: url?.hash }),
  },
  posts: {
    _id: (id: string | number) => ({
      $url: (url?: { hash?: string }) => ({
        pathname: '/posts/[id]' as const,
        query: { id },
        hash: url?.hash,
      }),
    }),
  },
  $url: (url?: { hash?: string }) => ({ pathname: '/' as const, hash: url?.hash }),
}

export type PagesPath = typeof pagesPath

export const staticPath = {
  _gitignore: '/.gitignore',
} as const

export type StaticPath = typeof staticPath

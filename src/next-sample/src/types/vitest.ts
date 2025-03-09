import type { AxeMatchers } from 'vitest-axe/matchers'

import 'vitest'

declare module 'vitest' {
  export type Assertion = AxeMatchers
  export type AsymmetricMatchersContaining = AxeMatchers
}

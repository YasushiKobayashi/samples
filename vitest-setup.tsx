import { expect } from 'vitest'
import * as matchers from 'vitest-axe/matchers'

import 'vitest-axe/extend-expect'
import 'vitest-canvas-mock'

expect.extend(matchers)

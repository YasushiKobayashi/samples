import { toHaveNoViolations } from 'jest-axe'

import '@testing-library/jest-dom'
import 'jest-axe/extend-expect'

expect.extend(toHaveNoViolations)

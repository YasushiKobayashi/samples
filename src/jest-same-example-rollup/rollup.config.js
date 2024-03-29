import alias from '@rollup/plugin-alias'
import fs from 'fs'
import path from 'path'
import analyze from 'rollup-plugin-analyzer'
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import { terser } from 'rollup-plugin-terser'
import typescript from 'rollup-plugin-typescript2'

const pkg = require('./package.json')

const extensions = ['*', '.mjs', '.js', '.jsx', '.json', '.ts', '.tsx', '.gql', '.graphql']

const plugins = [
  terser(),
  nodeResolve({
    extensions,
    browser: true,
    include: 'node_modules/**',
  }),
  commonjs(),
  typescript(),
  alias({
    entries: {
      '@': path.resolve('./src'),
    },
  }),
  analyze({ showExports: true, writeTo: analysis => fs.writeFileSync('analyze.txt', analysis) }),
]

export default [
  {
    input: './src/jest-same-example-rollup.tsx',
    output: [
      {
        sourcemap: true,
        name: pkg.name,
        file: pkg.main,
        format: 'cjs',
      },
      {
        sourcemap: true,
        name: pkg.name,
        file: pkg.module,
        format: 'es',
      },
    ],
    external: ['prop-types', 'react', 'react-dom', '@testing-library/react'],
    plugins,
  },
]

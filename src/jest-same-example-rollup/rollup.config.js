import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import analyze from 'rollup-plugin-analyzer'
import alias from '@rollup/plugin-alias'
import { terser } from 'rollup-plugin-terser'

import path from 'path'

import fs from 'fs'

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
  typescript({
    tsconfig: 'tsconfig.json',
  }),
  alias({
    entries: {
      '@': path.resolve('./src'),
    },
  }),
  analyze({ showExports: true, writeTo: analysis => fs.writeFileSync('analyze.txt', analysis) }),
]

export default [
  {
    input: './src/main.ts',
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
    external: [],
    plugins,
  },
]

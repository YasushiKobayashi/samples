import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import typescript from 'rollup-plugin-typescript2'
import analyze from 'rollup-plugin-analyzer'
import fs from 'fs'

const pkg = require('./package.json')

const extensions = ['*', '.mjs', '.js', '.jsx', '.json', '.ts', '.tsx', '.gql', '.graphql']

const plugins = [
  nodeResolve({
    extensions,
    include: 'node_modules/**',
  }),
  commonjs(),
  typescript({
    tsconfig: 'tsconfig.json',
  }),
]

if (process.env.NODE_ENV === 'production') {
  plugins.push(babili({ comments: false }))
} else {
  plugins.push(
    analyze({ showExports: true, writeTo: analysis => fs.writeFileSync('analyze.txt', analysis) }),
  )
}

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

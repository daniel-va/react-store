import resolve from '@rollup/plugin-node-resolve'
import typescript from 'rollup-plugin-ts'
import commonjs from '@rollup/plugin-commonjs'

import packageJson from './package.json'

const config = {
  input: 'src/index.ts',
  output: [
    {
      file: packageJson.main,
      format: 'cjs', // commonJS
      sourcemap: true,
    },
    {
      file: packageJson.module,
      format: 'esm', // ES Modules
      sourcemap: true,
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript(),
  ],
  external: [
    'react',
    'react-dom',
  ],
}
export default config

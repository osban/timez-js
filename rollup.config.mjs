import inject   from '@rollup/plugin-inject'
import progress from 'rollup-plugin-progress'
import resolve  from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import buble    from '@rollup/plugin-buble'
import filesize from 'rollup-plugin-filesize'

export default (async () => ({
  input: 'src/index.mjs',
  output: {
    file: 'app.js',
    format: 'iife'
  },
  plugins: [
	  inject({
      include: 'src/**/*.mjs',
      exclude: 'node_modules/**',
      modules: {
        m: 'mithril'
      }
    }),
    progress(),
    resolve(), // tells Rollup how to find node_modules
    commonjs(), // converts to ES modules
	  buble({
      transforms: {
        templateString: false, // template strings are not supported yet
        dangerousForOf: true, // try for...of -- otherwise: forOf: false
        asyncAwait    : false // async arrow functions are not yet supported
      },
      objectAssign: true // transpile object spread operators
    }),
	  filesize()
  ]
}))()
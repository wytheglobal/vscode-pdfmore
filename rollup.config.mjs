import postcss from 'rollup-plugin-postcss';

const commonConfig = {
  plugins: [
    postcss({
      // extract: 'bundle.css',
      plugins: [],
    }),
  ],
};

// export default {
//   input: {
//     // main: 'src/entry/main.js',
//     scriptPrependBody: 'src/entry/script_prepend_body.js',
//     scriptAppendBody: 'src/entry/script_append_body.js',
//   },
//   output: {
//     dir: 'dist',
//     entryFileNames: '[name].js',
//     format: 'iife',
//   },
//   plugins: [
//     postcss({
//       // extract: 'bundle.css',
//       plugins: [],
//     }),
//   ],
// };
export default [
  {
    ...commonConfig,
    input: 'src/entry/script_prepend_body.js',
    output: {
      file: 'dist/script_prepend_body.js',
      format: 'iife', // Output Format: Immediately Invoked Function Expression
      name: 'bundleA' // Required for IIFE/UMD formats
    },
  },
  {
    ...commonConfig,
    input: 'src/entry/script_append_body.js',
    output: {
      file: 'dist/script_append_body.js',
      format: 'iife',
      name: 'bundleB'
    }
  }
];

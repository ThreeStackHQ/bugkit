import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

const banner = `/*!
 * BugKit Reporter Widget v0.1.0
 * https://threestack.io
 * (c) ThreeStack - MIT License
 */`;

/** @type {import('rollup').RollupOptions[]} */
const config = [
  // Unminified
  {
    input: "src/bugkit.ts",
    output: {
      file: "dist/bugkit.js",
      format: "iife",
      name: "BugKit",
      banner,
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json", sourceMap: false }),
    ],
  },
  // Minified
  {
    input: "src/bugkit.ts",
    output: {
      file: "dist/bugkit.min.js",
      format: "iife",
      name: "BugKit",
      banner,
    },
    plugins: [
      resolve({ browser: true }),
      commonjs(),
      typescript({ tsconfig: "./tsconfig.json", sourceMap: false }),
      terser({ format: { comments: /BugKit/ } }),
    ],
  },
];

export default config;

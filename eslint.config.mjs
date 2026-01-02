import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config[]} */
export default [
  // 1) Global ignore for dist (replacement for .eslintignore)
  {
    ignores: ["dist/**"],
  },

  // 2) ESLint's recommended rules
  pluginJs.configs.recommended,

  // 3) Your custom globals
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        describe: true, // Used for grouping tests
        test: true, // Used to create tests
        it: true, // Alternative way to create tests
        expect: true, // Used for test assertions
        require: true, // Used in Node.js files like Tailwind config
        module: true, // Used in Node.js files like Tailwind config
        process: true, // Used for environment variables later
      },
    },
  },
];

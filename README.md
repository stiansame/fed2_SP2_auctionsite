# FED2 SP2 **Noroff TradeHub**

## Tools & Tech

- [x] **Tailwind CSS** - A utility-first CSS framework for quickly building modern, consistent UIs.
- [x] **ESLint** - A configurable linting tool that enforces JavaScript and TypeScript code quality.
- [x] **Prettier** - An opinionated formatter that ensures consistent code style automatically.
- [x] **Husky** - A tool for managing Git hooks to automate checks during the commit process.
- [x] **VITE** - A fast frontend build tool with an efficient dev server and optimized builds.
- [x] **Vitest** - A lightweight, fast testing framework designed for Vite projects.
- [x] **Playwright** - A cross-browser automation framework for reliable end-to-end testing.
- [x] **JSDOM** - A JavaScript implementation of the DOM for testing without a real browser.

## Installation

### ✅ Prerequisites

Ensure you have the following installed:

- **Node.js**
- **npm, pnpm or yarn**

Verify installation:

```
node -v
npm -v
```

### 📥Get the repository

**CLONE**

```
git clone https://github.com/stiansame/fed2_SP2_auctionsite.git
```

**Or Download ZIP**

1. Open the repo on GitHub
2. Click Code → Download ZIP
3. Extract and open the folder in your editor

**or Fork**

1. Click Fork in the GitHub UI
2. Clone your fork locally

## Commands & Useage

### 🎨Tailwind CSS

- Tailwind is configured via `tailwind.config.js`.
- To build your css, run:
  ```
  npm run dev-css
  ```

### 🔍ESLint

- To lint your code, you can run:
  ```
  npm run lint
  ```
- ESLint will check your JS files for issues and suggest fixes

### ✨Prettier

- To format your code, run:
  ```
  npx prettier --write .
  ```
- Prettier will format your feiles automatically for a consitent style
- You can configure prettier in the prettier config.file `prettierrc`
- See [https://prettier.io/docs/configuration](https://prettier.io/docs/configuration) for instructions and usage

### 🧩Husky

- Husky is used for Git hooks (e.g., pre-commit).
- Hooks are configured in the `.husky` directory.
- Husky will automatically run checks (like linting or formatting) before commits.

### 🧪VITE + VITEST

- To run VITE, use:
  ```
  npm run dev
  ```
- To BUILD using VITE, use:
  ```
  npm run build //IMPORTANT
  ```
- to run tests using Vitest, use:
  ```
  npm run unit-test
  ```
- Add all your own tests using Vitest conventions (eg. `*test.js`)

### 🧭Playwright

- Playwright is used for E2E browser testing.
- To run Playwright tests, use:
  ```
  npm run playwright
  ```
- This will run playwright in headless mode
- You can also use one of the following commands:
  ```
  npx playwright test --UI //Runs playwright with UI
  npx playwright test --headed //Shows actual browsers while tests are running
  npx playwright test --debug //Runs tests step by step for debugging
  ```
- Test files are located in `js/test/playwright`. Make sure to follow playwright conventions when writing your own tests (eg `*.test.js` or `*.spec.js`)
- Playwright uses **Enviroment variables** for tests: Add an `.env`file in your project containing:

```
E2E_BASE_URL=http://localhost:5173
E2E_USER_EMAIL=your-test-email@example.com
E2E_USER_PASSWORD=your-test-password
```

- See [Playwright documentation](https://playwright.dev/docs/intro) for full documentation

### 🌐 Live-server (Static server)

- To use with playwright if you don't want to use VITE
- Remember to configure `playwright.config.js` if you want to use
- to run, use:

```
npm run start
```

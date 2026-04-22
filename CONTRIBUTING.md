# Contributing to Loopy OSS

Thank you for your interest in contributing. This document explains how to get started.

---

## Ways to Contribute

- **Report a bug** — Open an issue with a clear description and steps to reproduce
- **Suggest a feature** — Open a GitHub Discussion before building something large
- **Write code** — Fix a bug or implement a feature from the issue tracker
- **Improve docs** — Fix typos, add examples, or write new guides in `packages/docs/`
- **Share integrations** — Add examples for Claude Desktop, Cursor, LangChain, or others

---

## Development Setup

### Prerequisites

- Node.js 20+
- npm 10+
- Docker (for self-hosting and database)

### Install

```bash
git clone https://github.com/loopy-thinking/loopy-oss.git
cd loopy-oss
npm install
```

This repo uses [Turborepo](https://turbo.build). To build all packages:

```bash
npx turbo build
```

To run tests:

```bash
npx turbo test
```

---

## Pull Request Process

1. Fork the repository and create a branch from `main`
2. Make your changes with clear, focused commits
3. Add or update tests as needed
4. Open a PR with a description of what you changed and why
5. A maintainer will review within 3–5 business days

For large changes (new packages, breaking API changes), please open a Discussion first so we can align before you invest significant time.

---

## Code Style

- TypeScript throughout (no `any` without a comment explaining why)
- Prettier for formatting — run `npm run format` before committing
- Keep commits small and coherent; one logical change per commit

---

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Be kind, be constructive, assume good faith.

---

## Questions?

Open a [GitHub Discussion](https://github.com/loopy-thinking/loopy-oss/discussions) or email [dev@loopy-thinking.com](mailto:dev@loopy-thinking.com).

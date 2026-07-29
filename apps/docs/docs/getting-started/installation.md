---
sidebar_position: 1
title: Installation
---

# Installation

:::note[Placeholder]
This page will contain detailed installation instructions once KairoUI packages are published.
:::

## Prerequisites

| Tool    | Version   |
| ------- | --------- |
| Node.js | >= 20.0.0 |
| pnpm    | 9.15.4    |
| React   | >= 19.0.0 |

## Install packages

```bash
# Once published, install individual packages:
pnpm add @kairoui/core @kairoui/theme @kairoui/tokens
```

## Peer dependencies

KairoUI packages declare `react` and `react-dom` as peer dependencies. Ensure your application provides them:

```bash
pnpm add react react-dom
```

## TypeScript

KairoUI is written in TypeScript and ships type declarations. No additional `@types/*` packages are required.

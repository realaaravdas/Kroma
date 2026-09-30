# Kroma Cloud IDE

Kroma is a minimalist, high-performance cloud IDE with multi-file workspaces, syntax recognition, built-in terminal support, Git source control, and integrated AI capabilities.

## Features

- Multi-file editor and file tree
- Search, command palette, and settings panels
- Git and GitHub integration UI
- Built-in terminal and compiler service integrations
- Gemini-powered assistant features

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- Express (runtime/server utilities)

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and set required values:

- `GEMINI_API_KEY`
- `APP_URL`

### Run Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Available Scripts

- `npm run dev` – start Vite dev server on port 3000
- `npm run build` – create production build
- `npm run preview` – preview production build
- `npm run clean` – remove build artifacts
- `npm run lint` – run TypeScript type checks

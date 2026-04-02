# ERP Application - Electron + Vite + React

A desktop ERP application built with Electron, Vite, and React for offline use.

## Features

- **Offline First**: Works without internet connection
- **Fast Development**: Vite provides instant HMR
- **Single EXE**: Packages everything into one installer
- **Modern UI**: Built with React

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development

Run the app in development mode with hot reload:

```bash
npm run electron:dev
```

### Build for Production

Build the application and create a Windows installer:

```bash
npm run electron:build
```

The installer will be created in the `release/` directory.

### Run Production Build

To run the app in production mode (without dev server):

```bash
npm run build
npm run electron:start
```

## Project Structure

```
electron-erp-app/
├── src/
│   ├── main.jsx      # React entry point
│   ├── App.jsx       # Main React component
│   ├── App.css       # App styles
│   └── index.css     # Global styles
├── public/
│   └── vite.svg      # App icon
├── main.js           # Electron main process
├── index.html        # HTML entry point
├── vite.config.js    # Vite configuration
└── package.json      # Project dependencies
```

## Configuration

### Vite Configuration (vite.config.js)

- `base: './'` - Uses relative paths for offline compatibility
- `build.outDir: 'dist'` - Output directory for built files

### Electron Builder Configuration (package.json)

- `appId: 'com.electron.erp'` - Unique app identifier
- `win.target: 'nsis'` - Creates Windows installer
- `nsis.oneClick: false` - Allows custom installation directory

## Why Vite + Electron?

1. **No Server Issues**: Vite builds plain HTML/JS files
2. **Faster Builds**: Much lighter than Next.js
3. **Better Offline Support**: Easy to connect local databases
4. **Hot Module Replacement**: Fast development experience
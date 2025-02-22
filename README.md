
# QuickScribe App

A sleek and modern note-taking app with a dark-themed interface that allows users to easily create, save, and manage notes.

## Table of Contents

- [Getting Started](#getting-started)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
  - [Run with Nodemon](#run-with-nodemon)
  - [Run with Node](#run-with-node)
- [Why Use Nodemon](#why-use-nodemon)
- [Available Scripts](#available-scripts)
- [License](#license)

## Getting Started

These instructions will guide you through the setup of this project on your local machine.

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation

1. **Clone the repository** to your local machine:

   ```bash
   git clone <repository-url>
   ```

2. Navigate to your project directory:

   ```bash
   cd my-notes-app
   ```

3. Install project dependencies:

   ```bash
   npm install
   ```

## Usage

You can run the application in two ways: with nodemon or node.

### Run with Nodemon

`nodemon` is a development tool that watches for changes in your files and automatically restarts the server when changes are made. This is particularly useful during development.

To start the application with nodemon, run the following command:

```bash
npx nodemon index.js
```

This will start the application and automatically restart it whenever you make changes to `index.js` or any other watched files.

### Run with Node

If you prefer not to use nodemon and don't need automatic restarts, you can run the application with the standard `node` command.

To start the application without auto-reloading:

```bash
node index.js
```

This will start the application, but you will need to manually restart the server if you make changes to the code.

## Why Use Nodemon

`nodemon` is recommended for development because it automatically restarts your application whenever you modify the code. This allows you to see changes in real-time without needing to manually restart the server each time. It is especially helpful when you are frequently modifying your application and want to maintain an efficient workflow.

## Available Scripts

You can also use the following npm scripts:

- `npm start`: Start the application with `node index.js` (without auto-reloading).

  ```bash
  npm start
  ```

- `npm run dev`: Example script for running the app in a development setup (adjust if needed for your project).

  ```bash
  npm run dev
  ```

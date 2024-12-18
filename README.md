# My Notes App

A sleek and modern note-taking app with a dark-themed interface that allows users to easily create, save, and manage notes.

## Getting Started

Follow these steps to get the project running on your local machine.

### 
1. Clone the repository

Start by cloning the repository to your local machine:

git clone <repository-url>

2. Navigate to your project directory
Change into the project directory:

cd my-notes-app

3. Install dependencies
Even though the package.json file is included, you still need to install the necessary dependencies listed in it. Run:

npm install

This will install all the required dependencies for your project.

4. Run the application
   You have two ways to run the application:
Option 1: Using nodemon
nodemon is a utility that monitors for changes in files and automatically restarts the server when a change is detected. This is helpful during development, as it saves you the time of manually stopping and starting the server.
To run the application with nodemon, use the following command:

npx nodemon index.js

This will start the application, and it will automatically restart the server whenever you modify index.js or any other watched files.

Option 2: Using node
If you prefer not to use nodemon and don't need automatic restarts, you can run the application with the standard node command:

node index.js

This will start the application, but you'll need to manually restart the server if you make changes to the code.

Why use nodemon?
Using nodemon is recommended during development because it automatically restarts the application when changes are made to the code, which saves you time and ensures that the application is always running the latest version of the code. It's particularly useful when you are frequently modifying your code and want to see changes immediately without having to manually restart the server.

Scripts
You can also run the following npm scripts:

npm start: Start the application (without auto-reloading, uses node index.js).
npm run dev: Example script for running the app with a development setup (adjust as needed).

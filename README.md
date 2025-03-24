# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# Kitchen Inventory App

A React application for managing kitchen inventory, scanning barcodes, and generating recipe suggestions.

## Features

- Inventory management with barcode scanning
- Firebase integration for data storage
- Recipe suggestions using Claude AI
- Responsive UI with Shadcn/UI components

## Firebase Deployment

The app is configured to deploy to Firebase with hosting for the front-end and Cloud Functions for the Claude API proxy.

### Prerequisites

- Node.js and npm
- Firebase CLI: `npm install -g firebase-tools`
- A Firebase project (current config uses "barcode-scanner-f7aa1")
- An Anthropic Claude API key (for recipe suggestions)

### Setting Up Firebase

1. **Log in to Firebase:**
   ```
   firebase login
   ```

2. **Set the Claude API Key in Firebase Config:**
   ```
   export CLAUDE_API_KEY="your-claude-api-key-here"
   npm run set:config
   ```
   
   Note: The API key can also be entered in the app's UI and will be stored in browser localStorage.

### Deployment

You have several options for deploying the app:

1. **Full Deployment (all in one command):**
   ```
   npm run deploy:all
   ```
   This command:
   - Updates the .env file for production
   - Installs all dependencies (main app and functions)
   - Builds the application
   - Deploys to Firebase
   - Resets .env for local development

2. **Individual Deployment Steps:**
   ```
   # Install dependencies
   npm install
   cd functions && npm install && cd ..
   
   # Set the Claude API key in Firebase config
   export CLAUDE_API_KEY="your-claude-api-key-here"
   npm run set:config
   
   # Build and deploy
   npm run build
   npm run deploy
   ```

3. **Deploy Only Specific Parts:**
   ```
   # Deploy only hosting
   npm run deploy:hosting
   
   # Deploy only functions
   npm run deploy:functions
   ```

Note: The API key can also be entered in the app's UI and will be stored in browser localStorage.

### Local Development

1. **Install Dependencies:**
   ```
   npm install
   cd functions
   npm install
   cd ..
   ```

2. **Set Environment Variables:**
   Copy `.env.example` to `.env` and configure:
   ```
   VITE_FIREBASE_PROJECT_ID=barcode-scanner-f7aa1
   VITE_USE_EMULATOR=true
   ```

3. **Start the Development Environment:**
   ```
   npm run dev
   ```
   This will start both the Firebase Emulators (for the API functions) and the Vite development server.

4. **Access the App and Emulator UI:**
   - App: `https://localhost:5173`
   - Firebase Emulator UI: `http://localhost:4000`

## Building from Source

1. **Install Dependencies:**
   ```
   npm install
   ```

2. **Build the App:**
   ```
   npm run build
   ```

3. **Preview the Production Build Locally:**
   ```
   npm run preview
   ```

## Project Structure

- `/src` - React application source
- `/functions` - Firebase Cloud Functions
- `/public` - Static assets
- `/dist` - Build output (created when building the app)

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Shadcn UI
- Firebase (Hosting, Cloud Functions)
- Anthropic Claude API

## License

MIT

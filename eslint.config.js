import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        // Browser globals for Playwright context
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        performance: 'readonly',
        MutationObserver: 'readonly',
        HTMLCanvasElement: 'readonly',
        Plugin: 'readonly',
        Notification: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-console': 'off',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single']
    }
  },
  {
    ignores: [
      'node_modules/',
      'ui/build/',
      'ui/node_modules/',
      'recordings/',
      'logs/',
      '*.min.js'
    ]
  }
];
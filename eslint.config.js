import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'src/**/*', 'vite.config.ts', 'tailwind.config.js', 'postcss.config.js', 'eslint.config.js']
  },
  firebaseRulesPlugin.configs['flat/recommended']
];

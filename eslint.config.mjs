import nextConfig from 'eslint-config-next';
import importPlugin from 'eslint-plugin-import';
import reactHooks from 'eslint-plugin-react-hooks';

const config = [
  ...nextConfig,
  {
    plugins: {
      import: importPlugin,
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'import/no-anonymous-default-export': 'warn',
    },
  },
];

export default config;

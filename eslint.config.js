import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['node_modules', 'dist', 'public'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      // Model text and quotes must render as plain text (plan section 4, browser safety).
      'no-restricted-syntax': [
        'error',
        { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: 'Render text only. No raw HTML.' },
        { selector: "MemberExpression[property.name=/^(innerHTML|outerHTML)$/]", message: 'Render text only. No raw HTML.' },
      ],
    },
  },
);

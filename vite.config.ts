import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Content-Security-Policy as a <meta> tag (GitHub Pages cannot set headers).
// Only in the production build: the dev server needs inline scripts.
// Network calls: only this site and the Anthropic API.
const CSP = [
  "default-src 'self'",
  "connect-src 'self' https://api.anthropic.com",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const csp = (): Plugin => ({
  name: 'csp-meta',
  apply: 'build',
  transformIndexHtml: (html) =>
    html.replace('<head>', `<head>\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`),
});

export default defineConfig({
  base: './',
  plugins: [react(), csp()],
  build: { sourcemap: false },
});

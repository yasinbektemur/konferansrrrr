import {loadEnvConfig} from '@next/env';
// Use the same file precedence and variable expansion as Next.js.
loadEnvConfig(process.cwd(),process.env.NODE_ENV!=='production');

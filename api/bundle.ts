import { build } from 'esbuild';

const tsconfig = './tsconfig.json';

build({
  platform: 'node',
  target: 'node18',
  bundle: true,
  sourcemap: 'external',
  tsconfig,
  entryPoints: ['./.build/index.js'],
  outfile: 'dist/index.js',
  loader: { '.node': 'copy' },
  minify: true, // minification may mess up stacktraces, disable if this causes problems
  external: ['aws-sdk', '@nestjs/microservices', '@nestjs/websockets', 'class-transformer/storage', '@aws-sdk/*'],
  keepNames: true,
}).catch((e) => {
  // biome-ignore lint/suspicious/noConsole:
  console.error('Failed to bundle');
  // biome-ignore lint/suspicious/noConsole:
  console.error(e);
  process.exit(1);
});

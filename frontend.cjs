import('vite').then(async ({ preview }) => {
  const server = await preview({
    preview: { port: 3000, host: '127.0.0.1' }
  });
  server.printUrls();
});

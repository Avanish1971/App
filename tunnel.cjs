const lt = require('localtunnel');
(async () => {
  const b = await lt({ port: 5000, local_host: '127.0.0.1' });
  console.log('BACKEND_URL:', b.url);
  const f = await lt({ port: 3000, local_host: '127.0.0.1' });
  console.log('FRONTEND_URL:', f.url);
})();

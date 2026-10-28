const express = require('express');
const router = express.Router();
const { verify } = require('../utils/token');
const { addClient, write } = require('../utils/realtime');

// GET /api/events?token=...  -> live stream (EventSource header nahi bhej sakta, isliye token URL me)
router.get('/', (req, res) => {
  const auth = verify(String(req.query.token || ''));
  if (!auth || !auth.companyId || !['admin', 'employee'].includes(auth.role)) {
    return res.status(401).json({ error: 'Login zaroori hai' });
  }

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // nginx buffering band
  });
  res.flushHeaders();
  res.write('retry: 3000\n\n');

  const client = { res, role: auth.role, employeeId: auth.employeeId, companyId: auth.companyId };
  const remove = addClient(client);
  write(client, 'hello', { role: auth.role });

  // Token expire hote hi connection band, taaki client dobara login kare
  // (setTimeout 24.8 din se lamba delay nahi sambhalta, isliye limit lagayi)
  const ttl = Math.min(Math.max(1000, auth.exp * 1000 - Date.now()), 2000000000);
  const killer = setTimeout(() => res.end(), ttl);

  req.on('close', () => {
    clearTimeout(killer);
    remove();
  });
});

module.exports = router;

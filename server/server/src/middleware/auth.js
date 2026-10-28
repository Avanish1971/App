const { verify } = require('../utils/token');
const Employee = require('../models/Employee');
const { runWithTenant, tenantScope } = require('../utils/tenant');

function readAuth(req) {
  const m = String(req.headers.authorization || '').match(/^Bearer\s+(.+)$/i);
  const auth = m ? verify(m[1]) : null;
  // Purane token (company ke bina) ab nahi chalenge: dobara login karna hoga
  return auth && auth.companyId ? auth : null;
}

// Login zaroori, aur role in me se koi ek ho
function requireRole(...roles) {
  return (req, res, next) => {
    const auth = readAuth(req);
    if (!auth) return res.status(401).json({ error: 'Login zaroori hai' });
    if (!roles.includes(auth.role)) return res.status(403).json({ error: 'Is kaam ki permission nahi hai' });
    req.auth = auth;
    next();
  };
}

// /api/attendance: admin sab dekh sakta hai. Employee sirf /<apni id>/... chhu sakta hai.
function attendanceGuard(req, res, next) {
  const auth = readAuth(req);
  if (!auth) return res.status(401).json({ error: 'Login zaroori hai' });
  req.auth = auth;
  if (auth.role === 'admin') return next();
  const first = req.path.split('/').filter(Boolean)[0];
  if (auth.role === 'employee' && first && first === auth.employeeId) return next();
  return res.status(403).json({ error: 'Aap sirf apna attendance dekh ya badal sakte ho' });
}

// /api/leaves aur /api/regularizations: sab kuch admin ka.
// Employee sirf apni nayi request daal sakta hai (POST), aur wo bhi sirf apne naam se.
async function requestsGuard(req, res, next) {
  const auth = readAuth(req);
  if (!auth) return res.status(401).json({ error: 'Login zaroori hai' });
  req.auth = auth;
  if (auth.role === 'admin') return next();
  if (auth.role === 'employee' && req.method === 'POST' && req.path === '/') {
    try {
      const emp = await runWithTenant(auth.companyId, async () => await Employee.findOne({ id: auth.employeeId }));
      if (!emp || emp.status === 'INACTIVE') return res.status(403).json({ error: 'Aapki ID band hai' });
      req.body = { ...(req.body || {}), employeeId: emp.id, employeeName: emp.fullName };
      return next();
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }
  return res.status(403).json({ error: 'Is kaam ki permission nahi hai' });
}

module.exports = { requireRole, attendanceGuard, requestsGuard, tenantScope };

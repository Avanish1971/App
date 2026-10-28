// Multi-company (multi-tenant): har company ka data alag. Har request ek "company ke context" me chalti hai
// aur database ki har query/save apne aap us company tak seemit ho jati hai (koi route bhool bhi jaye to leak nahi hoga).
const { AsyncLocalStorage } = require('node:async_hooks');

const als = new AsyncLocalStorage();

const runWithTenant = (companyId, fn) => als.run({ companyId: String(companyId) }, fn);
// Sirf login/signup/migration jaisi jagah jahan company abhi pata nahi. Jaan-boojhkar hi use karo.
const runUnscoped = (fn) => als.run({ unscoped: true }, fn);
const currentTenantId = () => {
  const s = als.getStore();
  return s && !s.unscoped ? s.companyId : null;
};

function scope() {
  const s = als.getStore();
  if (!s) throw new Error('Company ki pehchaan nahi mili (tenant context missing)');
  return s.unscoped ? null : s.companyId;
}

const QUERY_OPS = [
  'find', 'findOne', 'findOneAndUpdate', 'findOneAndDelete', 'findOneAndReplace',
  'updateOne', 'updateMany', 'replaceOne', 'deleteOne', 'deleteMany', 'countDocuments', 'distinct',
];

function tenantPlugin(schema) {
  schema.add({ companyId: { type: String, index: true } });

  // 1) "unique" ab company ke andar unique hona chahiye (do company me same emp_001 chal sakta hai)
  const compound = [];
  Object.keys(schema.paths).forEach((p) => {
    if (p === 'companyId' || p === '_id') return;
    const o = schema.paths[p].options || {};
    if (o.unique) {
      compound.push({ path: p, sparse: Boolean(o.sparse) });
      schema.paths[p].options.unique = false;
      schema.paths[p].options.sparse = false;
      if (schema.paths[p]._index) {
        delete schema.paths[p]._index.unique;
        delete schema.paths[p]._index.sparse;
      }
    }
  });
  schema._indexes = (schema._indexes || []).map(([fields, opts]) => [{ companyId: 1, ...fields }, opts]);
  compound.forEach(({ path, sparse }) => {
    const opts = { unique: true, name: `tenant_${path}_unique` };
    if (sparse) opts.partialFilterExpression = { [path]: { $type: 'string' } };
    schema.index({ companyId: 1, [path]: 1 }, opts);
  });

  // 2) Har query me companyId jodo (aur update se companyId badalne ki koshish hatao)
  QUERY_OPS.forEach((op) => {
    schema.pre(op, function applyTenant() {
      const id = scope();
      if (!id) return;
      this.setQuery({ ...this.getQuery(), companyId: id });
      const u = typeof this.getUpdate === 'function' ? this.getUpdate() : null;
      if (u && typeof u === 'object') {
        delete u.companyId;
        ['$set', '$setOnInsert', '$unset'].forEach((k) => u[k] && delete u[k].companyId);
      }
    });
  });

  schema.pre('aggregate', function applyTenantAgg() {
    const id = scope();
    if (id) this.pipeline().unshift({ $match: { companyId: id } });
  });

  // 3) Naya document hamesha is company ke naam par
  schema.pre('save', function applyTenantSave(next) {
    const id = scope();
    if (id) {
      if (this.companyId && this.companyId !== id) return next(new Error('Doosri company ka data nahi badal sakte'));
      this.companyId = id;
    } else if (!this.companyId) {
      return next(new Error('companyId missing'));
    }
    return next();
  });

  schema.pre('insertMany', function applyTenantInsert(next, docs) {
    const id = scope();
    if (id && Array.isArray(docs)) docs.forEach((d) => { d.companyId = id; });
    next();
  });
}

// Middleware: token me jo company hai, usi ke context me aage ka kaam chalao.
// (body parser ke BAAD lagana, warna context kho sakta hai)
function tenantScope(req, res, next) {
  if (!req.auth || !req.auth.companyId) return res.status(401).json({ error: 'Dobara login karo' });
  return runWithTenant(req.auth.companyId, next);
}

module.exports = { runWithTenant, runUnscoped, currentTenantId, tenantPlugin, tenantScope };

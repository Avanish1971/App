// Real-time push (Server-Sent Events). Koi extra package nahi chahiye.
// Admin panel aur employee app ek hi connection khule rakhte hain, server naya kuch hote hi turant bhej deta hai.
const { currentTenantId } = require('./tenant');
const clients = new Set(); // { res, role, employeeId, companyId }

function addClient(client) {
  clients.add(client);
  return () => clients.delete(client);
}

function write(client, event, data) {
  try {
    client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  } catch (e) {
    clients.delete(client);
  }
}

// Saare admin screens ko
function broadcastAdmin(event, data) {
  const cid = currentTenantId();
  if (!cid) return;
  clients.forEach((c) => c.role === 'admin' && c.companyId === cid && write(c, event, data));
}

// Ek employee ke phone ko (uski saari open screens)
function sendToEmployee(employeeId, event, data) {
  const cid = currentTenantId();
  if (!cid) return;
  clients.forEach((c) => c.role === 'employee' && c.companyId === cid && c.employeeId === employeeId && write(c, event, data));
}

// Sabhi employees ko
function broadcastEmployees(event, data) {
  const cid = currentTenantId();
  if (!cid) return;
  clients.forEach((c) => c.role === 'employee' && c.companyId === cid && write(c, event, data));
}

// Proxy/load balancer connection na kaate isliye har 25 sec me heartbeat
setInterval(() => {
  clients.forEach((c) => {
    try {
      c.res.write(': ping\n\n');
    } catch (e) {
      clients.delete(c);
    }
  });
}, 25000).unref();

module.exports = { addClient, write, broadcastAdmin, sendToEmployee, broadcastEmployees };

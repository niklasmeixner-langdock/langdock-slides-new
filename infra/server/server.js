// Bridge between Langdock and the Figma plugin. Zero dependencies — just
// Node's built-in http + a minimal WebSocket text-frame implementation.
//
// Langdock agent → POST /exec { code, requestId? }
//   → WS → plugin runs it
//   → { type: 'result', requestId, ok, result | error }
//   → response

import http from 'node:http';
import crypto from 'node:crypto';
import { randomUUID } from 'node:crypto';

const PORT = process.env.PORT || 4000;
const API_KEY = process.env.API_KEY;

const clients = new Set();
const pending = new Map();

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    return json(res, 200, { ok: true, clients: clients.size });
  }
  if (req.method === 'POST' && req.url === '/exec') {
    return handleExec(req, res);
  }
  json(res, 404, { error: 'Not found' });
});

server.on('upgrade', (req, socket) => {
  const key = req.headers['sec-websocket-key'];
  if (!key) return socket.destroy();
  const accept = crypto
    .createHash('sha1')
    .update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11')
    .digest('base64');
  socket.write(
    'HTTP/1.1 101 Switching Protocols\r\n' +
    'Upgrade: websocket\r\n' +
    'Connection: Upgrade\r\n' +
    `Sec-WebSocket-Accept: ${accept}\r\n\r\n`
  );
  attachClient(socket);
});

function attachClient(socket) {
  const client = { socket, buffer: Buffer.alloc(0) };
  clients.add(client);
  console.log(`Plugin connected (${clients.size} total)`);
  wsSend(client, JSON.stringify({ type: 'connected' }));

  socket.on('data', (chunk) => {
    client.buffer = Buffer.concat([client.buffer, chunk]);
    let frame;
    while ((frame = parseFrame(client.buffer))) {
      client.buffer = frame.rest;
      if (frame.opcode === 0x8) { socket.end(); return; } // close
      if (frame.opcode === 0x9) { wsSend(client, frame.payload, 0xA); continue; } // ping → pong
      if (frame.opcode === 0x1) onText(frame.payload.toString('utf8'));
    }
  });

  const drop = () => { clients.delete(client); console.log(`Plugin disconnected (${clients.size} total)`); };
  socket.on('close', drop);
  socket.on('error', drop);
}

function onText(text) {
  let msg;
  try { msg = JSON.parse(text); } catch { return; }
  if (msg && msg.type === 'result' && msg.requestId && pending.has(msg.requestId)) {
    const { resolve, timer } = pending.get(msg.requestId);
    clearTimeout(timer);
    pending.delete(msg.requestId);
    resolve(msg);
  }
}

function parseFrame(buf) {
  if (buf.length < 2) return null;
  const b0 = buf[0], b1 = buf[1];
  const opcode = b0 & 0x0f;
  const masked = (b1 & 0x80) !== 0;
  let len = b1 & 0x7f;
  let offset = 2;
  if (len === 126) {
    if (buf.length < offset + 2) return null;
    len = buf.readUInt16BE(offset); offset += 2;
  } else if (len === 127) {
    if (buf.length < offset + 8) return null;
    len = Number(buf.readBigUInt64BE(offset)); offset += 8;
  }
  let mask = null;
  if (masked) {
    if (buf.length < offset + 4) return null;
    mask = buf.slice(offset, offset + 4); offset += 4;
  }
  if (buf.length < offset + len) return null;
  let payload = buf.slice(offset, offset + len);
  if (masked) {
    payload = Buffer.from(payload);
    for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
  }
  return { opcode, payload, rest: buf.slice(offset + len) };
}

function wsSend(client, data, opcode = 0x1) {
  const payload = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
  const len = payload.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x80 | opcode, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode; header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode; header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  try { client.socket.write(Buffer.concat([header, payload])); }
  catch { clients.delete(client); }
}

function broadcast(text) {
  const payload = Buffer.from(text, 'utf8');
  for (const c of clients) wsSend(c, payload);
}

async function handleExec(req, res) {
  if (API_KEY && req.headers['x-api-key'] !== API_KEY) {
    return json(res, 401, { error: 'Invalid API key' });
  }
  let body = '';
  for await (const chunk of req) body += chunk;
  let parsed;
  try { parsed = JSON.parse(body); } catch { return json(res, 400, { error: 'Invalid JSON' }); }
  const code = parsed && parsed.code;
  if (typeof code !== 'string' || !code.trim()) {
    return json(res, 400, { error: 'Missing `code` (string)' });
  }
  if (clients.size === 0) return json(res, 503, { error: 'No plugin connected' });

  const requestId = randomUUID();
  broadcast(JSON.stringify({ type: 'exec', code, requestId }));

  const result = await new Promise((resolve) => {
    const timer = setTimeout(() => {
      pending.delete(requestId);
      resolve({ ok: false, error: 'Plugin did not respond within 60s' });
    }, 60000);
    pending.set(requestId, { resolve, timer });
  });
  json(res, 200, result);
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

server.listen(PORT, () => console.log(`Langdock Slides bridge on :${PORT}`));

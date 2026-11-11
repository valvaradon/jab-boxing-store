// Jab Store: tienda, pagos (Payphone + transferencia), inventario y clases online.
const express = require("express");
const crypto = require("crypto");
const path = require("path");
const db = require("./src/db");
const C = require("./content/tienda");

const PORT = process.env.PORT || 3000;
const PUBLIC_URL = (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`).replace(/\/$/, "");
const SECRET = process.env.SESSION_SECRET || "cambia-esta-clave-en-render";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const PP_TOKEN = process.env.PAYPHONE_TOKEN || "";
const PP_STORE = process.env.PAYPHONE_STORE_ID || "";
const PP_BASE = "https://pay.payphonetodoesposible.com/api";
const DEMO_PAYMENTS = !PP_TOKEN; // sin credenciales de Payphone se usa un simulador de pago
const IVA = Number(process.env.IVA_PORCENTAJE || 0); // 15 si los precios incluyen IVA y quieres desglosarlo

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "8mb" }));
app.use((req, res, next) => { res.setHeader("Referrer-Policy", "origin-when-cross-origin"); next(); });
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"], maxAge: "1h" }));

/* ------------------------- utilidades ------------------------- */
const money = n => Math.round(n * 100) / 100;
const newId = (prefix) => {
  const d = new Date();
  return `${prefix}-${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${crypto.randomInt(1000, 9999)}`;
};
const token = () => crypto.randomBytes(12).toString("base64url");
const sign = (obj) => {
  const body = Buffer.from(JSON.stringify(obj)).toString("base64url");
  return body + "." + crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
};
const unsign = (str) => {
  if (!str || !str.includes(".")) return null;
  const [body, sig] = str.split(".");
  const ok = crypto.createHmac("sha256", SECRET).update(body).digest("base64url");
  if (sig.length !== ok.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(ok))) return null;
  const data = JSON.parse(Buffer.from(body, "base64url").toString());
  return data.exp && data.exp < Date.now() ? null : data;
};
const cookies = (req) => Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map(c => {
  const i = c.indexOf("="); return [c.slice(0, i).trim(), decodeURIComponent(c.slice(i + 1))];
}));
const setCookie = (res, name, value, days) => {
  const secure = PUBLIC_URL.startsWith("https") ? "; Secure" : "";
  res.append("Set-Cookie", `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${days * 86400}${secure}`);
};
const hashPw = (pw, salt = crypto.randomBytes(16).toString("hex")) =>
  salt + ":" + crypto.scryptSync(pw, salt, 32).toString("hex");
const checkPw = (pw, stored) => {
  const [salt, h] = stored.split(":");
  const a = Buffer.from(h, "hex"), b = crypto.scryptSync(pw, salt, 32);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const emailKey = e => String(e || "").trim().toLowerCase();
const wrap = fn => (req, res) => fn(req, res).catch(err => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : "Ocurrió un error en el servidor. Intenta de nuevo." });
});
const fail = (status, message) => Object.assign(new Error(message), { status });

async function currentUser(req) {
  const s = unsign(cookies(req).jab_s);
  if (!s?.uid) return null;
  return db.get("users", s.uid);
}
const publicUser = u => u && ({ id: u.id, name: u.name, email: u.email, credits: u.credits || 0, unlocked: u.unlocked || [] });
const isAdmin = req => !!unsign(cookies(req).jab_admin)?.admin;

/* ------------------------- inventario ------------------------- */
const stockKey = (pid, size) => `${pid}|${size}`;
async function getStock() {
  const s = (await db.get("meta", "stock")) || {};
  let changed = false;
  for (const p of C.PRODUCTS) for (const size of p.sizes) {
    const k = stockKey(p.id, size);
    if (s[k] == null) { s[k] = C.STOCK_INICIAL; changed = true; }
  }
  if (changed) await db.put("meta", "stock", s);
  return s;
}
async function applyStock(items, sign) {
  const s = await getStock();
  for (const it of items) { const k = stockKey(it.id, it.size); s[k] = Math.max(0, (s[k] || 0) + sign * it.qty); }
  await db.put("meta", "stock", s);
}

/* ------------------------- correo (opcional) ------------------------- */
let mailer = null;
if (process.env.SMTP_HOST) {
  const nodemailer = require("nodemailer");
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}
async function sendMail(to, subject, text) {
  if (!mailer || !to) return;
  try { await mailer.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, text }); }
  catch (e) { console.error("Correo no enviado:", e.message); }
}
const orderLink = o => `${PUBLIC_URL}/?pedido=${o.id}&t=${o.token}`;
const orderSummary = o => [
  `Pedido ${o.id}`,
  ...o.items.map(i => `- ${i.qty} x ${i.name}${i.size ? " · " + i.size : ""}${i.colorName ? " · " + i.colorName : ""}: $${i.total.toFixed(2)}`),
  `Subtotal: $${o.subtotal.toFixed(2)}`,
  o.type === "tienda" ? `Envío (${o.shipping.label}): $${o.shippingCost.toFixed(2)}` : null,
  `Total: $${o.total.toFixed(2)}`
].filter(Boolean).join("\n");

/* ------------------------- pagos ------------------------- */
async function markPaid(order, detail) {
  if (order.status !== "pendiente_pago" && order.status !== "esperando_transferencia" && order.status !== "comprobante_recibido") return order;
  order.status = "pagado";
  order.paidAt = new Date().toISOString();
  order.payment = { ...order.payment, ...detail };
  if (order.type === "tienda") {
    await applyStock(order.items, -1);
  } else if (order.type === "membresia") {
    const u = await db.get("users", order.userId);
    if (u) { u.credits = (u.credits || 0) + order.credits; await db.put("users", u.id, u); }
  }
  order.history.push({ at: order.paidAt, status: "pagado", by: detail.by || "sistema" });
  await db.put("orders", order.id, order);
  const what = order.type === "membresia" ? `Se acreditaron ${order.credits} clases a tu cuenta.` : "Estamos preparando tu pedido.";
  sendMail(order.customer.email, `Pago recibido · ${order.id}`, `Hola ${order.customer.name}, recibimos tu pago. ${what}\n\n${orderSummary(order)}\n\nSigue tu pedido: ${orderLink(order)}`);
  sendMail(process.env.ADMIN_EMAIL, `Nuevo pago · ${order.id} · $${order.total.toFixed(2)}`, `${orderSummary(order)}\n\nCliente: ${order.customer.name} · ${order.customer.phone} · ${order.customer.email}\nMétodo: ${order.payment.method}\n\nPanel: ${PUBLIC_URL}/admin`);
  return order;
}

async function startPayment(order) {
  if (order.payment.method === "transferencia") {
    order.status = "esperando_transferencia";
    await db.put("orders", order.id, order);
    sendMail(order.customer.email, `Pedido ${order.id} · datos para transferir`, `Hola ${order.customer.name}, registramos tu pedido.\n\n${orderSummary(order)}\n\nTransfiere el total y sube tu comprobante aquí: ${orderLink(order)}`);
    sendMail(process.env.ADMIN_EMAIL, `Pedido por transferencia · ${order.id}`, `${orderSummary(order)}\n\nEsperando comprobante. Panel: ${PUBLIC_URL}/admin`);
    return { redirect: `/?pedido=${order.id}&t=${order.token}` };
  }
  order.status = "pendiente_pago";
  await db.put("orders", order.id, order);
  if (DEMO_PAYMENTS) return { redirect: `/pago/demo?o=${order.id}&t=${order.token}` };

  const cents = Math.round(order.total * 100);
  const body = { amount: cents, currency: "USD", clientTransactionId: order.id, storeId: PP_STORE,
    reference: `JAB ${order.id}`, responseUrl: `${PUBLIC_URL}/pago/respuesta`, cancellationUrl: `${PUBLIC_URL}/?pedido=${order.id}&t=${order.token}`,
    timeZone: -5, email: order.customer.email || undefined, optionalParameter: order.type };
  if (IVA > 0) {
    const base = Math.round(cents / (1 + IVA / 100));
    body.amountWithTax = base; body.tax = cents - base;
  } else body.amountWithoutTax = cents;
  const r = await fetch(`${PP_BASE}/button/Prepare`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${PP_TOKEN}` }, body: JSON.stringify(body)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.payWithCard) {
    console.error("Payphone Prepare", r.status, data);
    throw fail(502, "No pudimos iniciar el pago con tarjeta. Intenta de nuevo o elige transferencia.");
  }
  order.payment.paymentId = data.paymentId;
  await db.put("orders", order.id, order);
  return { redirect: data.payWithCard };
}

function readCustomer(b, user) {
  const c = {
    name: String(b.name || user?.name || "").trim().slice(0, 80),
    email: emailKey(b.email || user?.email).slice(0, 120),
    phone: String(b.phone || "").trim().slice(0, 30),
    document: String(b.document || "").trim().slice(0, 30)
  };
  if (!c.name) throw fail(400, "Escribe tu nombre.");
  if (!/^\S+@\S+\.\S+$/.test(c.email)) throw fail(400, "Escribe un correo válido para enviarte la confirmación.");
  if (c.phone.replace(/\D/g, "").length < 7) throw fail(400, "Escribe un celular válido.");
  return c;
}
const PAY_METHODS = ["tarjeta", "transferencia"];

/* ------------------------- API pública ------------------------- */
app.get("/api/config", wrap(async (req, res) => {
  const stock = await getStock();
  res.json({
    products: C.PRODUCTS.map(p => ({ ...p, stock: Object.fromEntries(p.sizes.map(s => [s, stock[stockKey(p.id, s)] || 0])) })),
    colors: C.COLORS, cats: C.CATS, shipping: C.SHIPPING, packs: C.PACKS,
    classes: C.CLASSES.map(({ videoUrl, ...c }) => ({ ...c, ready: !!videoUrl })),
    trainers: C.TRAINERS, story: C.STORY, locations: C.LOCATIONS,
    bank: C.BANK.numero ? C.BANK : null, whatsapp: C.WHATSAPP, instagram: C.INSTAGRAM,
    demoPayments: DEMO_PAYMENTS
  });
}));

app.get("/api/me", wrap(async (req, res) => res.json({ user: publicUser(await currentUser(req)) })));

app.post("/api/auth/register", wrap(async (req, res) => {
  const name = String(req.body.name || "").trim().slice(0, 80);
  const email = emailKey(req.body.email);
  const pw = String(req.body.password || "");
  if (!name) throw fail(400, "Escribe tu nombre.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw fail(400, "Escribe un correo válido.");
  if (pw.length < 6) throw fail(400, "La contraseña debe tener al menos 6 caracteres.");
  const idx = await db.get("emails", email);
  if (idx) throw fail(409, "Ya existe una cuenta con ese correo. Inicia sesión.");
  const u = { id: "u_" + token(), name, email, pass: hashPw(pw), credits: 0, unlocked: [], createdAt: new Date().toISOString() };
  await db.put("users", u.id, u);
  await db.put("emails", email, { uid: u.id });
  setCookie(res, "jab_s", sign({ uid: u.id, exp: Date.now() + 90 * 864e5 }), 90);
  res.json({ user: publicUser(u) });
}));

app.post("/api/auth/login", wrap(async (req, res) => {
  const idx = await db.get("emails", emailKey(req.body.email));
  const u = idx && await db.get("users", idx.uid);
  if (!u || !checkPw(String(req.body.password || ""), u.pass)) throw fail(401, "Correo o contraseña incorrectos.");
  setCookie(res, "jab_s", sign({ uid: u.id, exp: Date.now() + 90 * 864e5 }), 90);
  res.json({ user: publicUser(u) });
}));

app.post("/api/auth/logout", (req, res) => { setCookie(res, "jab_s", "", 0); res.json({ ok: true }); });

// Compra de ropa
app.post("/api/orders", wrap(async (req, res) => {
  const b = req.body || {};
  const user = await currentUser(req);
  if (!Array.isArray(b.items) || !b.items.length) throw fail(400, "Tu carrito está vacío.");
  if (!PAY_METHODS.includes(b.payment)) throw fail(400, "Elige tarjeta o transferencia.");
  const zone = C.SHIPPING.find(z => z.id === b.shippingId);
  if (!zone) throw fail(400, "Elige cómo quieres recibir tu pedido.");
  const stock = await getStock();
  const items = b.items.slice(0, 30).map(it => {
    const p = C.PRODUCTS.find(x => x.id === it.id);
    const qty = Math.max(1, Math.min(20, parseInt(it.qty, 10) || 1));
    if (!p || !p.sizes.includes(it.size) || !p.colors.includes(it.color)) throw fail(400, "Un producto del carrito ya no está disponible. Revisa tu carrito.");
    const left = stock[stockKey(p.id, it.size)] || 0;
    if (left < qty) throw fail(409, `${p.name} talla ${it.size}: ${left ? "solo quedan " + left : "agotado"}.`);
    return { id: p.id, name: p.name, size: it.size, color: it.color, colorName: C.COLORS[it.color]?.name, qty, unit: p.price, total: money(p.price * qty) };
  });
  const units = items.reduce((a, i) => a + i.qty, 0);
  const subtotal = money(items.reduce((a, i) => a + i.total, 0));
  const shippingCost = money(zone.base + Math.max(0, units - 1) * zone.extra);
  let address = null;
  if (zone.needsAddress) {
    const a = b.address || {};
    address = {
      line: String(a.line || "").trim().slice(0, 200), city: String(a.city || "").trim().slice(0, 80),
      region: String(a.region || "").trim().slice(0, 80), postal: String(a.postal || "").trim().slice(0, 20),
      country: zone.country, notes: String(a.notes || "").trim().slice(0, 200)
    };
    if (!address.line || !address.city) throw fail(400, "Escribe la dirección y la ciudad de envío.");
    if (zone.country !== "EC" && !address.postal) throw fail(400, "Escribe el código postal para el envío internacional.");
  }
  const order = {
    id: newId("JAB"), token: token(), type: "tienda", userId: user?.id || null,
    customer: readCustomer(b.customer || {}, user), items, subtotal,
    shipping: { id: zone.id, label: zone.label, eta: zone.eta, address }, shippingCost, total: money(subtotal + shippingCost),
    payment: { method: b.payment }, status: "nuevo", createdAt: new Date().toISOString(), history: []
  };
  order.history.push({ at: order.createdAt, status: "creado", by: "cliente" });
  res.json(await startPayment(order));
}));

// Compra de membresía virtual (requiere cuenta)
app.post("/api/packs/:id/buy", wrap(async (req, res) => {
  const user = await currentUser(req);
  if (!user) throw fail(401, "Inicia sesión o crea tu cuenta para comprar clases.");
  const pack = C.PACKS.find(p => p.id === req.params.id);
  if (!pack) throw fail(404, "Ese pack no existe.");
  if (!PAY_METHODS.includes(req.body.payment)) throw fail(400, "Elige tarjeta o transferencia.");
  const order = {
    id: newId("CLS"), token: token(), type: "membresia", userId: user.id, credits: pack.classes,
    customer: readCustomer({ ...req.body, name: user.name, email: user.email }, user),
    items: [{ id: pack.id, name: pack.name, qty: 1, unit: pack.price, total: pack.price }],
    subtotal: pack.price, shippingCost: 0, total: pack.price,
    payment: { method: req.body.payment }, status: "nuevo", createdAt: new Date().toISOString(), history: []
  };
  order.history.push({ at: order.createdAt, status: "creado", by: "cliente" });
  res.json(await startPayment(order));
}));

const publicOrder = o => {
  const { token: _t, receipt, ...rest } = o;
  return { ...rest, hasReceipt: !!receipt };
};
async function orderFromReq(req) {
  const o = await db.get("orders", req.params.id);
  if (!o || o.token !== String(req.query.t || req.body?.t || "")) throw fail(404, "No encontramos ese pedido. Revisa el enlace.");
  return o;
}
app.get("/api/orders/:id", wrap(async (req, res) => res.json({ order: publicOrder(await orderFromReq(req)) })));

app.post("/api/orders/:id/receipt", wrap(async (req, res) => {
  const o = await orderFromReq(req);
  if (!["esperando_transferencia", "comprobante_recibido"].includes(o.status)) throw fail(409, "Este pedido no está esperando un comprobante.");
  const file = String(req.body.file || "");
  if (!/^data:(image\/(png|jpe?g|webp|heic)|application\/pdf);base64,/.test(file)) throw fail(400, "Sube una foto (JPG o PNG) o un PDF del comprobante.");
  if (file.length > 6.5e6) throw fail(413, "El archivo pesa más de 4 MB. Sube una captura más liviana.");
  o.receipt = file;
  o.status = "comprobante_recibido";
  o.history.push({ at: new Date().toISOString(), status: "comprobante_recibido", by: "cliente" });
  await db.put("orders", o.id, o);
  sendMail(process.env.ADMIN_EMAIL, `Comprobante recibido · ${o.id}`, `${orderSummary(o)}\n\nRevisa y aprueba en ${PUBLIC_URL}/admin`);
  res.json({ order: publicOrder(o) });
}));

// Respuesta de Payphone
app.get("/pago/respuesta", wrap(async (req, res) => {
  const id = Number(req.query.id || 0);
  const ctx = String(req.query.clientTransactionId || "");
  const o = await db.get("orders", ctx);
  if (!o) return res.redirect("/?pago=desconocido");
  if (o.status === "pendiente_pago" && id) {
    const r = await fetch(`${PP_BASE}/button/V2/Confirm`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${PP_TOKEN}` },
      body: JSON.stringify({ id, clientTxId: ctx })
    });
    const d = await r.json().catch(() => ({}));
    if (d.statusCode === 3 && d.transactionStatus === "Approved" && Number(d.amount) === Math.round(o.total * 100)) {
      await markPaid(o, { transactionId: d.transactionId, authorizationCode: d.authorizationCode, card: `${d.cardBrand || ""} ${d.lastDigits || ""}`.trim(), by: "payphone" });
    } else {
      o.status = "pago_rechazado";
      o.history.push({ at: new Date().toISOString(), status: "pago_rechazado", by: "payphone", note: d.message || d.transactionStatus || "" });
      await db.put("orders", o.id, o);
    }
  }
  res.redirect(`/?pedido=${o.id}&t=${o.token}`);
}));

// Simulador de pago (solo si no hay credenciales de Payphone)
app.get("/pago/demo", wrap(async (req, res) => {
  if (!DEMO_PAYMENTS) return res.redirect("/");
  const o = await db.get("orders", String(req.query.o || ""));
  if (!o || o.token !== req.query.t) return res.redirect("/");
  res.type("html").send(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Pago de prueba</title><style>body{font:16px system-ui;background:#0b0b0b;color:#f5f5f2;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px}
.c{max-width:420px;background:#17171a;border:2px solid #ffd21f;border-radius:16px;padding:24px}h1{margin:0 0 8px}p{color:#bbb}
a{display:block;text-align:center;padding:14px;border-radius:12px;margin-top:12px;font-weight:700;text-decoration:none}
.ok{background:#ffd21f;color:#0b0b0b}.no{border:1.5px solid #444;color:#f5f5f2}</style>
<div class="c"><h1>Pago de prueba</h1><p>Payphone aún no está configurado, así que este simulador reemplaza el formulario de tarjeta. No se cobra nada.</p>
<p><b>${o.id}</b> · Total <b>$${o.total.toFixed(2)}</b></p>
<a class="ok" href="/pago/demo/fin?o=${o.id}&t=${o.token}&r=ok">Aprobar pago</a>
<a class="no" href="/pago/demo/fin?o=${o.id}&t=${o.token}&r=no">Rechazar pago</a></div>`);
}));
app.get("/pago/demo/fin", wrap(async (req, res) => {
  if (!DEMO_PAYMENTS) return res.redirect("/");
  const o = await db.get("orders", String(req.query.o || ""));
  if (!o || o.token !== req.query.t) return res.redirect("/");
  if (o.status === "pendiente_pago") {
    if (req.query.r === "ok") await markPaid(o, { transactionId: "DEMO", card: "Tarjeta de prueba", by: "simulador" });
    else { o.status = "pago_rechazado"; o.history.push({ at: new Date().toISOString(), status: "pago_rechazado", by: "simulador" }); await db.put("orders", o.id, o); }
  }
  res.redirect(`/?pedido=${o.id}&t=${o.token}`);
}));

// Reintentar pago de un pedido rechazado
app.post("/api/orders/:id/retry", wrap(async (req, res) => {
  const o = await orderFromReq(req);
  if (!["pago_rechazado", "pendiente_pago"].includes(o.status)) throw fail(409, "Este pedido ya no se puede pagar de nuevo.");
  if (!PAY_METHODS.includes(req.body.payment)) throw fail(400, "Elige tarjeta o transferencia.");
  if (o.type === "tienda") {
    const stock = await getStock();
    for (const it of o.items) if ((stock[stockKey(it.id, it.size)] || 0) < it.qty) throw fail(409, `${it.name} talla ${it.size} ya no tiene stock suficiente.`);
  }
  // Payphone exige un clientTransactionId nuevo por intento
  const old = o.id;
  o.id = newId(o.type === "tienda" ? "JAB" : "CLS");
  o.retryOf = old;
  o.payment = { method: req.body.payment };
  o.history.push({ at: new Date().toISOString(), status: "reintento", by: "cliente", note: `Pedido anterior ${old}` });
  await db.del("orders", old);
  res.json(await startPayment(o));
}));

/* ------------------------- clases online ------------------------- */
app.post("/api/classes/:id/unlock", wrap(async (req, res) => {
  const u = await currentUser(req);
  if (!u) throw fail(401, "Inicia sesión para desbloquear clases.");
  const cl = C.CLASSES.find(c => c.id === req.params.id);
  if (!cl) throw fail(404, "Esa clase no existe.");
  u.unlocked = u.unlocked || [];
  if (!cl.free && !u.unlocked.includes(cl.id)) {
    if ((u.credits || 0) < 1) throw fail(402, "No tienes clases disponibles. Compra un pack para desbloquear esta clase.");
    u.credits -= 1;
    u.unlocked.push(cl.id);
    await db.put("users", u.id, u);
  }
  res.json({ user: publicUser(u) });
}));

app.get("/api/classes/:id/video", wrap(async (req, res) => {
  const u = await currentUser(req);
  const cl = C.CLASSES.find(c => c.id === req.params.id);
  if (!cl) throw fail(404, "Esa clase no existe.");
  if (!cl.free && !(u && (u.unlocked || []).includes(cl.id))) throw fail(403, "Desbloquea esta clase para verla.");
  res.json({ videoUrl: cl.videoUrl || null });
}));

/* ------------------------- administración ------------------------- */
const adminOnly = fn => wrap(async (req, res) => { if (!isAdmin(req)) throw fail(401, "Inicia sesión como administrador."); return fn(req, res); });

app.post("/api/admin/login", wrap(async (req, res) => {
  if (!ADMIN_PASSWORD) throw fail(503, "Configura la variable ADMIN_PASSWORD en Render para usar el panel.");
  const a = Buffer.from(String(req.body.password || "")), b = Buffer.from(ADMIN_PASSWORD);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw fail(401, "Contraseña incorrecta.");
  setCookie(res, "jab_admin", sign({ admin: true, exp: Date.now() + 7 * 864e5 }), 7);
  res.json({ ok: true });
}));
app.post("/api/admin/logout", (req, res) => { setCookie(res, "jab_admin", "", 0); res.json({ ok: true }); });

app.get("/api/admin/orders", adminOnly(async (req, res) => {
  const list = await db.list("orders");
  res.json({ orders: list.map(publicOrder), db: db.kind, demoPayments: DEMO_PAYMENTS });
}));
app.get("/api/admin/orders/:id/receipt", adminOnly(async (req, res) => {
  const o = await db.get("orders", req.params.id);
  if (!o?.receipt) throw fail(404, "Este pedido no tiene comprobante.");
  res.json({ file: o.receipt });
}));

const FLOW = ["pagado", "listo_retiro", "enviado", "entregado", "cancelado"];
app.post("/api/admin/orders/:id/status", adminOnly(async (req, res) => {
  const o = await db.get("orders", req.params.id);
  if (!o) throw fail(404, "Pedido no encontrado.");
  const st = req.body.status;
  if (!FLOW.includes(st)) throw fail(400, "Estado no válido.");
  if (st === "pagado") {
    await markPaid(o, { by: "admin", note: "Transferencia verificada" });
  } else {
    if (st === "cancelado" && o.status !== "cancelado") {
      if (o.paidAt && o.type === "tienda") await applyStock(o.items, +1); // devuelve el stock
      if (o.paidAt && o.type === "membresia") {
        const u = await db.get("users", o.userId);
        if (u) { u.credits = Math.max(0, (u.credits || 0) - o.credits); await db.put("users", u.id, u); }
      }
    }
    o.status = st;
    if (req.body.tracking) o.tracking = String(req.body.tracking).slice(0, 120);
    o.history.push({ at: new Date().toISOString(), status: st, by: "admin", note: o.tracking || "" });
    await db.put("orders", o.id, o);
    const msg = { listo_retiro: `Tu pedido está listo para retirar en ${o.shipping?.label?.replace("Retiro en ", "") || "el gimnasio"}.`,
      enviado: `Tu pedido fue enviado.${o.tracking ? " Guía: " + o.tracking : ""}`, entregado: "Tu pedido fue entregado. ¡Gracias por entrenar con JAB!",
      cancelado: "Tu pedido fue cancelado. Si tienes dudas, escríbenos por WhatsApp." }[st];
    sendMail(o.customer.email, `Pedido ${o.id} · actualización`, `Hola ${o.customer.name}. ${msg}\n\n${orderLink(o)}`);
  }
  res.json({ order: publicOrder(await db.get("orders", o.id)) });
}));

app.get("/api/admin/stock", adminOnly(async (req, res) => {
  const s = await getStock();
  res.json({ products: C.PRODUCTS.map(p => ({ id: p.id, name: p.name, sizes: p.sizes.map(size => ({ size, qty: s[stockKey(p.id, size)] || 0 })) })) });
}));
app.post("/api/admin/stock", adminOnly(async (req, res) => {
  const s = await getStock();
  for (const [k, v] of Object.entries(req.body.stock || {})) if (k in s) s[k] = Math.max(0, parseInt(v, 10) || 0);
  await db.put("meta", "stock", s);
  res.json({ ok: true });
}));

app.get("/api/admin/users", adminOnly(async (req, res) => {
  const users = await db.list("users");
  res.json({ users: users.map(u => ({ ...publicUser(u), createdAt: u.createdAt })) });
}));
app.post("/api/admin/users/:id/credits", adminOnly(async (req, res) => {
  const u = await db.get("users", req.params.id);
  if (!u) throw fail(404, "Usuario no encontrado.");
  u.credits = Math.max(0, (u.credits || 0) + (parseInt(req.body.delta, 10) || 0));
  await db.put("users", u.id, u);
  res.json({ user: publicUser(u) });
}));

app.get("/admin", (req, res) => res.sendFile(path.join(__dirname, "public", "admin.html")));

db.init().then(() => app.listen(PORT, () => {
  console.log(`Jab Store en ${PUBLIC_URL} · base de datos: ${db.kind} · pagos: ${DEMO_PAYMENTS ? "SIMULADOR (configura PAYPHONE_TOKEN)" : "Payphone"}`);
}));

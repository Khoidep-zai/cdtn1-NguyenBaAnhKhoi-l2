const fs = require('node:fs');
const evidence = JSON.parse(fs.readFileSync('docs/evidence/api-examples.json', 'utf8'));
const descriptions = {
  '/health': 'Check whether the application is running.', '/health/db': 'Check database connectivity without disclosing connection details.',
  '/api/auth/login': 'Authenticate a user and issue an HttpOnly session cookie.', '/api/auth/logout': 'Clear the session cookie.',
  '/api/auth/me': 'Read the current user and effective permissions.', '/api/auth/profile': 'Update the current user profile.',
  '/api/auth/users': 'List or create accounts within the caller role and branch scope.', '/api/auth/users/{id}': 'Update an account within the caller administrative scope.',
  '/api/customers': 'Look up or register a customer by normalized phone number.',
  '/api/categories': 'List incident categories.', '/api/centers': 'List service centers.', '/api/products': 'Search the product catalog.',
  '/api/tickets': 'List or receive warranty tickets within the caller branch scope.', '/api/tickets/{id}': 'Read ticket details and status history.',
  '/api/tickets/{id}/classify': 'Change incident classification and recalculate the deadline.',
  '/api/tickets/{id}/service-consent': 'Record consent to paid service for a new ticket.',
  '/api/tickets/{id}/warranty-exception': 'Approve a warranty exception for a new ticket.',
  '/api/tickets/{id}/status': 'Advance the ticket lifecycle and append an audit record.',
  '/api/tickets/{id}/handover-photo': 'Read or upload handover evidence.',
};
const constraints = {
  username: 'String, 3–80 letters/digits/dot/underscore/hyphen; required for login/create.',
  password: 'String; maximum 128; create/update minimum 12 in production, 6 outside production; never sent in URL.',
  full_name: 'String; required for profile/create; account names 2–120 characters.',
  phone: 'Customer phone: normalized Vietnamese mobile number; profile phone is optional, maximum 20 characters.',
  role: 'NHAN_VIEN, QUAN_LY_CHI_NHANH, QUAN_LY_HE_THONG; branch managers cannot escalate roles.',
  center_id: 'Positive integer; required for non-system accounts; restricted to caller branch.',
  customer_phone: 'Required registered Vietnamese mobile phone.',
  serial_imei: 'Required serial: letters/digits/hyphens; must not have another open ticket.',
  issue_description: 'Required string, minimum 10 characters.',
  priority: 'CAO, TRUNG_BINH, THAP; default TRUNG_BINH.',
  note: 'For consent/exception: required nonempty string, maximum 180 characters.',
  status: 'Required supported lifecycle status; only permitted transitions accepted.',
  updated_by: 'Required by the current validator; effective actor is replaced by authenticated username.',
};
const unique = new Map();
for (const record of evidence.records) {
  const path = record.path.split('?')[0].replace(/\/api\/auth\/users\/\d+$/, '/api/auth/users/{id}').replace(/\/api\/tickets\/TKT-\d+/, '/api/tickets/{id}');
  const key = `${record.method} ${path}`;
  if (!unique.has(key)) unique.set(key, { ...record, normalized: path });
}
let md = '# API Reference — Mekong Mobile L2\n\n';
md += `Examples captured through real local HTTP requests at ${evidence.capturedAt}. Credentials are redacted; account-list examples omit unrelated users. Binary examples report their actual byte count.\n\n`;
md += 'Authentication uses the `mekong_session` cookie, not a URL token. All business APIs require an active account. Branch-scoped ticket access is enforced on the server. API timestamps are ISO strings. Ticket/customer operations currently use the in-memory prototype store; account management and service-center lookup use PostgreSQL. Restarting the process can discard in-memory mutations.\n\n';
md += 'Reproduce examples with `NODE_ENV=test node scripts/capture-api-evidence.js` against a prepared test database, then `node scripts/build-api-reference.js`. Temporary account fixtures are removed on completion.\n\n';
for (const [key, record] of unique) {
  const path = record.normalized;
  const publicRoute = path.startsWith('/health') || ['/api/auth/login', '/api/auth/logout'].includes(path);
  const manager = path.includes('/auth/users') || path.endsWith('/classify') || path.endsWith('/warranty-exception');
  md += `## ${key}\n\n### 1. Method and path\n\n\`${key}\`\n\n### 2. Business purpose\n\n${descriptions[path]}\n\n`;
  md += `### 3. Authentication and authorization\n\n${publicRoute ? 'Public route; no authenticated session required.' : manager ? 'Valid session; branch manager or system manager. Branch restrictions still apply.' : 'Valid session; access is restricted by the current account and branch scope.'}\n\n`;
  md += '### 4. Parameters and request\n\n';
  if (path.includes('{id}')) md += '`id`: required existing resource identifier in the path.\n\n';
  if (record.method === 'GET' && path === '/api/tickets') md += 'Optional query fields: `status`, `center_id`, `store_id`, `q`, `page`, `limit`, `offset`. Branch staff cannot widen their scope by changing center_id. `overdue` is not implemented as a filter.\n\n';
  if (record.method === 'GET' && path === '/api/customers') md += '`phone`: required query string containing the customer phone.\n\n';
  if (path === '/api/products') md += 'Optional query strings: `search`, `brand`, `phonesOnly` (true/1), `limit` (count or all).\n\n';
  if (record.request) {
    md += '| Field | Type / constraints |\n|---|---|\n';
    for (const [name, value] of Object.entries(record.request)) md += `| ${name} | ${constraints[name] || `${typeof value}; see the captured request below.`} |\n`;
    md += `\nCaptured request (sensitive values redacted):\n\n\`\`\`json\n${JSON.stringify(record.request, null, 2)}\n\`\`\`\n\n`;
  } else md += 'No request body.\n\n';
  md += `### 5. Successful response\n\nHTTP ${record.status}. ${record.excerpt || ''}\n\n\`\`\`json\n${JSON.stringify(record.response, null, 2)}\n\`\`\`\n\n`;
  md += '### 6. Error responses\n\n';
  md += publicRoute ? (path === '/api/auth/login' ? '401 invalid credentials; 429 too many login attempts; 500/503 infrastructure failure.\n\n' : path === '/health/db' ? '503 database unavailable, with only a boolean connection status.\n\n' : 'No business-specific error response.\n\n') : '401 missing/invalid/inactive session; 403 insufficient role or branch access; 500/503 unexpected infrastructure failure.\n\n';
  if (record.method !== 'GET' && !publicRoute) md += '400 invalid input; 404 missing referenced resource where applicable; 409 duplicate or forbidden business operation where applicable. JSON bodies are limited to 256 KB (413 if exceeded).\n\n';
  if (path.endsWith('/handover-photo')) md += '404 no photo/resource; 409 ticket not ready for upload; 413 over 8 MB; 415 invalid/unsupported image.\n\n';
  md += '### 7. Special behavior and limits\n\n';
  md += path.endsWith('/handover-photo') ? 'Upload raw JPEG/PNG/WebP bytes with the matching Content-Type. Successful reads return binary image data. A handover photo is required before DA_BAN_GIAO.\n\n' : path.endsWith('/status') ? 'One-way lifecycle. Assignment requires verified warranty, approved exception or service consent. Handover requires a photo.\n\n' : path.includes('/auth/users') ? 'Branch managers administer only branch staff. The last active system manager cannot be disabled or demoted. Existing accounts are never implicitly replaced by setup.\n\n' : 'Responses shown are captured examples, not fixed IDs/timestamps. See the shared prototype persistence limitation above.\n\n';
}
fs.writeFileSync('docs/api-reference.md', md);
console.log(`Documented ${unique.size} method/path pairs with captured examples.`);

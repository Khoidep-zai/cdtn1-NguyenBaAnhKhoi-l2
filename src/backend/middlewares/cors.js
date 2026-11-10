function createCors(allowedOrigins) {
  const allowed = new Set(allowedOrigins.filter(Boolean));
  return (req, res, next) => {
    const origin = req.headers.origin;
    if (!origin) return next();
    res.setHeader('Vary', 'Origin');
    if (!allowed.has(origin)) {
      if (req.method === 'OPTIONS') { res.statusCode = 403; return res.end(); }
      return next();
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-Id');
      res.setHeader('Access-Control-Max-Age', '600');
      res.statusCode = 204;
      return res.end();
    }
    return next();
  };
}

module.exports = { createCors };

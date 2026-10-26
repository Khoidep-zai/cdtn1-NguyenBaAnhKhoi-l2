const { randomUUID } = require('node:crypto');

const MUC = { debug: 10, info: 20, warn: 30, error: 40 };
const MUC_TOI_THIEU = MUC[process.env.LOG_LEVEL || 'info'] ?? MUC.info;

// Các trường nhạy cảm TUYỆT ĐỐI KHÔNG được ghi vào nhật ký (tiêu chuẩn bảo mật học phần CDTN1 - QT-15)
const TRUONG_CHE = [
  'password',
  'mat_khau',
  'token',
  'jwt',
  'authorization',
  'secret',
  'cvv',
  'so_the',
  'so_dien_thoai',
  'sodienthoai',
  'phone',
  'so_dt',
  'sdt',
];

function che(gia_tri) {
  if (gia_tri === null || typeof gia_tri !== 'object') return gia_tri;
  if (gia_tri instanceof Error) {
    return { loai: gia_tri.name, thong_diep: gia_tri.message, stack: gia_tri.stack };
  }
  const ra = Array.isArray(gia_tri) ? [] : {};
  for (const [k, v] of Object.entries(gia_tri)) {
    ra[k] = TRUONG_CHE.some((t) => k.toLowerCase().includes(t)) ? '***' : che(v);
  }
  return ra;
}

function ghi(muc, thongDiep, ngucanh = {}) {
  if (MUC[muc] < MUC_TOI_THIEU) return;
  // Ghi ra STDOUT định dạng JSON có cấu trúc (structured logging)
  process.stdout.write(
    JSON.stringify({
      thoi_diem: new Date().toISOString(),
      muc,
      thong_diep: thongDiep,
      ...che(ngucanh),
    }) + '\n'
  );
}

const logger = {
  debug: (m, c) => ghi('debug', m, c),
  info: (m, c) => ghi('info', m, c),
  warn: (m, c) => ghi('warn', m, c),
  error: (m, c) => ghi('error', m, c),
};

/** Gán requestId duy nhất cho mỗi HTTP request để theo dõi luồng xử lý */
function ganRequestId(req, res, next) {
  req.requestId = req.headers['x-request-id'] || randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  const t0 = Date.now();
  res.on('finish', () =>
    logger.info('Yêu cầu hoàn tất', {
      requestId: req.requestId,
      phuong_thuc: req.method,
      duong_dan: req.originalUrl,
      ma_trang_thai: res.statusCode,
      thoi_gian_ms: Date.now() - t0,
    })
  );
  next();
}

module.exports = { logger, ganRequestId, che };

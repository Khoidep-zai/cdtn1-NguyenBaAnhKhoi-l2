const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'cdtn1_warranty_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  jwtSecret: process.env.JWT_SECRET || 'secret-key-default-for-dev',
  
  // Trạng thái phiếu chuẩn hóa theo dataset và SRS luồng L2
  ticketStatuses: {
    MOI: 'MOI',
    DA_PHAN_CONG: 'DA_PHAN_CONG',
    DANG_XU_LY: 'DANG_XU_LY',
    CHO_LINH_KIEN: 'CHO_LINH_KIEN',
    HOAN_TAT: 'HOAN_TAT',
    DA_DONG: 'DA_DONG',
    DA_HUY: 'DA_HUY',

    // Aliases hỗ trợ tương thích ngược
    NEW: 'MOI',
    PENDING_ASSIGNMENT: 'DA_PHAN_CONG',
    ASSIGNED: 'DA_PHAN_CONG',
    PROCESSING: 'DANG_XU_LY',
    COMPLETED: 'HOAN_TAT',
    CANCELLED: 'DA_HUY',
  },

  // Mức ưu tiên chuẩn hóa theo dataset
  priorities: [
    'CAO',
    'TRUNG_BINH',
    'THAP',
    // Aliases hỗ trợ tương thích ngược
    'HIGH',
    'MEDIUM',
    'LOW',
    'URGENT',
  ],
};

module.exports = config;

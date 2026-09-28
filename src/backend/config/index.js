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
  ticketStatuses: {
    NEW: 'NEW',
    PENDING_ASSIGNMENT: 'PENDING_ASSIGNMENT',
    ASSIGNED: 'ASSIGNED',
    PROCESSING: 'PROCESSING',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'CANCELLED',
  },
  priorities: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
};

module.exports = config;

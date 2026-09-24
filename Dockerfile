# Sử dụng base image Node.js 20 LTS Alpine nhẹ và bảo mật
FROM node:20-alpine

WORKDIR /app

# Sao chép file cấu hình phụ thuộc
COPY package*.json ./

# Cài đặt dependencies (sử dụng npm install tương thích môi trường container)
RUN npm install --omit=dev

# Sao chép mã nguồn ứng dụng và dữ liệu mẫu
COPY src/ ./src/
COPY data/sample/ ./data/sample/

# Khai báo môi trường và cổng
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Kiểm tra sức khỏe container định kỳ
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]

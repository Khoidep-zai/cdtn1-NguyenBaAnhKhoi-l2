# ==============================================================================
# Dockerfile — Phân hệ tiếp nhận và phân loại bảo hành L2 (Mekong Mobile CRM)
# Chuẩn hóa Multi-stage build theo Buổi 11 Track SE (Slide 30-32 & Tài liệu tự học A1)
# ==============================================================================

# ---------- GIAI ĐOẠN 1: Cài đặt phụ thuộc sạch từ tệp khoá (deps) ----------
FROM node:20-alpine AS deps
WORKDIR /app

# Chép RIÊNG tệp khoá phiên bản trước để Docker cache lớp này tối đa;
# khi mã nguồn thay đổi mà dependencies không đổi thì không cần tải lại
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --prefer-offline --no-audit --no-fund

# ---------- GIAI ĐOẠN 2: Ảnh chạy siêu nhẹ và bảo mật (runtime) ----------
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NODE_OPTIONS="--max-old-space-size=512"

# Chạy bằng người dùng không đặc quyền - Tiêu chuẩn bảo mật bắt buộc Buổi 11 / 15
RUN addgroup -S app && adduser -S app -G app

# Chép các gói thư viện đã cài đặt từ giai đoạn deps
COPY --from=deps --chown=app:app /app/node_modules ./node_modules

# Sao chép mã nguồn ứng dụng và dữ liệu mẫu cần thiết
COPY --chown=app:app src ./src
COPY --chown=app:app data/sample ./data/sample
COPY --chown=app:app dataset ./dataset
COPY --chown=app:app tests ./tests
COPY --chown=app:app scripts ./scripts
COPY --chown=app:app package.json ./

# Chuyển quyền thực thi sang user app
USER app

EXPOSE 3000

# Healthcheck định kỳ kiểm tra endpoint /health qua 127.0.0.1 (tránh độ trễ phân giải DNS IPv6 của localhost)
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "src/index.js"]

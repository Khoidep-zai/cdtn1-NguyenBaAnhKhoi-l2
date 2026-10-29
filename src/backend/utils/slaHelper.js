/**
 * Thuật toán tính toán hạn cam kết SLA tự động theo quy tắc QT-04
 * - Mức ưu tiên CAO: 24 giờ làm việc
 * - Mức ưu tiên TRUNG_BINH: 72 giờ làm việc
 * - Mức ưu tiên THAP: 120 giờ làm việc
 * - Quy tắc lịch làm việc: Chỉ tính Thứ 2 đến Thứ 7, Chủ Nhật là ngày nghỉ.
 *   Nếu khoảng thời gian cam kết chạy qua Chủ Nhật, Chủ Nhật sẽ được bỏ qua (+24h).
 */

const SLA_HOURS_MAP = {
  CAO: 24,
  HIGH: 24,
  URGENT: 24,
  TRUNG_BINH: 72,
  MEDIUM: 72,
  THAP: 120,
  LOW: 120,
};

/**
 * Tính toán ngày hạn cam kết (due_date)
 * @param {Date|string} receivedAt - Thời điểm tiếp nhận
 * @param {string} priority - Mức ưu tiên (CAO, TRUNG_BINH, THAP)
 * @returns {Date} - Thời điểm hết hạn cam kết theo chuẩn QT-04
 */
function calculateDueDate(receivedAt = new Date(), priority = 'TRUNG_BINH') {
  const startDate = new Date(receivedAt);
  const normalizedPriority = String(priority).toUpperCase();
  const totalWorkingHoursNeeded = SLA_HOURS_MAP[normalizedPriority] || 72;

  if (Number.isNaN(startDate.getTime())) throw new RangeError('Thời điểm tiếp nhận không hợp lệ.');
  // Việt Nam dùng UTC+7; tính theo từng đoạn đến nửa đêm để giữ chính xác phút/giây.
  const offset = 7 * 60 * 60 * 1000;
  const dayMs = 24 * 60 * 60 * 1000;
  let current = startDate.getTime();
  let remaining = totalWorkingHoursNeeded * 60 * 60 * 1000;
  while (remaining > 0) {
    const local = current + offset;
    const nextMidnight = (Math.floor(local / dayMs) + 1) * dayMs - offset;
    const interval = nextMidnight - current;
    if (new Date(local).getUTCDay() === 0) {
      current = nextMidnight;
    } else if (remaining <= interval) {
      current += remaining;
      remaining = 0;
    } else {
      remaining -= interval;
      current = nextMidnight;
    }
  }
  return new Date(current);
}

module.exports = {
  SLA_HOURS_MAP,
  calculateDueDate,
};

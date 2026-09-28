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
  URGENT: 12,
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

  let current = new Date(startDate.getTime());
  let workingHoursAdded = 0;

  // Tăng từng giờ: nếu giờ đó không thuộc Chủ Nhật thì tính 1 giờ làm việc
  while (workingHoursAdded < totalWorkingHoursNeeded) {
    current.setTime(current.getTime() + 60 * 60 * 1000);
    // getDay() === 0 là Chủ Nhật (nghỉ)
    if (current.getDay() !== 0) {
      workingHoursAdded += 1;
    }
  }

  return current;
}

module.exports = {
  SLA_HOURS_MAP,
  calculateDueDate,
};

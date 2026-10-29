const tickets = require('../repositories/ticketRepository');

// Gắn ảnh với chính đối tượng phiếu trong kho prototype; không dùng mã phiếu
// làm khóa lưu bền vững vì mã có thể được cấp lại sau khi khởi động lại.
const photos = require('../repositories/handoverPhotoStore');

function imageType(bytes) {
  if (!Buffer.isBuffer(bytes)) return null;
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}

function save(req, res) {
  const ticket = tickets.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Không tìm thấy phiếu bảo hành.' });
  if (!['HOAN_TAT', 'DA_BAN_GIAO'].includes(ticket.status)) return res.status(409).json({ message: 'Chỉ thêm ảnh sau khi hoàn thành sửa chữa.' });
  const type = imageType(req.body);
  if (!type || type !== req.get('content-type')?.split(';')[0].trim().toLowerCase()) {
    return res.status(415).json({ message: 'Vui lòng chọn ảnh JPEG, PNG hoặc WebP hợp lệ.' });
  }
  photos.set(ticket, { bytes: req.body, type });
  tickets.addStatusLog({ ticket_id: ticket.id, from_status: ticket.status, to_status: ticket.status,
    changed_by: req.user.username, note: 'Cập nhật ảnh minh chứng bàn giao.' });
  return res.status(200).json({ success: true, message: 'Đã lưu ảnh minh chứng bàn giao.' });
}

function get(req, res) {
  const ticket = tickets.findById(req.params.id);
  if (!ticket) return res.status(404).json({ message: 'Không tìm thấy phiếu bảo hành.' });
  const photo = photos.get(ticket);
  if (!photo) return res.status(404).json({ message: 'Phiếu chưa có ảnh bàn giao.' });
  res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  return res.type(photo.type).send(photo.bytes);
}

module.exports = { save, get };

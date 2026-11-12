const { query } = require('./pgTicketRepository');
const memStore = require('./handoverPhotoStore');

module.exports = {
  async get(ticket) {
    if (ticket && ticket.ticket_id) {
      try {
        const row = (await query('SELECT bytes,content_type AS type FROM ticket_handover_photo WHERE ticket_id=$1', [ticket.ticket_id])).rows[0];
        if (row) return row;
      } catch (e) {}
    }
    return memStore.get(ticket);
  },

  async has(ticket) {
    if (ticket && ticket.ticket_id) {
      try {
        const hasDb = (await query('SELECT 1 FROM ticket_handover_photo WHERE ticket_id=$1', [ticket.ticket_id])).rowCount > 0;
        if (hasDb) return true;
      } catch (e) {}
    }
    return memStore.has(ticket);
  },

  async set(ticket, photo) {
    if (ticket && ticket.ticket_id) {
      try {
        await query(
          `INSERT INTO ticket_handover_photo(ticket_id,bytes,content_type) VALUES($1,$2,$3)
           ON CONFLICT(ticket_id) DO UPDATE SET bytes=EXCLUDED.bytes,content_type=EXCLUDED.content_type,updated_at=now()`,
          [ticket.ticket_id, photo.bytes, photo.type]
        );
      } catch (e) {}
    }
    return memStore.set(ticket, photo);
  },
};

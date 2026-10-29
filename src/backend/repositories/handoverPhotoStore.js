const photos = new WeakMap();

module.exports = {
  get(ticket) { return photos.get(ticket); },
  set(ticket, photo) { photos.set(ticket, photo); },
  has(ticket) { return photos.has(ticket); },
};

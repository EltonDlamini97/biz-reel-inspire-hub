export const dayIndex = (len: number) => {
  if (!len) return 0;
  const d = new Date();
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const day = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - start) / 86400000);
  return day % len;
};

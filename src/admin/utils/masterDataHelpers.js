/** Match a master data item by display name (case-insensitive). */
export function findMasterItemByName(items, name) {
  if (!name?.trim()) return null;
  const normalized = name.trim().toLowerCase();
  return items.find((item) => item.name.trim().toLowerCase() === normalized) || null;
}

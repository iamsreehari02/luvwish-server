export const generateOrderNumber = () => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, ""); // e.g. "20250608"
  const randomPart = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0"); // e.g. "042"
  return `ORD${datePart}-${randomPart}`;
};

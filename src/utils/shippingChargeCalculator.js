export const calculateShippingCharge = (cartItems, isKeralaLocation) => {
  const reliefPatchName = "relief patch";
  let reliefPatchCount = 0;
  let otherProductCount = 0;

  cartItems.forEach((item) => {
    const name = item.name.toLowerCase();
    const qty = item.quantity || 0;

    if (name.includes(reliefPatchName)) {
      reliefPatchCount += qty;
    } else {
      otherProductCount += qty;
    }
  });

  const rates = isKeralaLocation
    ? {
        reliefPatchOnly: 50,
        default: 70,
      }
    : {
        reliefPatchOnly: 65,
        default: 90,
      };

  // Case 1: Only relief patch(es)
  if (reliefPatchCount > 0 && otherProductCount === 0) {
    return rates.reliefPatchOnly;
  }

  // Case 2: Any other product (with or without relief patch)
  if (otherProductCount > 0) {
    return rates.default;
  }

  // Case 3: Empty cart
  return 0;
};

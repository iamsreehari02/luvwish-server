export const isKerala = (billingData) => {
  if (!billingData?.state) return false;
  return billingData.state.trim().toLowerCase() === "kerala";
};

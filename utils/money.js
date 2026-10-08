/**
 * Money helpers. All arithmetic is done in integer minor units (paise/cents)
 * to avoid floating point drift, then converted back to a 2-decimal number.
 */
export const toMinor = (amount) => Math.round(Number(amount) * 100);
export const fromMinor = (minor) => Math.round(minor) / 100;

export function calculateTotals(lineSubtotalsMinor, taxPercentage = 0, serviceChargePercentage = 0) {
  const subtotal = lineSubtotalsMinor.reduce((sum, v) => sum + v, 0);
  const tax = Math.round((subtotal * taxPercentage) / 100);
  const service = Math.round((subtotal * serviceChargePercentage) / 100);
  return {
    subtotal: fromMinor(subtotal),
    taxAmount: fromMinor(tax),
    serviceCharge: fromMinor(service),
    totalAmount: fromMinor(subtotal + tax + service),
  };
}

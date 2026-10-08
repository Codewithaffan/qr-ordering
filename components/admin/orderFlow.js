import { STATUS_TRANSITIONS } from "@/utils/constants";

/** The single "happy path" action shown as the primary button for each status. */
export const NEXT_STEP = {
  NEW: { status: "ACCEPTED", label: "Accept" },
  ACCEPTED: { status: "PREPARING", label: "Start preparing" },
  PREPARING: { status: "READY", label: "Mark ready" },
  READY: { status: "COMPLETED", label: "Complete" },
};

export const canCancel = (status) => STATUS_TRANSITIONS[status]?.includes("CANCELLED");

/** Insert/replace an order in a list (newest first). insert=false only replaces existing rows. */
export function upsertOrder(list, order, { insert = false, limit = 50 } = {}) {
  const idx = list.findIndex((o) => o._id === order._id);
  if (idx !== -1) {
    const copy = [...list];
    copy[idx] = order;
    return copy;
  }
  return insert ? [order, ...list].slice(0, limit) : list;
}

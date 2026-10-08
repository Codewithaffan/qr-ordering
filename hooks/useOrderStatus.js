"use client";
import { useCallback, useState } from "react";
import { api } from "@/lib/apiClient";
import { useToast } from "@/components/ui/Toast";

/** Changes an order's status through the API and reports the updated order via onUpdated. */
export default function useOrderStatus(onUpdated) {
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);

  const changeStatus = useCallback(
    async (order, status) => {
      setBusyId(order._id);
      try {
        const updated = await api.patch(`/api/orders/${order._id}/status`, { status });
        onUpdated?.(updated);
        toast.success(`${order.orderNumber} is now ${status}`);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setBusyId(null);
      }
    },
    [onUpdated, toast]
  );

  return { busyId, changeStatus };
}

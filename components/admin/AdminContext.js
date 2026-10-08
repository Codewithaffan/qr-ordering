"use client";
import { createContext, useContext } from "react";

const AdminContext = createContext(null);
export const AdminProvider = AdminContext.Provider;

/** { admin, restaurant: { id, name, logo, currency }, connected } */
export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used inside the admin panel");
  return ctx;
}

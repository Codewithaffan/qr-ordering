import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata = {
  title: { default: "QR Ordering System", template: "%s · QR Ordering" },
  description: "Scan. Order. Serve. QR table ordering with real-time order management for restaurants.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#F97316",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}

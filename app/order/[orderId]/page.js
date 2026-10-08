import OrderTracker from "@/components/customer/OrderTracker";

export const metadata = { title: "Your order" };

export default async function OrderPage({ params }) {
  const { orderId } = await params;
  return <OrderTracker orderId={orderId} />;
}

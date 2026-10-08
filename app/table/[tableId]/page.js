import CustomerMenu from "@/components/customer/CustomerMenu";

export const metadata = { title: "Menu" };

export default async function TablePage({ params }) {
  const { tableId } = await params;
  return <CustomerMenu tableParam={tableId} />;
}

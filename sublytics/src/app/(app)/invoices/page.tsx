import { getInvoices } from "@/lib/actions/invoices";
import InvoicesClient from "./InvoicesClient";

export const dynamic = 'force-dynamic';

export default async function Invoices() {
  const invoices = await getInvoices();

  return <InvoicesClient initialInvoices={invoices} />;
}

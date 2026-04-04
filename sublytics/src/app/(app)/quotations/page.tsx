import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import QuotationsClient from "./QuotationsClient";
import { getQuotations } from "@/lib/actions/quotations";

export default async function QuotationsPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch quotations
  const { data: quotations } = await getQuotations();

  // Fetch customers
  const { data: customers } = await supabase
    .from("customers")
    .select("id, name, email, phone")
    .eq("is_active", true)
    .order("name");

  // Fetch plans
  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("id, name, price, currency")
    .eq("is_active", true)
    .order("name");

  return (
    <QuotationsClient
      initialQuotations={quotations || []}
      customers={customers || []}
      plans={plans || []}
    />
  );
}

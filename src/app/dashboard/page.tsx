import { auth } from "@/auth"
import { redirect } from "next/navigation"
import DashboardLayout from "@/components/dashboard/dashboard-layout"

export const metadata = {
  title: "Dashboard - TCRS POC",
  description: "TCRS Invoice Approval Dashboard",
}

export default async function DashboardPage() {
  const session = await auth()
  
  // Double-check authentication (middleware should handle this, but extra safety)
  if (!session?.user) {
    redirect("/")
  }
  
  return <DashboardLayout user={session.user} />
}
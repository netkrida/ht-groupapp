"use client";

import { PurchaseRequestForm } from "@/components/dashboard/pt-pks/gudang/purchase-request/purchase-request-form";
import { useRouter } from "next/navigation";

export default function CreatePurchaseRequestPage() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buat Purchase Request</h1>
        <p className="text-muted-foreground">
          Form untuk membuat permintaan pembelian material baru
        </p>
      </div>
      <PurchaseRequestForm onSuccess={() => router.push('/dashboard/gudang/purchase-request')} />
    </div>
  );
}

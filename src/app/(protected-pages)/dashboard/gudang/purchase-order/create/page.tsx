"use client";

import { PurchaseOrderForm } from "@/components/dashboard/pt-pks/gudang/purchase-order/purchase-order-form";
import { useRouter } from "next/navigation";

export default function CreatePurchaseOrderPage() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buat Purchase Order</h1>
        <p className="text-muted-foreground">
          Form untuk membuat order pembelian material ke vendor
        </p>
      </div>
      <PurchaseOrderForm onSuccess={() => router.push('/dashboard/gudang/purchase-order')} />
    </div>
  );
}

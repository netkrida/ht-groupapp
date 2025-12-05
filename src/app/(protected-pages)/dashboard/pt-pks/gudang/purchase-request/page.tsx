import { PurchaseRequestList } from "@/components/dashboard/pt-pks/gudang/purchase-request/purchase-request-list";

export default function PurchaseRequestPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Purchase Request (PR)</h1>
        <p className="text-muted-foreground">
          Permintaan pembelian dari gudang ke Head Office untuk persetujuan
        </p>
      </div>
      <PurchaseRequestList />
    </div>
  );
}

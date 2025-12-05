"use client";

import { PenerimaanBarangForm } from "@/components/dashboard/pt-pks/gudang/penerimaan-barang/penerimaan-barang-form";
import { useRouter } from "next/navigation";

export default function CreatePenerimaanBarangPage() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Buat Penerimaan Barang</h1>
        <p className="text-muted-foreground">
          Form untuk mencatat penerimaan material dari supplier
        </p>
      </div>
      <PenerimaanBarangForm onSuccess={() => router.push('/dashboard/gudang/penerimaan-barang')} />
    </div>
  );
}

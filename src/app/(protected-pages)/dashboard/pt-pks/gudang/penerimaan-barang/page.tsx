import { PenerimaanBarangList } from "@/components/dashboard/pt-pks/gudang/penerimaan-barang/penerimaan-barang-list";

export default function PenerimaanBarangPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Penerimaan Barang</h1>
        <p className="text-muted-foreground">
          Penerimaan barang dari vendor dan update stock otomatis
        </p>
      </div>
      <PenerimaanBarangList />
    </div>
  );
}

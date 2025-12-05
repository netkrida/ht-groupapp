import { MaterialInventarisDetail } from "@/components/dashboard/pt-pks/gudang/material-inventaris/material-inventaris-detail";

export default function MaterialDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="container mx-auto py-6">
      <MaterialInventarisDetail materialId={params.id} />
    </div>
  );
}

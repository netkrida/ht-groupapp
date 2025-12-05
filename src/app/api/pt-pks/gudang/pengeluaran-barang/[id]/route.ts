import { requireAuthWithRole } from "@/lib/api-auth";
import { pengeluaranBarangService } from "@/server/services/pt-pks/pengeluaran-barang.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/gudang/pengeluaran-barang/[id]
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
    "Staff PT PKS",
    "Staff Gudang",
  ]);
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const pengeluaran = await pengeluaranBarangService.getById(params.id, companyId);
    return NextResponse.json(pengeluaran);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }
}

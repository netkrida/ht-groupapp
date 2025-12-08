import { requireAuthWithRole } from "@/lib/api-auth";
import { pengeluaranBarangService } from "@/server/services/pt-pks/pengeluaran-barang.service";
import { StatusPengeluaranBarang } from "@prisma/client";
import { NextResponse } from "next/server";

// GET /api/pt-pks/pengeluaran-barang
export async function GET(request: Request) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as StatusPengeluaranBarang | null;
    const divisi = searchParams.get("divisi");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filters: any = {};
    if (status) filters.status = status;
    if (divisi) filters.divisi = divisi;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const pengeluaranBarang = await pengeluaranBarangService.getAll(companyId, filters);
    return NextResponse.json(pengeluaranBarang);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

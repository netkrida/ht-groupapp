import { requireAuthWithRole } from "@/lib/api-auth";
import { pengeluaranBarangService } from "@/server/services/pt-pks/pengeluaran-barang.service";
import { NextResponse } from "next/server";

// POST /api/pt-pks/pengeluaran-barang/create-from-sr
// Create pengeluaran barang from approved Store Request
export async function POST(request: Request) {
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

    const body = await request.json();
    const { storeRequestId } = body;

    if (!storeRequestId) {
      return NextResponse.json({ error: "Store Request ID is required" }, { status: 400 });
    }

    const issuedBy = session.user.name || session.user.email || "Unknown";
    const operator = session.user.name || session.user.email || "Unknown";

    const pengeluaran = await pengeluaranBarangService.createFromStoreRequest(
      companyId,
      storeRequestId,
      issuedBy,
      operator
    );

    return NextResponse.json(pengeluaran, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

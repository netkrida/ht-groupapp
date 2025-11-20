import { NextResponse } from "next/server";
import { requireAuthWithRole } from "@/lib/api-auth";
import { tangkiService } from "@/server/services/pt-pks/tangki.service";

/**
 * POST /api/pt-pks/tangki/stock/keluar
 * Remove stock from tangki
 */
export async function POST(request: Request) {
  const { error, session } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
    "Staff PT PKS",
  ]);
  if (error) return error;

  try {
    const body = await request.json();
    
    const result = await tangkiService.removeStock({
      tangkiId: body.tangkiId,
      jumlah: body.jumlah,
      referensi: body.referensi,
      keterangan: body.keterangan,
      operator: session.user.name ?? "Unknown",
      tanggalTransaksi: body.tanggalTransaksi,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error removing stock:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to remove stock" },
      { status: 500 },
    );
  }
}

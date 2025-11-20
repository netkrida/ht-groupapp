import { NextResponse } from "next/server";
import { requireAuthWithRole } from "@/lib/api-auth";
import { tangkiService } from "@/server/services/pt-pks/tangki.service";

/**
 * GET /api/pt-pks/tangki/stock/history
 * Get stock transaction history
 */
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
    "Staff PT PKS",
  ]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    
    const filter = {
      tangkiId: searchParams.get("tangkiId") ?? undefined,
      tipeTransaksi: searchParams.get("tipeTransaksi") as any,
      tanggalMulai: searchParams.get("tanggalMulai") ?? undefined,
      tanggalSelesai: searchParams.get("tanggalSelesai") ?? undefined,
      page: parseInt(searchParams.get("page") ?? "1"),
      limit: parseInt(searchParams.get("limit") ?? "10"),
    };

    const result = await tangkiService.getStockHistory(filter);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching stock history:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock history" },
      { status: 500 },
    );
  }
}

import { NextResponse } from "next/server";
import { requireAuthWithRole } from "@/lib/api-auth";
import { tangkiService } from "@/server/services/pt-pks/tangki.service";

/**
 * POST /api/pt-pks/tangki/stock/transfer
 * Transfer stock between tanks
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
    
    const result = await tangkiService.transferStock(
      body.tangkiAsalId,
      body.tangkiTujuanId,
      body.jumlah,
      session.user.name ?? "Unknown",
      body.keterangan,
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error transferring stock:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to transfer stock" },
      { status: 500 },
    );
  }
}

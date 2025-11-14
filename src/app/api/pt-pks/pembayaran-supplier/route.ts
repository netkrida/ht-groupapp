import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { penerimaanTBSService } from "@/server/services/pt-pks/penerimaan-tbs.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const pembayaran = await penerimaanTBSService.getPembayaranSupplier(
      session.user.company.id
    );
    return NextResponse.json(pembayaran);
  } catch (error) {
    console.error("Error fetching pembayaran supplier:", error);
    return NextResponse.json(
      { error: "Failed to fetch pembayaran supplier" },
      { status: 500 }
    );
  }
}

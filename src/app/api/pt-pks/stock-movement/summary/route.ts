import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { stockMovementService } from "@/server/services/pt-pks/stock-movement.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const summary = await stockMovementService.getStockSummary(
      session.user.company.id
    );
    
    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching stock summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock summary" },
      { status: 500 }
    );
  }
}

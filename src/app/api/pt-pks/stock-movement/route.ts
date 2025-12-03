import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { stockMovementService } from "@/server/services/pt-pks/stock-movement.service";
import type { TipeMovement } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const materialId = searchParams.get("materialId");
    const tipeMovement = searchParams.get("tipeMovement") as TipeMovement | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const referensi = searchParams.get("referensi");

    if (id) {
      const movement = await stockMovementService.getStockMovementById(id);
      return NextResponse.json(movement);
    }

    const filters: any = {};
    if (materialId) filters.materialId = materialId;
    if (tipeMovement) filters.tipeMovement = tipeMovement;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (referensi) filters.referensi = referensi;

    const movements = await stockMovementService.getStockMovements(
      session.user.company.id,
      filters
    );
    
    return NextResponse.json(movements);
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock movements" },
      { status: 500 }
    );
  }
}

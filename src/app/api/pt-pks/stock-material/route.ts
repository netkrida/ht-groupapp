import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { materialService } from "@/server/services/pt-pks/material.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const stocks = await materialService.getStockMaterialsByCompany(
      session.user.company.id
    );
    return NextResponse.json(stocks);
  } catch (error) {
    console.error("Error fetching stock materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock materials" },
      { status: 500 }
    );
  }
}

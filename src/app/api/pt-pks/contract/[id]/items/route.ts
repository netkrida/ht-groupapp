import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contractId = params.id;

    const contractItems = await db.contractItem.findMany({
      where: {
        contractId,
        contract: {
          companyId: session.user.company.id,
        },
        quantity: {
          gt: 0, // Only show items with remaining quantity
        },
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(contractItems);
  } catch (error) {
    console.error("Error fetching contract items:", error);
    return NextResponse.json(
      { error: "Failed to fetch contract items" },
      { status: 500 }
    );
  }
}

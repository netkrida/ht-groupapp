import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId");

    const where: any = {
      vendor: {
        companyId: session.user.company.id,
      },
      status: "ACTIVE",
    };

    if (vendorId) {
      where.vendorId = vendorId;
    }

    const vehicles = await db.vendorVehicle.findMany({
      where,
      include: {
        vendor: true,
      },
      orderBy: {
        nomorKendaraan: "asc",
      },
    });

    return NextResponse.json(vehicles);
  } catch (error) {
    console.error("Error fetching vendor vehicles:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendor vehicles" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { penerimaanTBSService } from "@/server/services/pt-pks/penerimaan-tbs.service";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const materialId = searchParams.get("materialId");

    if (!materialId) {
      return NextResponse.json(
        { error: "materialId is required" },
        { status: 400 }
      );
    }

    const statistics = await penerimaanTBSService.getTBSStatistics(
      session.user.company.id,
      materialId
    );
    return NextResponse.json(statistics);
  } catch (error) {
    console.error("Error fetching TBS statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch TBS statistics" },
      { status: 500 }
    );
  }
}

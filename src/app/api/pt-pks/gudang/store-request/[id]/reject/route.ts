import { NextRequest, NextResponse } from "next/server";
import { requireAuthWithRole } from "@/lib/api-auth";
import { storeRequestService } from "@/server/services/pt-pks/store-request.service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuthWithRole([
      "Admin",
      "Manager PT PKS",
    ]);

    if (authResult.error || !authResult.session) {
      return authResult.error;
    }

    const companyId = authResult.session.user.company?.code;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID tidak ditemukan" }, { status: 400 });
    }
    const storeRequest = await storeRequestService.reject(params.id, companyId);

    return NextResponse.json(storeRequest);
  } catch (error) {
    console.error("Error rejecting store request:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Failed to reject store request" },
      { status: 500 }
    );
  }
}

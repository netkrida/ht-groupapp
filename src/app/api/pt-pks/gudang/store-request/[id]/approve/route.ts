import { requireAuthWithRole } from "@/lib/api-auth";
import { storeRequestService } from "@/server/services/pt-pks/store-request.service";
import { NextResponse } from "next/server";

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const { error, session } = await requireAuthWithRole(["Admin", "Manager PT PKS"]);
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const { approvedBy } = body;

    const sr = await storeRequestService.approve(params.id, companyId, approvedBy);
    return NextResponse.json(sr);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

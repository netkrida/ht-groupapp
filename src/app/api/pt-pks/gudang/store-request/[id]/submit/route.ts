import { requireAuthWithRole } from "@/lib/api-auth";
import { storeRequestService } from "@/server/services/pt-pks/store-request.service";
import { NextResponse } from "next/server";

// POST /api/pt-pks/gudang/store-request/[id]/submit
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { error, session } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
    "Staff PT PKS",
  ]);
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const sr = await storeRequestService.submit(params.id, companyId);
    return NextResponse.json(sr);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

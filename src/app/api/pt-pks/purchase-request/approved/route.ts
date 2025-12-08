import { requireAuthWithRole } from "@/lib/api-auth";
import { purchaseRequestService } from "@/server/services/pt-pks/purchase-request.service";
import { NextResponse } from "next/server";

// GET approved PRs for PO (type PENGAJUAN_PO)
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithRole(["Admin", "Manager PT PKS", "Staff PT PKS"]);
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const prs = await purchaseRequestService.getApprovedForPO(companyId);
    return NextResponse.json(prs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

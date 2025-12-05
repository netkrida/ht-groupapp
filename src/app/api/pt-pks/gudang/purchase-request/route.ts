import { requireAuthWithRole } from "@/lib/api-auth";
import { purchaseRequestService } from "@/server/services/pt-pks/purchase-request.service";
import { purchaseRequestSchema } from "@/server/schema/purchase-request";
import { StatusPurchaseRequest } from "@prisma/client";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { error, session } = await requireAuthWithRole(["Admin", "Manager PT PKS", "Staff PT PKS", "Staff Gudang"]);
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as StatusPurchaseRequest | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filters: any = {};
    if (status) filters.status = status;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const prs = await purchaseRequestService.getAll(companyId, filters);
    return NextResponse.json(prs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithRole(["Admin", "Manager PT PKS", "Staff Gudang"]);
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = purchaseRequestSchema.parse(body);

    const pr = await purchaseRequestService.create(companyId, validatedData);
    return NextResponse.json(pr, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

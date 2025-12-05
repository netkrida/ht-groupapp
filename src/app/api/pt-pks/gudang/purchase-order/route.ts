import { requireAuthWithRole } from "@/lib/api-auth";
import { purchaseOrderService } from "@/server/services/pt-pks/purchase-order.service";
import { purchaseOrderSchema } from "@/server/schema/purchase-order";
import { StatusPurchaseOrder } from "@prisma/client";
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
    const status = searchParams.get("status") as StatusPurchaseOrder | null;
    const vendorId = searchParams.get("vendorId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filters: any = {};
    if (status) filters.status = status;
    if (vendorId) filters.vendorId = vendorId;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const pos = await purchaseOrderService.getAll(companyId, filters);
    return NextResponse.json(pos);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireAuthWithRole(["Admin", "Manager PT PKS"]);
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const body = await request.json();
    const validatedData = purchaseOrderSchema.parse(body);

    const po = await purchaseOrderService.create(companyId, validatedData);
    return NextResponse.json(po, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

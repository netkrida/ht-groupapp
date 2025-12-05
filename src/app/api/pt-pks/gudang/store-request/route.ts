import { requireAuthWithRole } from "@/lib/api-auth";
import { storeRequestService } from "@/server/services/pt-pks/store-request.service";
import { storeRequestSchema } from "@/server/schema/store-request";
import { StatusStoreRequest } from "@prisma/client";
import { NextResponse } from "next/server";

// GET /api/pt-pks/gudang/store-request
export async function GET(request: Request) {
  const { error, session } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
    "Staff PT PKS",
    "Staff Gudang",
  ]);
  if (error) return error;

  try {
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json({ error: "Company ID not found" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as StatusStoreRequest | null;
    const divisi = searchParams.get("divisi");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const filters: any = {};
    if (status) filters.status = status;
    if (divisi) filters.divisi = divisi;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    const storeRequests = await storeRequestService.getAll(companyId, filters);
    return NextResponse.json(storeRequests);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/pt-pks/gudang/store-request
export async function POST(request: Request) {
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

    const body = await request.json();
    const validatedData = storeRequestSchema.parse(body);

    const sr = await storeRequestService.create(companyId, validatedData);
    return NextResponse.json(sr, { status: 201 });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Validation error", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { requireAuthWithRole } from "@/lib/api-auth";
import { penggajianService } from "@/server/services/pt-pks/penggajian.service";
import { penggajianQuerySchema } from "@/server/schema/penggajian";
import { NextResponse } from "next/server";

// GET /api/pt-pks/penggajian - Get all penggajian
export async function GET(request: Request) {
  const { error } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
    "Staff PT PKS",
  ]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);

    // Check if requesting devisi list
    const devisiList = searchParams.get("devisiList");
    if (devisiList === "true") {
      const devisiData = await penggajianService.getDevisiList();
      return NextResponse.json({ devisi: devisiData });
    }

    // Check if requesting periode list
    const periodeList = searchParams.get("periodeList");
    if (periodeList === "true") {
      const periodeData = await penggajianService.getPeriodeList();
      return NextResponse.json({ periode: periodeData });
    }

    // Check if requesting summary
    const summary = searchParams.get("summary");
    if (summary === "true") {
      const periodeBulan = searchParams.get("periodeBulan");
      const periodeTahun = searchParams.get("periodeTahun");
      const summaryData = await penggajianService.getSummary(
        periodeBulan ? parseInt(periodeBulan) : undefined,
        periodeTahun ? parseInt(periodeTahun) : undefined
      );
      return NextResponse.json({ summary: summaryData });
    }

    // Parse query parameters
    const query = penggajianQuerySchema.parse({
      search: searchParams.get("search") || undefined,
      devisi: searchParams.get("devisi") || undefined,
      periodeBulan: searchParams.get("periodeBulan") || undefined,
      periodeTahun: searchParams.get("periodeTahun") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 100,
    });

    const result = await penggajianService.getPenggajian(query);

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("Error fetching penggajian:", error);

    if (error && typeof error === 'object' && 'errors' in error) {
      return NextResponse.json(
        { error: "Validation error", details: (error as { errors: unknown }).errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch penggajian" },
      { status: 500 }
    );
  }
}

// POST /api/pt-pks/penggajian - Create new penggajian
export async function POST(request: Request) {
  const { error } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
    "Staff PT PKS",
  ]);
  if (error) return error;

  try {
    const body = await request.json();
    const penggajian = await penggajianService.createPenggajian(body);

    return NextResponse.json(
      { message: "Penggajian created successfully", penggajian },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error("Error creating penggajian:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to create penggajian" },
      { status: 500 }
    );
  }
}

// DELETE /api/pt-pks/penggajian - Delete penggajian by periode
export async function DELETE(request: Request) {
  const { error } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
  ]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const periodeBulan = searchParams.get("periodeBulan");
    const periodeTahun = searchParams.get("periodeTahun");

    if (!periodeBulan || !periodeTahun) {
      return NextResponse.json(
        { error: "Periode bulan dan tahun wajib diisi" },
        { status: 400 }
      );
    }

    await penggajianService.deletePenggajianByPeriode(
      parseInt(periodeBulan),
      parseInt(periodeTahun)
    );

    return NextResponse.json({ message: "Penggajian deleted successfully" });
  } catch (error: unknown) {
    console.error("Error deleting penggajian:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Failed to delete penggajian" },
      { status: 500 }
    );
  }
}

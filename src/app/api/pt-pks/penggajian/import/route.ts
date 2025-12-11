import { requireAuthWithRole } from "@/lib/api-auth";
import { penggajianService } from "@/server/services/pt-pks/penggajian.service";
import { NextResponse } from "next/server";

// POST /api/pt-pks/penggajian/import - Import penggajian from Excel
export async function POST(request: Request) {
  const { error } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
  ]);
  if (error) return error;

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const periodeBulan = formData.get("periodeBulan") as string | null;
    const periodeTahun = formData.get("periodeTahun") as string | null;
    const replaceExisting = formData.get("replaceExisting") === "true";

    if (!file) {
      return NextResponse.json(
        { error: "File Excel wajib diupload" },
        { status: 400 }
      );
    }

    if (!periodeBulan || !periodeTahun) {
      return NextResponse.json(
        { error: "Periode bulan dan tahun wajib diisi" },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".xlsx") && !fileName.endsWith(".xls")) {
      return NextResponse.json(
        { error: "File harus berformat Excel (.xlsx atau .xls)" },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Import data
    const result = await penggajianService.importFromExcelFlexible(
      buffer,
      parseInt(periodeBulan),
      parseInt(periodeTahun),
      replaceExisting
    );

    return NextResponse.json({
      message: `Berhasil mengimport ${result.imported} data penggajian`,
      result,
    });
  } catch (error: unknown) {
    console.error("Error importing penggajian:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Gagal mengimport data penggajian" },
      { status: 500 }
    );
  }
}

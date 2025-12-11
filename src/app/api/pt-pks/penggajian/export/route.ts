import { requireAuthWithRole } from "@/lib/api-auth";
import { penggajianService } from "@/server/services/pt-pks/penggajian.service";
import { NextResponse } from "next/server";

// GET /api/pt-pks/penggajian/export - Export penggajian to Excel
export async function GET(request: Request) {
  const { error } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
    "Staff PT PKS",
  ]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const periodeBulan = searchParams.get("periodeBulan");
    const periodeTahun = searchParams.get("periodeTahun");

    const buffer = await penggajianService.exportToExcel(
      periodeBulan ? parseInt(periodeBulan) : undefined,
      periodeTahun ? parseInt(periodeTahun) : undefined
    );

    // Create filename
    const bulanNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    let filename = 'Penggajian';
    if (periodeBulan && periodeTahun) {
      filename = `Penggajian_${bulanNames[parseInt(periodeBulan) - 1]}_${periodeTahun}`;
    } else if (periodeTahun) {
      filename = `Penggajian_${periodeTahun}`;
    }
    filename += '.xlsx';

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    console.error("Error exporting penggajian:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Gagal mengexport data penggajian" },
      { status: 500 }
    );
  }
}

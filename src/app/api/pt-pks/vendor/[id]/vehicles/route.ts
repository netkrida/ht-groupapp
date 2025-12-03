import { requireAuthWithRole } from "@/lib/api-auth";
import { vendorVehicleService } from "@/server/services/pt-pks/vendor-vehicle.service";
import { NextResponse } from "next/server";

interface Params {
  params: {
    id: string;
  };
}

// GET /api/pt-pks/vendor/[id]/vehicles - Get all vehicles for a vendor
export async function GET(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
    "Staff PT PKS",
  ]);
  if (error) return error;

  try {
    const vendorId = params.id;

    // Get companyId from session
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    
    // Check if requesting for dropdown
    const dropdown = searchParams.get("dropdown");
    if (dropdown === "true") {
      const vehicles = await vendorVehicleService.getActiveVehicles(vendorId, companyId);
      return NextResponse.json({ vehicles });
    }

    // Check if requesting for statistics
    const stats = searchParams.get("stats");
    if (stats === "true") {
      const statistics = await vendorVehicleService.getVehicleStatistics(vendorId, companyId);
      return NextResponse.json({ statistics });
    }

    const vehicles = await vendorVehicleService.getVehiclesByVendorId(vendorId, companyId);

    return NextResponse.json({ vehicles });
  } catch (error: any) {
    console.error("Error fetching vehicles:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch vehicles" },
      { status: 400 }
    );
  }
}

// POST /api/pt-pks/vendor/[id]/vehicles - Create a new vehicle
export async function POST(request: Request, { params }: Params) {
  const { error, session } = await requireAuthWithRole([
    "Admin",
    "Manager PT PKS",
    "Staff PT PKS",
  ]);
  if (error) return error;

  try {
    const vendorId = params.id;
    const body = await request.json();

    // Get companyId from session
    const companyId = session.user.company?.id;
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID not found" },
        { status: 400 }
      );
    }

    // Create vehicle
    const vehicle = await vendorVehicleService.createVehicle(vendorId, companyId, body);

    return NextResponse.json({ vehicle }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating vehicle:", error);

    // Handle validation errors
    if (error.errors) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to create vehicle" },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { supplierRepository } from "@/server/repositories/supplier.repository";

export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    let suppliers;

    if (search && search.trim() !== "") {
      // Search suppliers by name, company name, or address
      suppliers = await supplierRepository.search(
        session.user.company.id,
        search.trim()
      );
    } else {
      // Get all suppliers
      suppliers = await supplierRepository.findByCompanyId(session.user.company.id);
    }

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("Error fetching suppliers for penerimaan:", error);
    return NextResponse.json(
      { error: "Failed to fetch suppliers" },
      { status: 500 }
    );
  }
}


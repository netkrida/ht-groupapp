import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { materialService } from "@/server/services/pt-pks/material.service";
import {
  createMaterialSchema,
  updateMaterialSchema,
} from "@/server/schema/material";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const materials = await materialService.getMaterialsByCompany(
      session.user.company.id
    );
    return NextResponse.json(materials);
  } catch (error) {
    console.error("Error fetching materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch materials" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = createMaterialSchema.parse(body);

    const material = await materialService.createMaterial(
      session.user.company.id,
      data
    );
    return NextResponse.json(material, { status: 201 });
  } catch (error: any) {
    console.error("Error creating material:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create material" },
      { status: 400 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const validatedData = updateMaterialSchema.parse(data);
    const material = await materialService.updateMaterial(id, validatedData);
    return NextResponse.json(material);
  } catch (error: any) {
    console.error("Error updating material:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update material" },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.company?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    await materialService.deleteMaterial(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting material:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete material" },
      { status: 400 }
    );
  }
}

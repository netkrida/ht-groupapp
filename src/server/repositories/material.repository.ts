import { db } from "@/server/db";
import type {
  CreateKategoriMaterialInput,
  UpdateKategoriMaterialInput,
  CreateSatuanMaterialInput,
  UpdateSatuanMaterialInput,
  CreateMaterialInput,
  UpdateMaterialInput,
} from "@/server/schema/material";

export class MaterialRepository {
  // Kategori Material
  async createKategoriMaterial(companyId: string, data: CreateKategoriMaterialInput) {
    return db.kategoriMaterial.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async getKategoriMaterialsByCompany(companyId: string) {
    return db.kategoriMaterial.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    });
  }

  async getKategoriMaterialById(id: string) {
    return db.kategoriMaterial.findUnique({
      where: { id },
    });
  }

  async updateKategoriMaterial(id: string, data: UpdateKategoriMaterialInput) {
    return db.kategoriMaterial.update({
      where: { id },
      data,
    });
  }

  async deleteKategoriMaterial(id: string) {
    return db.kategoriMaterial.delete({
      where: { id },
    });
  }

  // Satuan Material
  async createSatuanMaterial(companyId: string, data: CreateSatuanMaterialInput) {
    return db.satuanMaterial.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async getSatuanMaterialsByCompany(companyId: string) {
    return db.satuanMaterial.findMany({
      where: { companyId },
      orderBy: { name: "asc" },
    });
  }

  async getSatuanMaterialById(id: string) {
    return db.satuanMaterial.findUnique({
      where: { id },
    });
  }

  async updateSatuanMaterial(id: string, data: UpdateSatuanMaterialInput) {
    return db.satuanMaterial.update({
      where: { id },
      data,
    });
  }

  async deleteSatuanMaterial(id: string) {
    return db.satuanMaterial.delete({
      where: { id },
    });
  }

  // Material
  async createMaterial(companyId: string, data: CreateMaterialInput) {
    return db.material.create({
      data: {
        ...data,
        companyId,
      },
      include: {
        kategori: true,
        satuan: true,
      },
    });
  }

  async getMaterialsByCompany(companyId: string) {
    return db.material.findMany({
      where: { companyId },
      include: {
        kategori: true,
        satuan: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async getMaterialsForDropdown(companyId: string) {
    return db.material.findMany({
      where: { companyId },
      select: {
        id: true,
        code: true,
        name: true,
        satuan: {
          select: {
            name: true,
            symbol: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async getMaterialById(id: string) {
    return db.material.findUnique({
      where: { id },
      include: {
        kategori: true,
        satuan: true,
      },
    });
  }

  async getMaterialByCode(code: string) {
    return db.material.findUnique({
      where: { code },
      include: {
        kategori: true,
        satuan: true,
      },
    });
  }

  async updateMaterial(id: string, data: UpdateMaterialInput) {
    return db.material.update({
      where: { id },
      data,
      include: {
        kategori: true,
        satuan: true,
      },
    });
  }

  async deleteMaterial(id: string) {
    return db.material.delete({
      where: { id },
    });
  }

  // Stock Material
  async getStockMaterial(companyId: string, materialId: string) {
    return db.stockMaterial.findUnique({
      where: {
        companyId_materialId: {
          companyId,
          materialId,
        },
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
      },
    });
  }

  async getStockMaterialsByCompany(companyId: string) {
    return db.stockMaterial.findMany({
      where: { companyId },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
      },
      orderBy: { material: { name: "asc" } },
    });
  }

  async updateStockMaterial(
    companyId: string, 
    materialId: string, 
    jumlah: number,
    options?: {
      referensi?: string;
      keterangan?: string;
      operator?: string;
    }
  ) {
    // Get current stock
    const currentStock = await db.stockMaterial.findUnique({
      where: {
        companyId_materialId: {
          companyId,
          materialId,
        },
      },
    });

    const stockSebelum = currentStock?.jumlah || 0;
    const stockSesudah = stockSebelum + jumlah;

    // Update stock
    const updated = await db.stockMaterial.upsert({
      where: {
        companyId_materialId: {
          companyId,
          materialId,
        },
      },
      create: {
        companyId,
        materialId,
        jumlah,
      },
      update: {
        jumlah: {
          increment: jumlah,
        },
      },
    });

    // Record stock movement
    const tipeMovement = jumlah > 0 ? "IN" : jumlah < 0 ? "OUT" : "ADJUSTMENT";
    await db.stockMovement.create({
      data: {
        companyId,
        materialId,
        tipeMovement,
        jumlah: Math.abs(jumlah),
        stockSebelum,
        stockSesudah,
        referensi: options?.referensi || null,
        keterangan: options?.keterangan || null,
        operator: options?.operator || "system",
        tanggalTransaksi: new Date(),
      },
    });

    return updated;
  }
}

export const materialRepository = new MaterialRepository();

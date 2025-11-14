import { db } from "@/server/db";
import type {
  CreateTransporterInput,
  UpdateTransporterInput,
} from "@/server/schema/transporter";

export class TransporterRepository {
  async createTransporter(companyId: string, data: CreateTransporterInput) {
    return db.transporter.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async getTransportersByCompany(companyId: string) {
    return db.transporter.findMany({
      where: { companyId },
      include: {
        supplierTransporters: {
          include: {
            supplier: true,
          },
        },
      },
      orderBy: { nomorKendaraan: "asc" },
    });
  }

  async getTransporterById(id: string) {
    return db.transporter.findUnique({
      where: { id },
      include: {
        supplierTransporters: {
          include: {
            supplier: true,
          },
        },
        penerimaanTBS: {
          include: {
            supplier: true,
            material: true,
          },
          orderBy: { tanggalTerima: "desc" },
        },
      },
    });
  }

  async getTransporterByNomorKendaraan(companyId: string, nomorKendaraan: string) {
    return db.transporter.findUnique({
      where: {
        nomorKendaraan_companyId: {
          nomorKendaraan,
          companyId,
        },
      },
    });
  }

  async updateTransporter(id: string, data: UpdateTransporterInput) {
    return db.transporter.update({
      where: { id },
      data,
    });
  }

  async deleteTransporter(id: string) {
    return db.transporter.delete({
      where: { id },
    });
  }

  async searchTransporters(companyId: string, search: string) {
    return db.transporter.findMany({
      where: {
        companyId,
        OR: [
          { nomorKendaraan: { contains: search, mode: "insensitive" } },
          { namaSupir: { contains: search, mode: "insensitive" } },
        ],
      },
      orderBy: { nomorKendaraan: "asc" },
    });
  }

  // Supplier-Transporter relationship
  async linkSupplierToTransporter(supplierId: string, transporterId: string) {
    return db.supplierTransporter.create({
      data: {
        supplierId,
        transporterId,
      },
    });
  }

  async getTransportersBySupplierId(supplierId: string) {
    return db.supplierTransporter.findMany({
      where: { supplierId },
      include: {
        transporter: true,
      },
    });
  }
}

export const transporterRepository = new TransporterRepository();

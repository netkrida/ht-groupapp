import { db } from "@/server/db";
import type { CreatePenerimaanTBSInput, UpdatePenerimaanTBSInput } from "@/server/schema/penerimaan-tbs";

export class PenerimaanTBSRepository {
  async generateNomorPenerimaan(companyId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `TBS-${year}${month}`;

    const lastPenerimaan = await db.penerimaanTBS.findFirst({
      where: {
        companyId,
        nomorPenerimaan: {
          startsWith: prefix,
        },
      },
      orderBy: {
        nomorPenerimaan: "desc",
      },
    });

    let sequence = 1;
    if (lastPenerimaan) {
      const lastSequence = parseInt(lastPenerimaan.nomorPenerimaan.split("-").pop() || "0");
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(5, "0")}`;
  }

  async createPenerimaanTBS(companyId: string, data: CreatePenerimaanTBSInput) {
    const nomorPenerimaan = await this.generateNomorPenerimaan(companyId);

    // Kalkulasi
    const beratNetto1 = data.beratBruto - data.beratTarra;
    const potonganKg = (beratNetto1 * data.potonganPersen) / 100;
    const beratNetto2 = beratNetto1 - potonganKg;
    const totalBayar = beratNetto2 * data.hargaPerKg;

    return db.penerimaanTBS.create({
      data: {
        companyId,
        nomorPenerimaan,
        ...data,
        transporterId: data.transporterId!, // pastikan string
        beratNetto1,
        potonganKg,
        beratNetto2,
        totalBayar,
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        supplier: true,
        transporter: true,
      },
    });
  }

  async getPenerimaanTBSByCompany(companyId: string, filters?: {
    status?: string;
    supplierId?: string;
    materialId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return db.penerimaanTBS.findMany({
      where: {
        companyId,
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.supplierId && { supplierId: filters.supplierId }),
        ...(filters?.materialId && { materialId: filters.materialId }),
        ...(filters?.startDate && filters?.endDate && {
          tanggalTerima: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        supplier: true,
        transporter: true,
      },
      orderBy: { tanggalTerima: "desc" },
    });
  }

  async getPenerimaanTBSById(id: string) {
    return db.penerimaanTBS.findUnique({
      where: { id },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        supplier: true,
        transporter: true,
      },
    });
  }

  async getPenerimaanTBSByNomor(nomorPenerimaan: string) {
    return db.penerimaanTBS.findUnique({
      where: { nomorPenerimaan },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        supplier: true,
        transporter: true,
      },
    });
  }

  async updatePenerimaanTBS(id: string, data: UpdatePenerimaanTBSInput) {
    // Recalculate if necessary fields are provided
    let updateData: any = { ...data };

    if (data.beratBruto !== undefined || data.beratTarra !== undefined) {
      const current = await this.getPenerimaanTBSById(id);
      if (!current) throw new Error("Penerimaan TBS tidak ditemukan");

      const beratBruto = data.beratBruto ?? current.beratBruto;
      const beratTarra = data.beratTarra ?? current.beratTarra;
      const beratNetto1 = beratBruto - beratTarra;
      updateData.beratNetto1 = beratNetto1;

      const potonganPersen = data.potonganPersen ?? current.potonganPersen;
      const potonganKg = (beratNetto1 * potonganPersen) / 100;
      updateData.potonganKg = potonganKg;

      const beratNetto2 = beratNetto1 - potonganKg;
      updateData.beratNetto2 = beratNetto2;

      const hargaPerKg = data.hargaPerKg ?? current.hargaPerKg;
      updateData.totalBayar = beratNetto2 * hargaPerKg;
    }

    return db.penerimaanTBS.update({
      where: { id },
      data: updateData,
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        supplier: true,
        transporter: true,
      },
    });
  }

  async deletePenerimaanTBS(id: string) {
    return db.penerimaanTBS.delete({
      where: { id },
    });
  }

  // Statistics
  async getTBSMasukHariIni(companyId: string, materialId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await db.penerimaanTBS.aggregate({
      where: {
        companyId,
        materialId,
        status: "COMPLETED",
        tanggalTerima: {
          gte: today,
          lt: tomorrow,
        },
      },
      _sum: {
        beratNetto2: true,
      },
    });

    return result._sum.beratNetto2 || 0;
  }

  async getTBSMasukBulanIni(companyId: string, materialId: string) {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const result = await db.penerimaanTBS.aggregate({
      where: {
        companyId,
        materialId,
        status: "COMPLETED",
        tanggalTerima: {
          gte: firstDay,
          lte: lastDay,
        },
      },
      _sum: {
        beratNetto2: true,
      },
    });

    return result._sum.beratNetto2 || 0;
  }

  async getTBSBySupplier(companyId: string, materialId: string) {
    return db.penerimaanTBS.groupBy({
      by: ["supplierId"],
      where: {
        companyId,
        materialId,
        status: "COMPLETED",
      },
      _sum: {
        beratNetto2: true,
      },
      _count: {
        id: true,
      },
    });
  }

  async getPembayaranSupplier(companyId: string) {
    return db.penerimaanTBS.findMany({
      where: {
        companyId,
        status: "COMPLETED",
      },
      include: {
        supplier: true,
        material: {
          include: {
            satuan: true,
          },
        },
        transporter: true,
      },
      orderBy: { tanggalTerima: "desc" },
    });
  }
}

export const penerimaanTBSRepository = new PenerimaanTBSRepository();

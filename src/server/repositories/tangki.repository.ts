import { db } from "@/server/db";
import type {
  CreateTangkiInput,
  UpdateTangkiInput,
  CreateStockTangkiInput,
  FilterStockTangkiInput,
} from "../schema/tangki";
import type { Prisma } from "@prisma/client";

export const tangkiRepository = {
  // ==================== TANGKI OPERATIONS ====================

  /**
   * Get all tangki by company
   */
  async getAllTangki(companyId: string, materialId?: string) {
    const where: { companyId: string; materialId?: string } = { companyId };
    if (materialId) {
      where.materialId = materialId;
    }

    return await db.tangki.findMany({
      where,
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
      },
      orderBy: {
        namaTangki: "asc",
      },
    });
  },

  /**
   * Get tangki by ID
   */
  async getTangkiById(id: string, companyId: string) {
    return await db.tangki.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        riwayatStockTangki: {
          take: 10,
          orderBy: {
            tanggalTransaksi: "desc",
          },
        },
      },
    });
  },

  /**
   * Create new tangki
   */
  async createTangki(companyId: string, data: CreateTangkiInput) {
    return await db.tangki.create({
      data: {
        companyId,
        ...data,
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
  },

  /**
   * Update tangki
   */
  async updateTangki(id: string, companyId: string, data: UpdateTangkiInput) {
    return await db.tangki.update({
      where: {
        id,
        companyId,
      },
      data,
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
      },
    });
  },

  /**
   * Delete tangki
   */
  async deleteTangki(id: string, companyId: string) {
    return await db.tangki.delete({
      where: {
        id,
        companyId,
      },
    });
  },

  /**
   * Check if tangki name already exists
   */
  async isTangkiNameExists(
    namaTangki: string,
    companyId: string,
    excludeId?: string,
  ) {
    const tangki = await db.tangki.findFirst({
      where: {
        namaTangki,
        companyId,
        ...(excludeId && { NOT: { id: excludeId } }),
      },
    });
    return !!tangki;
  },

  // ==================== STOCK TANGKI OPERATIONS ====================

  /**
   * Add stock transaction (MASUK/KELUAR/TRANSFER/ADJUSTMENT)
   */
  async addStockTransaction(data: CreateStockTangkiInput) {
    const tangki = await db.tangki.findUnique({
      where: { id: data.tangkiId },
      include: {
        material: true,
      },
    });

    if (!tangki) {
      throw new Error("Tangki tidak ditemukan");
    }

    const stockSebelum = tangki.isiSaatIni;
    let stockSesudah = stockSebelum;

    // Calculate stock based on transaction type
    switch (data.tipeTransaksi) {
      case "MASUK":
      case "ADJUSTMENT":
        stockSesudah = stockSebelum + data.jumlah;
        break;
      case "KELUAR":
        if (stockSebelum < data.jumlah) {
          throw new Error("Stock tangki tidak mencukupi");
        }
        stockSesudah = stockSebelum - data.jumlah;
        break;
      case "TRANSFER":
        // For transfer, this should be handled separately
        // with two transactions (KELUAR from source, MASUK to destination)
        throw new Error("Transfer harus menggunakan method transferStock");
    }

    // Validate capacity
    if (stockSesudah > tangki.kapasitas) {
      throw new Error(
        `Kapasitas tangki tidak mencukupi. Maksimal: ${tangki.kapasitas}`,
      );
    }

    // Validate total stock in all tanks for this material
    if (data.tipeTransaksi === "MASUK" || data.tipeTransaksi === "ADJUSTMENT") {
      // Get stock material from database
      const stockMaterial = await db.stockMaterial.findUnique({
        where: {
          companyId_materialId: {
            companyId: tangki.companyId,
            materialId: tangki.materialId,
          },
        },
      });

      // Get all tangkis for this material
      const allTangkis = await db.tangki.findMany({
        where: {
          companyId: tangki.companyId,
          materialId: tangki.materialId,
        },
      });

      // Calculate total stock in tangkis after this transaction
      const currentTotalInTangki = allTangkis.reduce((sum, t) => {
        if (t.id === tangki.id) {
          return sum + stockSesudah; // Use new value for current tangki
        }
        return sum + t.isiSaatIni;
      }, 0);

      const availableStock = stockMaterial?.jumlah ?? 0;

      if (currentTotalInTangki > availableStock) {
        throw new Error(
          `Total stock di tangki (${currentTotalInTangki}) tidak boleh melebihi stock material di database (${availableStock}). ` +
          `Sisa yang bisa dimasukkan: ${availableStock - (currentTotalInTangki - data.jumlah)}`,
        );
      }
    }

    // Create transaction and update tangki in a transaction
    return await db.$transaction(async (tx: Prisma.TransactionClient) => {
      // Create stock transaction record
      const stockTransaction = await tx.stockTangki.create({
        data: {
          tangkiId: data.tangkiId,
          tipeTransaksi: data.tipeTransaksi,
          jumlah: data.jumlah,
          stockSebelum,
          stockSesudah,
          referensi: data.referensi,
          keterangan: data.keterangan,
          operator: data.operator,
          tanggalTransaksi: data.tanggalTransaksi
            ? new Date(data.tanggalTransaksi)
            : new Date(),
        },
      });

      // Update tangki stock
      await tx.tangki.update({
        where: { id: data.tangkiId },
        data: { isiSaatIni: stockSesudah },
      });

      return stockTransaction;
    });
  },

  /**
   * Transfer stock between tanks
   */
  async transferStock(
    tangkiAsalId: string,
    tangkiTujuanId: string,
    jumlah: number,
    operator: string,
    keterangan?: string,
  ) {
    const tangkiAsal = await db.tangki.findUnique({
      where: { id: tangkiAsalId },
    });
    const tangkiTujuan = await db.tangki.findUnique({
      where: { id: tangkiTujuanId },
    });

    if (!tangkiAsal || !tangkiTujuan) {
      throw new Error("Tangki tidak ditemukan");
    }

    if (tangkiAsal.materialId !== tangkiTujuan.materialId) {
      throw new Error("Material tangki harus sama untuk transfer");
    }

    if (tangkiAsal.isiSaatIni < jumlah) {
      throw new Error("Stock tangki asal tidak mencukupi");
    }

    if (tangkiTujuan.isiSaatIni + jumlah > tangkiTujuan.kapasitas) {
      throw new Error("Kapasitas tangki tujuan tidak mencukupi");
    }

    return await db.$transaction(async (tx) => {
      const now = new Date();

      // Record KELUAR from source tank
      await tx.stockTangki.create({
        data: {
          tangkiId: tangkiAsalId,
          tipeTransaksi: "TRANSFER",
          jumlah,
          stockSebelum: tangkiAsal.isiSaatIni,
          stockSesudah: tangkiAsal.isiSaatIni - jumlah,
          referensi: `TRANSFER-${tangkiTujuanId}`,
          keterangan: keterangan ?? `Transfer ke ${tangkiTujuan.namaTangki}`,
          operator,
          tanggalTransaksi: now,
        },
      });

      // Update source tank
      await tx.tangki.update({
        where: { id: tangkiAsalId },
        data: { isiSaatIni: tangkiAsal.isiSaatIni - jumlah },
      });

      // Record MASUK to destination tank
      await tx.stockTangki.create({
        data: {
          tangkiId: tangkiTujuanId,
          tipeTransaksi: "TRANSFER",
          jumlah,
          stockSebelum: tangkiTujuan.isiSaatIni,
          stockSesudah: tangkiTujuan.isiSaatIni + jumlah,
          referensi: `TRANSFER-${tangkiAsalId}`,
          keterangan: keterangan ?? `Transfer dari ${tangkiAsal.namaTangki}`,
          operator,
          tanggalTransaksi: now,
        },
      });

      // Update destination tank
      await tx.tangki.update({
        where: { id: tangkiTujuanId },
        data: { isiSaatIni: tangkiTujuan.isiSaatIni + jumlah },
      });

      return { success: true };
    });
  },

  /**
   * Get stock history with filters
   */
  async getStockHistory(filter: FilterStockTangkiInput) {
    const { tangkiId, tipeTransaksi, tanggalMulai, tanggalSelesai, page, limit } =
      filter;

    const where: {
      tangkiId?: string;
      tipeTransaksi?: "MASUK" | "KELUAR" | "TRANSFER" | "ADJUSTMENT";
      tanggalTransaksi?: {
        gte?: Date;
        lte?: Date;
      };
    } = {};

    if (tangkiId) where.tangkiId = tangkiId;
    if (tipeTransaksi) where.tipeTransaksi = tipeTransaksi;
    if (tanggalMulai || tanggalSelesai) {
      where.tanggalTransaksi = {};
      if (tanggalMulai)
        where.tanggalTransaksi.gte = new Date(tanggalMulai);
      if (tanggalSelesai)
        where.tanggalTransaksi.lte = new Date(tanggalSelesai);
    }

    const skip = ((page ?? 1) - 1) * (limit ?? 10);

    const [data, total] = await Promise.all([
      db.stockTangki.findMany({
        where,
        include: {
          tangki: {
            include: {
              material: true,
            },
          },
        },
        orderBy: {
          tanggalTransaksi: "desc",
        },
        skip,
        take: limit,
      }),
      db.stockTangki.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page: page ?? 1,
        limit: limit ?? 10,
        total,
        totalPages: Math.ceil(total / (limit ?? 10)),
      },
    };
  },

  /**
   * Get stock summary by material
   */
  async getStockSummaryByMaterial(companyId: string) {
    const tangkis = await db.tangki.findMany({
      where: { companyId },
      include: {
        material: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
      },
    });

    // Group by material
    const summary = tangkis.reduce(
      (
        acc: Record<
          string,
          {
            material: {
              id: string;
              name: string;
              code: string;
              kategori: { id: string; name: string };
              satuan: { id: string; name: string; symbol: string };
            };
            totalKapasitas: number;
            totalIsi: number;
            jumlahTangki: number;
            tangkis: typeof tangkis;
          }
        >,
        tangki: (typeof tangkis)[0],
      ) => {
        const materialId = tangki.materialId;
        if (!acc[materialId]) {
          acc[materialId] = {
            material: tangki.material,
            totalKapasitas: 0,
            totalIsi: 0,
            jumlahTangki: 0,
            tangkis: [],
          };
        }
        acc[materialId]!.totalKapasitas += tangki.kapasitas;
        acc[materialId]!.totalIsi += tangki.isiSaatIni;
        acc[materialId]!.jumlahTangki += 1;
        acc[materialId]!.tangkis.push(tangki);
        return acc;
      },
      {} as Record<
        string,
        {
          material: {
            id: string;
            name: string;
            code: string;
            kategori: { id: string; name: string };
            satuan: { id: string; name: string; symbol: string };
          };
          totalKapasitas: number;
          totalIsi: number;
          jumlahTangki: number;
          tangkis: typeof tangkis;
        }
      >,
    );

    return Object.values(summary);
  },
};

import { db } from "@/server/db";
import type {
  CreateProsesProduksi,
  UpdateProsesProduksi,
  GetProsesProduksiQuery,
} from "@/server/schema/proses-produksi";
import type { Prisma } from "@prisma/client";

export class ProsesProduksiRepository {
  /**
   * Generate nomor produksi otomatis
   */
  async generateNomorProduksi(companyId: string): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const prefix = `PROD-${year}${month}`;

    const lastProduksi = await db.prosesProduksi.findFirst({
      where: {
        companyId,
        nomorProduksi: {
          startsWith: prefix,
        },
      },
      orderBy: {
        nomorProduksi: "desc",
      },
    });

    let sequence = 1;
    if (lastProduksi) {
      const lastSequence = parseInt(
        lastProduksi.nomorProduksi.split("-").pop() || "0"
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, "0")}`;
  }

  /**
   * Create proses produksi dengan hasil produksi
   */
  async create(companyId: string, data: CreateProsesProduksi) {
    const nomorProduksi = await this.generateNomorProduksi(companyId);

    return db.$transaction(async (tx) => {
      // Create proses produksi
      const prosesProduksi = await tx.prosesProduksi.create({
        data: {
          companyId,
          nomorProduksi,
          tanggalProduksi: new Date(data.tanggalProduksi),
          materialInputId: data.materialInputId,
          jumlahInput: data.jumlahInput,
          operatorProduksi: data.operatorProduksi,
          status: data.status || "DRAFT",
        },
      });

      // Create hasil produksi
      const hasilProduksi = await Promise.all(
        data.hasilProduksi.map((hasil) =>
          tx.hasilProduksi.create({
            data: {
              prosesProduksiId: prosesProduksi.id,
              materialOutputId: hasil.materialOutputId,
              jumlahOutput: hasil.jumlahOutput,
              rendemen: hasil.rendemen,
            },
          })
        )
      );

      // Jika status COMPLETED, update stock
      if (data.status === "COMPLETED") {
        // Kurangi stock TBS (input)
        await this.updateStockMaterial(
          tx,
          companyId,
          data.materialInputId,
          -data.jumlahInput
        );

        // Tambah stock hasil produksi (output)
        for (const hasil of data.hasilProduksi) {
          await this.updateStockMaterial(
            tx,
            companyId,
            hasil.materialOutputId,
            hasil.jumlahOutput
          );
        }
      }

      return {
        ...prosesProduksi,
        hasilProduksi,
      };
    });
  }

  /**
   * Update stock material
   */
  private async updateStockMaterial(
    tx: Prisma.TransactionClient,
    companyId: string,
    materialId: string,
    amount: number
  ) {
    const existingStock = await tx.stockMaterial.findUnique({
      where: {
        companyId_materialId: {
          companyId,
          materialId,
        },
      },
    });

    if (existingStock) {
      await tx.stockMaterial.update({
        where: {
          companyId_materialId: {
            companyId,
            materialId,
          },
        },
        data: {
          jumlah: {
            increment: amount,
          },
        },
      });
    } else if (amount > 0) {
      await tx.stockMaterial.create({
        data: {
          companyId,
          materialId,
          jumlah: amount,
        },
      });
    }
  }

  /**
   * Get all proses produksi with filters
   */
  async findAll(companyId: string, query: GetProsesProduksiQuery) {
    const { tanggalMulai, tanggalAkhir, status, materialInputId, page, limit } =
      query;

    const where: any = {
      companyId,
    };

    if (tanggalMulai || tanggalAkhir) {
      where.tanggalProduksi = {};
      if (tanggalMulai) {
        where.tanggalProduksi.gte = new Date(tanggalMulai);
      }
      if (tanggalAkhir) {
        where.tanggalProduksi.lte = new Date(tanggalAkhir);
      }
    }

    if (status) {
      where.status = status;
    }

    if (materialInputId) {
      where.materialInputId = materialInputId;
    }

    const [data, total] = await Promise.all([
      db.prosesProduksi.findMany({
        where,
        include: {
          materialInput: {
            include: {
              kategori: true,
              satuan: true,
            },
          },
          hasilProduksi: {
            include: {
              materialOutput: {
                include: {
                  kategori: true,
                  satuan: true,
                },
              },
            },
          },
        },
        orderBy: {
          tanggalProduksi: "desc",
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.prosesProduksi.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get proses produksi by id
   */
  async findById(id: string, companyId: string) {
    return db.prosesProduksi.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        materialInput: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        hasilProduksi: {
          include: {
            materialOutput: {
              include: {
                kategori: true,
                satuan: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update proses produksi
   */
  async update(id: string, companyId: string, data: UpdateProsesProduksi) {
    return db.$transaction(async (tx) => {
      const existing = await tx.prosesProduksi.findFirst({
        where: { id, companyId },
        include: {
          hasilProduksi: true,
        },
      });

      if (!existing) {
        throw new Error("Proses produksi tidak ditemukan");
      }

      // Tidak bisa update jika sudah COMPLETED
      if (existing.status === "COMPLETED") {
        throw new Error("Tidak dapat mengubah proses produksi yang sudah selesai");
      }

      // Update proses produksi
      const updated = await tx.prosesProduksi.update({
        where: { id },
        data: {
          tanggalProduksi: data.tanggalProduksi
            ? new Date(data.tanggalProduksi)
            : undefined,
          materialInputId: data.materialInputId,
          jumlahInput: data.jumlahInput,
          operatorProduksi: data.operatorProduksi,
          status: data.status,
        },
      });

      // Update hasil produksi jika ada
      if (data.hasilProduksi && data.hasilProduksi.length > 0) {
        // Hapus hasil produksi lama
        await tx.hasilProduksi.deleteMany({
          where: { prosesProduksiId: id },
        });

        // Create hasil produksi baru
        await Promise.all(
          data.hasilProduksi.map((hasil) =>
            tx.hasilProduksi.create({
              data: {
                prosesProduksiId: id,
                materialOutputId: hasil.materialOutputId,
                jumlahOutput: hasil.jumlahOutput,
                rendemen: hasil.rendemen,
              },
            })
          )
        );
      }

      return this.findById(id, companyId);
    });
  }

  /**
   * Update status proses produksi
   */
  async updateStatus(
    id: string,
    companyId: string,
    status: import("@prisma/client").StatusProsesProduksi
  ) {
    return db.$transaction(async (tx) => {
      const existing = await tx.prosesProduksi.findFirst({
        where: { id, companyId },
        include: {
          hasilProduksi: true,
        },
      });

      if (!existing) {
        throw new Error("Proses produksi tidak ditemukan");
      }

      // Jika mengubah dari non-COMPLETED ke COMPLETED, update stock
      if (existing.status !== "COMPLETED" && status === "COMPLETED") {
        // Kurangi stock TBS (input)
        await this.updateStockMaterial(
          tx,
          companyId,
          existing.materialInputId,
          -existing.jumlahInput
        );

        // Tambah stock hasil produksi (output)
        for (const hasil of existing.hasilProduksi) {
          await this.updateStockMaterial(
            tx,
            companyId,
            hasil.materialOutputId,
            hasil.jumlahOutput
          );
        }
      }

      // Jika mengubah dari COMPLETED ke status lain, batalkan update stock
      if (existing.status === "COMPLETED" && status !== "COMPLETED") {
        // Kembalikan stock TBS (input)
        await this.updateStockMaterial(
          tx,
          companyId,
          existing.materialInputId,
          existing.jumlahInput
        );

        // Kurangi stock hasil produksi (output)
        for (const hasil of existing.hasilProduksi) {
          await this.updateStockMaterial(
            tx,
            companyId,
            hasil.materialOutputId,
            -hasil.jumlahOutput
          );
        }
      }

      return tx.prosesProduksi.update({
        where: { id },
        data: { status },
        include: {
          materialInput: {
            include: {
              kategori: true,
              satuan: true,
            },
          },
          hasilProduksi: {
            include: {
              materialOutput: {
                include: {
                  kategori: true,
                  satuan: true,
                },
              },
            },
          },
        },
      });
    });
  }

  /**
   * Delete proses produksi
   */
  async delete(id: string, companyId: string) {
    const existing = await db.prosesProduksi.findFirst({
      where: { id, companyId },
    });

    if (!existing) {
      throw new Error("Proses produksi tidak ditemukan");
    }

    // Tidak bisa delete jika sudah COMPLETED
    if (existing.status === "COMPLETED") {
      throw new Error("Tidak dapat menghapus proses produksi yang sudah selesai");
    }

    return db.prosesProduksi.delete({
      where: { id },
    });
  }

  /**
   * Get laporan harian produksi
   */
  async getLaporanHarian(
    companyId: string,
    tanggalMulai: string,
    tanggalAkhir: string
  ) {
    const data = await db.prosesProduksi.findMany({
      where: {
        companyId,
        status: "COMPLETED",
        tanggalProduksi: {
          gte: new Date(tanggalMulai),
          lte: new Date(tanggalAkhir),
        },
      },
      include: {
        materialInput: {
          include: {
            kategori: true,
            satuan: true,
          },
        },
        hasilProduksi: {
          include: {
            materialOutput: {
              include: {
                kategori: true,
                satuan: true,
              },
            },
          },
        },
      },
      orderBy: {
        tanggalProduksi: "desc",
      },
    });

    // Aggregate data
    const summary = {
      totalInput: data.reduce((sum: number, item: any) => sum + item.jumlahInput, 0),
      totalProses: data.length,
      byMaterialInput: {} as Record<string, {
        materialName: string;
        totalInput: number;
        totalProses: number;
      }>,
      byMaterialOutput: {} as Record<string, {
        materialName: string;
        totalOutput: number;
        averageRendemen: number;
        count: number;
      }>,
    };

    // Aggregate by material input
    data.forEach((item: any) => {
      const key = item.materialInputId;
      if (!summary.byMaterialInput[key]) {
        summary.byMaterialInput[key] = {
          materialName: item.materialInput.name,
          totalInput: 0,
          totalProses: 0,
        };
      }
      summary.byMaterialInput[key]!.totalInput += item.jumlahInput;
      summary.byMaterialInput[key]!.totalProses += 1;
    });

    // Aggregate by material output
    data.forEach((item: any) => {
      item.hasilProduksi.forEach((hasil: any) => {
        const key = hasil.materialOutputId;
        if (!summary.byMaterialOutput[key]) {
          summary.byMaterialOutput[key] = {
            materialName: hasil.materialOutput.name,
            totalOutput: 0,
            averageRendemen: 0,
            count: 0,
          };
        }
        summary.byMaterialOutput[key]!.totalOutput += hasil.jumlahOutput;
        summary.byMaterialOutput[key]!.averageRendemen += hasil.rendemen;
        summary.byMaterialOutput[key]!.count += 1;
      });
    });

    // Calculate average rendemen
    Object.keys(summary.byMaterialOutput).forEach((key) => {
      const output = summary.byMaterialOutput[key]!;
      output.averageRendemen = output.averageRendemen / output.count;
    });

    return {
      data,
      summary,
    };
  }
}

export const prosesProduksiRepository = new ProsesProduksiRepository();

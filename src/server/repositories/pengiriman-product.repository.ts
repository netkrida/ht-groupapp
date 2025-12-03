import { db } from "@/server/db";
import type { CreatePengirimanProductInput, UpdatePengirimanProductInput } from "@/server/schema/pengiriman-product";

export class PengirimanProductRepository {
  async generateNomorPengiriman(companyId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `DO-${year}${month}`;

    const lastPengiriman = await db.pengirimanProduct.findFirst({
      where: {
        companyId,
        nomorPengiriman: {
          startsWith: prefix,
        },
      },
      orderBy: {
        nomorPengiriman: "desc",
      },
    });

    let sequence = 1;
    if (lastPengiriman) {
      const lastSequence = parseInt(lastPengiriman.nomorPengiriman.split("-").pop() || "0");
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(5, "0")}`;
  }

  async generateNoSegel(companyId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `SEG-${year}${month}`;

    const lastPengiriman = await db.pengirimanProduct.findFirst({
      where: {
        companyId,
        noSegel: {
          startsWith: prefix,
        },
      },
      orderBy: {
        noSegel: "desc",
      },
    });

    let sequence = 1;
    if (lastPengiriman) {
      const lastSequence = parseInt(lastPengiriman.noSegel.split("-").pop() || "0");
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(5, "0")}`;
  }

  async createPengirimanProduct(companyId: string, data: CreatePengirimanProductInput) {
    const nomorPengiriman = await this.generateNomorPengiriman(companyId);
    const noSegel = await this.generateNoSegel(companyId);

    // Kalkulasi berat netto
    const beratNetto = data.beratGross - data.beratTarra;

    return db.pengirimanProduct.create({
      data: {
        companyId,
        nomorPengiriman,
        noSegel,
        ...data,
        beratNetto,
      },
      include: {
        buyer: true,
        contract: {
          include: {
            buyer: true,
          },
        },
        contractItem: {
          include: {
            material: {
              include: {
                kategori: true,
                satuan: true,
              },
            },
          },
        },
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
      },
    });
  }

  async getPengirimanProductByCompany(companyId: string, filters?: {
    status?: string;
    buyerId?: string;
    contractId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return db.pengirimanProduct.findMany({
      where: {
        companyId,
        ...(filters?.status && { status: filters.status as any }),
        ...(filters?.buyerId && { buyerId: filters.buyerId }),
        ...(filters?.contractId && { contractId: filters.contractId }),
        ...(filters?.startDate && filters?.endDate && {
          tanggalPengiriman: {
            gte: filters.startDate,
            lte: filters.endDate,
          },
        }),
      },
      include: {
        buyer: true,
        contract: {
          include: {
            buyer: true,
          },
        },
        contractItem: {
          include: {
            material: {
              include: {
                kategori: true,
                satuan: true,
              },
            },
          },
        },
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
      },
      orderBy: { tanggalPengiriman: "desc" },
    });
  }

  async getPengirimanProductById(id: string) {
    return db.pengirimanProduct.findUnique({
      where: { id },
      include: {
        buyer: true,
        contract: {
          include: {
            buyer: true,
          },
        },
        contractItem: {
          include: {
            material: {
              include: {
                kategori: true,
                satuan: true,
              },
            },
          },
        },
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
      },
    });
  }

  async updatePengirimanProduct(id: string, data: UpdatePengirimanProductInput) {
    // Recalculate beratNetto if beratGross or beratTarra changes
    const updateData: any = { ...data };
    
    if (data.beratGross !== undefined || data.beratTarra !== undefined) {
      const current = await this.getPengirimanProductById(id);
      if (current) {
        const beratGross = data.beratGross ?? current.beratGross;
        const beratTarra = data.beratTarra ?? current.beratTarra;
        updateData.beratNetto = beratGross - beratTarra;
      }
    }

    return db.pengirimanProduct.update({
      where: { id },
      data: updateData,
      include: {
        buyer: true,
        contract: {
          include: {
            buyer: true,
          },
        },
        contractItem: {
          include: {
            material: {
              include: {
                kategori: true,
                satuan: true,
              },
            },
          },
        },
        vendorVehicle: {
          include: {
            vendor: true,
          },
        },
      },
    });
  }

  async deletePengirimanProduct(id: string) {
    return db.pengirimanProduct.delete({
      where: { id },
    });
  }

  async getStatistics(companyId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {
      companyId,
      status: "COMPLETED",
    };

    if (filters?.startDate && filters?.endDate) {
      where.tanggalPengiriman = {
        gte: filters.startDate,
        lte: filters.endDate,
      };
    }

    const [totalPengiriman, totalBerat] = await Promise.all([
      db.pengirimanProduct.count({ where }),
      db.pengirimanProduct.aggregate({
        where,
        _sum: {
          beratNetto: true,
        },
      }),
    ]);

    return {
      totalPengiriman,
      totalBerat: totalBerat._sum.beratNetto || 0,
    };
  }
}

export const pengirimanProductRepository = new PengirimanProductRepository();

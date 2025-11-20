import { prosesProduksiRepository } from "@/server/repositories/proses-produksi.repository";
import type {
  CreateProsesProduksi,
  UpdateProsesProduksi,
  GetProsesProduksiQuery,
} from "@/server/schema/proses-produksi";

export class ProsesProduksiService {
  /**
   * Create proses produksi
   */
  async createProsesProduksi(companyId: string, data: CreateProsesProduksi) {
    // Validasi: pastikan jumlah input tidak melebihi stock
    const stockTBS = await this.getStockMaterial(companyId, data.materialInputId);
    
    if (data.status === "COMPLETED" && stockTBS < data.jumlahInput) {
      throw new Error(
        `Stock TBS tidak mencukupi. Stock tersedia: ${stockTBS}, diminta: ${data.jumlahInput}`
      );
    }

    // Kalkulasi rendemen otomatis jika belum diisi
    data.hasilProduksi = data.hasilProduksi.map((hasil: any) => {
      const rendemen = (hasil.jumlahOutput / data.jumlahInput) * 100;
      return {
        ...hasil,
        rendemen: Number(rendemen.toFixed(2)),
      };
    });

    return prosesProduksiRepository.create(companyId, data);
  }

  /**
   * Get stock material
   */
  private async getStockMaterial(
    companyId: string,
    materialId: string
  ): Promise<number> {
    const { db } = await import("@/server/db");
    const stock = await db.stockMaterial.findUnique({
      where: {
        companyId_materialId: {
          companyId,
          materialId,
        },
      },
    });

    return stock?.jumlah || 0;
  }

  /**
   * Get all proses produksi
   */
  async getAllProsesProduksi(
    companyId: string,
    query: GetProsesProduksiQuery
  ) {
    return prosesProduksiRepository.findAll(companyId, query);
  }

  /**
   * Get proses produksi by id
   */
  async getProsesProduksiById(id: string, companyId: string) {
    const data = await prosesProduksiRepository.findById(id, companyId);

    if (!data) {
      throw new Error("Proses produksi tidak ditemukan");
    }

    return data;
  }

  /**
   * Update proses produksi
   */
  async updateProsesProduksi(
    id: string,
    companyId: string,
    data: UpdateProsesProduksi
  ) {
    // Kalkulasi rendemen otomatis jika ada hasil produksi dan jumlah input
    if (data.hasilProduksi && data.jumlahInput) {
      data.hasilProduksi = data.hasilProduksi.map((hasil: any) => {
        const rendemen = (hasil.jumlahOutput / data.jumlahInput!) * 100;
        return {
          ...hasil,
          rendemen: Number(rendemen.toFixed(2)),
        };
      });
    }

    return prosesProduksiRepository.update(id, companyId, data);
  }

  /**
   * Update status proses produksi
   */
  async updateStatusProsesProduksi(
    id: string,
    companyId: string,
    status: import("@prisma/client").StatusProsesProduksi | string
  ) {
    // Validasi stock jika mengubah ke COMPLETED
    if (status === "COMPLETED") {
      const proses = await prosesProduksiRepository.findById(id, companyId);
      
      if (!proses) {
        throw new Error("Proses produksi tidak ditemukan");
      }

      const stockTBS = await this.getStockMaterial(
        companyId,
        proses.materialInputId
      );

      if (stockTBS < proses.jumlahInput) {
        throw new Error(
          `Stock TBS tidak mencukupi. Stock tersedia: ${stockTBS}, diminta: ${proses.jumlahInput}`
        );
      }
    }

    // Pastikan status bertipe StatusProsesProduksi
    const prismaStatus = status as import("@prisma/client").StatusProsesProduksi;
    return prosesProduksiRepository.updateStatus(id, companyId, prismaStatus);
  }

  /**
   * Delete proses produksi
   */
  async deleteProsesProduksi(id: string, companyId: string) {
    return prosesProduksiRepository.delete(id, companyId);
  }

  /**
   * Get laporan harian produksi
   */
  async getLaporanHarian(
    companyId: string,
    tanggalMulai: string,
    tanggalAkhir: string
  ) {
    return prosesProduksiRepository.getLaporanHarian(
      companyId,
      tanggalMulai,
      tanggalAkhir
    );
  }

  /**
   * Get stock TBS tersedia
   */
  async getStockTBSTersedia(companyId: string) {
    const { db } = await import("@/server/db");
    
    // Get material TBS (kategori TBS)
    const materials = await db.material.findMany({
      where: {
        companyId,
        kategori: {
          name: {
            contains: "TBS",
          },
        },
      },
      include: {
        stockMaterial: true,
        satuan: true,
        kategori: true,
      },
    });

    return materials.map((material: any) => ({
      id: material.id,
      name: material.name,
      code: material.code,
      kategori: material.kategori.name,
      satuan: material.satuan.name,
      stock: material.stockMaterial[0]?.jumlah || 0,
    }));
  }

  /**
   * Get material output (hasil produksi) by kategori
   */
  async getMaterialOutputByKategori(companyId: string, kategoriId: string) {
    const { db } = await import("@/server/db");
    
    const materials = await db.material.findMany({
      where: {
        companyId,
        kategoriId,
      },
      include: {
        satuan: true,
        kategori: true,
      },
    });

    return materials;
  }

  /**
   * Get all kategori for output materials
   */
  async getKategoriOutput(companyId: string) {
    const { db } = await import("@/server/db");
    
    // Exclude kategori TBS
    const kategoris = await db.kategoriMaterial.findMany({
      where: {
        companyId,
        NOT: {
          name: {
            contains: "TBS",
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return kategoris;
  }
}

export const prosesProduksiService = new ProsesProduksiService();

import { penerimaanTBSRepository } from "@/server/repositories/penerimaan-tbs.repository";
import { materialRepository } from "@/server/repositories/material.repository";
import { transporterRepository } from "@/server/repositories/transporter.repository";
import type { CreatePenerimaanTBSInput, UpdatePenerimaanTBSInput } from "@/server/schema/penerimaan-tbs";
import type { CreateTransporterInput } from "@/server/schema/transporter";

export class PenerimaanTBSService {
  async createPenerimaanTBS(
    companyId: string,
    data: CreatePenerimaanTBSInput & {
      transporterType?: "existing" | "new";
      nomorKendaraan?: string;
      namaSupir?: string;
    }
  ) {
    let transporterId = data.transporterId;

    // If creating new transporter
    if (data.transporterType === "new" && data.nomorKendaraan && data.namaSupir) {
      // Check if transporter already exists
      const existing = await transporterRepository.getTransporterByNomorKendaraan(
        companyId,
        data.nomorKendaraan
      );

      if (existing) {
        transporterId = existing.id;
      } else {
        const newTransporter = await transporterRepository.createTransporter(companyId, {
          nomorKendaraan: data.nomorKendaraan,
          namaSupir: data.namaSupir,
        });
        transporterId = newTransporter.id;
      }
    }

    if (!transporterId) {
      throw new Error("Transporter harus dipilih atau dibuat");
    }

    // Remove fields that don't exist in Prisma schema
    const { transporterType, nomorKendaraan, namaSupir, ...penerimaanData } = data;

    const penerimaan = await penerimaanTBSRepository.createPenerimaanTBS(companyId, {
      ...penerimaanData,
      transporterId,
    });

    // Update stock material if status is COMPLETED
    if (data.status === "COMPLETED") {
      await materialRepository.updateStockMaterial(
        companyId,
        data.materialId,
        penerimaan.beratNetto2,
        {
          referensi: penerimaan.nomorPenerimaan,
          keterangan: `Penerimaan TBS dari supplier`,
          operator: data.operatorPenimbang || "system",
        }
      );
    }

    return penerimaan;
  }

  async getPenerimaanTBSByCompany(companyId: string, filters?: {
    status?: string;
    supplierId?: string;
    materialId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return penerimaanTBSRepository.getPenerimaanTBSByCompany(companyId, filters);
  }

  async getPenerimaanTBSById(id: string) {
    const penerimaan = await penerimaanTBSRepository.getPenerimaanTBSById(id);
    if (!penerimaan) {
      throw new Error("Penerimaan TBS tidak ditemukan");
    }
    return penerimaan;
  }

  async updatePenerimaanTBS(id: string, data: UpdatePenerimaanTBSInput) {
    const current = await penerimaanTBSRepository.getPenerimaanTBSById(id);
    if (!current) {
      throw new Error("Penerimaan TBS tidak ditemukan");
    }

    const updated = await penerimaanTBSRepository.updatePenerimaanTBS(id, data);

    // Handle stock adjustment based on status changes and weight changes
    const wasCompleted = current.status === "COMPLETED";
    const isCompleted = updated.status === "COMPLETED";
    const oldWeight = current.beratNetto2;
    const newWeight = updated.beratNetto2;

    if (wasCompleted && isCompleted) {
      // Status tetap COMPLETED, cek perubahan berat
      if (newWeight !== oldWeight) {
        const difference = newWeight - oldWeight;
        await materialRepository.updateStockMaterial(
          current.companyId,
          current.materialId,
          difference,
          {
            referensi: updated.nomorPenerimaan,
            keterangan: `Update penerimaan TBS (perubahan berat: ${oldWeight} kg → ${newWeight} kg)`,
            operator: updated.operatorPenimbang || "system",
          }
        );
      }
    } else if (!wasCompleted && isCompleted) {
      // Status berubah dari DRAFT/CANCELLED ke COMPLETED
      // Tambah stock dengan berat baru
      await materialRepository.updateStockMaterial(
        current.companyId,
        current.materialId,
        newWeight,
        {
          referensi: updated.nomorPenerimaan,
          keterangan: `Penerimaan TBS disetujui (status: ${current.status} → COMPLETED)`,
          operator: updated.operatorPenimbang || "system",
        }
      );
    } else if (wasCompleted && !isCompleted) {
      // Status berubah dari COMPLETED ke DRAFT/CANCELLED
      // Kurangi stock dengan berat lama
      await materialRepository.updateStockMaterial(
        current.companyId,
        current.materialId,
        -oldWeight,
        {
          referensi: updated.nomorPenerimaan,
          keterangan: `Penerimaan TBS dibatalkan (status: COMPLETED → ${updated.status})`,
          operator: updated.operatorPenimbang || "system",
        }
      );
    }
    return updated;
  }

  async deletePenerimaanTBS(id: string) {
    const penerimaan = await penerimaanTBSRepository.getPenerimaanTBSById(id);
    if (!penerimaan) {
      throw new Error("Penerimaan TBS tidak ditemukan");
    }

    // Adjust stock if status is COMPLETED
    if (penerimaan.status === "COMPLETED") {
      await materialRepository.updateStockMaterial(
        penerimaan.companyId,
        penerimaan.materialId,
        -penerimaan.beratNetto2,
        {
          referensi: penerimaan.nomorPenerimaan,
          keterangan: `Hapus penerimaan TBS`,
          operator: penerimaan.operatorPenimbang || "system",
        }
      );
    }

    return penerimaanTBSRepository.deletePenerimaanTBS(id);
  }

  // Statistics
  async getTBSStatistics(companyId: string, materialId: string) {
    const [tbsHariIni, tbsBulanIni, stockMaterial, tbsBySupplierRaw] = await Promise.all([
      penerimaanTBSRepository.getTBSMasukHariIni(companyId, materialId),
      penerimaanTBSRepository.getTBSMasukBulanIni(companyId, materialId),
      materialRepository.getStockMaterial(companyId, materialId),
      penerimaanTBSRepository.getTBSBySupplier(companyId, materialId),
    ]);

    // Ambil semua supplier yang muncul di groupBy
    const supplierIds = tbsBySupplierRaw.map((item: any) => item.supplierId).filter(Boolean);
    let supplierMap: Record<string, any> = {};
    if (supplierIds.length > 0) {
      const suppliers = await import("@/server/db").then(({ db }) =>
        db.supplier.findMany({
          where: { id: { in: supplierIds } },
        })
      );
      supplierMap = Object.fromEntries(suppliers.map((s: any) => [s.id, s]));
    }

    // Gabungkan info supplier ke hasil groupBy
    const tbsBySupplier = tbsBySupplierRaw.map((item: any) => ({
      ...item,
      supplier: supplierMap[item.supplierId] || null,
    }));

    return {
      tbsHariIni,
      tbsBulanIni,
      stockTBS: stockMaterial?.jumlah || 0,
      tbsBySupplier,
    };
  }

  async getPembayaranSupplier(companyId: string) {
    return penerimaanTBSRepository.getPembayaranSupplier(companyId);
  }
}

export const penerimaanTBSService = new PenerimaanTBSService();

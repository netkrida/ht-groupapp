import { tangkiRepository } from "@/server/repositories/tangki.repository";
import type {
  CreateTangkiInput,
  UpdateTangkiInput,
  CreateStockTangkiInput,
  FilterStockTangkiInput,
} from "@/server/schema/tangki";

export const tangkiService = {
  // ==================== TANGKI OPERATIONS ====================

  /**
   * Get all tangki for a company
   */
  async getAllTangki(companyId: string, materialId?: string) {
    return await tangkiRepository.getAllTangki(companyId, materialId);
  },

  /**
   * Get tangki by ID
   */
  async getTangkiById(id: string, companyId: string) {
    const tangki = await tangkiRepository.getTangkiById(id, companyId);
    if (!tangki) {
      throw new Error("Tangki tidak ditemukan");
    }
    return tangki;
  },

  /**
   * Create new tangki
   */
  async createTangki(companyId: string, data: CreateTangkiInput) {
    // Validate tangki name uniqueness
    const exists = await tangkiRepository.isTangkiNameExists(
      data.namaTangki,
      companyId,
    );
    if (exists) {
      throw new Error("Nama tangki sudah digunakan");
    }

    return await tangkiRepository.createTangki(companyId, data);
  },

  /**
   * Update tangki
   */
  async updateTangki(id: string, companyId: string, data: UpdateTangkiInput) {
    // Check if tangki exists
    await this.getTangkiById(id, companyId);

    // Validate tangki name uniqueness if name is being updated
    if (data.namaTangki) {
      const exists = await tangkiRepository.isTangkiNameExists(
        data.namaTangki,
        companyId,
        id,
      );
      if (exists) {
        throw new Error("Nama tangki sudah digunakan");
      }
    }

    return await tangkiRepository.updateTangki(id, companyId, data);
  },

  /**
   * Delete tangki
   */
  async deleteTangki(id: string, companyId: string) {
    const tangki = await this.getTangkiById(id, companyId);

    // Prevent deletion if tangki has stock
    if (tangki.isiSaatIni > 0) {
      throw new Error(
        "Tidak dapat menghapus tangki yang masih berisi. Kosongkan tangki terlebih dahulu.",
      );
    }

    return await tangkiRepository.deleteTangki(id, companyId);
  },

  // ==================== STOCK OPERATIONS ====================

  /**
   * Add stock to tangki (MASUK)
   */
  async addStock(data: Omit<CreateStockTangkiInput, "tipeTransaksi">) {
    return await tangkiRepository.addStockTransaction({
      ...data,
      tipeTransaksi: "MASUK",
    });
  },

  /**
   * Remove stock from tangki (KELUAR)
   */
  async removeStock(data: Omit<CreateStockTangkiInput, "tipeTransaksi">) {
    return await tangkiRepository.addStockTransaction({
      ...data,
      tipeTransaksi: "KELUAR",
    });
  },

  /**
   * Adjust stock in tangki (ADJUSTMENT)
   */
  async adjustStock(data: Omit<CreateStockTangkiInput, "tipeTransaksi">) {
    return await tangkiRepository.addStockTransaction({
      ...data,
      tipeTransaksi: "ADJUSTMENT",
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
    if (tangkiAsalId === tangkiTujuanId) {
      throw new Error("Tangki asal dan tujuan tidak boleh sama");
    }

    return await tangkiRepository.transferStock(
      tangkiAsalId,
      tangkiTujuanId,
      jumlah,
      operator,
      keterangan,
    );
  },

  /**
   * Get stock history
   */
  async getStockHistory(filter: FilterStockTangkiInput) {
    return await tangkiRepository.getStockHistory(filter);
  },

  /**
   * Get stock summary by material
   */
  async getStockSummary(companyId: string) {
    return await tangkiRepository.getStockSummaryByMaterial(companyId);
  },
};

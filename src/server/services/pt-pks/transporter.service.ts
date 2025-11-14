import { transporterRepository } from "@/server/repositories/transporter.repository";
import type {
  CreateTransporterInput,
  UpdateTransporterInput,
} from "@/server/schema/transporter";

export class TransporterService {
  async createTransporter(companyId: string, data: CreateTransporterInput) {
    // Check if nomor kendaraan already exists
    const existing = await transporterRepository.getTransporterByNomorKendaraan(
      companyId,
      data.nomorKendaraan
    );
    if (existing) {
      throw new Error("Nomor kendaraan sudah terdaftar");
    }

    return transporterRepository.createTransporter(companyId, data);
  }

  async getTransportersByCompany(companyId: string) {
    return transporterRepository.getTransportersByCompany(companyId);
  }

  async getTransporterById(id: string) {
    const transporter = await transporterRepository.getTransporterById(id);
    if (!transporter) {
      throw new Error("Transporter tidak ditemukan");
    }
    return transporter;
  }

  async updateTransporter(id: string, data: UpdateTransporterInput) {
    return transporterRepository.updateTransporter(id, data);
  }

  async deleteTransporter(id: string) {
    return transporterRepository.deleteTransporter(id);
  }

  async searchTransporters(companyId: string, search: string) {
    return transporterRepository.searchTransporters(companyId, search);
  }

  async linkSupplierToTransporter(supplierId: string, transporterId: string) {
    return transporterRepository.linkSupplierToTransporter(supplierId, transporterId);
  }

  async getTransportersBySupplierId(supplierId: string) {
    return transporterRepository.getTransportersBySupplierId(supplierId);
  }
}

export const transporterService = new TransporterService();

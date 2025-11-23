import { contractRepository } from "@/server/repositories/contract.repository";
import {
  createContractSchema,
  updateContractSchema,
  type CreateContractInput,
  type UpdateContractInput,
  type ContractQueryInput,
} from "@/server/schema/contract";
import type { StatusContract } from "@prisma/client";

export class ContractService {
  /**
   * Get all contracts for a company with pagination and filters
   */
  async getContracts(companyId: string, query?: ContractQueryInput) {
    return contractRepository.findByCompanyId(companyId, query);
  }

  /**
   * Get contract by id
   */
  async getContractById(id: string, companyId: string) {
    const contract = await contractRepository.findById(id, companyId);
    if (!contract) {
      throw new Error("Kontrak tidak ditemukan");
    }
    return contract;
  }

  /**
   * Get contracts by buyer
   */
  async getContractsByBuyer(buyerId: string, companyId: string) {
    return contractRepository.findByBuyerId(buyerId, companyId);
  }

  /**
   * Create new contract
   */
  async createContract(companyId: string, data: CreateContractInput) {
    // Validate input
    const validatedData = createContractSchema.parse(data);

    // Validate dates
    if (validatedData.endDate < validatedData.startDate) {
      throw new Error(
        "Tanggal berakhir harus setelah atau sama dengan tanggal mulai"
      );
    }

    // Create contract
    return contractRepository.create(companyId, validatedData);
  }

  /**
   * Update contract
   */
  async updateContract(
    id: string,
    companyId: string,
    data: UpdateContractInput
  ) {
    // Validate input
    const validatedData = updateContractSchema.parse(data);

    // Check if contract exists
    const existing = await contractRepository.findById(id, companyId);
    if (!existing) {
      throw new Error("Kontrak tidak ditemukan");
    }

    // Validate dates if both are provided
    if (validatedData.startDate && validatedData.endDate) {
      if (validatedData.endDate < validatedData.startDate) {
        throw new Error(
          "Tanggal berakhir harus setelah atau sama dengan tanggal mulai"
        );
      }
    }

    // Update contract
    return contractRepository.update(id, companyId, validatedData);
  }

  /**
   * Delete contract
   */
  async deleteContract(id: string, companyId: string) {
    // Check if contract exists
    const existing = await contractRepository.findById(id, companyId);
    if (!existing) {
      throw new Error("Kontrak tidak ditemukan");
    }

    // Check if contract can be deleted (only DRAFT or CANCELLED contracts)
    if (existing.status !== "DRAFT" && existing.status !== "CANCELLED") {
      throw new Error(
        "Hanya kontrak dengan status DRAFT atau CANCELLED yang dapat dihapus"
      );
    }

    // Delete contract
    return contractRepository.delete(id, companyId);
  }

  /**
   * Update contract status
   */
  async updateContractStatus(
    id: string,
    companyId: string,
    status: StatusContract
  ) {
    // Check if contract exists
    const existing = await contractRepository.findById(id, companyId);
    if (!existing) {
      throw new Error("Kontrak tidak ditemukan");
    }

    // Validate status transition
    const currentStatus = existing.status;

    // Business rules for status transitions
    if (currentStatus === "COMPLETED" || currentStatus === "CANCELLED") {
      throw new Error(
        "Kontrak yang sudah COMPLETED atau CANCELLED tidak dapat diubah statusnya"
      );
    }

    if (currentStatus === "DRAFT" && status === "COMPLETED") {
      throw new Error(
        "Kontrak tidak dapat langsung dari DRAFT ke COMPLETED. Ubah ke ACTIVE terlebih dahulu"
      );
    }

    // Update status
    return contractRepository.updateStatus(id, companyId, status);
  }

  /**
   * Generate contract number
   */
  async generateContractNumber(companyId: string) {
    return contractRepository.generateContractNumber(companyId);
  }
}

export const contractService = new ContractService();

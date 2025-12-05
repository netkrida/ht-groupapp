import { purchaseRequestRepository } from "../../repositories/purchase-request.repository";
import { storeRequestRepository } from "../../repositories/store-request.repository";
import { materialInventarisRepository } from "../../repositories/material-inventaris.repository";
import type { PurchaseRequestInput, UpdatePurchaseRequestInput } from "../../schema/purchase-request";
import { StatusPurchaseRequest, StatusStoreRequest } from "@prisma/client";

export const purchaseRequestService = {
  async getAll(companyId: string, filters?: {
    status?: StatusPurchaseRequest;
    startDate?: Date;
    endDate?: Date;
  }) {
    return purchaseRequestRepository.findAll(companyId, filters);
  },

  async getById(id: string, companyId: string) {
    const pr = await purchaseRequestRepository.findById(id, companyId);
    if (!pr) {
      throw new Error("Purchase Request tidak ditemukan");
    }
    return pr;
  },

  async create(companyId: string, data: PurchaseRequestInput) {
    // Validate materials
    for (const item of data.items) {
      const material = await materialInventarisRepository.findById(item.materialId, companyId);
      if (!material) {
        throw new Error(`Material dengan ID ${item.materialId} tidak ditemukan`);
      }
    }

    // If linked to SR, validate SR status
    if (data.storeRequestId) {
      const sr = await storeRequestRepository.findById(data.storeRequestId, companyId);
      if (!sr) {
        throw new Error("Store Request tidak ditemukan");
      }
      if (sr.status !== StatusStoreRequest.NEED_PR) {
        throw new Error("Store Request harus memiliki status NEED_PR");
      }
    }

    // Generate nomor PR
    const nomorPR = await purchaseRequestRepository.generateNomorPR(companyId);

    return purchaseRequestRepository.create(companyId, nomorPR, data);
  },

  async update(id: string, companyId: string, data: UpdatePurchaseRequestInput) {
    const pr = await this.getById(id, companyId);
    if (pr.status !== StatusPurchaseRequest.DRAFT) {
      throw new Error("Purchase Request tidak dapat diubah karena sudah diproses");
    }

    // Validate materials if items are provided
    if (data.items) {
      for (const item of data.items) {
        const material = await materialInventarisRepository.findById(item.materialId, companyId);
        if (!material) {
          throw new Error(`Material dengan ID ${item.materialId} tidak ditemukan`);
        }
      }
    }

    return purchaseRequestRepository.update(id, companyId, data);
  },

  async submit(id: string, companyId: string) {
    const pr = await this.getById(id, companyId);
    if (pr.status !== StatusPurchaseRequest.DRAFT) {
      throw new Error("Purchase Request tidak dapat disubmit");
    }

    return purchaseRequestRepository.updateStatus(id, companyId, StatusPurchaseRequest.PENDING);
  },

  async approve(id: string, companyId: string, approvedBy: string) {
    const pr = await this.getById(id, companyId);
    if (pr.status !== StatusPurchaseRequest.PENDING) {
      throw new Error("Purchase Request tidak dapat diapprove");
    }

    return purchaseRequestRepository.approve(id, companyId, approvedBy);
  },

  async reject(id: string, companyId: string) {
    const pr = await this.getById(id, companyId);
    if (pr.status !== StatusPurchaseRequest.PENDING) {
      throw new Error("Purchase Request tidak dapat direject");
    }

    return purchaseRequestRepository.reject(id, companyId);
  },

  async delete(id: string, companyId: string) {
    const pr = await this.getById(id, companyId);
    if (pr.status !== StatusPurchaseRequest.DRAFT) {
      throw new Error("Hanya Purchase Request dengan status DRAFT yang dapat dihapus");
    }

    return purchaseRequestRepository.delete(id, companyId);
  },
};

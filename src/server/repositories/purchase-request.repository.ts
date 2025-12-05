import { db } from "../db";
import type { PurchaseRequestInput, UpdatePurchaseRequestInput } from "../schema/purchase-request";
import { StatusPurchaseRequest } from "@prisma/client";

export const purchaseRequestRepository = {
  async findAll(companyId: string, filters?: {
    status?: StatusPurchaseRequest;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { companyId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.startDate || filters?.endDate) {
      where.tanggalRequest = {};
      if (filters.startDate) {
        where.tanggalRequest.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.tanggalRequest.lte = filters.endDate;
      }
    }

    return db.purchaseRequest.findMany({
      where,
      include: {
        storeRequest: true,
        items: {
          include: {
            material: {
              include: {
                kategoriMaterial: true,
                satuanMaterial: true,
              },
            },
          },
        },
        purchaseOrder: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string, companyId: string) {
    return db.purchaseRequest.findFirst({
      where: { id, companyId },
      include: {
        storeRequest: {
          include: {
            items: {
              include: {
                material: true,
              },
            },
          },
        },
        items: {
          include: {
            material: {
              include: {
                kategoriMaterial: true,
                satuanMaterial: true,
              },
            },
          },
        },
        purchaseOrder: true,
      },
    });
  },

  async create(companyId: string, nomorPR: string, data: PurchaseRequestInput) {
    return db.purchaseRequest.create({
      data: {
        companyId,
        nomorPR,
        storeRequestId: data.storeRequestId,
        requestedBy: data.requestedBy,
        keterangan: data.keterangan,
        items: {
          create: data.items.map(item => ({
            materialId: item.materialId,
            jumlahRequest: item.jumlahRequest,
            estimasiHarga: item.estimasiHarga,
            keterangan: item.keterangan,
          })),
        },
      },
      include: {
        items: {
          include: {
            material: {
              include: {
                kategoriMaterial: true,
                satuanMaterial: true,
              },
            },
          },
        },
      },
    });
  },

  async update(id: string, companyId: string, data: UpdatePurchaseRequestInput) {
    const updateData: any = {};
    
    if (data.requestedBy) updateData.requestedBy = data.requestedBy;
    if (data.keterangan !== undefined) updateData.keterangan = data.keterangan;

    // If items are provided, delete old items and create new ones
    if (data.items) {
      await db.purchaseRequestItem.deleteMany({
        where: { purchaseRequestId: id },
      });

      updateData.items = {
        create: data.items.map(item => ({
          materialId: item.materialId,
          jumlahRequest: item.jumlahRequest,
          estimasiHarga: item.estimasiHarga,
          keterangan: item.keterangan,
        })),
      };
    }

    return db.purchaseRequest.update({
      where: { id, companyId },
      data: updateData,
      include: {
        items: {
          include: {
            material: {
              include: {
                kategoriMaterial: true,
                satuanMaterial: true,
              },
            },
          },
        },
      },
    });
  },

  async updateStatus(id: string, companyId: string, status: StatusPurchaseRequest, additionalData?: any) {
    return db.purchaseRequest.update({
      where: { id, companyId },
      data: {
        status,
        ...additionalData,
      },
    });
  },

  async approve(id: string, companyId: string, approvedBy: string) {
    return db.purchaseRequest.update({
      where: { id, companyId },
      data: {
        status: StatusPurchaseRequest.APPROVED,
        approvedBy,
        tanggalApproval: new Date(),
      },
    });
  },

  async reject(id: string, companyId: string) {
    return db.purchaseRequest.update({
      where: { id, companyId },
      data: {
        status: StatusPurchaseRequest.REJECTED,
      },
    });
  },

  async delete(id: string, companyId: string) {
    return db.purchaseRequest.delete({
      where: { id, companyId },
    });
  },

  async generateNomorPR(companyId: string) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    
    const prefix = `PR/${year}${month}`;
    
    const lastPR = await db.purchaseRequest.findFirst({
      where: {
        companyId,
        nomorPR: {
          startsWith: prefix,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let nextNumber = 1;
    if (lastPR) {
      const lastNumber = parseInt(lastPR.nomorPR.split("/").pop() ?? "0");
      nextNumber = lastNumber + 1;
    }

    return `${prefix}/${String(nextNumber).padStart(4, "0")}`;
  },
};

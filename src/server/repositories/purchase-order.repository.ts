import { db } from "../db";
import type { PurchaseOrderInput, UpdatePurchaseOrderInput } from "../schema/purchase-order";
import { StatusPurchaseOrder } from "@prisma/client";

export const purchaseOrderRepository = {
  async findAll(companyId: string, filters?: {
    status?: StatusPurchaseOrder;
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = { companyId };
    
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.startDate || filters?.endDate) {
      where.tanggalPO = {};
      if (filters.startDate) {
        where.tanggalPO.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.tanggalPO.lte = filters.endDate;
      }
    }

    return db.purchaseOrder.findMany({
      where,
      include: {
        purchaseRequest: true,
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
        penerimaanBarang: true,
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async findById(id: string, companyId: string) {
    return db.purchaseOrder.findFirst({
      where: { id, companyId },
      include: {
        purchaseRequest: {
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
        penerimaanBarang: {
          include: {
            items: true,
          },
        },
      },
    });
  },

  async create(companyId: string, nomorPO: string, data: PurchaseOrderInput) {
    // Calculate totals
    const itemsWithSubtotal = data.items.map(item => ({
      ...item,
      subtotal: item.jumlahOrder * item.hargaSatuan,
    }));

    const subtotal = itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0);
    const totalAmount = subtotal + data.tax + data.shipping;

    return db.purchaseOrder.create({
      data: {
        companyId,
        nomorPO,
        purchaseRequestId: data.purchaseRequestId,
        vendorName: data.vendorName,
        vendorAddress: data.vendorAddress,
        vendorPhone: data.vendorPhone,
        tanggalKirimDiharapkan: data.tanggalKirimDiharapkan ? new Date(data.tanggalKirimDiharapkan) : undefined,
        termPembayaran: data.termPembayaran,
        issuedBy: data.issuedBy,
        subtotal,
        tax: data.tax,
        shipping: data.shipping,
        totalAmount,
        keterangan: data.keterangan,
        items: {
          create: itemsWithSubtotal,
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

  async update(id: string, companyId: string, data: UpdatePurchaseOrderInput) {
    const updateData: any = {};
    
    if (data.vendorName) updateData.vendorName = data.vendorName;
    if (data.vendorAddress !== undefined) updateData.vendorAddress = data.vendorAddress;
    if (data.vendorPhone !== undefined) updateData.vendorPhone = data.vendorPhone;
    if (data.tanggalKirimDiharapkan) updateData.tanggalKirimDiharapkan = new Date(data.tanggalKirimDiharapkan);
    if (data.termPembayaran !== undefined) updateData.termPembayaran = data.termPembayaran;
    if (data.keterangan !== undefined) updateData.keterangan = data.keterangan;

    // If items are provided, recalculate totals
    if (data.items) {
      await db.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: id },
      });

      const itemsWithSubtotal = data.items.map(item => ({
        ...item,
        subtotal: item.jumlahOrder * item.hargaSatuan,
      }));

      const subtotal = itemsWithSubtotal.reduce((sum, item) => sum + item.subtotal, 0);
      const tax = data.tax ?? 0;
      const shipping = data.shipping ?? 0;
      const totalAmount = subtotal + tax + shipping;

      updateData.subtotal = subtotal;
      updateData.tax = tax;
      updateData.shipping = shipping;
      updateData.totalAmount = totalAmount;
      updateData.items = {
        create: itemsWithSubtotal,
      };
    } else if (data.tax !== undefined || data.shipping !== undefined) {
      const currentPO = await db.purchaseOrder.findUnique({
        where: { id },
        select: { subtotal: true, tax: true, shipping: true },
      });

      if (currentPO) {
        const tax = data.tax ?? currentPO.tax;
        const shipping = data.shipping ?? currentPO.shipping;
        updateData.tax = tax;
        updateData.shipping = shipping;
        updateData.totalAmount = currentPO.subtotal + tax + shipping;
      }
    }

    return db.purchaseOrder.update({
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

  async updateStatus(id: string, companyId: string, status: StatusPurchaseOrder, additionalData?: any) {
    return db.purchaseOrder.update({
      where: { id, companyId },
      data: {
        status,
        ...additionalData,
      },
    });
  },

  async approve(id: string, companyId: string, approvedBy: string) {
    return db.purchaseOrder.update({
      where: { id, companyId },
      data: {
        approvedBy,
        tanggalApproval: new Date(),
      },
    });
  },

  async issue(id: string, companyId: string) {
    return db.purchaseOrder.update({
      where: { id, companyId },
      data: {
        status: StatusPurchaseOrder.ISSUED,
      },
    });
  },

  async updateItemReceived(itemId: string, jumlahDiterima: number) {
    const item = await db.purchaseOrderItem.findUnique({
      where: { id: itemId },
      select: { jumlahDiterima: true },
    });

    if (!item) {
      throw new Error("PO Item tidak ditemukan");
    }

    return db.purchaseOrderItem.update({
      where: { id: itemId },
      data: {
        jumlahDiterima: item.jumlahDiterima + jumlahDiterima,
      },
    });
  },

  async checkAndUpdatePOStatus(poId: string) {
    const po = await db.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        items: true,
      },
    });

    if (!po) return;

    const allReceived = po.items.every(item => item.jumlahDiterima >= item.jumlahOrder);
    const someReceived = po.items.some(item => item.jumlahDiterima > 0);

    if (allReceived) {
      await db.purchaseOrder.update({
        where: { id: poId },
        data: { status: StatusPurchaseOrder.COMPLETED },
      });
    } else if (someReceived) {
      await db.purchaseOrder.update({
        where: { id: poId },
        data: { status: StatusPurchaseOrder.PARTIAL_RECEIVED },
      });
    }
  },

  async delete(id: string, companyId: string) {
    return db.purchaseOrder.delete({
      where: { id, companyId },
    });
  },

  async generateNomorPO(companyId: string) {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    
    const prefix = `PO/${year}${month}`;
    
    const lastPO = await db.purchaseOrder.findFirst({
      where: {
        companyId,
        nomorPO: {
          startsWith: prefix,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    let nextNumber = 1;
    if (lastPO) {
      const lastNumber = parseInt(lastPO.nomorPO.split("/").pop() ?? "0");
      nextNumber = lastNumber + 1;
    }

    return `${prefix}/${String(nextNumber).padStart(4, "0")}`;
  },
};

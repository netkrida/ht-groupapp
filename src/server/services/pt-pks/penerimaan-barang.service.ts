import { penerimaanBarangRepository } from "../../repositories/penerimaan-barang.repository";
import { purchaseOrderRepository } from "../../repositories/purchase-order.repository";
import { materialInventarisRepository } from "../../repositories/material-inventaris.repository";
import { inventoryTransactionRepository } from "../../repositories/inventory-transaction.repository";
import type { PenerimaanBarangInput, UpdatePenerimaanBarangInput } from "../../schema/penerimaan-barang";
import { StatusPenerimaanBarang, StatusPurchaseOrder, TipeMovement } from "@prisma/client";
import { db } from "../../db";

export const penerimaanBarangService = {
  async getAll(companyId: string, filters?: {
    status?: StatusPenerimaanBarang;
    vendorId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    return penerimaanBarangRepository.findAll(companyId, filters);
  },

  async getById(id: string, companyId: string) {
    const gr = await penerimaanBarangRepository.findById(id, companyId);
    if (!gr) {
      throw new Error("Penerimaan Barang tidak ditemukan");
    }
    return gr;
  },

  async create(companyId: string, data: PenerimaanBarangInput) {
    // Validate materials
    for (const item of data.items) {
      const material = await materialInventarisRepository.findById(item.materialId, companyId);
      if (!material) {
        throw new Error(`Material dengan ID ${item.materialId} tidak ditemukan`);
      }
    }

    // If linked to PO, validate PO
    if (data.purchaseOrderId) {
      const po = await purchaseOrderRepository.findById(data.purchaseOrderId, companyId);
      if (!po) {
        throw new Error("Purchase Order tidak ditemukan");
      }
      if (po.status !== StatusPurchaseOrder.ISSUED && po.status !== StatusPurchaseOrder.PARTIAL_RECEIVED) {
        throw new Error("Purchase Order harus sudah diterbitkan");
      }
    }

    // Generate nomor penerimaan
    const nomorPenerimaan = await penerimaanBarangRepository.generateNomorPenerimaan(companyId);

    return penerimaanBarangRepository.create(companyId, nomorPenerimaan, data);
  },

  async update(id: string, companyId: string, data: UpdatePenerimaanBarangInput) {
    const gr = await this.getById(id, companyId);
    if (gr.status !== StatusPenerimaanBarang.DRAFT) {
      throw new Error("Penerimaan Barang tidak dapat diubah karena sudah completed");
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

    return penerimaanBarangRepository.update(id, companyId, data);
  },

  async complete(id: string, companyId: string, checkedBy: string, operator: string) {
    const gr = await this.getById(id, companyId);
    if (gr.status !== StatusPenerimaanBarang.DRAFT) {
      throw new Error("Penerimaan Barang tidak dapat dicomplete");
    }

    // Use transaction to ensure atomicity
    return db.$transaction(async (tx) => {
      // Update stock and create transactions for each item
      for (const item of gr.items) {
        // Get current stock
        const material = await tx.materialInventaris.findUnique({
          where: { id: item.materialId },
        });

        if (!material) {
          throw new Error(`Material ${item.materialId} tidak ditemukan`);
        }

        const newStock = material.stockOnHand + item.jumlahDiterima;

        // Update material stock
        await tx.materialInventaris.update({
          where: { id: item.materialId },
          data: { stockOnHand: newStock },
        });

        // Create inventory transaction
        await tx.inventoryTransaction.create({
          data: {
            companyId,
            materialId: item.materialId,
            tipeTransaksi: TipeMovement.IN,
            referensi: gr.nomorPenerimaan,
            vendorId: gr.vendorId,
            vendorName: gr.vendorName,
            jumlahMasuk: item.jumlahDiterima,
            jumlahKeluar: 0,
            stockOnHand: newStock,
            hargaSatuan: item.hargaSatuan,
            totalHarga: item.totalHarga,
            keterangan: `Penerimaan Barang dari ${gr.vendorName}`,
            operator,
          },
        });

        // Update PO item if linked
        if (item.purchaseOrderItemId) {
          const poItem = await tx.purchaseOrderItem.findUnique({
            where: { id: item.purchaseOrderItemId },
          });

          if (poItem) {
            await tx.purchaseOrderItem.update({
              where: { id: item.purchaseOrderItemId },
              data: {
                jumlahDiterima: poItem.jumlahDiterima + item.jumlahDiterima,
              },
            });
          }
        }
      }

      // Update GR status
      const updatedGR = await tx.penerimaanBarang.update({
        where: { id, companyId },
        data: {
          status: StatusPenerimaanBarang.COMPLETED,
          checkedBy,
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

      // Update PO status if all items received
      if (gr.purchaseOrderId) {
        const po = await tx.purchaseOrder.findUnique({
          where: { id: gr.purchaseOrderId },
          include: { items: true },
        });

        if (po) {
          const allReceived = po.items.every(item => {
            // Calculate total received including current GR
            const currentGRItem = gr.items.find(i => i.purchaseOrderItemId === item.id);
            const totalReceived = item.jumlahDiterima + (currentGRItem?.jumlahDiterima ?? 0);
            return totalReceived >= item.jumlahOrder;
          });

          const someReceived = po.items.some(item => {
            const currentGRItem = gr.items.find(i => i.purchaseOrderItemId === item.id);
            const totalReceived = item.jumlahDiterima + (currentGRItem?.jumlahDiterima ?? 0);
            return totalReceived > 0;
          });

          if (allReceived) {
            await tx.purchaseOrder.update({
              where: { id: gr.purchaseOrderId },
              data: { status: StatusPurchaseOrder.COMPLETED },
            });
          } else if (someReceived) {
            await tx.purchaseOrder.update({
              where: { id: gr.purchaseOrderId },
              data: { status: StatusPurchaseOrder.PARTIAL_RECEIVED },
            });
          }
        }
      }

      return updatedGR;
    });
  },

  async delete(id: string, companyId: string) {
    const gr = await this.getById(id, companyId);
    if (gr.status !== StatusPenerimaanBarang.DRAFT) {
      throw new Error("Hanya Penerimaan Barang dengan status DRAFT yang dapat dihapus");
    }

    return penerimaanBarangRepository.delete(id, companyId);
  },
};

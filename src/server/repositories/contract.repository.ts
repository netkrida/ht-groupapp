import { db } from "@/server/db";
import type {
  CreateContractInput,
  UpdateContractInput,
  ContractQueryInput,
} from "@/server/schema/contract";
import type { Prisma, StatusContract, TaxStatus } from "@prisma/client";

export class ContractRepository {
  /**
   * Get all contracts by companyId with pagination
   */
  async findByCompanyId(companyId: string, query?: ContractQueryInput) {
    const where: Prisma.ContractWhereInput = {
      buyer: {
        companyId,
      },
    };

    // Search filter
    if (query?.search) {
      where.OR = [
        { contractNumber: { contains: query.search, mode: "insensitive" } },
        {
          buyer: {
            name: { contains: query.search, mode: "insensitive" },
          },
        },
      ];
    }

    // Buyer filter
    if (query?.buyerId) {
      where.buyerId = query.buyerId;
    }

    // Status filter
    if (query?.status) {
      where.status = query.status as StatusContract;
    }

    // Date range filter
    if (query?.startDate || query?.endDate) {
      where.deliveryDate = {};
      if (query.startDate) {
        where.deliveryDate.gte = query.startDate;
      }
      if (query.endDate) {
        where.deliveryDate.lte = query.endDate;
      }
    }

    const page = query?.page || 1;
    const limit = query?.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      db.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          buyer: {
            select: {
              id: true,
              code: true,
              name: true,
              contactPerson: true,
              phone: true,
              taxStatus: true,
            },
          },
          contractItems: {
            include: {
              material: {
                include: {
                  satuan: true,
                },
              },
            },
          },
        },
      }),
      db.contract.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get contract by id
   */
  async findById(id: string, companyId: string) {
    return db.contract.findFirst({
      where: {
        id,
        buyer: {
          companyId,
        },
      },
      include: {
        buyer: true,
        contractItems: {
          include: {
            material: {
              include: {
                satuan: true,
                kategori: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Get contract by contract number
   */
  async findByContractNumber(contractNumber: string, companyId: string) {
    return db.contract.findFirst({
      where: {
        contractNumber,
        buyer: {
          companyId,
        },
      },
    });
  }

  /**
   * Check if contract number exists
   */
  async isContractNumberExists(
    contractNumber: string,
    companyId: string,
    excludeId?: string
  ) {
    const where: Prisma.ContractWhereInput = {
      contractNumber,
      buyer: {
        companyId,
      },
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    const contract = await db.contract.findFirst({ where });
    return !!contract;
  }

  /**
   * Calculate tax amount based on tax status
   */
  calculateTaxAmount(subtotal: number, taxStatus: TaxStatus): number {
    switch (taxStatus) {
      case "PKP_11":
        return subtotal * 0.11; // 11% tax
      case "PKP_1_1":
        return subtotal * 0.011; // 1.1% tax
      case "NON_PKP":
      default:
        return 0; // No tax
    }
  }

  /**
   * Create new contract with items
   */
  async create(companyId: string, data: CreateContractInput) {
    // Get buyer for tax calculation
    const buyer = await db.buyer.findUnique({
      where: { id: data.buyerId },
      select: { taxStatus: true, companyId: true },
    });

    if (!buyer || buyer.companyId !== companyId) {
      throw new Error("Buyer tidak ditemukan atau tidak sesuai dengan company");
    }

    // Calculate totals
    let subtotal = 0;
    const items = data.items.map((item) => {
      const totalPrice = item.quantity * item.unitPrice;
      subtotal += totalPrice;
      return {
        ...item,
        totalPrice,
      };
    });

    const taxAmount = this.calculateTaxAmount(subtotal, buyer.taxStatus);
    const totalAmount = subtotal + taxAmount;

    // Generate contract number
    const contractNumber = await this.generateContractNumber(companyId);

    // Create contract with items
    return db.contract.create({
      data: {
        companyId,
        buyerId: data.buyerId,
        contractNumber,
        contractDate: data.contractDate,
        startDate: data.startDate,
        endDate: data.endDate,
        deliveryDate: data.deliveryDate,
        deliveryAddress: data.deliveryAddress,
        subtotal,
        taxAmount,
        totalAmount,
        status: data.status || "DRAFT",
        notes: data.notes,
        contractItems: {
          create: items,
        },
      },
      include: {
        buyer: true,
        contractItems: {
          include: {
            material: {
              include: {
                satuan: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update contract
   */
  async update(id: string, companyId: string, data: UpdateContractInput) {
    // Get existing contract
    const existingContract = await this.findById(id, companyId);
    if (!existingContract) {
      throw new Error("Kontrak tidak ditemukan");
    }

    // Get buyer (use existing or new buyerId)
    const buyerId = data.buyerId || existingContract.buyerId;
    const buyer = await db.buyer.findUnique({
      where: { id: buyerId },
      select: { taxStatus: true },
    });

    if (!buyer) {
      throw new Error("Buyer tidak ditemukan");
    }

    // Calculate new totals if items are provided
    let updateData: any = {
      ...data,
      items: undefined, // Remove items from main update data
    };

    if (data.items) {
      let subtotal = 0;
      const items = data.items.map((item) => {
        const totalPrice = item.quantity * item.unitPrice;
        subtotal += totalPrice;
        return {
          ...item,
          totalPrice,
        };
      });

      const taxAmount = this.calculateTaxAmount(subtotal, buyer.taxStatus);
      const totalAmount = subtotal + taxAmount;

      updateData.subtotal = subtotal;
      updateData.taxAmount = taxAmount;
      updateData.totalAmount = totalAmount;

      // Delete old items and create new ones
      await db.contractItem.deleteMany({
        where: { contractId: id },
      });

      updateData.contractItems = {
        create: items,
      };
    }

    return db.contract.update({
      where: { id },
      data: updateData,
      include: {
        buyer: true,
        contractItems: {
          include: {
            material: {
              include: {
                satuan: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Delete contract
   */
  async delete(id: string, companyId: string) {
    // Verify contract belongs to company
    const contract = await this.findById(id, companyId);
    if (!contract) {
      throw new Error("Kontrak tidak ditemukan");
    }

    return db.contract.delete({
      where: { id },
    });
  }

  /**
   * Update contract status
   */
  async updateStatus(id: string, companyId: string, status: StatusContract) {
    return db.contract.update({
      where: {
        id,
        buyer: {
          companyId,
        },
      },
      data: { status },
    });
  }

  /**
   * Generate contract number
   */
  async generateContractNumber(companyId: string): Promise<string> {
    const lastContract = await db.contract.findFirst({
      where: {
        buyer: {
          companyId,
        },
      },
      orderBy: { createdAt: "desc" },
      select: { contractNumber: true },
    });

    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");

    if (!lastContract) {
      return `CTR/${year}${month}/0001`;
    }

    // Extract number from contract number (e.g., "CTR/202411/0001" -> 1)
    const match = lastContract.contractNumber.match(/CTR\/\d{6}\/(\d+)/);
    if (match) {
      const lastNumber = parseInt(match[1]!, 10);
      const nextNumber = lastNumber + 1;
      return `CTR/${year}${month}/${nextNumber.toString().padStart(4, "0")}`;
    }

    return `CTR/${year}${month}/0001`;
  }

  /**
   * Get contracts by buyer
   */
  async findByBuyerId(buyerId: string, companyId: string) {
    return db.contract.findMany({
      where: {
        buyerId,
        buyer: {
          companyId,
        },
      },
      orderBy: { createdAt: "desc" },
      include: {
        contractItems: {
          include: {
            material: {
              include: {
                satuan: true,
              },
            },
          },
        },
      },
    });
  }
}

export const contractRepository = new ContractRepository();

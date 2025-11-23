import { z } from "zod";

// Enum schemas
export const statusContractSchema = z.enum([
  "DRAFT",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

// Contract Item schema
export const contractItemSchema = z.object({
  materialId: z.string().cuid("ID material tidak valid"),
  quantity: z.number().min(0.01, "Kuantitas harus lebih dari 0"),
  unitPrice: z.number().min(0, "Harga satuan tidak boleh negatif"),
  notes: z.string().optional().nullable(),
});

// Contract schemas
export const createContractSchema = z.object({
  buyerId: z.string().cuid("ID buyer tidak valid"),
  contractDate: z.coerce.date(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  deliveryDate: z.coerce.date(),
  deliveryAddress: z.string().min(1, "Alamat pengiriman wajib diisi"),
  notes: z.string().optional().nullable(),
  status: statusContractSchema.default("DRAFT"),
  items: z
    .array(contractItemSchema)
    .min(1, "Minimal 1 item produk harus dipilih"),
}).refine((data) => data.endDate >= data.startDate, {
  message: "Tanggal berakhir harus setelah atau sama dengan tanggal mulai",
  path: ["endDate"],
});

export const updateContractSchema = z
  .object({
    buyerId: z.string().cuid("ID buyer tidak valid").optional(),
    contractDate: z.coerce.date().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    deliveryDate: z.coerce.date().optional(),
    deliveryAddress: z
      .string()
      .min(1, "Alamat pengiriman wajib diisi")
      .optional(),
    notes: z.string().optional().nullable(),
    status: statusContractSchema.optional(),
    items: z
      .array(contractItemSchema)
      .min(1, "Minimal 1 item produk harus dipilih")
      .optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: "Tanggal berakhir harus setelah atau sama dengan tanggal mulai",
      path: ["endDate"],
    }
  );

export const contractIdSchema = z.object({
  id: z.string().cuid("ID kontrak tidak valid"),
});

export const contractQuerySchema = z.object({
  search: z.string().optional(),
  buyerId: z.string().cuid().optional(),
  status: statusContractSchema.optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

// Type exports
export type CreateContractInput = z.infer<typeof createContractSchema>;
export type UpdateContractInput = z.infer<typeof updateContractSchema>;
export type ContractIdInput = z.infer<typeof contractIdSchema>;
export type ContractQueryInput = z.infer<typeof contractQuerySchema>;
export type ContractItemInput = z.infer<typeof contractItemSchema>;

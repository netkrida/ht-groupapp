import { z } from "zod";

// Schema untuk Step 1 - Informasi Penerima
export const pengirimanStep1Schema = z.object({
  tanggalPengiriman: z.date(),
  operatorPenimbang: z.string().min(1, "Operator harus diisi"),
  buyerId: z.string().min(1, "Buyer harus dipilih"),
  contractId: z.string().min(1, "Kontrak harus dipilih"),
  contractItemId: z.string().min(1, "Item kontrak harus dipilih"),
});

// Schema untuk Step 2 - Vendor & Kendaraan
export const pengirimanStep2Schema = z.object({
  vendorVehicleId: z.string().min(1, "Kendaraan vendor harus dipilih"),
});

// Schema untuk Step 3 - Timbangan Tarra (truck kosong)
export const pengirimanStep3Schema = z.object({
  metodeTarra: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratTarra: z.number().min(0, "Berat tarra harus lebih dari 0"),
  waktuTimbangTarra: z.date(),
});

// Schema untuk Step 4 - Timbangan Gross (truck dengan muatan)
export const pengirimanStep4Schema = z.object({
  metodeGross: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratGross: z.number().min(0, "Berat gross harus lebih dari 0"),
  waktuTimbangGross: z.date(),
});

// Schema untuk Step 5 - Mutu Kernel
export const pengirimanStep5Schema = z.object({
  ffa: z.number().min(0, "FFA harus >= 0").max(100, "FFA maksimal 100%"),
  air: z.number().min(0, "Kadar air harus >= 0").max(100, "Kadar air maksimal 100%"),
  kotoran: z.number().min(0, "Kadar kotoran harus >= 0").max(100, "Kadar kotoran maksimal 100%"),
});

// Schema lengkap untuk create
export const createPengirimanProductSchema = z.object({
  // Step 1
  tanggalPengiriman: z.date(),
  operatorPenimbang: z.string().min(1, "Operator harus diisi"),
  buyerId: z.string().min(1, "Buyer harus dipilih"),
  contractId: z.string().min(1, "Kontrak harus dipilih"),
  contractItemId: z.string().min(1, "Item kontrak harus dipilih"),
  
  // Step 2
  vendorVehicleId: z.string().min(1, "Kendaraan vendor harus dipilih"),
  
  // Step 3
  metodeTarra: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratTarra: z.number().min(0, "Berat tarra harus lebih dari 0"),
  waktuTimbangTarra: z.date(),
  
  // Step 4
  metodeGross: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratGross: z.number().min(0, "Berat gross harus lebih dari 0"),
  waktuTimbangGross: z.date(),
  
  // Step 5
  ffa: z.number().min(0).max(100),
  air: z.number().min(0).max(100),
  kotoran: z.number().min(0).max(100),
  
  status: z.enum(["DRAFT", "COMPLETED", "CANCELLED"]).optional(),
}).refine((data) => data.beratGross > data.beratTarra, {
  message: "Berat gross harus lebih besar dari berat tarra",
  path: ["beratGross"],
});

export const updatePengirimanProductSchema = z.object({
  tanggalPengiriman: z.date().optional(),
  operatorPenimbang: z.string().optional(),
  buyerId: z.string().optional(),
  contractId: z.string().optional(),
  contractItemId: z.string().optional(),
  vendorVehicleId: z.string().optional(),
  metodeTarra: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]).optional(),
  beratTarra: z.number().optional(),
  waktuTimbangTarra: z.date().optional(),
  metodeGross: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]).optional(),
  beratGross: z.number().optional(),
  waktuTimbangGross: z.date().optional(),
  ffa: z.number().optional(),
  air: z.number().optional(),
  kotoran: z.number().optional(),
  status: z.enum(["DRAFT", "COMPLETED", "CANCELLED"]).optional(),
});

export type PengirimanStep1Input = z.infer<typeof pengirimanStep1Schema>;
export type PengirimanStep2Input = z.infer<typeof pengirimanStep2Schema>;
export type PengirimanStep3Input = z.infer<typeof pengirimanStep3Schema>;
export type PengirimanStep4Input = z.infer<typeof pengirimanStep4Schema>;
export type PengirimanStep5Input = z.infer<typeof pengirimanStep5Schema>;
export type CreatePengirimanProductInput = z.infer<typeof createPengirimanProductSchema>;
export type UpdatePengirimanProductInput = z.infer<typeof updatePengirimanProductSchema>;

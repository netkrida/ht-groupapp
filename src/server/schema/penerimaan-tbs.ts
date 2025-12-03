import { z } from "zod";

// Schema untuk Step 1 - Informasi Pengirim
export const penerimaanStep1Schema = z.object({
  tanggalTerima: z.date(),
  materialId: z.string().min(1, "Produk harus dipilih"),
  operatorPenimbang: z.string().min(1, "Operator harus diisi"),
  supplierId: z.string().min(1, "Supplier harus dipilih"),
  lokasiKebun: z.string().optional(),
  jenisBuah: z.enum(["TBS-BB", "TBS-BS", "TBS-BK"]).optional(),
  // Untuk kendaraan & supir
  transporterType: z.enum(["existing", "new"]),
  transporterId: z.string().optional(), // jika pilih existing
  // jika pilih new
  nomorKendaraan: z.string().optional(),
  namaSupir: z.string().optional(),
});

// Schema untuk Step 2 - Timbangan Bruto
export const penerimaanStep2Schema = z.object({
  metodeBruto: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratBruto: z.number().min(0, "Berat bruto harus lebih dari 0"),
  waktuTimbangBruto: z.date(),
});

// Schema untuk Step 3 - Timbangan Tarra
export const penerimaanStep3Schema = z.object({
  metodeTarra: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratTarra: z.number().min(0, "Berat tarra harus lebih dari 0"),
  waktuTimbangTarra: z.date(),
  potonganPersen: z.number().min(0).max(100, "Potongan maksimal 100%"),
});

// Schema untuk Step 4 - Harga
export const penerimaanStep4Schema = z.object({
  hargaPerKg: z.number().min(0, "Harga per kg harus lebih dari 0"),
});

// Schema lengkap untuk create
export const createPenerimaanTBSSchema = z.object({
  // Step 1
  tanggalTerima: z.date(),
  materialId: z.string().min(1, "Produk harus dipilih"),
  operatorPenimbang: z.string().min(1, "Operator harus diisi"),
  supplierId: z.string().min(1, "Supplier harus dipilih"),
  lokasiKebun: z.string().optional(),
  jenisBuah: z.enum(["TBS-BB", "TBS-BS", "TBS-BK"]).optional(),
  transporterId: z.string().optional(), // Optional karena bisa dibuat baru (transporterType = "new")
  
  // Step 2
  metodeBruto: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratBruto: z.number().min(0, "Berat bruto harus lebih dari 0"),
  waktuTimbangBruto: z.date(),
  
  // Step 3
  metodeTarra: z.enum(["MANUAL", "SISTEM_TIMBANGAN"]),
  beratTarra: z.number().min(0, "Berat tarra harus lebih dari 0"),
  waktuTimbangTarra: z.date(),
  potonganPersen: z.number().min(0).max(100),
  
  // Step 4
  hargaPerKg: z.number().min(0, "Harga per kg harus lebih dari 0"),
  
  status: z.enum(["DRAFT", "COMPLETED", "CANCELLED"]).optional(),
});

export const updatePenerimaanTBSSchema = createPenerimaanTBSSchema.partial();

export type PenerimaanStep1Input = z.infer<typeof penerimaanStep1Schema>;
export type PenerimaanStep2Input = z.infer<typeof penerimaanStep2Schema>;
export type PenerimaanStep3Input = z.infer<typeof penerimaanStep3Schema>;
export type PenerimaanStep4Input = z.infer<typeof penerimaanStep4Schema>;
export type CreatePenerimaanTBSInput = z.infer<typeof createPenerimaanTBSSchema>;
export type UpdatePenerimaanTBSInput = z.infer<typeof updatePenerimaanTBSSchema>;

import { z } from "zod";

// Schema for tanggal kerja (attendance per day)
export const tanggalKerjaSchema = z.record(z.string(), z.string().optional());

// Schema for creating penggajian from Excel import
// Mapping Excel setelah TANGGAL KERJA (kolom 1-31):
// Index | Kolom Excel        | Field Database
// ------|-------------------|----------------
// 40    | HK                | hk
// 41    | Libur Dibayar     | liburDibayar
// 42    | HK Tidak Dibayar  | hkTidakDibayar
// 43    | HK Dibayar        | hkDibayar
// 44    | Lembur (hari)     | lemburHari
// 45    | Gaji Pokok        | gajiPokok
// 46    | Tunj. Jabatan     | tunjanganJabatan
// 47    | Tunj. Perumahan   | tunjanganPerumahan
// 48    | Overtime          | overtime
// 49    | Total             | totalSebelumPotongan
// 50    | Pot. Kehadiran    | potKehadiran
// 51    | Pot. BPJS TK JHT  | potBpjsTkJht
// 52    | Pot. BPJS TK JN   | potBpjsTkJn
// 53    | Pot. BPJS Kes     | potBpjsKesehatan
// 54    | Pot. PPH 21       | potPph21
// 55    | Total Potongan    | totalPotongan
// 56    | Upah Diterima     | upahDiterima

export const createPenggajianSchema = z.object({
  // Periode
  periodeBulan: z.number().min(1).max(12),
  periodeTahun: z.number().min(2000).max(2100),
  
  // Identitas Karyawan
  no: z.number().optional().nullable(),
  namaKaryawan: z.string().min(1, "Nama karyawan wajib diisi"),
  tktk: z.string().optional().nullable(),  // TK/K
  gol: z.string().optional().nullable(),  // Golongan
  nomorRekening: z.string().optional().nullable(),
  devisi: z.string().optional().nullable(),
  noBpjsTk: z.string().optional().nullable(),
  noBpjsKesehatan: z.string().optional().nullable(),
  jabatan: z.string().optional().nullable(),
  
  // Tanggal Kerja
  tanggalKerja: tanggalKerjaSchema.optional().nullable(),
  
  // ========== HARI KERJA SECTION ==========
  hk: z.number().int().default(0),              // HK (Hari Kerja)
  liburDibayar: z.number().int().default(0),    // Libur Dibayar
  hkTidakDibayar: z.number().int().default(0),  // HK Tidak Dibayar
  hkDibayar: z.number().int().default(0),       // HK Dibayar
  lemburHari: z.number().default(0),            // Lembur (hari)
  
  // ========== GAJI (SALARY) ==========
  gajiPokok: z.number().default(0),
  
  // ========== TUNJANGAN ==========
  tunjanganJabatan: z.number().default(0),
  tunjanganPerumahan: z.number().default(0),
  
  // ========== OVERTIME ==========
  overtime: z.number().default(0),
  
  // ========== TOTAL SEBELUM POTONGAN ==========
  totalSebelumPotongan: z.number().default(0),
  
  // ========== POTONGAN ==========
  potKehadiran: z.number().default(0),      // Potongan Kehadiran
  potBpjsTkJht: z.number().default(0),      // Potongan BPJS TK JHT
  potBpjsTkJn: z.number().default(0),       // Potongan BPJS TK JN
  potBpjsKesehatan: z.number().default(0),  // Potongan BPJS Kesehatan
  potPph21: z.number().default(0),          // Potongan PPH 21
  
  // ========== TOTAL POTONGAN ==========
  totalPotongan: z.number().default(0),
  
  // ========== UPAH DITERIMA ==========
  upahDiterima: z.number().default(0),
});

// Schema for updating penggajian
export const updatePenggajianSchema = createPenggajianSchema.partial();

// Schema for penggajian id
export const penggajianIdSchema = z.object({
  id: z.string().cuid("ID penggajian tidak valid"),
});

// Schema for query parameters
export const penggajianQuerySchema = z.object({
  search: z.string().optional(),
  devisi: z.string().optional(),
  periodeBulan: z.coerce.number().optional(),
  periodeTahun: z.coerce.number().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(1000).default(100),
});

// Schema for bulk import from Excel
export const importPenggajianSchema = z.object({
  periodeBulan: z.number().min(1).max(12),
  periodeTahun: z.number().min(2000).max(2100),
  data: z.array(createPenggajianSchema.omit({ periodeBulan: true, periodeTahun: true })),
});

// Type exports
export type CreatePenggajianInput = z.infer<typeof createPenggajianSchema>;
export type UpdatePenggajianInput = z.infer<typeof updatePenggajianSchema>;
export type PenggajianIdInput = z.infer<typeof penggajianIdSchema>;
export type PenggajianQueryInput = z.infer<typeof penggajianQuerySchema>;
export type ImportPenggajianInput = z.infer<typeof importPenggajianSchema>;
export type TanggalKerja = z.infer<typeof tanggalKerjaSchema>;

import React from "react";
import { renderToBuffer, Document } from "@react-pdf/renderer";
import { SuratPengantarPDF } from "./surat-pengantar-pdf";

type PengirimanData = {
  nomorPengiriman: string;
  noSegel: string;
  tanggalPengiriman: string;
  operatorPenimbang: string;
  buyer: {
    name: string;
    code: string;
    address: string;
    contactPerson: string;
    phone: string;
  };
  contract: {
    contractNumber: string;
    deliveryDate: string;
  };
  contractItem: {
    material: {
      name: string;
      code: string;
      satuan: {
        name: string;
        symbol: string;
      };
    };
  };
  vendorVehicle: {
    nomorKendaraan: string;
    namaSupir: string;
    noHpSupir?: string | null;
    vendor: {
      name: string;
      code: string;
    };
  };
  beratTarra: number;
  beratGross: number;
  beratNetto: number;
  ffa: number;
  air: number;
  kotoran: number;
  waktuTimbangTarra: string;
  waktuTimbangGross: string;
  company?: {
    name: string;
    code: string;
  };
};

export async function generateSuratPengantarPDF(
  data: PengirimanData,
): Promise<Buffer> {
  const pdfElement = (
    <Document>
      <SuratPengantarPDF data={data} />
    </Document>
  );
  const buffer = await renderToBuffer(pdfElement);
  return buffer;
}

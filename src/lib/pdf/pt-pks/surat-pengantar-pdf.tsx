import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

// Register fonts
Font.register({
  family: "Roboto",
  src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Roboto",
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 3,
  },
  docInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    fontSize: 9,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    marginBottom: 8,
    backgroundColor: "#f0f0f0",
    padding: 5,
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  label: {
    width: "40%",
    fontSize: 9,
  },
  colon: {
    width: "3%",
    fontSize: 9,
  },
  value: {
    width: "57%",
    fontSize: 9,
    fontWeight: "bold",
  },
  table: {
    marginTop: 10,
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#333",
    color: "#fff",
    padding: 5,
    fontSize: 9,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    borderBottomStyle: "solid",
    padding: 5,
    fontSize: 9,
  },
  tableCell: {
    flex: 1,
  },
  tableCellRight: {
    flex: 1,
    textAlign: "right",
  },
  signature: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  signatureBox: {
    width: "30%",
    textAlign: "center",
  },
  signatureLabel: {
    fontSize: 9,
    marginBottom: 50,
  },
  signatureName: {
    fontSize: 9,
    fontWeight: "bold",
    borderTopWidth: 1,
    borderTopColor: "#000",
    borderTopStyle: "solid",
    paddingTop: 5,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#666",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    borderTopStyle: "solid",
    paddingTop: 5,
  },
  watermark: {
    fontSize: 11,
    color: "#e0e0e0",
    marginTop: 5,
  },
});

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

type SuratPengantarPDFProps = {
  data: PengirimanData;
};

export const SuratPengantarPDF: React.FC<SuratPengantarPDFProps> = ({ data }) => {
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMMM yyyy", { locale: idLocale });
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), "dd MMM yyyy HH:mm:ss", { locale: idLocale });
    } catch {
      return dateString;
    }
  };

  return (
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>SURAT PENGANTAR PENGIRIMAN</Text>
        <Text style={styles.subtitle}>
          {data.company?.name || "PT. HAMPARAN TENANG GROUP"}
        </Text>
        <Text style={styles.watermark}>Original Copy</Text>
      </View>
      {/* Document Info */}
      <View style={styles.docInfo}>
        <View>
          <Text>No. DO: {data.nomorPengiriman}</Text>
          <Text>No. Segel: {data.noSegel}</Text>
        </View>
        <View>
          <Text>Tanggal: {formatDate(data.tanggalPengiriman)}</Text>
          <Text>Operator: {data.operatorPenimbang}</Text>
        </View>
      </View>
      {/* Informasi Buyer */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INFORMASI PENERIMA (BUYER)</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Nama Buyer</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.buyer.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Kode Buyer</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.buyer.code}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Alamat</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.buyer.address}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Contact Person</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.buyer.contactPerson}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Telepon</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.buyer.phone}</Text>
        </View>
      </View>
      {/* Informasi Kontrak & Product */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INFORMASI KONTRAK & PRODUCT</Text>
        <View style={styles.row}>
          <Text style={styles.label}>No. Kontrak</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.contract.contractNumber}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tanggal Pengiriman Kontrak</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{formatDate(data.contract.deliveryDate)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nama Product</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.contractItem.material.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Kode Product</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.contractItem.material.code}</Text>
        </View>
      </View>
      {/* Informasi Vendor & Kendaraan */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>INFORMASI TRANSPORTIR</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Vendor Transportir</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.vendorVehicle.vendor.name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nomor Kendaraan</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.vendorVehicle.nomorKendaraan}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nama Supir</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.vendorVehicle.namaSupir}</Text>
        </View>
        {data.vendorVehicle.noHpSupir && (
          <View style={styles.row}>
            <Text style={styles.label}>No. HP Supir</Text>
            <Text style={styles.colon}>:</Text>
            <Text style={styles.value}>{data.vendorVehicle.noHpSupir}</Text>
          </View>
        )}
      </View>
      {/* Detail Penimbangan */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DETAIL PENIMBANGAN</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableCell}>Keterangan</Text>
            <Text style={styles.tableCellRight}>Berat (Kg)</Text>
            <Text style={styles.tableCell}>Waktu Timbang</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Berat Tarra (Truck Kosong)</Text>
            <Text style={styles.tableCellRight}>
              {data.beratTarra.toLocaleString("id-ID")}
            </Text>
            <Text style={styles.tableCell}>{formatDateTime(data.waktuTimbangTarra)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableCell}>Berat Gross (Truck + Muatan)</Text>
            <Text style={styles.tableCellRight}>
              {data.beratGross.toLocaleString("id-ID")}
            </Text>
            <Text style={styles.tableCell}>{formatDateTime(data.waktuTimbangGross)}</Text>
          </View>
          <View style={[styles.tableRow, { backgroundColor: "#f9f9f9", fontWeight: "bold" }]}>
            <Text style={styles.tableCell}>BERAT NETTO</Text>
            <Text style={[styles.tableCellRight, { fontWeight: "bold" }]}>
              {data.beratNetto.toLocaleString("id-ID")}
            </Text>
            <Text style={styles.tableCell}>-</Text>
          </View>
        </View>
      </View>
      {/* Mutu Kernel */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MUTU KERNEL</Text>
        <View style={styles.row}>
          <Text style={styles.label}>FFA (Free Fatty Acid)</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.ffa}%</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Kadar Air</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.air}%</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Kadar Kotoran</Text>
          <Text style={styles.colon}>:</Text>
          <Text style={styles.value}>{data.kotoran}%</Text>
        </View>
      </View>
      {/* Tanda Tangan */}
      <View style={styles.signature}>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Dibuat Oleh,</Text>
          <Text style={styles.signatureName}>{data.operatorPenimbang}</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Supir,</Text>
          <Text style={styles.signatureName}>{data.vendorVehicle.namaSupir}</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text style={styles.signatureLabel}>Penerima,</Text>
          <Text style={styles.signatureName}>(...........................)</Text>
        </View>
      </View>
      {/* Footer */}
      <View style={styles.footer}>
        <Text>
          Dokumen ini dicetak secara otomatis pada{" "}
          {format(new Date(), "dd MMMM yyyy HH:mm:ss", { locale: idLocale })}
        </Text>
        <Text>
          {data.company?.name || "PT. HAMPARAN TENANG GROUP"} - Sistem Manajemen Pabrik Kelapa Sawit
        </Text>
      </View>
    </Page>
  );
};

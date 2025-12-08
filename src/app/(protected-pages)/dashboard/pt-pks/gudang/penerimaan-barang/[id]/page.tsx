"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";

interface PenerimaanBarangDetail {
  id: string;
  nomorPenerimaan: string;
  tanggalPenerimaan: string;
  receivedBy: string;
  status: string;
  nomorSuratJalan?: string;
  tanggalSuratJalan?: string;
  keterangan?: string;
  vendorName: string;
  purchaseOrder?: {
    nomorPO: string;
    namaSupplier: string;
  };
  purchaseRequest?: {
    nomorPR: string;
    judulPermintaan: string;
  };
  items: Array<{
    id: string;
    jumlahDiterima: number;
    hargaSatuan: number;
    totalHarga: number;
    lokasiPenyimpanan?: string;
    keterangan?: string;
    material: {
      partNumber: string;
      namaMaterial: string;
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
}

export default function PenerimaanBarangDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [penerimaan, setPenerimaan] = useState<PenerimaanBarangDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const fetchDetail = async () => {
    try {
      const response = await fetch(`/api/pt-pks/penerimaan-barang/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPenerimaan(data);
      } else {
        console.error("Failed to fetch penerimaan barang detail");
      }
    } catch (error) {
      console.error("Error fetching detail:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: "secondary",
      PENDING: "default",
      COMPLETED: "default",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  if (!penerimaan) {
    return (
      <div className="container mx-auto py-6">
        <div className="text-center py-8">Data tidak ditemukan</div>
      </div>
    );
  }

  const totalKeseluruhan = penerimaan.items.reduce(
    (sum, item) => sum + item.totalHarga,
    0
  );

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/pt-pks/gudang/penerimaan-barang")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Detail Penerimaan Barang</h1>
          <p className="text-muted-foreground">{penerimaan.nomorPenerimaan}</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Informasi Umum */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Penerimaan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <span className="text-sm text-muted-foreground">Nomor Penerimaan</span>
                <p className="font-medium">{penerimaan.nomorPenerimaan}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Tanggal Penerimaan</span>
                <p className="font-medium">
                  {format(new Date(penerimaan.tanggalPenerimaan), "dd MMMM yyyy")}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Penerima</span>
                <p className="font-medium">{penerimaan.receivedBy}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Status</span>
                <div>{getStatusBadge(penerimaan.status)}</div>
              </div>
              {penerimaan.nomorSuratJalan && (
                <div>
                  <span className="text-sm text-muted-foreground">Nomor Surat Jalan</span>
                  <p className="font-medium">{penerimaan.nomorSuratJalan}</p>
                </div>
              )}
              {penerimaan.tanggalSuratJalan && (
                <div>
                  <span className="text-sm text-muted-foreground">Tanggal Surat Jalan</span>
                  <p className="font-medium">
                    {format(new Date(penerimaan.tanggalSuratJalan), "dd MMMM yyyy")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informasi Vendor/Supplier */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Vendor/Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <span className="text-sm text-muted-foreground">
                  {penerimaan.purchaseOrder ? "Supplier" : "Vendor"}
                </span>
                <p className="font-medium">
                  {penerimaan.purchaseOrder?.namaSupplier || penerimaan.vendorName}
                </p>
              </div>
              {penerimaan.purchaseOrder && (
                <div>
                  <span className="text-sm text-muted-foreground">Nomor PO</span>
                  <p className="font-medium">{penerimaan.purchaseOrder.nomorPO}</p>
                </div>
              )}
              {penerimaan.purchaseRequest && (
                <>
                  <div>
                    <span className="text-sm text-muted-foreground">Nomor PR</span>
                    <p className="font-medium">{penerimaan.purchaseRequest.nomorPR}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Judul Permintaan</span>
                    <p className="font-medium">{penerimaan.purchaseRequest.judulPermintaan}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Daftar Material */}
        <Card>
          <CardHeader>
            <CardTitle>Daftar Material</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Part Number</TableHead>
                    <TableHead>Nama Material</TableHead>
                    <TableHead className="text-right">Jumlah Diterima</TableHead>
                    <TableHead className="text-right">Harga Satuan</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {penerimaan.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.material.partNumber}
                      </TableCell>
                      <TableCell>{item.material.namaMaterial}</TableCell>
                      <TableCell className="text-right">
                        {item.jumlahDiterima} {item.material.satuanMaterial.symbol}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {item.hargaSatuan.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {item.totalHarga.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>{item.lokasiPenyimpanan || "-"}</TableCell>
                      <TableCell>{item.keterangan || "-"}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-semibold">
                      Total Keseluruhan
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      Rp {totalKeseluruhan.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell colSpan={2}></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Keterangan */}
        {penerimaan.keterangan && (
          <Card>
            <CardHeader>
              <CardTitle>Keterangan</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{penerimaan.keterangan}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PengirimanProductWizard } from "@/components/dashboard/pt-pks/pengiriman-product/pengiriman-wizard";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { Plus, FileText, Trash2, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type PengirimanProduct = {
  id: string;
  nomorPengiriman: string;
  tanggalPengiriman: string;
  buyer: {
    name: string;
    code: string;
  };
  contract: {
    contractNumber: string;
  };
  contractItem: {
    material: {
      name: string;
      satuan: {
        symbol: string;
      };
    };
  };
  vendorVehicle: {
    nomorKendaraan: string;
    namaSupir: string;
    vendor: {
      name: string;
    };
  };
  beratTarra: number;
  beratGross: number;
  beratNetto: number;
  noSegel: string;
  ffa: number;
  air: number;
  kotoran: number;
  status: string;
  operatorPenimbang: string;
};

export default function PengirimanProductPage() {
  const [showWizard, setShowWizard] = useState(false);
  const [pengirimanList, setPengirimanList] = useState<PengirimanProduct[]>([]);
  const [selectedPengiriman, setSelectedPengiriman] = useState<PengirimanProduct | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!showWizard) {
      fetchPengiriman();
    }
  }, [showWizard]);

  const fetchPengiriman = async () => {
    try {
      const res = await fetch("/api/pt-pks/pengiriman-product");
      if (res.ok) {
        const data = await res.json();
        setPengirimanList(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch pengiriman:", res.statusText);
        setPengirimanList([]);
      }
    } catch (error) {
      console.error("Error fetching pengiriman:", error);
      setPengirimanList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/pt-pks/pengiriman-product?id=${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Pengiriman berhasil dihapus");
        fetchPengiriman();
      } else {
        const data = await res.json();
        alert(`Gagal menghapus: ${data.error}`);
      }
    } catch (error) {
      console.error("Error deleting pengiriman:", error);
      alert("Terjadi kesalahan saat menghapus data");
    } finally {
      setDeleteId(null);
    }
  };

  const handleViewDetail = (pengiriman: PengirimanProduct) => {
    setSelectedPengiriman(pengiriman);
    setShowDetail(true);
  };

  const handlePrintSuratPengantar = (pengiriman: PengirimanProduct) => {
    // Open PDF in new window
    window.open(`/api/pt-pks/pengiriman-product/surat-pengantar?id=${pengiriman.id}`, "_blank");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <Badge className="bg-green-500">Selesai</Badge>;
      case "DRAFT":
        return <Badge variant="secondary">Draft</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">Dibatalkan</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (showWizard) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Tambah Pengiriman Product</h1>
          <Button variant="outline" onClick={() => setShowWizard(false)}>
            Kembali ke Daftar
          </Button>
        </div>
        <PengirimanProductWizard />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pengiriman Product</h1>
          <p className="text-muted-foreground">Kelola pengiriman product ke buyer</p>
        </div>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pengiriman
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengiriman Product</CardTitle>
          <CardDescription>
            Daftar semua pengiriman product yang telah dilakukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : pengirimanList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada data pengiriman product
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No. Pengiriman</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Kendaraan</TableHead>
                    <TableHead className="text-right">Berat Netto</TableHead>
                    <TableHead>No. Segel</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pengirimanList.map((pengiriman) => (
                    <TableRow key={pengiriman.id}>
                      <TableCell className="font-medium">
                        {pengiriman.nomorPengiriman}
                      </TableCell>
                      <TableCell>
                        {format(new Date(pengiriman.tanggalPengiriman), "dd MMM yyyy", {
                          locale: idLocale,
                        })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{pengiriman.buyer.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {pengiriman.contract.contractNumber}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{pengiriman.contractItem.material.name}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{pengiriman.vendorVehicle.vendor.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {pengiriman.vendorVehicle.namaSupir}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{pengiriman.vendorVehicle.nomorKendaraan}</TableCell>
                      <TableCell className="text-right">
                        {pengiriman.beratNetto.toLocaleString("id-ID")} {pengiriman.contractItem.material.satuan.symbol}
                      </TableCell>
                      <TableCell>{pengiriman.noSegel}</TableCell>
                      <TableCell>{getStatusBadge(pengiriman.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetail(pengiriman)}
                            title="Lihat Detail"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintSuratPengantar(pengiriman)}
                            title="Cetak Surat Pengantar"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {pengiriman.status === "DRAFT" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteId(pengiriman.id)}
                              title="Hapus"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Pengiriman Product</DialogTitle>
            <DialogDescription>
              {selectedPengiriman?.nomorPengiriman}
            </DialogDescription>
          </DialogHeader>
          
          {selectedPengiriman && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">Informasi Pengiriman</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Nomor:</strong> {selectedPengiriman.nomorPengiriman}</p>
                    <p><strong>Tanggal:</strong> {format(new Date(selectedPengiriman.tanggalPengiriman), "dd MMMM yyyy", { locale: idLocale })}</p>
                    <p><strong>Operator:</strong> {selectedPengiriman.operatorPenimbang}</p>
                    <p><strong>Status:</strong> {getStatusBadge(selectedPengiriman.status)}</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Buyer & Kontrak</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Buyer:</strong> {selectedPengiriman.buyer.name}</p>
                    <p><strong>Kode:</strong> {selectedPengiriman.buyer.code}</p>
                    <p><strong>No. Kontrak:</strong> {selectedPengiriman.contract.contractNumber}</p>
                    <p><strong>Product:</strong> {selectedPengiriman.contractItem.material.name}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Vendor & Kendaraan</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Vendor:</strong> {selectedPengiriman.vendorVehicle.vendor.name}</p>
                    <p><strong>Supir:</strong> {selectedPengiriman.vendorVehicle.namaSupir}</p>
                  </div>
                  <div>
                    <p><strong>Kendaraan:</strong> {selectedPengiriman.vendorVehicle.nomorKendaraan}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Penimbangan</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Berat Tarra</p>
                    <p className="font-medium">{selectedPengiriman.beratTarra.toLocaleString("id-ID")} Kg</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Berat Gross</p>
                    <p className="font-medium">{selectedPengiriman.beratGross.toLocaleString("id-ID")} Kg</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Berat Netto</p>
                    <p className="font-bold text-primary">{selectedPengiriman.beratNetto.toLocaleString("id-ID")} Kg</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">Mutu Kernel</h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">FFA</p>
                    <p className="font-medium">{selectedPengiriman.ffa}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kadar Air</p>
                    <p className="font-medium">{selectedPengiriman.air}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kadar Kotoran</p>
                    <p className="font-medium">{selectedPengiriman.kotoran}%</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold mb-2">No. Segel</h4>
                <p className="text-lg font-mono font-bold">{selectedPengiriman.noSegel}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pengiriman ini? 
              Aksi ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && handleDelete(deleteId)}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

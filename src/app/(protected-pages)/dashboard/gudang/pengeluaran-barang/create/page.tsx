"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Package, CheckCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StoreRequest {
  id: string;
  nomorSR: string;
  tanggalRequest: string;
  divisi: string;
  requestedBy: string;
  approvedBy: string;
  tanggalApproval: string;
  keterangan?: string;
  items: Array<{
    id: string;
    materialId: string;
    jumlahRequest: number;
    keterangan?: string;
    material: {
      partNumber: string;
      namaMaterial: string;
      stockOnHand: number;
      hargaSatuan: number;
      satuanMaterial: {
        name: string;
        symbol: string;
      };
    };
  }>;
}

export default function CreatePengeluaranBarangPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [storeRequests, setStoreRequests] = useState<StoreRequest[]>([]);
  const [selectedSR, setSelectedSR] = useState<StoreRequest | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    issuedBy: "",
    receivedByDivisi: "",
    keterangan: "",
  });

  useEffect(() => {
    fetchApprovedSR();
  }, []);

  const fetchApprovedSR = async () => {
    try {
      const response = await fetch("/api/pt-pks/gudang/store-request?status=APPROVED");
      if (response.ok) {
        const data = await response.json();
        setStoreRequests(data);
      }
    } catch (error) {
      console.error("Error fetching store requests:", error);
      toast.error("Gagal memuat data Store Request");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSR = (sr: StoreRequest) => {
    setSelectedSR(sr);
    setShowDialog(true);
    setFormData({
      issuedBy: "",
      receivedByDivisi: sr.requestedBy,
      keterangan: "",
    });
  };

  const checkStockAvailability = (sr: StoreRequest) => {
    const insufficientStock = sr.items.filter(
      item => item.material.stockOnHand < item.jumlahRequest
    );
    return {
      isAvailable: insufficientStock.length === 0,
      insufficientItems: insufficientStock,
    };
  };

  const handleKonfirmasiPengeluaran = async () => {
    if (!selectedSR) return;

    if (!formData.issuedBy.trim()) {
      toast.error("Nama penerbit wajib diisi");
      return;
    }

    // Check if any material has no price
    const itemsWithoutPrice = selectedSR.items.filter(
      item => !item.material.hargaSatuan || item.material.hargaSatuan === 0
    );
    
    if (itemsWithoutPrice.length > 0) {
      toast.error(
        `Material berikut belum memiliki harga satuan: ${itemsWithoutPrice.map(item => item.material.namaMaterial).join(", ")}`,
        {
          description: "Silakan update harga satuan di master material terlebih dahulu"
        }
      );
      return;
    }

    const stockCheck = checkStockAvailability(selectedSR);
    if (!stockCheck.isAvailable) {
      toast.error(
        `Stock tidak mencukupi untuk: ${stockCheck.insufficientItems.map(item => item.material.namaMaterial).join(", ")}`
      );
      return;
    }

    setProcessing(true);
    try {
      const payload = {
        storeRequestId: selectedSR.id,
        divisi: selectedSR.divisi,
        requestedBy: selectedSR.requestedBy,
        issuedBy: formData.issuedBy,
        receivedByDivisi: formData.receivedByDivisi,
        keterangan: formData.keterangan,
        items: selectedSR.items.map((item) => ({
          materialId: item.materialId,
          jumlahKeluar: item.jumlahRequest,
          hargaSatuan: item.material.hargaSatuan || 0,
          keterangan: item.keterangan,
        })),
      };

      const response = await fetch("/api/pt-pks/gudang/pengeluaran-barang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Gagal memproses pengeluaran barang");
      }

      const result = await response.json();
      toast.success("Pengeluaran barang berhasil diproses", {
        description: `Nomor: ${result.nomorPengeluaran}`,
      });

      setShowDialog(false);
      
      // Always redirect to list and force refresh
      router.push("/dashboard/gudang/pengeluaran-barang");
      
      // Force page reload to ensure fresh data
      setTimeout(() => {
        window.location.href = "/dashboard/gudang/pengeluaran-barang";
      }, 100);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      toast.error("Gagal memproses pengeluaran", {
        description: message,
      });
    } finally {
      setProcessing(false);
    }
  };

  const getTotalBiaya = (sr: StoreRequest) => {
    return sr.items.reduce(
      (sum, item) => sum + item.jumlahRequest * item.material.hargaSatuan,
      0
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pengeluaran Barang</h1>
          <p className="text-muted-foreground">
            Pilih Store Request yang sudah approved untuk dikeluarkan
          </p>
        </div>
      </div>

      {storeRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-2">Tidak Ada SR yang Siap Dikeluarkan</p>
            <p className="text-sm text-muted-foreground">
              Belum ada Store Request dengan status APPROVED
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Store Request yang Sudah Disetujui</CardTitle>
            <CardDescription>
              Klik tombol "Keluarkan Barang" untuk memproses pengeluaran
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {storeRequests.map((sr) => {
                const stockCheck = checkStockAvailability(sr);
                const totalBiaya = getTotalBiaya(sr);

                return (
                  <Card key={sr.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/50">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg">{sr.nomorSR}</CardTitle>
                            <Badge variant="default">APPROVED</Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p>Divisi: <span className="font-medium">{sr.divisi}</span></p>
                            <p>Diminta oleh: <span className="font-medium">{sr.requestedBy}</span></p>
                            <p>Disetujui oleh: <span className="font-medium">{sr.approvedBy}</span> pada {new Date(sr.tanggalApproval).toLocaleString("id-ID")}</p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleSelectSR(sr)}
                          disabled={!stockCheck.isAvailable || sr.items.some(item => !item.material.hargaSatuan || item.material.hargaSatuan === 0)}
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Keluarkan Barang
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Item yang Diminta:</div>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Part Number</TableHead>
                              <TableHead>Material</TableHead>
                              <TableHead className="text-right">Jumlah</TableHead>
                              <TableHead className="text-right">Stock</TableHead>
                              <TableHead className="text-right">Harga Satuan</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sr.items.map((item) => {
                              const isAvailable = item.material.stockOnHand >= item.jumlahRequest;
                              const hargaSatuan = item.material.hargaSatuan || 0;
                              const totalItem = item.jumlahRequest * hargaSatuan;
                              const hasPrice = hargaSatuan > 0;

                              return (
                                <TableRow key={item.id}>
                                  <TableCell className="font-mono text-sm">
                                    {item.material.partNumber}
                                  </TableCell>
                                  <TableCell>{item.material.namaMaterial}</TableCell>
                                  <TableCell className="text-right font-medium">
                                    {item.jumlahRequest.toLocaleString("id-ID")} {item.material.satuanMaterial.symbol}
                                  </TableCell>
                                  <TableCell className={`text-right ${isAvailable ? "text-green-600" : "text-red-600"}`}>
                                    {item.material.stockOnHand.toLocaleString("id-ID")} {item.material.satuanMaterial.symbol}
                                  </TableCell>
                                  <TableCell className={`text-right ${!hasPrice ? "text-red-600 font-medium" : ""}`}>
                                    Rp {hargaSatuan.toLocaleString("id-ID")}
                                    {!hasPrice && <span className="ml-1 text-xs">(Belum diisi)</span>}
                                  </TableCell>
                                  <TableCell className={`text-right font-medium ${!hasPrice ? "text-red-600" : ""}`}>
                                    Rp {totalItem.toLocaleString("id-ID")}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {isAvailable ? (
                                      <Badge variant="default" className="gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Tersedia
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive" className="gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Kurang
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                            <TableRow className="font-bold bg-muted/50">
                              <TableCell colSpan={5} className="text-right">
                                Total Biaya:
                              </TableCell>
                              <TableCell className="text-right">
                                Rp {totalBiaya.toLocaleString("id-ID")}
                              </TableCell>
                              <TableCell></TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>

                        {sr.items.some(item => !item.material.hargaSatuan || item.material.hargaSatuan === 0) && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mt-3">
                            <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Material berikut belum memiliki harga satuan:
                            </p>
                            <ul className="text-sm text-amber-700 mt-2 ml-6 space-y-1">
                              {sr.items
                                .filter(item => !item.material.hargaSatuan || item.material.hargaSatuan === 0)
                                .map((item) => (
                                  <li key={item.id}>
                                    {item.material.namaMaterial} ({item.material.partNumber})
                                  </li>
                                ))}
                            </ul>
                            <p className="text-xs text-amber-600 mt-2">
                              Silakan update harga satuan di menu <strong>Inventaris</strong> terlebih dahulu sebelum mengeluarkan barang.
                            </p>
                          </div>
                        )}

                        {!stockCheck.isAvailable && (
                          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                            <p className="text-sm font-medium text-destructive flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              Stock tidak mencukupi untuk material berikut:
                            </p>
                            <ul className="text-sm text-destructive/80 mt-2 ml-6 space-y-1">
                              {stockCheck.insufficientItems.map((item) => (
                                <li key={item.id}>
                                  {item.material.namaMaterial} - Diminta: {item.jumlahRequest}, Tersedia: {item.material.stockOnHand}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Konfirmasi Pengeluaran Barang</DialogTitle>
            <DialogDescription>
              {selectedSR && `Store Request: ${selectedSR.nomorSR} - ${selectedSR.divisi}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="issuedBy">
                  Diterbitkan Oleh <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="issuedBy"
                  placeholder="Nama petugas gudang"
                  value={formData.issuedBy}
                  onChange={(e) =>
                    setFormData({ ...formData, issuedBy: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="receivedByDivisi">Diterima Oleh (Divisi)</Label>
                <Input
                  id="receivedByDivisi"
                  placeholder="Nama penerima dari divisi"
                  value={formData.receivedByDivisi}
                  onChange={(e) =>
                    setFormData({ ...formData, receivedByDivisi: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                placeholder="Catatan tambahan..."
                value={formData.keterangan}
                onChange={(e) =>
                  setFormData({ ...formData, keterangan: e.target.value })
                }
              />
            </div>

            {selectedSR && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Ringkasan:</p>
                <div className="text-sm space-y-1">
                  <p>Total Item: <span className="font-medium">{selectedSR.items.length} jenis material</span></p>
                  <p>Total Biaya: <span className="font-medium text-lg">Rp {getTotalBiaya(selectedSR).toLocaleString("id-ID")}</span></p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={processing}
            >
              Batal
            </Button>
            <Button
              onClick={handleKonfirmasiPengeluaran}
              disabled={processing}
            >
              {processing ? "Memproses..." : "Konfirmasi Pengeluaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

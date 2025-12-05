"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface PurchaseOrder {
  id: string;
  nomorPO: string;
  namaSupplier: string;
  items: Array<{
    id: string;
    jumlahOrder: number;
    jumlahDiterima: number;
    material: {
      id: string;
      partNumber: string;
      namaMaterial: string;
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
}

interface PenerimaanItem {
  purchaseOrderItemId: string;
  jumlahDiterima: number;
  kondisi: string;
  keterangan?: string;
}

export function PenerimaanBarangForm({ onSuccess }: { onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const [formData, setFormData] = useState({
    purchaseOrderId: "",
    tanggalPenerimaan: new Date().toISOString().split("T")[0],
    receivedBy: "",
    nomorSuratJalan: "",
    keterangan: "",
  });

  const [items, setItems] = useState<PenerimaanItem[]>([]);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const response = await fetch("/api/pt-pks/gudang/purchase-order?status=SENT");
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data);
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
    }
  };

  const handlePOChange = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    setSelectedPO(po || null);
    setFormData({ ...formData, purchaseOrderId: poId });

    if (po) {
      // Initialize items from PO items
      const initialItems = po.items.map((item) => ({
        purchaseOrderItemId: item.id,
        jumlahDiterima: item.jumlahOrder - item.jumlahDiterima,
        kondisi: "BAIK",
        keterangan: "",
      }));
      setItems(initialItems);
    } else {
      setItems([]);
    }
  };

  const updateItem = (index: number, field: keyof PenerimaanItem, value: any) => {
    const newItems = [...items];
    const {
      purchaseOrderItemId = "",
      jumlahDiterima = 0,
      kondisi = "",
      keterangan = "",
      ...rest
    } = newItems[index] || {};
    newItems[index] = {
      purchaseOrderItemId,
      jumlahDiterima,
      kondisi,
      keterangan,
      ...rest,
      [field]: (field === "purchaseOrderItemId" || field === "kondisi" || field === "keterangan") ? (typeof value === "undefined" ? "" : value) : (field === "jumlahDiterima" ? (typeof value === "number" ? value : 0) : value),
    };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.purchaseOrderId || !formData.receivedBy) {
      toast.error("PO dan Penerima wajib diisi");
      return;
    }

    if (items.length === 0 || items.some((item) => item.jumlahDiterima <= 0)) {
      toast.error("Jumlah diterima harus lebih dari 0 untuk semua item");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/pt-pks/gudang/penerimaan-barang", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: items.map((item) => ({
            purchaseOrderItemId: item.purchaseOrderItemId,
            jumlahDiterima: Number(item.jumlahDiterima),
            kondisi: item.kondisi,
            keterangan: item.keterangan || undefined,
          })),
        }),
      });

      if (response.ok) {
        toast.success("Penerimaan Barang berhasil dibuat");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal membuat Penerimaan Barang");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Terima Barang Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="purchaseOrderId">Purchase Order *</Label>
              <Select
                value={formData.purchaseOrderId}
                onValueChange={handlePOChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih PO" />
                </SelectTrigger>
                <SelectContent>
                  {purchaseOrders.map((po) => (
                    <SelectItem key={po.id} value={po.id}>
                      {po.nomorPO} - {po.namaSupplier}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tanggalPenerimaan">Tanggal Penerimaan *</Label>
              <Input
                id="tanggalPenerimaan"
                type="date"
                value={formData.tanggalPenerimaan}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalPenerimaan: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receivedBy">Penerima *</Label>
              <Input
                id="receivedBy"
                value={formData.receivedBy}
                onChange={(e) =>
                  setFormData({ ...formData, receivedBy: e.target.value })
                }
                placeholder="Nama penerima"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nomorSuratJalan">Nomor Surat Jalan</Label>
              <Input
                id="nomorSuratJalan"
                value={formData.nomorSuratJalan}
                onChange={(e) =>
                  setFormData({ ...formData, nomorSuratJalan: e.target.value })
                }
                placeholder="No. surat jalan"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="keterangan">Keterangan</Label>
              <Textarea
                id="keterangan"
                value={formData.keterangan}
                onChange={(e) =>
                  setFormData({ ...formData, keterangan: e.target.value })
                }
                placeholder="Keterangan tambahan"
              />
            </div>
          </div>

          {/* Items Section */}
          {selectedPO && items.length > 0 && (
            <div className="space-y-4">
              <Label className="text-lg font-semibold">Daftar Material</Label>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Part Number</TableHead>
                      <TableHead>Nama Material</TableHead>
                      <TableHead className="text-right">Jumlah Order</TableHead>
                      <TableHead className="text-right">Sudah Diterima</TableHead>
                      <TableHead className="text-right">Sisa</TableHead>
                      <TableHead className="w-[120px]">Jumlah Terima</TableHead>
                      <TableHead>Kondisi</TableHead>
                      <TableHead>Keterangan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => {
                      const poItem = selectedPO.items.find(
                        (i) => i.id === item.purchaseOrderItemId
                      );
                      if (!poItem) return null;

                      const sisa = poItem.jumlahOrder - poItem.jumlahDiterima;

                      return (
                        <TableRow key={item.purchaseOrderItemId}>
                          <TableCell className="font-medium">
                            {poItem.material.partNumber}
                          </TableCell>
                          <TableCell>{poItem.material.namaMaterial}</TableCell>
                          <TableCell className="text-right">
                            {poItem.jumlahOrder} {poItem.material.satuanMaterial.symbol}
                          </TableCell>
                          <TableCell className="text-right">
                            {poItem.jumlahDiterima} {poItem.material.satuanMaterial.symbol}
                          </TableCell>
                          <TableCell className="text-right">
                            {sisa} {poItem.material.satuanMaterial.symbol}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.jumlahDiterima}
                              onChange={(e) =>
                                updateItem(
                                  index,
                                  "jumlahDiterima",
                                  Number(e.target.value)
                                )
                              }
                              min="0"
                              max={sisa}
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={item.kondisi}
                              onValueChange={(value) =>
                                updateItem(index, "kondisi", value)
                              }
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="BAIK">Baik</SelectItem>
                                <SelectItem value="RUSAK">Rusak</SelectItem>
                                <SelectItem value="KURANG_LENGKAP">
                                  Kurang Lengkap
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.keterangan || ""}
                              onChange={(e) =>
                                updateItem(index, "keterangan", e.target.value)
                              }
                              placeholder="Keterangan"
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={loading || !selectedPO}>
              {loading ? "Menyimpan..." : "Simpan Penerimaan"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

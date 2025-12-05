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

interface Material {
  id: string;
  partNumber: string;
  namaMaterial: string;
  stockOnHand: number;
  satuanMaterial: {
    symbol: string;
  };
}

interface PRItem {
  materialId: string;
  jumlahRequest: number;
  estimasiHarga: number;
  keterangan?: string;
}

export function PurchaseRequestForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);

  const [formData, setFormData] = useState({
    tanggalRequest: new Date().toISOString().split("T")[0],
    divisi: "",
    requestedBy: "",
    keterangan: "",
  });

  const [items, setItems] = useState<PRItem[]>([
    {
      materialId: "",
      jumlahRequest: 0,
      estimasiHarga: 0,
      keterangan: "",
    },
  ]);

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/pt-pks/gudang/material-inventaris");
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        materialId: "",
        jumlahRequest: 0,
        estimasiHarga: 0,
        keterangan: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PRItem, value: any) => {
    const newItems = [...items];
    const {
      materialId = "",
      jumlahRequest = 0,
      estimasiHarga = 0,
      keterangan = "",
      ...rest
    } = newItems[index] || {};
    newItems[index] = {
      materialId,
      jumlahRequest,
      estimasiHarga,
      keterangan,
      ...rest,
      [field]: (field === "materialId" || field === "keterangan") ? (typeof value === "undefined" ? "" : value) : (field === "jumlahRequest" || field === "estimasiHarga" ? (typeof value === "number" ? value : 0) : value),
    };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.divisi || !formData.requestedBy) {
      toast.error("Divisi dan Pemohon wajib diisi");
      return;
    }

    if (items.length === 0 || items.some((item) => !item.materialId)) {
      toast.error("Minimal 1 item material harus diisi");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/pt-pks/gudang/purchase-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: items.map((item) => ({
            materialId: item.materialId,
            jumlahRequest: Number(item.jumlahRequest),
            estimasiHarga: Number(item.estimasiHarga),
            keterangan: item.keterangan || undefined,
          })),
        }),
      });

      if (response.ok) {
        toast.success("Purchase Request berhasil dibuat");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal membuat Purchase Request");
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
        <CardTitle>Buat Purchase Request Baru</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Header Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="tanggalRequest">Tanggal Request *</Label>
              <Input
                id="tanggalRequest"
                type="date"
                value={formData.tanggalRequest}
                onChange={(e) =>
                  setFormData({ ...formData, tanggalRequest: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="divisi">Divisi *</Label>
              <Input
                id="divisi"
                value={formData.divisi}
                onChange={(e) =>
                  setFormData({ ...formData, divisi: e.target.value })
                }
                placeholder="Contoh: Produksi"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestedBy">Pemohon *</Label>
              <Input
                id="requestedBy"
                value={formData.requestedBy}
                onChange={(e) =>
                  setFormData({ ...formData, requestedBy: e.target.value })
                }
                placeholder="Nama pemohon"
                required
              />
            </div>
            <div className="space-y-2">
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
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold">Daftar Material</Label>
              <Button type="button" variant="outline" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Item
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px]">Material</TableHead>
                    <TableHead className="w-[120px]">Jumlah</TableHead>
                    <TableHead className="w-[150px]">Estimasi Harga</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead className="w-[80px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => {
                    const selectedMaterial = materials.find(
                      (m) => m.id === item.materialId
                    );
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Select
                            value={item.materialId}
                            onValueChange={(value) =>
                              updateItem(index, "materialId", value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih material" />
                            </SelectTrigger>
                            <SelectContent>
                              {materials.map((material) => (
                                <SelectItem key={material.id} value={material.id}>
                                  {material.partNumber} - {material.namaMaterial}
                                  <span className="text-xs text-muted-foreground ml-2">
                                    (Stock: {material.stockOnHand} {material.satuanMaterial.symbol})
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.jumlahRequest}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "jumlahRequest",
                                Number(e.target.value)
                              )
                            }
                            min="0"
                            step="0.01"
                          />
                          {selectedMaterial && (
                            <span className="text-xs text-muted-foreground">
                              {selectedMaterial.satuanMaterial.symbol}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={item.estimasiHarga}
                            onChange={(e) =>
                              updateItem(
                                index,
                                "estimasiHarga",
                                Number(e.target.value)
                              )
                            }
                            min="0"
                            step="0.01"
                          />
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
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            disabled={items.length === 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan PR"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

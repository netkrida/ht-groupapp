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
import { Plus, Trash2, ArrowLeft } from "lucide-react";
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

interface SRItem {
  materialId: string;
  jumlahRequest: number;
  keterangan?: string;
}

interface StoreRequestFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function StoreRequestForm({ onSuccess, onCancel }: StoreRequestFormProps) {
  const [loading, setLoading] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);
  
  const [formData, setFormData] = useState({
    divisi: "",
    requestedBy: "",
    keterangan: "",
  });

  const [items, setItems] = useState<SRItem[]>([
    { materialId: "", jumlahRequest: 0, keterangan: "" },
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
    setItems([...items, { materialId: "", jumlahRequest: 0, keterangan: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof SRItem, value: any) => {
    const newItems = [...items];
    const {
      materialId = "",
      jumlahRequest = 0,
      keterangan = "",
      ...rest
    } = newItems[index] || {};
    newItems[index] = {
      materialId,
      jumlahRequest,
      keterangan,
      ...rest,
      [field]: (field === "materialId" || field === "keterangan") ? (typeof value === "undefined" ? "" : value) : (field === "jumlahRequest" ? (typeof value === "number" ? value : 0) : value),
    };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.divisi || !formData.requestedBy) {
      toast.error("Divisi dan Pemohon wajib diisi");
      return;
    }

    const validItems = items.filter(
      (item) => item.materialId && item.jumlahRequest > 0
    );

    if (validItems.length === 0) {
      toast.error("Minimal harus ada 1 item material");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/pt-pks/gudang/store-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          items: validItems,
        }),
      });

      if (response.ok) {
        toast.success("Store Request berhasil dibuat");
        onSuccess();
      } else {
        const error = await response.json();
        toast.error(error.error || "Gagal membuat Store Request");
      }
    } catch (error) {
      toast.error("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Buat Store Request Baru</CardTitle>
            <Button type="button" variant="ghost" onClick={onCancel}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Header */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="divisi">Divisi *</Label>
              <Input
                id="divisi"
                value={formData.divisi}
                onChange={(e) =>
                  setFormData({ ...formData, divisi: e.target.value })
                }
                placeholder="Contoh: Produksi, Maintenance, dll"
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan</Label>
            <Textarea
              id="keterangan"
              value={formData.keterangan}
              onChange={(e) =>
                setFormData({ ...formData, keterangan: e.target.value })
              }
              placeholder="Keterangan tambahan (optional)"
              rows={3}
            />
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Daftar Material *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Item
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Material</TableHead>
                    <TableHead className="w-[15%]">Jumlah</TableHead>
                    <TableHead className="w-[30%]">Keterangan</TableHead>
                    <TableHead className="w-[15%]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
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
                                {material.partNumber} - {material.namaMaterial} (Stock:{" "}
                                {material.stockOnHand} {material.satuanMaterial.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.jumlahRequest || ""}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "jumlahRequest",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="0"
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
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan SR"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

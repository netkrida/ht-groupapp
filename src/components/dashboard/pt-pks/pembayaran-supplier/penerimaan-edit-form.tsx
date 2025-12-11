"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Save } from "lucide-react";

type PenerimaanData = {
  id: string;
  nomorPenerimaan: string;
  tanggalTerima: string;
  operatorPenimbang: string;
  lokasiKebun?: string | null;
  jenisBuah?: string | null;
  beratBruto: number;
  beratTarra: number;
  beratNetto1: number;
  potonganPersen: number;
  potonganKg: number;
  beratNetto2: number;
  hargaPerKg: number;
  totalBayar: number;
  upahBongkar: number;
  totalUpahBongkar: number;
  status: string;
  supplier: {
    id: string;
    ownerName: string;
    type: string;
    bankName?: string | null;
    accountNumber?: string | null;
  };
  material: {
    name: string;
    satuan: {
      symbol: string;
    };
  };
  transporter: {
    nomorKendaraan: string;
    namaSupir: string;
  };
};

type Props = {
  data: PenerimaanData;
  onCancel: () => void;
  onSuccess: () => void;
};

export function PenerimaanEditForm({ data, onCancel, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    lokasiKebun: data.lokasiKebun || "",
    jenisBuah: data.jenisBuah || "",
    beratBruto: data.beratBruto,
    beratTarra: data.beratTarra,
    potonganPersen: data.potonganPersen,
    hargaPerKg: data.hargaPerKg,
    upahBongkar: data.upahBongkar || 16,
  });

  const beratNetto1 = formData.beratBruto - formData.beratTarra;
  const potonganKg = (beratNetto1 * formData.potonganPersen) / 100;
  const beratNetto2 = beratNetto1 - potonganKg;
  const totalBayar = beratNetto2 * formData.hargaPerKg;
  const totalUpahBongkar = beratNetto2 * formData.upahBongkar;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData = {
        id: data.id,
        lokasiKebun: formData.lokasiKebun || null,
        jenisBuah: formData.jenisBuah || null,
        beratBruto: formData.beratBruto,
        beratTarra: formData.beratTarra,
        potonganPersen: formData.potonganPersen,
        hargaPerKg: formData.hargaPerKg,
        upahBongkar: formData.upahBongkar,
      };

      const res = await fetch("/api/pt-pks/penerimaan-tbs", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (res.ok) {
        alert("Data berhasil diperbarui!");
        onSuccess();
      } else {
        const error = await res.json();
        alert(`Gagal memperbarui data: ${error.error}`);
      }
    } catch (error) {
      console.error("Error updating penerimaan:", error);
      alert("Terjadi kesalahan saat memperbarui data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={onCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Batal
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Edit Penerimaan TBS - {data.nomorPenerimaan}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Info yang tidak bisa diedit */}
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Supplier</div>
                  <div className="font-medium">{data.supplier.ownerName}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Material</div>
                  <div className="font-medium">{data.material.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Kendaraan</div>
                  <div className="font-medium">{data.transporter.nomorKendaraan}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Tanggal Terima</div>
                  <div className="font-medium">
                    {new Date(data.tanggalTerima).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Informasi Kebun */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informasi Kebun</h3>
              
              <div className="space-y-2">
                <Label htmlFor="lokasiKebun">Lokasi Kebun (Opsional)</Label>
                <Input
                  id="lokasiKebun"
                  placeholder="Contoh: Kebun Blok A, Desa Suka Maju"
                  value={formData.lokasiKebun}
                  onChange={(e) =>
                    setFormData({ ...formData, lokasiKebun: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Jenis Buah (Opsional)</Label>
                <RadioGroup
                  value={formData.jenisBuah}
                  onValueChange={(value) =>
                    setFormData({ ...formData, jenisBuah: value })
                  }
                >
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="TBS-BB" id="edit-tbs-bb" />
                      <Label htmlFor="edit-tbs-bb" className="font-normal cursor-pointer flex-1">
                        <div className="font-medium">Buah Besar</div>
                        <div className="text-xs text-muted-foreground">TBS-BB</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="TBS-BS" id="edit-tbs-bs" />
                      <Label htmlFor="edit-tbs-bs" className="font-normal cursor-pointer flex-1">
                        <div className="font-medium">Buah Biasa</div>
                        <div className="text-xs text-muted-foreground">TBS-BS</div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="TBS-BK" id="edit-tbs-bk" />
                      <Label htmlFor="edit-tbs-bk" className="font-normal cursor-pointer flex-1">
                        <div className="font-medium">Buah Kecil</div>
                        <div className="text-xs text-muted-foreground">TBS-BK</div>
                      </Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Data Timbangan */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Data Timbangan</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="beratBruto">Berat Bruto (kg) *</Label>
                  <Input
                    id="beratBruto"
                    type="number"
                    step="0.01"
                    required
                    value={formData.beratBruto}
                    onChange={(e) =>
                      setFormData({ ...formData, beratBruto: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="beratTarra">Berat Tarra (kg) *</Label>
                  <Input
                    id="beratTarra"
                    type="number"
                    step="0.01"
                    required
                    value={formData.beratTarra}
                    onChange={(e) =>
                      setFormData({ ...formData, beratTarra: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="potonganPersen">Potongan (%) *</Label>
                  <Input
                    id="potonganPersen"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={formData.potonganPersen}
                    onChange={(e) =>
                      setFormData({ ...formData, potonganPersen: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hargaPerKg">Harga per Kg (Rp) *</Label>
                  <Input
                    id="hargaPerKg"
                    type="number"
                    step="1"
                    min="0"
                    required
                    value={formData.hargaPerKg}
                    onChange={(e) =>
                      setFormData({ ...formData, hargaPerKg: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="upahBongkar">Upah Bongkar per Kg (Rp)</Label>
                  <Input
                    id="upahBongkar"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.upahBongkar}
                    onChange={(e) =>
                      setFormData({ ...formData, upahBongkar: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Kalkulasi Otomatis */}
            <div className="space-y-4 bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold text-lg">Kalkulasi Otomatis</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Berat Netto 1</div>
                  <div className="font-bold text-blue-600">
                    {beratNetto1.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg
                  </div>
                  <div className="text-xs text-muted-foreground">Bruto - Tarra</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Potongan (kg)</div>
                  <div className="font-bold text-orange-600">
                    {potonganKg.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg
                  </div>
                  <div className="text-xs text-muted-foreground">{formData.potonganPersen}%</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Berat Netto 2</div>
                  <div className="font-bold text-green-600 text-lg">
                    {beratNetto2.toLocaleString("id-ID", { minimumFractionDigits: 2 })} kg
                  </div>
                  <div className="text-xs text-muted-foreground">Netto 1 - Potongan</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Bayar</div>
                  <div className="font-bold text-green-700 text-lg">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(totalBayar)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Total Upah Bongkar</div>
                  <div className="font-bold text-orange-600 text-lg">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(totalUpahBongkar)}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
                Batal
              </Button>
              <Button type="submit" disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

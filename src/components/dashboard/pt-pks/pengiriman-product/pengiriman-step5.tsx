"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import type { PengirimanFormData } from "./pengiriman-wizard";

type Step5Props = {
  data: Partial<PengirimanFormData>;
  onUpdate: (data: Partial<PengirimanFormData>) => void;
  onSubmit: (finalData?: Partial<PengirimanFormData>) => void;
  onBack: () => void;
  loading: boolean;
};

export function PengirimanStep5({ data, onUpdate, onSubmit, onBack, loading }: Step5Props) {
  const [formData, setFormData] = useState({
    ffa: data.ffa || 0,
    air: data.air || 0,
    kotoran: data.kotoran || 0,
  });

  const beratNetto = (data.beratGross || 0) - (data.beratTarra || 0);

  const handleSubmit = () => {
    if (formData.ffa < 0 || formData.ffa > 100) {
      alert("FFA harus antara 0-100%");
      return;
    }
    if (formData.air < 0 || formData.air > 100) {
      alert("Kadar air harus antara 0-100%");
      return;
    }
    if (formData.kotoran < 0 || formData.kotoran > 100) {
      alert("Kadar kotoran harus antara 0-100%");
      return;
    }

    // Pass data mutu langsung ke onSubmit
    onSubmit({
      ffa: formData.ffa,
      air: formData.air,
      kotoran: formData.kotoran,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-900 mb-2">📊 Informasi Mutu Kernel</h3>
        <p className="text-sm text-amber-800">
          Isi data mutu kernel untuk menentukan kualitas product yang dikirim.
          Data ini akan tercatat dalam surat pengantar.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Data Mutu Kernel</h3>
        
        <div className="space-y-2">
          <Label htmlFor="ffa">FFA (Free Fatty Acid) *</Label>
          <div className="flex gap-2">
            <Input
              id="ffa"
              type="number"
              placeholder="0"
              value={formData.ffa || ""}
              onChange={(e) =>
                setFormData({ ...formData, ffa: parseFloat(e.target.value) || 0 })
              }
              step="0.01"
              min="0"
              max="100"
            />
            <div className="flex items-center px-4 border rounded-md bg-muted">
              <span className="text-sm font-medium">%</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="air">Kadar Air *</Label>
          <div className="flex gap-2">
            <Input
              id="air"
              type="number"
              placeholder="0"
              value={formData.air || ""}
              onChange={(e) =>
                setFormData({ ...formData, air: parseFloat(e.target.value) || 0 })
              }
              step="0.01"
              min="0"
              max="100"
            />
            <div className="flex items-center px-4 border rounded-md bg-muted">
              <span className="text-sm font-medium">%</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="kotoran">Kadar Kotoran *</Label>
          <div className="flex gap-2">
            <Input
              id="kotoran"
              type="number"
              placeholder="0"
              value={formData.kotoran || ""}
              onChange={(e) =>
                setFormData({ ...formData, kotoran: parseFloat(e.target.value) || 0 })
              }
              step="0.01"
              min="0"
              max="100"
            />
            <div className="flex items-center px-4 border rounded-md bg-muted">
              <span className="text-sm font-medium">%</span>
            </div>
          </div>
        </div>

        <div className="bg-muted p-3 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">
            <strong>Catatan:</strong> Nomor segel akan di-generate otomatis oleh sistem
          </p>
        </div>
      </div>

      <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-pink-50">
        <h4 className="font-semibold mb-3 text-lg">Ringkasan Lengkap Pengiriman</h4>
        
        <div className="space-y-4">
          {/* Informasi Penerima */}
          <div>
            <h5 className="font-semibold text-sm text-primary mb-2">Informasi Penerima</h5>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-muted-foreground">Tanggal Pengiriman:</p>
              <p className="font-medium">
                {data.tanggalPengiriman
                  ? format(data.tanggalPengiriman, "dd MMMM yyyy", { locale: idLocale })
                  : "-"}
              </p>
              <p className="text-muted-foreground">Operator:</p>
              <p className="font-medium">{data.operatorPenimbang || "-"}</p>
            </div>
          </div>

          {/* Penimbangan */}
          <div className="border-t pt-3">
            <h5 className="font-semibold text-sm text-primary mb-2">Penimbangan</h5>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-muted-foreground">Berat Tarra:</p>
              <p className="font-medium">{(data.beratTarra || 0).toLocaleString("id-ID")} Kg</p>
              <p className="text-muted-foreground">Berat Gross:</p>
              <p className="font-medium">{(data.beratGross || 0).toLocaleString("id-ID")} Kg</p>
              <p className="text-muted-foreground font-semibold">Berat Netto:</p>
              <p className="font-bold text-primary">{beratNetto.toLocaleString("id-ID")} Kg</p>
            </div>
          </div>

          {/* Mutu Kernel */}
          <div className="border-t pt-3">
            <h5 className="font-semibold text-sm text-primary mb-2">Mutu Kernel</h5>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p className="text-muted-foreground">FFA:</p>
              <p className="font-medium">{formData.ffa}%</p>
              <p className="text-muted-foreground">Kadar Air:</p>
              <p className="font-medium">{formData.air}%</p>
              <p className="text-muted-foreground">Kadar Kotoran:</p>
              <p className="font-medium">{formData.kotoran}%</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>Perhatian:</strong> Setelah menyimpan, data pengiriman akan diproses dan:
        </p>
        <ul className="list-disc list-inside text-sm text-yellow-800 mt-2 space-y-1">
          <li>Stock product akan dikurangi sebesar {beratNetto.toLocaleString("id-ID")} Kg</li>
          <li>Kuantitas kontrak akan dikurangi</li>
          <li>Stock movement akan tercatat</li>
          <li>Nomor segel akan di-generate</li>
        </ul>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={loading}>
          Kembali
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan Pengiriman"}
        </Button>
      </div>
    </div>
  );
}

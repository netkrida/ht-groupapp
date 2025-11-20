"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Material {
  id: string;
  name: string;
  code: string;
  kategori: {
    name: string;
  };
  satuan: {
    name: string;
    symbol: string;
  };
}

interface CreateTankModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTankModal({ isOpen, onClose }: CreateTankModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMaterials, setIsFetchingMaterials] = useState(false);
  const [materials, setMaterials] = useState<Material[]>([]);

  const [materialId, setMaterialId] = useState("");
  const [namaTangki, setNamaTangki] = useState("");
  const [kapasitas, setKapasitas] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchMaterials();
    }
  }, [isOpen]);

  const fetchMaterials = async () => {
    setIsFetchingMaterials(true);
    try {
      console.log("Fetching materials...");
      const response = await fetch("/api/pt-pks/material");
      console.log("Response status:", response.status);
      
      if (!response.ok) throw new Error("Failed to fetch materials");

      const data = await response.json();
      console.log("All materials:", data);
      
      // Tampilkan semua material tanpa filter
      setMaterials(data);
    } catch (error) {
      console.error("Error fetching materials:", error);
      alert("Gagal memuat data material");
    } finally {
      setIsFetchingMaterials(false);
    }
  };

  const handleSubmit = async () => {
    if (!materialId || !namaTangki || !kapasitas) {
      alert("Semua field harus diisi");
      return;
    }

    if (parseFloat(kapasitas) <= 0) {
      alert("Kapasitas harus lebih dari 0");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/pt-pks/tangki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialId,
          namaTangki,
          kapasitas: parseFloat(kapasitas),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal membuat tangki");
      }

      router.refresh();
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "Gagal membuat tangki");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setMaterialId("");
    setNamaTangki("");
    setKapasitas("");
  };

  const selectedMaterial = materials.find((m) => m.id === materialId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Tangki Baru</DialogTitle>
          <DialogDescription>
            Tambahkan tangki penyimpanan untuk hasil produksi
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="material">Material *</Label>
            <Select value={materialId} onValueChange={setMaterialId}>
              <SelectTrigger id="material">
                <SelectValue placeholder="Pilih material" />
              </SelectTrigger>
              <SelectContent>
                {isFetchingMaterials ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Memuat data...
                  </div>
                ) : materials.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    Tidak ada material. Buat material terlebih dahulu di Master Data.
                  </div>
                ) : (
                  materials.map((material) => (
                    <SelectItem key={material.id} value={material.id}>
                      {material.name} ({material.kategori.name})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {!isFetchingMaterials && materials.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {materials.length} material tersedia
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="namaTangki">Nama Tangki *</Label>
            <Input
              id="namaTangki"
              value={namaTangki}
              onChange={(e) => setNamaTangki(e.target.value)}
              placeholder="T-001, Tank A, dll"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="kapasitas">
              Kapasitas ({selectedMaterial?.satuan.symbol || "kg"}) *
            </Label>
            <Input
              id="kapasitas"
              type="number"
              step="0.01"
              value={kapasitas}
              onChange={(e) => setKapasitas(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TangkiDetail {
  id: string;
  namaTangki: string;
  kapasitas: number;
  isiSaatIni: number;
  materialId: string;
  material: {
    id: string;
    name: string;
    satuan: {
      symbol: string;
    };
  };
}

interface TankTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tangki: TangkiDetail;
  allTangkis?: TangkiDetail[];
}

export function TankTransactionModal({
  isOpen,
  onClose,
  tangki,
  allTangkis = [],
}: TankTransactionModalProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [stockMaterial, setStockMaterial] = useState<number>(0);

  // Masuk form state
  const [masukJumlah, setMasukJumlah] = useState("");
  const [masukReferensi, setMasukReferensi] = useState("");
  const [masukKeterangan, setMasukKeterangan] = useState("");

  // Keluar form state
  const [keluarJumlah, setKeluarJumlah] = useState("");
  const [keluarReferensi, setKeluarReferensi] = useState("");
  const [keluarKeterangan, setKeluarKeterangan] = useState("");

  // Transfer form state
  const [transferTangkiTujuanId, setTransferTangkiTujuanId] = useState("");
  const [transferJumlah, setTransferJumlah] = useState("");
  const [transferKeterangan, setTransferKeterangan] = useState("");

  const availableTangkisForTransfer = allTangkis.filter(
    (t) => t.id !== tangki.id && t.material.name === tangki.material.name,
  );

  // Calculate total stock for this material across all tanks
  const totalStockForMaterial = allTangkis
    .filter((t) => t.material.name === tangki.material.name)
    .reduce((sum, t) => sum + t.isiSaatIni, 0);

  // Fetch stock material from StockMaterial table
  useEffect(() => {
    if (isOpen && tangki.material) {
      fetchStockMaterial();
    }
  }, [isOpen, tangki.material]);

  const fetchStockMaterial = async () => {
    try {
      const response = await fetch(
        `/api/pt-pks/stock-material?materialId=${tangki.material.id}`,
      );
      if (response.ok) {
        const data = await response.json();
        setStockMaterial(data.jumlah || 0);
      }
    } catch (error) {
      console.error("Error fetching stock material:", error);
    }
  };

  const handleMasuk = async () => {
    if (!masukJumlah || parseFloat(masukJumlah) <= 0) {
      alert("Jumlah harus lebih dari 0");
      return;
    }

    const sisaKapasitas = tangki.kapasitas - tangki.isiSaatIni;
    if (parseFloat(masukJumlah) > sisaKapasitas) {
      alert(`Kapasitas tangki tidak mencukupi. Sisa kapasitas: ${sisaKapasitas}`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/pt-pks/tangki/stock/masuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tangkiId: tangki.id,
          jumlah: parseFloat(masukJumlah),
          referensi: masukReferensi,
          keterangan: masukKeterangan,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal menambah stock");
      }

      router.refresh();
      onClose();
      resetForms();
    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "Gagal menambah stock");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeluar = async () => {
    if (!keluarJumlah || parseFloat(keluarJumlah) <= 0) {
      alert("Jumlah harus lebih dari 0");
      return;
    }

    if (parseFloat(keluarJumlah) > tangki.isiSaatIni) {
      alert(`Stock tidak mencukupi. Stock tersedia: ${tangki.isiSaatIni}`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/pt-pks/tangki/stock/keluar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tangkiId: tangki.id,
          jumlah: parseFloat(keluarJumlah),
          referensi: keluarReferensi,
          keterangan: keluarKeterangan,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal mengurangi stock");
      }

      router.refresh();
      onClose();
      resetForms();
    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "Gagal mengurangi stock");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferTangkiTujuanId) {
      alert("Pilih tangki tujuan");
      return;
    }

    if (!transferJumlah || parseFloat(transferJumlah) <= 0) {
      alert("Jumlah harus lebih dari 0");
      return;
    }

    if (parseFloat(transferJumlah) > tangki.isiSaatIni) {
      alert(`Stock tidak mencukupi. Stock tersedia: ${tangki.isiSaatIni}`);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/pt-pks/tangki/stock/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tangkiAsalId: tangki.id,
          tangkiTujuanId: transferTangkiTujuanId,
          jumlah: parseFloat(transferJumlah),
          keterangan: transferKeterangan,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Gagal transfer stock");
      }

      router.refresh();
      onClose();
      resetForms();
    } catch (error) {
      console.error("Error:", error);
      alert(error instanceof Error ? error.message : "Gagal transfer stock");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForms = () => {
    setMasukJumlah("");
    setMasukReferensi("");
    setMasukKeterangan("");
    setKeluarJumlah("");
    setKeluarReferensi("");
    setKeluarKeterangan("");
    setTransferTangkiTujuanId("");
    setTransferJumlah("");
    setTransferKeterangan("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transaksi Stock - {tangki.namaTangki}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-1 text-sm text-muted-foreground -mt-2 mb-4">
          <div>Material: <strong>{tangki.material.name}</strong></div>
          <div className="border-t pt-2 mt-2">
            <span className="font-semibold text-green-600">
              Stock Material (Database): {stockMaterial.toLocaleString("id-ID")}{" "}
              {tangki.material.satuan.symbol}
            </span>
          </div>
          <div>
            <span className="font-semibold text-blue-600">
              Total di Semua Tangki: {totalStockForMaterial.toLocaleString("id-ID")}{" "}
              {tangki.material.satuan.symbol}
            </span>{" "}
            (di {allTangkis.filter((t) => t.material.name === tangki.material.name).length} tangki)
          </div>
          <div>
            <span className="font-semibold text-orange-600">
              Belum Disimpan di Tangki: {(stockMaterial - totalStockForMaterial).toLocaleString("id-ID")}{" "}
              {tangki.material.satuan.symbol}
            </span>
          </div>
          <div className="border-t pt-2 mt-2">
            Stock Tangki Ini:{" "}
            <span className="font-semibold">
              {tangki.isiSaatIni.toLocaleString("id-ID")}{" "}
              {tangki.material.satuan.symbol}
            </span>{" "}
            / {tangki.kapasitas.toLocaleString("id-ID")}{" "}
            {tangki.material.satuan.symbol}
            {" "}({((tangki.isiSaatIni / tangki.kapasitas) * 100).toFixed(1)}%)
          </div>
        </div>

        <Tabs defaultValue="masuk" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="masuk">Stock Masuk</TabsTrigger>
            <TabsTrigger value="keluar">Stock Keluar</TabsTrigger>
            <TabsTrigger value="transfer">Transfer</TabsTrigger>
          </TabsList>

          {/* STOCK MASUK */}
          <TabsContent value="masuk" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="masuk-jumlah">
                Jumlah ({tangki.material.satuan.symbol}) *
              </Label>
              <Input
                id="masuk-jumlah"
                type="number"
                step="0.01"
                value={masukJumlah}
                onChange={(e) => setMasukJumlah(e.target.value)}
                placeholder="0"
              />
              <p className="text-sm text-muted-foreground">
                Sisa kapasitas: {(tangki.kapasitas - tangki.isiSaatIni).toLocaleString("id-ID")}{" "}
                {tangki.material.satuan.symbol}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="masuk-referensi">Nomor Referensi</Label>
              <Input
                id="masuk-referensi"
                value={masukReferensi}
                onChange={(e) => setMasukReferensi(e.target.value)}
                placeholder="Nomor DO, Nomor Produksi, dll"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="masuk-keterangan">Keterangan</Label>
              <Textarea
                id="masuk-keterangan"
                value={masukKeterangan}
                onChange={(e) => setMasukKeterangan(e.target.value)}
                placeholder="Keterangan transaksi"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Batal
              </Button>
              <Button onClick={handleMasuk} disabled={isLoading}>
                {isLoading ? "Memproses..." : "Simpan Stock Masuk"}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* STOCK KELUAR */}
          <TabsContent value="keluar" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="keluar-jumlah">
                Jumlah ({tangki.material.satuan.symbol}) *
              </Label>
              <Input
                id="keluar-jumlah"
                type="number"
                step="0.01"
                value={keluarJumlah}
                onChange={(e) => setKeluarJumlah(e.target.value)}
                placeholder="0"
              />
              <p className="text-sm text-muted-foreground">
                Stock tersedia: {tangki.isiSaatIni.toLocaleString("id-ID")}{" "}
                {tangki.material.satuan.symbol}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keluar-referensi">Nomor Referensi</Label>
              <Input
                id="keluar-referensi"
                value={keluarReferensi}
                onChange={(e) => setKeluarReferensi(e.target.value)}
                placeholder="Nomor DO, Nomor Pengiriman, dll"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="keluar-keterangan">Keterangan</Label>
              <Textarea
                id="keluar-keterangan"
                value={keluarKeterangan}
                onChange={(e) => setKeluarKeterangan(e.target.value)}
                placeholder="Keterangan transaksi"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Batal
              </Button>
              <Button onClick={handleKeluar} disabled={isLoading}>
                {isLoading ? "Memproses..." : "Simpan Stock Keluar"}
              </Button>
            </DialogFooter>
          </TabsContent>

          {/* TRANSFER */}
          <TabsContent value="transfer" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transfer-tujuan">Tangki Tujuan *</Label>
              <Select
                value={transferTangkiTujuanId}
                onValueChange={setTransferTangkiTujuanId}
              >
                <SelectTrigger id="transfer-tujuan">
                  <SelectValue placeholder="Pilih tangki tujuan" />
                </SelectTrigger>
                <SelectContent>
                  {availableTangkisForTransfer.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.namaTangki} - {t.isiSaatIni.toLocaleString("id-ID")} /{" "}
                      {t.kapasitas.toLocaleString("id-ID")}{" "}
                      {t.material.satuan.symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableTangkisForTransfer.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Tidak ada tangki dengan material yang sama
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-jumlah">
                Jumlah ({tangki.material.satuan.symbol}) *
              </Label>
              <Input
                id="transfer-jumlah"
                type="number"
                step="0.01"
                value={transferJumlah}
                onChange={(e) => setTransferJumlah(e.target.value)}
                placeholder="0"
              />
              <p className="text-sm text-muted-foreground">
                Stock tersedia: {tangki.isiSaatIni.toLocaleString("id-ID")}{" "}
                {tangki.material.satuan.symbol}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="transfer-keterangan">Keterangan</Label>
              <Textarea
                id="transfer-keterangan"
                value={transferKeterangan}
                onChange={(e) => setTransferKeterangan(e.target.value)}
                placeholder="Keterangan transfer"
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>
                Batal
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={isLoading || availableTangkisForTransfer.length === 0}
              >
                {isLoading ? "Memproses..." : "Transfer Stock"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

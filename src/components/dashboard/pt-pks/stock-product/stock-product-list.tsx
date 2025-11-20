"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TankVisualization } from "./tank-visualization";
import { TankTransactionModal } from "./tank-transaction-modal";
import { CreateTankModal } from "./create-tank-modal";

interface Material {
  id: string;
  name: string;
  code: string;
  kategori: {
    name: string;
  };
  satuan: {
    symbol: string;
  };
}

interface StockMaterial {
  id: string;
  materialId: string;
  jumlah: number;
  material: Material;
}

interface Tangki {
  id: string;
  namaTangki: string;
  kapasitas: number;
  isiSaatIni: number;
  materialId: string;
  material: Material;
}

export function StockProductList() {
  const [tangkis, setTangkis] = useState<Tangki[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [stockMaterials, setStockMaterials] = useState<StockMaterial[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [selectedTangki, setSelectedTangki] = useState<Tangki | null>(null);

  useEffect(() => {
    fetchData();
  }, [selectedMaterialId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch materials
      const materialsResponse = await fetch("/api/pt-pks/material");
      if (materialsResponse.ok) {
        const materialsData = await materialsResponse.json();
        // Tampilkan semua material
        setMaterials(materialsData);
      }

      // Fetch stock materials
      const stockResponse = await fetch("/api/pt-pks/stock-material");
      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        setStockMaterials(stockData);
      }

      // Fetch tangkis
      const url =
        selectedMaterialId === "all"
          ? "/api/pt-pks/tangki"
          : `/api/pt-pks/tangki?materialId=${selectedMaterialId}`;

      const tangkisResponse = await fetch(url);
      if (tangkisResponse.ok) {
        const tangkisData = await tangkisResponse.json();
        setTangkis(tangkisData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTankClick = (tangki: Tangki) => {
    setSelectedTangki(tangki);
    setIsTransactionModalOpen(true);
  };

  const handleCloseTransactionModal = () => {
    setIsTransactionModalOpen(false);
    setSelectedTangki(null);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    fetchData(); // Refresh data after creating tank
  };

  // Calculate summary statistics
  const summary = tangkis.reduce(
    (acc, tangki) => {
      acc.totalKapasitas += tangki.kapasitas;
      acc.totalIsi += tangki.isiSaatIni;
      return acc;
    },
    { totalKapasitas: 0, totalIsi: 0 },
  );

  const percentageFilled =
    summary.totalKapasitas > 0
      ? (summary.totalIsi / summary.totalKapasitas) * 100
      : 0;

  const filteredTangkis =
    selectedMaterialId === "all"
      ? tangkis
      : tangkis.filter((t) => t.material.id === selectedMaterialId);

  // Get stock summary from StockMaterial table
  const stockSummary = stockMaterials
    .filter((stock) => {
      if (selectedMaterialId === "all") return true;
      return stock.materialId === selectedMaterialId;
    })
    .map((stock) => {
      // Get tangki info for this material
      const tangkisForMaterial = tangkis.filter(
        (t) => t.material.id === stock.materialId,
      );
      const totalKapasitas = tangkisForMaterial.reduce(
        (sum, t) => sum + t.kapasitas,
        0,
      );
      const totalIsiTangki = tangkisForMaterial.reduce(
        (sum, t) => sum + t.isiSaatIni,
        0,
      );

      return {
        materialId: stock.materialId,
        materialName: stock.material.name,
        totalStock: stock.jumlah, // Stock dari StockMaterial table
        totalIsiTangki, // Stock yang ada di tangki
        totalKapasitas,
        satuan: stock.material.satuan.symbol,
        jumlahTangki: tangkisForMaterial.length,
      };
    });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Stock Product - Gudang
          </h1>
          <p className="text-muted-foreground">
            Kelola stock hasil produksi dalam tangki penyimpanan
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Buat Tangki
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium">Filter Material:</label>
            <Select
              value={selectedMaterialId}
              onValueChange={setSelectedMaterialId}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Semua Material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Material</SelectItem>
                {materials.map((material) => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.name} ({material.kategori.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tangki
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredTangkis.length}</div>
            <p className="text-xs text-muted-foreground">Unit tangki</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Kapasitas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.totalKapasitas.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">
              kg/liter total kapasitas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tingkat Pengisian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {percentageFilled.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.totalIsi.toLocaleString("id-ID")} dari{" "}
              {summary.totalKapasitas.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Summary by Material */}
      {stockSummary.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Stock Per Material</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stockSummary.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">
                    {item.materialName}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Stock:</span>
                    <span className="text-lg font-bold text-blue-600">
                      {item.totalStock.toLocaleString("id-ID")} {item.satuan}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Stock di Tangki:</span>
                    <span className="text-sm">
                      {item.totalIsiTangki.toLocaleString("id-ID")} {item.satuan}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Kapasitas Tangki:</span>
                    <span className="text-sm">
                      {item.totalKapasitas.toLocaleString("id-ID")} {item.satuan}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Pengisian Tangki:</span>
                    <span className="text-sm">
                      {item.totalKapasitas > 0
                        ? ((item.totalIsiTangki / item.totalKapasitas) * 100).toFixed(1)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Jumlah Tangki:</span>
                    <span className="text-sm">{item.jumlahTangki} unit</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tank Grid */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Tangki Penyimpanan</h2>
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Memuat data...</p>
          </div>
        ) : filteredTangkis.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                Belum ada tangki. Klik tombol &quot;Buat Tangki&quot; untuk
                menambahkan tangki baru.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTangkis.map((tangki) => (
              <TankVisualization
                key={tangki.id}
                namaTangki={tangki.namaTangki}
                kapasitas={tangki.kapasitas}
                isiSaatIni={tangki.isiSaatIni}
                satuan={tangki.material.satuan.symbol}
                onTankClick={() => handleTankClick(tangki)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateTankModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      />

      {selectedTangki && (
        <TankTransactionModal
          isOpen={isTransactionModalOpen}
          onClose={handleCloseTransactionModal}
          tangki={selectedTangki}
          allTangkis={tangkis}
        />
      )}
    </div>
  );
}

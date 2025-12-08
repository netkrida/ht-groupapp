"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Filter, 
  Download,
  Package,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

type Material = {
  id: string;
  code: string;
  name: string;
  satuan: {
    symbol: string;
  };
};

type StockMovement = {
  id: string;
  materialId: string;
  tipeMovement: "IN" | "OUT" | "ADJUSTMENT";
  jumlah: number;
  stockSebelum: number;
  stockSesudah: number;
  referensi: string | null;
  keterangan: string | null;
  operator: string;
  tanggalTransaksi: string;
  material: Material;
};

type StockSummary = {
  materialId: string;
  code: string;
  name: string;
  satuan: string;
  stockAwal: number;
  stockAkhir: number;
  totalIn: number;
  totalOut: number;
  totalAdjustment: number;
};

export function StockMovementList() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [summary, setSummary] = useState<StockSummary[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [selectedMaterial, setSelectedMaterial] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [referensi, setReferensi] = useState<string>("");
  
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchData();
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/pt-pks/material");
      if (res.ok) {
        const data = await res.json();
        setMaterials(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (selectedMaterial && selectedMaterial !== "all") params.append("materialId", selectedMaterial);
      if (selectedType) params.append("tipeMovement", selectedType);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (referensi) params.append("referensi", referensi);

      const [movementsRes, summaryRes] = await Promise.all([
        fetch(`/api/pt-pks/stock-movement?${params.toString()}`),
        fetch("/api/pt-pks/stock-movement/summary"),
      ]);

      if (movementsRes.ok) {
        const data = await movementsRes.json();
        setMovements(Array.isArray(data) ? data : []);
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("Gagal memuat data stock movement");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchData();
  };

  const handleReset = () => {
    setSelectedMaterial("all");
    setSelectedType("");
    setStartDate("");
    setEndDate("");
    setReferensi("");
  };

  const getTipeIcon = (tipe: string) => {
    switch (tipe) {
      case "IN":
        return <ArrowDownRight className="h-4 w-4 text-green-600" />;
      case "OUT":
        return <ArrowUpRight className="h-4 w-4 text-red-600" />;
      default:
        return <RefreshCw className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTipeBadge = (tipe: string) => {
    switch (tipe) {
      case "IN":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Masuk</Badge>;
      case "OUT":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Keluar</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Adjustment</Badge>;
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("id-ID", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Riwayat Stock Movement</h1>
          <p className="text-muted-foreground mt-1">
            Tracking pergerakan stock material (masuk/keluar/adjustment)
          </p>
        </div>
        <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
        </Button>
      </div>


      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filter Data</CardTitle>
            <CardDescription>
              Filter riwayat pergerakan stock berdasarkan kriteria tertentu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Material</Label>
                <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Material" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Material</SelectItem>
                    {materials.map((material) => (
                      <SelectItem key={material.id} value={material.id}>
                        {material.code} - {material.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipe Movement</Label>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Semua Tipe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Tipe</SelectItem>
                    <SelectItem value="IN">Masuk (IN)</SelectItem>
                    <SelectItem value="OUT">Keluar (OUT)</SelectItem>
                    <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Referensi / No. Dokumen</Label>
                <Input
                  placeholder="Cari referensi..."
                  value={referensi}
                  onChange={(e) => setReferensi(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Tanggal Akhir</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              <div className="flex items-end gap-2">
                <Button onClick={handleFilter} className="flex-1">
                  <Filter className="mr-2 h-4 w-4" />
                  Terapkan Filter
                </Button>
                <Button onClick={handleReset} variant="outline">
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Movement History Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Riwayat Pergerakan Stock</CardTitle>
              <CardDescription>
                Daftar semua transaksi pergerakan stock material
              </CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Memuat data...</p>
            </div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Belum ada riwayat stock movement</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Material</TableHead>
                    <TableHead>Tipe</TableHead>
                    <TableHead className="text-right">Jumlah</TableHead>
                    <TableHead className="text-right">Stock Sebelum</TableHead>
                    <TableHead className="text-right">Stock Sesudah</TableHead>
                    <TableHead>Referensi</TableHead>
                    <TableHead>Operator</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell className="font-medium">
                        {format(new Date(movement.tanggalTransaksi), "dd MMM yyyy HH:mm", {
                          locale: idLocale,
                        })}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{movement.material.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {movement.material.code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTipeIcon(movement.tipeMovement)}
                          {getTipeBadge(movement.tipeMovement)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span
                          className={
                            movement.tipeMovement === "IN"
                              ? "text-green-600"
                              : movement.tipeMovement === "OUT"
                              ? "text-red-600"
                              : "text-blue-600"
                          }
                        >
                          {movement.tipeMovement === "IN" ? "+" : movement.tipeMovement === "OUT" ? "-" : ""}
                          {formatNumber(movement.jumlah)} {movement.material.satuan.symbol}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(movement.stockSebelum)} {movement.material.satuan.symbol}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatNumber(movement.stockSesudah)} {movement.material.satuan.symbol}
                      </TableCell>
                      <TableCell>
                        {movement.referensi ? (
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {movement.referensi}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{movement.operator}</TableCell>
                      <TableCell>
                        {movement.keterangan ? (
                          <span className="text-sm">{movement.keterangan}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

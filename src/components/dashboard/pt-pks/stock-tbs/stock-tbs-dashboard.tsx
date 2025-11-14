"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { TrendingUp, Package, Calendar, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Material = {
  id: string;
  name: string;
  code: string;
  satuan: { symbol: string };
};

type TBSStatistics = {
  tbsHariIni: number;
  tbsBulanIni: number;
  stockTBS: number;
  tbsBySupplier: Array<{
    supplierId: string;
    _sum: { beratNetto2: number | null };
    _count: { id: number };
  }>;
};

type SupplierData = {
  id: string;
  ownerName: string;
  type: string;
  totalBerat: number;
  jumlahPenerimaan: number;
};

export function StockTBSDashboard() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [statistics, setStatistics] = useState<TBSStatistics | null>(null);
  const [supplierData, setSupplierData] = useState<SupplierData[]>([]);
  const [suppliers, setSuppliers] = useState<Map<string, any>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMaterials();
    fetchSuppliers();
  }, []);

  useEffect(() => {
    if (selectedMaterial) {
      fetchStatistics();
    }
  }, [selectedMaterial]);

  const fetchMaterials = async () => {
    try {
      const res = await fetch("/api/pt-pks/material");
      if (res.ok) {
        const data = await res.json();
        // Filter hanya material kategori TBS
        const tbsMaterials = data.filter((m: Material) => 
          m.name.toLowerCase().includes("tbs") || 
          m.code.toLowerCase().includes("tbs")
        );
        setMaterials(tbsMaterials.length > 0 ? tbsMaterials : data);
        
        if (tbsMaterials.length > 0) {
          setSelectedMaterial(tbsMaterials[0].id);
        } else if (data.length > 0) {
          setSelectedMaterial(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/pt-pks/supplier");
      if (res.ok) {
        const data = await res.json();
        const arr = Array.isArray(data) ? data : (Array.isArray(data.suppliers) ? data.suppliers : []);
        const supplierMap = new Map<string, any>(
          arr.map((s: any) => [s.id as string, s])
        );
        setSuppliers(supplierMap);
      }
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  const fetchStatistics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pt-pks/tbs-statistics?materialId=${selectedMaterial}`);
      if (res.ok) {
        const data = await res.json();
        setStatistics(data);

        // Process supplier data
        const processedSuppliers = data.tbsBySupplier.map((item: any) => {
          const supplier = suppliers.get(item.supplierId);
          return {
            id: item.supplierId,
            ownerName: supplier?.ownerName || "Unknown",
            type: supplier?.type || "-",
            totalBerat: item._sum.beratNetto2 || 0,
            jumlahPenerimaan: item._count.id,
          };
        }).sort((a: SupplierData, b: SupplierData) => b.totalBerat - a.totalBerat);

        setSupplierData(processedSuppliers);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedMaterialData = materials.find((m) => m.id === selectedMaterial);

  if (materials.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Belum ada material TBS terdaftar. Silakan tambahkan material terlebih dahulu.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Material Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Stock TBS</CardTitle>
          <CardDescription>
            Monitoring stock dan penerimaan Tandan Buah Segar (TBS)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="material">Pilih Material</Label>
            <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
              <SelectTrigger id="material">
                <SelectValue placeholder="Pilih material" />
              </SelectTrigger>
              <SelectContent>
                {materials.map((material) => (
                  <SelectItem key={material.id} value={material.id}>
                    {material.name} ({material.code}) - {material.satuan.symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">Memuat data statistik...</div>
          </CardContent>
        </Card>
      ) : statistics ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 text-blue-700 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">TBS Masuk Hari Ini</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-900">
                      {statistics.tbsHariIni.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      {selectedMaterialData?.satuan.symbol || "kg"}
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-blue-300" />
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="text-xs text-blue-700">
                    {new Date().toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 text-green-700 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">TBS Masuk Bulan Ini</span>
                    </div>
                    <div className="text-3xl font-bold text-green-900">
                      {statistics.tbsBulanIni.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-green-700 mt-1">
                      {selectedMaterialData?.satuan.symbol || "kg"}
                    </div>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-300" />
                </div>
                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="text-xs text-green-700">
                    {new Date().toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Package className="h-4 w-4" />
                      <span className="text-sm font-medium">Stock TBS Saat Ini</span>
                    </div>
                    <div className="text-4xl font-bold text-primary">
                      {statistics.stockTBS.toLocaleString("id-ID", { maximumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-primary/70 mt-1">
                      {selectedMaterialData?.satuan.symbol || "kg"}
                    </div>
                  </div>
                  <Package className="h-10 w-10 text-primary/30" />
                </div>
                <div className="mt-4 pt-4 border-t border-primary/20">
                  <div className="text-xs text-primary/70">Total Stock Material</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Supplier Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Daftar Total TBS Masuk dari Supplier
                  </CardTitle>
                  <CardDescription>
                    Total penerimaan TBS per supplier untuk material {selectedMaterialData?.name}
                  </CardDescription>
                </div>
                <Badge variant="outline" className="text-base px-4 py-2">
                  {supplierData.length} Supplier
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {supplierData.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Belum ada data penerimaan TBS dari supplier
                  </p>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[60px]">Rank</TableHead>
                        <TableHead>Nama Supplier</TableHead>
                        <TableHead>Tipe</TableHead>
                        <TableHead className="text-center">Jumlah Penerimaan</TableHead>
                        <TableHead className="text-right">Total Berat (kg)</TableHead>
                        <TableHead className="text-right">Rata-rata per Penerimaan</TableHead>
                        <TableHead className="text-right">% dari Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplierData.map((supplier, index) => {
                        const totalAllSuppliers = supplierData.reduce(
                          (sum, s) => sum + s.totalBerat,
                          0
                        );
                        const percentage = (supplier.totalBerat / totalAllSuppliers) * 100;
                        const averagePerDelivery = supplier.totalBerat / supplier.jumlahPenerimaan;

                        return (
                          <TableRow key={supplier.id}>
                            <TableCell>
                              <div className="flex items-center justify-center">
                                {index === 0 ? (
                                  <Badge className="bg-yellow-500">🥇 {index + 1}</Badge>
                                ) : index === 1 ? (
                                  <Badge className="bg-gray-400">🥈 {index + 1}</Badge>
                                ) : index === 2 ? (
                                  <Badge className="bg-amber-600">🥉 {index + 1}</Badge>
                                ) : (
                                  <Badge variant="outline">{index + 1}</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{supplier.ownerName}</div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{supplier.type}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline">{supplier.jumlahPenerimaan}×</Badge>
                            </TableCell>
                            <TableCell className="text-right font-bold text-primary">
                              {supplier.totalBerat.toLocaleString("id-ID", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {averagePerDelivery.toLocaleString("id-ID", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-24 bg-muted rounded-full h-2 overflow-hidden">
                                  <div
                                    className="bg-primary h-full"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                                <span className="font-medium text-sm w-12 text-right">
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>

                  {/* Summary Footer */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total Supplier</div>
                        <div className="text-2xl font-bold">{supplierData.length}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total Penerimaan</div>
                        <div className="text-2xl font-bold">
                          {supplierData.reduce((sum, s) => sum + s.jumlahPenerimaan, 0)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground">Total Berat</div>
                        <div className="text-2xl font-bold text-primary">
                          {supplierData
                            .reduce((sum, s) => sum + s.totalBerat, 0)
                            .toLocaleString("id-ID", { maximumFractionDigits: 2 })}{" "}
                          kg
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data statistik tersedia
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Download, Eye } from "lucide-react";
import Link from "next/link";

interface MaterialInventaris {
  id: string;
  partNumber: string;
  namaMaterial: string;
  kategoriMaterial: {
    name: string;
  };
  satuanMaterial: {
    name: string;
    symbol: string;
  };
  lokasiDigunakan?: string;
  stockOnHand: number;
  minStock: number;
  maxStock: number;
}

export function MaterialInventarisList() {
  const [materials, setMaterials] = useState<MaterialInventaris[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      const response = await fetch("/api/pt-pks/material-inventaris");
      if (response.ok) {
        const data = await response.json();
        setMaterials(data);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter(
    (m) =>
      m.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.namaMaterial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.kategoriMaterial.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockBadge = (material: MaterialInventaris) => {
    if (material.stockOnHand <= material.minStock) {
      return <Badge variant="destructive">Low Stock</Badge>;
    }
    if (material.stockOnHand >= material.maxStock) {
      return <Badge variant="secondary">Overstock</Badge>;
    }
    return <Badge variant="default">Normal</Badge>;
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Master Material Inventaris</CardTitle>
            <Link href="/dashboard/pt-pks/gudang/material-inventaris/create">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Material
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari part number, nama material, atau kategori..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Part Number</TableHead>
                  <TableHead>Nama Material</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Satuan</TableHead>
                  <TableHead>Lokasi</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead className="text-right">Max</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center">
                      Tidak ada data material
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMaterials.map((material) => (
                    <TableRow key={material.id}>
                      <TableCell className="font-medium">
                        {material.partNumber}
                      </TableCell>
                      <TableCell>{material.namaMaterial}</TableCell>
                      <TableCell>{material.kategoriMaterial.name}</TableCell>
                      <TableCell>{material.satuanMaterial.symbol}</TableCell>
                      <TableCell>{material.lokasiDigunakan || "-"}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {material.stockOnHand}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {material.minStock}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {material.maxStock}
                      </TableCell>
                      <TableCell>{getStockBadge(material)}</TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/pt-pks/gudang/material-inventaris/${material.id}`}
                        >
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Eye, Loader2 } from "lucide-react";
import { PengeluaranBarangForm } from "./pengeluaran-barang-form";
import { PengeluaranBarangDetail } from "./pengeluaran-barang-detail";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface PengeluaranBarang {
  id: string;
  nomorPengeluaran: string;
  tanggalPengeluaran: string;
  divisi: string;
  requestedBy: string;
  issuedBy?: string;
  receivedByDivisi?: string;
  status: string;
  keterangan?: string;
  storeRequest?: {
    nomorSR: string;
  };
  items: Array<{
    id: string;
    jumlahKeluar: number;
    hargaSatuan: number;
    totalHarga: number;
    keterangan?: string;
    material: {
      namaMaterial: string;
      partNumber: string;
      kategoriMaterial: {
        nama: string;
      };
      satuanMaterial: {
        symbol: string;
      };
    };
  }>;
}

export function PengeluaranBarangList() {
  const [pengeluaranBarang, setPengeluaranBarang] = useState<PengeluaranBarang[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [selectedPengeluaran, setSelectedPengeluaran] = useState<PengeluaranBarang | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchPengeluaranBarang();
  }, [statusFilter]);

  const fetchPengeluaranBarang = async () => {
    try {
      let url = "/api/pt-pks/gudang/pengeluaran-barang";
      if (statusFilter !== "all") {
        url += `?status=${statusFilter}`;
      }
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPengeluaranBarang(data);
      }
    } catch (error) {
      console.error("Error fetching pengeluaran barang:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: "secondary",
      PENDING: "default",
      APPROVED: "default",
      COMPLETED: "default",
      REJECTED: "destructive",
      CANCELLED: "secondary",
    };

    const labels: Record<string, string> = {
      DRAFT: "Draft",
      PENDING: "Menunggu Approval",
      APPROVED: "Disetujui",
      COMPLETED: "Selesai",
      REJECTED: "Ditolak",
      CANCELLED: "Dibatalkan",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const calculateTotal = (pengeluaran: PengeluaranBarang) => {
    return pengeluaran.items.reduce((total, item) => total + item.totalHarga, 0);
  };

  const filteredPengeluaran = pengeluaranBarang.filter(
    (p) =>
      p.nomorPengeluaran.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.divisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.storeRequest?.nomorSR.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSuccess = () => {
    setShowForm(false);
    setShowDetail(false);
    fetchPengeluaranBarang();
  };

  if (showForm) {
    return <PengeluaranBarangForm onSuccess={handleSuccess} onCancel={() => setShowForm(false)} />;
  }

  if (showDetail && selectedPengeluaran) {
    // Ensure selectedPengeluaran has all required fields for PengeluaranBarangDetail
    const detailData = {
      ...selectedPengeluaran,
      storeRequest: selectedPengeluaran.storeRequest && 'tanggalRequest' in selectedPengeluaran.storeRequest
        ? {
            nomorSR: typeof selectedPengeluaran.storeRequest.nomorSR === "string" ? selectedPengeluaran.storeRequest.nomorSR : "",
            tanggalRequest: typeof selectedPengeluaran.storeRequest.tanggalRequest === "string" ? selectedPengeluaran.storeRequest.tanggalRequest : "",
          }
        : undefined,
    };
    return (
      <PengeluaranBarangDetail
        pengeluaranBarang={detailData}
        onClose={() => {
          setShowDetail(false);
          setSelectedPengeluaran(null);
        }}
        onSuccess={handleSuccess}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Pengeluaran Barang</CardTitle>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Pengeluaran
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nomor pengeluaran, divisi, atau nomor SR..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PENDING">Menunggu Approval</SelectItem>
                <SelectItem value="APPROVED">Disetujui</SelectItem>
                <SelectItem value="COMPLETED">Selesai</SelectItem>
                <SelectItem value="REJECTED">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredPengeluaran.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada data pengeluaran barang
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nomor</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Nomor SR</TableHead>
                    <TableHead>Divisi</TableHead>
                    <TableHead>Diminta oleh</TableHead>
                    <TableHead>Dikeluarkan oleh</TableHead>
                    <TableHead className="text-right">Total Nilai</TableHead>
                    <TableHead className="text-right">Total Item</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPengeluaran.map((pengeluaran) => (
                    <TableRow key={pengeluaran.id}>
                      <TableCell className="font-medium font-mono text-sm">
                        {pengeluaran.nomorPengeluaran}
                      </TableCell>
                      <TableCell>
                        {format(new Date(pengeluaran.tanggalPengeluaran), "dd MMM yyyy", { locale: id })}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {pengeluaran.storeRequest?.nomorSR || "-"}
                      </TableCell>
                      <TableCell>{pengeluaran.divisi}</TableCell>
                      <TableCell>{pengeluaran.requestedBy}</TableCell>
                      <TableCell>{pengeluaran.issuedBy || "-"}</TableCell>
                      <TableCell className="text-right font-semibold">
                        Rp {calculateTotal(pengeluaran).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        {pengeluaran.items.length} item
                      </TableCell>
                      <TableCell>{getStatusBadge(pengeluaran.status)}</TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPengeluaran(pengeluaran);
                            setShowDetail(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
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

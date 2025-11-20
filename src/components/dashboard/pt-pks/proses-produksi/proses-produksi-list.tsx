"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Eye, Edit, Trash2, Search } from "lucide-react";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface ProsesProduksi {
  id: string;
  nomorProduksi: string;
  tanggalProduksi: string;
  materialInput: {
    name: string;
    kategori: { name: string };
    satuan: { name: string };
  };
  jumlahInput: number;
  operatorProduksi: string;
  status: string;
  hasilProduksi: Array<{
    materialOutput: {
      name: string;
    };
    jumlahOutput: number;
    rendemen: number;
  }>;
}

interface ProsesProduksiListProps {
  onCreateClick: () => void;
  onEditClick: (id: string) => void;
  onViewClick: (id: string) => void;
  onRefresh?: () => void;
}

export function ProsesProduksiList({
  onCreateClick,
  onEditClick,
  onViewClick,
  onRefresh,
}: ProsesProduksiListProps) {
  const [data, setData] = useState<ProsesProduksi[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    status: "",
    tanggalMulai: "",
    tanggalAkhir: "",
    search: "",
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (filters.status) params.append("status", filters.status);
      if (filters.tanggalMulai) params.append("tanggalMulai", filters.tanggalMulai);
      if (filters.tanggalAkhir) params.append("tanggalAkhir", filters.tanggalAkhir);

      const response = await fetch(`/api/pt-pks/proses-produksi?${params}`);
      if (!response.ok) throw new Error("Failed to fetch data");

      const result = await response.json();
      setData(result.data);
      setTotalPages(result.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching proses produksi:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page, filters]);

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus proses produksi ini?"))
      return;

    try {
      const response = await fetch(`/api/pt-pks/proses-produksi/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      alert("Proses produksi berhasil dihapus");
      fetchData();
      onRefresh?.();
    } catch (error) {
      console.error("Error deleting proses produksi:", error);
      alert("Gagal menghapus proses produksi");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      DRAFT: "secondary",
      IN_PROGRESS: "default",
      COMPLETED: "default",
      CANCELLED: "destructive",
    };

    const labels: Record<string, string> = {
      DRAFT: "Draft",
      IN_PROGRESS: "Proses",
      COMPLETED: "Selesai",
      CANCELLED: "Batal",
    };

    return (
      <Badge variant={variants[status] || "default"}>{labels[status]}</Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Data Proses Produksi</CardTitle>
          <Button onClick={onCreateClick}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Proses Produksi
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <Input
              type="date"
              placeholder="Tanggal Mulai"
              value={filters.tanggalMulai}
              onChange={(e) =>
                setFilters({ ...filters, tanggalMulai: e.target.value })
              }
            />
          </div>
          <div>
            <Input
              type="date"
              placeholder="Tanggal Akhir"
              value={filters.tanggalAkhir}
              onChange={(e) =>
                setFilters({ ...filters, tanggalAkhir: e.target.value })
              }
            />
          </div>
          <div>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value === "all" ? "" : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="IN_PROGRESS">Proses</SelectItem>
                <SelectItem value="COMPLETED">Selesai</SelectItem>
                <SelectItem value="CANCELLED">Batal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                setFilters({
                  status: "",
                  tanggalMulai: "",
                  tanggalAkhir: "",
                  search: "",
                })
              }
            >
              Reset Filter
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor Produksi</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Material Input</TableHead>
                <TableHead>Jumlah Input</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Tidak ada data
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.nomorProduksi}
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.tanggalProduksi), "dd MMM yyyy", {
                        locale: idLocale,
                      })}
                    </TableCell>
                    <TableCell>
                      {item.materialInput.name}
                      <div className="text-xs text-muted-foreground">
                        {item.materialInput.kategori.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.jumlahInput.toLocaleString("id-ID")}{" "}
                      {item.materialInput.satuan.name}
                    </TableCell>
                    <TableCell>{item.operatorProduksi}</TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onViewClick(item.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {item.status === "DRAFT" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onEditClick(item.id)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

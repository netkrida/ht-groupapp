"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Eye, Pencil, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

type Contract = {
  id: string;
  contractNumber: string;
  contractDate: Date;
  deliveryDate: Date;
  status: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  buyer: {
    id: string;
    code: string;
    name: string;
    taxStatus: string;
  };
  contractItems: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    material: {
      name: string;
      satuan: {
        symbol: string;
      };
    };
  }>;
};

type ContractTableProps = {
  buyerId?: string;
};

const statusLabels: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  DRAFT: { label: "Draft", variant: "secondary" },
  ACTIVE: { label: "Aktif", variant: "default" },
  COMPLETED: { label: "Selesai", variant: "outline" },
  CANCELLED: { label: "Dibatalkan", variant: "destructive" },
};

export function ContractTable({ buyerId }: ContractTableProps) {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter && statusFilter !== "all")
        params.append("status", statusFilter);
      if (buyerId) params.append("buyerId", buyerId);
      params.append("page", page.toString());
      params.append("limit", "10");

      const response = await fetch(`/api/pt-pks/contract?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch contracts");

      const result = await response.json();
      setContracts(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching contracts:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [searchTerm, statusFilter, page, buyerId]);

  const handleView = (id: string) => {
    router.push(`/dashboard/pt-pks/master/contract/${id}`);
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/pt-pks/master/contract/${id}/edit`);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari kontrak (nomor kontrak, nama buyer)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="COMPLETED">Selesai</SelectItem>
            <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
          </SelectContent>
        </Select>
        {!buyerId && (
          <Button onClick={() => router.push("/dashboard/pt-pks/master/contract/new")}>
            <FileText className="mr-2 h-4 w-4" />
            Buat Kontrak
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>No. Kontrak</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Tanggal Kontrak</TableHead>
              <TableHead>Tanggal Kirim</TableHead>
              <TableHead>Jumlah Item</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Memuat data...
                </TableCell>
              </TableRow>
            ) : contracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Tidak ada data kontrak
                </TableCell>
              </TableRow>
            ) : (
              contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">
                    {contract.contractNumber}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{contract.buyer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {contract.buyer.code}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(contract.contractDate).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>
                    {new Date(contract.deliveryDate).toLocaleDateString("id-ID")}
                  </TableCell>
                  <TableCell>{contract.contractItems.length} item</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        Rp {contract.totalAmount.toLocaleString("id-ID")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        + pajak Rp {contract.taxAmount.toLocaleString("id-ID")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusLabels[contract.status]?.variant}>
                      {statusLabels[contract.status]?.label || contract.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(contract.id)}
                        title="Lihat Detail"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {contract.status === "DRAFT" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(contract.id)}
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
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
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

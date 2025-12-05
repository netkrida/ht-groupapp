"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Eye } from "lucide-react";
import { format } from "date-fns";

interface PurchaseOrder {
  id: string;
  nomorPO: string;
  tanggalPO: string;
  namaSupplier: string;
  contactSupplier: string;
  alamatSupplier: string;
  status: string;
  totalNilai: number;
  items: Array<{
    jumlahOrder: number;
    hargaSatuan: number;
  }>;
}

interface PurchaseOrderListProps {
  onCreateNew?: () => void;
  onViewDetail?: (id: string) => void;
}

export function PurchaseOrderList({
  onCreateNew,
  onViewDetail,
}: PurchaseOrderListProps) {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchPurchaseOrders();
  }, [statusFilter]);

  const fetchPurchaseOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(
        `/api/pt-pks/gudang/purchase-order?${params.toString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setPurchaseOrders(data);
      }
    } catch (error) {
      console.error("Error fetching purchase orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      DRAFT: "secondary",
      SENT: "default",
      PARTIALLY_RECEIVED: "default",
      COMPLETED: "default",
      CANCELLED: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const filteredPurchaseOrders = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.nomorPO.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.namaSupplier.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Purchase Order</CardTitle>
          <Button onClick={() => router.push('/dashboard/gudang/purchase-order/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Buat PO Baru
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4">
          <Input
            placeholder="Cari nomor PO atau supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SENT">Sent</SelectItem>
              <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nomor PO</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Jumlah Item</TableHead>
                  <TableHead className="text-right">Total Nilai</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.nomorPO}</TableCell>
                      <TableCell>
                        {format(new Date(po.tanggalPO), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{po.namaSupplier}</TableCell>
                      <TableCell>{po.contactSupplier}</TableCell>
                      <TableCell>{po.items.length} item</TableCell>
                      <TableCell className="text-right">
                        Rp {po.totalNilai.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                      <TableCell className="text-right">
                        {onViewDetail && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetail(po.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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

interface PurchaseRequest {
  id: string;
  nomorPR: string;
  tanggalRequest: string;
  divisi: string;
  requestedBy: string;
  approvedBy?: string;
  status: string;
  items: Array<{
    jumlahRequest: number;
    material: {
      partNumber: string;
      namaMaterial: string;
    };
  }>;
}

interface PurchaseRequestListProps {
  onCreateNew?: () => void;
  onViewDetail?: (id: string) => void;
}

export function PurchaseRequestList({
  onCreateNew,
  onViewDetail,
}: PurchaseRequestListProps) {
  const router = useRouter();
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchPurchaseRequests();
  }, [statusFilter]);

  const fetchPurchaseRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") {
        params.append("status", statusFilter);
      }

      const response = await fetch(
        `/api/pt-pks/gudang/purchase-request?${params.toString()}`
      );
      if (response.ok) {
        const data = await response.json();
        setPurchaseRequests(data);
      }
    } catch (error) {
      console.error("Error fetching purchase requests:", error);
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

    return (
      <Badge variant={variants[status] || "default"}>
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const filteredPurchaseRequests = purchaseRequests.filter((pr) => {
    const matchesSearch =
      pr.nomorPR.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.divisi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.requestedBy.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Purchase Request</CardTitle>
          <Button onClick={() => router.push('/dashboard/gudang/purchase-request/create')}>
            <Plus className="mr-2 h-4 w-4" />
            Buat PR Baru
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-4">
          <Input
            placeholder="Cari nomor PR, divisi, atau pemohon..."
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
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
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
                  <TableHead>Nomor PR</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Divisi</TableHead>
                  <TableHead>Pemohon</TableHead>
                  <TableHead>Jumlah Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approver</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchaseRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Tidak ada data
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchaseRequests.map((pr) => (
                    <TableRow key={pr.id}>
                      <TableCell className="font-medium">{pr.nomorPR}</TableCell>
                      <TableCell>
                        {format(new Date(pr.tanggalRequest), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{pr.divisi}</TableCell>
                      <TableCell>{pr.requestedBy}</TableCell>
                      <TableCell>{pr.items.length} item</TableCell>
                      <TableCell>{getStatusBadge(pr.status)}</TableCell>
                      <TableCell>{pr.approvedBy || "-"}</TableCell>
                      <TableCell className="text-right">
                        {onViewDetail && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewDetail(pr.id)}
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

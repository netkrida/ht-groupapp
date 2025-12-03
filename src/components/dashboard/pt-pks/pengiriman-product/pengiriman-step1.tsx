"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PengirimanFormData } from "./pengiriman-wizard";

type Buyer = {
  id: string;
  code: string;
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
};

type Contract = {
  id: string;
  contractNumber: string;
  contractDate: string;
  deliveryDate: string;
  buyer: Buyer;
  contractItems: ContractItem[];
};

type ContractItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  material: {
    id: string;
    name: string;
    code: string;
    kategori: { name: string };
    satuan: { name: string; symbol: string };
  };
};

type Step1Props = {
  data: Partial<PengirimanFormData>;
  onUpdate: (data: Partial<PengirimanFormData>) => void;
  onNext: () => void;
};

export function PengirimanStep1({ data, onUpdate, onNext }: Step1Props) {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractItems, setContractItems] = useState<ContractItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");

  const [formData, setFormData] = useState({
    tanggalPengiriman: data.tanggalPengiriman || new Date(),
    operatorPenimbang: data.operatorPenimbang || "",
    buyerId: data.buyerId || "",
    contractId: data.contractId || "",
    contractItemId: data.contractItemId || "",
  });

  useEffect(() => {
    fetchBuyers();
    fetchUserName();
  }, []);

  useEffect(() => {
    if (formData.buyerId) {
      fetchContracts(formData.buyerId);
    }
  }, [formData.buyerId]);

  useEffect(() => {
    if (formData.contractId) {
      fetchContractItems(formData.contractId);
    }
  }, [formData.contractId]);

  const fetchBuyers = async () => {
    try {
      console.log("Fetching buyers...");
      const res = await fetch("/api/pt-pks/buyer?dropdown=true");
      console.log("Buyer response status:", res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log("Buyer data received:", data);
        
        // Handle both formats: { buyers: [] } or []
        const buyersData = data.buyers || data;
        console.log("Buyers array:", buyersData);
        
        setBuyers(Array.isArray(buyersData) ? buyersData : []);
      } else {
        const errorText = await res.text();
        console.error("Failed to fetch buyers:", res.statusText, errorText);
        setBuyers([]);
      }
    } catch (error) {
      console.error("Error fetching buyers:", error);
      setBuyers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchContracts = async (buyerId: string) => {
    try {
      const res = await fetch(`/api/pt-pks/contract/active?buyerId=${buyerId}`);
      if (res.ok) {
        const data = await res.json();
        setContracts(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch contracts:", res.statusText);
        setContracts([]);
      }
    } catch (error) {
      console.error("Error fetching contracts:", error);
      setContracts([]);
    }
  };

  const fetchContractItems = async (contractId: string) => {
    try {
      const res = await fetch(`/api/pt-pks/contract/${contractId}/items`);
      if (res.ok) {
        const data = await res.json();
        setContractItems(Array.isArray(data) ? data : []);
      } else {
        console.error("Failed to fetch contract items:", res.statusText);
        setContractItems([]);
      }
    } catch (error) {
      console.error("Error fetching contract items:", error);
      setContractItems([]);
    }
  };

  const fetchUserName = async () => {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const session = await res.json();
        if (session?.user?.name) {
          setUserName(session.user.name);
          setFormData((prev) => ({ ...prev, operatorPenimbang: session.user.name }));
        }
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    }
  };

  const handleNext = () => {
    if (!formData.buyerId) {
      alert("Buyer harus dipilih");
      return;
    }
    if (!formData.contractId) {
      alert("Kontrak harus dipilih");
      return;
    }
    if (!formData.contractItemId) {
      alert("Item kontrak harus dipilih");
      return;
    }

    onUpdate(formData);
    onNext();
  };

  const selectedBuyer = buyers.find((b) => b.id === formData.buyerId);
  const selectedContract = contracts.find((c) => c.id === formData.contractId);
  const selectedItem = contractItems.find((i) => i.id === formData.contractItemId);

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!Array.isArray(buyers)) {
    return (
      <div className="text-center py-8 text-red-500">
        Error: Data buyers tidak valid. Silakan refresh halaman.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tanggalPengiriman">Tanggal Pengiriman</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.tanggalPengiriman && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.tanggalPengiriman ? (
                  format(formData.tanggalPengiriman, "PPP", { locale: idLocale })
                ) : (
                  <span>Pilih tanggal</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.tanggalPengiriman}
                onSelect={(date) =>
                  setFormData({ ...formData, tanggalPengiriman: date || new Date() })
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="operatorPenimbang">Operator Penimbang</Label>
          <div className="p-2 border rounded-md bg-muted">
            {userName || formData.operatorPenimbang || "N/A"}
          </div>
        </div>
      </div>

      <div className="space-y-4 border-t pt-4">
        <h3 className="font-semibold text-lg">Informasi Penerima</h3>
        
        <div className="space-y-2">
          <Label htmlFor="buyerId">Buyer/Pembeli *</Label>
          <Select
            value={formData.buyerId}
            onValueChange={(value) =>
              setFormData({ ...formData, buyerId: value, contractId: "", contractItemId: "" })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih buyer" />
            </SelectTrigger>
            <SelectContent>
              {buyers.map((buyer) => (
                <SelectItem key={buyer.id} value={buyer.id}>
                  {buyer.code} - {buyer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedBuyer && (
            <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-md">
              <p><strong>Contact Person:</strong> {selectedBuyer.contactPerson}</p>
              <p><strong>Telepon:</strong> {selectedBuyer.phone}</p>
              <p><strong>Alamat:</strong> {selectedBuyer.address}</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractId">Kontrak *</Label>
          <Select
            value={formData.contractId}
            onValueChange={(value) =>
              setFormData({ ...formData, contractId: value, contractItemId: "" })
            }
            disabled={!formData.buyerId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih kontrak" />
            </SelectTrigger>
            <SelectContent>
              {contracts.map((contract) => (
                <SelectItem key={contract.id} value={contract.id}>
                  {contract.contractNumber} - {format(new Date(contract.deliveryDate), "dd/MM/yyyy")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedContract && (
            <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-md">
              <p><strong>Nomor Kontrak:</strong> {selectedContract.contractNumber}</p>
              <p><strong>Tanggal Kontrak:</strong> {format(new Date(selectedContract.contractDate), "dd MMMM yyyy", { locale: idLocale })}</p>
              <p><strong>Tanggal Pengiriman:</strong> {format(new Date(selectedContract.deliveryDate), "dd MMMM yyyy", { locale: idLocale })}</p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractItemId">Item Product *</Label>
          <Select
            value={formData.contractItemId}
            onValueChange={(value) => setFormData({ ...formData, contractItemId: value })}
            disabled={!formData.contractId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Pilih item product" />
            </SelectTrigger>
            <SelectContent>
              {contractItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.material.name} - Sisa: {item.quantity.toLocaleString("id-ID")} {item.material.satuan.symbol}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedItem && (
            <div className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-md">
              <p><strong>Material:</strong> {selectedItem.material.name} ({selectedItem.material.code})</p>
              <p><strong>Kategori:</strong> {selectedItem.material.kategori.name}</p>
              <p><strong>Satuan:</strong> {selectedItem.material.satuan.name}</p>
              <p><strong>Kuantitas Tersisa:</strong> {selectedItem.quantity.toLocaleString("id-ID")} {selectedItem.material.satuan.symbol}</p>
              <p><strong>Harga Satuan:</strong> Rp {selectedItem.unitPrice.toLocaleString("id-ID")}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext}>
          Lanjut ke Pilih Vendor
        </Button>
      </div>
    </div>
  );
}

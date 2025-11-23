"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2 } from "lucide-react";

const contractItemSchema = z.object({
  materialId: z.string().min(1, "Material wajib dipilih"),
  quantity: z.coerce.number().min(0.01, "Kuantitas harus lebih dari 0"),
  unitPrice: z.coerce.number().min(0, "Harga tidak boleh negatif"),
  notes: z.string().optional(),
});

const contractFormSchema = z.object({
  buyerId: z.string().min(1, "Buyer wajib dipilih"),
  contractDate: z.string().min(1, "Tanggal kontrak wajib diisi"),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi"),
  endDate: z.string().min(1, "Tanggal berakhir wajib diisi"),
  deliveryDate: z.string().min(1, "Tanggal pengiriman wajib diisi"),
  deliveryAddress: z.string().min(1, "Alamat pengiriman wajib diisi"),
  notes: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"]),
  items: z.array(contractItemSchema).min(1, "Minimal 1 item produk"),
});

type ContractFormData = z.infer<typeof contractFormSchema>;

type Buyer = {
  id: string;
  code: string;
  name: string;
  taxStatus: string;
};

type Material = {
  id: string;
  code: string;
  name: string;
  satuan: {
    name: string;
    symbol: string;
  };
};

type ContractFormProps = {
  initialData?: any;
  mode?: "create" | "edit";
};

const taxRates: Record<string, number> = {
  NON_PKP: 0,
  PKP_11: 0.11,
  PKP_1_1: 0.011,
};

export function ContractForm({ initialData, mode = "create" }: ContractFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<Buyer | null>(null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContractFormData>({
    resolver: zodResolver(contractFormSchema),
    defaultValues: {
      buyerId: initialData?.buyerId || "",
      contractDate: initialData?.contractDate
        ? new Date(initialData.contractDate).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      startDate: initialData?.startDate
        ? new Date(initialData.startDate).toISOString().split("T")[0]
        : "",
      endDate: initialData?.endDate
        ? new Date(initialData.endDate).toISOString().split("T")[0]
        : "",
      deliveryDate: initialData?.deliveryDate
        ? new Date(initialData.deliveryDate).toISOString().split("T")[0]
        : "",
      deliveryAddress: initialData?.deliveryAddress || "",
      notes: initialData?.notes || "",
      status: initialData?.status || "DRAFT",
      items: initialData?.contractItems || [
        { materialId: "", quantity: 0, unitPrice: 0, notes: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const items = watch("items");
  const buyerId = watch("buyerId");

  // Fetch buyers and materials
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [buyersRes, materialsRes] = await Promise.all([
          fetch("/api/pt-pks/buyer?dropdown=true"),
          fetch("/api/pt-pks/material?dropdown=true"),
        ]);

        if (buyersRes.ok) {
          const buyersData = await buyersRes.json();
          setBuyers(buyersData.buyers || []);
        }

        if (materialsRes.ok) {
          const materialsData = await materialsRes.json();
          setMaterials(materialsData.materials || []);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  // Set selected buyer when buyerId changes
  useEffect(() => {
    const buyer = buyers.find((b) => b.id === buyerId);
    setSelectedBuyer(buyer || null);
  }, [buyerId, buyers]);

  // Calculate totals
  const subtotal = items.reduce((sum: number, item: any) => {
    const total = (item.quantity || 0) * (item.unitPrice || 0);
    return sum + total;
  }, 0);

  const taxRate = selectedBuyer ? taxRates[selectedBuyer.taxStatus] || 0 : 0;
  const taxAmount = subtotal * taxRate;
  const totalAmount = subtotal + taxAmount;

  const onSubmit = async (data: ContractFormData) => {
    setLoading(true);
    try {
      const url =
        mode === "create"
          ? "/api/pt-pks/contract"
          : `/api/pt-pks/contract/${initialData?.id}`;
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save contract");
      }

      router.push("/dashboard/pt-pks/master/buyer");
      router.refresh();
    } catch (error: any) {
      console.error("Error saving contract:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getMaterialById = (id: string) => {
    return materials.find((m) => m.id === id);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informasi Buyer */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Buyer</CardTitle>
          <CardDescription>Pilih buyer untuk kontrak ini</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="buyerId">
              Buyer <span className="text-destructive">*</span>
            </Label>
            <Select
              value={buyerId}
              onValueChange={(value) => setValue("buyerId", value)}
              disabled={mode === "edit"}
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
            {errors.buyerId && (
              <p className="text-sm text-destructive">{errors.buyerId.message}</p>
            )}
          </div>

          {selectedBuyer && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <p className="font-medium">{selectedBuyer.name}</p>
              <p className="text-sm text-muted-foreground">
                Status Pajak:{" "}
                <Badge variant="outline">
                  {selectedBuyer.taxStatus === "NON_PKP"
                    ? "Non PKP"
                    : selectedBuyer.taxStatus === "PKP_11"
                    ? "PKP 11%"
                    : "PKP 1.1%"}
                </Badge>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informasi Kontrak */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Kontrak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contractDate">
                Tanggal Kontrak <span className="text-destructive">*</span>
              </Label>
              <Input
                id="contractDate"
                type="date"
                {...register("contractDate")}
              />
              {errors.contractDate && (
                <p className="text-sm text-destructive">
                  {errors.contractDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryDate">
                Tanggal Pengiriman <span className="text-destructive">*</span>
              </Label>
              <Input
                id="deliveryDate"
                type="date"
                {...register("deliveryDate")}
              />
              {errors.deliveryDate && (
                <p className="text-sm text-destructive">
                  {errors.deliveryDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">
                Tanggal Mulai <span className="text-destructive">*</span>
              </Label>
              <Input id="startDate" type="date" {...register("startDate")} />
              {errors.startDate && (
                <p className="text-sm text-destructive">
                  {errors.startDate.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">
                Tanggal Berakhir <span className="text-destructive">*</span>
              </Label>
              <Input id="endDate" type="date" {...register("endDate")} />
              {errors.endDate && (
                <p className="text-sm text-destructive">
                  {errors.endDate.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deliveryAddress">
              Alamat Pengiriman <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="deliveryAddress"
              {...register("deliveryAddress")}
              placeholder="Alamat lengkap pengiriman"
              rows={3}
            />
            {errors.deliveryAddress && (
              <p className="text-sm text-destructive">
                {errors.deliveryAddress.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Catatan tambahan (opsional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">
              Status <span className="text-destructive">*</span>
            </Label>
            <Select
              value={watch("status")}
              onValueChange={(value) =>
                setValue("status", value as any)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Aktif</SelectItem>
                <SelectItem value="COMPLETED">Selesai</SelectItem>
                <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Item Produk */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Item Produk</CardTitle>
              <CardDescription>
                Produk yang dibeli dalam kontrak ini
              </CardDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ materialId: "", quantity: 0, unitPrice: 0, notes: "" })
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Tambah Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Produk</TableHead>
                  <TableHead>Kuantitas</TableHead>
                  <TableHead>Harga Satuan</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field: any, index: number) => {
                  const material = getMaterialById(items[index]?.materialId || "");
                  const total =
                    (items[index]?.quantity || 0) * (items[index]?.unitPrice || 0);

                  return (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Select
                          value={items[index]?.materialId || ""}
                          onValueChange={(value) =>
                            setValue(`items.${index}.materialId`, value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih produk" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map((mat) => (
                              <SelectItem key={mat.id} value={mat.id}>
                                {mat.code} - {mat.name} ({mat.satuan.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.items?.[index]?.materialId && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.items[index]?.materialId?.message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            step="0.01"
                            {...register(`items.${index}.quantity` as const, {
                              valueAsNumber: true,
                            })}
                            className="w-24"
                          />
                          {material && (
                            <span className="text-sm text-muted-foreground">
                              {material.satuan.symbol}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          {...register(`items.${index}.unitPrice` as const, {
                            valueAsNumber: true,
                          })}
                          className="w-32"
                          placeholder="0"
                        />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          Rp {total.toLocaleString("id-ID")}
                        </span>
                      </TableCell>
                      <TableCell>
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          {errors.items && (
            <p className="text-sm text-destructive mt-2">
              {errors.items.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Total */}
      <Card>
        <CardHeader>
          <CardTitle>Ringkasan Harga</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-lg">
            <span>Subtotal:</span>
            <span className="font-medium">
              Rp {subtotal.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between text-lg">
            <span>
              Pajak ({taxRate * 100}%):
            </span>
            <span className="font-medium">
              Rp {taxAmount.toLocaleString("id-ID")}
            </span>
          </div>
          <div className="flex justify-between text-xl font-bold border-t pt-3">
            <span>Total:</span>
            <span>Rp {totalAmount.toLocaleString("id-ID")}</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Batal
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            "Simpan Kontrak"
          )}
        </Button>
      </div>
    </form>
  );
}

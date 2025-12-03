"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { CalendarIcon, Scale } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PengirimanFormData } from "./pengiriman-wizard";

type Step4Props = {
  data: Partial<PengirimanFormData>;
  onUpdate: (data: Partial<PengirimanFormData>) => void;
  onNext: () => void;
  onBack: () => void;
};

export function PengirimanStep4({ data, onUpdate, onNext, onBack }: Step4Props) {
  const [formData, setFormData] = useState({
    metodeGross: data.metodeGross || ("MANUAL" as "MANUAL" | "SISTEM_TIMBANGAN"),
    beratGross: data.beratGross || 0,
    waktuTimbangGross: data.waktuTimbangGross || new Date(),
  });

  const beratTarra = data.beratTarra || 0;
  const beratNetto = formData.beratGross - beratTarra;

  const handleNext = () => {
    if (formData.beratGross <= 0) {
      alert("Berat gross harus lebih dari 0");
      return;
    }

    if (formData.beratGross <= beratTarra) {
      alert("Berat gross harus lebih besar dari berat tarra");
      return;
    }

    onUpdate(formData);
    onNext();
  };

  const handleTimbangOtomatis = () => {
    // Simulasi baca dari timbangan otomatis
    // Dalam implementasi nyata, ini akan berkomunikasi dengan hardware timbangan
    const beratSimulasi = Math.floor(Math.random() * 15000) + (beratTarra + 5000); // Gross harus lebih besar dari tarra
    setFormData({
      ...formData,
      beratGross: beratSimulasi,
      waktuTimbangGross: new Date(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="font-semibold text-green-900 mb-2">ℹ️ Informasi Timbangan Gross</h3>
        <p className="text-sm text-green-800">
          Timbangan <strong>Gross</strong> adalah penimbangan truck dalam kondisi <strong>berisi muatan</strong>.
          Berat netto akan dihitung otomatis: <strong>Gross - Tarra = Netto</strong>
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <p className="text-muted-foreground">Berat Tarra (Truck Kosong):</p>
          <p className="font-semibold text-blue-900">{beratTarra.toLocaleString("id-ID")} Kg</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Metode Input Gross *</Label>
          <RadioGroup
            value={formData.metodeGross}
            onValueChange={(value: "MANUAL" | "SISTEM_TIMBANGAN") =>
              setFormData({ ...formData, metodeGross: value })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="MANUAL" id="manual-gross" />
              <Label htmlFor="manual-gross" className="font-normal cursor-pointer">
                Input Manual
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="SISTEM_TIMBANGAN" id="otomatis-gross" />
              <Label htmlFor="otomatis-gross" className="font-normal cursor-pointer">
                Sistem Timbangan Otomatis
              </Label>
            </div>
          </RadioGroup>
        </div>

        {formData.metodeGross === "SISTEM_TIMBANGAN" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-900">Timbangan Siap</p>
                <p className="text-sm text-green-700">
                  Klik tombol untuk membaca berat dari sistem timbangan
                </p>
              </div>
              <Button
                type="button"
                onClick={handleTimbangOtomatis}
                className="flex items-center gap-2"
              >
                <Scale className="h-4 w-4" />
                Baca Timbangan
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="beratGross">Berat Gross (Truck + Muatan) *</Label>
          <div className="flex gap-2">
            <Input
              id="beratGross"
              type="number"
              placeholder="0"
              value={formData.beratGross || ""}
              onChange={(e) =>
                setFormData({ ...formData, beratGross: parseFloat(e.target.value) || 0 })
              }
              disabled={formData.metodeGross === "SISTEM_TIMBANGAN"}
              step="0.01"
            />
            <div className="flex items-center px-4 border rounded-md bg-muted">
              <span className="text-sm font-medium">Kg</span>
            </div>
          </div>
          {formData.beratGross > 0 && (
            <p className="text-sm text-muted-foreground">
              {formData.beratGross.toLocaleString("id-ID", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              Kg
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="waktuTimbangGross">Waktu Timbang Gross *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.waktuTimbangGross && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.waktuTimbangGross ? (
                  format(formData.waktuTimbangGross, "PPP HH:mm:ss", { locale: idLocale })
                ) : (
                  <span>Pilih waktu</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.waktuTimbangGross}
                onSelect={(date) =>
                  setFormData({ ...formData, waktuTimbangGross: date || new Date() })
                }
                initialFocus
              />
              <div className="p-3 border-t">
                <Input
                  type="time"
                  step="1"
                  value={format(formData.waktuTimbangGross, "HH:mm:ss")}
                  onChange={(e) => {
                    const [hours = "0", minutes = "0", seconds = "0"] = e.target.value.split(":");
                    const newDate = new Date(formData.waktuTimbangGross);
                    newDate.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));
                    setFormData({ ...formData, waktuTimbangGross: newDate });
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {formData.beratGross > 0 && (
        <div className="border rounded-lg p-4 bg-gradient-to-br from-green-50 to-blue-50">
          <h4 className="font-semibold mb-3 text-lg">Ringkasan Penimbangan</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <p className="text-muted-foreground">Berat Tarra:</p>
            <p className="font-medium">{beratTarra.toLocaleString("id-ID")} Kg</p>
            
            <p className="text-muted-foreground">Berat Gross:</p>
            <p className="font-medium">{formData.beratGross.toLocaleString("id-ID")} Kg</p>
            
            <p className="text-muted-foreground font-semibold text-base pt-2 border-t">Berat Netto:</p>
            <p className="font-bold text-base text-primary pt-2 border-t">
              {beratNetto > 0 ? beratNetto.toLocaleString("id-ID") : "0"} Kg
            </p>
            
            <p className="text-muted-foreground">Metode:</p>
            <p className="font-medium">
              {formData.metodeGross === "MANUAL" ? "Input Manual" : "Sistem Timbangan"}
            </p>
            
            <p className="text-muted-foreground">Waktu Timbang:</p>
            <p className="font-medium">
              {format(formData.waktuTimbangGross, "dd MMM yyyy HH:mm:ss", { locale: idLocale })}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Kembali
        </Button>
        <Button onClick={handleNext} disabled={beratNetto <= 0}>
          Lanjut ke Mutu Kernel
        </Button>
      </div>
    </div>
  );
}

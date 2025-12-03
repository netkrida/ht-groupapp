"use client";

import { useState, useEffect } from "react";
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

type Step3Props = {
  data: Partial<PengirimanFormData>;
  onUpdate: (data: Partial<PengirimanFormData>) => void;
  onNext: () => void;
  onBack: () => void;
};

export function PengirimanStep3({ data, onUpdate, onNext, onBack }: Step3Props) {
  const [formData, setFormData] = useState({
    metodeTarra: data.metodeTarra || ("MANUAL" as "MANUAL" | "SISTEM_TIMBANGAN"),
    beratTarra: data.beratTarra || 0,
    waktuTimbangTarra: data.waktuTimbangTarra || new Date(),
  });

  const handleNext = () => {
    if (formData.beratTarra <= 0) {
      alert("Berat tarra harus lebih dari 0");
      return;
    }

    onUpdate(formData);
    onNext();
  };

  const handleTimbangOtomatis = () => {
    // Simulasi baca dari timbangan otomatis
    // Dalam implementasi nyata, ini akan berkomunikasi dengan hardware timbangan
    const beratSimulasi = Math.floor(Math.random() * 5000) + 3000; // 3000-8000 kg
    setFormData({
      ...formData,
      beratTarra: beratSimulasi,
      waktuTimbangTarra: new Date(),
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Informasi Timbangan Tarra</h3>
        <p className="text-sm text-blue-800">
          Timbangan <strong>Tarra</strong> adalah penimbangan truck dalam kondisi <strong>kosong</strong> (tanpa muatan).
          Berat ini akan dikurangkan dari berat gross untuk mendapatkan berat netto product.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Metode Input Tarra *</Label>
          <RadioGroup
            value={formData.metodeTarra}
            onValueChange={(value: "MANUAL" | "SISTEM_TIMBANGAN") =>
              setFormData({ ...formData, metodeTarra: value })
            }
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="MANUAL" id="manual" />
              <Label htmlFor="manual" className="font-normal cursor-pointer">
                Input Manual
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="SISTEM_TIMBANGAN" id="otomatis" />
              <Label htmlFor="otomatis" className="font-normal cursor-pointer">
                Sistem Timbangan Otomatis
              </Label>
            </div>
          </RadioGroup>
        </div>

        {formData.metodeTarra === "SISTEM_TIMBANGAN" && (
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
          <Label htmlFor="beratTarra">Berat Tarra (Truck Kosong) *</Label>
          <div className="flex gap-2">
            <Input
              id="beratTarra"
              type="number"
              placeholder="0"
              value={formData.beratTarra || ""}
              onChange={(e) =>
                setFormData({ ...formData, beratTarra: parseFloat(e.target.value) || 0 })
              }
              disabled={formData.metodeTarra === "SISTEM_TIMBANGAN"}
              step="0.01"
            />
            <div className="flex items-center px-4 border rounded-md bg-muted">
              <span className="text-sm font-medium">Kg</span>
            </div>
          </div>
          {formData.beratTarra > 0 && (
            <p className="text-sm text-muted-foreground">
              {formData.beratTarra.toLocaleString("id-ID", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              Kg
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="waktuTimbangTarra">Waktu Timbang Tarra *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.waktuTimbangTarra && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.waktuTimbangTarra ? (
                  format(formData.waktuTimbangTarra, "PPP HH:mm:ss", { locale: idLocale })
                ) : (
                  <span>Pilih waktu</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.waktuTimbangTarra}
                onSelect={(date) =>
                  setFormData({ ...formData, waktuTimbangTarra: date || new Date() })
                }
                initialFocus
              />
              <div className="p-3 border-t">
                <Input
                  type="time"
                  step="1"
                  value={format(formData.waktuTimbangTarra, "HH:mm:ss")}
                  onChange={(e) => {
                    const [hours = "0", minutes = "0", seconds = "0"] = e.target.value.split(":");
                    const newDate = new Date(formData.waktuTimbangTarra);
                    newDate.setHours(parseInt(hours), parseInt(minutes), parseInt(seconds));
                    setFormData({ ...formData, waktuTimbangTarra: newDate });
                  }}
                />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {formData.beratTarra > 0 && (
        <div className="border rounded-lg p-4 bg-muted/50">
          <h4 className="font-semibold mb-2">Ringkasan Timbangan Tarra</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <p className="text-muted-foreground">Metode:</p>
            <p className="font-medium">
              {formData.metodeTarra === "MANUAL" ? "Input Manual" : "Sistem Timbangan"}
            </p>
            <p className="text-muted-foreground">Berat Tarra:</p>
            <p className="font-medium">{formData.beratTarra.toLocaleString("id-ID")} Kg</p>
            <p className="text-muted-foreground">Waktu Timbang:</p>
            <p className="font-medium">
              {format(formData.waktuTimbangTarra, "dd MMM yyyy HH:mm:ss", { locale: idLocale })}
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Kembali
        </Button>
        <Button onClick={handleNext}>
          Lanjut ke Timbangan Gross
        </Button>
      </div>
    </div>
  );
}

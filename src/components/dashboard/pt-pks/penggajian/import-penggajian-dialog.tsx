"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ImportDialogProps = {
  onSuccess?: () => void;
};

const bulanOptions = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

// Generate tahun options (5 years back and 1 year forward)
const currentYear = new Date().getFullYear();
const tahunOptions = Array.from({ length: 7 }, (_, i) => ({
  value: String(currentYear - 5 + i),
  label: String(currentYear - 5 + i),
}));

export function ImportPenggajianDialog({ onSuccess }: ImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [periodeBulan, setPeriodeBulan] = useState<string>("");
  const [periodeTahun, setPeriodeTahun] = useState<string>(String(currentYear));
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (
        droppedFile.name.endsWith(".xlsx") ||
        droppedFile.name.endsWith(".xls")
      ) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("File harus berformat Excel (.xlsx atau .xls)");
      }
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (
        selectedFile.name.endsWith(".xlsx") ||
        selectedFile.name.endsWith(".xls")
      ) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("File harus berformat Excel (.xlsx atau .xls)");
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Pilih file Excel terlebih dahulu");
      return;
    }
    if (!periodeBulan || !periodeTahun) {
      setError("Pilih periode bulan dan tahun");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("periodeBulan", periodeBulan);
      formData.append("periodeTahun", periodeTahun);
      formData.append("replaceExisting", replaceExisting.toString());

      const response = await fetch("/api/pt-pks/penggajian/import", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Gagal mengimport data");
      }

      setSuccess(data.message);
      
      // Clear form and close after delay
      setTimeout(() => {
        setFile(null);
        setPeriodeBulan("");
        setReplaceExisting(false);
        setOpen(false);
        setSuccess(null);
        onSuccess?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPeriodeBulan("");
    setReplaceExisting(false);
    setError(null);
    setSuccess(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Import Data Penggajian</DialogTitle>
          <DialogDescription>
            Upload file Excel untuk mengimport data penggajian karyawan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Periode Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="periodeBulan">Periode Bulan</Label>
              <Select value={periodeBulan} onValueChange={setPeriodeBulan}>
                <SelectTrigger id="periodeBulan">
                  <SelectValue placeholder="Pilih bulan" />
                </SelectTrigger>
                <SelectContent>
                  {bulanOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodeTahun">Periode Tahun</Label>
              <Select value={periodeTahun} onValueChange={setPeriodeTahun}>
                <SelectTrigger id="periodeTahun">
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  {tahunOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* File Drop Zone */}
          <div className="space-y-2">
            <Label>File Excel</Label>
            <div
              className={cn(
                "relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50",
                file && "border-green-500 bg-green-50 dark:bg-green-950/20"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet className="h-10 w-10 text-green-600" />
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="text-sm font-medium">
                    Drag & drop file Excel di sini
                  </p>
                  <p className="text-xs text-muted-foreground">
                    atau klik untuk memilih file (.xlsx, .xls)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Replace Existing Option */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="replaceExisting"
              checked={replaceExisting}
              onCheckedChange={(checked) =>
                setReplaceExisting(checked as boolean)
              }
            />
            <Label
              htmlFor="replaceExisting"
              className="text-sm font-normal cursor-pointer"
            >
              Hapus data periode yang sama sebelum import
            </Label>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <p className="text-sm">{success}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleImport} disabled={loading || !file}>
            {loading ? "Mengimport..." : "Import Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TankVisualizationProps {
  namaTangki: string;
  kapasitas: number;
  isiSaatIni: number;
  satuan: string;
  onTankClick?: () => void;
  className?: string;
}

export function TankVisualization({
  namaTangki,
  kapasitas,
  isiSaatIni,
  satuan,
  onTankClick,
  className,
}: TankVisualizationProps) {
  const percentage = Math.min((isiSaatIni / kapasitas) * 100, 100);
  const isEmpty = isiSaatIni === 0;
  const isFull = percentage >= 95;
  const isLow = percentage < 20 && !isEmpty;

  // Color based on fill level
  const getColor = () => {
    if (isEmpty) return "bg-gray-200";
    if (isFull) return "bg-red-500";
    if (isLow) return "bg-yellow-500";
    return "bg-blue-500";
  };

  const getGradientColor = () => {
    if (isEmpty) return "from-gray-200 to-gray-300";
    if (isFull) return "from-red-400 to-red-600";
    if (isLow) return "from-yellow-400 to-yellow-600";
    return "from-blue-400 to-blue-600";
  };

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-lg hover:scale-105",
        className,
      )}
      onClick={onTankClick}
    >
      <CardContent className="p-6">
        {/* Tank Name */}
        <div className="mb-4 text-center">
          <h3 className="font-bold text-lg">{namaTangki}</h3>
          <p className="text-sm text-muted-foreground">
            {isiSaatIni.toLocaleString("id-ID")} / {kapasitas.toLocaleString("id-ID")} {satuan}
          </p>
        </div>

        {/* Tank Visual */}
        <div className="flex flex-col items-center">
          {/* Tank Top Cap */}
          <div className="w-32 h-6 bg-gray-400 rounded-t-lg border-2 border-gray-500" />
          
          {/* Tank Body Container */}
          <div className="relative w-32 h-48 bg-gray-200 border-4 border-gray-400 rounded-b-lg overflow-hidden">
            {/* Liquid Level */}
            <div
              className={cn(
                "absolute bottom-0 left-0 right-0 transition-all duration-500",
                `bg-gradient-to-t ${getGradientColor()}`,
              )}
              style={{ height: `${percentage}%` }}
            >
              {/* Wave Effect */}
              {!isEmpty && (
                <div className="absolute top-0 left-0 right-0 h-2 bg-white opacity-30 rounded-full" />
              )}
            </div>

            {/* Percentage Text Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-white/80 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
                <p className="text-2xl font-bold text-gray-800">
                  {percentage.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Volume Markers */}
            <div className="absolute left-0 right-0 top-0 h-full pointer-events-none">
              {[75, 50, 25].map((marker) => (
                <div
                  key={marker}
                  className="absolute left-0 right-0 border-t border-gray-400 border-dashed opacity-50"
                  style={{ top: `${100 - marker}%` }}
                >
                  <span className="absolute -left-8 -top-2 text-xs text-gray-600">
                    {marker}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tank Base */}
          <div className="w-36 h-4 bg-gray-500 rounded-b-md border-2 border-gray-600 shadow-lg" />
        </div>

        {/* Status Badge */}
        <div className="mt-4 text-center">
          {isEmpty && (
            <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
              Kosong
            </span>
          )}
          {isFull && (
            <span className="inline-block px-3 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
              Penuh
            </span>
          )}
          {isLow && (
            <span className="inline-block px-3 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded-full">
              Stock Rendah
            </span>
          )}
          {!isEmpty && !isFull && !isLow && (
            <span className="inline-block px-3 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              Normal
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

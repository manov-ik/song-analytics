import React, { useRef, useEffect } from "react";

interface MelHeatmapProps {
  grid: number[][];    // [n_mels][n_cols]  values in range [-80, 0]
}

const MAGMA = [
  [0, 0, 4], [1, 0, 5], [4, 0, 6], [8, 0, 7], [14, 0, 9], [20, 1, 11],
  [27, 1, 14], [35, 2, 17], [44, 3, 20], [54, 4, 24], [64, 5, 29],
  [75, 6, 34], [87, 8, 40], [100, 10, 47], [114, 12, 55], [128, 14, 62],
  [143, 18, 69], [158, 22, 76], [174, 27, 83], [189, 33, 89], [204, 39, 95],
  [218, 48, 100], [231, 58, 105], [241, 70, 107], [250, 84, 108],
  [254, 100, 107], [254, 116, 105], [254, 132, 103], [254, 148, 103],
  [254, 164, 107], [253, 180, 114], [252, 196, 122], [252, 212, 132],
  [252, 228, 144], [253, 243, 157], [252, 255, 164],
];

function magmaColor(norm: number): [number, number, number] {
  const idx = Math.min(MAGMA.length - 1, Math.floor(norm * (MAGMA.length - 1)));
  return MAGMA[idx] as [number, number, number];
}

export default React.memo(function MelHeatmap({ grid }: MelHeatmapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !grid.length) return;
    const nMels = grid.length;
    const nCols = grid[0].length;
    const canvas = canvasRef.current;
    canvas.width = nCols;
    canvas.height = nMels;
    const ctx = canvas.getContext("2d")!;
    const imageData = ctx.createImageData(nCols, nMels);

    for (let row = 0; row < nMels; row++) {
      for (let col = 0; col < nCols; col++) {
        const val = grid[nMels - 1 - row][col]; // flip vertically
        const norm = Math.max(0, Math.min(1, (val + 80) / 80)); // map [-80,0] -> [0,1]
        const [r, g, b] = magmaColor(norm);
        const px = (row * nCols + col) * 4;
        imageData.data[px]     = r;
        imageData.data[px + 1] = g;
        imageData.data[px + 2] = b;
        imageData.data[px + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }, [grid]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-lg"
      style={{ imageRendering: "pixelated", height: 280 }}
    />
  );
});

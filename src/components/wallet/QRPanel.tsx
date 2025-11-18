import { useEffect, useRef } from 'react';

interface QRPanelProps {
  data: string;
  size?: number;
}

export function QRPanel({ data, size = 200 }: QRPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Simple QR code representation (placeholder visual)
    const moduleSize = 8;
    const modules = Math.floor(size / moduleSize);
    
    canvas.width = size;
    canvas.height = size;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Create pattern (simplified QR visualization)
    ctx.fillStyle = '#0B0F1A';
    for (let i = 0; i < modules; i++) {
      for (let j = 0; j < modules; j++) {
        // Create a pseudo-random pattern based on data
        const hash = (i * 7 + j * 13 + data.length) % 3;
        if (hash === 0) {
          ctx.fillRect(i * moduleSize, j * moduleSize, moduleSize, moduleSize);
        }
      }
    }

    // Corner squares (QR positioning markers)
    const cornerSize = moduleSize * 7;
    const drawCorner = (x: number, y: number) => {
      ctx.fillStyle = '#0B0F1A';
      ctx.fillRect(x, y, cornerSize, cornerSize);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x + moduleSize, y + moduleSize, cornerSize - 2 * moduleSize, cornerSize - 2 * moduleSize);
      ctx.fillStyle = '#0B0F1A';
      ctx.fillRect(x + 2 * moduleSize, y + 2 * moduleSize, cornerSize - 4 * moduleSize, cornerSize - 4 * moduleSize);
    };

    drawCorner(0, 0);
    drawCorner(size - cornerSize, 0);
    drawCorner(0, size - cornerSize);
  }, [data, size]);

  return (
    <div className="relative inline-block">
      <div className="absolute -inset-2 bg-gradient-to-br from-[#00FFA3]/30 to-[#06B6D4]/30 blur-lg rounded-xl"></div>
      <div className="relative bg-white p-4 rounded-xl">
        <canvas ref={canvasRef} className="block" />
      </div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#00FFA3] rounded-lg flex items-center justify-center pointer-events-none">
        <svg className="w-8 h-8 text-[#0B0F1A]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"/>
        </svg>
      </div>
    </div>
  );
}

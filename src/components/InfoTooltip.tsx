import { Info } from "lucide-react";

export default function InfoTooltip({ text }: { text: string }) {
  return (
    <div className="group relative inline-block ml-2 align-middle">
      <Info className="w-3.5 h-3.5 text-gray-400 hover:text-orange-500 cursor-help transition-colors" />
      <div className="absolute hidden group-hover:block z-50 w-64 p-3 mt-2 bg-gray-900 text-white text-[11px] leading-relaxed rounded-md shadow-xl -left-28 before:content-[''] before:absolute before:bottom-full before:left-[116px] before:border-4 before:border-transparent before:border-b-gray-900">
        {text}
      </div>
    </div>
  );
}

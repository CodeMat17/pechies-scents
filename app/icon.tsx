import { ImageResponse } from "next/og";
import { Monogram } from "@/lib/monogram";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<Monogram size={512} radius={0} />, size);
}

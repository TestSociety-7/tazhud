import type { MetadataRoute } from "next";
import { appManifest } from "@/lib/pwa";

export default function manifest(): MetadataRoute.Manifest {
  return appManifest("store");
}

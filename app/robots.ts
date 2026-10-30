// Ingen innlogging ennå → be søkemotorer holde seg unna (i tillegg til noindex i layout).
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}

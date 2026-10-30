// Lar `node --test` kjøre lib/*.test.ts direkte: Node stripper TypeScript selv,
// men krever filendelse på relative importer — Next/TS-koden skriver dem uten.
// Hooken prøver «.ts» når en relativ import uten endelse ikke finnes.
import { register } from "node:module";
import { isMainThread } from "node:worker_threads";

if (isMainThread) register(import.meta.url);

export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (e) {
    if (specifier.startsWith(".") && !/\.[cm]?[jt]sx?$/.test(specifier))
      return next(`${specifier}.ts`, context);
    throw e;
  }
}

// Versjon i footeren, koblet til package.json: «1.0.0» → «v1.0» (major.minor).
// Kun server — package.json havner dermed ikke i klient-bundelen.
import "server-only";
import pkg from "../package.json";

const [major, minor] = pkg.version.split(".");
export const APP_VERSION = `v${major}.${minor}`;

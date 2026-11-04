import "reflect-metadata";
import * as fs from "node:fs";
import * as XLSX from "xlsx";

// Vitest loads the ESM build of xlsx, which needs fs handed to it for readFile/writeFile.
// The published CLIs are CommonJS and load the CJS build, which brings its own fs.
XLSX.set_fs(fs);

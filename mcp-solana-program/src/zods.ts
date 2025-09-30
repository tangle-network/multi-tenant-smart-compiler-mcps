import { z } from "zod";

export const zSvmProgramId = z
  .string()
  .regex(/^[1-9A-HJ-NP-Za-km-z]{43,44}$/, "Invalid Solana program ID format");

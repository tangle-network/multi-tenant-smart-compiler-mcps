import path from "path";
import { z } from "zod";

const DEFAULT_PROJECT_ID = "default_project";

// Base validation function
const validateProjectId = (val: string) =>
  !val.includes("..") && !path.isAbsolute(val) && !/[;&|`$(){}[\]\\]/.test(val);

export const zProjectId = z
  .string()
  .describe(
    "The project ID to use. This is the relative path to the project from the projects root directory. Default is 'default_project'."
  )
  .refine(validateProjectId, {
    message:
      "Project ID must be a relative path without '..' segments or unsafe characters",
  })
  .transform((val) => (val.length > 0 ? val : DEFAULT_PROJECT_ID));


export const zTerminalId = z
  .string()
  .describe(
    "The terminalId to use. It can be created when users create new project by `create-project` tool, or directly by `create-terminal` tool. When created, it will go to specified project directory. Users can also view all owned terminals by `list-terminal` tool. When killed, it will be removed from the system.",
  );

export const zBlockchainNetwork = z
  .enum(["localnet", "testnet", "mainnet"])
  .describe("The network to deploy to. mainnet | testnet | localnet");

export type BlockchainNetworkType = z.infer<typeof zBlockchainNetwork>;

export const zEthereumAddress = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format")
  .describe(
    "Ethereum address, e.g. 0x1234567890123456789012345678901234567890"
  );

export type EthereumAddress = z.infer<typeof zEthereumAddress>;

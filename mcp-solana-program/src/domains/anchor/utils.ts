import { execAsync } from "mcp-fs";

export function normalizeNetwork(network: string) {
  if (network === "mainnet") {
    return "mainnet-beta";
  }
  if (network === "testnet") {
    return "devnet";
  }
  return network;
}

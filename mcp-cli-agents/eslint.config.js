import { base } from "@blueprint-agent/eslint-config";

export default [
  ...base,
  {
    ignores: ["dist/**", "node_modules/**"],
  },
];

#!/bin/bash

# Create the .sui directory if it doesn't exist
mkdir -p $HOME/.sui/sui_config

cat <<EOF > $HOME/.sui/sui_config/client.yaml
---
keystore:
  File: $HOME/.sui/sui_config/sui.keystore
envs:
  - alias: testnet
    rpc: "https://fullnode.testnet.sui.io:443"
    ws: ~
    basic_auth: ~
  - alias: mainnet
    rpc: "https://fullnode.mainnet.sui.io:443"
    ws: ~
    basic_auth: ~
  - alias: localnet
    rpc: "http://127.0.0.1:9000"
    ws: ~
    basic_auth: ~
active_env: testnet
active_address: "0xe3376f6b52240c75f76f829867ebca124daf644348d87632120a31c6229acac0"
EOF


cat <<EOF > $HOME/.sui/sui_config/sui.aliases
[
  {
    "alias": "vigorous-diamond",
    "public_key_base64": "ANLcIweASTzh0E58ZhofFjAvV8zkNcaXcBSpYnjO9AM0"
  }
]
EOF

cat <<EOF > $HOME/.sui/sui_config/sui.keystore
[
  "AGx2DDGnWeQwuJ/UuSqgMwyDghIKjji/qlkE2lA7VpHc"
]
EOF
#!/bin/bash

MAIN_KEYSTORE_NAME="main-keystore"

sui client new-address ed25519 $MAIN_KEYSTORE_NAME
sui client switch --address $MAIN_KEYSTORE_NAME

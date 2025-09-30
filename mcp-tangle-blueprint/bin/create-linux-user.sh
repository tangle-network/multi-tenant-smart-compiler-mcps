#!/bin/bash

USERNAME=$1

if id "$USERNAME" &>/dev/null; then
  echo "User $USERNAME already exists."
  exit 0
fi

set -eux;

# --- group & user -------------------------------------------------------
useradd -m -g external-users -s /bin/bash $USERNAME;

# --- Yarn tool-chains -------------------------------------------------
mkdir -p /home/$USERNAME/.cache/node/corepack;
if [ -d "/root/.cache/node/corepack" ] && [ "$(ls -A /root/.cache/node/corepack 2>/dev/null)" ]; then
  cp -r /root/.cache/node/corepack/* /home/$USERNAME/.cache/node/corepack/;
fi
chown -R $USERNAME:external-users /home/$USERNAME/.cache;

# --- Rustup tool-chains -------------------------------------------------
mkdir -p /home/$USERNAME/.rustup;
chown -R $USERNAME:external-users /home/$USERNAME/.rustup
if [ -d "/usr/local/rustup" ] && [ "$(ls -A /usr/local/rustup 2>/dev/null)" ]; then
  cp -a /usr/local/rustup/* /home/$USERNAME/.rustup/;
fi

# --- Solc tool-chains -------------------------------------------------
mkdir -p /home/$USERNAME/.solc-select /home/$USERNAME/.svm/ /home/$USERNAME/.mythril;
if [ -d "/root/.solc-select" ] && [ "$(ls -A /root/.solc-select 2>/dev/null)" ]; then
  cp -a /root/.solc-select/* /home/$USERNAME/.solc-select/;
fi
if [ -d "/root/.svm" ] && [ "$(ls -A /root/.svm 2>/dev/null)" ]; then
  cp -a /root/.svm/* /home/$USERNAME/.svm/;
fi
if [ -d "/root/.mythril" ] && [ "$(ls -A /root/.mythril 2>/dev/null)" ]; then
  cp -a /root/.mythril/* /home/$USERNAME/.mythril/;
fi
chown -R $USERNAME:external-users /home/$USERNAME/.solc-select /home/$USERNAME/.svm/ /home/$USERNAME/.mythril;

# --- Specify cargo cache dir -----------------------------------------------------
mkdir -p /home/$USERNAME/.cargo;
chown -R $USERNAME:external-users /home/$USERNAME/.cargo

# --- /etc/profile.d entry (login / interactive shells) -----------------
printf '%s\n' \
'export CARGO_HOME=~/.cargo' \
'export RUSTUP_HOME=~/.rustup' \
'export PATH=$PATH:/usr/local/cargo/bin:/usr/local/foundry/bin' \
'export PYTHONPATH=$PYTHONPATH:/usr/local/lib/python3.10/site-packages/' \
>/etc/profile.d/00-toolchains.sh;
chmod 644 /etc/profile.d/00-toolchains.sh

# --- global environment for non-interactive commands --------------------
export PATH=/usr/local/cargo/bin:/usr/local/foundry/bin:$PATH

# --- not allow other users to see current user files & folders --------------------
chmod 700 /home/$USERNAME
chmod 700 /home/$USERNAME/.cargo
chmod 700 /home/$USERNAME/.rustup
chmod 700 /home/$USERNAME/.cache
chmod 700 /home/$USERNAME/.solc-select
chmod 700 /home/$USERNAME/.svm
chmod 700 /home/$USERNAME/.mythril
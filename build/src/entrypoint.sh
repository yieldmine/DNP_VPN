#!/bin/bash

# Initialize APP
echo "Initializing App..."
node src/initializeApp.js
echo "Initialized App"

# Check in db if node has a static IP, use dynamic DNS domain instead.
# TODO: Change this function to use global vars ( _DAPPNODE_GLOBAL_HOSTNAME )
export PUBLIC_ENDPOINT="$(node src/getPublicEndpointCommand)"
echo "Fetched public endpoint: $PUBLIC_ENDPOINT"
VPNHOSTNAME=${PUBLIC_ENDPOINT}

# check and generate random CN
if [ ! -f "${OPENVPN}/cn" ]; then
    head /dev/urandom | tr -dc a-z0-9 | head -c 10 > "${OPENVPN}/cn"
fi
OVPN_CN=$(cat ${OPENVPN}/cn)
export OVPN_CN

# Initialize config and PKI
# -c: Client to Client
# -d: disable default route (disables NAT without '-N')
# -p "route 172.33.0.0 255.255.0.0": Route to push to the client

if [ ! -e "${OPENVPN_CONF}" ]; then
    ovpn_genconfig -c -d -u udp://${VPNHOSTNAME} -s 172.33.8.0/22 \
    -p "route 172.33.0.0 255.255.0.0" \
    -n "172.33.1.2"
    EASYRSA_REQ_CN=${OVPN_CN} ovpn_initpki nopass
fi

# Create admin user
if [ ! -e "${OPENVPN_ADMIN_PROFILE}" ]; then
    vpncli add ${DEFAULT_ADMIN_USER}
    vpncli get ${DEFAULT_ADMIN_USER}
    echo "ifconfig-push 172.33.10.1 255.255.252.0" > ${OPENVPN_CCD_DIR}/${DEFAULT_ADMIN_USER}
fi

# Enable Proxy ARP (needs privileges)
echo 1 > /proc/sys/net/ipv4/conf/eth0/proxy_arp

# Migrate users from v1
migrateOldUsers

# Save environment
env | sed '/affinity/d' > /etc/env.sh

# Supervisord processes:
supervisord -c supervisord.conf

#!/usr/bin/env node

// This script must return the MASTER_ADMIN credentials formated
// as a nice message in the terminal + a QR code
//
// It will be run as a separate process, maybe in a different container
// It can be run before the VPN is initialized, before the MASTER_ADMIN
// user is created, or after its link has been invalidated
//
// 1. Wait for config to be available
// 2. Wait for MASTER_ADMIN user to exist
// 3. Get the MASTER_ADMIN user URL to connect
// 4. Print a nicely formated msg with a QR code

import url from "url";
import { getRpcCall } from "./api/getRpcCall";
import { API_PORT } from "./params";
import { renderQrCode } from "./utils/renderQrCode";

/* eslint-disable no-console */

const statusTimeout = 60 * 1000;
const vpnRpcApiUrl = url.format({
  protocol: "http",
  hostname: "127.0.0.1",
  port: API_PORT,
  pathname: "rpc"
});
const api = getRpcCall(vpnRpcApiUrl);

// ### TODO: Is this still necessary?
process.on("SIGINT", () => process.exit(128));

(async function(): Promise<void> {
  await waitForOkStatus();

  const { url } = await api.getMasterAdminCred();

  console.log(`
${await renderQrCode(url)}

To connect to your DAppNode scan the QR above or copy/paste link below into your browser:
${url}`);
})();

/**
 * Wait for VPN status to be READY, use separate function to exit the while loop with return
 */
async function waitForOkStatus(): Promise<void> {
  const start = Date.now();

  while (Date.now() - start < statusTimeout) {
    const status = await api.getStatus();
    if (status.status === "READY") return;
    else console.log(`VPN not ready, status: ${status.status} ${status.msg}`);
  }
  throw Error(`Timeout`);
}

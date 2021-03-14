function getServerName(str) {
    if (!str) return "YieldMine_VPN";
    str = decodeURIComponent(str);
    const strLc = str.toLowerCase();
    if (!strLc.includes("yieldmine") && !strLc.includes("vpn"))
      return `${str}_YieldMine_VPN`;
    if (!strLc.includes("yieldmine") && strLc.includes("vpn"))
      return `${str}_YieldMine`;
    if (strLc.includes("yieldmine") && !strLc.includes("vpn"))
      return `${str}_VPN`;
    return str;
}

export default getServerName

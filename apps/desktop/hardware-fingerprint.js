const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

/**
 * Get Deterministic Windows Hardware UUID & Identifiers
 */
function getWindowsHardwareDetails() {
  let biosUuid = '';
  let cpuId = '';
  let motherboardSerial = '';

  try {
    if (process.platform === 'win32') {
      // 1. BIOS UUID
      try {
        const out = execSync('powershell -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"', { timeout: 3000, encoding: 'utf8' });
        biosUuid = out.trim();
      } catch (e) {
        // Fallback to wmic
        const out = execSync('wmic csproduct get uuid', { timeout: 3000, encoding: 'utf8' });
        biosUuid = out.replace(/UUID/gi, '').trim();
      }

      // 2. CPU ID
      try {
        const out = execSync('powershell -NoProfile -Command "(Get-CimInstance Win32_Processor).ProcessorId"', { timeout: 3000, encoding: 'utf8' });
        cpuId = out.trim();
      } catch (e) {
        // Fallback to wmic
        const out = execSync('wmic cpu get processorid', { timeout: 3000, encoding: 'utf8' });
        cpuId = out.replace(/ProcessorId/gi, '').trim();
      }

      // 3. Motherboard Serial
      try {
        const out = execSync('powershell -NoProfile -Command "(Get-CimInstance Win32_BaseBoard).SerialNumber"', { timeout: 3000, encoding: 'utf8' });
        motherboardSerial = out.trim();
      } catch (e) {
        // ignore
      }
    }
  } catch (err) {
    console.warn('[HardwareFingerprint] Native Windows hardware query notice:', err.message);
  }

  // MAC Addresses as secondary anchor
  const interfaces = os.networkInterfaces();
  const macs = [];
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (!net.internal && net.mac && net.mac !== '00:00:00:00:00:00') {
        macs.push(net.mac.toLowerCase());
      }
    }
  }
  macs.sort();

  return {
    biosUuid: biosUuid || 'GENERIC-BIOS-UUID',
    cpuId: cpuId || os.cpus()[0]?.model || 'GENERIC-CPU',
    motherboardSerial: motherboardSerial || 'GENERIC-MB',
    primaryMac: macs[0] || '00:11:22:33:44:55',
    hostname: os.hostname(),
    platform: process.platform,
    arch: process.arch,
  };
}

/**
 * Generate cryptographic hardware SHA-256 fingerprint
 * e.g. "HW-A1B2-C3D4-E5F6-7890"
 */
function generateHardwareFingerprint() {
  const details = getWindowsHardwareDetails();
  const rawSeed = `${details.biosUuid}|${details.cpuId}|${details.motherboardSerial}|${details.primaryMac}`;
  const sha256 = crypto.createHash('sha256').update(rawSeed, 'utf8').digest('hex').toUpperCase();

  const formatted = `HW-${sha256.substring(0, 4)}-${sha256.substring(4, 8)}-${sha256.substring(8, 12)}-${sha256.substring(12, 16)}`;
  return {
    fingerprint: formatted,
    rawHash: sha256,
    deviceName: details.hostname,
    platform: `${details.platform} (${details.arch})`,
    cpuModel: details.cpuId,
  };
}

module.exports = {
  getWindowsHardwareDetails,
  generateHardwareFingerprint,
};

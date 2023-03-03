import { DEVICE_RESPONSE } from "arlo-api/dist/interfaces/arlo-interfaces";

/**
 * Returns a display name used for the accessory creation.
 * @param device
 * @private
 */
export function DisplayName(device: DEVICE_RESPONSE): string {
  return `${device.deviceName}-${device.deviceType}-${device.deviceId}`;
}
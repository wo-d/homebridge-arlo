import { DEVICE_RESPONSE } from "arlo-api/dist/interfaces/arlo-interfaces";

/**
 * Returns a display name used for the accessory creation.
 * @param device
 * @private
 */
export function DisplayName(device: DEVICE_RESPONSE): string {
  return `${device.deviceName}-${device.deviceType}-${device.deviceId}`;
}

// Pulled from https://gist.github.com/ca0v/73a31f57b397606c9813472f7493a940?permalink_comment_id=3062135#gistcomment-3062135
export const debounce = <F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
) => {
  let timeout: any;

  return (...args: Parameters<F>): Promise<ReturnType<F>> =>
    new Promise((resolve) => {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
};
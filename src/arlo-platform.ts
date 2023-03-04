import {
  API,
  APIEvent,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  Service,
  Characteristic,
} from "homebridge";
import * as util from "util";
import { arloOptionsInterface } from "./arlo-config";
import { Client } from "arlo-api";
import { ArloAccessory } from "./arlo-accessory";
import { PLATFORM_NAME, PLUGIN_NAME } from "./settings";
import { DisplayName } from "./utils/utils";

export class ArloPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly api: API;
  public readonly log: Logging;
  public config!: arloOptionsInterface;
  public arlo!: Client;

  // This is used to track restored cached accessories.
  public readonly accessories: PlatformAccessory[] = [];

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.api = api;
    this.log = log;
    this.log.debug = this.debug.bind(this);
    this.Service = this.api.hap.Service;
    this.Characteristic = this.api.hap.Characteristic;

    if (!config) {
      this.log.error("No configuration provided");
      return;
    }

    this.config = {
      arloPassword: config.arloPassword as string,
      arloUser: config.arloUser as string,
      debug: config.debug === true,
      emailImapPort:
        "emailImapPort" in config
          ? parseInt(config.emailImapPort as string)
          : -1,
      emailPassword: config.emailPassword as string,
      emailServer: config.emailServer as string,
      emailUser: config.emailUser as string,
    };

    try {
      this.arlo = new Client(this.config);
    } catch (e: any) {
      this.log.error("Unable to construct an Arlo client with the provided configuration.");
      this.log.error("You are missing a required configuration.");
      this.log.error(e);
      return;
    }

    this.log.info("Homebridge Arlo configuration loaded successfully.");
    this.debug("Debug logging on.");

    api.on(APIEvent.DID_FINISH_LAUNCHING, () => {
      this.debug('Executed didFinishLaunching callback');
      // Run the method to discover / register your devices as accessories.
      this.discoverDevices();
    });
  }

  /**
   * Event handler called by an accessory when it receives a closed stream event.
   * @param accessory
   */
  public streamClosed(accessory: ArloAccessory) {
    this.debug('Stream was closed. Retrying to establish connection in 30 seconds.');
    // Restart the stream in 30 seconds.
    setTimeout(() => accessory.openStream(), 30 * 1000);
  }

  /**
   * Discovers all Arlo devices connected to account.
   *
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  async discoverDevices() {
    const loginSuccessful = await this.login();

    if (!loginSuccessful) {
      return;
    }

    const devices = await this.arlo.getDevices();
    if (devices.length === 0) {
      this.log.error('No arlo devices discovered! Terminating early.');
    }

    // Loop over the discovered devices and register each on if it has not already
    // been registered.
    for (const device of devices) {
      // For now the homebridge arlo platform only supports doorbell events...
      if (device.deviceType !== 'basestation') {
        this.log.info(`Ignoring non basestation device with name ${DisplayName(device)}.`);
        continue;
      }

      // Generate a unique id for the accessory this should be generated from
      // something globally unique, but constant. Fortunately, Arlo provides
      // us an `uniqueId` property.
      const uuid = this.api.hap.uuid.generate(device.uniqueId);

      // See if an accessory with the same uuid has already been registered and
      // restored from the cached devices we stored in the `configureAccessory`
      // method.
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        // Ff you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);

        // Create the accessory handler for the restored accessory. 
        // The cached device keeps its context.
        new ArloAccessory(this, existingAccessory);

        // It is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      } else {

        this.log.info('Adding new accessory:', DisplayName(device));

        // Create a new accessory.
        const accessory = new this.api.platformAccessory(DisplayName(device), uuid);

        // Store a copy of the device object in the `accessory.context`.
        // The `context` property can be used to store any data about the accessory
        // you may need.
        accessory.context.device = device;

        // Create the accessory handler for the newly created accessory.
        new ArloAccessory(this, accessory);

        // Link the accessory to the platform.
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }

  /**
   * Login to the arlo system.
   * @returns true when login is successful, false otherwise.
   */
  public async login(): Promise<boolean> {
    // TODO: Use the login result object to bypass logging in if possible.
    const loginResult = await this.arlo.login().catch(error => {
      this.log.error("Unable to login to Arlo using provided credentials.");
      this.log.error(error);
      return false;
    });

    return true;
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   * @param accessory
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * Wraps log info call if debug configuration is set to true.
   * @param message
   * @param parameters
   */
  public debug(message: string, ...parameters: unknown[]): void {
    if (this.config.debug) {
      this.log.info(util.format(message, ...parameters));
    }
  }
}

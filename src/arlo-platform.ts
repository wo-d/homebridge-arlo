import {
  API,
  APIEvent,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
} from "homebridge";
import * as util from "util";
import { arloOptionsInterface } from "./arlo-config";
const Arlo = require("node-arlo-v2");

export class arloPlatform implements DynamicPlatformPlugin {
  public readonly api: API;
  public readonly log: Logging;
  public config!: arloOptionsInterface;

  constructor(log: Logging, config: PlatformConfig, api: API) {
    this.api = api;
    this.log = log;
    this.log.debug = this.debug.bind(this);

    if (!config) {
      this.log.error("No configuration provided");
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

    // TODO: Perform some checks here for configuration values.

    this.log.info("Homebridge Arlo configuration loaded.");
    api.on(APIEvent.DID_FINISH_LAUNCHING, this.subscribe.bind(this));
  }

  configureAccessory(accessory: PlatformAccessory): void {
    // TODO:
  }

  public async subscribe(): Promise<void> {
    const arlo = new Arlo();

    arlo.on(Arlo.FOUND, (device: any) => {
      this.log.info(`Found device: ${device.id}`);
    });

    await arlo.loginMfa(this.config);
  }

  // Utility for debug logging.
  public debug(message: string, ...parameters: unknown[]): void {
    if (this.config.debug) {
      this.log.info(util.format(message, ...parameters));
    }
  }
}

import { ArloPlatform } from "./arlo-platform";
import { Logging, PlatformAccessory, Service } from "homebridge";
import { Basestation, Client } from "arlo-api";
import { DEVICE_RESPONSE } from "arlo-api/dist/interfaces/arlo-interfaces";
import { DisplayName } from "./utils/utils";
import ARLO_EVENTS from "arlo-api/dist/constants/arlo-events";

export class ArloAccessory {
  private service: Service;
  protected readonly accessory: PlatformAccessory;
  protected readonly arlo: Client;
  protected readonly log: Logging;
  protected readonly platform: ArloPlatform;
  protected readonly device: DEVICE_RESPONSE;

  /**
   * Tracks the state of the accessory.
   */
  private states = {
    buttonPressed: false,
  };

  constructor(platform: ArloPlatform, accessory: PlatformAccessory) {
    this.arlo = platform.arlo
    this.log = platform.log;
    this.platform = platform;
    this.accessory = accessory;

    this.device = this.accessory.context.device as DEVICE_RESPONSE;

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, "Arlo")
      .setCharacteristic(this.platform.Characteristic.Model, this.device.properties.modelId)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.deviceId);

    // NOTE: Only the doorbell is supported at this time.
    // Get the Doorbell service if it exists, otherwise create a new service.
    // Multiple services can be created for each accessory.
    this.service = this.accessory.getService(this.platform.Service.Doorbell) || this.accessory.addService(this.platform.Service.Doorbell);

    // Sets the service name, this is what is displayed as the default name on the Home app.
    this.service.setCharacteristic(this.platform.Characteristic.Name, DisplayName(this.device));

    // Each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Doorbell

    // add characteristic ProgrammableSwitchEvent
    this.service.getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent);

    // Fire off basestation subscribe.
    this.subscribe();
  }

  private async subscribe() {
    const basestation = new Basestation(this.arlo, this.device);

    // Subscribe to basestation events.
    basestation.on(ARLO_EVENTS.open, () => {
      this.log('Basestation stream opened');
    });

    basestation.on(ARLO_EVENTS.close, () => {
      this.log('Basestation stream closed');
    });

    basestation.on(ARLO_EVENTS.doorbellAlert, () => {
      this.log('Doorbell alert encountered');
      this.service.updateCharacteristic(
        this.platform.Characteristic.ProgrammableSwitchEvent,
        this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS,
      );
    })

    this.log('Starting Basestation stream');
    await basestation.startStream();
  }
}
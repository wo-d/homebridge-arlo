import { ArloPlatform } from "./arlo-platform";
import { Logging, PlatformAccessory, Service } from "homebridge";
import { Basestation, Client } from "arlo-api";
import { DEVICE_RESPONSE } from "arlo-api/dist/interfaces/arlo-interfaces";
import { debounce, DisplayName } from "./utils/utils";
import ARLO_EVENTS from "arlo-api/dist/constants/arlo-events";

export class ArloAccessory {
  private service: Service;
  protected readonly accessory: PlatformAccessory;
  protected readonly arlo: Client;
  protected readonly log: Logging;
  protected readonly platform: ArloPlatform;
  protected readonly device: DEVICE_RESPONSE;
  private readonly basestation: Basestation;

  constructor(platform: ArloPlatform, accessory: PlatformAccessory) {
    this.arlo = platform.arlo
    this.log = platform.log;
    this.platform = platform;
    this.accessory = accessory;

    this.device = this.accessory.context.device as DEVICE_RESPONSE;

    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, "Arlo")
      .setCharacteristic(this.platform.Characteristic.Model, this.device.modelId)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, this.device.deviceId);

    // NOTE: Only the doorbell is supported at this time.
    // Get the Doorbell service if it exists, otherwise create a new service.
    // Multiple services can be created for each accessory.
    this.service =
      this.accessory.getService(this.platform.Service.Doorbell) ||
      this.accessory.addService(this.platform.Service.Doorbell);

    // Sets the service name, this is what is displayed as the default name on the Home app.
    this.service.setCharacteristic(this.platform.Characteristic.Name, DisplayName(this.device));

    // Each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Doorbell

    // add characteristic ProgrammableSwitchEvent
    this.service
      .getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
      .onGet(() => null);

    this.service.setPrimaryService(true);

    this.basestation = new Basestation(this.arlo, this.device);
    // Fire off basestation subscribe.
    this.subscribe();
    this.openStream();
  }

  private subscribe() {
    // Explicitly enable events.
    this.basestation.enableDoorbellAlerts();

    // Subscribe to basestation events.
    this.basestation.on(ARLO_EVENTS.open, () => {
      this.log.debug('Basestation stream opened');
    });

    // It's necessary to debounce the stream closed events as
    // we could end up trying to restore the stream multiple times at once.
    const streamClosed = (data: string) => {
      this.log.debug(`Basestation stream closed: ${data}`);
      // Let the platform know that an accessory stream was closed.
      this.platform.streamClosed(this);
    }

    const debounceStreamClose = debounce(streamClosed, 2000);

    this.basestation.on(ARLO_EVENTS.close, debounceStreamClose);

    this.basestation.on(ARLO_EVENTS.error, (data) => {
      this.basestation.close();
      this.log.debug('error encountered');
      this.log.debug(data);
    });

    this.basestation.on(ARLO_EVENTS.doorbellAlert, () => {
      this.log('Doorbell alert encountered!');
      this.service.updateCharacteristic(
        this.platform.Characteristic.ProgrammableSwitchEvent,
        this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS,
      );
    })

    // Secret keep alive event.
    this.basestation.on('pong', () => {
      this.log.debug('ping');
    })
  }

  public async openStream() {
    this.log.debug('Starting Basestation stream');
    await this.basestation.startStream();
  }
}
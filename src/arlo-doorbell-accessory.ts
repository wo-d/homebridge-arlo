import { ArloPlatform } from "./arlo-platform";
import { Logging, PlatformAccessory, Service } from "homebridge";
import { Basestation, Client } from "arlo-api";
import { DEVICE_RESPONSE } from "arlo-api/dist/interfaces/arlo-interfaces";
import { debounce, DisplayName } from "./utils/utils";
import ARLO_EVENTS from "arlo-api/dist/constants/arlo-events";
import { ArloCameraAccessory } from "./arlo-camera-accessory";

export class ArloDoorbellAccessory extends ArloCameraAccessory {
  private doorbellService: Service;
  private readonly basestation: Basestation;

  constructor(platform: ArloPlatform, accessory: PlatformAccessory) {
    super(platform, accessory);

    const device = accessory.context.device as DEVICE_RESPONSE;

    accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, "Arlo")
      .setCharacteristic(this.platform.Characteristic.Model, device.modelId)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, device.deviceId);

    // NOTE: Only the doorbell is supported at this time.
    // Get the Doorbell service if it exists, otherwise create a new service.
    // Multiple services can be created for each accessory.
    this.doorbellService =
      accessory.getService(this.platform.Service.Doorbell) ||
      accessory.addService(this.platform.Service.Doorbell);

    // Sets the service name, this is what is displayed as the default name on the Home app.
    this.doorbellService.setCharacteristic(this.platform.Characteristic.Name, DisplayName());

    // Each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Doorbell

    // add characteristic ProgrammableSwitchEvent
    this.doorbellService
      .getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
      .onGet(() => null);

    this.doorbellService.setPrimaryService(true);

    this.basestation = new Basestation(platform.arlo, device);
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
      this.doorbellService
        .getCharacteristic(this.platform.Characteristic.ProgrammableSwitchEvent)
        .updateValue(this.platform.Characteristic.ProgrammableSwitchEvent.SINGLE_PRESS);
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
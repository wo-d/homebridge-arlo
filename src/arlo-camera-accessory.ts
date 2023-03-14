import {
  Service,
  PlatformAccessory,
  Logging,
  CharacteristicValue,
  CameraStreamingDelegate,
  CameraStreamingOptions,
} from "homebridge";
import { ArloPlatform } from "./arlo-platform";
import { DisplayName } from "./utils/utils";
import { CameraControllerOptions } from "hap-nodejs/dist/lib/controller/CameraController";

export class ArloCameraAccessory {
  protected readonly platform: ArloPlatform;
  protected readonly accessory: PlatformAccessory;
  protected readonly log: Logging;

  private cameraService: Service;
  private motionService: Service;

  constructor(platform: ArloPlatform, accessory: PlatformAccessory) {
    this.platform = platform;
    this.accessory = accessory;
    this.log = platform.log;

    this.cameraService = this.cameraFunction(accessory);
    this.cameraService.setPrimaryService(true);
    accessory.configureController(new this.platform.api.hap.CameraController(this.controllerOptions()));

    this.motionService = this.motionFunction(accessory);
  }

  private controllerOptions(): CameraControllerOptions {
    return {
      delegate: this.cameraStreamingDelegate(),
      streamingOptions: this.cameraStreamingOptions()
    }
  }

  private cameraStreamingDelegate(): CameraStreamingDelegate {
    return {
      handleSnapshotRequest(): void {},
      handleStreamRequest(): void {},
      prepareStream(): void {}
    };
  }

  private cameraStreamingOptions(): CameraStreamingOptions {
    return {
      proxy: false,
      supportedCryptoSuites: [],
      video: {
        resolutions: [
          [320, 180, 30],
          [320, 240, 15], // Apple Watch requires this configuration
          [320, 240, 30],
          [480, 270, 30],
          [480, 360, 30],
          [640, 360, 30],
          [640, 480, 30],
          [1280, 720, 30],
          [1280, 960, 30],
          [1920, 1080, 30],
          [1600, 1200, 30],
        ],
        codec: {
          profiles: [],
          levels: [],
        },
      },
      disable_audio_proxy: false,
      srtp: false
    }
  }

  private cameraFunction(
    accessory: PlatformAccessory,
  ): Service {
    const service =
      accessory.getService(this.platform.Service.CameraOperatingMode) ||
      accessory.addService(this.platform.Service.CameraOperatingMode);

    service.setCharacteristic(this.platform.Characteristic.Name, DisplayName());

    service
      .getCharacteristic(this.platform.Characteristic.EventSnapshotsActive)
      .onGet(this.handleEventSnapshotsActiveGet.bind(this));
    service
      .getCharacteristic(this.platform.Characteristic.EventSnapshotsActive)
      .onSet(this.handleEventSnapshotsActiveSet.bind(this));

    service
      .getCharacteristic(this.platform.Characteristic.HomeKitCameraActive)
      .onGet(this.handleHomeKitCameraActiveGet.bind(this));
    service
      .getCharacteristic(this.platform.Characteristic.HomeKitCameraActive)
      .onSet(this.handleHomeKitCameraActiveSet.bind(this));

    return service as Service;
  }

  private motionFunction(
    accessory: PlatformAccessory,
  ): Service {
    const service =
      accessory.getService(this.platform.Service.MotionSensor) ||
      accessory.addService(this.platform.Service.MotionSensor);

    service.setCharacteristic(this.platform.Characteristic.Name, DisplayName());

    service
      .getCharacteristic(this.platform.Characteristic.MotionDetected)
      .onGet(this.handleMotionDetectedGet.bind(this));

    return service as Service;
  }

  handleEventSnapshotsActiveGet(): CharacteristicValue {
    const currentValue = this.platform.Characteristic.EventSnapshotsActive.DISABLE;
    this.log.debug(this.accessory.displayName, 'GET EventSnapshotsActive:', currentValue);
    return currentValue;
  }

  handleEventSnapshotsActiveSet(value: CharacteristicValue) {
    this.log.debug(this.accessory.displayName, 'SET EventSnapshotsActive:', value);
  }

  handleHomeKitCameraActiveGet(): CharacteristicValue {
    const currentValue = this.platform.Characteristic.HomeKitCameraActive.OFF;
    this.log.debug(this.accessory.displayName, 'GET HomeKitCameraActive:', currentValue);
    return currentValue;
  }

  handleHomeKitCameraActiveSet(value: CharacteristicValue) {
    this.platform.log.debug(this.accessory.displayName, 'SET HomeKitCameraActive:', value);
  }

  handleMotionDetectedGet(): CharacteristicValue {
    return false;
  }
}

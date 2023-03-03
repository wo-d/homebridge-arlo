import { PLATFORM_NAME, PLUGIN_NAME } from "./settings";
import { API } from "homebridge";
import { ArloPlatform } from "./arlo-platform";

export = (api: API): void => {
  api.registerPlatform(PLUGIN_NAME, PLATFORM_NAME, ArloPlatform);
};

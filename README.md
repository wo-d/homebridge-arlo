# Homebridge-Arlo

<a href="https://www.npmjs.com/package/homebridge-arlo-v2"><img title="npm version" src="https://badgen.net/npm/v/homebridge-arlo-v2" ></a>

Homebridge plugin for Arlo.
Includes email MFA support. Feel free to fork or make pull requests with additional features.

## Caveats

* Library only supports Doorbell events.
* Extremely nascent implementation. There may be unrecoverable states which require restart.
  * When a login occurs to Arlo they close any other open connection. This poses a problem as the underlying library must maintain a connection to listen for events.

## Development

### Debugging
[Install homebridge locally](https://github.com/homebridge/homebridge/wiki/Install-Homebridge-on-Windows-10) to development machine.

Update homebridge configuration file. Default location in Windows `C:\Users\{username}\.homebridge\config.json`

```json
{
    "bridge": {
        "name": "test bridge",
        "username": "AA:AA:AA:AA:AA:AA",
        "port": 51826,
        "pin": "111-11-111"
    },
    "platforms": [
        {
            "name": "Config",
            "port": 8581,
            "auth": "form",
            "theme": "auto",
            "tempUnits": "c",
            "lang": "auto",
            "log": {
                "method": "file",
                "path": "C:\\Users\\{username}\\.homebridge\\homebridge.log"
            },
            "platform": "config"
        },
        {
            "arloUser": "user",
            "arloPassword": "pw",
            "emailUser": "email@gmail.com",
            "emailPassword": "pw",
            "emailServer": "imap.gmail.com",
            "emailImapPort": 993,
            "debug": true,
            "platform": "Arlo"
        }
    ],
    "accessories": []
}
```

Included is a VSCode launch profile for debugging the plugin. Courtesy of [jeff-winn](https://github.com/jeff-winn/homebridge-veml7700-sensor). Attach some breakpoints and run the `Launch` profile.
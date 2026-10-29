# Capability and evidence matrix

The app must explain what Android exposes on the current phone, rather than promise every hardware reading on every model. Implementation decisions should cite official Android documentation at the time they are made. No device has been tested for DeviceScope yet.

## Known constraints to validate

- Battery temperature is commonly present in the sticky battery broadcast, but missing extras/OEM behavior must be handled.
- Thermal status and headroom are guarded by API level and platform support. Neither is a CPU/GPU thermometer.
- General access to CPU/GPU temperature, per-core frequency, system CPU load, and `/proc` or `/sys` nodes varies or is blocked. These are optional capabilities; a permission error is not a zero reading.
- Ambient temperature sensors are uncommon and represent ambient temperature, not the processor.
- Battery health status is a coarse platform enum. Current/capacity counters do not automatically establish design capacity or precise degradation percentage.
- Device serial, IMEI, and hardware MAC access is restricted on modern Android. Do not work around those restrictions or request privileged permissions for the MVP.
- Camera, connectivity, and sensor detail APIs differ by version and may require specific permissions for specific fields. Discover first; request access only for the invoked feature.

## Physical-device results

Append actual rows as devices become available. An entry must include the implementation commit, device/OS, source/API, conditions, observation, and result. Leave unknowns as `not tested`.

| Device family | Exact model / OS  | Battery temp | Thermal state/headroom | CPU/GPU temp | Evidence |
| ------------- | ----------------- | ------------ | ---------------------- | ------------ | -------- |
| Pixel         | Not available yet | Not tested   | Not tested             | Not tested   | None     |
| Samsung       | Not available yet | Not tested   | Not tested             | Not tested   | None     |
| Xiaomi        | Not available yet | Not tested   | Not tested             | Not tested   | None     |

For each real test record charging state, sample interval, at least one missing/unsupported-field scenario, and foreground/background behavior. Redact serials, SSIDs, account details, and other identifiers from screenshots/reports. Emulator results must be labeled emulator and cannot establish physical sensor accuracy.

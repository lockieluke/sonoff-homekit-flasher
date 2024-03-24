# Sonoff HomeKit Flasher
Easily flash Sonoff devices with [Sonoff-Homekit](https://github.com/Gruppio/Sonoff-Homekit) firmware using [esptool](https://github.com/espressif/esptool) with a GUI.<br>

![Screenshot of Sonoff Homekit Flasher](assets/Sonoff%20Homekit%20Flasher.gif?raw=true)

Built with [Tauri](https://tauri.app/) and [SolidJS](https://www.solidjs.com/)

## Installation
Go to [Releases](https://github.com/lockieluke/sonoff-homekit-flasher/releases) and download the latest release

**This is an unsigned build, you might have to run the following command upon first launch on macOS:**
```shell
# App Path should be "/Applications/Sonoff Homekit Flasher.app", include the quotes for proper escaping
sudo xattr -r -d com.apple.quarantine [APP PATH]
```

On Windows, you might have to click **More Info** > **Run Anyway** on the SmartScreen warning to proceed with the installation
## Usage

On Windows, you might have to install drivers from [FTDI](https://ftdichip.com/wp-content/uploads/2021/08/CDM212364_Setup.zip) for the USB to Serial adapter to work

<br>On macOS, it should recognise the adapter out of the box

## Build

Make sure you have [Bun](https://bun.sh/) and [Rust](https://www.rust-lang.org/) installed

### Install dependencies
```shell
bun install
```

### Build your own esptool
Building esptool is only supported on macOS at the moment, output binaries will be put into place automatically by the script
```shell
bun build:esptool
```
<sub>Make sure you a [wine-crossover](https://github.com/Gcenx/winecx), universal [Python](https://www.python.org/downloads/macos/) version, [pyinstaller](https://github.com/pyinstaller/pyinstaller), [intelhex](https://github.com/python-intelhex/intelhex) and [pyserial](https://github.com/pyserial/pyserial) installed</sub>

### Build the app
Building for macOS
```shell
bun build:macos
```
Building for Windows
```shell
bun build:windows
```
<sub>Building for Windows on Windows is not tested.  To compile on macOS, make sure you have [cargo-xwin](https://github.com/rust-cross/cargo-xwin) installed</sub>
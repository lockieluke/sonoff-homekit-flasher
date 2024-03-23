# Sonoff HomeKit Flasher
Easily flash Sonoff devices with [Sonoff-Homekit](https://github.com/Gruppio/Sonoff-Homekit) firmware using [esptool](https://github.com/espressif/esptool) with a GUI.<br>

![Screenshot of Sonoff Homekit Flasher](assets/Sonoff%20Homekit%20Flasher.gif?raw=true)

Built with [Tauri](https://tauri.app/) and [SolidJS](https://www.solidjs.com/)

## Installation
Go to [Releases](https://github.com/lockieluke/sonoff-homekit-flasher/releases) and download the latest release

**This is an unsigned build, you might have to run the following command upon first launch:**
```shell
# App Path should be "/Applications/Sonoff Homekit Flasher.app", include the quotes for proper escaping
sudo xattr -r -d com.apple.quarantine [APP PATH]
```
## Build

Make sure you have [Bun](https://bun.sh/) and [Rust](https://www.rust-lang.org/) installed

### Install dependencies
```shell
bun install
```

### Build your own esptool
Clone repository and navigate into it
```shell
git clone 
```
Build macOS universal binary and pop it into `src-tauri/bin` and replace all darwin binaries with it:
```shell
pyinstaller --distpath ./dist -F --icon=ci/espressif.ico --add-data="./esptool/targets/stub_flasher/*.json:./esptool/targets/stub_flasher/" --target-arch=universal2 esptool.py
```
<sub>Make sure you a universal Python version, `intelhex` and `pyserial` installed</sub>

### Build the app
Only supported on macOS for now
```shell
bun build:macos
```
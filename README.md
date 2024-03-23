# Sonoff HomeKit Flasher
Easily flash Sonoff devices with [Sonoff-Homekit](https://github.com/Gruppio/Sonoff-Homekit) firmware using [esptool](https://github.com/espressif/esptool) with a GUI.<br>
![Screenshot of Sonoff Homekit Flasher](assets/Hero.png?raw=true)
Built with [Tauri](https://tauri.app/) and [SolidJS](https://www.solidjs.com/)
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
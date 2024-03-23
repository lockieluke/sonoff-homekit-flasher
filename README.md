# Sonoff HomeKit Flasher

## Build

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

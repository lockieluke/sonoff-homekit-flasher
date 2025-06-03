use std::sync::{Arc, Mutex};

use crate::utils::pathbuf_to_string;
use serde_json::json;
use tauri::path::BaseDirectory;
use tauri::{AppHandle, Emitter, Manager, Window};
use tauri_plugin_shell::process::CommandEvent;
use tauri_plugin_shell::ShellExt;

#[tauri::command]
pub fn get_usb_list() -> Vec<String> {
    let ports = tokio_serial::available_ports().unwrap();

    ports.iter().map(|port| port.port_name.to_owned()).collect()
}

#[tauri::command]
pub fn flash_firmware(window: Window, app: AppHandle, port: String) {
    println!("Flashing firmware to {}", port);
    let rboot_path = app
        .path()
        .resolve("rboot.bin", BaseDirectory::Resource)
        .unwrap();
    let blank_config_path = app
        .path()
        .resolve("blank_config.bin", BaseDirectory::Resource)
        .unwrap();
    let firmware_path = app
        .path()
        .resolve("Sonoff_ON.bin", BaseDirectory::Resource)
        .unwrap();

    let (mut rx, ..) = app.shell().sidecar("esptool")
        .expect("Failed to get esptool sidecar")
        .args([
            "--baud=115200".into(),
            format!("-p={}", port),
            "write_flash".into(),
            "-fs=8MB".into(),
            "-fm=dout".into(),
            "-ff=40m".into(),
            "0x0".into(),
            pathbuf_to_string(&rboot_path),
            "0x1000".into(),
            pathbuf_to_string(&blank_config_path),
            "0x2000".into(),
            pathbuf_to_string(&firmware_path),
        ])
        .spawn()
        .expect("Failed to flash firmware");

    println!("Launched esptool");

    let window = Arc::new(Mutex::new(window));
    let exited = Arc::new(Mutex::new(false));
    let stdout = Arc::new(Mutex::new(String::new()));
    let stderr = Arc::new(Mutex::new(String::new()));

    tauri::async_runtime::spawn(async move {
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stderr(line) => {
                    let line = String::from_utf8(line).expect("Failed to read stderr as utf8");
                    let line = line.trim_end();
                    stderr.lock().unwrap().push_str(line);
                }
                CommandEvent::Stdout(line) => {
                    let line = String::from_utf8(line).expect("Failed to read stdout as utf8");

                    if line.starts_with("Writing at 0x000") {
                        let line = line.trim_end();
                        stdout.lock().unwrap().push_str(line);
                        window
                            .lock()
                            .unwrap()
                            .emit(
                                "flash-progress",
                                json!({
                                "message": line
                            }),
                            )
                            .unwrap();
                    }
                }
                CommandEvent::Terminated(exit) => {
                    if exited.lock().unwrap().eq(&false)
                    {
                        let exit_code = exit.code.unwrap_or(1);
                        if exit_code == 0 {
                            window
                                .lock()
                                .unwrap()
                                .emit("flash-succeeded", json!({}))
                                .unwrap();
                            println!("Firmware flashed successfully");
                        } else {
                            window
                                .lock()
                                .unwrap()
                                .emit(
                                    "flash-failed",
                                    json!({
                                    "message": stderr.lock().unwrap().to_owned()
                                }),
                                )
                                .unwrap();
                            println!("Firmware flashing failed with exit code {}", exit_code);
                        }
                        *exited.lock().unwrap() = true;
                        break;
                    }
                }
                _ => {

                }
            }
        }
    });
}

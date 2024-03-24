use std::sync::{Arc, Mutex};

use serde_json::json;
use tauri::{AppHandle, Window};
use tauri::api::process::{Command, CommandEvent};

use crate::utils::pathbuf_to_string;

#[tauri::command]
pub fn get_usb_list() -> Vec<String> {
    let ports = tokio_serial::available_ports().unwrap();

    ports
        .iter()
        .map(|port| port.port_name.to_owned())
        .collect()
}

#[tauri::command]
pub fn flash_firmware(window: Window, app: AppHandle, port: String) {
    println!("Flashing firmware to {}", port);
    let rboot_path = app.path_resolver()
        .resolve_resource("resources/rboot.bin")
        .unwrap();
    let blank_config_path = app.path_resolver()
        .resolve_resource("resources/blank_config.bin")
        .unwrap();
    let firmware_path = app.path_resolver()
        .resolve_resource("resources/Sonoff_ON.bin")
        .unwrap();

    let (mut rx, ..) = Command::new_sidecar("esptool")
        .expect("Failed to spawn esptool")
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
            pathbuf_to_string(&firmware_path)
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
            if let CommandEvent::Terminated(ref exit) = event {
                if let Some(exit_code) = exit.code && exited.lock().unwrap().eq(&false) {
                    if exit_code == 0 {
                        window.lock().unwrap().emit("flash-succeeded", json!({})).unwrap();
                        println!("Firmware flashed successfully");
                    } else {
                        window.lock().unwrap().emit("flash-failed", json!({
                            "message": stderr.lock().unwrap().to_owned()
                        })).unwrap();
                        println!("Firmware flashing failed with exit code {}", exit_code);
                    }
                    *exited.lock().unwrap() = true;
                    break;
                }
            }

            if let CommandEvent::Stdout(ref line) = event {
                if line.starts_with("Writing at 0x000") {
                    let line = line.trim_end();
                    stdout.lock().unwrap().push_str(line);
                    window.lock().unwrap().emit("flash-progress", json!({
                        "message": line
                    })).unwrap();
                }
            }

            if let CommandEvent::Stderr(ref line) = event {
                let line = line.trim_end();
                stderr.lock().unwrap().push_str(line);
            }
        }
    });
}
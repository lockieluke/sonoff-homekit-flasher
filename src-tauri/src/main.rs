// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
#![feature(let_chains)]

use tauri::{image::Image, Manager};

use crate::usb::{flash_firmware, get_usb_list};

mod usb;
mod utils;

#[tauri::command]
fn show_main_window(webview_window: tauri::WebviewWindow) {
    webview_window.show().expect("Failed to show main window");
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            // Show main window
            show_main_window,
            // USB Helper
            get_usb_list,
            flash_firmware
        ])
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            if cfg!(windows) {
                window
                    .set_icon(Image::from_bytes(include_bytes!("../icons/icon.ico")).unwrap())
                    .expect("Failed to change icon");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

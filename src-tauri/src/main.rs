// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

#![feature(let_chains)]

use tauri::{Icon, Manager, Window};

use crate::usb::{flash_firmware, get_usb_list};

mod usb;
mod utils;

#[tauri::command]
fn show_main_window(window: Window) {
    window.show().unwrap();
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            // Main Window
            show_main_window,
            // USB Helper
            get_usb_list,
            flash_firmware
        ])
        .setup(|app| {
            let window = app.get_window("main").unwrap();
            if cfg!(windows) {
                window.set_icon(Icon::Raw(include_bytes!("../icons/icon.ico").to_vec())).expect("Failed to change icon");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

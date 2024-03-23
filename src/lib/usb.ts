import {invoke} from "@tauri-apps/api";
import {createNanoEvents} from "nanoevents";
import {listen} from "@tauri-apps/api/event";

interface USBEvents {
    succeeded: (port: string) => void;
    failed: (error: string) => void;
    progress: (message: string) => void;
}

export default class USB {

    private static emitter = createNanoEvents<USBEvents>();

    static async getUSBList(): Promise<string[]> {
        return await invoke("get_usb_list");
    }

    static async flashFirmware(port: string) {
        const progressListener = await listen("flash-progress", event => {
            const payload = event.payload as Record<string, string>;
            this.emitter.emit("progress", payload["message"]);
        });
        const listener = await listen("flash-succeeded", () => {
            this.emitter.emit("succeeded", port);
            listener();
            progressListener();
        });
        const failedListener = await listen("flash-failed", () => {
            this.emitter.emit("failed", "Failed to flash the firmware.");
            failedListener();
            progressListener();
        });

        return await invoke("flash_firmware", {
            port
        });
    }

    static on<E extends keyof USBEvents>(event: E, callback: USBEvents[E]) {
        return this.emitter.on(event, callback)
    }

}
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@src/components/ui/select.tsx";
import {createEffect, createResource, createSignal, DEV} from "solid-js";
import USB from "@src/lib/usb.ts";
import {Button} from "@src/components/ui/button.tsx";
import {ColorModeProvider, ColorModeScript} from "@kobalte/core";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle
} from "@src/components/ui/alert-dialog.tsx";
import {IconReload} from "@tabler/icons-solidjs";
import {open} from "@tauri-apps/api/shell";
import {showToast, Toaster} from "@src/components/ui/toast.tsx";
import {Tooltip, TooltipContent, TooltipTrigger} from "@src/components/ui/tooltip.tsx";
import {invoke} from "@tauri-apps/api";
import InstructionsIMG from "@src/assets/Instructions.png";

export default function App() {
    let flashButton: HTMLButtonElement | null = null;

    const [selectedUSBDevice, setSelectedUSBDevice] = createSignal<string>();
    const [showNoSelectedAlert, setShowNoSelectedAlert] = createSignal(false);
    const [showInstructions, setShowInstructions] = createSignal(false);
    const [progress, setProgress] = createSignal<string>();

    const [usbList, {refetch}] = createResource(USB.getUSBList);

    createEffect(async () => {
        USB.on("succeeded", port => {
            flashButton!.disabled = false;
            showToast({
                title: "Flashing Succeeded",
                description: `Successfully flashed the firmware to ${port}.`,
                duration: 5000
            });
            setProgress(undefined);
        });

        USB.on("failed", () => {
            flashButton!.disabled = false;
            showToast({
                title: "Flashing Failed",
                description: `Failed to flash the firmware`,
                duration: 5000
            });
            setProgress(undefined);
        });

        USB.on("progress", message => setProgress(message));

        await invoke("show_main_window");
    }, []);

    return (<>
        <ColorModeScript storageType={"localStorage"} />

        <ColorModeProvider>
            <AlertDialog open={showNoSelectedAlert()} onOpenChange={setShowNoSelectedAlert}>
                <AlertDialogContent onContextMenu={event => {
                    if (!DEV)
                        event.preventDefault();
                }} class={"cursor-default select-none"}>
                    <AlertDialogTitle>Select a USB Device</AlertDialogTitle>
                    <AlertDialogDescription>
                        You must select a USB device before flashing.
                    </AlertDialogDescription>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showInstructions()} onOpenChange={setShowInstructions}>
                <AlertDialogContent onContextMenu={event => {
                    if (!DEV)
                        event.preventDefault();
                }} class={"cursor-default select-none"}>
                    <AlertDialogTitle>Instructions</AlertDialogTitle>
                    <AlertDialogDescription>
                        <span>Plug in your Sonoff device into your computer while holding onto the button on the board</span>
                        <img draggable={false} src={InstructionsIMG} alt={"Instructions"} />
                    </AlertDialogDescription>
                </AlertDialogContent>
            </AlertDialog>

            <Toaster />

            <div onContextMenu={event => {
                if (!DEV)
                    event.preventDefault();
            }} class={"flex flex-col space-y-7 h-dvh items-center justify-center select-none cursor-default"}>
                <h1 class={"text-2xl font-bold"}>Sonoff Homekit Flasher</h1>

                <Select
                    value={selectedUSBDevice()}
                    onChange={setSelectedUSBDevice}
                    options={usbList() ?? []}
                    placeholder="Select a USB device…"
                    itemComponent={(props) => <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>}
                >
                    <SelectTrigger aria-label="USB Device" class="w-[250px]">
                        <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
                    </SelectTrigger>
                    <SelectContent />
                </Select>

                <div class={"flex flex-row items-center space-x-5"}>
                    <Button ref={ref => flashButton = ref} class={"transition-transform active:scale-[98%]"} onClick={async event => {
                        if (selectedUSBDevice()) {
                            event.currentTarget.disabled = true;
                            await USB.flashFirmware(selectedUSBDevice()!);
                        } else
                            setShowNoSelectedAlert(true);
                    }}>Flash</Button>
                    <Tooltip>
                        <TooltipTrigger>
                            <IconReload onClick={() => refetch()} class={"transition-transform hover:stroke-gray-500 active:scale-[95%]"} strokeWidth={1} />
                        </TooltipTrigger>
                        <TooltipContent>Refresh USB List</TooltipContent>
                    </Tooltip>
                </div>
                {progress() && <span class={"text-xs text-gray-500"}>{progress()}</span>}
                {!progress() && <a class={"text-sm text-blue-500"} onClick={() => setShowInstructions(true)} href={"#"}>Show Instructions</a>}

                <sub class={"fixed bottom-5"}>Powered by&nbsp;
                    <a class={"text-blue-500"} onClick={async () => await open("https://github.com/Gruppio/Sonoff-Homekit")} href="#">Sonoff-Homekit</a>
                    &nbsp;and&nbsp;
                    <a class={"text-blue-500"} onClick={async () => await open("https://github.com/espressif/esptool")} href="#">esptool</a>
                </sub>
                <sub class={"fixed bottom-5 right-5"}><a class={"text-blue-500"} onClick={async () => await open("https://www.buymeacoffee.com/lockieluke3389")} href={"#"}>Donate</a></sub>
            </div>
        </ColorModeProvider>
    </>);
}
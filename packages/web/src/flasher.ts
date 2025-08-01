import { db } from "@zwave-js/bindings-browser/db";
import { fs } from "@zwave-js/bindings-browser/fs";
import { createWebSerialPortFactory } from "@zwave-js/bindings-browser/serial";
import { log as createLogContainer } from "@zwave-js/core/bindings/log/browser";
import {
	BootloaderChunkType,
	type ZWaveSerialBindingFactory,
} from "@zwave-js/serial";
import { Bytes, getErrorMessage } from "@zwave-js/shared";
import { wait } from "alcalzone-shared/async";
import {
	type DeferredPromise,
	createDeferredPromise,
} from "alcalzone-shared/deferred-promise";
import {
	Driver,
	DriverMode,
	OTWFirmwareUpdateStatus,
	extractFirmware,
	getEnumMemberName,
	guessFirmwareFileFormat,
	tryUnzipFirmwareFile,
} from "zwave-js";

const flashButton = document.getElementById("flash") as HTMLButtonElement;
const fileInput = document.getElementById("file") as HTMLInputElement;
const flashProgress = document.getElementById(
	"progress",
) as HTMLProgressElement;
let firmwareFileContent: ArrayBuffer | null = null;

const appLabel = document.getElementById("app") as HTMLSpanElement;
const flashError = document.getElementById("flash_error") as HTMLDivElement;
const btnRunApp = document.getElementById(
	"run_application",
) as HTMLButtonElement;
const btnBootloader = document.getElementById(
	"bootloader",
) as HTMLButtonElement;
const btnBootloaderHw = document.getElementById(
	"bootloader_hw",
) as HTMLButtonElement;
const btnEraseNVM = document.getElementById("erase_nvm") as HTMLButtonElement;
const btnGetDSK = document.getElementById("get_dsk") as HTMLButtonElement;
const btnGetRegion = document.getElementById("get_region") as HTMLButtonElement;

const ledRed = document.getElementById("led_red") as HTMLInputElement;
const ledGreen = document.getElementById("led_green") as HTMLInputElement;
const ledBlue = document.getElementById("led_blue") as HTMLInputElement;
const btnLED = document.getElementById("set_led") as HTMLButtonElement;

const selectSystemIndication = document.getElementById(
	"system_indication",
) as HTMLSelectElement;
const btnSetSystemIndication = document.getElementById(
	"set_system_indication",
) as HTMLButtonElement;

let driver!: Driver;
let port!: SerialPort;
let serialBinding!: ZWaveSerialBindingFactory;
let readyPromise: DeferredPromise<void> | undefined;

let recreateWhenInBootloader = false;

async function init() {
	try {
		port = await navigator.serial.requestPort({
			filters: [
				// CP2102
				{ usbVendorId: 0x10c4, usbProductId: 0xea60 },
				// Nabu Casa ESP bridge, first EVT revision
				{ usbVendorId: 0x1234, usbProductId: 0x5678 },
				// Nabu Casa ESP bridge, uses Espressif VID/PID
				{ usbVendorId: 0x303a, usbProductId: 0x4001 },
			],
		});
		(globalThis as any).port = port;
		await port.open({ baudRate: 115200 });
	} catch (e) {
		console.error(e);
		return;
	}

	serialBinding = createWebSerialPortFactory(port);

	await createDriver();
}

function resetUI() {
	// Disable all buttons except the connect button
	flashButton.disabled = true;
	fileInput.disabled = true;
	btnEraseNVM.disabled = true;
	btnRunApp.disabled = true;
	btnGetDSK.disabled = true;
	btnGetRegion.disabled = true;
	btnBootloader.disabled = true;
	btnBootloaderHw.disabled = true;

	ledRed.disabled = true;
	ledGreen.disabled = true;
	ledBlue.disabled = true;
	btnLED.disabled = true;

	selectSystemIndication.disabled = true;
	btnSetSystemIndication.disabled = true;

	flashProgress.style.display = "none";
	flashError.innerText = "";
}

async function createDriver() {
	if (driver) {
		driver.removeAllListeners();
		await driver.destroy().catch(() => {});
	}

	resetUI();

	driver = new Driver(serialBinding, {
		host: {
			fs,
			db,
			log: createLogContainer,
			serial: {
				// no listing, no creating by path!
			},
		},
		testingHooks: {
			skipNodeInterview: true,
			loadConfiguration: false,
		},
		bootloaderMode: "stay",
	})
		.once("driver ready", ready)
		.once("bootloader ready", ready)
		.once("cli ready", ready)
		.once("error", failed);

	(globalThis as any).driver = driver;

	readyPromise = createDeferredPromise();
	await driver.start();
	return readyPromise;
}

function failed() {
	if (readyPromise) {
		readyPromise = undefined;

		alert(
			"Failed to start the driver. Reconnect the device and try again.\nIf the problem persists, you can return to bootloader and flash a new firmware.",
		);

		// If the driver failed to start, at least enable to option to force a hardware reset into bootloader
		btnBootloaderHw.disabled = false;
	}
}

function ready() {
	driver.on("firmware update progress", (progress) => {
		flashProgress.value = progress.progress;
	});
	driver.on("firmware update finished", (_result) => {
		flashProgress.style.display = "none";
	});
	fileInput.disabled = false;
	recreateWhenInBootloader = false;

	btnEraseNVM.disabled = false;
	btnBootloaderHw.disabled = false; // This always works

	checkApp();

	readyPromise?.resolve();
	readyPromise = undefined;
}

function checkApp() {
	if (driver.mode === DriverMode.Bootloader) {
		appLabel.innerText = "Bootloader";
	} else if (driver.mode === DriverMode.CLI) {
		appLabel.innerText = "End device CLI";
	} else if (driver.mode === DriverMode.SerialAPI) {
		appLabel.innerText = "Controller Serial API";
	}

	btnBootloader.disabled = driver.mode === DriverMode.Bootloader;
	btnRunApp.disabled = driver.mode !== DriverMode.Bootloader;
	btnGetDSK.disabled = driver.mode !== DriverMode.CLI;
	btnGetRegion.disabled = driver.mode !== DriverMode.CLI;

	btnLED.disabled = driver.mode !== DriverMode.SerialAPI;
	ledRed.disabled = driver.mode !== DriverMode.SerialAPI;
	ledGreen.disabled = driver.mode !== DriverMode.SerialAPI;
	ledBlue.disabled = driver.mode !== DriverMode.SerialAPI;

	btnSetSystemIndication.disabled = driver.mode !== DriverMode.SerialAPI;
	selectSystemIndication.disabled = driver.mode !== DriverMode.SerialAPI;
}

fileInput.addEventListener("change", async (event) => {
	const file = (event.target as HTMLInputElement).files?.[0];
	if (file) {
		try {
			const rawFile = new Uint8Array(await file.arrayBuffer());

			let firmwareFile: Uint8Array;
			let firmwareFilename: string;

			// Check if the file is a ZIP archive and try to extract a single firmware file
			if (file.name.toLowerCase().endsWith(".zip")) {
				const unzippedFirmware = tryUnzipFirmwareFile(rawFile);
				if (!unzippedFirmware) {
					alert(
						"Could not extract a valid firmware file from the ZIP archive. The ZIP must contain exactly one firmware file.",
					);
					return;
				}
				console.log(
					`Extracted firmware file "${unzippedFirmware.filename}" from ZIP archive`,
				);
				firmwareFile = unzippedFirmware.rawData;
				firmwareFilename = unzippedFirmware.filename;
			} else {
				firmwareFile = rawFile;
				firmwareFilename = file.name;
			}

			const format = guessFirmwareFileFormat(
				firmwareFilename,
				firmwareFile,
			);
			const firmware = await extractFirmware(firmwareFile, format);

			// Convert Uint8Array to ArrayBuffer
			const arrayBuffer = new ArrayBuffer(firmware.data.length);
			const view = new Uint8Array(arrayBuffer);
			view.set(firmware.data);

			firmwareFileContent = arrayBuffer;
			flashButton.disabled = false;
		} catch (e: any) {
			alert(`Could not parse firmware file: ${e.message}`);
		}
	}
});

async function flash() {
	if (!firmwareFileContent) {
		alert("No firmware file loaded");
		return;
	}

	flashButton.disabled = true;
	fileInput.disabled = true;

	if (driver.mode !== DriverMode.Bootloader) {
		// Force the device into bootloader mode using hardware
		await resetToBootloader();
	}

	try {
		flashProgress.style.display = "initial";

		const result = await driver.firmwareUpdateOTW(
			new Uint8Array(firmwareFileContent),
		);
		if (result.success) {
			fileInput.value = "";
			void createDriver();
			alert(
				"Firmware flashed successfully. Please wait for Z-Wave JS to reconnect.",
			);
			return;
		}

		alert(
			`Failed to flash firmware: ${
				getEnumMemberName(
					OTWFirmwareUpdateStatus,
					result.status,
				)
			}`,
		);
	} catch (e) {
		alert(`Failed to flash firmware: ${getErrorMessage(e)}`);
	}

	flashButton.disabled = false;
	fileInput.disabled = false;
}

async function eraseNVM() {
	if (!driver) {
		alert("Driver not initialized");
		return;
	}

	// Force the device into bootloader mode using hardware
	await resetToBootloader();

	const option = driver.bootloader.findOption((o) => o === "erase nvm");
	if (option === undefined) {
		alert("Erase NVM option not found");
		return;
	}

	const areYouSurePromise = driver.waitForBootloaderChunk(
		(c) =>
			c.type === BootloaderChunkType.Message
			&& c.message.toLowerCase().includes("are you sure"),
		1000,
	);
	await driver.bootloader.selectOption(option);
	try {
		await areYouSurePromise;
	} catch {
		alert("Erase NVM confirmation not received");
		return;
	}

	const successPromise = driver.waitForBootloaderChunk(
		(c) =>
			c.type === BootloaderChunkType.Message
			&& c.message.toLowerCase().includes("erased"),
		1000,
	);

	await driver.bootloader.writeSerial(Bytes.from("y", "ascii"));
	try {
		await successPromise;
		alert("NVM erased successfully");
	} catch {
		alert("ERROR: success message not received");
		return;
	}
}

async function runApp() {
	await (driver as any).leaveBootloader();
	checkApp();
}

async function getDSK() {
	const dsk = await driver.cli.executeCommand("get_dsk");
	alert(`DSK: ${dsk}`);
}

async function getRegion() {
	const region = await driver.cli.executeCommand("get_region");
	alert(`Region: ${region}`);
}

async function enterBootloader() {
	await driver.enterBootloader();

	if (recreateWhenInBootloader) {
		await createDriver();
	} else {
		checkApp();
	}
}

async function resetToBootloader() {
	// The driver doesn't know we reset the hardware - recreate it
	await driver?.destroy();

	await port.setSignals({ dataTerminalReady: false, requestToSend: true });
	await wait(100);
	await port.setSignals({ dataTerminalReady: true, requestToSend: false });
	await wait(500);
	await port.setSignals({ dataTerminalReady: false, requestToSend: false });

	await createDriver();
}

async function setLED() {
	const r = parseInt(ledRed.value, 10);
	const g = parseInt(ledGreen.value, 10);
	const b = parseInt(ledBlue.value, 10);

	await driver.controller.proprietary["Nabu Casa"]!.setLED({ r, g, b });
}

async function setSystemIndication() {
	const indication = selectSystemIndication.value;
	await driver.controller.proprietary["Nabu Casa"]!.setSystemIndication(
		indication,
	);
}

document.getElementById("connect").addEventListener("click", init);
flashButton.addEventListener("click", flash);
btnEraseNVM.addEventListener("click", eraseNVM);
btnRunApp.addEventListener("click", runApp);
btnGetDSK.addEventListener("click", getDSK);
btnGetRegion.addEventListener("click", getRegion);
btnBootloader.addEventListener("click", enterBootloader);
btnBootloaderHw.addEventListener("click", resetToBootloader);
btnLED.addEventListener("click", setLED);
btnSetSystemIndication.addEventListener("click", setSystemIndication);

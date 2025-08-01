import type {
	CommandClasses,
	FileSystem as LegacyFileSystemBindings,
	LogConfig,
	LogFactory,
	LongRangeChannel,
	RFRegion,
} from "@zwave-js/core";
import type { Serial, ZWaveSerialStream } from "@zwave-js/serial";
import type { DeepPartial, Expand } from "@zwave-js/shared";
import type { DatabaseFactory, FileSystem } from "@zwave-js/shared/bindings";
import type {
	InclusionUserCallbacks,
	JoinNetworkUserCallbacks,
} from "../controller/Inclusion.js";

export interface ZWaveOptions {
	/** Specify timeouts in milliseconds */
	timeouts: {
		/** how long to wait for an ACK */
		ack: number; // >=1, default: 1600 ms

		/** not sure */
		byte: number; // >=1, default: 150 ms

		/**
		 * How long to wait for a controller response. Usually this should never elapse, but when it does,
		 * the driver will abort the transmission and try to recover the controller if it is unresponsive.
		 */
		response: number; // [500...60000], default: 10000 ms

		/**
		 * How long to wait for a callback from the host for a SendData[Multicast]Request
		 * before aborting the transmission.
		 */
		sendDataAbort: number; // >=5000, <=(sendDataCallback - 5000), default: 20000 ms

		/**
		 * How long to wait for a callback from the host for a SendData[Multicast]Request
		 * before considering the controller unresponsive.
		 */
		sendDataCallback: number; // >=10000, default: 30000 ms

		/** How much time a node gets to process a request and send a response */
		report: number; // [500...10000], default: 1000 ms

		/** How long generated nonces are valid */
		nonce: number; // [3000...20000], default: 5000 ms

		/** How long to wait before retrying a command when the controller is jammed */
		retryJammed: number; // [10...5000], default: 1000 ms

		/**
		 * How long to wait without pending commands before sending a node back to sleep.
		 * Should be as short as possible to save battery, but long enough to give applications time to react.
		 */
		sendToSleep: number; // [10...5000], default: 250 ms

		/**
		 * **!!! INTERNAL !!!**
		 *
		 * Not intended to be used by applications
		 *
		 * How long to wait for a poll after setting a value without transition duration
		 */
		refreshValue: number;

		/**
		 * **!!! INTERNAL !!!**
		 *
		 * Not intended to be used by applications
		 *
		 * How long to wait for a poll after setting a value with transition duration. This doubles as the "fast" delay.
		 */
		refreshValueAfterTransition: number;

		/**
		 * How long to wait for the Serial API Started command after a soft-reset before resorting
		 * to polling the API for the responsiveness check.
		 */
		serialAPIStarted: number; // [1000...30000], default: 5000 ms
	};

	attempts: {
		/**
		 * @internal
		 * How often to attempt opening the serial port
		 */
		openSerialPort: number;

		/** How often the driver should try communication with the controller before giving up */
		controller: number; // [1...3], default: 3

		/** How often the driver should try sending SendData commands before giving up */
		sendData: number; // [1...5], default: 3

		/** How often the driver should retry SendData commands while the controller is jammed */
		sendDataJammed: number; // [1...10], default: 5

		/**
		 * How many attempts should be made for each node interview before giving up
		 */
		nodeInterview: number; // [1...10], default: 5
	};

	/**
	 * Optional log configuration
	 */
	logConfig?: LogConfig;

	interview: {
		/**
		 * Whether all user code should be queried during the interview of the UserCode CC.
		 * Note that enabling this can cause a lot of traffic during the interview.
		 */
		queryAllUserCodes?: boolean;

		/**
		 * Disable the automatic node interview after successful inclusion.
		 * Note: When this is `true`, the interview must be started manually using
		 * ```ts
		 * node.interview()
		 * ```
		 *
		 * Default: `false` (automatic interviews enabled)
		 */
		disableOnNodeAdded?: boolean;
	};

	/** Host abstractions allowing Z-Wave JS to run on different platforms */
	host?: {
		/**
		 * Specifies which bindings are used to access the file system when
		 * reading or writing the cache, or loading device configuration files.
		 */
		fs?: FileSystem;

		/**
		 * Specifies which bindings are used interact with serial ports.
		 */
		serial?: Serial;

		/**
		 * Specifies which bindings are used to interact with the database used to store the cache.
		 */
		db?: DatabaseFactory;

		/**
		 * Specifies the logging implementation to be used
		 */
		log?: LogFactory;
	};

	storage: {
		/**
		 * Allows you to replace the default file system driver used to store and read the cache
		 * @deprecated Use `bindings.fs` instead.
		 */
		driver?: LegacyFileSystemBindings;
		/** Allows you to specify a different cache directory */
		cacheDir: string;
		/**
		 * Allows you to specify a different directory for the lockfiles than cacheDir.
		 * Can also be set with the ZWAVEJS_LOCK_DIRECTORY env variable.
		 */
		lockDir?: string;

		/**
		 * Allows you to specify a directory where the embedded device configuration files are stored.
		 * When set, the configuration files can automatically be updated using `Driver.installConfigUpdate()`
		 * without having to update the npm packages.
		 * Can also be set using the ZWAVEJS_EXTERNAL_CONFIG env variable.
		 */
		deviceConfigExternalDir?: string;

		/**
		 * Allows you to specify a directory where device configuration files can be loaded from with higher priority than the included ones.
		 * This directory does not get indexed and should be used sparingly, e.g. for testing.
		 */
		deviceConfigPriorityDir?: string;

		/**
		 * How frequently the values and metadata should be written to the DB files. This is a compromise between data loss
		 * in cause of a crash and disk wear:
		 *
		 * * `"fast"` immediately writes every change to disk
		 * * `"slow"` writes at most every 5 minutes or after 500 changes - whichever happens first
		 * * `"normal"` is a compromise between the two options
		 */
		throttle: "fast" | "normal" | "slow";
	};

	/**
	 * Specify the security keys to use for encryption (Z-Wave Classic). Each one must be a Buffer of exactly 16 bytes.
	 */
	securityKeys?: {
		S2_AccessControl?: Uint8Array;
		S2_Authenticated?: Uint8Array;
		S2_Unauthenticated?: Uint8Array;
		S0_Legacy?: Uint8Array;
	};

	/**
	 * Specify the security keys to use for encryption (Z-Wave Long Range). Each one must be a Buffer of exactly 16 bytes.
	 */
	securityKeysLongRange?: {
		S2_AccessControl?: Uint8Array;
		S2_Authenticated?: Uint8Array;
	};

	/**
	 * Defines the callbacks that are necessary to trigger user interaction during S2 inclusion.
	 * If not given, nodes won't be included using S2, unless matching provisioning entries exists.
	 */
	inclusionUserCallbacks?: InclusionUserCallbacks;

	/**
	 * Defines the callbacks that are necessary to trigger user interaction during S2 bootstrapping when joining a network.
	 * If not given, joining a network with S2 may not be possible, unless the application handles
	 * displaying the DSK to the user on its own.
	 */
	joinNetworkUserCallbacks?: JoinNetworkUserCallbacks;

	/**
	 * Some SET-type commands optimistically update the current value to match the target value
	 * when the device acknowledges the command.
	 *
	 * While this generally makes UIs feel more responsive, it is not necessary for devices which report their status
	 * on their own and can lead to confusing behavior when dealing with slow devices like blinds.
	 *
	 * To disable the optimistic update, set this option to `true`.
	 * Default: `false`
	 */
	disableOptimisticValueUpdate?: boolean;

	/**
	 * By default, the driver assumes to be talking to a single application. In this scenario a successful `setValue` call
	 * is enough for the application to know that the value was changed and update its own cache or UI.
	 *
	 * Therefore, the `"value updated"` event is not emitted after `setValue` unless the change was verified by the device.
	 * To get `"value updated"` events nonetheless, set this option to `true`.
	 *
	 * Default: `false`
	 */
	emitValueUpdateAfterSetValue?: boolean;

	features: {
		/**
		 * Soft Reset is required after some commands like changing the RF region or restoring an NVM backup.
		 * Because it may be problematic in certain environments, we provide the user with an option to opt out.
		 * Default: `true,` except when ZWAVEJS_DISABLE_SOFT_RESET env variable is set.
		 *
		 * **Note:** This option has no effect on 700+ series controllers. For those, soft reset is always enabled.
		 */
		softReset?: boolean;

		/**
		 * When enabled, the driver attempts to detect when the controller becomes unresponsive (meaning it did not
		 * respond within the configured timeout) and performs appropriate recovery actions.
		 *
		 * This includes the following scenarios:
		 * * A command was not acknowledged by the controller
		 * * The callback for a Send Data command was not received, even after aborting a timed out transmission
		 *
		 * In certain environments however, this feature can interfere with the normal operation more than intended,
		 * so it can be disabled. However disabling it means that commands can fail unnecessarily and nodes can be
		 * incorrectly marked as dead.
		 *
		 * Default: `true`, except when the ZWAVEJS_DISABLE_UNRESPONSIVE_CONTROLLER_RECOVERY env variable is set.
		 */
		unresponsiveControllerRecovery?: boolean;

		/**
		 * Controllers of the 700 series and newer have a hardware watchdog that can be enabled to automatically
		 * reset the chip in case it becomes unresponsive. This option controls whether Z-Wave JS enables the watchdog automatically.
		 *
		 * @deprecated
		 * It makes more sense to handle the watchdog in the firmware itself. Recent firmware versions do just that, so
		 * this option is no longer necessary.
		 *
		 * Default: `false`
		 */
		watchdog?: boolean;

		/**
		 * Z-Wave JS normally uses all Command Classes it implements and responds to version queries for all of them.
		 *
		 * However, some Command Classes come with certification requirements that might not be fulfilled by the application.
		 * To allow for deploying products based on Z-Wave JS without having to implement all of them,
		 * this option allows you to disable certain Command Classes. Z-Wave JS will act as if the specified Command Classes are not implemented.
		 *
		 * Note that this only affects a subset of CCs that is not mandatory.
		 */
		disableCommandClasses: CommandClasses[];
	};

	preferences: {
		/**
		 * The preferred scales to use when querying sensors. The key is either:
		 * - the name of a named scale group, e.g. "temperature", which applies to every sensor type that uses this scale group.
		 * - or the numeric sensor type to specify the scale for a single sensor type
		 *
		 * Single-type preferences have a higher priority than named ones. For example, the following preference
		 * ```js
		 * {
		 *     temperature: "°F",
		 *     0x01: "°C",
		 * }
		 * ```
		 * will result in using the Fahrenheit scale for all temperature sensors, except the air temperature (0x01).
		 *
		 * The value must match what is defined in the sensor type config file and contain either:
		 * - the label (e.g. "Celsius", "Fahrenheit")
		 * - the unit (e.g. "°C", "°F")
		 * - or the numeric key of the scale (e.g. 0 or 1).
		 *
		 * Default:
		 * ```js
		 * {
		 *     temperature: "Celsius"
		 * }
		 * ```
		 */
		scales: Partial<Record<string | number, string | number>>;
	};

	/**
	 * RF-related settings that should automatically be configured on startup. If Z-Wave JS detects
	 * a discrepancy between these settings and the actual configuration, it will automatically try to
	 * re-configure the controller to match.
	 */
	rf?: {
		/** The RF region the radio should be tuned to. */
		region?: RFRegion;

		/**
		 * Whether LR-capable regions should automatically be preferred over their corresponding non-LR regions, e.g. `USA` -> `USA (Long Range)`.
		 * This also overrides the `rf.region` setting if the desired region is not LR-capable.
		 *
		 * Default: true.
		 */
		preferLRRegion?: boolean;

		txPower?: {
			/**
			 * The desired TX power in dBm, or "auto" to automatically apply the legal limits whenever the RF region is changed.
			 *
			 * The "auto" setting has two caveats:
			 *   - It will only apply when actually changing the region (e.g. from `Europe` to `USA`), but not when
			 *     switching from a non-LR region to the corresponding LR region (e.g. from `Europe` to `Europe (Long Range)`).
			 *   - It requires the legal limits for the configured RF region to be known. Currently, this
			 *     is only the case for Europe and the USA.
			 */
			powerlevel: number | "auto";

			/** A hardware-specific calibration value. */
			measured0dBm?: number;
		};

		/**
		 * The desired max. powerlevel setting for Z-Wave Long Range in dBm, or "auto" to automatically apply the legal limits whenever the RF region is changed.
		 *
		 * The "auto" setting has two caveats:
		 *   - It will only apply when actually changing the region (e.g. from `Europe` to `USA`), but not when
		 *     switching from a non-LR region to the corresponding LR region (e.g. from `Europe` to `Europe (Long Range)`).
		 *   - It requires the legal limits for the configured RF region to be known. Currently, this
		 *     is only the case for Europe and the USA.
		 */
		maxLongRangePowerlevel?: number | "auto";

		/**
		 * The desired channel to use for Z-Wave Long Range.
		 * Auto may be unsupported by the controller and will be ignored in that case.
		 */
		longRangeChannel?:
			| LongRangeChannel.A
			| LongRangeChannel.B
			| LongRangeChannel.Auto;
	};

	apiKeys?: {
		/** API key for the Z-Wave JS Firmware Update Service (https://github.com/zwave-js/firmware-updates/) */
		firmwareUpdateService?: string;
	};

	/**
	 * Determines how the driver should be have when it encounters a controller that is in bootloader mode
	 * and when the Serial API is not available (yet).
	 * This can be useful when a controller may be stuck in bootloader mode, or when the application
	 * wants to operate in bootloader mode anyways.
	 *
	 * The following options exist:
	 * - `recover`: Z-Wave JS will attempt to recover the controller from bootloader mode.
	 *   If this does not succeed, the driver startup will fail.
	 * - `allow`: Z-Wave JS will attempt to recover the controller from bootloader mode.
	 *   If this does not succeed, the driver will continue to operate in bootloader mode,
	 *   e.g. for flashing a new image. Commands attempting to talk to the serial API will fail.
	 * - `stay`: Z-Wave JS will NOT attempt to recover the controller from bootlaoder mode.
	 *
	 * Default: `recover`
	 */
	bootloaderMode?: "recover" | "allow" | "stay";

	/**
	 * An object with application/module/component names and their versions.
	 * This will be used to build a user-agent string for requests to Z-Wave JS webservices.
	 */
	userAgent?: Record<string, string>;

	/**
	 * Specify application-specific information to use in queries from other devices
	 */
	vendor?: {
		manufacturerId: number;
		productType: number;
		productId: number;

		/** The version of the hardware the application is running on. Can be omitted if unknown. */
		hardwareVersion?: number;

		/** The icon type to use for installers. Default: 0x0500 - Generic Gateway */
		installerIcon?: number;
		/** The icon type to use for users. Default: 0x0500 - Generic Gateway */
		userIcon?: number;
	};

	/** DO NOT USE! Used for testing internally */
	testingHooks?: {
		/**
		 * A hook that allows accessing the serial port instance after opening
		 * and before interacting with it.
		 */
		onSerialPortOpen?: (port: ZWaveSerialStream) => Promise<void>;

		/**
		 * Set this to true to skip the controller identification sequence.
		 */
		skipControllerIdentification?: boolean;

		/**
		 * Set this to true to skip the interview of all nodes.
		 */
		skipNodeInterview?: boolean;

		/**
		 * Set this to true to skip checking if the Z-Wave is in bootloader mode,
		 * running a Serial API, or an end device CLI.
		 */
		skipFirmwareIdentification?: boolean;

		/**
		 * Set this to false to skip loading the configuration files. Default: `true`..
		 */
		loadConfiguration?: boolean;
	};
}

export type PartialZWaveOptions = Expand<
	& DeepPartial<
		Omit<
			ZWaveOptions,
			| "inclusionUserCallbacks"
			| "joinNetworkUserCallbacks"
			| "logConfig"
			| "testingHooks"
			| "host"
		>
	>
	& Partial<
		Pick<
			ZWaveOptions,
			| "testingHooks"
			| "vendor"
			| "host"
		>
	>
	& {
		inclusionUserCallbacks?: ZWaveOptions["inclusionUserCallbacks"];
		joinNetworkUserCallbacks?: ZWaveOptions["joinNetworkUserCallbacks"];
		logConfig?: Partial<LogConfig>;
	}
>;

export type EditableZWaveOptions = Expand<
	& Pick<
		PartialZWaveOptions,
		| "disableOptimisticValueUpdate"
		| "emitValueUpdateAfterSetValue"
		| "inclusionUserCallbacks"
		| "joinNetworkUserCallbacks"
		| "interview"
		| "logConfig"
		| "preferences"
		| "vendor"
	>
	& {
		userAgent?: Record<string, string | null | undefined>;
	}
>;

export const driverPresets = Object.freeze(
	{
		/**
		 * Increases several timeouts to be able to deal with controllers
		 * and/or nodes that have severe trouble communicating.
		 */
		SAFE_MODE: {
			timeouts: {
				// 500 series controllers that take long to respond instead of delaying the callback
				response: 60000,
				// Any controller having trouble reaching a node
				sendDataAbort: 60000,
				sendDataCallback: 65000,
				// Slow nodes taking long to respond
				report: 10000,
				nonce: 20000,
			},
			attempts: {
				// Increase communication attempts with nodes to their maximum
				sendData: 5,
				sendDataJammed: 10,
				nodeInterview: 10,
			},
		},

		/**
		 * Disables the unresponsive controller recovery to be able to deal with controllers
		 * that frequently become unresponsive for seemingly no reason.
		 */
		NO_CONTROLLER_RECOVERY: {
			features: {
				unresponsiveControllerRecovery: false,
			},
		},

		/**
		 * @deprecated
		 * This used to prevent the driver from enabling the watchdog on 700 series controllers.
		 * This is now the default behavior, so this option is no longer necessary.
		 */
		NO_WATCHDOG: {
			features: {
				watchdog: false,
			},
		},

		/**
		 * Sends battery powered nodes to sleep more quickly in order to save battery.
		 */
		BATTERY_SAVE: {
			timeouts: {
				sendToSleep: 100,
			},
		},

		/**
		 * Sends battery powered nodes to sleep less quickly to give applications
		 * more time between interactions.
		 */
		AWAKE_LONGER: {
			timeouts: {
				sendToSleep: 1000,
			},
		},
	} as const satisfies Record<string, PartialZWaveOptions>,
);

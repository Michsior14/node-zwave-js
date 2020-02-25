import { IDriver } from "../../driver/IDriver";
import { ZWaveError, ZWaveErrorCodes } from "../../error/ZWaveError";
import log from "../../log";
import { ValueID } from "../../node/ValueDB";
import { validatePayload } from "../../util/misc";
import { ValueMetadata } from "../../values/Metadata";
import {
	CCCommandOptions,
	CommandClassDeserializationOptions,
	gotDeserializationOptions,
} from "../CommandClass";
import { CommandClasses } from "../CommandClasses";
import { ManufacturerProprietaryCC } from "../ManufacturerProprietaryCC";

export const MANUFACTURERID_FIBARO = 0x10f;

/** Returns the ValueID used to store the current venetian blind position */
export function getFibaroVenetianBlindPositionValueId(
	endpoint: number,
): ValueID {
	return {
		commandClass: CommandClasses["Manufacturer Proprietary"],
		endpoint,
		property: "fibaro",
		propertyKey: "venetianBlindsPosition",
	};
}

/** Returns the value metadata for venetian blind position */
export function getFibaroVenetianBlindPositionMetadata(): ValueMetadata {
	return {
		...ValueMetadata.Level,
		label: "Venetian blinds position",
	};
}

/** Returns the ValueID used to store the current venetian blind tilt */
export function getFibaroVenetianBlindTiltValueId(endpoint: number): ValueID {
	return {
		commandClass: CommandClasses["Manufacturer Proprietary"],
		endpoint,
		property: "fibaro",
		propertyKey: "venetianBlindsTilt",
	};
}

/** Returns the value metadata for venetian blind tilt */
export function getFibaroVenetianBlindTiltMetadata(): ValueMetadata {
	return {
		...ValueMetadata.Level,
		label: "Venetian blinds tilt",
	};
}

export enum FibaroCCIDs {
	VenetianBlind = 0x26,
}

export class FibaroCC extends ManufacturerProprietaryCC {
	public constructor(
		driver: IDriver,
		options: CommandClassDeserializationOptions | CCCommandOptions,
	) {
		super(driver, options);
		if (gotDeserializationOptions(options)) {
			validatePayload(this.payload.length >= 2);
			this.fibaroCCId = this.payload[0];
			this.fibaroCCCommand = this.payload[1];
			if (new.target === FibaroCC) {
				this.payload = this.payload.slice(2);
			}

			if (
				this.fibaroCCId === FibaroCCIDs.VenetianBlind &&
				(new.target as any) !== FibaroVenetianBlindCC
			) {
				return new FibaroVenetianBlindCC(driver, options);
			}
		} else {
		}
	}

	public fibaroCCId!: number; // This is either deserialized or set by a subclass
	public fibaroCCCommand!: number;

	public serialize(): Buffer {
		return Buffer.concat([
			Buffer.from([this.fibaroCCId, this.fibaroCCCommand]),
			this.payload,
		]);
	}
}

export enum FibaroVenetianBlindCCCommand {
	Set = 0x01,
	Get = 0x02,
	Report = 0x03,
}

export class FibaroVenetianBlindCC extends FibaroCC {
	declare fibaroCCCommand: FibaroVenetianBlindCCCommand;

	public constructor(
		driver: IDriver,
		options: CommandClassDeserializationOptions | CCCommandOptions,
	) {
		super(driver, options);
		this.fibaroCCId = FibaroCCIDs.VenetianBlind;
	}

	public async interview(complete: boolean = true): Promise<void> {
		const node = this.getNode()!;
		const api = this.getEndpoint()!.commandClasses[
			"Manufacturer Proprietary"
		];

		log.controller.logNode(node.id, {
			message: `${this.constructor.name}: doing a ${
				complete ? "complete" : "partial"
			} interview...`,
			direction: "none",
		});

		log.controller.logNode(node.id, {
			message: "doing something...",
			direction: "outbound",
		});
		// TODO: Implementation
		const logMessage = `received response for something...`;
		log.controller.logNode(node.id, {
			message: logMessage,
			direction: "inbound",
		});

		// Remember that the interview is complete
		this.interviewComplete = true;
	}
}

export type FibaroVenetianBlindCCSetOptions = CCCommandOptions &
	(
		| {
				position: number;
		  }
		| {
				tilt: number;
		  }
		| {
				position: number;
				tilt: number;
		  }
	);

export class FibaroVenetianBlindCCSet extends FibaroVenetianBlindCC {
	public constructor(
		driver: IDriver,
		options:
			| CommandClassDeserializationOptions
			| FibaroVenetianBlindCCSetOptions,
	) {
		super(driver, options);
		this.fibaroCCCommand = FibaroVenetianBlindCCCommand.Set;

		if (Buffer.isBuffer(options)) {
			// TODO: Deserialize payload
			throw new ZWaveError(
				`${this.constructor.name}: deserialization not implemented`,
				ZWaveErrorCodes.Deserialization_NotImplemented,
			);
		} else {
			if ("position" in options) this.position = options.position;
			if ("tilt" in options) this.tilt = options.tilt;
		}
	}

	public position: number | undefined;
	public tilt: number | undefined;

	public serialize(): Buffer {
		const controlByte =
			(this.position != undefined ? 0b10 : 0) |
			(this.tilt != undefined ? 0b01 : 0);
		this.payload = Buffer.from([
			controlByte,
			this.position ?? 0,
			this.tilt ?? 0,
		]);
		return super.serialize();
	}
}

export class FibaroVenetianBlindCCGet extends FibaroVenetianBlindCC {
	public constructor(
		driver: IDriver,
		options:
			| CommandClassDeserializationOptions
			| FibaroVenetianBlindCCSetOptions,
	) {
		super(driver, options);
		this.fibaroCCCommand = FibaroVenetianBlindCCCommand.Get;
	}
}

export class FibaroVenetianBlindCCReport extends FibaroVenetianBlindCC {
	public constructor(
		driver: IDriver,
		options: CommandClassDeserializationOptions,
	) {
		super(driver, options);
		this.fibaroCCCommand = FibaroVenetianBlindCCCommand.Report;

		validatePayload(this.payload.length >= 3);

		const valueDB = this.getValueDB();
		// When the node sends a report, payload[0] === 0b11. This is probably a
		// bit mask for position and tilt
		if (!!(this.payload[0] & 0b10)) {
			this.position = this.payload[1];
			const positionValueId = getFibaroVenetianBlindPositionValueId(
				this.endpointIndex,
			);
			valueDB.setMetadata(positionValueId, {
				...ValueMetadata.Level,
				label: "Venetian blinds position",
			});
			valueDB.setValue(positionValueId, this.position);
		}
		if (!!(this.payload[0] & 0b01)) {
			this.tilt = this.payload[2];
			const tiltValueId = getFibaroVenetianBlindTiltValueId(
				this.endpointIndex,
			);
			valueDB.setMetadata(tiltValueId, {
				...ValueMetadata.Level,
				label: "Venetian blinds tilt",
			});
			valueDB.setValue(tiltValueId, this.tilt);
		}
	}

	public readonly position?: number;
	public readonly tilt?: number;
}

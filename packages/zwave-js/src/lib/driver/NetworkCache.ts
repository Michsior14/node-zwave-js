import type { AssociationAddress } from "@zwave-js/cc";
import {
	type CommandClasses,
	NodeType,
	Protocols,
	SecurityClass,
	ZWaveError,
	ZWaveErrorCodes,
	dskFromString,
	dskToString,
	securityClassOrder,
} from "@zwave-js/core";
import { Bytes, getEnumMemberName, num2hex, pickDeep } from "@zwave-js/shared";
import type {
	Database,
	ReadFile,
	ReadFileSystemInfo,
} from "@zwave-js/shared/bindings";
import { isArray, isObject } from "alcalzone-shared/typeguards";
import path from "pathe";
import {
	ProvisioningEntryStatus,
	type SmartStartProvisioningEntry,
} from "../controller/Inclusion.js";
import { DeviceClass } from "../node/DeviceClass.js";
import { InterviewStage } from "../node/_Types.js";

/**
 * Defines the keys that are used to store certain properties in the network cache.
 */
export const cacheKeys = {
	controller: {
		provisioningList: "controller.provisioningList",
		associations: (groupId: number) => `controller.associations.${groupId}`,
		securityKeys: (secClass: SecurityClass) =>
			`controller.securityKeys.${
				getEnumMemberName(
					SecurityClass,
					secClass,
				)
			}`,
		securityKeysLongRange: (secClass: SecurityClass) =>
			`controller.securityKeyLongRange.${
				getEnumMemberName(
					SecurityClass,
					secClass,
				)
			}`,
		privateKey: "controller.privateKey",
	},
	// TODO: somehow these functions should be combined with the pattern matching below
	node: (nodeId: number) => {
		const nodeBaseKey = `node.${nodeId}.`;
		return {
			_baseKey: nodeBaseKey,
			_securityClassBaseKey: `${nodeBaseKey}securityClasses`,
			_priorityReturnRouteBaseKey: `${nodeBaseKey}priorityReturnRoute`,
			interviewStage: `${nodeBaseKey}interviewStage`,
			deviceClass: `${nodeBaseKey}deviceClass`,
			isListening: `${nodeBaseKey}isListening`,
			isFrequentListening: `${nodeBaseKey}isFrequentListening`,
			isRouting: `${nodeBaseKey}isRouting`,
			supportedDataRates: `${nodeBaseKey}supportedDataRates`,
			protocolVersion: `${nodeBaseKey}protocolVersion`,
			nodeType: `${nodeBaseKey}nodeType`,
			supportsSecurity: `${nodeBaseKey}supportsSecurity`,
			supportsBeaming: `${nodeBaseKey}supportsBeaming`,
			securityClass: (secClass: SecurityClass) =>
				`${nodeBaseKey}securityClasses.${
					getEnumMemberName(
						SecurityClass,
						secClass,
					)
				}`,
			dsk: `${nodeBaseKey}dsk`,
			endpoint: (index: number) => {
				const endpointBaseKey = `${nodeBaseKey}endpoint.${index}.`;
				const ccBaseKey = `${endpointBaseKey}commandClass.`;
				return {
					_baseKey: endpointBaseKey,
					_ccBaseKey: ccBaseKey,
					commandClass: (ccId: CommandClasses) => {
						const ccAsHex = num2hex(ccId);
						return `${ccBaseKey}${ccAsHex}`;
					},
				};
			},
			hasSUCReturnRoute: `${nodeBaseKey}hasSUCReturnRoute`,
			priorityReturnRoute: (destinationNodeId: number) =>
				`${nodeBaseKey}priorityReturnRoute.${destinationNodeId}`,
			prioritySUCReturnRoute: `${nodeBaseKey}priorityReturnRoute.SUC`,
			customReturnRoutes: (destinationNodeId: number) =>
				`${nodeBaseKey}customReturnRoutes.${destinationNodeId}`,
			customSUCReturnRoutes: `${nodeBaseKey}customReturnRoutes.SUC`,
			defaultTransitionDuration:
				`${nodeBaseKey}defaultTransitionDuration`,
			defaultVolume: `${nodeBaseKey}defaultVolume`,
			lastSeen: `${nodeBaseKey}lastSeen`,
			deviceConfigHash: `${nodeBaseKey}deviceConfigHash`,
		};
	},
} as const;

export const cacheKeyUtils = {
	nodeIdFromKey: (key: string): number | undefined => {
		const match = /^node\.(?<nodeId>\d+)\./.exec(key);
		if (match) {
			return parseInt(match.groups!.nodeId, 10);
		}
	},
	nodePropertyFromKey: (key: string): string | undefined => {
		const match = /^node\.\d+\.(?<property>[^\.]+)$/.exec(key);
		return match?.groups?.property;
	},
	isEndpointKey: (key: string): boolean => {
		return /endpoints\.(?<index>\d+)$/.test(key);
	},
	endpointIndexFromKey: (key: string): number | undefined => {
		const match = /endpoints\.(?<index>\d+)$/.exec(key);
		if (match) {
			return parseInt(match.groups!.index, 10);
		}
	},
	destinationFromPriorityReturnRouteKey: (
		key: string,
	): number | undefined => {
		const match = /\.priorityReturnRoute\.(?<nodeId>\d+)$/.exec(key);
		if (match) {
			return parseInt(match.groups!.nodeId, 10);
		}
	},
} as const;

function tryParseInterviewStage(value: unknown): InterviewStage | undefined {
	if (
		(typeof value === "string" || typeof value === "number")
		&& value in InterviewStage
	) {
		return typeof value === "number"
			? value
			: (InterviewStage as any)[value];
	}
}

function tryParseDeviceClass(value: unknown): DeviceClass | undefined {
	if (isObject(value)) {
		const { basic, generic, specific } = value;
		if (
			typeof basic === "number"
			&& typeof generic === "number"
			&& typeof specific === "number"
		) {
			return new DeviceClass(
				basic,
				generic,
				specific,
			);
		}
	}
}

function tryParseSecurityClasses(
	value: unknown,
): Map<SecurityClass, boolean> | undefined {
	if (isObject(value)) {
		const ret = new Map<SecurityClass, boolean>();
		for (const [key, val] of Object.entries(value)) {
			if (
				key in SecurityClass
				&& typeof (SecurityClass as any)[key] === "number"
				&& typeof val === "boolean"
			) {
				ret.set((SecurityClass as any)[key] as SecurityClass, val);
			}
		}
		return ret;
	}
}

function tryParseNodeType(value: unknown): NodeType | undefined {
	if (typeof value === "string" && value in NodeType) {
		return (NodeType as any)[value];
	}
}

function tryParseProvisioningList(
	value: unknown,
): SmartStartProvisioningEntry[] | undefined {
	const ret: SmartStartProvisioningEntry[] = [];
	if (!isArray(value)) return;
	for (const entry of value) {
		if (
			isObject(entry)
			&& typeof entry.dsk === "string"
			&& isArray(entry.securityClasses)
			// securityClasses are stored as strings, not the enum values
			&& entry.securityClasses.every((s) => isSerializedSecurityClass(s))
			&& (entry.requestedSecurityClasses == undefined
				|| (isArray(entry.requestedSecurityClasses)
					&& entry.requestedSecurityClasses.every((s) =>
						isSerializedSecurityClass(s)
					)))
			// protocol and supportedProtocols are (supposed to be) stored as strings, not the enum values
			&& (entry.protocol == undefined
				|| isSerializedProtocol(entry.protocol))
			&& (entry.supportedProtocols == undefined || (
				isArray(entry.supportedProtocols)
				&& entry.supportedProtocols.every((s) =>
					isSerializedProtocol(s)
				)
			))
			&& (entry.status == undefined
				|| isSerializedProvisioningEntryStatus(entry.status))
		) {
			// This is at least a PlannedProvisioningEntry, maybe it is an IncludedProvisioningEntry
			if ("nodeId" in entry && typeof entry.nodeId !== "number") {
				return;
			}

			const parsed = {
				...entry,
			} as unknown as SmartStartProvisioningEntry;
			parsed.securityClasses = entry.securityClasses
				.map((s) => tryParseSerializedSecurityClass(s))
				.filter((s) => s !== undefined);
			if (entry.requestedSecurityClasses) {
				parsed.requestedSecurityClasses = (
					entry.requestedSecurityClasses as any[]
				)
					.map((s) => tryParseSerializedSecurityClass(s))
					.filter((s) => s !== undefined);
			}
			if (entry.status != undefined) {
				parsed.status = ProvisioningEntryStatus[
					entry.status as any
				] as any as ProvisioningEntryStatus;
			}
			if (entry.protocol != undefined) {
				parsed.protocol = tryParseSerializedProtocol(entry.protocol);
			}
			if (entry.supportedProtocols) {
				parsed.supportedProtocols = (
					entry.supportedProtocols as any[]
				)
					.map((s) => tryParseSerializedProtocol(s))
					.filter((s) => s !== undefined);
			}
			ret.push(parsed);
		} else {
			return;
		}
	}
	return ret;
}

function isSerializedSecurityClass(value: unknown): boolean {
	// There was an error in previous iterations of the migration code, so we
	// now have to deal with the following variants:
	// 1. plain numbers representing a valid Security Class: 1
	// 2. strings representing a valid Security Class: "S2_Unauthenticated"
	// 3. strings represending a mis-formatted Security Class: "unknown (0xS2_Unauthenticated)"
	if (typeof value === "number" && value in SecurityClass) return true;
	if (typeof value === "string") {
		if (value.startsWith("unknown (0x") && value.endsWith(")")) {
			value = value.slice(11, -1);
		}
		if (
			(value as any) in SecurityClass
			&& typeof SecurityClass[value as any] === "number"
		) {
			return true;
		}
	}
	return false;
}

function tryParseSerializedSecurityClass(
	value: unknown,
): SecurityClass | undefined {
	// There was an error in previous iterations of the migration code, so we
	// now have to deal with the following variants:
	// 1. plain numbers representing a valid Security Class: 1
	// 2. strings representing a valid Security Class: "S2_Unauthenticated"
	// 3. strings represending a mis-formatted Security Class: "unknown (0xS2_Unauthenticated)"

	if (typeof value === "number" && value in SecurityClass) return value;
	if (typeof value === "string") {
		if (value.startsWith("unknown (0x") && value.endsWith(")")) {
			value = value.slice(11, -1);
		}
		if (
			(value as any) in SecurityClass
			&& typeof SecurityClass[value as any] === "number"
		) {
			return (SecurityClass as any)[value as any];
		}
	}
}

function isSerializedProvisioningEntryStatus(
	s: unknown,
): s is keyof typeof ProvisioningEntryStatus {
	return (
		typeof s === "string"
		&& s in ProvisioningEntryStatus
		&& typeof ProvisioningEntryStatus[s as any] === "number"
	);
}

function isSerializedProtocol(
	s: unknown,
): boolean {
	// The list of supported protocols has been around since before we started
	// saving them as their stringified variant, so we
	// now have to deal with the following variants:
	// 1. plain numbers representing a valid Protocol: 0
	// 2. strings representing a valid Protocols: "ZWave"
	if (typeof s === "number" && s in Protocols) return true;
	return (
		typeof s === "string"
		&& s in Protocols
		&& typeof Protocols[s as any] === "number"
	);
}

function tryParseSerializedProtocol(
	value: unknown,
): Protocols | undefined {
	// The list of supported protocols has been around since before we started
	// saving them as their stringified variant, so we
	// now have to deal with the following variants:
	// 1. plain numbers representing a valid Protocol: 0
	// 2. strings representing a valid Protocols: "ZWave"

	if (typeof value === "number" && value in Protocols) return value;
	if (typeof value === "string") {
		if (
			(value as any) in Protocols
			&& typeof Protocols[value as any] === "number"
		) {
			return (Protocols as any)[value as any];
		}
	}
}

function tryParseDate(value: unknown): Date | undefined {
	// Dates are stored as timestamps
	if (typeof value === "number") {
		const ret = new Date(value);
		if (!isNaN(ret.getTime())) return ret;
	}
}

function tryParseAssociationAddress(
	value: unknown,
): AssociationAddress | undefined {
	if (isObject(value)) {
		const { nodeId, endpoint } = value;
		if (typeof nodeId !== "number") return;
		if (endpoint !== undefined && typeof endpoint !== "number") return;

		return { nodeId, endpoint };
	}
}

function tryParseBuffer(
	value: unknown,
): Uint8Array | undefined {
	if (typeof value === "string") {
		try {
			return Bytes.from(value, "hex");
		} catch {
			// ignore
		}
	}
}

function tryParseBufferBase64(
	value: unknown,
): Uint8Array | undefined {
	if (typeof value === "string") {
		try {
			return Bytes.from(value, "base64");
		} catch {
			// ignore
		}
	}
}

export function deserializeNetworkCacheValue(
	key: string,
	value: unknown,
): unknown {
	function ensureType<T extends "boolean" | "number" | "string">(
		value: any,
		type: T,
	): T | boolean {
		if (typeof value === type) return value as T;
		throw new ZWaveError(
			`Incorrect type ${typeof value} for property "${key}"`,
			ZWaveErrorCodes.Driver_InvalidCache,
		);
	}

	function fail(): never {
		throw new ZWaveError(
			`Failed to deserialize property "${key}"`,
			ZWaveErrorCodes.Driver_InvalidCache,
		);
	}

	switch (cacheKeyUtils.nodePropertyFromKey(key)) {
		case "interviewStage": {
			value = tryParseInterviewStage(value);
			if (value) return value;
			fail();
		}
		case "deviceClass": {
			value = tryParseDeviceClass(value);
			if (value) return value;
			fail();
		}
		case "isListening":
		case "isRouting":
		case "hasSUCReturnRoute":
			return ensureType(value, "boolean");

		case "isFrequentListening": {
			switch (value) {
				case "1000ms":
				case true:
					return "1000ms";
				case "250ms":
					return "250ms";
				case false:
					return false;
			}
			fail();
		}

		case "dsk": {
			if (typeof value === "string") {
				return dskFromString(value);
			}
			fail();
		}

		case "supportsSecurity":
			return ensureType(value, "boolean");
		case "supportsBeaming":
			try {
				return ensureType(value, "boolean");
			} catch {
				return ensureType(value, "string");
			}
		case "protocolVersion":
			return ensureType(value, "number");

		case "nodeType": {
			value = tryParseNodeType(value);
			if (value) return value;
			fail();
		}

		case "supportedDataRates": {
			if (
				isArray(value)
				&& value.every((r: unknown) => typeof r === "number")
			) {
				return value;
			}
			fail();
		}

		case "lastSeen": {
			value = tryParseDate(value);
			if (value) return value;
			fail();
		}

		case "deviceConfigHash": {
			if (typeof value !== "string") fail();
			const versionMatch = value.match(/^\$v\d+\$/)?.[0];
			if (versionMatch) {
				// Versioned hash, stored as base64, preserve the version prefix
				value = tryParseBufferBase64(value.slice(versionMatch.length));
				if (value) {
					value = Bytes.concat([
						Bytes.from(versionMatch, "utf8"),
						value as Uint8Array,
					]);
				}
			} else {
				// Legacy hash, no version prefix, stored as hex
				value = tryParseBuffer(value);
			}

			if (value) return value;
			fail();
		}
	}

	// Other properties
	if (key.startsWith("controller.associations.")) {
		value = tryParseAssociationAddress(value);
		if (value) return value;
		fail();
	} else if (key.startsWith("controller.securityKeys.")) {
		value = tryParseBuffer(value);
		if (value) return value;
		fail();
	}

	switch (key) {
		case cacheKeys.controller.provisioningList: {
			value = tryParseProvisioningList(value);
			if (value) return value;
			fail();
		}
		case cacheKeys.controller.privateKey: {
			value = tryParseBuffer(value);
			if (value) return value;
			fail();
		}
	}

	return value;
}

export function serializeNetworkCacheValue(
	key: string,
	value: unknown,
): unknown {
	// Node-specific properties
	switch (cacheKeyUtils.nodePropertyFromKey(key)) {
		case "interviewStage": {
			return InterviewStage[value as any];
		}
		case "deviceClass": {
			const deviceClass = value as DeviceClass;
			return {
				basic: deviceClass.basic,
				generic: deviceClass.generic.key,
				specific: deviceClass.specific.key,
			};
		}
		case "nodeType": {
			return NodeType[value as any];
		}
		case "securityClasses": {
			const ret: Record<string, boolean> = {};
			// Save security classes where they are known
			for (const secClass of securityClassOrder) {
				if (secClass in (value as any)) {
					ret[SecurityClass[secClass]] = (value as any)[secClass];
				}
			}
			return ret;
		}
		case "dsk": {
			return dskToString(value as Uint8Array);
		}
		case "lastSeen": {
			// Dates are stored as timestamps
			return (value as Date).getTime();
		}

		case "deviceConfigHash": {
			// Preserve the version prefix if it exists
			const valueAsString = Bytes.view(value as Uint8Array).toString(
				"utf8",
			);
			const versionMatch = valueAsString.match(/^\$v\d+\$/)?.[0];
			if (versionMatch) {
				return versionMatch
					+ Bytes.view(value as Uint8Array).subarray(
						versionMatch.length,
					).toString("base64");
			} else {
				// For lecacy hashes, just return the hex representation
				return Bytes.view(value as Uint8Array).toString("hex");
			}
		}
	}

	// Other dynamic properties
	if (key.startsWith("controller.securityKeys.")) {
		return Bytes.view(value as Uint8Array).toString("hex");
	}

	// Other fixed properties
	switch (key) {
		case cacheKeys.controller.provisioningList: {
			const ret: any = [];
			for (const entry of value as SmartStartProvisioningEntry[]) {
				const serialized: Record<string, any> = { ...entry };
				serialized.securityClasses = entry.securityClasses.map((c) =>
					getEnumMemberName(SecurityClass, c)
				);
				if (entry.requestedSecurityClasses) {
					serialized.requestedSecurityClasses = entry
						.requestedSecurityClasses.map((c) =>
							getEnumMemberName(SecurityClass, c)
						);
				}
				if (entry.status != undefined) {
					serialized.status = getEnumMemberName(
						ProvisioningEntryStatus,
						entry.status,
					);
				}
				if (entry.protocol != undefined) {
					serialized.protocol = getEnumMemberName(
						Protocols,
						entry.protocol,
					);
				}
				if (entry.supportedProtocols != undefined) {
					serialized.supportedProtocols = entry.supportedProtocols
						.map(
							(p) => getEnumMemberName(Protocols, p),
						);
				}
				ret.push(serialized);
			}
			return ret;
		}
		case cacheKeys.controller.privateKey: {
			return Bytes.view(value as Uint8Array).toString("hex");
		}
	}

	return value;
}

/** Defines the JSON paths that were used to store certain properties in the legacy network cache */
const legacyPaths = {
	// These seem to duplicate the ones in cacheKeys, but this allows us to change
	// something in the future without breaking migration
	controller: {
		provisioningList: "controller.provisioningList",
	},
	node: {
		// These are relative to the node object
		interviewStage: `interviewStage`,
		deviceClass: `deviceClass`,
		isListening: `isListening`,
		isFrequentListening: `isFrequentListening`,
		isRouting: `isRouting`,
		supportedDataRates: `supportedDataRates`,
		protocolVersion: `protocolVersion`,
		nodeType: `nodeType`,
		supportsSecurity: `supportsSecurity`,
		supportsBeaming: `supportsBeaming`,
		securityClasses: `securityClasses`,
		dsk: `dsk`,
	},
	commandClass: {
		// These are relative to the commandClasses object
		name: `name`,
		endpoint: (index: number) => `endpoints.${index}`,
	},
} as const;

export async function migrateLegacyNetworkCache(
	homeId: number,
	networkCache: Database<any>,
	valueDB: Database<unknown>,
	fs: ReadFileSystemInfo & ReadFile,
	cacheDir: string,
): Promise<void> {
	const cacheFile = path.join(cacheDir, `${homeId.toString(16)}.json`);
	try {
		const stat = await fs.stat(cacheFile);
		if (!stat.isFile()) return;
	} catch {
		// The file does not exist
		return;
	}

	const legacyContents = await fs.readFile(cacheFile);
	const legacy = JSON.parse(Bytes.view(legacyContents).toString("utf8"));

	const jsonl = networkCache;
	function tryMigrate(
		targetKey: string,
		source: Record<string, any>,
		sourcePath: string,
		converter?: (value: any) => any,
	): void {
		let val = pickDeep(source, sourcePath);
		if (val != undefined && converter) val = converter(val);
		if (val != undefined) jsonl.set(targetKey, val);
	}

	// Translate all possible entries

	// Controller provisioning list
	tryMigrate(
		cacheKeys.controller.provisioningList,
		legacy,
		legacyPaths.controller.provisioningList,
		tryParseProvisioningList,
	);

	// All nodes, ...
	if (isObject(legacy.nodes)) {
		for (const node of Object.values<any>(legacy.nodes)) {
			if (!isObject(node) || typeof node.id !== "number") continue;
			const nodeCacheKeys = cacheKeys.node(node.id);

			// ... their properties
			tryMigrate(
				nodeCacheKeys.interviewStage,
				node,
				legacyPaths.node.interviewStage,
				tryParseInterviewStage,
			);
			tryMigrate(
				nodeCacheKeys.deviceClass,
				node,
				legacyPaths.node.deviceClass,
				(v) => tryParseDeviceClass(v),
			);
			tryMigrate(
				nodeCacheKeys.isListening,
				node,
				legacyPaths.node.isListening,
			);
			tryMigrate(
				nodeCacheKeys.isFrequentListening,
				node,
				legacyPaths.node.isFrequentListening,
			);
			tryMigrate(
				nodeCacheKeys.isRouting,
				node,
				legacyPaths.node.isRouting,
			);
			tryMigrate(
				nodeCacheKeys.supportedDataRates,
				node,
				legacyPaths.node.supportedDataRates,
			);
			tryMigrate(
				nodeCacheKeys.protocolVersion,
				node,
				legacyPaths.node.protocolVersion,
			);
			tryMigrate(
				nodeCacheKeys.nodeType,
				node,
				legacyPaths.node.nodeType,
				tryParseNodeType,
			);
			tryMigrate(
				nodeCacheKeys.supportsSecurity,
				node,
				legacyPaths.node.supportsSecurity,
			);
			tryMigrate(
				nodeCacheKeys.supportsBeaming,
				node,
				legacyPaths.node.supportsBeaming,
			);
			// Convert security classes to single entries
			const securityClasses = tryParseSecurityClasses(
				pickDeep(node, legacyPaths.node.securityClasses),
			);
			if (securityClasses) {
				for (const [secClass, val] of securityClasses) {
					jsonl.set(nodeCacheKeys.securityClass(secClass), val);
				}
			}
			tryMigrate(
				nodeCacheKeys.dsk,
				node,
				legacyPaths.node.dsk,
				dskFromString,
			);

			// ... and command classes
			// The nesting was inverted from the legacy cache: node -> EP -> CCs
			// as opposed to node -> CC -> EPs
			if (isObject(node.commandClasses)) {
				for (
					const [ccIdHex, cc] of Object.entries<any>(
						node.commandClasses,
					)
				) {
					const ccId = parseInt(ccIdHex, 16);
					if (isObject(cc.endpoints)) {
						for (const endpointId of Object.keys(cc.endpoints)) {
							const endpointIndex = parseInt(endpointId, 10);

							const cacheKey = nodeCacheKeys
								.endpoint(endpointIndex)
								.commandClass(ccId);

							tryMigrate(
								cacheKey,
								cc,
								legacyPaths.commandClass.endpoint(
									endpointIndex,
								),
							);
						}
					}
				}
			}

			// In addition, try to move the hacky value ID for hasSUCReturnRoute from the value DB to the network cache
			const dbKey = JSON.stringify({
				nodeId: node.id,
				commandClass: -1,
				endpoint: 0,
				property: "hasSUCReturnRoute",
			});
			if (valueDB.has(dbKey)) {
				const hasSUCReturnRoute = valueDB.get(dbKey);
				valueDB.delete(dbKey);
				jsonl.set(nodeCacheKeys.hasSUCReturnRoute, hasSUCReturnRoute);
			}
		}
	}
}

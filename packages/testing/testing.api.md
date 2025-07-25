## API Report File for "@zwave-js/testing"

> Do not edit this file. It is a report generated by [API Extractor](https://api-extractor.com/).

```ts

import type { CCEncodingContext } from '@zwave-js/cc';
import { CCId } from '@zwave-js/core';
import type { ColorComponent } from '@zwave-js/cc';
import type { CommandClass } from '@zwave-js/cc';
import { CommandClasses } from '@zwave-js/core';
import { CommandClassInfo } from '@zwave-js/core';
import type { ConfigValue } from '@zwave-js/core';
import type { ConfigValueFormat } from '@zwave-js/core';
import { FunctionType } from '@zwave-js/serial';
import type { KeypadMode } from '@zwave-js/cc';
import type { MaybeUnknown } from '@zwave-js/core';
import { Message } from '@zwave-js/serial';
import { MessageEncodingContext } from '@zwave-js/serial';
import { MessageParsingContext } from '@zwave-js/serial';
import type { MockPort } from '@zwave-js/serial/mock';
import { NodeProtocolInfoAndDeviceClass } from '@zwave-js/core';
import { SecurityManagers } from '@zwave-js/core';
import type { SwitchType } from '@zwave-js/cc';
import type { ThermostatMode } from '@zwave-js/cc';
import type { ThermostatSetpointType } from '@zwave-js/cc';
import type { UserIDStatus } from '@zwave-js/cc';
import type { WindowCoveringParameter } from '@zwave-js/cc';
import { ZWaveApiVersion } from '@zwave-js/core';
import { ZWaveLibraryTypes } from '@zwave-js/core';
import { ZWaveSerialStream } from '@zwave-js/serial';

// Warning: (ae-missing-release-tag) "BinarySensorCCCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface BinarySensorCCCapabilities {
    // (undocumented)
    getValue?: (sensorType: number | undefined) => boolean | undefined;
    // (undocumented)
    supportedSensorTypes: number[];
}

// Warning: (ae-missing-release-tag) "BinarySwitchCCCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface BinarySwitchCCCapabilities {
    // (undocumented)
    defaultValue?: MaybeUnknown<boolean>;
}

// Warning: (ae-missing-release-tag) "ccCaps" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public
export function ccCaps<T extends CommandClasses>(caps: PartialCCCapabilities<T>): PartialCCCapabilities<T>;

// Warning: (ae-missing-release-tag) "CCIdToCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export type CCIdToCapabilities<T extends CommandClasses = CommandClasses> = T extends keyof CCSpecificCapabilities ? CCSpecificCapabilities[T] : never;

// Warning: (ae-missing-release-tag) "CCSpecificCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export type CCSpecificCapabilities = {
    [CommandClasses.Configuration]: ConfigurationCCCapabilities;
    [CommandClasses.Notification]: NotificationCCCapabilities;
    [48]: BinarySensorCCCapabilities;
    [0x25]: BinarySwitchCCCapabilities;
    [49]: MultilevelSensorCCCapabilities;
    [0x26]: MultilevelSwitchCCCapabilities;
    [51]: ColorSwitchCCCapabilities;
    [121]: SoundSwitchCCCapabilities;
    [106]: WindowCoveringCCCapabilities;
    [144]: EnergyProductionCCCapabilities;
    [64]: ThermostatModeCCCapabilities;
    [67]: ThermostatSetpointCCCapabilities;
    [99]: UserCodeCCCapabilities;
    [78]: ScheduleEntryLockCCCapabilities;
    [CommandClasses.Meter]: MeterCCCapabilities;
    [CommandClasses.Indicator]: IndicatorCCCapabilities;
};

// Warning: (ae-missing-release-tag) "ColorSwitchCCCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface ColorSwitchCCCapabilities {
    colorComponents: Partial<Record<ColorComponent, number | undefined>>;
}

// Warning: (ae-missing-release-tag) "ConfigurationCCCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface ConfigurationCCCapabilities {
    // (undocumented)
    bulkSupport?: false;
    // (undocumented)
    parameters: {
        "#": number;
        valueSize: number;
        name?: string;
        info?: string;
        format?: ConfigValueFormat;
        minValue?: ConfigValue;
        maxValue?: ConfigValue;
        defaultValue?: ConfigValue;
        readonly?: boolean;
        isAdvanced?: boolean;
        altersCapabilities?: boolean;
    }[];
}

// Warning: (ae-missing-release-tag) "createMockZWaveAckFrame" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export function createMockZWaveAckFrame(options?: Partial<Omit<MockZWaveAckFrame, "direction" | "payload">>): MockZWaveAckFrame;

// Warning: (ae-missing-release-tag) "createMockZWaveRequestFrame" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export function createMockZWaveRequestFrame(payload: CommandClass | (() => Promise<CommandClass>), options?: Partial<Omit<MockZWaveRequestFrame, "direction" | "payload">>): LazyMockZWaveRequestFrame;

// Warning: (ae-missing-release-tag) "EnergyProductionCCCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface EnergyProductionCCCapabilities {
    // (undocumented)
    values: {
        Power: {
            value: number;
            scale: 0;
        };
        "Production Total": {
            value: number;
            scale: 0;
        };
        "Production Today": {
            value: number;
            scale: 0;
        };
        "Total Time": {
            value: number;
            scale: 0 | 1;
        };
    };
}

// Warning: (ae-missing-release-tag) "getDefaultMockControllerCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export function getDefaultMockControllerCapabilities(): MockControllerCapabilities;

// Warning: (ae-missing-release-tag) "getDefaultMockEndpointCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export function getDefaultMockEndpointCapabilities(nodeCaps: {
    genericDeviceClass: number;
    specificDeviceClass: number;
}): MockEndpointCapabilities;

// Warning: (ae-missing-release-tag) "getDefaultMockNodeCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export function getDefaultMockNodeCapabilities(): MockNodeCapabilities;

// Warning: (ae-missing-release-tag) "getDefaultSupportedFunctionTypes" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export function getDefaultSupportedFunctionTypes(): FunctionType[];

// Warning: (ae-missing-release-tag) "IndicatorCCCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface IndicatorCCCapabilities {
    // (undocumented)
    getValue?: (indicatorId: number, propertyId: number) => number | undefined;
    // (undocumented)
    indicators: Record<number, {
        properties: number[];
        manufacturerSpecificDescription?: string;
    }>;
}

// Warning: (ae-missing-release-tag) "LazyMockZWaveFrame" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export type LazyMockZWaveFrame = LazyMockZWaveRequestFrame | MockZWaveAckFrame;

// Warning: (ae-missing-release-tag) "LazyMockZWaveRequestFrame" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface LazyMockZWaveRequestFrame {
    ackRequested: boolean;
    payload: CommandClass | (() => Promise<CommandClass>);
    repeaters: number[];
    // (undocumented)
    type: MockZWaveFrameType.Request;
}

// Warning: (ae-missing-release-tag) "MeterCCCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface MeterCCCapabilities {
    // (undocumented)
    getValue?: (scale: number, rateType: number) => number | {
        value: number;
        deltaTime: number;
        prevValue?: number;
    } | undefined;
    // (undocumented)
    meterType: number;
    // (undocumented)
    onReset?: (options?: {
        scale: number;
        rateType: number;
        targetValue: number;
    }) => void;
    // (undocumented)
    supportedRateTypes: number[];
    // (undocumented)
    supportedScales: number[];
    // (undocumented)
    supportsReset: boolean;
}

// Warning: (ae-missing-release-tag) "MOCK_FRAME_ACK_TIMEOUT" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public
export const MOCK_FRAME_ACK_TIMEOUT = 1000;

// Warning: (ae-missing-release-tag) "MockController" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
// Warning: (ae-unresolved-link) The @link reference could not be resolved: The package "@zwave-js/testing" does not have an export "MockSerialPort"
//
// @public
export class MockController {
    constructor(options: MockControllerOptions);
    ackHostMessage(): void;
    ackNodeRequestFrame(node: MockNode, frame?: MockZWaveRequestFrame): Promise<void>;
    // (undocumented)
    addNode(node: MockNode): void;
    assertReceivedHostMessage(predicate: (msg: Message) => boolean, options?: {
        errorMessage?: string;
    }): void;
    autoAckHostMessages: boolean;
    autoAckNodeFrames: boolean;
    // (undocumented)
    readonly capabilities: MockControllerCapabilities;
    clearReceivedHostMessages(): void;
    corruptACK: boolean;
    // (undocumented)
    defineBehavior(...behaviors: MockControllerBehavior[]): void;
    // (undocumented)
    destroy(): void;
    // (undocumented)
    encodingContext: MessageEncodingContext;
    // (undocumented)
    execute(): Promise<void>;
    // Warning: (tsdoc-param-tag-missing-hyphen) The @param block should be followed by a parameter name and then a hyphen
    expectHostACK(timeout: number): Promise<void>;
    // Warning: (tsdoc-param-tag-missing-hyphen) The @param block should be followed by a parameter name and then a hyphen
    expectHostMessage(timeout: number, predicate: (msg: Message) => boolean): Promise<Message>;
    // Warning: (tsdoc-param-tag-missing-hyphen) The @param block should be followed by a parameter name and then a hyphen
    expectNodeACK(node: MockNode, timeout: number): Promise<MockZWaveAckFrame>;
    // Warning: (tsdoc-param-tag-missing-hyphen) The @param block should be followed by a parameter name and then a hyphen
    expectNodeCC<T extends CCId = CCId>(node: MockNode, timeout: number, predicate: (cc: CCId) => cc is T): Promise<T>;
    // Warning: (tsdoc-param-tag-missing-hyphen) The @param block should be followed by a parameter name and then a hyphen
    expectNodeFrame<T extends MockZWaveFrame = MockZWaveFrame>(node: MockNode, timeout: number, predicate: (msg: MockZWaveFrame) => msg is T): Promise<T>;
    // (undocumented)
    homeId: number;
    // (undocumented)
    readonly mockPort: MockPort;
    // (undocumented)
    get nodes(): ReadonlyMap<number, MockNode>;
    onNodeFrame(node: MockNode, frame: MockZWaveFrame): Promise<void>;
    // (undocumented)
    ownNodeId: number;
    // (undocumented)
    parsingContext: MessageParsingContext;
    // (undocumented)
    get receivedHostMessages(): readonly Readonly<Message>[];
    // (undocumented)
    removeNode(node: MockNode): void;
    // (undocumented)
    securityManagers: SecurityManagers;
    sendMessageToHost(msg: Message, fromNode?: MockNode): Promise<void>;
    sendToHost(data: Uint8Array): Promise<void>;
    sendToNode(node: MockNode, frame: LazyMockZWaveFrame): Promise<MockZWaveAckFrame | undefined>;
    // (undocumented)
    readonly serial: ZWaveSerialStream;
    readonly state: Map<string, unknown>;
}

// Warning: (ae-missing-release-tag) "MockControllerBehavior" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface MockControllerBehavior {
    onHostData?: (controller: MockController, data: Uint8Array) => Promise<boolean | undefined> | boolean | undefined;
    onHostMessage?: (controller: MockController, msg: Message) => Promise<boolean | undefined> | boolean | undefined;
    onNodeFrame?: (controller: MockController, node: MockNode, frame: MockZWaveFrame) => Promise<boolean | undefined> | boolean | undefined;
}

// Warning: (ae-missing-release-tag) "MockControllerCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface MockControllerCapabilities {
    // (undocumented)
    controllerType: ZWaveLibraryTypes;
    // (undocumented)
    firmwareVersion: string;
    // (undocumented)
    isSecondary: boolean;
    // (undocumented)
    isSISPresent: boolean;
    // (undocumented)
    isStaticUpdateController: boolean;
    // (undocumented)
    isUsingHomeIdFromOtherNetwork: boolean;
    // (undocumented)
    libraryVersion: string;
    // (undocumented)
    manufacturerId: number;
    // (undocumented)
    noNodesIncluded: boolean;
    // (undocumented)
    productId: number;
    // (undocumented)
    productType: number;
    // (undocumented)
    sucNodeId: number;
    // (undocumented)
    supportedFunctionTypes: FunctionType[];
    // (undocumented)
    supportsLongRange: boolean;
    // (undocumented)
    supportsTimers: boolean;
    // (undocumented)
    wasRealPrimary: boolean;
    // (undocumented)
    watchdogEnabled: boolean;
    // (undocumented)
    zwaveApiVersion: ZWaveApiVersion;
    // (undocumented)
    zwaveChipType?: string | {
        type: number;
        version: number;
    };
}

// Warning: (ae-missing-release-tag) "MockControllerOptions" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface MockControllerOptions {
    // (undocumented)
    capabilities?: Partial<MockControllerCapabilities>;
    // (undocumented)
    homeId?: number;
    // (undocumented)
    mockPort: MockPort;
    // (undocumented)
    ownNodeId?: number;
    // (undocumented)
    serial: ZWaveSerialStream;
}

// Warning: (ae-missing-release-tag) "MockEndpoint" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export class MockEndpoint {
    constructor(options: MockEndpointOptions);
    addCC(cc: CommandClasses, info: Partial<CommandClassInfo>): void;
    // (undocumented)
    readonly capabilities: MockEndpointCapabilities;
    // (undocumented)
    readonly implementedCCs: Map<CommandClasses, CommandClassInfo>;
    // (undocumented)
    readonly index: number;
    // (undocumented)
    readonly node: MockNode;
    removeCC(cc: CommandClasses): void;
}

// Warning: (ae-missing-release-tag) "MockEndpointCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface MockEndpointCapabilities {
    // (undocumented)
    genericDeviceClass: number;
    // (undocumented)
    specificDeviceClass: number;
}

// Warning: (ae-missing-release-tag) "MockEndpointOptions" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface MockEndpointOptions {
    // (undocumented)
    capabilities?: Partial<MockEndpointCapabilities> & {
        commandClasses?: PartialCCCapabilities[];
    };
    // (undocumented)
    index: number;
    // (undocumented)
    node: MockNode;
}

// Warning: (ae-missing-release-tag) "MockNode" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public
export class MockNode {
    constructor(options: MockNodeOptions);
    ackControllerRequestFrame(frame?: MockZWaveRequestFrame): Promise<void>;
    addCC(cc: CommandClasses, info: Partial<CommandClassInfo>): void;
    assertReceivedControllerFrame(predicate: (frame: MockZWaveFrame) => boolean, options?: {
        noMatch?: boolean;
        errorMessage?: string;
    }): void;
    assertSentControllerFrame(predicate: (frame: MockZWaveFrame) => boolean, options?: {
        noMatch?: boolean;
        errorMessage?: string;
    }): void;
    autoAckControllerFrames: boolean;
    // (undocumented)
    readonly capabilities: MockNodeCapabilities;
    clearReceivedControllerFrames(): void;
    clearSentControllerFrames(): void;
    // (undocumented)
    readonly controller: MockController;
    // (undocumented)
    defineBehavior(...behaviors: MockNodeBehavior[]): void;
    // (undocumented)
    encodingContext: CCEncodingContext;
    // (undocumented)
    readonly endpoints: Map<number, MockEndpoint>;
    // Warning: (tsdoc-param-tag-missing-hyphen) The @param block should be followed by a parameter name and then a hyphen
    expectControllerACK(timeout: number): Promise<MockZWaveAckFrame>;
    // Warning: (tsdoc-param-tag-missing-hyphen) The @param block should be followed by a parameter name and then a hyphen
    expectControllerFrame<T extends MockZWaveFrame = MockZWaveFrame>(timeout: number, predicate: (msg: MockZWaveFrame) => msg is T): Promise<T>;
    // (undocumented)
    getCCCapabilities<T extends CommandClasses>(ccId: T, endpointIndex?: number): Partial<CCIdToCapabilities<T>> | undefined;
    // (undocumented)
    readonly id: number;
    // (undocumented)
    readonly implementedCCs: Map<CommandClasses, CommandClassInfo>;
    onControllerFrame(frame: MockZWaveFrame): Promise<void>;
    removeCC(cc: CommandClasses): void;
    // (undocumented)
    securityManagers: SecurityManagers;
    sendToController(frame: LazyMockZWaveFrame): Promise<MockZWaveAckFrame | undefined>;
    readonly state: Map<string, unknown>;
}

// Warning: (ae-missing-release-tag) "MockNodeBehavior" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface MockNodeBehavior {
    handleCC?: (controller: MockController, self: MockNode, receivedCC: CommandClass) => Promise<MockNodeResponse | undefined> | MockNodeResponse | undefined;
    transformIncomingCC?: (controller: MockController, self: MockNode, cc: CommandClass) => Promise<CommandClass> | CommandClass;
    transformResponse?: (controller: MockController, self: MockNode, receivedCC: CommandClass, response: MockNodeResponse) => Promise<MockNodeResponse> | MockNodeResponse;
}

// Warning: (ae-missing-release-tag) "MockNodeCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface MockNodeCapabilities extends NodeProtocolInfoAndDeviceClass {
    // (undocumented)
    firmwareVersion: string;
    // (undocumented)
    manufacturerId: number;
    // (undocumented)
    productId: number;
    // (undocumented)
    productType: number;
    txDelay: number;
}

// Warning: (ae-missing-release-tag) "MockNodeOptions" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface MockNodeOptions {
    // (undocumented)
    capabilities?: Partial<MockNodeCapabilities> & {
        commandClasses?: PartialCCCapabilities[];
        endpoints?: (Partial<MockEndpointCapabilities> & {
            commandClasses?: PartialCCCapabilities[];
        })[];
    };
    // (undocumented)
    controller: MockController;
    // (undocumented)
    id: number;
}

// Warning: (ae-missing-release-tag) "MockNodeResponse" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public
export type MockNodeResponse = {
    action: "sendCC";
    cc: CommandClass;
    ackRequested?: boolean;
} | {
    action: "ack";
} | {
    action: "stop";
} | {
    action: "ok";
} | {
    action: "fail";
};

// Warning: (ae-missing-release-tag) "MockZWaveAckFrame" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface MockZWaveAckFrame {
    ack: boolean;
    failedHop?: number;
    repeaters: number[];
    // (undocumented)
    type: MockZWaveFrameType.ACK;
}

// Warning: (ae-missing-release-tag) "MockZWaveFrame" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public
export type MockZWaveFrame = MockZWaveRequestFrame | MockZWaveAckFrame;

// Warning: (ae-missing-release-tag) "MockZWaveFrameType" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export enum MockZWaveFrameType {
    // (undocumented)
    ACK = 1,
    // (undocumented)
    Request = 0
}

// Warning: (ae-missing-release-tag) "MockZWaveRequestFrame" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface MockZWaveRequestFrame {
    ackRequested: boolean;
    payload: CommandClass;
    repeaters: number[];
    // (undocumented)
    type: MockZWaveFrameType.Request;
}

// Warning: (ae-missing-release-tag) "MultilevelSensorCCCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface MultilevelSensorCCCapabilities {
    // (undocumented)
    getValue?: (sensorType: number | undefined, scale: number | undefined) => number | undefined;
    // (undocumented)
    sensors: Record<number, {
        supportedScales: number[];
    }>;
}

// Warning: (ae-missing-release-tag) "MultilevelSwitchCCCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface MultilevelSwitchCCCapabilities {
    // (undocumented)
    defaultValue?: MaybeUnknown<number>;
    // (undocumented)
    primarySwitchType: SwitchType;
}

// Warning: (ae-missing-release-tag) "NotificationCCCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface NotificationCCCapabilities {
    // (undocumented)
    notificationTypesAndEvents: Record<number, number[]>;
    // (undocumented)
    supportsV1Alarm: boolean;
}

// Warning: (ae-missing-release-tag) "PartialCCCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export type PartialCCCapabilities<T extends CommandClasses = CommandClasses> = T | ({
    ccId: T;
} & Partial<CommandClassInfo> & Partial<CCIdToCapabilities<T>>);

// Warning: (ae-missing-release-tag) "ScheduleEntryLockCCCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface ScheduleEntryLockCCCapabilities {
    // (undocumented)
    numDailyRepeatingSlots: number;
    // (undocumented)
    numWeekDaySlots: number;
    // (undocumented)
    numYearDaySlots: number;
}

// Warning: (ae-missing-release-tag) "SoundSwitchCCCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface SoundSwitchCCCapabilities {
    // (undocumented)
    defaultToneId: number;
    // (undocumented)
    defaultVolume: number;
    // (undocumented)
    tones: {
        name: string;
        duration: number;
    }[];
}

// Warning: (ae-missing-release-tag) "ThermostatModeCCCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface ThermostatModeCCCapabilities {
    // (undocumented)
    supportedModes: ThermostatMode[];
}

// Warning: (ae-missing-release-tag) "ThermostatSetpointCCCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface ThermostatSetpointCCCapabilities {
    // (undocumented)
    setpoints: Partial<Record<ThermostatSetpointType, {
        minValue: number;
        maxValue: number;
        defaultValue?: number;
        scale: "°C" | "°F";
    }>>;
}

// Warning: (ae-missing-release-tag) "unlazyMockZWaveFrame" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export function unlazyMockZWaveFrame(frame: LazyMockZWaveFrame): Promise<MockZWaveFrame>;

// Warning: (ae-missing-release-tag) "UserCodeCCCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface UserCodeCCCapabilities {
    // (undocumented)
    numUsers: number;
    // (undocumented)
    supportedASCIIChars?: string;
    // (undocumented)
    supportedKeypadModes?: KeypadMode[];
    // (undocumented)
    supportedUserIDStatuses?: UserIDStatus[];
    // (undocumented)
    supportsAdminCode?: boolean;
    // (undocumented)
    supportsAdminCodeDeactivation?: boolean;
    // (undocumented)
    supportsUserCodeChecksum?: boolean;
}

// Warning: (ae-missing-release-tag) "WindowCoveringCCCapabilities" is part of the package's API, but it is missing a release tag (@alpha, @beta, @public, or @internal)
//
// @public (undocumented)
export interface WindowCoveringCCCapabilities {
    // (undocumented)
    supportedParameters: WindowCoveringParameter[];
}

// (No @packageDocumentation comment for this package)

```

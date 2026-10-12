import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace insole. */
export namespace insole {

    /** Properties of a SetTimeRequest. */
    interface ISetTimeRequest {

        /** SetTimeRequest epochMs */
        epochMs?: (number|Long|null);
    }

    /** Represents a SetTimeRequest. */
    class SetTimeRequest implements ISetTimeRequest {

        /**
         * Constructs a new SetTimeRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.ISetTimeRequest);

        /** SetTimeRequest epochMs. */
        public epochMs: (number|Long);

        /**
         * Creates a new SetTimeRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SetTimeRequest instance
         */
        public static create(properties?: insole.ISetTimeRequest): insole.SetTimeRequest;

        /**
         * Encodes the specified SetTimeRequest message. Does not implicitly {@link insole.SetTimeRequest.verify|verify} messages.
         * @param message SetTimeRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.ISetTimeRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SetTimeRequest message, length delimited. Does not implicitly {@link insole.SetTimeRequest.verify|verify} messages.
         * @param message SetTimeRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.ISetTimeRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SetTimeRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SetTimeRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.SetTimeRequest;

        /**
         * Decodes a SetTimeRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SetTimeRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.SetTimeRequest;

        /**
         * Verifies a SetTimeRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SetTimeRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SetTimeRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.SetTimeRequest;

        /**
         * Creates a plain object from a SetTimeRequest message. Also converts values to other types if specified.
         * @param message SetTimeRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.SetTimeRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SetTimeRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for SetTimeRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a SetTimeResponse. */
    interface ISetTimeResponse {

        /** SetTimeResponse epochMs */
        epochMs?: (number|Long|null);
    }

    /** Represents a SetTimeResponse. */
    class SetTimeResponse implements ISetTimeResponse {

        /**
         * Constructs a new SetTimeResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.ISetTimeResponse);

        /** SetTimeResponse epochMs. */
        public epochMs: (number|Long);

        /**
         * Creates a new SetTimeResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SetTimeResponse instance
         */
        public static create(properties?: insole.ISetTimeResponse): insole.SetTimeResponse;

        /**
         * Encodes the specified SetTimeResponse message. Does not implicitly {@link insole.SetTimeResponse.verify|verify} messages.
         * @param message SetTimeResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.ISetTimeResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SetTimeResponse message, length delimited. Does not implicitly {@link insole.SetTimeResponse.verify|verify} messages.
         * @param message SetTimeResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.ISetTimeResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SetTimeResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SetTimeResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.SetTimeResponse;

        /**
         * Decodes a SetTimeResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SetTimeResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.SetTimeResponse;

        /**
         * Verifies a SetTimeResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SetTimeResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SetTimeResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.SetTimeResponse;

        /**
         * Creates a plain object from a SetTimeResponse message. Also converts values to other types if specified.
         * @param message SetTimeResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.SetTimeResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SetTimeResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for SetTimeResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an ImuSample. */
    interface IImuSample {

        /** ImuSample accelLateral */
        accelLateral?: (number|null);

        /** ImuSample accelLongitudinal */
        accelLongitudinal?: (number|null);

        /** ImuSample accelVertical */
        accelVertical?: (number|null);

        /** ImuSample gyroPitch */
        gyroPitch?: (number|null);

        /** ImuSample gyroRoll */
        gyroRoll?: (number|null);

        /** ImuSample gyroYaw */
        gyroYaw?: (number|null);
    }

    /** Represents an ImuSample. */
    class ImuSample implements IImuSample {

        /**
         * Constructs a new ImuSample.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IImuSample);

        /** ImuSample accelLateral. */
        public accelLateral: number;

        /** ImuSample accelLongitudinal. */
        public accelLongitudinal: number;

        /** ImuSample accelVertical. */
        public accelVertical: number;

        /** ImuSample gyroPitch. */
        public gyroPitch: number;

        /** ImuSample gyroRoll. */
        public gyroRoll: number;

        /** ImuSample gyroYaw. */
        public gyroYaw: number;

        /**
         * Creates a new ImuSample instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ImuSample instance
         */
        public static create(properties?: insole.IImuSample): insole.ImuSample;

        /**
         * Encodes the specified ImuSample message. Does not implicitly {@link insole.ImuSample.verify|verify} messages.
         * @param message ImuSample message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IImuSample, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ImuSample message, length delimited. Does not implicitly {@link insole.ImuSample.verify|verify} messages.
         * @param message ImuSample message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IImuSample, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an ImuSample message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ImuSample
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.ImuSample;

        /**
         * Decodes an ImuSample message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ImuSample
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.ImuSample;

        /**
         * Verifies an ImuSample message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an ImuSample message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ImuSample
         */
        public static fromObject(object: { [k: string]: any }): insole.ImuSample;

        /**
         * Creates a plain object from an ImuSample message. Also converts values to other types if specified.
         * @param message ImuSample
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.ImuSample, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ImuSample to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ImuSample
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a PressureSample. */
    interface IPressureSample {

        /** PressureSample mv */
        mv?: (number[]|null);
    }

    /** Represents a PressureSample. */
    class PressureSample implements IPressureSample {

        /**
         * Constructs a new PressureSample.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IPressureSample);

        /** PressureSample mv. */
        public mv: number[];

        /**
         * Creates a new PressureSample instance using the specified properties.
         * @param [properties] Properties to set
         * @returns PressureSample instance
         */
        public static create(properties?: insole.IPressureSample): insole.PressureSample;

        /**
         * Encodes the specified PressureSample message. Does not implicitly {@link insole.PressureSample.verify|verify} messages.
         * @param message PressureSample message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IPressureSample, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified PressureSample message, length delimited. Does not implicitly {@link insole.PressureSample.verify|verify} messages.
         * @param message PressureSample message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IPressureSample, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a PressureSample message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns PressureSample
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.PressureSample;

        /**
         * Decodes a PressureSample message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns PressureSample
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.PressureSample;

        /**
         * Verifies a PressureSample message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a PressureSample message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns PressureSample
         */
        public static fromObject(object: { [k: string]: any }): insole.PressureSample;

        /**
         * Creates a plain object from a PressureSample message. Also converts values to other types if specified.
         * @param message PressureSample
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.PressureSample, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this PressureSample to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for PressureSample
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** WindowStatus enum. */
    enum WindowStatus {
        WINDOW_STATUS_UNSPECIFIED = 0,
        WINDOW_STATUS_OK = 1,
        WINDOW_STATUS_TOO_OLD = 2,
        WINDOW_STATUS_TOO_NEW = 3,
        WINDOW_STATUS_TIME_NOT_SET = 4
    }

    /** Properties of a GetWindowRequest. */
    interface IGetWindowRequest {

        /** GetWindowRequest startMs */
        startMs?: (number|Long|null);
    }

    /** Represents a GetWindowRequest. */
    class GetWindowRequest implements IGetWindowRequest {

        /**
         * Constructs a new GetWindowRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IGetWindowRequest);

        /** GetWindowRequest startMs. */
        public startMs: (number|Long);

        /**
         * Creates a new GetWindowRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetWindowRequest instance
         */
        public static create(properties?: insole.IGetWindowRequest): insole.GetWindowRequest;

        /**
         * Encodes the specified GetWindowRequest message. Does not implicitly {@link insole.GetWindowRequest.verify|verify} messages.
         * @param message GetWindowRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IGetWindowRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetWindowRequest message, length delimited. Does not implicitly {@link insole.GetWindowRequest.verify|verify} messages.
         * @param message GetWindowRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IGetWindowRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetWindowRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetWindowRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.GetWindowRequest;

        /**
         * Decodes a GetWindowRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetWindowRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.GetWindowRequest;

        /**
         * Verifies a GetWindowRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetWindowRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetWindowRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.GetWindowRequest;

        /**
         * Creates a plain object from a GetWindowRequest message. Also converts values to other types if specified.
         * @param message GetWindowRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.GetWindowRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetWindowRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for GetWindowRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a GetWindowResponse. */
    interface IGetWindowResponse {

        /** GetWindowResponse status */
        status?: (insole.WindowStatus|null);

        /** GetWindowResponse startMs */
        startMs?: (number|Long|null);

        /** GetWindowResponse oldestMs */
        oldestMs?: (number|Long|null);

        /** GetWindowResponse newestMs */
        newestMs?: (number|Long|null);

        /** GetWindowResponse imu */
        imu?: (insole.IImuSample[]|null);

        /** GetWindowResponse pressure */
        pressure?: (insole.IPressureSample[]|null);
    }

    /** Represents a GetWindowResponse. */
    class GetWindowResponse implements IGetWindowResponse {

        /**
         * Constructs a new GetWindowResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IGetWindowResponse);

        /** GetWindowResponse status. */
        public status: insole.WindowStatus;

        /** GetWindowResponse startMs. */
        public startMs: (number|Long);

        /** GetWindowResponse oldestMs. */
        public oldestMs: (number|Long);

        /** GetWindowResponse newestMs. */
        public newestMs: (number|Long);

        /** GetWindowResponse imu. */
        public imu: insole.IImuSample[];

        /** GetWindowResponse pressure. */
        public pressure: insole.IPressureSample[];

        /**
         * Creates a new GetWindowResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetWindowResponse instance
         */
        public static create(properties?: insole.IGetWindowResponse): insole.GetWindowResponse;

        /**
         * Encodes the specified GetWindowResponse message. Does not implicitly {@link insole.GetWindowResponse.verify|verify} messages.
         * @param message GetWindowResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IGetWindowResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetWindowResponse message, length delimited. Does not implicitly {@link insole.GetWindowResponse.verify|verify} messages.
         * @param message GetWindowResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IGetWindowResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetWindowResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetWindowResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.GetWindowResponse;

        /**
         * Decodes a GetWindowResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetWindowResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.GetWindowResponse;

        /**
         * Verifies a GetWindowResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetWindowResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetWindowResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.GetWindowResponse;

        /**
         * Creates a plain object from a GetWindowResponse message. Also converts values to other types if specified.
         * @param message GetWindowResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.GetWindowResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetWindowResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for GetWindowResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Foot enum. */
    enum Foot {
        FOOT_UNSPECIFIED = 0,
        FOOT_LEFT = 1,
        FOOT_RIGHT = 2
    }

    /** Properties of a GetConfigRequest. */
    interface IGetConfigRequest {
    }

    /** Represents a GetConfigRequest. */
    class GetConfigRequest implements IGetConfigRequest {

        /**
         * Constructs a new GetConfigRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IGetConfigRequest);

        /**
         * Creates a new GetConfigRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetConfigRequest instance
         */
        public static create(properties?: insole.IGetConfigRequest): insole.GetConfigRequest;

        /**
         * Encodes the specified GetConfigRequest message. Does not implicitly {@link insole.GetConfigRequest.verify|verify} messages.
         * @param message GetConfigRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IGetConfigRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetConfigRequest message, length delimited. Does not implicitly {@link insole.GetConfigRequest.verify|verify} messages.
         * @param message GetConfigRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IGetConfigRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetConfigRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetConfigRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.GetConfigRequest;

        /**
         * Decodes a GetConfigRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetConfigRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.GetConfigRequest;

        /**
         * Verifies a GetConfigRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetConfigRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetConfigRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.GetConfigRequest;

        /**
         * Creates a plain object from a GetConfigRequest message. Also converts values to other types if specified.
         * @param message GetConfigRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.GetConfigRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetConfigRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for GetConfigRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a GetConfigResponse. */
    interface IGetConfigResponse {

        /** GetConfigResponse deviceId */
        deviceId?: (number|null);

        /** GetConfigResponse foot */
        foot?: (insole.Foot|null);

        /** GetConfigResponse firmwareVersion */
        firmwareVersion?: (string|null);
    }

    /** Represents a GetConfigResponse. */
    class GetConfigResponse implements IGetConfigResponse {

        /**
         * Constructs a new GetConfigResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IGetConfigResponse);

        /** GetConfigResponse deviceId. */
        public deviceId: number;

        /** GetConfigResponse foot. */
        public foot: insole.Foot;

        /** GetConfigResponse firmwareVersion. */
        public firmwareVersion: string;

        /**
         * Creates a new GetConfigResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetConfigResponse instance
         */
        public static create(properties?: insole.IGetConfigResponse): insole.GetConfigResponse;

        /**
         * Encodes the specified GetConfigResponse message. Does not implicitly {@link insole.GetConfigResponse.verify|verify} messages.
         * @param message GetConfigResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IGetConfigResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetConfigResponse message, length delimited. Does not implicitly {@link insole.GetConfigResponse.verify|verify} messages.
         * @param message GetConfigResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IGetConfigResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetConfigResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetConfigResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.GetConfigResponse;

        /**
         * Decodes a GetConfigResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetConfigResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.GetConfigResponse;

        /**
         * Verifies a GetConfigResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetConfigResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetConfigResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.GetConfigResponse;

        /**
         * Creates a plain object from a GetConfigResponse message. Also converts values to other types if specified.
         * @param message GetConfigResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.GetConfigResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetConfigResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for GetConfigResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a StartMeasurementRequest. */
    interface IStartMeasurementRequest {

        /** StartMeasurementRequest activityId */
        activityId?: (number|null);
    }

    /** Represents a StartMeasurementRequest. */
    class StartMeasurementRequest implements IStartMeasurementRequest {

        /**
         * Constructs a new StartMeasurementRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IStartMeasurementRequest);

        /** StartMeasurementRequest activityId. */
        public activityId: number;

        /**
         * Creates a new StartMeasurementRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns StartMeasurementRequest instance
         */
        public static create(properties?: insole.IStartMeasurementRequest): insole.StartMeasurementRequest;

        /**
         * Encodes the specified StartMeasurementRequest message. Does not implicitly {@link insole.StartMeasurementRequest.verify|verify} messages.
         * @param message StartMeasurementRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IStartMeasurementRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified StartMeasurementRequest message, length delimited. Does not implicitly {@link insole.StartMeasurementRequest.verify|verify} messages.
         * @param message StartMeasurementRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IStartMeasurementRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a StartMeasurementRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns StartMeasurementRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.StartMeasurementRequest;

        /**
         * Decodes a StartMeasurementRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns StartMeasurementRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.StartMeasurementRequest;

        /**
         * Verifies a StartMeasurementRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a StartMeasurementRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns StartMeasurementRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.StartMeasurementRequest;

        /**
         * Creates a plain object from a StartMeasurementRequest message. Also converts values to other types if specified.
         * @param message StartMeasurementRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.StartMeasurementRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this StartMeasurementRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for StartMeasurementRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a StartMeasurementResponse. */
    interface IStartMeasurementResponse {

        /** StartMeasurementResponse ok */
        ok?: (boolean|null);

        /** StartMeasurementResponse sessionId */
        sessionId?: (number|null);

        /** StartMeasurementResponse activityId */
        activityId?: (number|null);
    }

    /** Represents a StartMeasurementResponse. */
    class StartMeasurementResponse implements IStartMeasurementResponse {

        /**
         * Constructs a new StartMeasurementResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IStartMeasurementResponse);

        /** StartMeasurementResponse ok. */
        public ok: boolean;

        /** StartMeasurementResponse sessionId. */
        public sessionId: number;

        /** StartMeasurementResponse activityId. */
        public activityId: number;

        /**
         * Creates a new StartMeasurementResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns StartMeasurementResponse instance
         */
        public static create(properties?: insole.IStartMeasurementResponse): insole.StartMeasurementResponse;

        /**
         * Encodes the specified StartMeasurementResponse message. Does not implicitly {@link insole.StartMeasurementResponse.verify|verify} messages.
         * @param message StartMeasurementResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IStartMeasurementResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified StartMeasurementResponse message, length delimited. Does not implicitly {@link insole.StartMeasurementResponse.verify|verify} messages.
         * @param message StartMeasurementResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IStartMeasurementResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a StartMeasurementResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns StartMeasurementResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.StartMeasurementResponse;

        /**
         * Decodes a StartMeasurementResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns StartMeasurementResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.StartMeasurementResponse;

        /**
         * Verifies a StartMeasurementResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a StartMeasurementResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns StartMeasurementResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.StartMeasurementResponse;

        /**
         * Creates a plain object from a StartMeasurementResponse message. Also converts values to other types if specified.
         * @param message StartMeasurementResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.StartMeasurementResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this StartMeasurementResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for StartMeasurementResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a StopMeasurementRequest. */
    interface IStopMeasurementRequest {
    }

    /** Represents a StopMeasurementRequest. */
    class StopMeasurementRequest implements IStopMeasurementRequest {

        /**
         * Constructs a new StopMeasurementRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IStopMeasurementRequest);

        /**
         * Creates a new StopMeasurementRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns StopMeasurementRequest instance
         */
        public static create(properties?: insole.IStopMeasurementRequest): insole.StopMeasurementRequest;

        /**
         * Encodes the specified StopMeasurementRequest message. Does not implicitly {@link insole.StopMeasurementRequest.verify|verify} messages.
         * @param message StopMeasurementRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IStopMeasurementRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified StopMeasurementRequest message, length delimited. Does not implicitly {@link insole.StopMeasurementRequest.verify|verify} messages.
         * @param message StopMeasurementRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IStopMeasurementRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a StopMeasurementRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns StopMeasurementRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.StopMeasurementRequest;

        /**
         * Decodes a StopMeasurementRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns StopMeasurementRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.StopMeasurementRequest;

        /**
         * Verifies a StopMeasurementRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a StopMeasurementRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns StopMeasurementRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.StopMeasurementRequest;

        /**
         * Creates a plain object from a StopMeasurementRequest message. Also converts values to other types if specified.
         * @param message StopMeasurementRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.StopMeasurementRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this StopMeasurementRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for StopMeasurementRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a StopMeasurementResponse. */
    interface IStopMeasurementResponse {

        /** StopMeasurementResponse ok */
        ok?: (boolean|null);

        /** StopMeasurementResponse sessionId */
        sessionId?: (number|null);

        /** StopMeasurementResponse steps */
        steps?: (number|null);

        /** StopMeasurementResponse recorded */
        recorded?: (boolean|null);
    }

    /** Represents a StopMeasurementResponse. */
    class StopMeasurementResponse implements IStopMeasurementResponse {

        /**
         * Constructs a new StopMeasurementResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IStopMeasurementResponse);

        /** StopMeasurementResponse ok. */
        public ok: boolean;

        /** StopMeasurementResponse sessionId. */
        public sessionId: number;

        /** StopMeasurementResponse steps. */
        public steps: number;

        /** StopMeasurementResponse recorded. */
        public recorded: boolean;

        /**
         * Creates a new StopMeasurementResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns StopMeasurementResponse instance
         */
        public static create(properties?: insole.IStopMeasurementResponse): insole.StopMeasurementResponse;

        /**
         * Encodes the specified StopMeasurementResponse message. Does not implicitly {@link insole.StopMeasurementResponse.verify|verify} messages.
         * @param message StopMeasurementResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IStopMeasurementResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified StopMeasurementResponse message, length delimited. Does not implicitly {@link insole.StopMeasurementResponse.verify|verify} messages.
         * @param message StopMeasurementResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IStopMeasurementResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a StopMeasurementResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns StopMeasurementResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.StopMeasurementResponse;

        /**
         * Decodes a StopMeasurementResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns StopMeasurementResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.StopMeasurementResponse;

        /**
         * Verifies a StopMeasurementResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a StopMeasurementResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns StopMeasurementResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.StopMeasurementResponse;

        /**
         * Creates a plain object from a StopMeasurementResponse message. Also converts values to other types if specified.
         * @param message StopMeasurementResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.StopMeasurementResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this StopMeasurementResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for StopMeasurementResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a GaitStride. */
    interface IGaitStride {

        /** GaitStride strideLength */
        strideLength?: (number|null);

        /** GaitStride strideHeight */
        strideHeight?: (number|null);

        /** GaitStride speed */
        speed?: (number|null);

        /** GaitStride pronation */
        pronation?: (number|null);

        /** GaitStride strikeAngle */
        strikeAngle?: (number|null);

        /** GaitStride cadence */
        cadence?: (number|null);

        /** GaitStride landingForce */
        landingForce?: (number|null);

        /** GaitStride contactTime */
        contactTime?: (number|null);

        /** GaitStride gaitType */
        gaitType?: (number|null);

        /** GaitStride footStrike */
        footStrike?: (number|null);
    }

    /** Represents a GaitStride. */
    class GaitStride implements IGaitStride {

        /**
         * Constructs a new GaitStride.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IGaitStride);

        /** GaitStride strideLength. */
        public strideLength: number;

        /** GaitStride strideHeight. */
        public strideHeight: number;

        /** GaitStride speed. */
        public speed: number;

        /** GaitStride pronation. */
        public pronation: number;

        /** GaitStride strikeAngle. */
        public strikeAngle: number;

        /** GaitStride cadence. */
        public cadence: number;

        /** GaitStride landingForce. */
        public landingForce: number;

        /** GaitStride contactTime. */
        public contactTime: number;

        /** GaitStride gaitType. */
        public gaitType: number;

        /** GaitStride footStrike. */
        public footStrike: number;

        /**
         * Creates a new GaitStride instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GaitStride instance
         */
        public static create(properties?: insole.IGaitStride): insole.GaitStride;

        /**
         * Encodes the specified GaitStride message. Does not implicitly {@link insole.GaitStride.verify|verify} messages.
         * @param message GaitStride message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IGaitStride, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GaitStride message, length delimited. Does not implicitly {@link insole.GaitStride.verify|verify} messages.
         * @param message GaitStride message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IGaitStride, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GaitStride message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GaitStride
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.GaitStride;

        /**
         * Decodes a GaitStride message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GaitStride
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.GaitStride;

        /**
         * Verifies a GaitStride message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GaitStride message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GaitStride
         */
        public static fromObject(object: { [k: string]: any }): insole.GaitStride;

        /**
         * Creates a plain object from a GaitStride message. Also converts values to other types if specified.
         * @param message GaitStride
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.GaitStride, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GaitStride to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for GaitStride
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a GetGaitLiveRequest. */
    interface IGetGaitLiveRequest {
    }

    /** Represents a GetGaitLiveRequest. */
    class GetGaitLiveRequest implements IGetGaitLiveRequest {

        /**
         * Constructs a new GetGaitLiveRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IGetGaitLiveRequest);

        /**
         * Creates a new GetGaitLiveRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetGaitLiveRequest instance
         */
        public static create(properties?: insole.IGetGaitLiveRequest): insole.GetGaitLiveRequest;

        /**
         * Encodes the specified GetGaitLiveRequest message. Does not implicitly {@link insole.GetGaitLiveRequest.verify|verify} messages.
         * @param message GetGaitLiveRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IGetGaitLiveRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetGaitLiveRequest message, length delimited. Does not implicitly {@link insole.GetGaitLiveRequest.verify|verify} messages.
         * @param message GetGaitLiveRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IGetGaitLiveRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetGaitLiveRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetGaitLiveRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.GetGaitLiveRequest;

        /**
         * Decodes a GetGaitLiveRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetGaitLiveRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.GetGaitLiveRequest;

        /**
         * Verifies a GetGaitLiveRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetGaitLiveRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetGaitLiveRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.GetGaitLiveRequest;

        /**
         * Creates a plain object from a GetGaitLiveRequest message. Also converts values to other types if specified.
         * @param message GetGaitLiveRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.GetGaitLiveRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetGaitLiveRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for GetGaitLiveRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a GetGaitLiveResponse. */
    interface IGetGaitLiveResponse {

        /** GetGaitLiveResponse measuring */
        measuring?: (boolean|null);

        /** GetGaitLiveResponse sessionId */
        sessionId?: (number|null);

        /** GetGaitLiveResponse steps */
        steps?: (number|null);

        /** GetGaitLiveResponse distanceM */
        distanceM?: (number|null);

        /** GetGaitLiveResponse strideSeq */
        strideSeq?: (number|null);

        /** GetGaitLiveResponse last */
        last?: (insole.IGaitStride|null);
    }

    /** Represents a GetGaitLiveResponse. */
    class GetGaitLiveResponse implements IGetGaitLiveResponse {

        /**
         * Constructs a new GetGaitLiveResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IGetGaitLiveResponse);

        /** GetGaitLiveResponse measuring. */
        public measuring: boolean;

        /** GetGaitLiveResponse sessionId. */
        public sessionId: number;

        /** GetGaitLiveResponse steps. */
        public steps: number;

        /** GetGaitLiveResponse distanceM. */
        public distanceM: number;

        /** GetGaitLiveResponse strideSeq. */
        public strideSeq: number;

        /** GetGaitLiveResponse last. */
        public last?: (insole.IGaitStride|null);

        /**
         * Creates a new GetGaitLiveResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetGaitLiveResponse instance
         */
        public static create(properties?: insole.IGetGaitLiveResponse): insole.GetGaitLiveResponse;

        /**
         * Encodes the specified GetGaitLiveResponse message. Does not implicitly {@link insole.GetGaitLiveResponse.verify|verify} messages.
         * @param message GetGaitLiveResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IGetGaitLiveResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetGaitLiveResponse message, length delimited. Does not implicitly {@link insole.GetGaitLiveResponse.verify|verify} messages.
         * @param message GetGaitLiveResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IGetGaitLiveResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetGaitLiveResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetGaitLiveResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.GetGaitLiveResponse;

        /**
         * Decodes a GetGaitLiveResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetGaitLiveResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.GetGaitLiveResponse;

        /**
         * Verifies a GetGaitLiveResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetGaitLiveResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetGaitLiveResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.GetGaitLiveResponse;

        /**
         * Creates a plain object from a GetGaitLiveResponse message. Also converts values to other types if specified.
         * @param message GetGaitLiveResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.GetGaitLiveResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetGaitLiveResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for GetGaitLiveResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }
}

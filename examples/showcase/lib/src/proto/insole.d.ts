import * as $protobuf from "protobufjs";
import Long = require("long");
/** Namespace insole. */
export namespace insole {

    /** Properties of an EchoRequest. */
    interface IEchoRequest {

        /** EchoRequest message */
        message?: (string|null);
    }

    /** Represents an EchoRequest. */
    class EchoRequest implements IEchoRequest {

        /**
         * Constructs a new EchoRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IEchoRequest);

        /** EchoRequest message. */
        public message: string;

        /**
         * Creates a new EchoRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns EchoRequest instance
         */
        public static create(properties?: insole.IEchoRequest): insole.EchoRequest;

        /**
         * Encodes the specified EchoRequest message. Does not implicitly {@link insole.EchoRequest.verify|verify} messages.
         * @param message EchoRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IEchoRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified EchoRequest message, length delimited. Does not implicitly {@link insole.EchoRequest.verify|verify} messages.
         * @param message EchoRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IEchoRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an EchoRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns EchoRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.EchoRequest;

        /**
         * Decodes an EchoRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns EchoRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.EchoRequest;

        /**
         * Verifies an EchoRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an EchoRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns EchoRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.EchoRequest;

        /**
         * Creates a plain object from an EchoRequest message. Also converts values to other types if specified.
         * @param message EchoRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.EchoRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this EchoRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for EchoRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an EchoResponse. */
    interface IEchoResponse {

        /** EchoResponse message */
        message?: (string|null);
    }

    /** Represents an EchoResponse. */
    class EchoResponse implements IEchoResponse {

        /**
         * Constructs a new EchoResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IEchoResponse);

        /** EchoResponse message. */
        public message: string;

        /**
         * Creates a new EchoResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns EchoResponse instance
         */
        public static create(properties?: insole.IEchoResponse): insole.EchoResponse;

        /**
         * Encodes the specified EchoResponse message. Does not implicitly {@link insole.EchoResponse.verify|verify} messages.
         * @param message EchoResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IEchoResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified EchoResponse message, length delimited. Does not implicitly {@link insole.EchoResponse.verify|verify} messages.
         * @param message EchoResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IEchoResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an EchoResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns EchoResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.EchoResponse;

        /**
         * Decodes an EchoResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns EchoResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.EchoResponse;

        /**
         * Verifies an EchoResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an EchoResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns EchoResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.EchoResponse;

        /**
         * Creates a plain object from an EchoResponse message. Also converts values to other types if specified.
         * @param message EchoResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.EchoResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this EchoResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for EchoResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

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

    /** Properties of a SetDeviceIdRequest. */
    interface ISetDeviceIdRequest {

        /** SetDeviceIdRequest deviceId */
        deviceId?: (number|null);
    }

    /** Represents a SetDeviceIdRequest. */
    class SetDeviceIdRequest implements ISetDeviceIdRequest {

        /**
         * Constructs a new SetDeviceIdRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.ISetDeviceIdRequest);

        /** SetDeviceIdRequest deviceId. */
        public deviceId: number;

        /**
         * Creates a new SetDeviceIdRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SetDeviceIdRequest instance
         */
        public static create(properties?: insole.ISetDeviceIdRequest): insole.SetDeviceIdRequest;

        /**
         * Encodes the specified SetDeviceIdRequest message. Does not implicitly {@link insole.SetDeviceIdRequest.verify|verify} messages.
         * @param message SetDeviceIdRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.ISetDeviceIdRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SetDeviceIdRequest message, length delimited. Does not implicitly {@link insole.SetDeviceIdRequest.verify|verify} messages.
         * @param message SetDeviceIdRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.ISetDeviceIdRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SetDeviceIdRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SetDeviceIdRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.SetDeviceIdRequest;

        /**
         * Decodes a SetDeviceIdRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SetDeviceIdRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.SetDeviceIdRequest;

        /**
         * Verifies a SetDeviceIdRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SetDeviceIdRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SetDeviceIdRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.SetDeviceIdRequest;

        /**
         * Creates a plain object from a SetDeviceIdRequest message. Also converts values to other types if specified.
         * @param message SetDeviceIdRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.SetDeviceIdRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SetDeviceIdRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for SetDeviceIdRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a SetDeviceIdResponse. */
    interface ISetDeviceIdResponse {

        /** SetDeviceIdResponse deviceId */
        deviceId?: (number|null);
    }

    /** Represents a SetDeviceIdResponse. */
    class SetDeviceIdResponse implements ISetDeviceIdResponse {

        /**
         * Constructs a new SetDeviceIdResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.ISetDeviceIdResponse);

        /** SetDeviceIdResponse deviceId. */
        public deviceId: number;

        /**
         * Creates a new SetDeviceIdResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SetDeviceIdResponse instance
         */
        public static create(properties?: insole.ISetDeviceIdResponse): insole.SetDeviceIdResponse;

        /**
         * Encodes the specified SetDeviceIdResponse message. Does not implicitly {@link insole.SetDeviceIdResponse.verify|verify} messages.
         * @param message SetDeviceIdResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.ISetDeviceIdResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SetDeviceIdResponse message, length delimited. Does not implicitly {@link insole.SetDeviceIdResponse.verify|verify} messages.
         * @param message SetDeviceIdResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.ISetDeviceIdResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SetDeviceIdResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SetDeviceIdResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.SetDeviceIdResponse;

        /**
         * Decodes a SetDeviceIdResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SetDeviceIdResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.SetDeviceIdResponse;

        /**
         * Verifies a SetDeviceIdResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SetDeviceIdResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SetDeviceIdResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.SetDeviceIdResponse;

        /**
         * Creates a plain object from a SetDeviceIdResponse message. Also converts values to other types if specified.
         * @param message SetDeviceIdResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.SetDeviceIdResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SetDeviceIdResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for SetDeviceIdResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a SetFootRequest. */
    interface ISetFootRequest {

        /** SetFootRequest foot */
        foot?: (insole.Foot|null);
    }

    /** Represents a SetFootRequest. */
    class SetFootRequest implements ISetFootRequest {

        /**
         * Constructs a new SetFootRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.ISetFootRequest);

        /** SetFootRequest foot. */
        public foot: insole.Foot;

        /**
         * Creates a new SetFootRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SetFootRequest instance
         */
        public static create(properties?: insole.ISetFootRequest): insole.SetFootRequest;

        /**
         * Encodes the specified SetFootRequest message. Does not implicitly {@link insole.SetFootRequest.verify|verify} messages.
         * @param message SetFootRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.ISetFootRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SetFootRequest message, length delimited. Does not implicitly {@link insole.SetFootRequest.verify|verify} messages.
         * @param message SetFootRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.ISetFootRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SetFootRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SetFootRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.SetFootRequest;

        /**
         * Decodes a SetFootRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SetFootRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.SetFootRequest;

        /**
         * Verifies a SetFootRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SetFootRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SetFootRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.SetFootRequest;

        /**
         * Creates a plain object from a SetFootRequest message. Also converts values to other types if specified.
         * @param message SetFootRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.SetFootRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SetFootRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for SetFootRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a SetFootResponse. */
    interface ISetFootResponse {

        /** SetFootResponse foot */
        foot?: (insole.Foot|null);
    }

    /** Represents a SetFootResponse. */
    class SetFootResponse implements ISetFootResponse {

        /**
         * Constructs a new SetFootResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.ISetFootResponse);

        /** SetFootResponse foot. */
        public foot: insole.Foot;

        /**
         * Creates a new SetFootResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SetFootResponse instance
         */
        public static create(properties?: insole.ISetFootResponse): insole.SetFootResponse;

        /**
         * Encodes the specified SetFootResponse message. Does not implicitly {@link insole.SetFootResponse.verify|verify} messages.
         * @param message SetFootResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.ISetFootResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SetFootResponse message, length delimited. Does not implicitly {@link insole.SetFootResponse.verify|verify} messages.
         * @param message SetFootResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.ISetFootResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SetFootResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SetFootResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.SetFootResponse;

        /**
         * Decodes a SetFootResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SetFootResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.SetFootResponse;

        /**
         * Verifies a SetFootResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SetFootResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SetFootResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.SetFootResponse;

        /**
         * Creates a plain object from a SetFootResponse message. Also converts values to other types if specified.
         * @param message SetFootResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.SetFootResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SetFootResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for SetFootResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
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

        /** GetConfigResponse logTimeUnitSec */
        logTimeUnitSec?: (number|null);

        /** GetConfigResponse logDistanceUnitCode */
        logDistanceUnitCode?: (number|null);
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

        /** GetConfigResponse logTimeUnitSec. */
        public logTimeUnitSec: number;

        /** GetConfigResponse logDistanceUnitCode. */
        public logDistanceUnitCode: number;

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

    /** Properties of a SetLogUnitRequest. */
    interface ISetLogUnitRequest {

        /** SetLogUnitRequest timeUnitSec */
        timeUnitSec?: (number|null);

        /** SetLogUnitRequest distanceUnitCode */
        distanceUnitCode?: (number|null);
    }

    /** Represents a SetLogUnitRequest. */
    class SetLogUnitRequest implements ISetLogUnitRequest {

        /**
         * Constructs a new SetLogUnitRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.ISetLogUnitRequest);

        /** SetLogUnitRequest timeUnitSec. */
        public timeUnitSec: number;

        /** SetLogUnitRequest distanceUnitCode. */
        public distanceUnitCode: number;

        /**
         * Creates a new SetLogUnitRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SetLogUnitRequest instance
         */
        public static create(properties?: insole.ISetLogUnitRequest): insole.SetLogUnitRequest;

        /**
         * Encodes the specified SetLogUnitRequest message. Does not implicitly {@link insole.SetLogUnitRequest.verify|verify} messages.
         * @param message SetLogUnitRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.ISetLogUnitRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SetLogUnitRequest message, length delimited. Does not implicitly {@link insole.SetLogUnitRequest.verify|verify} messages.
         * @param message SetLogUnitRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.ISetLogUnitRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SetLogUnitRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SetLogUnitRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.SetLogUnitRequest;

        /**
         * Decodes a SetLogUnitRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SetLogUnitRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.SetLogUnitRequest;

        /**
         * Verifies a SetLogUnitRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SetLogUnitRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SetLogUnitRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.SetLogUnitRequest;

        /**
         * Creates a plain object from a SetLogUnitRequest message. Also converts values to other types if specified.
         * @param message SetLogUnitRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.SetLogUnitRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SetLogUnitRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for SetLogUnitRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a SetLogUnitResponse. */
    interface ISetLogUnitResponse {

        /** SetLogUnitResponse ok */
        ok?: (boolean|null);

        /** SetLogUnitResponse timeUnitSec */
        timeUnitSec?: (number|null);

        /** SetLogUnitResponse distanceUnitCode */
        distanceUnitCode?: (number|null);
    }

    /** Represents a SetLogUnitResponse. */
    class SetLogUnitResponse implements ISetLogUnitResponse {

        /**
         * Constructs a new SetLogUnitResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.ISetLogUnitResponse);

        /** SetLogUnitResponse ok. */
        public ok: boolean;

        /** SetLogUnitResponse timeUnitSec. */
        public timeUnitSec: number;

        /** SetLogUnitResponse distanceUnitCode. */
        public distanceUnitCode: number;

        /**
         * Creates a new SetLogUnitResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns SetLogUnitResponse instance
         */
        public static create(properties?: insole.ISetLogUnitResponse): insole.SetLogUnitResponse;

        /**
         * Encodes the specified SetLogUnitResponse message. Does not implicitly {@link insole.SetLogUnitResponse.verify|verify} messages.
         * @param message SetLogUnitResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.ISetLogUnitResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified SetLogUnitResponse message, length delimited. Does not implicitly {@link insole.SetLogUnitResponse.verify|verify} messages.
         * @param message SetLogUnitResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.ISetLogUnitResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a SetLogUnitResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns SetLogUnitResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.SetLogUnitResponse;

        /**
         * Decodes a SetLogUnitResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns SetLogUnitResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.SetLogUnitResponse;

        /**
         * Verifies a SetLogUnitResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a SetLogUnitResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns SetLogUnitResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.SetLogUnitResponse;

        /**
         * Creates a plain object from a SetLogUnitResponse message. Also converts values to other types if specified.
         * @param message SetLogUnitResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.SetLogUnitResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this SetLogUnitResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for SetLogUnitResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an OtaBeginRequest. */
    interface IOtaBeginRequest {

        /** OtaBeginRequest totalSize */
        totalSize?: (number|null);
    }

    /** Represents an OtaBeginRequest. */
    class OtaBeginRequest implements IOtaBeginRequest {

        /**
         * Constructs a new OtaBeginRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IOtaBeginRequest);

        /** OtaBeginRequest totalSize. */
        public totalSize: number;

        /**
         * Creates a new OtaBeginRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns OtaBeginRequest instance
         */
        public static create(properties?: insole.IOtaBeginRequest): insole.OtaBeginRequest;

        /**
         * Encodes the specified OtaBeginRequest message. Does not implicitly {@link insole.OtaBeginRequest.verify|verify} messages.
         * @param message OtaBeginRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IOtaBeginRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified OtaBeginRequest message, length delimited. Does not implicitly {@link insole.OtaBeginRequest.verify|verify} messages.
         * @param message OtaBeginRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IOtaBeginRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an OtaBeginRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns OtaBeginRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.OtaBeginRequest;

        /**
         * Decodes an OtaBeginRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns OtaBeginRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.OtaBeginRequest;

        /**
         * Verifies an OtaBeginRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an OtaBeginRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns OtaBeginRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.OtaBeginRequest;

        /**
         * Creates a plain object from an OtaBeginRequest message. Also converts values to other types if specified.
         * @param message OtaBeginRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.OtaBeginRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this OtaBeginRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for OtaBeginRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an OtaBeginResponse. */
    interface IOtaBeginResponse {

        /** OtaBeginResponse ok */
        ok?: (boolean|null);

        /** OtaBeginResponse maxChunk */
        maxChunk?: (number|null);
    }

    /** Represents an OtaBeginResponse. */
    class OtaBeginResponse implements IOtaBeginResponse {

        /**
         * Constructs a new OtaBeginResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IOtaBeginResponse);

        /** OtaBeginResponse ok. */
        public ok: boolean;

        /** OtaBeginResponse maxChunk. */
        public maxChunk: number;

        /**
         * Creates a new OtaBeginResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns OtaBeginResponse instance
         */
        public static create(properties?: insole.IOtaBeginResponse): insole.OtaBeginResponse;

        /**
         * Encodes the specified OtaBeginResponse message. Does not implicitly {@link insole.OtaBeginResponse.verify|verify} messages.
         * @param message OtaBeginResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IOtaBeginResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified OtaBeginResponse message, length delimited. Does not implicitly {@link insole.OtaBeginResponse.verify|verify} messages.
         * @param message OtaBeginResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IOtaBeginResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an OtaBeginResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns OtaBeginResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.OtaBeginResponse;

        /**
         * Decodes an OtaBeginResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns OtaBeginResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.OtaBeginResponse;

        /**
         * Verifies an OtaBeginResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an OtaBeginResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns OtaBeginResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.OtaBeginResponse;

        /**
         * Creates a plain object from an OtaBeginResponse message. Also converts values to other types if specified.
         * @param message OtaBeginResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.OtaBeginResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this OtaBeginResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for OtaBeginResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an OtaWriteRequest. */
    interface IOtaWriteRequest {

        /** OtaWriteRequest offset */
        offset?: (number|null);

        /** OtaWriteRequest data */
        data?: (Uint8Array|null);
    }

    /** Represents an OtaWriteRequest. */
    class OtaWriteRequest implements IOtaWriteRequest {

        /**
         * Constructs a new OtaWriteRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IOtaWriteRequest);

        /** OtaWriteRequest offset. */
        public offset: number;

        /** OtaWriteRequest data. */
        public data: Uint8Array;

        /**
         * Creates a new OtaWriteRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns OtaWriteRequest instance
         */
        public static create(properties?: insole.IOtaWriteRequest): insole.OtaWriteRequest;

        /**
         * Encodes the specified OtaWriteRequest message. Does not implicitly {@link insole.OtaWriteRequest.verify|verify} messages.
         * @param message OtaWriteRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IOtaWriteRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified OtaWriteRequest message, length delimited. Does not implicitly {@link insole.OtaWriteRequest.verify|verify} messages.
         * @param message OtaWriteRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IOtaWriteRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an OtaWriteRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns OtaWriteRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.OtaWriteRequest;

        /**
         * Decodes an OtaWriteRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns OtaWriteRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.OtaWriteRequest;

        /**
         * Verifies an OtaWriteRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an OtaWriteRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns OtaWriteRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.OtaWriteRequest;

        /**
         * Creates a plain object from an OtaWriteRequest message. Also converts values to other types if specified.
         * @param message OtaWriteRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.OtaWriteRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this OtaWriteRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for OtaWriteRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an OtaWriteResponse. */
    interface IOtaWriteResponse {

        /** OtaWriteResponse ok */
        ok?: (boolean|null);

        /** OtaWriteResponse received */
        received?: (number|null);
    }

    /** Represents an OtaWriteResponse. */
    class OtaWriteResponse implements IOtaWriteResponse {

        /**
         * Constructs a new OtaWriteResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IOtaWriteResponse);

        /** OtaWriteResponse ok. */
        public ok: boolean;

        /** OtaWriteResponse received. */
        public received: number;

        /**
         * Creates a new OtaWriteResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns OtaWriteResponse instance
         */
        public static create(properties?: insole.IOtaWriteResponse): insole.OtaWriteResponse;

        /**
         * Encodes the specified OtaWriteResponse message. Does not implicitly {@link insole.OtaWriteResponse.verify|verify} messages.
         * @param message OtaWriteResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IOtaWriteResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified OtaWriteResponse message, length delimited. Does not implicitly {@link insole.OtaWriteResponse.verify|verify} messages.
         * @param message OtaWriteResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IOtaWriteResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an OtaWriteResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns OtaWriteResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.OtaWriteResponse;

        /**
         * Decodes an OtaWriteResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns OtaWriteResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.OtaWriteResponse;

        /**
         * Verifies an OtaWriteResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an OtaWriteResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns OtaWriteResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.OtaWriteResponse;

        /**
         * Creates a plain object from an OtaWriteResponse message. Also converts values to other types if specified.
         * @param message OtaWriteResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.OtaWriteResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this OtaWriteResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for OtaWriteResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an OtaApplyRequest. */
    interface IOtaApplyRequest {
    }

    /** Represents an OtaApplyRequest. */
    class OtaApplyRequest implements IOtaApplyRequest {

        /**
         * Constructs a new OtaApplyRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IOtaApplyRequest);

        /**
         * Creates a new OtaApplyRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns OtaApplyRequest instance
         */
        public static create(properties?: insole.IOtaApplyRequest): insole.OtaApplyRequest;

        /**
         * Encodes the specified OtaApplyRequest message. Does not implicitly {@link insole.OtaApplyRequest.verify|verify} messages.
         * @param message OtaApplyRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IOtaApplyRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified OtaApplyRequest message, length delimited. Does not implicitly {@link insole.OtaApplyRequest.verify|verify} messages.
         * @param message OtaApplyRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IOtaApplyRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an OtaApplyRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns OtaApplyRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.OtaApplyRequest;

        /**
         * Decodes an OtaApplyRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns OtaApplyRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.OtaApplyRequest;

        /**
         * Verifies an OtaApplyRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an OtaApplyRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns OtaApplyRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.OtaApplyRequest;

        /**
         * Creates a plain object from an OtaApplyRequest message. Also converts values to other types if specified.
         * @param message OtaApplyRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.OtaApplyRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this OtaApplyRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for OtaApplyRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an OtaApplyResponse. */
    interface IOtaApplyResponse {

        /** OtaApplyResponse ok */
        ok?: (boolean|null);
    }

    /** Represents an OtaApplyResponse. */
    class OtaApplyResponse implements IOtaApplyResponse {

        /**
         * Constructs a new OtaApplyResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IOtaApplyResponse);

        /** OtaApplyResponse ok. */
        public ok: boolean;

        /**
         * Creates a new OtaApplyResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns OtaApplyResponse instance
         */
        public static create(properties?: insole.IOtaApplyResponse): insole.OtaApplyResponse;

        /**
         * Encodes the specified OtaApplyResponse message. Does not implicitly {@link insole.OtaApplyResponse.verify|verify} messages.
         * @param message OtaApplyResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IOtaApplyResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified OtaApplyResponse message, length delimited. Does not implicitly {@link insole.OtaApplyResponse.verify|verify} messages.
         * @param message OtaApplyResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IOtaApplyResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an OtaApplyResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns OtaApplyResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.OtaApplyResponse;

        /**
         * Decodes an OtaApplyResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns OtaApplyResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.OtaApplyResponse;

        /**
         * Verifies an OtaApplyResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an OtaApplyResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns OtaApplyResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.OtaApplyResponse;

        /**
         * Creates a plain object from an OtaApplyResponse message. Also converts values to other types if specified.
         * @param message OtaApplyResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.OtaApplyResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this OtaApplyResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for OtaApplyResponse
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

    /** Properties of a LogMeta. */
    interface ILogMeta {

        /** LogMeta sessionId */
        sessionId?: (number|null);

        /** LogMeta startMs */
        startMs?: (number|Long|null);

        /** LogMeta elapsedMs */
        elapsedMs?: (number|null);

        /** LogMeta steps */
        steps?: (number|null);
    }

    /** Represents a LogMeta. */
    class LogMeta implements ILogMeta {

        /**
         * Constructs a new LogMeta.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.ILogMeta);

        /** LogMeta sessionId. */
        public sessionId: number;

        /** LogMeta startMs. */
        public startMs: (number|Long);

        /** LogMeta elapsedMs. */
        public elapsedMs: number;

        /** LogMeta steps. */
        public steps: number;

        /**
         * Creates a new LogMeta instance using the specified properties.
         * @param [properties] Properties to set
         * @returns LogMeta instance
         */
        public static create(properties?: insole.ILogMeta): insole.LogMeta;

        /**
         * Encodes the specified LogMeta message. Does not implicitly {@link insole.LogMeta.verify|verify} messages.
         * @param message LogMeta message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.ILogMeta, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified LogMeta message, length delimited. Does not implicitly {@link insole.LogMeta.verify|verify} messages.
         * @param message LogMeta message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.ILogMeta, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a LogMeta message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns LogMeta
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.LogMeta;

        /**
         * Decodes a LogMeta message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns LogMeta
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.LogMeta;

        /**
         * Verifies a LogMeta message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a LogMeta message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns LogMeta
         */
        public static fromObject(object: { [k: string]: any }): insole.LogMeta;

        /**
         * Creates a plain object from a LogMeta message. Also converts values to other types if specified.
         * @param message LogMeta
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.LogMeta, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this LogMeta to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for LogMeta
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ListLogsRequest. */
    interface IListLogsRequest {
    }

    /** Represents a ListLogsRequest. */
    class ListLogsRequest implements IListLogsRequest {

        /**
         * Constructs a new ListLogsRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IListLogsRequest);

        /**
         * Creates a new ListLogsRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ListLogsRequest instance
         */
        public static create(properties?: insole.IListLogsRequest): insole.ListLogsRequest;

        /**
         * Encodes the specified ListLogsRequest message. Does not implicitly {@link insole.ListLogsRequest.verify|verify} messages.
         * @param message ListLogsRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IListLogsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ListLogsRequest message, length delimited. Does not implicitly {@link insole.ListLogsRequest.verify|verify} messages.
         * @param message ListLogsRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IListLogsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ListLogsRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ListLogsRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.ListLogsRequest;

        /**
         * Decodes a ListLogsRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ListLogsRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.ListLogsRequest;

        /**
         * Verifies a ListLogsRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ListLogsRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ListLogsRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.ListLogsRequest;

        /**
         * Creates a plain object from a ListLogsRequest message. Also converts values to other types if specified.
         * @param message ListLogsRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.ListLogsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ListLogsRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ListLogsRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ListLogsResponse. */
    interface IListLogsResponse {

        /** ListLogsResponse total */
        total?: (number|null);

        /** ListLogsResponse logs */
        logs?: (insole.ILogMeta[]|null);
    }

    /** Represents a ListLogsResponse. */
    class ListLogsResponse implements IListLogsResponse {

        /**
         * Constructs a new ListLogsResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IListLogsResponse);

        /** ListLogsResponse total. */
        public total: number;

        /** ListLogsResponse logs. */
        public logs: insole.ILogMeta[];

        /**
         * Creates a new ListLogsResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ListLogsResponse instance
         */
        public static create(properties?: insole.IListLogsResponse): insole.ListLogsResponse;

        /**
         * Encodes the specified ListLogsResponse message. Does not implicitly {@link insole.ListLogsResponse.verify|verify} messages.
         * @param message ListLogsResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IListLogsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ListLogsResponse message, length delimited. Does not implicitly {@link insole.ListLogsResponse.verify|verify} messages.
         * @param message ListLogsResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IListLogsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ListLogsResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ListLogsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.ListLogsResponse;

        /**
         * Decodes a ListLogsResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ListLogsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.ListLogsResponse;

        /**
         * Verifies a ListLogsResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ListLogsResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ListLogsResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.ListLogsResponse;

        /**
         * Creates a plain object from a ListLogsResponse message. Also converts values to other types if specified.
         * @param message ListLogsResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.ListLogsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ListLogsResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ListLogsResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a GaitStat. */
    interface IGaitStat {

        /** GaitStat average */
        average?: (number|null);

        /** GaitStat variance */
        variance?: (number|null);

        /** GaitStat minimum */
        minimum?: (number|null);

        /** GaitStat maximum */
        maximum?: (number|null);
    }

    /** Represents a GaitStat. */
    class GaitStat implements IGaitStat {

        /**
         * Constructs a new GaitStat.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IGaitStat);

        /** GaitStat average. */
        public average: number;

        /** GaitStat variance. */
        public variance: number;

        /** GaitStat minimum. */
        public minimum: number;

        /** GaitStat maximum. */
        public maximum: number;

        /**
         * Creates a new GaitStat instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GaitStat instance
         */
        public static create(properties?: insole.IGaitStat): insole.GaitStat;

        /**
         * Encodes the specified GaitStat message. Does not implicitly {@link insole.GaitStat.verify|verify} messages.
         * @param message GaitStat message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IGaitStat, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GaitStat message, length delimited. Does not implicitly {@link insole.GaitStat.verify|verify} messages.
         * @param message GaitStat message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IGaitStat, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GaitStat message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GaitStat
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.GaitStat;

        /**
         * Decodes a GaitStat message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GaitStat
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.GaitStat;

        /**
         * Verifies a GaitStat message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GaitStat message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GaitStat
         */
        public static fromObject(object: { [k: string]: any }): insole.GaitStat;

        /**
         * Creates a plain object from a GaitStat message. Also converts values to other types if specified.
         * @param message GaitStat
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.GaitStat, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GaitStat to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for GaitStat
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a GaitSummary. */
    interface IGaitSummary {

        /** GaitSummary sessionId */
        sessionId?: (number|null);

        /** GaitSummary startMs */
        startMs?: (number|Long|null);

        /** GaitSummary elapsedMs */
        elapsedMs?: (number|null);

        /** GaitSummary steps */
        steps?: (number|null);

        /** GaitSummary distanceM */
        distanceM?: (number|null);

        /** GaitSummary foot */
        foot?: (insole.Foot|null);

        /** GaitSummary stride */
        stride?: (insole.IGaitStat|null);

        /** GaitSummary strideHeight */
        strideHeight?: (insole.IGaitStat|null);

        /** GaitSummary speed */
        speed?: (insole.IGaitStat|null);

        /** GaitSummary pronation */
        pronation?: (insole.IGaitStat|null);

        /** GaitSummary strikeAngle */
        strikeAngle?: (insole.IGaitStat|null);

        /** GaitSummary cadence */
        cadence?: (insole.IGaitStat|null);

        /** GaitSummary landingForce */
        landingForce?: (insole.IGaitStat|null);

        /** GaitSummary contactTime */
        contactTime?: (insole.IGaitStat|null);

        /** GaitSummary activityId */
        activityId?: (number|null);
    }

    /** Represents a GaitSummary. */
    class GaitSummary implements IGaitSummary {

        /**
         * Constructs a new GaitSummary.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IGaitSummary);

        /** GaitSummary sessionId. */
        public sessionId: number;

        /** GaitSummary startMs. */
        public startMs: (number|Long);

        /** GaitSummary elapsedMs. */
        public elapsedMs: number;

        /** GaitSummary steps. */
        public steps: number;

        /** GaitSummary distanceM. */
        public distanceM: number;

        /** GaitSummary foot. */
        public foot: insole.Foot;

        /** GaitSummary stride. */
        public stride?: (insole.IGaitStat|null);

        /** GaitSummary strideHeight. */
        public strideHeight?: (insole.IGaitStat|null);

        /** GaitSummary speed. */
        public speed?: (insole.IGaitStat|null);

        /** GaitSummary pronation. */
        public pronation?: (insole.IGaitStat|null);

        /** GaitSummary strikeAngle. */
        public strikeAngle?: (insole.IGaitStat|null);

        /** GaitSummary cadence. */
        public cadence?: (insole.IGaitStat|null);

        /** GaitSummary landingForce. */
        public landingForce?: (insole.IGaitStat|null);

        /** GaitSummary contactTime. */
        public contactTime?: (insole.IGaitStat|null);

        /** GaitSummary activityId. */
        public activityId: number;

        /**
         * Creates a new GaitSummary instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GaitSummary instance
         */
        public static create(properties?: insole.IGaitSummary): insole.GaitSummary;

        /**
         * Encodes the specified GaitSummary message. Does not implicitly {@link insole.GaitSummary.verify|verify} messages.
         * @param message GaitSummary message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IGaitSummary, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GaitSummary message, length delimited. Does not implicitly {@link insole.GaitSummary.verify|verify} messages.
         * @param message GaitSummary message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IGaitSummary, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GaitSummary message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GaitSummary
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.GaitSummary;

        /**
         * Decodes a GaitSummary message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GaitSummary
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.GaitSummary;

        /**
         * Verifies a GaitSummary message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GaitSummary message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GaitSummary
         */
        public static fromObject(object: { [k: string]: any }): insole.GaitSummary;

        /**
         * Creates a plain object from a GaitSummary message. Also converts values to other types if specified.
         * @param message GaitSummary
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.GaitSummary, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GaitSummary to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for GaitSummary
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ReadLogRequest. */
    interface IReadLogRequest {

        /** ReadLogRequest index */
        index?: (number|null);
    }

    /** Represents a ReadLogRequest. */
    class ReadLogRequest implements IReadLogRequest {

        /**
         * Constructs a new ReadLogRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IReadLogRequest);

        /** ReadLogRequest index. */
        public index: number;

        /**
         * Creates a new ReadLogRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ReadLogRequest instance
         */
        public static create(properties?: insole.IReadLogRequest): insole.ReadLogRequest;

        /**
         * Encodes the specified ReadLogRequest message. Does not implicitly {@link insole.ReadLogRequest.verify|verify} messages.
         * @param message ReadLogRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IReadLogRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ReadLogRequest message, length delimited. Does not implicitly {@link insole.ReadLogRequest.verify|verify} messages.
         * @param message ReadLogRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IReadLogRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ReadLogRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ReadLogRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.ReadLogRequest;

        /**
         * Decodes a ReadLogRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ReadLogRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.ReadLogRequest;

        /**
         * Verifies a ReadLogRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ReadLogRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ReadLogRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.ReadLogRequest;

        /**
         * Creates a plain object from a ReadLogRequest message. Also converts values to other types if specified.
         * @param message ReadLogRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.ReadLogRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ReadLogRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ReadLogRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ReadLogResponse. */
    interface IReadLogResponse {

        /** ReadLogResponse ok */
        ok?: (boolean|null);

        /** ReadLogResponse total */
        total?: (number|null);

        /** ReadLogResponse summary */
        summary?: (insole.IGaitSummary|null);
    }

    /** Represents a ReadLogResponse. */
    class ReadLogResponse implements IReadLogResponse {

        /**
         * Constructs a new ReadLogResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IReadLogResponse);

        /** ReadLogResponse ok. */
        public ok: boolean;

        /** ReadLogResponse total. */
        public total: number;

        /** ReadLogResponse summary. */
        public summary?: (insole.IGaitSummary|null);

        /**
         * Creates a new ReadLogResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ReadLogResponse instance
         */
        public static create(properties?: insole.IReadLogResponse): insole.ReadLogResponse;

        /**
         * Encodes the specified ReadLogResponse message. Does not implicitly {@link insole.ReadLogResponse.verify|verify} messages.
         * @param message ReadLogResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IReadLogResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ReadLogResponse message, length delimited. Does not implicitly {@link insole.ReadLogResponse.verify|verify} messages.
         * @param message ReadLogResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IReadLogResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ReadLogResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ReadLogResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.ReadLogResponse;

        /**
         * Decodes a ReadLogResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ReadLogResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.ReadLogResponse;

        /**
         * Verifies a ReadLogResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ReadLogResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ReadLogResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.ReadLogResponse;

        /**
         * Creates a plain object from a ReadLogResponse message. Also converts values to other types if specified.
         * @param message ReadLogResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.ReadLogResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ReadLogResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ReadLogResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an EraseLogsRequest. */
    interface IEraseLogsRequest {
    }

    /** Represents an EraseLogsRequest. */
    class EraseLogsRequest implements IEraseLogsRequest {

        /**
         * Constructs a new EraseLogsRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IEraseLogsRequest);

        /**
         * Creates a new EraseLogsRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns EraseLogsRequest instance
         */
        public static create(properties?: insole.IEraseLogsRequest): insole.EraseLogsRequest;

        /**
         * Encodes the specified EraseLogsRequest message. Does not implicitly {@link insole.EraseLogsRequest.verify|verify} messages.
         * @param message EraseLogsRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IEraseLogsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified EraseLogsRequest message, length delimited. Does not implicitly {@link insole.EraseLogsRequest.verify|verify} messages.
         * @param message EraseLogsRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IEraseLogsRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an EraseLogsRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns EraseLogsRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.EraseLogsRequest;

        /**
         * Decodes an EraseLogsRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns EraseLogsRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.EraseLogsRequest;

        /**
         * Verifies an EraseLogsRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an EraseLogsRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns EraseLogsRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.EraseLogsRequest;

        /**
         * Creates a plain object from an EraseLogsRequest message. Also converts values to other types if specified.
         * @param message EraseLogsRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.EraseLogsRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this EraseLogsRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for EraseLogsRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of an EraseLogsResponse. */
    interface IEraseLogsResponse {

        /** EraseLogsResponse ok */
        ok?: (boolean|null);
    }

    /** Represents an EraseLogsResponse. */
    class EraseLogsResponse implements IEraseLogsResponse {

        /**
         * Constructs a new EraseLogsResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IEraseLogsResponse);

        /** EraseLogsResponse ok. */
        public ok: boolean;

        /**
         * Creates a new EraseLogsResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns EraseLogsResponse instance
         */
        public static create(properties?: insole.IEraseLogsResponse): insole.EraseLogsResponse;

        /**
         * Encodes the specified EraseLogsResponse message. Does not implicitly {@link insole.EraseLogsResponse.verify|verify} messages.
         * @param message EraseLogsResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IEraseLogsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified EraseLogsResponse message, length delimited. Does not implicitly {@link insole.EraseLogsResponse.verify|verify} messages.
         * @param message EraseLogsResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IEraseLogsResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes an EraseLogsResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns EraseLogsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.EraseLogsResponse;

        /**
         * Decodes an EraseLogsResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns EraseLogsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.EraseLogsResponse;

        /**
         * Verifies an EraseLogsResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates an EraseLogsResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns EraseLogsResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.EraseLogsResponse;

        /**
         * Creates a plain object from an EraseLogsResponse message. Also converts values to other types if specified.
         * @param message EraseLogsResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.EraseLogsResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this EraseLogsResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for EraseLogsResponse
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

    /** Properties of a ReadChunkRequest. */
    interface IReadChunkRequest {

        /** ReadChunkRequest index */
        index?: (number|null);
    }

    /** Represents a ReadChunkRequest. */
    class ReadChunkRequest implements IReadChunkRequest {

        /**
         * Constructs a new ReadChunkRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IReadChunkRequest);

        /** ReadChunkRequest index. */
        public index: number;

        /**
         * Creates a new ReadChunkRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ReadChunkRequest instance
         */
        public static create(properties?: insole.IReadChunkRequest): insole.ReadChunkRequest;

        /**
         * Encodes the specified ReadChunkRequest message. Does not implicitly {@link insole.ReadChunkRequest.verify|verify} messages.
         * @param message ReadChunkRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IReadChunkRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ReadChunkRequest message, length delimited. Does not implicitly {@link insole.ReadChunkRequest.verify|verify} messages.
         * @param message ReadChunkRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IReadChunkRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ReadChunkRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ReadChunkRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.ReadChunkRequest;

        /**
         * Decodes a ReadChunkRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ReadChunkRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.ReadChunkRequest;

        /**
         * Verifies a ReadChunkRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ReadChunkRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ReadChunkRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.ReadChunkRequest;

        /**
         * Creates a plain object from a ReadChunkRequest message. Also converts values to other types if specified.
         * @param message ReadChunkRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.ReadChunkRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ReadChunkRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ReadChunkRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ReadChunkResponse. */
    interface IReadChunkResponse {

        /** ReadChunkResponse ok */
        ok?: (boolean|null);

        /** ReadChunkResponse total */
        total?: (number|null);

        /** ReadChunkResponse summary */
        summary?: (insole.IGaitSummary|null);
    }

    /** Represents a ReadChunkResponse. */
    class ReadChunkResponse implements IReadChunkResponse {

        /**
         * Constructs a new ReadChunkResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IReadChunkResponse);

        /** ReadChunkResponse ok. */
        public ok: boolean;

        /** ReadChunkResponse total. */
        public total: number;

        /** ReadChunkResponse summary. */
        public summary?: (insole.IGaitSummary|null);

        /**
         * Creates a new ReadChunkResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ReadChunkResponse instance
         */
        public static create(properties?: insole.IReadChunkResponse): insole.ReadChunkResponse;

        /**
         * Encodes the specified ReadChunkResponse message. Does not implicitly {@link insole.ReadChunkResponse.verify|verify} messages.
         * @param message ReadChunkResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IReadChunkResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ReadChunkResponse message, length delimited. Does not implicitly {@link insole.ReadChunkResponse.verify|verify} messages.
         * @param message ReadChunkResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IReadChunkResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ReadChunkResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ReadChunkResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.ReadChunkResponse;

        /**
         * Decodes a ReadChunkResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ReadChunkResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.ReadChunkResponse;

        /**
         * Verifies a ReadChunkResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ReadChunkResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ReadChunkResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.ReadChunkResponse;

        /**
         * Creates a plain object from a ReadChunkResponse message. Also converts values to other types if specified.
         * @param message ReadChunkResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.ReadChunkResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ReadChunkResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ReadChunkResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a GaitEvent. */
    interface IGaitEvent {

        /** GaitEvent sessionId */
        sessionId?: (number|null);

        /** GaitEvent tRelMs */
        tRelMs?: (number|null);

        /** GaitEvent seq */
        seq?: (number|null);

        /** GaitEvent type */
        type?: (number|null);

        /** GaitEvent footStrike */
        footStrike?: (number|null);

        /** GaitEvent value */
        value?: (number|null);
    }

    /** Represents a GaitEvent. */
    class GaitEvent implements IGaitEvent {

        /**
         * Constructs a new GaitEvent.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IGaitEvent);

        /** GaitEvent sessionId. */
        public sessionId: number;

        /** GaitEvent tRelMs. */
        public tRelMs: number;

        /** GaitEvent seq. */
        public seq: number;

        /** GaitEvent type. */
        public type: number;

        /** GaitEvent footStrike. */
        public footStrike: number;

        /** GaitEvent value. */
        public value: number;

        /**
         * Creates a new GaitEvent instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GaitEvent instance
         */
        public static create(properties?: insole.IGaitEvent): insole.GaitEvent;

        /**
         * Encodes the specified GaitEvent message. Does not implicitly {@link insole.GaitEvent.verify|verify} messages.
         * @param message GaitEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IGaitEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GaitEvent message, length delimited. Does not implicitly {@link insole.GaitEvent.verify|verify} messages.
         * @param message GaitEvent message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IGaitEvent, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GaitEvent message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GaitEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.GaitEvent;

        /**
         * Decodes a GaitEvent message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GaitEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.GaitEvent;

        /**
         * Verifies a GaitEvent message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GaitEvent message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GaitEvent
         */
        public static fromObject(object: { [k: string]: any }): insole.GaitEvent;

        /**
         * Creates a plain object from a GaitEvent message. Also converts values to other types if specified.
         * @param message GaitEvent
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.GaitEvent, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GaitEvent to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for GaitEvent
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ReadEventRequest. */
    interface IReadEventRequest {

        /** ReadEventRequest index */
        index?: (number|null);
    }

    /** Represents a ReadEventRequest. */
    class ReadEventRequest implements IReadEventRequest {

        /**
         * Constructs a new ReadEventRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IReadEventRequest);

        /** ReadEventRequest index. */
        public index: number;

        /**
         * Creates a new ReadEventRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ReadEventRequest instance
         */
        public static create(properties?: insole.IReadEventRequest): insole.ReadEventRequest;

        /**
         * Encodes the specified ReadEventRequest message. Does not implicitly {@link insole.ReadEventRequest.verify|verify} messages.
         * @param message ReadEventRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IReadEventRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ReadEventRequest message, length delimited. Does not implicitly {@link insole.ReadEventRequest.verify|verify} messages.
         * @param message ReadEventRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IReadEventRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ReadEventRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ReadEventRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.ReadEventRequest;

        /**
         * Decodes a ReadEventRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ReadEventRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.ReadEventRequest;

        /**
         * Verifies a ReadEventRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ReadEventRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ReadEventRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.ReadEventRequest;

        /**
         * Creates a plain object from a ReadEventRequest message. Also converts values to other types if specified.
         * @param message ReadEventRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.ReadEventRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ReadEventRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ReadEventRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a ReadEventResponse. */
    interface IReadEventResponse {

        /** ReadEventResponse ok */
        ok?: (boolean|null);

        /** ReadEventResponse total */
        total?: (number|null);

        /** ReadEventResponse event */
        event?: (insole.IGaitEvent|null);
    }

    /** Represents a ReadEventResponse. */
    class ReadEventResponse implements IReadEventResponse {

        /**
         * Constructs a new ReadEventResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IReadEventResponse);

        /** ReadEventResponse ok. */
        public ok: boolean;

        /** ReadEventResponse total. */
        public total: number;

        /** ReadEventResponse event. */
        public event?: (insole.IGaitEvent|null);

        /**
         * Creates a new ReadEventResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns ReadEventResponse instance
         */
        public static create(properties?: insole.IReadEventResponse): insole.ReadEventResponse;

        /**
         * Encodes the specified ReadEventResponse message. Does not implicitly {@link insole.ReadEventResponse.verify|verify} messages.
         * @param message ReadEventResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IReadEventResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified ReadEventResponse message, length delimited. Does not implicitly {@link insole.ReadEventResponse.verify|verify} messages.
         * @param message ReadEventResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IReadEventResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a ReadEventResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns ReadEventResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.ReadEventResponse;

        /**
         * Decodes a ReadEventResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns ReadEventResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.ReadEventResponse;

        /**
         * Verifies a ReadEventResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a ReadEventResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns ReadEventResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.ReadEventResponse;

        /**
         * Creates a plain object from a ReadEventResponse message. Also converts values to other types if specified.
         * @param message ReadEventResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.ReadEventResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this ReadEventResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for ReadEventResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a GetFaultLogRequest. */
    interface IGetFaultLogRequest {
    }

    /** Represents a GetFaultLogRequest. */
    class GetFaultLogRequest implements IGetFaultLogRequest {

        /**
         * Constructs a new GetFaultLogRequest.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IGetFaultLogRequest);

        /**
         * Creates a new GetFaultLogRequest instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetFaultLogRequest instance
         */
        public static create(properties?: insole.IGetFaultLogRequest): insole.GetFaultLogRequest;

        /**
         * Encodes the specified GetFaultLogRequest message. Does not implicitly {@link insole.GetFaultLogRequest.verify|verify} messages.
         * @param message GetFaultLogRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IGetFaultLogRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetFaultLogRequest message, length delimited. Does not implicitly {@link insole.GetFaultLogRequest.verify|verify} messages.
         * @param message GetFaultLogRequest message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IGetFaultLogRequest, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetFaultLogRequest message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetFaultLogRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.GetFaultLogRequest;

        /**
         * Decodes a GetFaultLogRequest message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetFaultLogRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.GetFaultLogRequest;

        /**
         * Verifies a GetFaultLogRequest message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetFaultLogRequest message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetFaultLogRequest
         */
        public static fromObject(object: { [k: string]: any }): insole.GetFaultLogRequest;

        /**
         * Creates a plain object from a GetFaultLogRequest message. Also converts values to other types if specified.
         * @param message GetFaultLogRequest
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.GetFaultLogRequest, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetFaultLogRequest to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for GetFaultLogRequest
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }

    /** Properties of a GetFaultLogResponse. */
    interface IGetFaultLogResponse {

        /** GetFaultLogResponse valid */
        valid?: (boolean|null);

        /** GetFaultLogResponse bootCount */
        bootCount?: (number|null);

        /** GetFaultLogResponse faultCount */
        faultCount?: (number|null);

        /** GetFaultLogResponse softCount */
        softCount?: (number|null);

        /** GetFaultLogResponse fatalReason */
        fatalReason?: (number|null);

        /** GetFaultLogResponse fatalPc */
        fatalPc?: (number|null);

        /** GetFaultLogResponse fatalLr */
        fatalLr?: (number|null);

        /** GetFaultLogResponse fatalUptimeMs */
        fatalUptimeMs?: (number|null);

        /** GetFaultLogResponse fatalThread */
        fatalThread?: (string|null);

        /** GetFaultLogResponse fatalDetail */
        fatalDetail?: (string|null);

        /** GetFaultLogResponse softReason */
        softReason?: (number|null);

        /** GetFaultLogResponse softExtra */
        softExtra?: (number|null);

        /** GetFaultLogResponse softUptimeMs */
        softUptimeMs?: (number|null);

        /** GetFaultLogResponse softThread */
        softThread?: (string|null);

        /** GetFaultLogResponse softDetail */
        softDetail?: (string|null);

        /** GetFaultLogResponse samplerStackFree */
        samplerStackFree?: (number|null);

        /** GetFaultLogResponse gaitUpdateMaxUs */
        gaitUpdateMaxUs?: (number|null);

        /** GetFaultLogResponse gaitFlushMaxMs */
        gaitFlushMaxMs?: (number|null);

        /** GetFaultLogResponse resetCause */
        resetCause?: (number|null);

        /** GetFaultLogResponse samplesDropped */
        samplesDropped?: (number|null);
    }

    /** Represents a GetFaultLogResponse. */
    class GetFaultLogResponse implements IGetFaultLogResponse {

        /**
         * Constructs a new GetFaultLogResponse.
         * @param [properties] Properties to set
         */
        constructor(properties?: insole.IGetFaultLogResponse);

        /** GetFaultLogResponse valid. */
        public valid: boolean;

        /** GetFaultLogResponse bootCount. */
        public bootCount: number;

        /** GetFaultLogResponse faultCount. */
        public faultCount: number;

        /** GetFaultLogResponse softCount. */
        public softCount: number;

        /** GetFaultLogResponse fatalReason. */
        public fatalReason: number;

        /** GetFaultLogResponse fatalPc. */
        public fatalPc: number;

        /** GetFaultLogResponse fatalLr. */
        public fatalLr: number;

        /** GetFaultLogResponse fatalUptimeMs. */
        public fatalUptimeMs: number;

        /** GetFaultLogResponse fatalThread. */
        public fatalThread: string;

        /** GetFaultLogResponse fatalDetail. */
        public fatalDetail: string;

        /** GetFaultLogResponse softReason. */
        public softReason: number;

        /** GetFaultLogResponse softExtra. */
        public softExtra: number;

        /** GetFaultLogResponse softUptimeMs. */
        public softUptimeMs: number;

        /** GetFaultLogResponse softThread. */
        public softThread: string;

        /** GetFaultLogResponse softDetail. */
        public softDetail: string;

        /** GetFaultLogResponse samplerStackFree. */
        public samplerStackFree: number;

        /** GetFaultLogResponse gaitUpdateMaxUs. */
        public gaitUpdateMaxUs: number;

        /** GetFaultLogResponse gaitFlushMaxMs. */
        public gaitFlushMaxMs: number;

        /** GetFaultLogResponse resetCause. */
        public resetCause: number;

        /** GetFaultLogResponse samplesDropped. */
        public samplesDropped: number;

        /**
         * Creates a new GetFaultLogResponse instance using the specified properties.
         * @param [properties] Properties to set
         * @returns GetFaultLogResponse instance
         */
        public static create(properties?: insole.IGetFaultLogResponse): insole.GetFaultLogResponse;

        /**
         * Encodes the specified GetFaultLogResponse message. Does not implicitly {@link insole.GetFaultLogResponse.verify|verify} messages.
         * @param message GetFaultLogResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encode(message: insole.IGetFaultLogResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Encodes the specified GetFaultLogResponse message, length delimited. Does not implicitly {@link insole.GetFaultLogResponse.verify|verify} messages.
         * @param message GetFaultLogResponse message or plain object to encode
         * @param [writer] Writer to encode to
         * @returns Writer
         */
        public static encodeDelimited(message: insole.IGetFaultLogResponse, writer?: $protobuf.Writer): $protobuf.Writer;

        /**
         * Decodes a GetFaultLogResponse message from the specified reader or buffer.
         * @param reader Reader or buffer to decode from
         * @param [length] Message length if known beforehand
         * @returns GetFaultLogResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decode(reader: ($protobuf.Reader|Uint8Array), length?: number): insole.GetFaultLogResponse;

        /**
         * Decodes a GetFaultLogResponse message from the specified reader or buffer, length delimited.
         * @param reader Reader or buffer to decode from
         * @returns GetFaultLogResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        public static decodeDelimited(reader: ($protobuf.Reader|Uint8Array)): insole.GetFaultLogResponse;

        /**
         * Verifies a GetFaultLogResponse message.
         * @param message Plain object to verify
         * @returns `null` if valid, otherwise the reason why it is not
         */
        public static verify(message: { [k: string]: any }): (string|null);

        /**
         * Creates a GetFaultLogResponse message from a plain object. Also converts values to their respective internal types.
         * @param object Plain object
         * @returns GetFaultLogResponse
         */
        public static fromObject(object: { [k: string]: any }): insole.GetFaultLogResponse;

        /**
         * Creates a plain object from a GetFaultLogResponse message. Also converts values to other types if specified.
         * @param message GetFaultLogResponse
         * @param [options] Conversion options
         * @returns Plain object
         */
        public static toObject(message: insole.GetFaultLogResponse, options?: $protobuf.IConversionOptions): { [k: string]: any };

        /**
         * Converts this GetFaultLogResponse to JSON.
         * @returns JSON object
         */
        public toJSON(): { [k: string]: any };

        /**
         * Gets the default type url for GetFaultLogResponse
         * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns The default type url
         */
        public static getTypeUrl(typeUrlPrefix?: string): string;
    }
}

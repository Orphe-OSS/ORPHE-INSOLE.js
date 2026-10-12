/*eslint-disable block-scoped-var, id-length, no-control-regex, no-magic-numbers, no-prototype-builtins, no-redeclare, no-shadow, no-var, sort-vars*/
import * as $protobuf from "protobufjs/minimal";

// Common aliases
const $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
const $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

export const insole = $root.insole = (() => {

    /**
     * Namespace insole.
     * @exports insole
     * @namespace
     */
    const insole = {};

    insole.SetTimeRequest = (function() {

        /**
         * Properties of a SetTimeRequest.
         * @memberof insole
         * @interface ISetTimeRequest
         * @property {number|Long|null} [epochMs] SetTimeRequest epochMs
         */

        /**
         * Constructs a new SetTimeRequest.
         * @memberof insole
         * @classdesc Represents a SetTimeRequest.
         * @implements ISetTimeRequest
         * @constructor
         * @param {insole.ISetTimeRequest=} [properties] Properties to set
         */
        function SetTimeRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * SetTimeRequest epochMs.
         * @member {number|Long} epochMs
         * @memberof insole.SetTimeRequest
         * @instance
         */
        SetTimeRequest.prototype.epochMs = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Creates a new SetTimeRequest instance using the specified properties.
         * @function create
         * @memberof insole.SetTimeRequest
         * @static
         * @param {insole.ISetTimeRequest=} [properties] Properties to set
         * @returns {insole.SetTimeRequest} SetTimeRequest instance
         */
        SetTimeRequest.create = function create(properties) {
            return new SetTimeRequest(properties);
        };

        /**
         * Encodes the specified SetTimeRequest message. Does not implicitly {@link insole.SetTimeRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.SetTimeRequest
         * @static
         * @param {insole.ISetTimeRequest} message SetTimeRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetTimeRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.epochMs != null && Object.hasOwnProperty.call(message, "epochMs"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.epochMs);
            return writer;
        };

        /**
         * Encodes the specified SetTimeRequest message, length delimited. Does not implicitly {@link insole.SetTimeRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.SetTimeRequest
         * @static
         * @param {insole.ISetTimeRequest} message SetTimeRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetTimeRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a SetTimeRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.SetTimeRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.SetTimeRequest} SetTimeRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetTimeRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.SetTimeRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.epochMs = reader.uint64();
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a SetTimeRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.SetTimeRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.SetTimeRequest} SetTimeRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetTimeRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SetTimeRequest message.
         * @function verify
         * @memberof insole.SetTimeRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SetTimeRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.epochMs != null && Object.hasOwnProperty.call(message, "epochMs"))
                if (!$util.isInteger(message.epochMs) && !(message.epochMs && $util.isInteger(message.epochMs.low) && $util.isInteger(message.epochMs.high)))
                    return "epochMs: integer|Long expected";
            return null;
        };

        /**
         * Creates a SetTimeRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.SetTimeRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.SetTimeRequest} SetTimeRequest
         */
        SetTimeRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.SetTimeRequest)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.SetTimeRequest: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.SetTimeRequest();
            if (object.epochMs != null)
                if ($util.Long)
                    message.epochMs = $util.Long.fromValue(object.epochMs, true);
                else if (typeof object.epochMs === "string")
                    message.epochMs = parseInt(object.epochMs, 10);
                else if (typeof object.epochMs === "number")
                    message.epochMs = object.epochMs;
                else if (typeof object.epochMs === "object")
                    message.epochMs = new $util.LongBits(object.epochMs.low >>> 0, object.epochMs.high >>> 0).toNumber(true);
            return message;
        };

        /**
         * Creates a plain object from a SetTimeRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.SetTimeRequest
         * @static
         * @param {insole.SetTimeRequest} message SetTimeRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SetTimeRequest.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults)
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.epochMs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                } else
                    object.epochMs = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            if (message.epochMs != null && Object.hasOwnProperty.call(message, "epochMs"))
                if (typeof BigInt !== "undefined" && options.longs === BigInt)
                    object.epochMs = typeof message.epochMs === "number" ? BigInt(message.epochMs) : $util.Long.fromBits(message.epochMs.low >>> 0, message.epochMs.high >>> 0, true).toBigInt();
                else if (typeof message.epochMs === "number")
                    object.epochMs = options.longs === String ? String(message.epochMs) : message.epochMs;
                else
                    object.epochMs = options.longs === String ? $util.Long.prototype.toString.call(message.epochMs) : options.longs === Number ? new $util.LongBits(message.epochMs.low >>> 0, message.epochMs.high >>> 0).toNumber(true) : message.epochMs;
            return object;
        };

        /**
         * Converts this SetTimeRequest to JSON.
         * @function toJSON
         * @memberof insole.SetTimeRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SetTimeRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for SetTimeRequest
         * @function getTypeUrl
         * @memberof insole.SetTimeRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        SetTimeRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.SetTimeRequest";
        };

        return SetTimeRequest;
    })();

    insole.SetTimeResponse = (function() {

        /**
         * Properties of a SetTimeResponse.
         * @memberof insole
         * @interface ISetTimeResponse
         * @property {number|Long|null} [epochMs] SetTimeResponse epochMs
         */

        /**
         * Constructs a new SetTimeResponse.
         * @memberof insole
         * @classdesc Represents a SetTimeResponse.
         * @implements ISetTimeResponse
         * @constructor
         * @param {insole.ISetTimeResponse=} [properties] Properties to set
         */
        function SetTimeResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * SetTimeResponse epochMs.
         * @member {number|Long} epochMs
         * @memberof insole.SetTimeResponse
         * @instance
         */
        SetTimeResponse.prototype.epochMs = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Creates a new SetTimeResponse instance using the specified properties.
         * @function create
         * @memberof insole.SetTimeResponse
         * @static
         * @param {insole.ISetTimeResponse=} [properties] Properties to set
         * @returns {insole.SetTimeResponse} SetTimeResponse instance
         */
        SetTimeResponse.create = function create(properties) {
            return new SetTimeResponse(properties);
        };

        /**
         * Encodes the specified SetTimeResponse message. Does not implicitly {@link insole.SetTimeResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.SetTimeResponse
         * @static
         * @param {insole.ISetTimeResponse} message SetTimeResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetTimeResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.epochMs != null && Object.hasOwnProperty.call(message, "epochMs"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.epochMs);
            return writer;
        };

        /**
         * Encodes the specified SetTimeResponse message, length delimited. Does not implicitly {@link insole.SetTimeResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.SetTimeResponse
         * @static
         * @param {insole.ISetTimeResponse} message SetTimeResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetTimeResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a SetTimeResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.SetTimeResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.SetTimeResponse} SetTimeResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetTimeResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.SetTimeResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.epochMs = reader.uint64();
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a SetTimeResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.SetTimeResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.SetTimeResponse} SetTimeResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetTimeResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SetTimeResponse message.
         * @function verify
         * @memberof insole.SetTimeResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SetTimeResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.epochMs != null && Object.hasOwnProperty.call(message, "epochMs"))
                if (!$util.isInteger(message.epochMs) && !(message.epochMs && $util.isInteger(message.epochMs.low) && $util.isInteger(message.epochMs.high)))
                    return "epochMs: integer|Long expected";
            return null;
        };

        /**
         * Creates a SetTimeResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.SetTimeResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.SetTimeResponse} SetTimeResponse
         */
        SetTimeResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.SetTimeResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.SetTimeResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.SetTimeResponse();
            if (object.epochMs != null)
                if ($util.Long)
                    message.epochMs = $util.Long.fromValue(object.epochMs, true);
                else if (typeof object.epochMs === "string")
                    message.epochMs = parseInt(object.epochMs, 10);
                else if (typeof object.epochMs === "number")
                    message.epochMs = object.epochMs;
                else if (typeof object.epochMs === "object")
                    message.epochMs = new $util.LongBits(object.epochMs.low >>> 0, object.epochMs.high >>> 0).toNumber(true);
            return message;
        };

        /**
         * Creates a plain object from a SetTimeResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.SetTimeResponse
         * @static
         * @param {insole.SetTimeResponse} message SetTimeResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SetTimeResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults)
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.epochMs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                } else
                    object.epochMs = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            if (message.epochMs != null && Object.hasOwnProperty.call(message, "epochMs"))
                if (typeof BigInt !== "undefined" && options.longs === BigInt)
                    object.epochMs = typeof message.epochMs === "number" ? BigInt(message.epochMs) : $util.Long.fromBits(message.epochMs.low >>> 0, message.epochMs.high >>> 0, true).toBigInt();
                else if (typeof message.epochMs === "number")
                    object.epochMs = options.longs === String ? String(message.epochMs) : message.epochMs;
                else
                    object.epochMs = options.longs === String ? $util.Long.prototype.toString.call(message.epochMs) : options.longs === Number ? new $util.LongBits(message.epochMs.low >>> 0, message.epochMs.high >>> 0).toNumber(true) : message.epochMs;
            return object;
        };

        /**
         * Converts this SetTimeResponse to JSON.
         * @function toJSON
         * @memberof insole.SetTimeResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SetTimeResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for SetTimeResponse
         * @function getTypeUrl
         * @memberof insole.SetTimeResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        SetTimeResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.SetTimeResponse";
        };

        return SetTimeResponse;
    })();

    insole.ImuSample = (function() {

        /**
         * Properties of an ImuSample.
         * @memberof insole
         * @interface IImuSample
         * @property {number|null} [accelLateral] ImuSample accelLateral
         * @property {number|null} [accelLongitudinal] ImuSample accelLongitudinal
         * @property {number|null} [accelVertical] ImuSample accelVertical
         * @property {number|null} [gyroPitch] ImuSample gyroPitch
         * @property {number|null} [gyroRoll] ImuSample gyroRoll
         * @property {number|null} [gyroYaw] ImuSample gyroYaw
         */

        /**
         * Constructs a new ImuSample.
         * @memberof insole
         * @classdesc Represents an ImuSample.
         * @implements IImuSample
         * @constructor
         * @param {insole.IImuSample=} [properties] Properties to set
         */
        function ImuSample(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ImuSample accelLateral.
         * @member {number} accelLateral
         * @memberof insole.ImuSample
         * @instance
         */
        ImuSample.prototype.accelLateral = 0;

        /**
         * ImuSample accelLongitudinal.
         * @member {number} accelLongitudinal
         * @memberof insole.ImuSample
         * @instance
         */
        ImuSample.prototype.accelLongitudinal = 0;

        /**
         * ImuSample accelVertical.
         * @member {number} accelVertical
         * @memberof insole.ImuSample
         * @instance
         */
        ImuSample.prototype.accelVertical = 0;

        /**
         * ImuSample gyroPitch.
         * @member {number} gyroPitch
         * @memberof insole.ImuSample
         * @instance
         */
        ImuSample.prototype.gyroPitch = 0;

        /**
         * ImuSample gyroRoll.
         * @member {number} gyroRoll
         * @memberof insole.ImuSample
         * @instance
         */
        ImuSample.prototype.gyroRoll = 0;

        /**
         * ImuSample gyroYaw.
         * @member {number} gyroYaw
         * @memberof insole.ImuSample
         * @instance
         */
        ImuSample.prototype.gyroYaw = 0;

        /**
         * Creates a new ImuSample instance using the specified properties.
         * @function create
         * @memberof insole.ImuSample
         * @static
         * @param {insole.IImuSample=} [properties] Properties to set
         * @returns {insole.ImuSample} ImuSample instance
         */
        ImuSample.create = function create(properties) {
            return new ImuSample(properties);
        };

        /**
         * Encodes the specified ImuSample message. Does not implicitly {@link insole.ImuSample.verify|verify} messages.
         * @function encode
         * @memberof insole.ImuSample
         * @static
         * @param {insole.IImuSample} message ImuSample message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ImuSample.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.accelLateral != null && Object.hasOwnProperty.call(message, "accelLateral"))
                writer.uint32(/* id 1, wireType 5 =*/13).float(message.accelLateral);
            if (message.accelLongitudinal != null && Object.hasOwnProperty.call(message, "accelLongitudinal"))
                writer.uint32(/* id 2, wireType 5 =*/21).float(message.accelLongitudinal);
            if (message.accelVertical != null && Object.hasOwnProperty.call(message, "accelVertical"))
                writer.uint32(/* id 3, wireType 5 =*/29).float(message.accelVertical);
            if (message.gyroPitch != null && Object.hasOwnProperty.call(message, "gyroPitch"))
                writer.uint32(/* id 4, wireType 5 =*/37).float(message.gyroPitch);
            if (message.gyroRoll != null && Object.hasOwnProperty.call(message, "gyroRoll"))
                writer.uint32(/* id 5, wireType 5 =*/45).float(message.gyroRoll);
            if (message.gyroYaw != null && Object.hasOwnProperty.call(message, "gyroYaw"))
                writer.uint32(/* id 6, wireType 5 =*/53).float(message.gyroYaw);
            return writer;
        };

        /**
         * Encodes the specified ImuSample message, length delimited. Does not implicitly {@link insole.ImuSample.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.ImuSample
         * @static
         * @param {insole.IImuSample} message ImuSample message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ImuSample.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes an ImuSample message from the specified reader or buffer.
         * @function decode
         * @memberof insole.ImuSample
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.ImuSample} ImuSample
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ImuSample.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.ImuSample();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.accelLateral = reader.float();
                        break;
                    }
                case 2: {
                        message.accelLongitudinal = reader.float();
                        break;
                    }
                case 3: {
                        message.accelVertical = reader.float();
                        break;
                    }
                case 4: {
                        message.gyroPitch = reader.float();
                        break;
                    }
                case 5: {
                        message.gyroRoll = reader.float();
                        break;
                    }
                case 6: {
                        message.gyroYaw = reader.float();
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes an ImuSample message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.ImuSample
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.ImuSample} ImuSample
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ImuSample.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an ImuSample message.
         * @function verify
         * @memberof insole.ImuSample
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ImuSample.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.accelLateral != null && Object.hasOwnProperty.call(message, "accelLateral"))
                if (typeof message.accelLateral !== "number")
                    return "accelLateral: number expected";
            if (message.accelLongitudinal != null && Object.hasOwnProperty.call(message, "accelLongitudinal"))
                if (typeof message.accelLongitudinal !== "number")
                    return "accelLongitudinal: number expected";
            if (message.accelVertical != null && Object.hasOwnProperty.call(message, "accelVertical"))
                if (typeof message.accelVertical !== "number")
                    return "accelVertical: number expected";
            if (message.gyroPitch != null && Object.hasOwnProperty.call(message, "gyroPitch"))
                if (typeof message.gyroPitch !== "number")
                    return "gyroPitch: number expected";
            if (message.gyroRoll != null && Object.hasOwnProperty.call(message, "gyroRoll"))
                if (typeof message.gyroRoll !== "number")
                    return "gyroRoll: number expected";
            if (message.gyroYaw != null && Object.hasOwnProperty.call(message, "gyroYaw"))
                if (typeof message.gyroYaw !== "number")
                    return "gyroYaw: number expected";
            return null;
        };

        /**
         * Creates an ImuSample message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.ImuSample
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.ImuSample} ImuSample
         */
        ImuSample.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.ImuSample)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.ImuSample: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.ImuSample();
            if (object.accelLateral != null)
                message.accelLateral = Number(object.accelLateral);
            if (object.accelLongitudinal != null)
                message.accelLongitudinal = Number(object.accelLongitudinal);
            if (object.accelVertical != null)
                message.accelVertical = Number(object.accelVertical);
            if (object.gyroPitch != null)
                message.gyroPitch = Number(object.gyroPitch);
            if (object.gyroRoll != null)
                message.gyroRoll = Number(object.gyroRoll);
            if (object.gyroYaw != null)
                message.gyroYaw = Number(object.gyroYaw);
            return message;
        };

        /**
         * Creates a plain object from an ImuSample message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.ImuSample
         * @static
         * @param {insole.ImuSample} message ImuSample
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ImuSample.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.accelLateral = 0;
                object.accelLongitudinal = 0;
                object.accelVertical = 0;
                object.gyroPitch = 0;
                object.gyroRoll = 0;
                object.gyroYaw = 0;
            }
            if (message.accelLateral != null && Object.hasOwnProperty.call(message, "accelLateral"))
                object.accelLateral = options.json && !isFinite(message.accelLateral) ? String(message.accelLateral) : message.accelLateral;
            if (message.accelLongitudinal != null && Object.hasOwnProperty.call(message, "accelLongitudinal"))
                object.accelLongitudinal = options.json && !isFinite(message.accelLongitudinal) ? String(message.accelLongitudinal) : message.accelLongitudinal;
            if (message.accelVertical != null && Object.hasOwnProperty.call(message, "accelVertical"))
                object.accelVertical = options.json && !isFinite(message.accelVertical) ? String(message.accelVertical) : message.accelVertical;
            if (message.gyroPitch != null && Object.hasOwnProperty.call(message, "gyroPitch"))
                object.gyroPitch = options.json && !isFinite(message.gyroPitch) ? String(message.gyroPitch) : message.gyroPitch;
            if (message.gyroRoll != null && Object.hasOwnProperty.call(message, "gyroRoll"))
                object.gyroRoll = options.json && !isFinite(message.gyroRoll) ? String(message.gyroRoll) : message.gyroRoll;
            if (message.gyroYaw != null && Object.hasOwnProperty.call(message, "gyroYaw"))
                object.gyroYaw = options.json && !isFinite(message.gyroYaw) ? String(message.gyroYaw) : message.gyroYaw;
            return object;
        };

        /**
         * Converts this ImuSample to JSON.
         * @function toJSON
         * @memberof insole.ImuSample
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ImuSample.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ImuSample
         * @function getTypeUrl
         * @memberof insole.ImuSample
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ImuSample.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.ImuSample";
        };

        return ImuSample;
    })();

    insole.PressureSample = (function() {

        /**
         * Properties of a PressureSample.
         * @memberof insole
         * @interface IPressureSample
         * @property {Array.<number>|null} [mv] PressureSample mv
         */

        /**
         * Constructs a new PressureSample.
         * @memberof insole
         * @classdesc Represents a PressureSample.
         * @implements IPressureSample
         * @constructor
         * @param {insole.IPressureSample=} [properties] Properties to set
         */
        function PressureSample(properties) {
            this.mv = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PressureSample mv.
         * @member {Array.<number>} mv
         * @memberof insole.PressureSample
         * @instance
         */
        PressureSample.prototype.mv = $util.emptyArray;

        /**
         * Creates a new PressureSample instance using the specified properties.
         * @function create
         * @memberof insole.PressureSample
         * @static
         * @param {insole.IPressureSample=} [properties] Properties to set
         * @returns {insole.PressureSample} PressureSample instance
         */
        PressureSample.create = function create(properties) {
            return new PressureSample(properties);
        };

        /**
         * Encodes the specified PressureSample message. Does not implicitly {@link insole.PressureSample.verify|verify} messages.
         * @function encode
         * @memberof insole.PressureSample
         * @static
         * @param {insole.IPressureSample} message PressureSample message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PressureSample.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.mv != null && message.mv.length) {
                writer.uint32(/* id 1, wireType 2 =*/10).fork();
                for (let i = 0; i < message.mv.length; ++i)
                    writer.float(message.mv[i]);
                writer.ldelim();
            }
            return writer;
        };

        /**
         * Encodes the specified PressureSample message, length delimited. Does not implicitly {@link insole.PressureSample.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.PressureSample
         * @static
         * @param {insole.IPressureSample} message PressureSample message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PressureSample.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a PressureSample message from the specified reader or buffer.
         * @function decode
         * @memberof insole.PressureSample
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.PressureSample} PressureSample
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PressureSample.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.PressureSample();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        if (!(message.mv && message.mv.length))
                            message.mv = [];
                        if ((tag & 7) === 2) {
                            let end2 = reader.uint32() + reader.pos;
                            while (reader.pos < end2)
                                message.mv.push(reader.float());
                        } else
                            message.mv.push(reader.float());
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a PressureSample message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.PressureSample
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.PressureSample} PressureSample
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PressureSample.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PressureSample message.
         * @function verify
         * @memberof insole.PressureSample
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        PressureSample.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.mv != null && Object.hasOwnProperty.call(message, "mv")) {
                if (!Array.isArray(message.mv))
                    return "mv: array expected";
                for (let i = 0; i < message.mv.length; ++i)
                    if (typeof message.mv[i] !== "number")
                        return "mv: number[] expected";
            }
            return null;
        };

        /**
         * Creates a PressureSample message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.PressureSample
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.PressureSample} PressureSample
         */
        PressureSample.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.PressureSample)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.PressureSample: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.PressureSample();
            if (object.mv) {
                if (!Array.isArray(object.mv))
                    throw TypeError(".insole.PressureSample.mv: array expected");
                message.mv = [];
                for (let i = 0; i < object.mv.length; ++i)
                    message.mv[i] = Number(object.mv[i]);
            }
            return message;
        };

        /**
         * Creates a plain object from a PressureSample message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.PressureSample
         * @static
         * @param {insole.PressureSample} message PressureSample
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PressureSample.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.arrays || options.defaults)
                object.mv = [];
            if (message.mv && message.mv.length) {
                object.mv = [];
                for (let j = 0; j < message.mv.length; ++j)
                    object.mv[j] = options.json && !isFinite(message.mv[j]) ? String(message.mv[j]) : message.mv[j];
            }
            return object;
        };

        /**
         * Converts this PressureSample to JSON.
         * @function toJSON
         * @memberof insole.PressureSample
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        PressureSample.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for PressureSample
         * @function getTypeUrl
         * @memberof insole.PressureSample
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        PressureSample.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.PressureSample";
        };

        return PressureSample;
    })();

    /**
     * WindowStatus enum.
     * @name insole.WindowStatus
     * @enum {number}
     * @property {number} WINDOW_STATUS_UNSPECIFIED=0 WINDOW_STATUS_UNSPECIFIED value
     * @property {number} WINDOW_STATUS_OK=1 WINDOW_STATUS_OK value
     * @property {number} WINDOW_STATUS_TOO_OLD=2 WINDOW_STATUS_TOO_OLD value
     * @property {number} WINDOW_STATUS_TOO_NEW=3 WINDOW_STATUS_TOO_NEW value
     * @property {number} WINDOW_STATUS_TIME_NOT_SET=4 WINDOW_STATUS_TIME_NOT_SET value
     */
    insole.WindowStatus = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "WINDOW_STATUS_UNSPECIFIED"] = 0;
        values[valuesById[1] = "WINDOW_STATUS_OK"] = 1;
        values[valuesById[2] = "WINDOW_STATUS_TOO_OLD"] = 2;
        values[valuesById[3] = "WINDOW_STATUS_TOO_NEW"] = 3;
        values[valuesById[4] = "WINDOW_STATUS_TIME_NOT_SET"] = 4;
        return values;
    })();

    insole.GetWindowRequest = (function() {

        /**
         * Properties of a GetWindowRequest.
         * @memberof insole
         * @interface IGetWindowRequest
         * @property {number|Long|null} [startMs] GetWindowRequest startMs
         */

        /**
         * Constructs a new GetWindowRequest.
         * @memberof insole
         * @classdesc Represents a GetWindowRequest.
         * @implements IGetWindowRequest
         * @constructor
         * @param {insole.IGetWindowRequest=} [properties] Properties to set
         */
        function GetWindowRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GetWindowRequest startMs.
         * @member {number|Long} startMs
         * @memberof insole.GetWindowRequest
         * @instance
         */
        GetWindowRequest.prototype.startMs = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * Creates a new GetWindowRequest instance using the specified properties.
         * @function create
         * @memberof insole.GetWindowRequest
         * @static
         * @param {insole.IGetWindowRequest=} [properties] Properties to set
         * @returns {insole.GetWindowRequest} GetWindowRequest instance
         */
        GetWindowRequest.create = function create(properties) {
            return new GetWindowRequest(properties);
        };

        /**
         * Encodes the specified GetWindowRequest message. Does not implicitly {@link insole.GetWindowRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.GetWindowRequest
         * @static
         * @param {insole.IGetWindowRequest} message GetWindowRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetWindowRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint64(message.startMs);
            return writer;
        };

        /**
         * Encodes the specified GetWindowRequest message, length delimited. Does not implicitly {@link insole.GetWindowRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.GetWindowRequest
         * @static
         * @param {insole.IGetWindowRequest} message GetWindowRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetWindowRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a GetWindowRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.GetWindowRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.GetWindowRequest} GetWindowRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetWindowRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.GetWindowRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.startMs = reader.uint64();
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GetWindowRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.GetWindowRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.GetWindowRequest} GetWindowRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetWindowRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetWindowRequest message.
         * @function verify
         * @memberof insole.GetWindowRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetWindowRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs"))
                if (!$util.isInteger(message.startMs) && !(message.startMs && $util.isInteger(message.startMs.low) && $util.isInteger(message.startMs.high)))
                    return "startMs: integer|Long expected";
            return null;
        };

        /**
         * Creates a GetWindowRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.GetWindowRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.GetWindowRequest} GetWindowRequest
         */
        GetWindowRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.GetWindowRequest)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.GetWindowRequest: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.GetWindowRequest();
            if (object.startMs != null)
                if ($util.Long)
                    message.startMs = $util.Long.fromValue(object.startMs, true);
                else if (typeof object.startMs === "string")
                    message.startMs = parseInt(object.startMs, 10);
                else if (typeof object.startMs === "number")
                    message.startMs = object.startMs;
                else if (typeof object.startMs === "object")
                    message.startMs = new $util.LongBits(object.startMs.low >>> 0, object.startMs.high >>> 0).toNumber(true);
            return message;
        };

        /**
         * Creates a plain object from a GetWindowRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.GetWindowRequest
         * @static
         * @param {insole.GetWindowRequest} message GetWindowRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetWindowRequest.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults)
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.startMs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                } else
                    object.startMs = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs"))
                if (typeof BigInt !== "undefined" && options.longs === BigInt)
                    object.startMs = typeof message.startMs === "number" ? BigInt(message.startMs) : $util.Long.fromBits(message.startMs.low >>> 0, message.startMs.high >>> 0, true).toBigInt();
                else if (typeof message.startMs === "number")
                    object.startMs = options.longs === String ? String(message.startMs) : message.startMs;
                else
                    object.startMs = options.longs === String ? $util.Long.prototype.toString.call(message.startMs) : options.longs === Number ? new $util.LongBits(message.startMs.low >>> 0, message.startMs.high >>> 0).toNumber(true) : message.startMs;
            return object;
        };

        /**
         * Converts this GetWindowRequest to JSON.
         * @function toJSON
         * @memberof insole.GetWindowRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetWindowRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for GetWindowRequest
         * @function getTypeUrl
         * @memberof insole.GetWindowRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        GetWindowRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.GetWindowRequest";
        };

        return GetWindowRequest;
    })();

    insole.GetWindowResponse = (function() {

        /**
         * Properties of a GetWindowResponse.
         * @memberof insole
         * @interface IGetWindowResponse
         * @property {insole.WindowStatus|null} [status] GetWindowResponse status
         * @property {number|Long|null} [startMs] GetWindowResponse startMs
         * @property {number|Long|null} [oldestMs] GetWindowResponse oldestMs
         * @property {number|Long|null} [newestMs] GetWindowResponse newestMs
         * @property {Array.<insole.IImuSample>|null} [imu] GetWindowResponse imu
         * @property {Array.<insole.IPressureSample>|null} [pressure] GetWindowResponse pressure
         */

        /**
         * Constructs a new GetWindowResponse.
         * @memberof insole
         * @classdesc Represents a GetWindowResponse.
         * @implements IGetWindowResponse
         * @constructor
         * @param {insole.IGetWindowResponse=} [properties] Properties to set
         */
        function GetWindowResponse(properties) {
            this.imu = [];
            this.pressure = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GetWindowResponse status.
         * @member {insole.WindowStatus} status
         * @memberof insole.GetWindowResponse
         * @instance
         */
        GetWindowResponse.prototype.status = 0;

        /**
         * GetWindowResponse startMs.
         * @member {number|Long} startMs
         * @memberof insole.GetWindowResponse
         * @instance
         */
        GetWindowResponse.prototype.startMs = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * GetWindowResponse oldestMs.
         * @member {number|Long} oldestMs
         * @memberof insole.GetWindowResponse
         * @instance
         */
        GetWindowResponse.prototype.oldestMs = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * GetWindowResponse newestMs.
         * @member {number|Long} newestMs
         * @memberof insole.GetWindowResponse
         * @instance
         */
        GetWindowResponse.prototype.newestMs = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * GetWindowResponse imu.
         * @member {Array.<insole.IImuSample>} imu
         * @memberof insole.GetWindowResponse
         * @instance
         */
        GetWindowResponse.prototype.imu = $util.emptyArray;

        /**
         * GetWindowResponse pressure.
         * @member {Array.<insole.IPressureSample>} pressure
         * @memberof insole.GetWindowResponse
         * @instance
         */
        GetWindowResponse.prototype.pressure = $util.emptyArray;

        /**
         * Creates a new GetWindowResponse instance using the specified properties.
         * @function create
         * @memberof insole.GetWindowResponse
         * @static
         * @param {insole.IGetWindowResponse=} [properties] Properties to set
         * @returns {insole.GetWindowResponse} GetWindowResponse instance
         */
        GetWindowResponse.create = function create(properties) {
            return new GetWindowResponse(properties);
        };

        /**
         * Encodes the specified GetWindowResponse message. Does not implicitly {@link insole.GetWindowResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.GetWindowResponse
         * @static
         * @param {insole.IGetWindowResponse} message GetWindowResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetWindowResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.status != null && Object.hasOwnProperty.call(message, "status"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.status);
            if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.startMs);
            if (message.oldestMs != null && Object.hasOwnProperty.call(message, "oldestMs"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint64(message.oldestMs);
            if (message.newestMs != null && Object.hasOwnProperty.call(message, "newestMs"))
                writer.uint32(/* id 4, wireType 0 =*/32).uint64(message.newestMs);
            if (message.imu != null && message.imu.length)
                for (let i = 0; i < message.imu.length; ++i)
                    $root.insole.ImuSample.encode(message.imu[i], writer.uint32(/* id 5, wireType 2 =*/42).fork(), q + 1).ldelim();
            if (message.pressure != null && message.pressure.length)
                for (let i = 0; i < message.pressure.length; ++i)
                    $root.insole.PressureSample.encode(message.pressure[i], writer.uint32(/* id 6, wireType 2 =*/50).fork(), q + 1).ldelim();
            return writer;
        };

        /**
         * Encodes the specified GetWindowResponse message, length delimited. Does not implicitly {@link insole.GetWindowResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.GetWindowResponse
         * @static
         * @param {insole.IGetWindowResponse} message GetWindowResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetWindowResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a GetWindowResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.GetWindowResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.GetWindowResponse} GetWindowResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetWindowResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.GetWindowResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.status = reader.int32();
                        break;
                    }
                case 2: {
                        message.startMs = reader.uint64();
                        break;
                    }
                case 3: {
                        message.oldestMs = reader.uint64();
                        break;
                    }
                case 4: {
                        message.newestMs = reader.uint64();
                        break;
                    }
                case 5: {
                        if (!(message.imu && message.imu.length))
                            message.imu = [];
                        message.imu.push($root.insole.ImuSample.decode(reader, reader.uint32(), undefined, long + 1));
                        break;
                    }
                case 6: {
                        if (!(message.pressure && message.pressure.length))
                            message.pressure = [];
                        message.pressure.push($root.insole.PressureSample.decode(reader, reader.uint32(), undefined, long + 1));
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GetWindowResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.GetWindowResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.GetWindowResponse} GetWindowResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetWindowResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetWindowResponse message.
         * @function verify
         * @memberof insole.GetWindowResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetWindowResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.status != null && Object.hasOwnProperty.call(message, "status"))
                switch (message.status) {
                default:
                    return "status: enum value expected";
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                    break;
                }
            if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs"))
                if (!$util.isInteger(message.startMs) && !(message.startMs && $util.isInteger(message.startMs.low) && $util.isInteger(message.startMs.high)))
                    return "startMs: integer|Long expected";
            if (message.oldestMs != null && Object.hasOwnProperty.call(message, "oldestMs"))
                if (!$util.isInteger(message.oldestMs) && !(message.oldestMs && $util.isInteger(message.oldestMs.low) && $util.isInteger(message.oldestMs.high)))
                    return "oldestMs: integer|Long expected";
            if (message.newestMs != null && Object.hasOwnProperty.call(message, "newestMs"))
                if (!$util.isInteger(message.newestMs) && !(message.newestMs && $util.isInteger(message.newestMs.low) && $util.isInteger(message.newestMs.high)))
                    return "newestMs: integer|Long expected";
            if (message.imu != null && Object.hasOwnProperty.call(message, "imu")) {
                if (!Array.isArray(message.imu))
                    return "imu: array expected";
                for (let i = 0; i < message.imu.length; ++i) {
                    let error = $root.insole.ImuSample.verify(message.imu[i], long + 1);
                    if (error)
                        return "imu." + error;
                }
            }
            if (message.pressure != null && Object.hasOwnProperty.call(message, "pressure")) {
                if (!Array.isArray(message.pressure))
                    return "pressure: array expected";
                for (let i = 0; i < message.pressure.length; ++i) {
                    let error = $root.insole.PressureSample.verify(message.pressure[i], long + 1);
                    if (error)
                        return "pressure." + error;
                }
            }
            return null;
        };

        /**
         * Creates a GetWindowResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.GetWindowResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.GetWindowResponse} GetWindowResponse
         */
        GetWindowResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.GetWindowResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.GetWindowResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.GetWindowResponse();
            switch (object.status) {
            default:
                if (typeof object.status === "number") {
                    message.status = object.status;
                    break;
                }
                break;
            case "WINDOW_STATUS_UNSPECIFIED":
            case 0:
                message.status = 0;
                break;
            case "WINDOW_STATUS_OK":
            case 1:
                message.status = 1;
                break;
            case "WINDOW_STATUS_TOO_OLD":
            case 2:
                message.status = 2;
                break;
            case "WINDOW_STATUS_TOO_NEW":
            case 3:
                message.status = 3;
                break;
            case "WINDOW_STATUS_TIME_NOT_SET":
            case 4:
                message.status = 4;
                break;
            }
            if (object.startMs != null)
                if ($util.Long)
                    message.startMs = $util.Long.fromValue(object.startMs, true);
                else if (typeof object.startMs === "string")
                    message.startMs = parseInt(object.startMs, 10);
                else if (typeof object.startMs === "number")
                    message.startMs = object.startMs;
                else if (typeof object.startMs === "object")
                    message.startMs = new $util.LongBits(object.startMs.low >>> 0, object.startMs.high >>> 0).toNumber(true);
            if (object.oldestMs != null)
                if ($util.Long)
                    message.oldestMs = $util.Long.fromValue(object.oldestMs, true);
                else if (typeof object.oldestMs === "string")
                    message.oldestMs = parseInt(object.oldestMs, 10);
                else if (typeof object.oldestMs === "number")
                    message.oldestMs = object.oldestMs;
                else if (typeof object.oldestMs === "object")
                    message.oldestMs = new $util.LongBits(object.oldestMs.low >>> 0, object.oldestMs.high >>> 0).toNumber(true);
            if (object.newestMs != null)
                if ($util.Long)
                    message.newestMs = $util.Long.fromValue(object.newestMs, true);
                else if (typeof object.newestMs === "string")
                    message.newestMs = parseInt(object.newestMs, 10);
                else if (typeof object.newestMs === "number")
                    message.newestMs = object.newestMs;
                else if (typeof object.newestMs === "object")
                    message.newestMs = new $util.LongBits(object.newestMs.low >>> 0, object.newestMs.high >>> 0).toNumber(true);
            if (object.imu) {
                if (!Array.isArray(object.imu))
                    throw TypeError(".insole.GetWindowResponse.imu: array expected");
                message.imu = [];
                for (let i = 0; i < object.imu.length; ++i) {
                    if (!$util.isObject(object.imu[i]))
                        throw TypeError(".insole.GetWindowResponse.imu: object expected");
                    message.imu[i] = $root.insole.ImuSample.fromObject(object.imu[i], long + 1);
                }
            }
            if (object.pressure) {
                if (!Array.isArray(object.pressure))
                    throw TypeError(".insole.GetWindowResponse.pressure: array expected");
                message.pressure = [];
                for (let i = 0; i < object.pressure.length; ++i) {
                    if (!$util.isObject(object.pressure[i]))
                        throw TypeError(".insole.GetWindowResponse.pressure: object expected");
                    message.pressure[i] = $root.insole.PressureSample.fromObject(object.pressure[i], long + 1);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a GetWindowResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.GetWindowResponse
         * @static
         * @param {insole.GetWindowResponse} message GetWindowResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetWindowResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.arrays || options.defaults) {
                object.imu = [];
                object.pressure = [];
            }
            if (options.defaults) {
                object.status = options.enums === String ? "WINDOW_STATUS_UNSPECIFIED" : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.startMs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                } else
                    object.startMs = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.oldestMs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                } else
                    object.oldestMs = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.newestMs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                } else
                    object.newestMs = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
            }
            if (message.status != null && Object.hasOwnProperty.call(message, "status"))
                object.status = options.enums === String ? $root.insole.WindowStatus[message.status] === undefined ? message.status : $root.insole.WindowStatus[message.status] : message.status;
            if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs"))
                if (typeof BigInt !== "undefined" && options.longs === BigInt)
                    object.startMs = typeof message.startMs === "number" ? BigInt(message.startMs) : $util.Long.fromBits(message.startMs.low >>> 0, message.startMs.high >>> 0, true).toBigInt();
                else if (typeof message.startMs === "number")
                    object.startMs = options.longs === String ? String(message.startMs) : message.startMs;
                else
                    object.startMs = options.longs === String ? $util.Long.prototype.toString.call(message.startMs) : options.longs === Number ? new $util.LongBits(message.startMs.low >>> 0, message.startMs.high >>> 0).toNumber(true) : message.startMs;
            if (message.oldestMs != null && Object.hasOwnProperty.call(message, "oldestMs"))
                if (typeof BigInt !== "undefined" && options.longs === BigInt)
                    object.oldestMs = typeof message.oldestMs === "number" ? BigInt(message.oldestMs) : $util.Long.fromBits(message.oldestMs.low >>> 0, message.oldestMs.high >>> 0, true).toBigInt();
                else if (typeof message.oldestMs === "number")
                    object.oldestMs = options.longs === String ? String(message.oldestMs) : message.oldestMs;
                else
                    object.oldestMs = options.longs === String ? $util.Long.prototype.toString.call(message.oldestMs) : options.longs === Number ? new $util.LongBits(message.oldestMs.low >>> 0, message.oldestMs.high >>> 0).toNumber(true) : message.oldestMs;
            if (message.newestMs != null && Object.hasOwnProperty.call(message, "newestMs"))
                if (typeof BigInt !== "undefined" && options.longs === BigInt)
                    object.newestMs = typeof message.newestMs === "number" ? BigInt(message.newestMs) : $util.Long.fromBits(message.newestMs.low >>> 0, message.newestMs.high >>> 0, true).toBigInt();
                else if (typeof message.newestMs === "number")
                    object.newestMs = options.longs === String ? String(message.newestMs) : message.newestMs;
                else
                    object.newestMs = options.longs === String ? $util.Long.prototype.toString.call(message.newestMs) : options.longs === Number ? new $util.LongBits(message.newestMs.low >>> 0, message.newestMs.high >>> 0).toNumber(true) : message.newestMs;
            if (message.imu && message.imu.length) {
                object.imu = [];
                for (let j = 0; j < message.imu.length; ++j)
                    object.imu[j] = $root.insole.ImuSample.toObject(message.imu[j], options, q + 1);
            }
            if (message.pressure && message.pressure.length) {
                object.pressure = [];
                for (let j = 0; j < message.pressure.length; ++j)
                    object.pressure[j] = $root.insole.PressureSample.toObject(message.pressure[j], options, q + 1);
            }
            return object;
        };

        /**
         * Converts this GetWindowResponse to JSON.
         * @function toJSON
         * @memberof insole.GetWindowResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetWindowResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for GetWindowResponse
         * @function getTypeUrl
         * @memberof insole.GetWindowResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        GetWindowResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.GetWindowResponse";
        };

        return GetWindowResponse;
    })();

    /**
     * Foot enum.
     * @name insole.Foot
     * @enum {number}
     * @property {number} FOOT_UNSPECIFIED=0 FOOT_UNSPECIFIED value
     * @property {number} FOOT_LEFT=1 FOOT_LEFT value
     * @property {number} FOOT_RIGHT=2 FOOT_RIGHT value
     */
    insole.Foot = (function() {
        const valuesById = {}, values = Object.create(valuesById);
        values[valuesById[0] = "FOOT_UNSPECIFIED"] = 0;
        values[valuesById[1] = "FOOT_LEFT"] = 1;
        values[valuesById[2] = "FOOT_RIGHT"] = 2;
        return values;
    })();

    insole.GetConfigRequest = (function() {

        /**
         * Properties of a GetConfigRequest.
         * @memberof insole
         * @interface IGetConfigRequest
         */

        /**
         * Constructs a new GetConfigRequest.
         * @memberof insole
         * @classdesc Represents a GetConfigRequest.
         * @implements IGetConfigRequest
         * @constructor
         * @param {insole.IGetConfigRequest=} [properties] Properties to set
         */
        function GetConfigRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new GetConfigRequest instance using the specified properties.
         * @function create
         * @memberof insole.GetConfigRequest
         * @static
         * @param {insole.IGetConfigRequest=} [properties] Properties to set
         * @returns {insole.GetConfigRequest} GetConfigRequest instance
         */
        GetConfigRequest.create = function create(properties) {
            return new GetConfigRequest(properties);
        };

        /**
         * Encodes the specified GetConfigRequest message. Does not implicitly {@link insole.GetConfigRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.GetConfigRequest
         * @static
         * @param {insole.IGetConfigRequest} message GetConfigRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetConfigRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            return writer;
        };

        /**
         * Encodes the specified GetConfigRequest message, length delimited. Does not implicitly {@link insole.GetConfigRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.GetConfigRequest
         * @static
         * @param {insole.IGetConfigRequest} message GetConfigRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetConfigRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a GetConfigRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.GetConfigRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.GetConfigRequest} GetConfigRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetConfigRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.GetConfigRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GetConfigRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.GetConfigRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.GetConfigRequest} GetConfigRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetConfigRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetConfigRequest message.
         * @function verify
         * @memberof insole.GetConfigRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetConfigRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            return null;
        };

        /**
         * Creates a GetConfigRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.GetConfigRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.GetConfigRequest} GetConfigRequest
         */
        GetConfigRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.GetConfigRequest)
                return object;
            return new $root.insole.GetConfigRequest();
        };

        /**
         * Creates a plain object from a GetConfigRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.GetConfigRequest
         * @static
         * @param {insole.GetConfigRequest} message GetConfigRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetConfigRequest.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this GetConfigRequest to JSON.
         * @function toJSON
         * @memberof insole.GetConfigRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetConfigRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for GetConfigRequest
         * @function getTypeUrl
         * @memberof insole.GetConfigRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        GetConfigRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.GetConfigRequest";
        };

        return GetConfigRequest;
    })();

    insole.GetConfigResponse = (function() {

        /**
         * Properties of a GetConfigResponse.
         * @memberof insole
         * @interface IGetConfigResponse
         * @property {number|null} [deviceId] GetConfigResponse deviceId
         * @property {insole.Foot|null} [foot] GetConfigResponse foot
         * @property {string|null} [firmwareVersion] GetConfigResponse firmwareVersion
         */

        /**
         * Constructs a new GetConfigResponse.
         * @memberof insole
         * @classdesc Represents a GetConfigResponse.
         * @implements IGetConfigResponse
         * @constructor
         * @param {insole.IGetConfigResponse=} [properties] Properties to set
         */
        function GetConfigResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GetConfigResponse deviceId.
         * @member {number} deviceId
         * @memberof insole.GetConfigResponse
         * @instance
         */
        GetConfigResponse.prototype.deviceId = 0;

        /**
         * GetConfigResponse foot.
         * @member {insole.Foot} foot
         * @memberof insole.GetConfigResponse
         * @instance
         */
        GetConfigResponse.prototype.foot = 0;

        /**
         * GetConfigResponse firmwareVersion.
         * @member {string} firmwareVersion
         * @memberof insole.GetConfigResponse
         * @instance
         */
        GetConfigResponse.prototype.firmwareVersion = "";

        /**
         * Creates a new GetConfigResponse instance using the specified properties.
         * @function create
         * @memberof insole.GetConfigResponse
         * @static
         * @param {insole.IGetConfigResponse=} [properties] Properties to set
         * @returns {insole.GetConfigResponse} GetConfigResponse instance
         */
        GetConfigResponse.create = function create(properties) {
            return new GetConfigResponse(properties);
        };

        /**
         * Encodes the specified GetConfigResponse message. Does not implicitly {@link insole.GetConfigResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.GetConfigResponse
         * @static
         * @param {insole.IGetConfigResponse} message GetConfigResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetConfigResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.deviceId);
            if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
                writer.uint32(/* id 2, wireType 0 =*/16).int32(message.foot);
            if (message.firmwareVersion != null && Object.hasOwnProperty.call(message, "firmwareVersion"))
                writer.uint32(/* id 3, wireType 2 =*/26).string(message.firmwareVersion);
            return writer;
        };

        /**
         * Encodes the specified GetConfigResponse message, length delimited. Does not implicitly {@link insole.GetConfigResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.GetConfigResponse
         * @static
         * @param {insole.IGetConfigResponse} message GetConfigResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetConfigResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a GetConfigResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.GetConfigResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.GetConfigResponse} GetConfigResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetConfigResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.GetConfigResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.deviceId = reader.uint32();
                        break;
                    }
                case 2: {
                        message.foot = reader.int32();
                        break;
                    }
                case 3: {
                        message.firmwareVersion = reader.string();
                        break;
                    }
                default:
                    reader.skipType(tag & 7, long);
                    break;
                }
            }
            return message;
        };

        /**
         * Decodes a GetConfigResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.GetConfigResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.GetConfigResponse} GetConfigResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetConfigResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetConfigResponse message.
         * @function verify
         * @memberof insole.GetConfigResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetConfigResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId"))
                if (!$util.isInteger(message.deviceId))
                    return "deviceId: integer expected";
            if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
                switch (message.foot) {
                default:
                    return "foot: enum value expected";
                case 0:
                case 1:
                case 2:
                    break;
                }
            if (message.firmwareVersion != null && Object.hasOwnProperty.call(message, "firmwareVersion"))
                if (!$util.isString(message.firmwareVersion))
                    return "firmwareVersion: string expected";
            return null;
        };

        /**
         * Creates a GetConfigResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.GetConfigResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.GetConfigResponse} GetConfigResponse
         */
        GetConfigResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.GetConfigResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.GetConfigResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.GetConfigResponse();
            if (object.deviceId != null)
                message.deviceId = object.deviceId >>> 0;
            switch (object.foot) {
            default:
                if (typeof object.foot === "number") {
                    message.foot = object.foot;
                    break;
                }
                break;
            case "FOOT_UNSPECIFIED":
            case 0:
                message.foot = 0;
                break;
            case "FOOT_LEFT":
            case 1:
                message.foot = 1;
                break;
            case "FOOT_RIGHT":
            case 2:
                message.foot = 2;
                break;
            }
            if (object.firmwareVersion != null)
                message.firmwareVersion = String(object.firmwareVersion);
            return message;
        };

        /**
         * Creates a plain object from a GetConfigResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.GetConfigResponse
         * @static
         * @param {insole.GetConfigResponse} message GetConfigResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetConfigResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.deviceId = 0;
                object.foot = options.enums === String ? "FOOT_UNSPECIFIED" : 0;
                object.firmwareVersion = "";
            }
            if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId"))
                object.deviceId = message.deviceId;
            if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
                object.foot = options.enums === String ? $root.insole.Foot[message.foot] === undefined ? message.foot : $root.insole.Foot[message.foot] : message.foot;
            if (message.firmwareVersion != null && Object.hasOwnProperty.call(message, "firmwareVersion"))
                object.firmwareVersion = message.firmwareVersion;
            return object;
        };

        /**
         * Converts this GetConfigResponse to JSON.
         * @function toJSON
         * @memberof insole.GetConfigResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetConfigResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for GetConfigResponse
         * @function getTypeUrl
         * @memberof insole.GetConfigResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        GetConfigResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.GetConfigResponse";
        };

        return GetConfigResponse;
    })();

    return insole;
})();

export { $root as default };

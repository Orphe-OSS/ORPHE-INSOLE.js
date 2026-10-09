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

    insole.EchoRequest = (function() {

        /**
         * Properties of an EchoRequest.
         * @memberof insole
         * @interface IEchoRequest
         * @property {string|null} [message] EchoRequest message
         */

        /**
         * Constructs a new EchoRequest.
         * @memberof insole
         * @classdesc Represents an EchoRequest.
         * @implements IEchoRequest
         * @constructor
         * @param {insole.IEchoRequest=} [properties] Properties to set
         */
        function EchoRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * EchoRequest message.
         * @member {string} message
         * @memberof insole.EchoRequest
         * @instance
         */
        EchoRequest.prototype.message = "";

        /**
         * Creates a new EchoRequest instance using the specified properties.
         * @function create
         * @memberof insole.EchoRequest
         * @static
         * @param {insole.IEchoRequest=} [properties] Properties to set
         * @returns {insole.EchoRequest} EchoRequest instance
         */
        EchoRequest.create = function create(properties) {
            return new EchoRequest(properties);
        };

        /**
         * Encodes the specified EchoRequest message. Does not implicitly {@link insole.EchoRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.EchoRequest
         * @static
         * @param {insole.IEchoRequest} message EchoRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EchoRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.message);
            return writer;
        };

        /**
         * Encodes the specified EchoRequest message, length delimited. Does not implicitly {@link insole.EchoRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.EchoRequest
         * @static
         * @param {insole.IEchoRequest} message EchoRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EchoRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes an EchoRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.EchoRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.EchoRequest} EchoRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EchoRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.EchoRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.message = reader.string();
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
         * Decodes an EchoRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.EchoRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.EchoRequest} EchoRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EchoRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an EchoRequest message.
         * @function verify
         * @memberof insole.EchoRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        EchoRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                if (!$util.isString(message.message))
                    return "message: string expected";
            return null;
        };

        /**
         * Creates an EchoRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.EchoRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.EchoRequest} EchoRequest
         */
        EchoRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.EchoRequest)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.EchoRequest: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.EchoRequest();
            if (object.message != null)
                message.message = String(object.message);
            return message;
        };

        /**
         * Creates a plain object from an EchoRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.EchoRequest
         * @static
         * @param {insole.EchoRequest} message EchoRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        EchoRequest.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults)
                object.message = "";
            if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                object.message = message.message;
            return object;
        };

        /**
         * Converts this EchoRequest to JSON.
         * @function toJSON
         * @memberof insole.EchoRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        EchoRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for EchoRequest
         * @function getTypeUrl
         * @memberof insole.EchoRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        EchoRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.EchoRequest";
        };

        return EchoRequest;
    })();

    insole.EchoResponse = (function() {

        /**
         * Properties of an EchoResponse.
         * @memberof insole
         * @interface IEchoResponse
         * @property {string|null} [message] EchoResponse message
         */

        /**
         * Constructs a new EchoResponse.
         * @memberof insole
         * @classdesc Represents an EchoResponse.
         * @implements IEchoResponse
         * @constructor
         * @param {insole.IEchoResponse=} [properties] Properties to set
         */
        function EchoResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * EchoResponse message.
         * @member {string} message
         * @memberof insole.EchoResponse
         * @instance
         */
        EchoResponse.prototype.message = "";

        /**
         * Creates a new EchoResponse instance using the specified properties.
         * @function create
         * @memberof insole.EchoResponse
         * @static
         * @param {insole.IEchoResponse=} [properties] Properties to set
         * @returns {insole.EchoResponse} EchoResponse instance
         */
        EchoResponse.create = function create(properties) {
            return new EchoResponse(properties);
        };

        /**
         * Encodes the specified EchoResponse message. Does not implicitly {@link insole.EchoResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.EchoResponse
         * @static
         * @param {insole.IEchoResponse} message EchoResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EchoResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.message);
            return writer;
        };

        /**
         * Encodes the specified EchoResponse message, length delimited. Does not implicitly {@link insole.EchoResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.EchoResponse
         * @static
         * @param {insole.IEchoResponse} message EchoResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EchoResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes an EchoResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.EchoResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.EchoResponse} EchoResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EchoResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.EchoResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.message = reader.string();
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
         * Decodes an EchoResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.EchoResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.EchoResponse} EchoResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EchoResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an EchoResponse message.
         * @function verify
         * @memberof insole.EchoResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        EchoResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                if (!$util.isString(message.message))
                    return "message: string expected";
            return null;
        };

        /**
         * Creates an EchoResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.EchoResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.EchoResponse} EchoResponse
         */
        EchoResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.EchoResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.EchoResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.EchoResponse();
            if (object.message != null)
                message.message = String(object.message);
            return message;
        };

        /**
         * Creates a plain object from an EchoResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.EchoResponse
         * @static
         * @param {insole.EchoResponse} message EchoResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        EchoResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults)
                object.message = "";
            if (message.message != null && Object.hasOwnProperty.call(message, "message"))
                object.message = message.message;
            return object;
        };

        /**
         * Converts this EchoResponse to JSON.
         * @function toJSON
         * @memberof insole.EchoResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        EchoResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for EchoResponse
         * @function getTypeUrl
         * @memberof insole.EchoResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        EchoResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.EchoResponse";
        };

        return EchoResponse;
    })();

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

    insole.SetDeviceIdRequest = (function() {

        /**
         * Properties of a SetDeviceIdRequest.
         * @memberof insole
         * @interface ISetDeviceIdRequest
         * @property {number|null} [deviceId] SetDeviceIdRequest deviceId
         */

        /**
         * Constructs a new SetDeviceIdRequest.
         * @memberof insole
         * @classdesc Represents a SetDeviceIdRequest.
         * @implements ISetDeviceIdRequest
         * @constructor
         * @param {insole.ISetDeviceIdRequest=} [properties] Properties to set
         */
        function SetDeviceIdRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * SetDeviceIdRequest deviceId.
         * @member {number} deviceId
         * @memberof insole.SetDeviceIdRequest
         * @instance
         */
        SetDeviceIdRequest.prototype.deviceId = 0;

        /**
         * Creates a new SetDeviceIdRequest instance using the specified properties.
         * @function create
         * @memberof insole.SetDeviceIdRequest
         * @static
         * @param {insole.ISetDeviceIdRequest=} [properties] Properties to set
         * @returns {insole.SetDeviceIdRequest} SetDeviceIdRequest instance
         */
        SetDeviceIdRequest.create = function create(properties) {
            return new SetDeviceIdRequest(properties);
        };

        /**
         * Encodes the specified SetDeviceIdRequest message. Does not implicitly {@link insole.SetDeviceIdRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.SetDeviceIdRequest
         * @static
         * @param {insole.ISetDeviceIdRequest} message SetDeviceIdRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetDeviceIdRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.deviceId);
            return writer;
        };

        /**
         * Encodes the specified SetDeviceIdRequest message, length delimited. Does not implicitly {@link insole.SetDeviceIdRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.SetDeviceIdRequest
         * @static
         * @param {insole.ISetDeviceIdRequest} message SetDeviceIdRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetDeviceIdRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a SetDeviceIdRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.SetDeviceIdRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.SetDeviceIdRequest} SetDeviceIdRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetDeviceIdRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.SetDeviceIdRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.deviceId = reader.uint32();
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
         * Decodes a SetDeviceIdRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.SetDeviceIdRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.SetDeviceIdRequest} SetDeviceIdRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetDeviceIdRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SetDeviceIdRequest message.
         * @function verify
         * @memberof insole.SetDeviceIdRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SetDeviceIdRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId"))
                if (!$util.isInteger(message.deviceId))
                    return "deviceId: integer expected";
            return null;
        };

        /**
         * Creates a SetDeviceIdRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.SetDeviceIdRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.SetDeviceIdRequest} SetDeviceIdRequest
         */
        SetDeviceIdRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.SetDeviceIdRequest)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.SetDeviceIdRequest: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.SetDeviceIdRequest();
            if (object.deviceId != null)
                message.deviceId = object.deviceId >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a SetDeviceIdRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.SetDeviceIdRequest
         * @static
         * @param {insole.SetDeviceIdRequest} message SetDeviceIdRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SetDeviceIdRequest.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults)
                object.deviceId = 0;
            if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId"))
                object.deviceId = message.deviceId;
            return object;
        };

        /**
         * Converts this SetDeviceIdRequest to JSON.
         * @function toJSON
         * @memberof insole.SetDeviceIdRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SetDeviceIdRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for SetDeviceIdRequest
         * @function getTypeUrl
         * @memberof insole.SetDeviceIdRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        SetDeviceIdRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.SetDeviceIdRequest";
        };

        return SetDeviceIdRequest;
    })();

    insole.SetDeviceIdResponse = (function() {

        /**
         * Properties of a SetDeviceIdResponse.
         * @memberof insole
         * @interface ISetDeviceIdResponse
         * @property {number|null} [deviceId] SetDeviceIdResponse deviceId
         */

        /**
         * Constructs a new SetDeviceIdResponse.
         * @memberof insole
         * @classdesc Represents a SetDeviceIdResponse.
         * @implements ISetDeviceIdResponse
         * @constructor
         * @param {insole.ISetDeviceIdResponse=} [properties] Properties to set
         */
        function SetDeviceIdResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * SetDeviceIdResponse deviceId.
         * @member {number} deviceId
         * @memberof insole.SetDeviceIdResponse
         * @instance
         */
        SetDeviceIdResponse.prototype.deviceId = 0;

        /**
         * Creates a new SetDeviceIdResponse instance using the specified properties.
         * @function create
         * @memberof insole.SetDeviceIdResponse
         * @static
         * @param {insole.ISetDeviceIdResponse=} [properties] Properties to set
         * @returns {insole.SetDeviceIdResponse} SetDeviceIdResponse instance
         */
        SetDeviceIdResponse.create = function create(properties) {
            return new SetDeviceIdResponse(properties);
        };

        /**
         * Encodes the specified SetDeviceIdResponse message. Does not implicitly {@link insole.SetDeviceIdResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.SetDeviceIdResponse
         * @static
         * @param {insole.ISetDeviceIdResponse} message SetDeviceIdResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetDeviceIdResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.deviceId);
            return writer;
        };

        /**
         * Encodes the specified SetDeviceIdResponse message, length delimited. Does not implicitly {@link insole.SetDeviceIdResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.SetDeviceIdResponse
         * @static
         * @param {insole.ISetDeviceIdResponse} message SetDeviceIdResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetDeviceIdResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a SetDeviceIdResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.SetDeviceIdResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.SetDeviceIdResponse} SetDeviceIdResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetDeviceIdResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.SetDeviceIdResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.deviceId = reader.uint32();
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
         * Decodes a SetDeviceIdResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.SetDeviceIdResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.SetDeviceIdResponse} SetDeviceIdResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetDeviceIdResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SetDeviceIdResponse message.
         * @function verify
         * @memberof insole.SetDeviceIdResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SetDeviceIdResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId"))
                if (!$util.isInteger(message.deviceId))
                    return "deviceId: integer expected";
            return null;
        };

        /**
         * Creates a SetDeviceIdResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.SetDeviceIdResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.SetDeviceIdResponse} SetDeviceIdResponse
         */
        SetDeviceIdResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.SetDeviceIdResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.SetDeviceIdResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.SetDeviceIdResponse();
            if (object.deviceId != null)
                message.deviceId = object.deviceId >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a SetDeviceIdResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.SetDeviceIdResponse
         * @static
         * @param {insole.SetDeviceIdResponse} message SetDeviceIdResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SetDeviceIdResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults)
                object.deviceId = 0;
            if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId"))
                object.deviceId = message.deviceId;
            return object;
        };

        /**
         * Converts this SetDeviceIdResponse to JSON.
         * @function toJSON
         * @memberof insole.SetDeviceIdResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SetDeviceIdResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for SetDeviceIdResponse
         * @function getTypeUrl
         * @memberof insole.SetDeviceIdResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        SetDeviceIdResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.SetDeviceIdResponse";
        };

        return SetDeviceIdResponse;
    })();

    insole.SetFootRequest = (function() {

        /**
         * Properties of a SetFootRequest.
         * @memberof insole
         * @interface ISetFootRequest
         * @property {insole.Foot|null} [foot] SetFootRequest foot
         */

        /**
         * Constructs a new SetFootRequest.
         * @memberof insole
         * @classdesc Represents a SetFootRequest.
         * @implements ISetFootRequest
         * @constructor
         * @param {insole.ISetFootRequest=} [properties] Properties to set
         */
        function SetFootRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * SetFootRequest foot.
         * @member {insole.Foot} foot
         * @memberof insole.SetFootRequest
         * @instance
         */
        SetFootRequest.prototype.foot = 0;

        /**
         * Creates a new SetFootRequest instance using the specified properties.
         * @function create
         * @memberof insole.SetFootRequest
         * @static
         * @param {insole.ISetFootRequest=} [properties] Properties to set
         * @returns {insole.SetFootRequest} SetFootRequest instance
         */
        SetFootRequest.create = function create(properties) {
            return new SetFootRequest(properties);
        };

        /**
         * Encodes the specified SetFootRequest message. Does not implicitly {@link insole.SetFootRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.SetFootRequest
         * @static
         * @param {insole.ISetFootRequest} message SetFootRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetFootRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.foot);
            return writer;
        };

        /**
         * Encodes the specified SetFootRequest message, length delimited. Does not implicitly {@link insole.SetFootRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.SetFootRequest
         * @static
         * @param {insole.ISetFootRequest} message SetFootRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetFootRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a SetFootRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.SetFootRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.SetFootRequest} SetFootRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetFootRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.SetFootRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.foot = reader.int32();
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
         * Decodes a SetFootRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.SetFootRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.SetFootRequest} SetFootRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetFootRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SetFootRequest message.
         * @function verify
         * @memberof insole.SetFootRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SetFootRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
                switch (message.foot) {
                default:
                    return "foot: enum value expected";
                case 0:
                case 1:
                case 2:
                    break;
                }
            return null;
        };

        /**
         * Creates a SetFootRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.SetFootRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.SetFootRequest} SetFootRequest
         */
        SetFootRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.SetFootRequest)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.SetFootRequest: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.SetFootRequest();
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
            return message;
        };

        /**
         * Creates a plain object from a SetFootRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.SetFootRequest
         * @static
         * @param {insole.SetFootRequest} message SetFootRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SetFootRequest.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults)
                object.foot = options.enums === String ? "FOOT_UNSPECIFIED" : 0;
            if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
                object.foot = options.enums === String ? $root.insole.Foot[message.foot] === undefined ? message.foot : $root.insole.Foot[message.foot] : message.foot;
            return object;
        };

        /**
         * Converts this SetFootRequest to JSON.
         * @function toJSON
         * @memberof insole.SetFootRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SetFootRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for SetFootRequest
         * @function getTypeUrl
         * @memberof insole.SetFootRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        SetFootRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.SetFootRequest";
        };

        return SetFootRequest;
    })();

    insole.SetFootResponse = (function() {

        /**
         * Properties of a SetFootResponse.
         * @memberof insole
         * @interface ISetFootResponse
         * @property {insole.Foot|null} [foot] SetFootResponse foot
         */

        /**
         * Constructs a new SetFootResponse.
         * @memberof insole
         * @classdesc Represents a SetFootResponse.
         * @implements ISetFootResponse
         * @constructor
         * @param {insole.ISetFootResponse=} [properties] Properties to set
         */
        function SetFootResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * SetFootResponse foot.
         * @member {insole.Foot} foot
         * @memberof insole.SetFootResponse
         * @instance
         */
        SetFootResponse.prototype.foot = 0;

        /**
         * Creates a new SetFootResponse instance using the specified properties.
         * @function create
         * @memberof insole.SetFootResponse
         * @static
         * @param {insole.ISetFootResponse=} [properties] Properties to set
         * @returns {insole.SetFootResponse} SetFootResponse instance
         */
        SetFootResponse.create = function create(properties) {
            return new SetFootResponse(properties);
        };

        /**
         * Encodes the specified SetFootResponse message. Does not implicitly {@link insole.SetFootResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.SetFootResponse
         * @static
         * @param {insole.ISetFootResponse} message SetFootResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetFootResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
                writer.uint32(/* id 1, wireType 0 =*/8).int32(message.foot);
            return writer;
        };

        /**
         * Encodes the specified SetFootResponse message, length delimited. Does not implicitly {@link insole.SetFootResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.SetFootResponse
         * @static
         * @param {insole.ISetFootResponse} message SetFootResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetFootResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a SetFootResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.SetFootResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.SetFootResponse} SetFootResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetFootResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.SetFootResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.foot = reader.int32();
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
         * Decodes a SetFootResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.SetFootResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.SetFootResponse} SetFootResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetFootResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SetFootResponse message.
         * @function verify
         * @memberof insole.SetFootResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SetFootResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
                switch (message.foot) {
                default:
                    return "foot: enum value expected";
                case 0:
                case 1:
                case 2:
                    break;
                }
            return null;
        };

        /**
         * Creates a SetFootResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.SetFootResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.SetFootResponse} SetFootResponse
         */
        SetFootResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.SetFootResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.SetFootResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.SetFootResponse();
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
            return message;
        };

        /**
         * Creates a plain object from a SetFootResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.SetFootResponse
         * @static
         * @param {insole.SetFootResponse} message SetFootResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SetFootResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults)
                object.foot = options.enums === String ? "FOOT_UNSPECIFIED" : 0;
            if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
                object.foot = options.enums === String ? $root.insole.Foot[message.foot] === undefined ? message.foot : $root.insole.Foot[message.foot] : message.foot;
            return object;
        };

        /**
         * Converts this SetFootResponse to JSON.
         * @function toJSON
         * @memberof insole.SetFootResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SetFootResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for SetFootResponse
         * @function getTypeUrl
         * @memberof insole.SetFootResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        SetFootResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.SetFootResponse";
        };

        return SetFootResponse;
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
         * @property {number|null} [logTimeUnitSec] GetConfigResponse logTimeUnitSec
         * @property {number|null} [logDistanceUnitCode] GetConfigResponse logDistanceUnitCode
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
         * GetConfigResponse logTimeUnitSec.
         * @member {number} logTimeUnitSec
         * @memberof insole.GetConfigResponse
         * @instance
         */
        GetConfigResponse.prototype.logTimeUnitSec = 0;

        /**
         * GetConfigResponse logDistanceUnitCode.
         * @member {number} logDistanceUnitCode
         * @memberof insole.GetConfigResponse
         * @instance
         */
        GetConfigResponse.prototype.logDistanceUnitCode = 0;

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
            if (message.logTimeUnitSec != null && Object.hasOwnProperty.call(message, "logTimeUnitSec"))
                writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.logTimeUnitSec);
            if (message.logDistanceUnitCode != null && Object.hasOwnProperty.call(message, "logDistanceUnitCode"))
                writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.logDistanceUnitCode);
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
                case 4: {
                        message.logTimeUnitSec = reader.uint32();
                        break;
                    }
                case 5: {
                        message.logDistanceUnitCode = reader.uint32();
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
            if (message.logTimeUnitSec != null && Object.hasOwnProperty.call(message, "logTimeUnitSec"))
                if (!$util.isInteger(message.logTimeUnitSec))
                    return "logTimeUnitSec: integer expected";
            if (message.logDistanceUnitCode != null && Object.hasOwnProperty.call(message, "logDistanceUnitCode"))
                if (!$util.isInteger(message.logDistanceUnitCode))
                    return "logDistanceUnitCode: integer expected";
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
            if (object.logTimeUnitSec != null)
                message.logTimeUnitSec = object.logTimeUnitSec >>> 0;
            if (object.logDistanceUnitCode != null)
                message.logDistanceUnitCode = object.logDistanceUnitCode >>> 0;
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
                object.logTimeUnitSec = 0;
                object.logDistanceUnitCode = 0;
            }
            if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId"))
                object.deviceId = message.deviceId;
            if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
                object.foot = options.enums === String ? $root.insole.Foot[message.foot] === undefined ? message.foot : $root.insole.Foot[message.foot] : message.foot;
            if (message.firmwareVersion != null && Object.hasOwnProperty.call(message, "firmwareVersion"))
                object.firmwareVersion = message.firmwareVersion;
            if (message.logTimeUnitSec != null && Object.hasOwnProperty.call(message, "logTimeUnitSec"))
                object.logTimeUnitSec = message.logTimeUnitSec;
            if (message.logDistanceUnitCode != null && Object.hasOwnProperty.call(message, "logDistanceUnitCode"))
                object.logDistanceUnitCode = message.logDistanceUnitCode;
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

    insole.SetLogUnitRequest = (function() {

        /**
         * Properties of a SetLogUnitRequest.
         * @memberof insole
         * @interface ISetLogUnitRequest
         * @property {number|null} [timeUnitSec] SetLogUnitRequest timeUnitSec
         * @property {number|null} [distanceUnitCode] SetLogUnitRequest distanceUnitCode
         */

        /**
         * Constructs a new SetLogUnitRequest.
         * @memberof insole
         * @classdesc Represents a SetLogUnitRequest.
         * @implements ISetLogUnitRequest
         * @constructor
         * @param {insole.ISetLogUnitRequest=} [properties] Properties to set
         */
        function SetLogUnitRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * SetLogUnitRequest timeUnitSec.
         * @member {number} timeUnitSec
         * @memberof insole.SetLogUnitRequest
         * @instance
         */
        SetLogUnitRequest.prototype.timeUnitSec = 0;

        /**
         * SetLogUnitRequest distanceUnitCode.
         * @member {number} distanceUnitCode
         * @memberof insole.SetLogUnitRequest
         * @instance
         */
        SetLogUnitRequest.prototype.distanceUnitCode = 0;

        /**
         * Creates a new SetLogUnitRequest instance using the specified properties.
         * @function create
         * @memberof insole.SetLogUnitRequest
         * @static
         * @param {insole.ISetLogUnitRequest=} [properties] Properties to set
         * @returns {insole.SetLogUnitRequest} SetLogUnitRequest instance
         */
        SetLogUnitRequest.create = function create(properties) {
            return new SetLogUnitRequest(properties);
        };

        /**
         * Encodes the specified SetLogUnitRequest message. Does not implicitly {@link insole.SetLogUnitRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.SetLogUnitRequest
         * @static
         * @param {insole.ISetLogUnitRequest} message SetLogUnitRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetLogUnitRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.timeUnitSec != null && Object.hasOwnProperty.call(message, "timeUnitSec"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.timeUnitSec);
            if (message.distanceUnitCode != null && Object.hasOwnProperty.call(message, "distanceUnitCode"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.distanceUnitCode);
            return writer;
        };

        /**
         * Encodes the specified SetLogUnitRequest message, length delimited. Does not implicitly {@link insole.SetLogUnitRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.SetLogUnitRequest
         * @static
         * @param {insole.ISetLogUnitRequest} message SetLogUnitRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetLogUnitRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a SetLogUnitRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.SetLogUnitRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.SetLogUnitRequest} SetLogUnitRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetLogUnitRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.SetLogUnitRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.timeUnitSec = reader.uint32();
                        break;
                    }
                case 2: {
                        message.distanceUnitCode = reader.uint32();
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
         * Decodes a SetLogUnitRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.SetLogUnitRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.SetLogUnitRequest} SetLogUnitRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetLogUnitRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SetLogUnitRequest message.
         * @function verify
         * @memberof insole.SetLogUnitRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SetLogUnitRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.timeUnitSec != null && Object.hasOwnProperty.call(message, "timeUnitSec"))
                if (!$util.isInteger(message.timeUnitSec))
                    return "timeUnitSec: integer expected";
            if (message.distanceUnitCode != null && Object.hasOwnProperty.call(message, "distanceUnitCode"))
                if (!$util.isInteger(message.distanceUnitCode))
                    return "distanceUnitCode: integer expected";
            return null;
        };

        /**
         * Creates a SetLogUnitRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.SetLogUnitRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.SetLogUnitRequest} SetLogUnitRequest
         */
        SetLogUnitRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.SetLogUnitRequest)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.SetLogUnitRequest: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.SetLogUnitRequest();
            if (object.timeUnitSec != null)
                message.timeUnitSec = object.timeUnitSec >>> 0;
            if (object.distanceUnitCode != null)
                message.distanceUnitCode = object.distanceUnitCode >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a SetLogUnitRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.SetLogUnitRequest
         * @static
         * @param {insole.SetLogUnitRequest} message SetLogUnitRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SetLogUnitRequest.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.timeUnitSec = 0;
                object.distanceUnitCode = 0;
            }
            if (message.timeUnitSec != null && Object.hasOwnProperty.call(message, "timeUnitSec"))
                object.timeUnitSec = message.timeUnitSec;
            if (message.distanceUnitCode != null && Object.hasOwnProperty.call(message, "distanceUnitCode"))
                object.distanceUnitCode = message.distanceUnitCode;
            return object;
        };

        /**
         * Converts this SetLogUnitRequest to JSON.
         * @function toJSON
         * @memberof insole.SetLogUnitRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SetLogUnitRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for SetLogUnitRequest
         * @function getTypeUrl
         * @memberof insole.SetLogUnitRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        SetLogUnitRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.SetLogUnitRequest";
        };

        return SetLogUnitRequest;
    })();

    insole.SetLogUnitResponse = (function() {

        /**
         * Properties of a SetLogUnitResponse.
         * @memberof insole
         * @interface ISetLogUnitResponse
         * @property {boolean|null} [ok] SetLogUnitResponse ok
         * @property {number|null} [timeUnitSec] SetLogUnitResponse timeUnitSec
         * @property {number|null} [distanceUnitCode] SetLogUnitResponse distanceUnitCode
         */

        /**
         * Constructs a new SetLogUnitResponse.
         * @memberof insole
         * @classdesc Represents a SetLogUnitResponse.
         * @implements ISetLogUnitResponse
         * @constructor
         * @param {insole.ISetLogUnitResponse=} [properties] Properties to set
         */
        function SetLogUnitResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * SetLogUnitResponse ok.
         * @member {boolean} ok
         * @memberof insole.SetLogUnitResponse
         * @instance
         */
        SetLogUnitResponse.prototype.ok = false;

        /**
         * SetLogUnitResponse timeUnitSec.
         * @member {number} timeUnitSec
         * @memberof insole.SetLogUnitResponse
         * @instance
         */
        SetLogUnitResponse.prototype.timeUnitSec = 0;

        /**
         * SetLogUnitResponse distanceUnitCode.
         * @member {number} distanceUnitCode
         * @memberof insole.SetLogUnitResponse
         * @instance
         */
        SetLogUnitResponse.prototype.distanceUnitCode = 0;

        /**
         * Creates a new SetLogUnitResponse instance using the specified properties.
         * @function create
         * @memberof insole.SetLogUnitResponse
         * @static
         * @param {insole.ISetLogUnitResponse=} [properties] Properties to set
         * @returns {insole.SetLogUnitResponse} SetLogUnitResponse instance
         */
        SetLogUnitResponse.create = function create(properties) {
            return new SetLogUnitResponse(properties);
        };

        /**
         * Encodes the specified SetLogUnitResponse message. Does not implicitly {@link insole.SetLogUnitResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.SetLogUnitResponse
         * @static
         * @param {insole.ISetLogUnitResponse} message SetLogUnitResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetLogUnitResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.ok);
            if (message.timeUnitSec != null && Object.hasOwnProperty.call(message, "timeUnitSec"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.timeUnitSec);
            if (message.distanceUnitCode != null && Object.hasOwnProperty.call(message, "distanceUnitCode"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.distanceUnitCode);
            return writer;
        };

        /**
         * Encodes the specified SetLogUnitResponse message, length delimited. Does not implicitly {@link insole.SetLogUnitResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.SetLogUnitResponse
         * @static
         * @param {insole.ISetLogUnitResponse} message SetLogUnitResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        SetLogUnitResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a SetLogUnitResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.SetLogUnitResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.SetLogUnitResponse} SetLogUnitResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetLogUnitResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.SetLogUnitResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.ok = reader.bool();
                        break;
                    }
                case 2: {
                        message.timeUnitSec = reader.uint32();
                        break;
                    }
                case 3: {
                        message.distanceUnitCode = reader.uint32();
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
         * Decodes a SetLogUnitResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.SetLogUnitResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.SetLogUnitResponse} SetLogUnitResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        SetLogUnitResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a SetLogUnitResponse message.
         * @function verify
         * @memberof insole.SetLogUnitResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        SetLogUnitResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                if (typeof message.ok !== "boolean")
                    return "ok: boolean expected";
            if (message.timeUnitSec != null && Object.hasOwnProperty.call(message, "timeUnitSec"))
                if (!$util.isInteger(message.timeUnitSec))
                    return "timeUnitSec: integer expected";
            if (message.distanceUnitCode != null && Object.hasOwnProperty.call(message, "distanceUnitCode"))
                if (!$util.isInteger(message.distanceUnitCode))
                    return "distanceUnitCode: integer expected";
            return null;
        };

        /**
         * Creates a SetLogUnitResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.SetLogUnitResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.SetLogUnitResponse} SetLogUnitResponse
         */
        SetLogUnitResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.SetLogUnitResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.SetLogUnitResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.SetLogUnitResponse();
            if (object.ok != null)
                message.ok = Boolean(object.ok);
            if (object.timeUnitSec != null)
                message.timeUnitSec = object.timeUnitSec >>> 0;
            if (object.distanceUnitCode != null)
                message.distanceUnitCode = object.distanceUnitCode >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a SetLogUnitResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.SetLogUnitResponse
         * @static
         * @param {insole.SetLogUnitResponse} message SetLogUnitResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        SetLogUnitResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.ok = false;
                object.timeUnitSec = 0;
                object.distanceUnitCode = 0;
            }
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                object.ok = message.ok;
            if (message.timeUnitSec != null && Object.hasOwnProperty.call(message, "timeUnitSec"))
                object.timeUnitSec = message.timeUnitSec;
            if (message.distanceUnitCode != null && Object.hasOwnProperty.call(message, "distanceUnitCode"))
                object.distanceUnitCode = message.distanceUnitCode;
            return object;
        };

        /**
         * Converts this SetLogUnitResponse to JSON.
         * @function toJSON
         * @memberof insole.SetLogUnitResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        SetLogUnitResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for SetLogUnitResponse
         * @function getTypeUrl
         * @memberof insole.SetLogUnitResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        SetLogUnitResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.SetLogUnitResponse";
        };

        return SetLogUnitResponse;
    })();

    insole.OtaBeginRequest = (function() {

        /**
         * Properties of an OtaBeginRequest.
         * @memberof insole
         * @interface IOtaBeginRequest
         * @property {number|null} [totalSize] OtaBeginRequest totalSize
         */

        /**
         * Constructs a new OtaBeginRequest.
         * @memberof insole
         * @classdesc Represents an OtaBeginRequest.
         * @implements IOtaBeginRequest
         * @constructor
         * @param {insole.IOtaBeginRequest=} [properties] Properties to set
         */
        function OtaBeginRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * OtaBeginRequest totalSize.
         * @member {number} totalSize
         * @memberof insole.OtaBeginRequest
         * @instance
         */
        OtaBeginRequest.prototype.totalSize = 0;

        /**
         * Creates a new OtaBeginRequest instance using the specified properties.
         * @function create
         * @memberof insole.OtaBeginRequest
         * @static
         * @param {insole.IOtaBeginRequest=} [properties] Properties to set
         * @returns {insole.OtaBeginRequest} OtaBeginRequest instance
         */
        OtaBeginRequest.create = function create(properties) {
            return new OtaBeginRequest(properties);
        };

        /**
         * Encodes the specified OtaBeginRequest message. Does not implicitly {@link insole.OtaBeginRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.OtaBeginRequest
         * @static
         * @param {insole.IOtaBeginRequest} message OtaBeginRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaBeginRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.totalSize != null && Object.hasOwnProperty.call(message, "totalSize"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.totalSize);
            return writer;
        };

        /**
         * Encodes the specified OtaBeginRequest message, length delimited. Does not implicitly {@link insole.OtaBeginRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.OtaBeginRequest
         * @static
         * @param {insole.IOtaBeginRequest} message OtaBeginRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaBeginRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes an OtaBeginRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.OtaBeginRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.OtaBeginRequest} OtaBeginRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaBeginRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.OtaBeginRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.totalSize = reader.uint32();
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
         * Decodes an OtaBeginRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.OtaBeginRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.OtaBeginRequest} OtaBeginRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaBeginRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an OtaBeginRequest message.
         * @function verify
         * @memberof insole.OtaBeginRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        OtaBeginRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.totalSize != null && Object.hasOwnProperty.call(message, "totalSize"))
                if (!$util.isInteger(message.totalSize))
                    return "totalSize: integer expected";
            return null;
        };

        /**
         * Creates an OtaBeginRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.OtaBeginRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.OtaBeginRequest} OtaBeginRequest
         */
        OtaBeginRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.OtaBeginRequest)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.OtaBeginRequest: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.OtaBeginRequest();
            if (object.totalSize != null)
                message.totalSize = object.totalSize >>> 0;
            return message;
        };

        /**
         * Creates a plain object from an OtaBeginRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.OtaBeginRequest
         * @static
         * @param {insole.OtaBeginRequest} message OtaBeginRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        OtaBeginRequest.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults)
                object.totalSize = 0;
            if (message.totalSize != null && Object.hasOwnProperty.call(message, "totalSize"))
                object.totalSize = message.totalSize;
            return object;
        };

        /**
         * Converts this OtaBeginRequest to JSON.
         * @function toJSON
         * @memberof insole.OtaBeginRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        OtaBeginRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for OtaBeginRequest
         * @function getTypeUrl
         * @memberof insole.OtaBeginRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        OtaBeginRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.OtaBeginRequest";
        };

        return OtaBeginRequest;
    })();

    insole.OtaBeginResponse = (function() {

        /**
         * Properties of an OtaBeginResponse.
         * @memberof insole
         * @interface IOtaBeginResponse
         * @property {boolean|null} [ok] OtaBeginResponse ok
         * @property {number|null} [maxChunk] OtaBeginResponse maxChunk
         */

        /**
         * Constructs a new OtaBeginResponse.
         * @memberof insole
         * @classdesc Represents an OtaBeginResponse.
         * @implements IOtaBeginResponse
         * @constructor
         * @param {insole.IOtaBeginResponse=} [properties] Properties to set
         */
        function OtaBeginResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * OtaBeginResponse ok.
         * @member {boolean} ok
         * @memberof insole.OtaBeginResponse
         * @instance
         */
        OtaBeginResponse.prototype.ok = false;

        /**
         * OtaBeginResponse maxChunk.
         * @member {number} maxChunk
         * @memberof insole.OtaBeginResponse
         * @instance
         */
        OtaBeginResponse.prototype.maxChunk = 0;

        /**
         * Creates a new OtaBeginResponse instance using the specified properties.
         * @function create
         * @memberof insole.OtaBeginResponse
         * @static
         * @param {insole.IOtaBeginResponse=} [properties] Properties to set
         * @returns {insole.OtaBeginResponse} OtaBeginResponse instance
         */
        OtaBeginResponse.create = function create(properties) {
            return new OtaBeginResponse(properties);
        };

        /**
         * Encodes the specified OtaBeginResponse message. Does not implicitly {@link insole.OtaBeginResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.OtaBeginResponse
         * @static
         * @param {insole.IOtaBeginResponse} message OtaBeginResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaBeginResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.ok);
            if (message.maxChunk != null && Object.hasOwnProperty.call(message, "maxChunk"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.maxChunk);
            return writer;
        };

        /**
         * Encodes the specified OtaBeginResponse message, length delimited. Does not implicitly {@link insole.OtaBeginResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.OtaBeginResponse
         * @static
         * @param {insole.IOtaBeginResponse} message OtaBeginResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaBeginResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes an OtaBeginResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.OtaBeginResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.OtaBeginResponse} OtaBeginResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaBeginResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.OtaBeginResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.ok = reader.bool();
                        break;
                    }
                case 2: {
                        message.maxChunk = reader.uint32();
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
         * Decodes an OtaBeginResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.OtaBeginResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.OtaBeginResponse} OtaBeginResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaBeginResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an OtaBeginResponse message.
         * @function verify
         * @memberof insole.OtaBeginResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        OtaBeginResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                if (typeof message.ok !== "boolean")
                    return "ok: boolean expected";
            if (message.maxChunk != null && Object.hasOwnProperty.call(message, "maxChunk"))
                if (!$util.isInteger(message.maxChunk))
                    return "maxChunk: integer expected";
            return null;
        };

        /**
         * Creates an OtaBeginResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.OtaBeginResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.OtaBeginResponse} OtaBeginResponse
         */
        OtaBeginResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.OtaBeginResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.OtaBeginResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.OtaBeginResponse();
            if (object.ok != null)
                message.ok = Boolean(object.ok);
            if (object.maxChunk != null)
                message.maxChunk = object.maxChunk >>> 0;
            return message;
        };

        /**
         * Creates a plain object from an OtaBeginResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.OtaBeginResponse
         * @static
         * @param {insole.OtaBeginResponse} message OtaBeginResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        OtaBeginResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.ok = false;
                object.maxChunk = 0;
            }
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                object.ok = message.ok;
            if (message.maxChunk != null && Object.hasOwnProperty.call(message, "maxChunk"))
                object.maxChunk = message.maxChunk;
            return object;
        };

        /**
         * Converts this OtaBeginResponse to JSON.
         * @function toJSON
         * @memberof insole.OtaBeginResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        OtaBeginResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for OtaBeginResponse
         * @function getTypeUrl
         * @memberof insole.OtaBeginResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        OtaBeginResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.OtaBeginResponse";
        };

        return OtaBeginResponse;
    })();

    insole.OtaWriteRequest = (function() {

        /**
         * Properties of an OtaWriteRequest.
         * @memberof insole
         * @interface IOtaWriteRequest
         * @property {number|null} [offset] OtaWriteRequest offset
         * @property {Uint8Array|null} [data] OtaWriteRequest data
         */

        /**
         * Constructs a new OtaWriteRequest.
         * @memberof insole
         * @classdesc Represents an OtaWriteRequest.
         * @implements IOtaWriteRequest
         * @constructor
         * @param {insole.IOtaWriteRequest=} [properties] Properties to set
         */
        function OtaWriteRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * OtaWriteRequest offset.
         * @member {number} offset
         * @memberof insole.OtaWriteRequest
         * @instance
         */
        OtaWriteRequest.prototype.offset = 0;

        /**
         * OtaWriteRequest data.
         * @member {Uint8Array} data
         * @memberof insole.OtaWriteRequest
         * @instance
         */
        OtaWriteRequest.prototype.data = $util.newBuffer([]);

        /**
         * Creates a new OtaWriteRequest instance using the specified properties.
         * @function create
         * @memberof insole.OtaWriteRequest
         * @static
         * @param {insole.IOtaWriteRequest=} [properties] Properties to set
         * @returns {insole.OtaWriteRequest} OtaWriteRequest instance
         */
        OtaWriteRequest.create = function create(properties) {
            return new OtaWriteRequest(properties);
        };

        /**
         * Encodes the specified OtaWriteRequest message. Does not implicitly {@link insole.OtaWriteRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.OtaWriteRequest
         * @static
         * @param {insole.IOtaWriteRequest} message OtaWriteRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaWriteRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.offset != null && Object.hasOwnProperty.call(message, "offset"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.offset);
            if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                writer.uint32(/* id 2, wireType 2 =*/18).bytes(message.data);
            return writer;
        };

        /**
         * Encodes the specified OtaWriteRequest message, length delimited. Does not implicitly {@link insole.OtaWriteRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.OtaWriteRequest
         * @static
         * @param {insole.IOtaWriteRequest} message OtaWriteRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaWriteRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes an OtaWriteRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.OtaWriteRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.OtaWriteRequest} OtaWriteRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaWriteRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.OtaWriteRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.offset = reader.uint32();
                        break;
                    }
                case 2: {
                        message.data = reader.bytes();
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
         * Decodes an OtaWriteRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.OtaWriteRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.OtaWriteRequest} OtaWriteRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaWriteRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an OtaWriteRequest message.
         * @function verify
         * @memberof insole.OtaWriteRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        OtaWriteRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.offset != null && Object.hasOwnProperty.call(message, "offset"))
                if (!$util.isInteger(message.offset))
                    return "offset: integer expected";
            if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                if (!(message.data && typeof message.data.length === "number" || $util.isString(message.data)))
                    return "data: buffer expected";
            return null;
        };

        /**
         * Creates an OtaWriteRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.OtaWriteRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.OtaWriteRequest} OtaWriteRequest
         */
        OtaWriteRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.OtaWriteRequest)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.OtaWriteRequest: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.OtaWriteRequest();
            if (object.offset != null)
                message.offset = object.offset >>> 0;
            if (object.data != null)
                if (typeof object.data === "string")
                    $util.base64.decode(object.data, message.data = $util.newBuffer($util.base64.length(object.data)), 0);
                else if (object.data.length >= 0)
                    message.data = object.data;
            return message;
        };

        /**
         * Creates a plain object from an OtaWriteRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.OtaWriteRequest
         * @static
         * @param {insole.OtaWriteRequest} message OtaWriteRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        OtaWriteRequest.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.offset = 0;
                if (options.bytes === String)
                    object.data = "";
                else {
                    object.data = [];
                    if (options.bytes !== Array)
                        object.data = $util.newBuffer(object.data);
                }
            }
            if (message.offset != null && Object.hasOwnProperty.call(message, "offset"))
                object.offset = message.offset;
            if (message.data != null && Object.hasOwnProperty.call(message, "data"))
                object.data = options.bytes === String ? $util.base64.encode(message.data, 0, message.data.length) : options.bytes === Array ? Array.prototype.slice.call(message.data) : message.data;
            return object;
        };

        /**
         * Converts this OtaWriteRequest to JSON.
         * @function toJSON
         * @memberof insole.OtaWriteRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        OtaWriteRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for OtaWriteRequest
         * @function getTypeUrl
         * @memberof insole.OtaWriteRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        OtaWriteRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.OtaWriteRequest";
        };

        return OtaWriteRequest;
    })();

    insole.OtaWriteResponse = (function() {

        /**
         * Properties of an OtaWriteResponse.
         * @memberof insole
         * @interface IOtaWriteResponse
         * @property {boolean|null} [ok] OtaWriteResponse ok
         * @property {number|null} [received] OtaWriteResponse received
         */

        /**
         * Constructs a new OtaWriteResponse.
         * @memberof insole
         * @classdesc Represents an OtaWriteResponse.
         * @implements IOtaWriteResponse
         * @constructor
         * @param {insole.IOtaWriteResponse=} [properties] Properties to set
         */
        function OtaWriteResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * OtaWriteResponse ok.
         * @member {boolean} ok
         * @memberof insole.OtaWriteResponse
         * @instance
         */
        OtaWriteResponse.prototype.ok = false;

        /**
         * OtaWriteResponse received.
         * @member {number} received
         * @memberof insole.OtaWriteResponse
         * @instance
         */
        OtaWriteResponse.prototype.received = 0;

        /**
         * Creates a new OtaWriteResponse instance using the specified properties.
         * @function create
         * @memberof insole.OtaWriteResponse
         * @static
         * @param {insole.IOtaWriteResponse=} [properties] Properties to set
         * @returns {insole.OtaWriteResponse} OtaWriteResponse instance
         */
        OtaWriteResponse.create = function create(properties) {
            return new OtaWriteResponse(properties);
        };

        /**
         * Encodes the specified OtaWriteResponse message. Does not implicitly {@link insole.OtaWriteResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.OtaWriteResponse
         * @static
         * @param {insole.IOtaWriteResponse} message OtaWriteResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaWriteResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.ok);
            if (message.received != null && Object.hasOwnProperty.call(message, "received"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.received);
            return writer;
        };

        /**
         * Encodes the specified OtaWriteResponse message, length delimited. Does not implicitly {@link insole.OtaWriteResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.OtaWriteResponse
         * @static
         * @param {insole.IOtaWriteResponse} message OtaWriteResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaWriteResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes an OtaWriteResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.OtaWriteResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.OtaWriteResponse} OtaWriteResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaWriteResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.OtaWriteResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.ok = reader.bool();
                        break;
                    }
                case 2: {
                        message.received = reader.uint32();
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
         * Decodes an OtaWriteResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.OtaWriteResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.OtaWriteResponse} OtaWriteResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaWriteResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an OtaWriteResponse message.
         * @function verify
         * @memberof insole.OtaWriteResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        OtaWriteResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                if (typeof message.ok !== "boolean")
                    return "ok: boolean expected";
            if (message.received != null && Object.hasOwnProperty.call(message, "received"))
                if (!$util.isInteger(message.received))
                    return "received: integer expected";
            return null;
        };

        /**
         * Creates an OtaWriteResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.OtaWriteResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.OtaWriteResponse} OtaWriteResponse
         */
        OtaWriteResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.OtaWriteResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.OtaWriteResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.OtaWriteResponse();
            if (object.ok != null)
                message.ok = Boolean(object.ok);
            if (object.received != null)
                message.received = object.received >>> 0;
            return message;
        };

        /**
         * Creates a plain object from an OtaWriteResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.OtaWriteResponse
         * @static
         * @param {insole.OtaWriteResponse} message OtaWriteResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        OtaWriteResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.ok = false;
                object.received = 0;
            }
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                object.ok = message.ok;
            if (message.received != null && Object.hasOwnProperty.call(message, "received"))
                object.received = message.received;
            return object;
        };

        /**
         * Converts this OtaWriteResponse to JSON.
         * @function toJSON
         * @memberof insole.OtaWriteResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        OtaWriteResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for OtaWriteResponse
         * @function getTypeUrl
         * @memberof insole.OtaWriteResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        OtaWriteResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.OtaWriteResponse";
        };

        return OtaWriteResponse;
    })();

    insole.OtaApplyRequest = (function() {

        /**
         * Properties of an OtaApplyRequest.
         * @memberof insole
         * @interface IOtaApplyRequest
         */

        /**
         * Constructs a new OtaApplyRequest.
         * @memberof insole
         * @classdesc Represents an OtaApplyRequest.
         * @implements IOtaApplyRequest
         * @constructor
         * @param {insole.IOtaApplyRequest=} [properties] Properties to set
         */
        function OtaApplyRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new OtaApplyRequest instance using the specified properties.
         * @function create
         * @memberof insole.OtaApplyRequest
         * @static
         * @param {insole.IOtaApplyRequest=} [properties] Properties to set
         * @returns {insole.OtaApplyRequest} OtaApplyRequest instance
         */
        OtaApplyRequest.create = function create(properties) {
            return new OtaApplyRequest(properties);
        };

        /**
         * Encodes the specified OtaApplyRequest message. Does not implicitly {@link insole.OtaApplyRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.OtaApplyRequest
         * @static
         * @param {insole.IOtaApplyRequest} message OtaApplyRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaApplyRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            return writer;
        };

        /**
         * Encodes the specified OtaApplyRequest message, length delimited. Does not implicitly {@link insole.OtaApplyRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.OtaApplyRequest
         * @static
         * @param {insole.IOtaApplyRequest} message OtaApplyRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaApplyRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes an OtaApplyRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.OtaApplyRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.OtaApplyRequest} OtaApplyRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaApplyRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.OtaApplyRequest();
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
         * Decodes an OtaApplyRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.OtaApplyRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.OtaApplyRequest} OtaApplyRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaApplyRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an OtaApplyRequest message.
         * @function verify
         * @memberof insole.OtaApplyRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        OtaApplyRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            return null;
        };

        /**
         * Creates an OtaApplyRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.OtaApplyRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.OtaApplyRequest} OtaApplyRequest
         */
        OtaApplyRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.OtaApplyRequest)
                return object;
            return new $root.insole.OtaApplyRequest();
        };

        /**
         * Creates a plain object from an OtaApplyRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.OtaApplyRequest
         * @static
         * @param {insole.OtaApplyRequest} message OtaApplyRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        OtaApplyRequest.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this OtaApplyRequest to JSON.
         * @function toJSON
         * @memberof insole.OtaApplyRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        OtaApplyRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for OtaApplyRequest
         * @function getTypeUrl
         * @memberof insole.OtaApplyRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        OtaApplyRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.OtaApplyRequest";
        };

        return OtaApplyRequest;
    })();

    insole.OtaApplyResponse = (function() {

        /**
         * Properties of an OtaApplyResponse.
         * @memberof insole
         * @interface IOtaApplyResponse
         * @property {boolean|null} [ok] OtaApplyResponse ok
         */

        /**
         * Constructs a new OtaApplyResponse.
         * @memberof insole
         * @classdesc Represents an OtaApplyResponse.
         * @implements IOtaApplyResponse
         * @constructor
         * @param {insole.IOtaApplyResponse=} [properties] Properties to set
         */
        function OtaApplyResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * OtaApplyResponse ok.
         * @member {boolean} ok
         * @memberof insole.OtaApplyResponse
         * @instance
         */
        OtaApplyResponse.prototype.ok = false;

        /**
         * Creates a new OtaApplyResponse instance using the specified properties.
         * @function create
         * @memberof insole.OtaApplyResponse
         * @static
         * @param {insole.IOtaApplyResponse=} [properties] Properties to set
         * @returns {insole.OtaApplyResponse} OtaApplyResponse instance
         */
        OtaApplyResponse.create = function create(properties) {
            return new OtaApplyResponse(properties);
        };

        /**
         * Encodes the specified OtaApplyResponse message. Does not implicitly {@link insole.OtaApplyResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.OtaApplyResponse
         * @static
         * @param {insole.IOtaApplyResponse} message OtaApplyResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaApplyResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.ok);
            return writer;
        };

        /**
         * Encodes the specified OtaApplyResponse message, length delimited. Does not implicitly {@link insole.OtaApplyResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.OtaApplyResponse
         * @static
         * @param {insole.IOtaApplyResponse} message OtaApplyResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        OtaApplyResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes an OtaApplyResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.OtaApplyResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.OtaApplyResponse} OtaApplyResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaApplyResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.OtaApplyResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.ok = reader.bool();
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
         * Decodes an OtaApplyResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.OtaApplyResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.OtaApplyResponse} OtaApplyResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        OtaApplyResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an OtaApplyResponse message.
         * @function verify
         * @memberof insole.OtaApplyResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        OtaApplyResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                if (typeof message.ok !== "boolean")
                    return "ok: boolean expected";
            return null;
        };

        /**
         * Creates an OtaApplyResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.OtaApplyResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.OtaApplyResponse} OtaApplyResponse
         */
        OtaApplyResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.OtaApplyResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.OtaApplyResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.OtaApplyResponse();
            if (object.ok != null)
                message.ok = Boolean(object.ok);
            return message;
        };

        /**
         * Creates a plain object from an OtaApplyResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.OtaApplyResponse
         * @static
         * @param {insole.OtaApplyResponse} message OtaApplyResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        OtaApplyResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults)
                object.ok = false;
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                object.ok = message.ok;
            return object;
        };

        /**
         * Converts this OtaApplyResponse to JSON.
         * @function toJSON
         * @memberof insole.OtaApplyResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        OtaApplyResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for OtaApplyResponse
         * @function getTypeUrl
         * @memberof insole.OtaApplyResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        OtaApplyResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.OtaApplyResponse";
        };

        return OtaApplyResponse;
    })();

    insole.StartMeasurementRequest = (function() {

        /**
         * Properties of a StartMeasurementRequest.
         * @memberof insole
         * @interface IStartMeasurementRequest
         * @property {number|null} [activityId] StartMeasurementRequest activityId
         */

        /**
         * Constructs a new StartMeasurementRequest.
         * @memberof insole
         * @classdesc Represents a StartMeasurementRequest.
         * @implements IStartMeasurementRequest
         * @constructor
         * @param {insole.IStartMeasurementRequest=} [properties] Properties to set
         */
        function StartMeasurementRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * StartMeasurementRequest activityId.
         * @member {number} activityId
         * @memberof insole.StartMeasurementRequest
         * @instance
         */
        StartMeasurementRequest.prototype.activityId = 0;

        /**
         * Creates a new StartMeasurementRequest instance using the specified properties.
         * @function create
         * @memberof insole.StartMeasurementRequest
         * @static
         * @param {insole.IStartMeasurementRequest=} [properties] Properties to set
         * @returns {insole.StartMeasurementRequest} StartMeasurementRequest instance
         */
        StartMeasurementRequest.create = function create(properties) {
            return new StartMeasurementRequest(properties);
        };

        /**
         * Encodes the specified StartMeasurementRequest message. Does not implicitly {@link insole.StartMeasurementRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.StartMeasurementRequest
         * @static
         * @param {insole.IStartMeasurementRequest} message StartMeasurementRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StartMeasurementRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.activityId != null && Object.hasOwnProperty.call(message, "activityId"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.activityId);
            return writer;
        };

        /**
         * Encodes the specified StartMeasurementRequest message, length delimited. Does not implicitly {@link insole.StartMeasurementRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.StartMeasurementRequest
         * @static
         * @param {insole.IStartMeasurementRequest} message StartMeasurementRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StartMeasurementRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a StartMeasurementRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.StartMeasurementRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.StartMeasurementRequest} StartMeasurementRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StartMeasurementRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.StartMeasurementRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.activityId = reader.uint32();
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
         * Decodes a StartMeasurementRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.StartMeasurementRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.StartMeasurementRequest} StartMeasurementRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StartMeasurementRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a StartMeasurementRequest message.
         * @function verify
         * @memberof insole.StartMeasurementRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        StartMeasurementRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.activityId != null && Object.hasOwnProperty.call(message, "activityId"))
                if (!$util.isInteger(message.activityId))
                    return "activityId: integer expected";
            return null;
        };

        /**
         * Creates a StartMeasurementRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.StartMeasurementRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.StartMeasurementRequest} StartMeasurementRequest
         */
        StartMeasurementRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.StartMeasurementRequest)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.StartMeasurementRequest: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.StartMeasurementRequest();
            if (object.activityId != null)
                message.activityId = object.activityId >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a StartMeasurementRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.StartMeasurementRequest
         * @static
         * @param {insole.StartMeasurementRequest} message StartMeasurementRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        StartMeasurementRequest.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults)
                object.activityId = 0;
            if (message.activityId != null && Object.hasOwnProperty.call(message, "activityId"))
                object.activityId = message.activityId;
            return object;
        };

        /**
         * Converts this StartMeasurementRequest to JSON.
         * @function toJSON
         * @memberof insole.StartMeasurementRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        StartMeasurementRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for StartMeasurementRequest
         * @function getTypeUrl
         * @memberof insole.StartMeasurementRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        StartMeasurementRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.StartMeasurementRequest";
        };

        return StartMeasurementRequest;
    })();

    insole.StartMeasurementResponse = (function() {

        /**
         * Properties of a StartMeasurementResponse.
         * @memberof insole
         * @interface IStartMeasurementResponse
         * @property {boolean|null} [ok] StartMeasurementResponse ok
         * @property {number|null} [sessionId] StartMeasurementResponse sessionId
         * @property {number|null} [activityId] StartMeasurementResponse activityId
         */

        /**
         * Constructs a new StartMeasurementResponse.
         * @memberof insole
         * @classdesc Represents a StartMeasurementResponse.
         * @implements IStartMeasurementResponse
         * @constructor
         * @param {insole.IStartMeasurementResponse=} [properties] Properties to set
         */
        function StartMeasurementResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * StartMeasurementResponse ok.
         * @member {boolean} ok
         * @memberof insole.StartMeasurementResponse
         * @instance
         */
        StartMeasurementResponse.prototype.ok = false;

        /**
         * StartMeasurementResponse sessionId.
         * @member {number} sessionId
         * @memberof insole.StartMeasurementResponse
         * @instance
         */
        StartMeasurementResponse.prototype.sessionId = 0;

        /**
         * StartMeasurementResponse activityId.
         * @member {number} activityId
         * @memberof insole.StartMeasurementResponse
         * @instance
         */
        StartMeasurementResponse.prototype.activityId = 0;

        /**
         * Creates a new StartMeasurementResponse instance using the specified properties.
         * @function create
         * @memberof insole.StartMeasurementResponse
         * @static
         * @param {insole.IStartMeasurementResponse=} [properties] Properties to set
         * @returns {insole.StartMeasurementResponse} StartMeasurementResponse instance
         */
        StartMeasurementResponse.create = function create(properties) {
            return new StartMeasurementResponse(properties);
        };

        /**
         * Encodes the specified StartMeasurementResponse message. Does not implicitly {@link insole.StartMeasurementResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.StartMeasurementResponse
         * @static
         * @param {insole.IStartMeasurementResponse} message StartMeasurementResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StartMeasurementResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.ok);
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.sessionId);
            if (message.activityId != null && Object.hasOwnProperty.call(message, "activityId"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.activityId);
            return writer;
        };

        /**
         * Encodes the specified StartMeasurementResponse message, length delimited. Does not implicitly {@link insole.StartMeasurementResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.StartMeasurementResponse
         * @static
         * @param {insole.IStartMeasurementResponse} message StartMeasurementResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StartMeasurementResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a StartMeasurementResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.StartMeasurementResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.StartMeasurementResponse} StartMeasurementResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StartMeasurementResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.StartMeasurementResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.ok = reader.bool();
                        break;
                    }
                case 2: {
                        message.sessionId = reader.uint32();
                        break;
                    }
                case 3: {
                        message.activityId = reader.uint32();
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
         * Decodes a StartMeasurementResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.StartMeasurementResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.StartMeasurementResponse} StartMeasurementResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StartMeasurementResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a StartMeasurementResponse message.
         * @function verify
         * @memberof insole.StartMeasurementResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        StartMeasurementResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                if (typeof message.ok !== "boolean")
                    return "ok: boolean expected";
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                if (!$util.isInteger(message.sessionId))
                    return "sessionId: integer expected";
            if (message.activityId != null && Object.hasOwnProperty.call(message, "activityId"))
                if (!$util.isInteger(message.activityId))
                    return "activityId: integer expected";
            return null;
        };

        /**
         * Creates a StartMeasurementResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.StartMeasurementResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.StartMeasurementResponse} StartMeasurementResponse
         */
        StartMeasurementResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.StartMeasurementResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.StartMeasurementResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.StartMeasurementResponse();
            if (object.ok != null)
                message.ok = Boolean(object.ok);
            if (object.sessionId != null)
                message.sessionId = object.sessionId >>> 0;
            if (object.activityId != null)
                message.activityId = object.activityId >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a StartMeasurementResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.StartMeasurementResponse
         * @static
         * @param {insole.StartMeasurementResponse} message StartMeasurementResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        StartMeasurementResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.ok = false;
                object.sessionId = 0;
                object.activityId = 0;
            }
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                object.ok = message.ok;
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                object.sessionId = message.sessionId;
            if (message.activityId != null && Object.hasOwnProperty.call(message, "activityId"))
                object.activityId = message.activityId;
            return object;
        };

        /**
         * Converts this StartMeasurementResponse to JSON.
         * @function toJSON
         * @memberof insole.StartMeasurementResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        StartMeasurementResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for StartMeasurementResponse
         * @function getTypeUrl
         * @memberof insole.StartMeasurementResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        StartMeasurementResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.StartMeasurementResponse";
        };

        return StartMeasurementResponse;
    })();

    insole.StopMeasurementRequest = (function() {

        /**
         * Properties of a StopMeasurementRequest.
         * @memberof insole
         * @interface IStopMeasurementRequest
         */

        /**
         * Constructs a new StopMeasurementRequest.
         * @memberof insole
         * @classdesc Represents a StopMeasurementRequest.
         * @implements IStopMeasurementRequest
         * @constructor
         * @param {insole.IStopMeasurementRequest=} [properties] Properties to set
         */
        function StopMeasurementRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new StopMeasurementRequest instance using the specified properties.
         * @function create
         * @memberof insole.StopMeasurementRequest
         * @static
         * @param {insole.IStopMeasurementRequest=} [properties] Properties to set
         * @returns {insole.StopMeasurementRequest} StopMeasurementRequest instance
         */
        StopMeasurementRequest.create = function create(properties) {
            return new StopMeasurementRequest(properties);
        };

        /**
         * Encodes the specified StopMeasurementRequest message. Does not implicitly {@link insole.StopMeasurementRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.StopMeasurementRequest
         * @static
         * @param {insole.IStopMeasurementRequest} message StopMeasurementRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StopMeasurementRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            return writer;
        };

        /**
         * Encodes the specified StopMeasurementRequest message, length delimited. Does not implicitly {@link insole.StopMeasurementRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.StopMeasurementRequest
         * @static
         * @param {insole.IStopMeasurementRequest} message StopMeasurementRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StopMeasurementRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a StopMeasurementRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.StopMeasurementRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.StopMeasurementRequest} StopMeasurementRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StopMeasurementRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.StopMeasurementRequest();
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
         * Decodes a StopMeasurementRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.StopMeasurementRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.StopMeasurementRequest} StopMeasurementRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StopMeasurementRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a StopMeasurementRequest message.
         * @function verify
         * @memberof insole.StopMeasurementRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        StopMeasurementRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            return null;
        };

        /**
         * Creates a StopMeasurementRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.StopMeasurementRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.StopMeasurementRequest} StopMeasurementRequest
         */
        StopMeasurementRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.StopMeasurementRequest)
                return object;
            return new $root.insole.StopMeasurementRequest();
        };

        /**
         * Creates a plain object from a StopMeasurementRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.StopMeasurementRequest
         * @static
         * @param {insole.StopMeasurementRequest} message StopMeasurementRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        StopMeasurementRequest.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this StopMeasurementRequest to JSON.
         * @function toJSON
         * @memberof insole.StopMeasurementRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        StopMeasurementRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for StopMeasurementRequest
         * @function getTypeUrl
         * @memberof insole.StopMeasurementRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        StopMeasurementRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.StopMeasurementRequest";
        };

        return StopMeasurementRequest;
    })();

    insole.StopMeasurementResponse = (function() {

        /**
         * Properties of a StopMeasurementResponse.
         * @memberof insole
         * @interface IStopMeasurementResponse
         * @property {boolean|null} [ok] StopMeasurementResponse ok
         * @property {number|null} [sessionId] StopMeasurementResponse sessionId
         * @property {number|null} [steps] StopMeasurementResponse steps
         * @property {boolean|null} [recorded] StopMeasurementResponse recorded
         */

        /**
         * Constructs a new StopMeasurementResponse.
         * @memberof insole
         * @classdesc Represents a StopMeasurementResponse.
         * @implements IStopMeasurementResponse
         * @constructor
         * @param {insole.IStopMeasurementResponse=} [properties] Properties to set
         */
        function StopMeasurementResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * StopMeasurementResponse ok.
         * @member {boolean} ok
         * @memberof insole.StopMeasurementResponse
         * @instance
         */
        StopMeasurementResponse.prototype.ok = false;

        /**
         * StopMeasurementResponse sessionId.
         * @member {number} sessionId
         * @memberof insole.StopMeasurementResponse
         * @instance
         */
        StopMeasurementResponse.prototype.sessionId = 0;

        /**
         * StopMeasurementResponse steps.
         * @member {number} steps
         * @memberof insole.StopMeasurementResponse
         * @instance
         */
        StopMeasurementResponse.prototype.steps = 0;

        /**
         * StopMeasurementResponse recorded.
         * @member {boolean} recorded
         * @memberof insole.StopMeasurementResponse
         * @instance
         */
        StopMeasurementResponse.prototype.recorded = false;

        /**
         * Creates a new StopMeasurementResponse instance using the specified properties.
         * @function create
         * @memberof insole.StopMeasurementResponse
         * @static
         * @param {insole.IStopMeasurementResponse=} [properties] Properties to set
         * @returns {insole.StopMeasurementResponse} StopMeasurementResponse instance
         */
        StopMeasurementResponse.create = function create(properties) {
            return new StopMeasurementResponse(properties);
        };

        /**
         * Encodes the specified StopMeasurementResponse message. Does not implicitly {@link insole.StopMeasurementResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.StopMeasurementResponse
         * @static
         * @param {insole.IStopMeasurementResponse} message StopMeasurementResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StopMeasurementResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.ok);
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.sessionId);
            if (message.steps != null && Object.hasOwnProperty.call(message, "steps"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.steps);
            if (message.recorded != null && Object.hasOwnProperty.call(message, "recorded"))
                writer.uint32(/* id 4, wireType 0 =*/32).bool(message.recorded);
            return writer;
        };

        /**
         * Encodes the specified StopMeasurementResponse message, length delimited. Does not implicitly {@link insole.StopMeasurementResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.StopMeasurementResponse
         * @static
         * @param {insole.IStopMeasurementResponse} message StopMeasurementResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        StopMeasurementResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a StopMeasurementResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.StopMeasurementResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.StopMeasurementResponse} StopMeasurementResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StopMeasurementResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.StopMeasurementResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.ok = reader.bool();
                        break;
                    }
                case 2: {
                        message.sessionId = reader.uint32();
                        break;
                    }
                case 3: {
                        message.steps = reader.uint32();
                        break;
                    }
                case 4: {
                        message.recorded = reader.bool();
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
         * Decodes a StopMeasurementResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.StopMeasurementResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.StopMeasurementResponse} StopMeasurementResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        StopMeasurementResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a StopMeasurementResponse message.
         * @function verify
         * @memberof insole.StopMeasurementResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        StopMeasurementResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                if (typeof message.ok !== "boolean")
                    return "ok: boolean expected";
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                if (!$util.isInteger(message.sessionId))
                    return "sessionId: integer expected";
            if (message.steps != null && Object.hasOwnProperty.call(message, "steps"))
                if (!$util.isInteger(message.steps))
                    return "steps: integer expected";
            if (message.recorded != null && Object.hasOwnProperty.call(message, "recorded"))
                if (typeof message.recorded !== "boolean")
                    return "recorded: boolean expected";
            return null;
        };

        /**
         * Creates a StopMeasurementResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.StopMeasurementResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.StopMeasurementResponse} StopMeasurementResponse
         */
        StopMeasurementResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.StopMeasurementResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.StopMeasurementResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.StopMeasurementResponse();
            if (object.ok != null)
                message.ok = Boolean(object.ok);
            if (object.sessionId != null)
                message.sessionId = object.sessionId >>> 0;
            if (object.steps != null)
                message.steps = object.steps >>> 0;
            if (object.recorded != null)
                message.recorded = Boolean(object.recorded);
            return message;
        };

        /**
         * Creates a plain object from a StopMeasurementResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.StopMeasurementResponse
         * @static
         * @param {insole.StopMeasurementResponse} message StopMeasurementResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        StopMeasurementResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.ok = false;
                object.sessionId = 0;
                object.steps = 0;
                object.recorded = false;
            }
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                object.ok = message.ok;
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                object.sessionId = message.sessionId;
            if (message.steps != null && Object.hasOwnProperty.call(message, "steps"))
                object.steps = message.steps;
            if (message.recorded != null && Object.hasOwnProperty.call(message, "recorded"))
                object.recorded = message.recorded;
            return object;
        };

        /**
         * Converts this StopMeasurementResponse to JSON.
         * @function toJSON
         * @memberof insole.StopMeasurementResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        StopMeasurementResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for StopMeasurementResponse
         * @function getTypeUrl
         * @memberof insole.StopMeasurementResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        StopMeasurementResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.StopMeasurementResponse";
        };

        return StopMeasurementResponse;
    })();

    insole.LogMeta = (function() {

        /**
         * Properties of a LogMeta.
         * @memberof insole
         * @interface ILogMeta
         * @property {number|null} [sessionId] LogMeta sessionId
         * @property {number|Long|null} [startMs] LogMeta startMs
         * @property {number|null} [elapsedMs] LogMeta elapsedMs
         * @property {number|null} [steps] LogMeta steps
         */

        /**
         * Constructs a new LogMeta.
         * @memberof insole
         * @classdesc Represents a LogMeta.
         * @implements ILogMeta
         * @constructor
         * @param {insole.ILogMeta=} [properties] Properties to set
         */
        function LogMeta(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * LogMeta sessionId.
         * @member {number} sessionId
         * @memberof insole.LogMeta
         * @instance
         */
        LogMeta.prototype.sessionId = 0;

        /**
         * LogMeta startMs.
         * @member {number|Long} startMs
         * @memberof insole.LogMeta
         * @instance
         */
        LogMeta.prototype.startMs = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * LogMeta elapsedMs.
         * @member {number} elapsedMs
         * @memberof insole.LogMeta
         * @instance
         */
        LogMeta.prototype.elapsedMs = 0;

        /**
         * LogMeta steps.
         * @member {number} steps
         * @memberof insole.LogMeta
         * @instance
         */
        LogMeta.prototype.steps = 0;

        /**
         * Creates a new LogMeta instance using the specified properties.
         * @function create
         * @memberof insole.LogMeta
         * @static
         * @param {insole.ILogMeta=} [properties] Properties to set
         * @returns {insole.LogMeta} LogMeta instance
         */
        LogMeta.create = function create(properties) {
            return new LogMeta(properties);
        };

        /**
         * Encodes the specified LogMeta message. Does not implicitly {@link insole.LogMeta.verify|verify} messages.
         * @function encode
         * @memberof insole.LogMeta
         * @static
         * @param {insole.ILogMeta} message LogMeta message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LogMeta.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.sessionId);
            if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.startMs);
            if (message.elapsedMs != null && Object.hasOwnProperty.call(message, "elapsedMs"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.elapsedMs);
            if (message.steps != null && Object.hasOwnProperty.call(message, "steps"))
                writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.steps);
            return writer;
        };

        /**
         * Encodes the specified LogMeta message, length delimited. Does not implicitly {@link insole.LogMeta.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.LogMeta
         * @static
         * @param {insole.ILogMeta} message LogMeta message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        LogMeta.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a LogMeta message from the specified reader or buffer.
         * @function decode
         * @memberof insole.LogMeta
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.LogMeta} LogMeta
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LogMeta.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.LogMeta();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.sessionId = reader.uint32();
                        break;
                    }
                case 2: {
                        message.startMs = reader.uint64();
                        break;
                    }
                case 3: {
                        message.elapsedMs = reader.uint32();
                        break;
                    }
                case 4: {
                        message.steps = reader.uint32();
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
         * Decodes a LogMeta message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.LogMeta
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.LogMeta} LogMeta
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        LogMeta.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a LogMeta message.
         * @function verify
         * @memberof insole.LogMeta
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        LogMeta.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                if (!$util.isInteger(message.sessionId))
                    return "sessionId: integer expected";
            if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs"))
                if (!$util.isInteger(message.startMs) && !(message.startMs && $util.isInteger(message.startMs.low) && $util.isInteger(message.startMs.high)))
                    return "startMs: integer|Long expected";
            if (message.elapsedMs != null && Object.hasOwnProperty.call(message, "elapsedMs"))
                if (!$util.isInteger(message.elapsedMs))
                    return "elapsedMs: integer expected";
            if (message.steps != null && Object.hasOwnProperty.call(message, "steps"))
                if (!$util.isInteger(message.steps))
                    return "steps: integer expected";
            return null;
        };

        /**
         * Creates a LogMeta message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.LogMeta
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.LogMeta} LogMeta
         */
        LogMeta.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.LogMeta)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.LogMeta: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.LogMeta();
            if (object.sessionId != null)
                message.sessionId = object.sessionId >>> 0;
            if (object.startMs != null)
                if ($util.Long)
                    message.startMs = $util.Long.fromValue(object.startMs, true);
                else if (typeof object.startMs === "string")
                    message.startMs = parseInt(object.startMs, 10);
                else if (typeof object.startMs === "number")
                    message.startMs = object.startMs;
                else if (typeof object.startMs === "object")
                    message.startMs = new $util.LongBits(object.startMs.low >>> 0, object.startMs.high >>> 0).toNumber(true);
            if (object.elapsedMs != null)
                message.elapsedMs = object.elapsedMs >>> 0;
            if (object.steps != null)
                message.steps = object.steps >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a LogMeta message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.LogMeta
         * @static
         * @param {insole.LogMeta} message LogMeta
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        LogMeta.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.sessionId = 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.startMs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                } else
                    object.startMs = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                object.elapsedMs = 0;
                object.steps = 0;
            }
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                object.sessionId = message.sessionId;
            if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs"))
                if (typeof BigInt !== "undefined" && options.longs === BigInt)
                    object.startMs = typeof message.startMs === "number" ? BigInt(message.startMs) : $util.Long.fromBits(message.startMs.low >>> 0, message.startMs.high >>> 0, true).toBigInt();
                else if (typeof message.startMs === "number")
                    object.startMs = options.longs === String ? String(message.startMs) : message.startMs;
                else
                    object.startMs = options.longs === String ? $util.Long.prototype.toString.call(message.startMs) : options.longs === Number ? new $util.LongBits(message.startMs.low >>> 0, message.startMs.high >>> 0).toNumber(true) : message.startMs;
            if (message.elapsedMs != null && Object.hasOwnProperty.call(message, "elapsedMs"))
                object.elapsedMs = message.elapsedMs;
            if (message.steps != null && Object.hasOwnProperty.call(message, "steps"))
                object.steps = message.steps;
            return object;
        };

        /**
         * Converts this LogMeta to JSON.
         * @function toJSON
         * @memberof insole.LogMeta
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        LogMeta.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for LogMeta
         * @function getTypeUrl
         * @memberof insole.LogMeta
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        LogMeta.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.LogMeta";
        };

        return LogMeta;
    })();

    insole.ListLogsRequest = (function() {

        /**
         * Properties of a ListLogsRequest.
         * @memberof insole
         * @interface IListLogsRequest
         */

        /**
         * Constructs a new ListLogsRequest.
         * @memberof insole
         * @classdesc Represents a ListLogsRequest.
         * @implements IListLogsRequest
         * @constructor
         * @param {insole.IListLogsRequest=} [properties] Properties to set
         */
        function ListLogsRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new ListLogsRequest instance using the specified properties.
         * @function create
         * @memberof insole.ListLogsRequest
         * @static
         * @param {insole.IListLogsRequest=} [properties] Properties to set
         * @returns {insole.ListLogsRequest} ListLogsRequest instance
         */
        ListLogsRequest.create = function create(properties) {
            return new ListLogsRequest(properties);
        };

        /**
         * Encodes the specified ListLogsRequest message. Does not implicitly {@link insole.ListLogsRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.ListLogsRequest
         * @static
         * @param {insole.IListLogsRequest} message ListLogsRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ListLogsRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            return writer;
        };

        /**
         * Encodes the specified ListLogsRequest message, length delimited. Does not implicitly {@link insole.ListLogsRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.ListLogsRequest
         * @static
         * @param {insole.IListLogsRequest} message ListLogsRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ListLogsRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a ListLogsRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.ListLogsRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.ListLogsRequest} ListLogsRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ListLogsRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.ListLogsRequest();
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
         * Decodes a ListLogsRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.ListLogsRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.ListLogsRequest} ListLogsRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ListLogsRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ListLogsRequest message.
         * @function verify
         * @memberof insole.ListLogsRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ListLogsRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            return null;
        };

        /**
         * Creates a ListLogsRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.ListLogsRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.ListLogsRequest} ListLogsRequest
         */
        ListLogsRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.ListLogsRequest)
                return object;
            return new $root.insole.ListLogsRequest();
        };

        /**
         * Creates a plain object from a ListLogsRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.ListLogsRequest
         * @static
         * @param {insole.ListLogsRequest} message ListLogsRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ListLogsRequest.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this ListLogsRequest to JSON.
         * @function toJSON
         * @memberof insole.ListLogsRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ListLogsRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ListLogsRequest
         * @function getTypeUrl
         * @memberof insole.ListLogsRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ListLogsRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.ListLogsRequest";
        };

        return ListLogsRequest;
    })();

    insole.ListLogsResponse = (function() {

        /**
         * Properties of a ListLogsResponse.
         * @memberof insole
         * @interface IListLogsResponse
         * @property {number|null} [total] ListLogsResponse total
         * @property {Array.<insole.ILogMeta>|null} [logs] ListLogsResponse logs
         */

        /**
         * Constructs a new ListLogsResponse.
         * @memberof insole
         * @classdesc Represents a ListLogsResponse.
         * @implements IListLogsResponse
         * @constructor
         * @param {insole.IListLogsResponse=} [properties] Properties to set
         */
        function ListLogsResponse(properties) {
            this.logs = [];
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ListLogsResponse total.
         * @member {number} total
         * @memberof insole.ListLogsResponse
         * @instance
         */
        ListLogsResponse.prototype.total = 0;

        /**
         * ListLogsResponse logs.
         * @member {Array.<insole.ILogMeta>} logs
         * @memberof insole.ListLogsResponse
         * @instance
         */
        ListLogsResponse.prototype.logs = $util.emptyArray;

        /**
         * Creates a new ListLogsResponse instance using the specified properties.
         * @function create
         * @memberof insole.ListLogsResponse
         * @static
         * @param {insole.IListLogsResponse=} [properties] Properties to set
         * @returns {insole.ListLogsResponse} ListLogsResponse instance
         */
        ListLogsResponse.create = function create(properties) {
            return new ListLogsResponse(properties);
        };

        /**
         * Encodes the specified ListLogsResponse message. Does not implicitly {@link insole.ListLogsResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.ListLogsResponse
         * @static
         * @param {insole.IListLogsResponse} message ListLogsResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ListLogsResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.total != null && Object.hasOwnProperty.call(message, "total"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.total);
            if (message.logs != null && message.logs.length)
                for (let i = 0; i < message.logs.length; ++i)
                    $root.insole.LogMeta.encode(message.logs[i], writer.uint32(/* id 2, wireType 2 =*/18).fork(), q + 1).ldelim();
            return writer;
        };

        /**
         * Encodes the specified ListLogsResponse message, length delimited. Does not implicitly {@link insole.ListLogsResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.ListLogsResponse
         * @static
         * @param {insole.IListLogsResponse} message ListLogsResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ListLogsResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a ListLogsResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.ListLogsResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.ListLogsResponse} ListLogsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ListLogsResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.ListLogsResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.total = reader.uint32();
                        break;
                    }
                case 2: {
                        if (!(message.logs && message.logs.length))
                            message.logs = [];
                        message.logs.push($root.insole.LogMeta.decode(reader, reader.uint32(), undefined, long + 1));
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
         * Decodes a ListLogsResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.ListLogsResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.ListLogsResponse} ListLogsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ListLogsResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ListLogsResponse message.
         * @function verify
         * @memberof insole.ListLogsResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ListLogsResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.total != null && Object.hasOwnProperty.call(message, "total"))
                if (!$util.isInteger(message.total))
                    return "total: integer expected";
            if (message.logs != null && Object.hasOwnProperty.call(message, "logs")) {
                if (!Array.isArray(message.logs))
                    return "logs: array expected";
                for (let i = 0; i < message.logs.length; ++i) {
                    let error = $root.insole.LogMeta.verify(message.logs[i], long + 1);
                    if (error)
                        return "logs." + error;
                }
            }
            return null;
        };

        /**
         * Creates a ListLogsResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.ListLogsResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.ListLogsResponse} ListLogsResponse
         */
        ListLogsResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.ListLogsResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.ListLogsResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.ListLogsResponse();
            if (object.total != null)
                message.total = object.total >>> 0;
            if (object.logs) {
                if (!Array.isArray(object.logs))
                    throw TypeError(".insole.ListLogsResponse.logs: array expected");
                message.logs = [];
                for (let i = 0; i < object.logs.length; ++i) {
                    if (!$util.isObject(object.logs[i]))
                        throw TypeError(".insole.ListLogsResponse.logs: object expected");
                    message.logs[i] = $root.insole.LogMeta.fromObject(object.logs[i], long + 1);
                }
            }
            return message;
        };

        /**
         * Creates a plain object from a ListLogsResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.ListLogsResponse
         * @static
         * @param {insole.ListLogsResponse} message ListLogsResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ListLogsResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.arrays || options.defaults)
                object.logs = [];
            if (options.defaults)
                object.total = 0;
            if (message.total != null && Object.hasOwnProperty.call(message, "total"))
                object.total = message.total;
            if (message.logs && message.logs.length) {
                object.logs = [];
                for (let j = 0; j < message.logs.length; ++j)
                    object.logs[j] = $root.insole.LogMeta.toObject(message.logs[j], options, q + 1);
            }
            return object;
        };

        /**
         * Converts this ListLogsResponse to JSON.
         * @function toJSON
         * @memberof insole.ListLogsResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ListLogsResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ListLogsResponse
         * @function getTypeUrl
         * @memberof insole.ListLogsResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ListLogsResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.ListLogsResponse";
        };

        return ListLogsResponse;
    })();

    insole.GaitStat = (function() {

        /**
         * Properties of a GaitStat.
         * @memberof insole
         * @interface IGaitStat
         * @property {number|null} [average] GaitStat average
         * @property {number|null} [variance] GaitStat variance
         * @property {number|null} [minimum] GaitStat minimum
         * @property {number|null} [maximum] GaitStat maximum
         */

        /**
         * Constructs a new GaitStat.
         * @memberof insole
         * @classdesc Represents a GaitStat.
         * @implements IGaitStat
         * @constructor
         * @param {insole.IGaitStat=} [properties] Properties to set
         */
        function GaitStat(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GaitStat average.
         * @member {number} average
         * @memberof insole.GaitStat
         * @instance
         */
        GaitStat.prototype.average = 0;

        /**
         * GaitStat variance.
         * @member {number} variance
         * @memberof insole.GaitStat
         * @instance
         */
        GaitStat.prototype.variance = 0;

        /**
         * GaitStat minimum.
         * @member {number} minimum
         * @memberof insole.GaitStat
         * @instance
         */
        GaitStat.prototype.minimum = 0;

        /**
         * GaitStat maximum.
         * @member {number} maximum
         * @memberof insole.GaitStat
         * @instance
         */
        GaitStat.prototype.maximum = 0;

        /**
         * Creates a new GaitStat instance using the specified properties.
         * @function create
         * @memberof insole.GaitStat
         * @static
         * @param {insole.IGaitStat=} [properties] Properties to set
         * @returns {insole.GaitStat} GaitStat instance
         */
        GaitStat.create = function create(properties) {
            return new GaitStat(properties);
        };

        /**
         * Encodes the specified GaitStat message. Does not implicitly {@link insole.GaitStat.verify|verify} messages.
         * @function encode
         * @memberof insole.GaitStat
         * @static
         * @param {insole.IGaitStat} message GaitStat message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GaitStat.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.average != null && Object.hasOwnProperty.call(message, "average"))
                writer.uint32(/* id 1, wireType 5 =*/13).float(message.average);
            if (message.variance != null && Object.hasOwnProperty.call(message, "variance"))
                writer.uint32(/* id 2, wireType 5 =*/21).float(message.variance);
            if (message.minimum != null && Object.hasOwnProperty.call(message, "minimum"))
                writer.uint32(/* id 3, wireType 5 =*/29).float(message.minimum);
            if (message.maximum != null && Object.hasOwnProperty.call(message, "maximum"))
                writer.uint32(/* id 4, wireType 5 =*/37).float(message.maximum);
            return writer;
        };

        /**
         * Encodes the specified GaitStat message, length delimited. Does not implicitly {@link insole.GaitStat.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.GaitStat
         * @static
         * @param {insole.IGaitStat} message GaitStat message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GaitStat.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a GaitStat message from the specified reader or buffer.
         * @function decode
         * @memberof insole.GaitStat
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.GaitStat} GaitStat
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GaitStat.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.GaitStat();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.average = reader.float();
                        break;
                    }
                case 2: {
                        message.variance = reader.float();
                        break;
                    }
                case 3: {
                        message.minimum = reader.float();
                        break;
                    }
                case 4: {
                        message.maximum = reader.float();
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
         * Decodes a GaitStat message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.GaitStat
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.GaitStat} GaitStat
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GaitStat.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GaitStat message.
         * @function verify
         * @memberof insole.GaitStat
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GaitStat.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.average != null && Object.hasOwnProperty.call(message, "average"))
                if (typeof message.average !== "number")
                    return "average: number expected";
            if (message.variance != null && Object.hasOwnProperty.call(message, "variance"))
                if (typeof message.variance !== "number")
                    return "variance: number expected";
            if (message.minimum != null && Object.hasOwnProperty.call(message, "minimum"))
                if (typeof message.minimum !== "number")
                    return "minimum: number expected";
            if (message.maximum != null && Object.hasOwnProperty.call(message, "maximum"))
                if (typeof message.maximum !== "number")
                    return "maximum: number expected";
            return null;
        };

        /**
         * Creates a GaitStat message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.GaitStat
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.GaitStat} GaitStat
         */
        GaitStat.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.GaitStat)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.GaitStat: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.GaitStat();
            if (object.average != null)
                message.average = Number(object.average);
            if (object.variance != null)
                message.variance = Number(object.variance);
            if (object.minimum != null)
                message.minimum = Number(object.minimum);
            if (object.maximum != null)
                message.maximum = Number(object.maximum);
            return message;
        };

        /**
         * Creates a plain object from a GaitStat message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.GaitStat
         * @static
         * @param {insole.GaitStat} message GaitStat
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GaitStat.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.average = 0;
                object.variance = 0;
                object.minimum = 0;
                object.maximum = 0;
            }
            if (message.average != null && Object.hasOwnProperty.call(message, "average"))
                object.average = options.json && !isFinite(message.average) ? String(message.average) : message.average;
            if (message.variance != null && Object.hasOwnProperty.call(message, "variance"))
                object.variance = options.json && !isFinite(message.variance) ? String(message.variance) : message.variance;
            if (message.minimum != null && Object.hasOwnProperty.call(message, "minimum"))
                object.minimum = options.json && !isFinite(message.minimum) ? String(message.minimum) : message.minimum;
            if (message.maximum != null && Object.hasOwnProperty.call(message, "maximum"))
                object.maximum = options.json && !isFinite(message.maximum) ? String(message.maximum) : message.maximum;
            return object;
        };

        /**
         * Converts this GaitStat to JSON.
         * @function toJSON
         * @memberof insole.GaitStat
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GaitStat.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for GaitStat
         * @function getTypeUrl
         * @memberof insole.GaitStat
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        GaitStat.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.GaitStat";
        };

        return GaitStat;
    })();

    insole.GaitSummary = (function() {

        /**
         * Properties of a GaitSummary.
         * @memberof insole
         * @interface IGaitSummary
         * @property {number|null} [sessionId] GaitSummary sessionId
         * @property {number|Long|null} [startMs] GaitSummary startMs
         * @property {number|null} [elapsedMs] GaitSummary elapsedMs
         * @property {number|null} [steps] GaitSummary steps
         * @property {number|null} [distanceM] GaitSummary distanceM
         * @property {insole.Foot|null} [foot] GaitSummary foot
         * @property {insole.IGaitStat|null} [stride] GaitSummary stride
         * @property {insole.IGaitStat|null} [strideHeight] GaitSummary strideHeight
         * @property {insole.IGaitStat|null} [speed] GaitSummary speed
         * @property {insole.IGaitStat|null} [pronation] GaitSummary pronation
         * @property {insole.IGaitStat|null} [strikeAngle] GaitSummary strikeAngle
         * @property {insole.IGaitStat|null} [cadence] GaitSummary cadence
         * @property {insole.IGaitStat|null} [landingForce] GaitSummary landingForce
         * @property {insole.IGaitStat|null} [contactTime] GaitSummary contactTime
         * @property {number|null} [activityId] GaitSummary activityId
         */

        /**
         * Constructs a new GaitSummary.
         * @memberof insole
         * @classdesc Represents a GaitSummary.
         * @implements IGaitSummary
         * @constructor
         * @param {insole.IGaitSummary=} [properties] Properties to set
         */
        function GaitSummary(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GaitSummary sessionId.
         * @member {number} sessionId
         * @memberof insole.GaitSummary
         * @instance
         */
        GaitSummary.prototype.sessionId = 0;

        /**
         * GaitSummary startMs.
         * @member {number|Long} startMs
         * @memberof insole.GaitSummary
         * @instance
         */
        GaitSummary.prototype.startMs = $util.Long ? $util.Long.fromBits(0,0,true) : 0;

        /**
         * GaitSummary elapsedMs.
         * @member {number} elapsedMs
         * @memberof insole.GaitSummary
         * @instance
         */
        GaitSummary.prototype.elapsedMs = 0;

        /**
         * GaitSummary steps.
         * @member {number} steps
         * @memberof insole.GaitSummary
         * @instance
         */
        GaitSummary.prototype.steps = 0;

        /**
         * GaitSummary distanceM.
         * @member {number} distanceM
         * @memberof insole.GaitSummary
         * @instance
         */
        GaitSummary.prototype.distanceM = 0;

        /**
         * GaitSummary foot.
         * @member {insole.Foot} foot
         * @memberof insole.GaitSummary
         * @instance
         */
        GaitSummary.prototype.foot = 0;

        /**
         * GaitSummary stride.
         * @member {insole.IGaitStat|null|undefined} stride
         * @memberof insole.GaitSummary
         * @instance
         */
        GaitSummary.prototype.stride = null;

        /**
         * GaitSummary strideHeight.
         * @member {insole.IGaitStat|null|undefined} strideHeight
         * @memberof insole.GaitSummary
         * @instance
         */
        GaitSummary.prototype.strideHeight = null;

        /**
         * GaitSummary speed.
         * @member {insole.IGaitStat|null|undefined} speed
         * @memberof insole.GaitSummary
         * @instance
         */
        GaitSummary.prototype.speed = null;

        /**
         * GaitSummary pronation.
         * @member {insole.IGaitStat|null|undefined} pronation
         * @memberof insole.GaitSummary
         * @instance
         */
        GaitSummary.prototype.pronation = null;

        /**
         * GaitSummary strikeAngle.
         * @member {insole.IGaitStat|null|undefined} strikeAngle
         * @memberof insole.GaitSummary
         * @instance
         */
        GaitSummary.prototype.strikeAngle = null;

        /**
         * GaitSummary cadence.
         * @member {insole.IGaitStat|null|undefined} cadence
         * @memberof insole.GaitSummary
         * @instance
         */
        GaitSummary.prototype.cadence = null;

        /**
         * GaitSummary landingForce.
         * @member {insole.IGaitStat|null|undefined} landingForce
         * @memberof insole.GaitSummary
         * @instance
         */
        GaitSummary.prototype.landingForce = null;

        /**
         * GaitSummary contactTime.
         * @member {insole.IGaitStat|null|undefined} contactTime
         * @memberof insole.GaitSummary
         * @instance
         */
        GaitSummary.prototype.contactTime = null;

        /**
         * GaitSummary activityId.
         * @member {number} activityId
         * @memberof insole.GaitSummary
         * @instance
         */
        GaitSummary.prototype.activityId = 0;

        /**
         * Creates a new GaitSummary instance using the specified properties.
         * @function create
         * @memberof insole.GaitSummary
         * @static
         * @param {insole.IGaitSummary=} [properties] Properties to set
         * @returns {insole.GaitSummary} GaitSummary instance
         */
        GaitSummary.create = function create(properties) {
            return new GaitSummary(properties);
        };

        /**
         * Encodes the specified GaitSummary message. Does not implicitly {@link insole.GaitSummary.verify|verify} messages.
         * @function encode
         * @memberof insole.GaitSummary
         * @static
         * @param {insole.IGaitSummary} message GaitSummary message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GaitSummary.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.sessionId);
            if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint64(message.startMs);
            if (message.elapsedMs != null && Object.hasOwnProperty.call(message, "elapsedMs"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.elapsedMs);
            if (message.steps != null && Object.hasOwnProperty.call(message, "steps"))
                writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.steps);
            if (message.distanceM != null && Object.hasOwnProperty.call(message, "distanceM"))
                writer.uint32(/* id 5, wireType 5 =*/45).float(message.distanceM);
            if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
                writer.uint32(/* id 6, wireType 0 =*/48).int32(message.foot);
            if (message.stride != null && Object.hasOwnProperty.call(message, "stride"))
                $root.insole.GaitStat.encode(message.stride, writer.uint32(/* id 7, wireType 2 =*/58).fork(), q + 1).ldelim();
            if (message.strideHeight != null && Object.hasOwnProperty.call(message, "strideHeight"))
                $root.insole.GaitStat.encode(message.strideHeight, writer.uint32(/* id 8, wireType 2 =*/66).fork(), q + 1).ldelim();
            if (message.speed != null && Object.hasOwnProperty.call(message, "speed"))
                $root.insole.GaitStat.encode(message.speed, writer.uint32(/* id 9, wireType 2 =*/74).fork(), q + 1).ldelim();
            if (message.pronation != null && Object.hasOwnProperty.call(message, "pronation"))
                $root.insole.GaitStat.encode(message.pronation, writer.uint32(/* id 10, wireType 2 =*/82).fork(), q + 1).ldelim();
            if (message.strikeAngle != null && Object.hasOwnProperty.call(message, "strikeAngle"))
                $root.insole.GaitStat.encode(message.strikeAngle, writer.uint32(/* id 11, wireType 2 =*/90).fork(), q + 1).ldelim();
            if (message.cadence != null && Object.hasOwnProperty.call(message, "cadence"))
                $root.insole.GaitStat.encode(message.cadence, writer.uint32(/* id 12, wireType 2 =*/98).fork(), q + 1).ldelim();
            if (message.landingForce != null && Object.hasOwnProperty.call(message, "landingForce"))
                $root.insole.GaitStat.encode(message.landingForce, writer.uint32(/* id 13, wireType 2 =*/106).fork(), q + 1).ldelim();
            if (message.contactTime != null && Object.hasOwnProperty.call(message, "contactTime"))
                $root.insole.GaitStat.encode(message.contactTime, writer.uint32(/* id 14, wireType 2 =*/114).fork(), q + 1).ldelim();
            if (message.activityId != null && Object.hasOwnProperty.call(message, "activityId"))
                writer.uint32(/* id 15, wireType 0 =*/120).uint32(message.activityId);
            return writer;
        };

        /**
         * Encodes the specified GaitSummary message, length delimited. Does not implicitly {@link insole.GaitSummary.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.GaitSummary
         * @static
         * @param {insole.IGaitSummary} message GaitSummary message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GaitSummary.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a GaitSummary message from the specified reader or buffer.
         * @function decode
         * @memberof insole.GaitSummary
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.GaitSummary} GaitSummary
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GaitSummary.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.GaitSummary();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.sessionId = reader.uint32();
                        break;
                    }
                case 2: {
                        message.startMs = reader.uint64();
                        break;
                    }
                case 3: {
                        message.elapsedMs = reader.uint32();
                        break;
                    }
                case 4: {
                        message.steps = reader.uint32();
                        break;
                    }
                case 5: {
                        message.distanceM = reader.float();
                        break;
                    }
                case 6: {
                        message.foot = reader.int32();
                        break;
                    }
                case 7: {
                        message.stride = $root.insole.GaitStat.decode(reader, reader.uint32(), undefined, long + 1);
                        break;
                    }
                case 8: {
                        message.strideHeight = $root.insole.GaitStat.decode(reader, reader.uint32(), undefined, long + 1);
                        break;
                    }
                case 9: {
                        message.speed = $root.insole.GaitStat.decode(reader, reader.uint32(), undefined, long + 1);
                        break;
                    }
                case 10: {
                        message.pronation = $root.insole.GaitStat.decode(reader, reader.uint32(), undefined, long + 1);
                        break;
                    }
                case 11: {
                        message.strikeAngle = $root.insole.GaitStat.decode(reader, reader.uint32(), undefined, long + 1);
                        break;
                    }
                case 12: {
                        message.cadence = $root.insole.GaitStat.decode(reader, reader.uint32(), undefined, long + 1);
                        break;
                    }
                case 13: {
                        message.landingForce = $root.insole.GaitStat.decode(reader, reader.uint32(), undefined, long + 1);
                        break;
                    }
                case 14: {
                        message.contactTime = $root.insole.GaitStat.decode(reader, reader.uint32(), undefined, long + 1);
                        break;
                    }
                case 15: {
                        message.activityId = reader.uint32();
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
         * Decodes a GaitSummary message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.GaitSummary
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.GaitSummary} GaitSummary
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GaitSummary.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GaitSummary message.
         * @function verify
         * @memberof insole.GaitSummary
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GaitSummary.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                if (!$util.isInteger(message.sessionId))
                    return "sessionId: integer expected";
            if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs"))
                if (!$util.isInteger(message.startMs) && !(message.startMs && $util.isInteger(message.startMs.low) && $util.isInteger(message.startMs.high)))
                    return "startMs: integer|Long expected";
            if (message.elapsedMs != null && Object.hasOwnProperty.call(message, "elapsedMs"))
                if (!$util.isInteger(message.elapsedMs))
                    return "elapsedMs: integer expected";
            if (message.steps != null && Object.hasOwnProperty.call(message, "steps"))
                if (!$util.isInteger(message.steps))
                    return "steps: integer expected";
            if (message.distanceM != null && Object.hasOwnProperty.call(message, "distanceM"))
                if (typeof message.distanceM !== "number")
                    return "distanceM: number expected";
            if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
                switch (message.foot) {
                default:
                    return "foot: enum value expected";
                case 0:
                case 1:
                case 2:
                    break;
                }
            if (message.stride != null && Object.hasOwnProperty.call(message, "stride")) {
                let error = $root.insole.GaitStat.verify(message.stride, long + 1);
                if (error)
                    return "stride." + error;
            }
            if (message.strideHeight != null && Object.hasOwnProperty.call(message, "strideHeight")) {
                let error = $root.insole.GaitStat.verify(message.strideHeight, long + 1);
                if (error)
                    return "strideHeight." + error;
            }
            if (message.speed != null && Object.hasOwnProperty.call(message, "speed")) {
                let error = $root.insole.GaitStat.verify(message.speed, long + 1);
                if (error)
                    return "speed." + error;
            }
            if (message.pronation != null && Object.hasOwnProperty.call(message, "pronation")) {
                let error = $root.insole.GaitStat.verify(message.pronation, long + 1);
                if (error)
                    return "pronation." + error;
            }
            if (message.strikeAngle != null && Object.hasOwnProperty.call(message, "strikeAngle")) {
                let error = $root.insole.GaitStat.verify(message.strikeAngle, long + 1);
                if (error)
                    return "strikeAngle." + error;
            }
            if (message.cadence != null && Object.hasOwnProperty.call(message, "cadence")) {
                let error = $root.insole.GaitStat.verify(message.cadence, long + 1);
                if (error)
                    return "cadence." + error;
            }
            if (message.landingForce != null && Object.hasOwnProperty.call(message, "landingForce")) {
                let error = $root.insole.GaitStat.verify(message.landingForce, long + 1);
                if (error)
                    return "landingForce." + error;
            }
            if (message.contactTime != null && Object.hasOwnProperty.call(message, "contactTime")) {
                let error = $root.insole.GaitStat.verify(message.contactTime, long + 1);
                if (error)
                    return "contactTime." + error;
            }
            if (message.activityId != null && Object.hasOwnProperty.call(message, "activityId"))
                if (!$util.isInteger(message.activityId))
                    return "activityId: integer expected";
            return null;
        };

        /**
         * Creates a GaitSummary message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.GaitSummary
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.GaitSummary} GaitSummary
         */
        GaitSummary.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.GaitSummary)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.GaitSummary: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.GaitSummary();
            if (object.sessionId != null)
                message.sessionId = object.sessionId >>> 0;
            if (object.startMs != null)
                if ($util.Long)
                    message.startMs = $util.Long.fromValue(object.startMs, true);
                else if (typeof object.startMs === "string")
                    message.startMs = parseInt(object.startMs, 10);
                else if (typeof object.startMs === "number")
                    message.startMs = object.startMs;
                else if (typeof object.startMs === "object")
                    message.startMs = new $util.LongBits(object.startMs.low >>> 0, object.startMs.high >>> 0).toNumber(true);
            if (object.elapsedMs != null)
                message.elapsedMs = object.elapsedMs >>> 0;
            if (object.steps != null)
                message.steps = object.steps >>> 0;
            if (object.distanceM != null)
                message.distanceM = Number(object.distanceM);
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
            if (object.stride != null) {
                if (!$util.isObject(object.stride))
                    throw TypeError(".insole.GaitSummary.stride: object expected");
                message.stride = $root.insole.GaitStat.fromObject(object.stride, long + 1);
            }
            if (object.strideHeight != null) {
                if (!$util.isObject(object.strideHeight))
                    throw TypeError(".insole.GaitSummary.strideHeight: object expected");
                message.strideHeight = $root.insole.GaitStat.fromObject(object.strideHeight, long + 1);
            }
            if (object.speed != null) {
                if (!$util.isObject(object.speed))
                    throw TypeError(".insole.GaitSummary.speed: object expected");
                message.speed = $root.insole.GaitStat.fromObject(object.speed, long + 1);
            }
            if (object.pronation != null) {
                if (!$util.isObject(object.pronation))
                    throw TypeError(".insole.GaitSummary.pronation: object expected");
                message.pronation = $root.insole.GaitStat.fromObject(object.pronation, long + 1);
            }
            if (object.strikeAngle != null) {
                if (!$util.isObject(object.strikeAngle))
                    throw TypeError(".insole.GaitSummary.strikeAngle: object expected");
                message.strikeAngle = $root.insole.GaitStat.fromObject(object.strikeAngle, long + 1);
            }
            if (object.cadence != null) {
                if (!$util.isObject(object.cadence))
                    throw TypeError(".insole.GaitSummary.cadence: object expected");
                message.cadence = $root.insole.GaitStat.fromObject(object.cadence, long + 1);
            }
            if (object.landingForce != null) {
                if (!$util.isObject(object.landingForce))
                    throw TypeError(".insole.GaitSummary.landingForce: object expected");
                message.landingForce = $root.insole.GaitStat.fromObject(object.landingForce, long + 1);
            }
            if (object.contactTime != null) {
                if (!$util.isObject(object.contactTime))
                    throw TypeError(".insole.GaitSummary.contactTime: object expected");
                message.contactTime = $root.insole.GaitStat.fromObject(object.contactTime, long + 1);
            }
            if (object.activityId != null)
                message.activityId = object.activityId >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a GaitSummary message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.GaitSummary
         * @static
         * @param {insole.GaitSummary} message GaitSummary
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GaitSummary.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.sessionId = 0;
                if ($util.Long) {
                    let long = new $util.Long(0, 0, true);
                    object.startMs = options.longs === String ? long.toString() : options.longs === Number ? long.toNumber() : typeof BigInt !== "undefined" && options.longs === BigInt ? long.toBigInt() : long;
                } else
                    object.startMs = options.longs === String ? "0" : typeof BigInt !== "undefined" && options.longs === BigInt ? BigInt("0") : 0;
                object.elapsedMs = 0;
                object.steps = 0;
                object.distanceM = 0;
                object.foot = options.enums === String ? "FOOT_UNSPECIFIED" : 0;
                object.stride = null;
                object.strideHeight = null;
                object.speed = null;
                object.pronation = null;
                object.strikeAngle = null;
                object.cadence = null;
                object.landingForce = null;
                object.contactTime = null;
                object.activityId = 0;
            }
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                object.sessionId = message.sessionId;
            if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs"))
                if (typeof BigInt !== "undefined" && options.longs === BigInt)
                    object.startMs = typeof message.startMs === "number" ? BigInt(message.startMs) : $util.Long.fromBits(message.startMs.low >>> 0, message.startMs.high >>> 0, true).toBigInt();
                else if (typeof message.startMs === "number")
                    object.startMs = options.longs === String ? String(message.startMs) : message.startMs;
                else
                    object.startMs = options.longs === String ? $util.Long.prototype.toString.call(message.startMs) : options.longs === Number ? new $util.LongBits(message.startMs.low >>> 0, message.startMs.high >>> 0).toNumber(true) : message.startMs;
            if (message.elapsedMs != null && Object.hasOwnProperty.call(message, "elapsedMs"))
                object.elapsedMs = message.elapsedMs;
            if (message.steps != null && Object.hasOwnProperty.call(message, "steps"))
                object.steps = message.steps;
            if (message.distanceM != null && Object.hasOwnProperty.call(message, "distanceM"))
                object.distanceM = options.json && !isFinite(message.distanceM) ? String(message.distanceM) : message.distanceM;
            if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
                object.foot = options.enums === String ? $root.insole.Foot[message.foot] === undefined ? message.foot : $root.insole.Foot[message.foot] : message.foot;
            if (message.stride != null && Object.hasOwnProperty.call(message, "stride"))
                object.stride = $root.insole.GaitStat.toObject(message.stride, options, q + 1);
            if (message.strideHeight != null && Object.hasOwnProperty.call(message, "strideHeight"))
                object.strideHeight = $root.insole.GaitStat.toObject(message.strideHeight, options, q + 1);
            if (message.speed != null && Object.hasOwnProperty.call(message, "speed"))
                object.speed = $root.insole.GaitStat.toObject(message.speed, options, q + 1);
            if (message.pronation != null && Object.hasOwnProperty.call(message, "pronation"))
                object.pronation = $root.insole.GaitStat.toObject(message.pronation, options, q + 1);
            if (message.strikeAngle != null && Object.hasOwnProperty.call(message, "strikeAngle"))
                object.strikeAngle = $root.insole.GaitStat.toObject(message.strikeAngle, options, q + 1);
            if (message.cadence != null && Object.hasOwnProperty.call(message, "cadence"))
                object.cadence = $root.insole.GaitStat.toObject(message.cadence, options, q + 1);
            if (message.landingForce != null && Object.hasOwnProperty.call(message, "landingForce"))
                object.landingForce = $root.insole.GaitStat.toObject(message.landingForce, options, q + 1);
            if (message.contactTime != null && Object.hasOwnProperty.call(message, "contactTime"))
                object.contactTime = $root.insole.GaitStat.toObject(message.contactTime, options, q + 1);
            if (message.activityId != null && Object.hasOwnProperty.call(message, "activityId"))
                object.activityId = message.activityId;
            return object;
        };

        /**
         * Converts this GaitSummary to JSON.
         * @function toJSON
         * @memberof insole.GaitSummary
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GaitSummary.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for GaitSummary
         * @function getTypeUrl
         * @memberof insole.GaitSummary
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        GaitSummary.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.GaitSummary";
        };

        return GaitSummary;
    })();

    insole.ReadLogRequest = (function() {

        /**
         * Properties of a ReadLogRequest.
         * @memberof insole
         * @interface IReadLogRequest
         * @property {number|null} [index] ReadLogRequest index
         */

        /**
         * Constructs a new ReadLogRequest.
         * @memberof insole
         * @classdesc Represents a ReadLogRequest.
         * @implements IReadLogRequest
         * @constructor
         * @param {insole.IReadLogRequest=} [properties] Properties to set
         */
        function ReadLogRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ReadLogRequest index.
         * @member {number} index
         * @memberof insole.ReadLogRequest
         * @instance
         */
        ReadLogRequest.prototype.index = 0;

        /**
         * Creates a new ReadLogRequest instance using the specified properties.
         * @function create
         * @memberof insole.ReadLogRequest
         * @static
         * @param {insole.IReadLogRequest=} [properties] Properties to set
         * @returns {insole.ReadLogRequest} ReadLogRequest instance
         */
        ReadLogRequest.create = function create(properties) {
            return new ReadLogRequest(properties);
        };

        /**
         * Encodes the specified ReadLogRequest message. Does not implicitly {@link insole.ReadLogRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.ReadLogRequest
         * @static
         * @param {insole.IReadLogRequest} message ReadLogRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ReadLogRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.index != null && Object.hasOwnProperty.call(message, "index"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.index);
            return writer;
        };

        /**
         * Encodes the specified ReadLogRequest message, length delimited. Does not implicitly {@link insole.ReadLogRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.ReadLogRequest
         * @static
         * @param {insole.IReadLogRequest} message ReadLogRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ReadLogRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a ReadLogRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.ReadLogRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.ReadLogRequest} ReadLogRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ReadLogRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.ReadLogRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.index = reader.uint32();
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
         * Decodes a ReadLogRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.ReadLogRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.ReadLogRequest} ReadLogRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ReadLogRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ReadLogRequest message.
         * @function verify
         * @memberof insole.ReadLogRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ReadLogRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.index != null && Object.hasOwnProperty.call(message, "index"))
                if (!$util.isInteger(message.index))
                    return "index: integer expected";
            return null;
        };

        /**
         * Creates a ReadLogRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.ReadLogRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.ReadLogRequest} ReadLogRequest
         */
        ReadLogRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.ReadLogRequest)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.ReadLogRequest: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.ReadLogRequest();
            if (object.index != null)
                message.index = object.index >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a ReadLogRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.ReadLogRequest
         * @static
         * @param {insole.ReadLogRequest} message ReadLogRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ReadLogRequest.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults)
                object.index = 0;
            if (message.index != null && Object.hasOwnProperty.call(message, "index"))
                object.index = message.index;
            return object;
        };

        /**
         * Converts this ReadLogRequest to JSON.
         * @function toJSON
         * @memberof insole.ReadLogRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ReadLogRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ReadLogRequest
         * @function getTypeUrl
         * @memberof insole.ReadLogRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ReadLogRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.ReadLogRequest";
        };

        return ReadLogRequest;
    })();

    insole.ReadLogResponse = (function() {

        /**
         * Properties of a ReadLogResponse.
         * @memberof insole
         * @interface IReadLogResponse
         * @property {boolean|null} [ok] ReadLogResponse ok
         * @property {number|null} [total] ReadLogResponse total
         * @property {insole.IGaitSummary|null} [summary] ReadLogResponse summary
         */

        /**
         * Constructs a new ReadLogResponse.
         * @memberof insole
         * @classdesc Represents a ReadLogResponse.
         * @implements IReadLogResponse
         * @constructor
         * @param {insole.IReadLogResponse=} [properties] Properties to set
         */
        function ReadLogResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ReadLogResponse ok.
         * @member {boolean} ok
         * @memberof insole.ReadLogResponse
         * @instance
         */
        ReadLogResponse.prototype.ok = false;

        /**
         * ReadLogResponse total.
         * @member {number} total
         * @memberof insole.ReadLogResponse
         * @instance
         */
        ReadLogResponse.prototype.total = 0;

        /**
         * ReadLogResponse summary.
         * @member {insole.IGaitSummary|null|undefined} summary
         * @memberof insole.ReadLogResponse
         * @instance
         */
        ReadLogResponse.prototype.summary = null;

        /**
         * Creates a new ReadLogResponse instance using the specified properties.
         * @function create
         * @memberof insole.ReadLogResponse
         * @static
         * @param {insole.IReadLogResponse=} [properties] Properties to set
         * @returns {insole.ReadLogResponse} ReadLogResponse instance
         */
        ReadLogResponse.create = function create(properties) {
            return new ReadLogResponse(properties);
        };

        /**
         * Encodes the specified ReadLogResponse message. Does not implicitly {@link insole.ReadLogResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.ReadLogResponse
         * @static
         * @param {insole.IReadLogResponse} message ReadLogResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ReadLogResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.ok);
            if (message.total != null && Object.hasOwnProperty.call(message, "total"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.total);
            if (message.summary != null && Object.hasOwnProperty.call(message, "summary"))
                $root.insole.GaitSummary.encode(message.summary, writer.uint32(/* id 3, wireType 2 =*/26).fork(), q + 1).ldelim();
            return writer;
        };

        /**
         * Encodes the specified ReadLogResponse message, length delimited. Does not implicitly {@link insole.ReadLogResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.ReadLogResponse
         * @static
         * @param {insole.IReadLogResponse} message ReadLogResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ReadLogResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a ReadLogResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.ReadLogResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.ReadLogResponse} ReadLogResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ReadLogResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.ReadLogResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.ok = reader.bool();
                        break;
                    }
                case 2: {
                        message.total = reader.uint32();
                        break;
                    }
                case 3: {
                        message.summary = $root.insole.GaitSummary.decode(reader, reader.uint32(), undefined, long + 1);
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
         * Decodes a ReadLogResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.ReadLogResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.ReadLogResponse} ReadLogResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ReadLogResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ReadLogResponse message.
         * @function verify
         * @memberof insole.ReadLogResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ReadLogResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                if (typeof message.ok !== "boolean")
                    return "ok: boolean expected";
            if (message.total != null && Object.hasOwnProperty.call(message, "total"))
                if (!$util.isInteger(message.total))
                    return "total: integer expected";
            if (message.summary != null && Object.hasOwnProperty.call(message, "summary")) {
                let error = $root.insole.GaitSummary.verify(message.summary, long + 1);
                if (error)
                    return "summary." + error;
            }
            return null;
        };

        /**
         * Creates a ReadLogResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.ReadLogResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.ReadLogResponse} ReadLogResponse
         */
        ReadLogResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.ReadLogResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.ReadLogResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.ReadLogResponse();
            if (object.ok != null)
                message.ok = Boolean(object.ok);
            if (object.total != null)
                message.total = object.total >>> 0;
            if (object.summary != null) {
                if (!$util.isObject(object.summary))
                    throw TypeError(".insole.ReadLogResponse.summary: object expected");
                message.summary = $root.insole.GaitSummary.fromObject(object.summary, long + 1);
            }
            return message;
        };

        /**
         * Creates a plain object from a ReadLogResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.ReadLogResponse
         * @static
         * @param {insole.ReadLogResponse} message ReadLogResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ReadLogResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.ok = false;
                object.total = 0;
                object.summary = null;
            }
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                object.ok = message.ok;
            if (message.total != null && Object.hasOwnProperty.call(message, "total"))
                object.total = message.total;
            if (message.summary != null && Object.hasOwnProperty.call(message, "summary"))
                object.summary = $root.insole.GaitSummary.toObject(message.summary, options, q + 1);
            return object;
        };

        /**
         * Converts this ReadLogResponse to JSON.
         * @function toJSON
         * @memberof insole.ReadLogResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ReadLogResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ReadLogResponse
         * @function getTypeUrl
         * @memberof insole.ReadLogResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ReadLogResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.ReadLogResponse";
        };

        return ReadLogResponse;
    })();

    insole.EraseLogsRequest = (function() {

        /**
         * Properties of an EraseLogsRequest.
         * @memberof insole
         * @interface IEraseLogsRequest
         */

        /**
         * Constructs a new EraseLogsRequest.
         * @memberof insole
         * @classdesc Represents an EraseLogsRequest.
         * @implements IEraseLogsRequest
         * @constructor
         * @param {insole.IEraseLogsRequest=} [properties] Properties to set
         */
        function EraseLogsRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new EraseLogsRequest instance using the specified properties.
         * @function create
         * @memberof insole.EraseLogsRequest
         * @static
         * @param {insole.IEraseLogsRequest=} [properties] Properties to set
         * @returns {insole.EraseLogsRequest} EraseLogsRequest instance
         */
        EraseLogsRequest.create = function create(properties) {
            return new EraseLogsRequest(properties);
        };

        /**
         * Encodes the specified EraseLogsRequest message. Does not implicitly {@link insole.EraseLogsRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.EraseLogsRequest
         * @static
         * @param {insole.IEraseLogsRequest} message EraseLogsRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EraseLogsRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            return writer;
        };

        /**
         * Encodes the specified EraseLogsRequest message, length delimited. Does not implicitly {@link insole.EraseLogsRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.EraseLogsRequest
         * @static
         * @param {insole.IEraseLogsRequest} message EraseLogsRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EraseLogsRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes an EraseLogsRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.EraseLogsRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.EraseLogsRequest} EraseLogsRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EraseLogsRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.EraseLogsRequest();
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
         * Decodes an EraseLogsRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.EraseLogsRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.EraseLogsRequest} EraseLogsRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EraseLogsRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an EraseLogsRequest message.
         * @function verify
         * @memberof insole.EraseLogsRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        EraseLogsRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            return null;
        };

        /**
         * Creates an EraseLogsRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.EraseLogsRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.EraseLogsRequest} EraseLogsRequest
         */
        EraseLogsRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.EraseLogsRequest)
                return object;
            return new $root.insole.EraseLogsRequest();
        };

        /**
         * Creates a plain object from an EraseLogsRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.EraseLogsRequest
         * @static
         * @param {insole.EraseLogsRequest} message EraseLogsRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        EraseLogsRequest.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this EraseLogsRequest to JSON.
         * @function toJSON
         * @memberof insole.EraseLogsRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        EraseLogsRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for EraseLogsRequest
         * @function getTypeUrl
         * @memberof insole.EraseLogsRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        EraseLogsRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.EraseLogsRequest";
        };

        return EraseLogsRequest;
    })();

    insole.EraseLogsResponse = (function() {

        /**
         * Properties of an EraseLogsResponse.
         * @memberof insole
         * @interface IEraseLogsResponse
         * @property {boolean|null} [ok] EraseLogsResponse ok
         */

        /**
         * Constructs a new EraseLogsResponse.
         * @memberof insole
         * @classdesc Represents an EraseLogsResponse.
         * @implements IEraseLogsResponse
         * @constructor
         * @param {insole.IEraseLogsResponse=} [properties] Properties to set
         */
        function EraseLogsResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * EraseLogsResponse ok.
         * @member {boolean} ok
         * @memberof insole.EraseLogsResponse
         * @instance
         */
        EraseLogsResponse.prototype.ok = false;

        /**
         * Creates a new EraseLogsResponse instance using the specified properties.
         * @function create
         * @memberof insole.EraseLogsResponse
         * @static
         * @param {insole.IEraseLogsResponse=} [properties] Properties to set
         * @returns {insole.EraseLogsResponse} EraseLogsResponse instance
         */
        EraseLogsResponse.create = function create(properties) {
            return new EraseLogsResponse(properties);
        };

        /**
         * Encodes the specified EraseLogsResponse message. Does not implicitly {@link insole.EraseLogsResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.EraseLogsResponse
         * @static
         * @param {insole.IEraseLogsResponse} message EraseLogsResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EraseLogsResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.ok);
            return writer;
        };

        /**
         * Encodes the specified EraseLogsResponse message, length delimited. Does not implicitly {@link insole.EraseLogsResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.EraseLogsResponse
         * @static
         * @param {insole.IEraseLogsResponse} message EraseLogsResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        EraseLogsResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes an EraseLogsResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.EraseLogsResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.EraseLogsResponse} EraseLogsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EraseLogsResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.EraseLogsResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.ok = reader.bool();
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
         * Decodes an EraseLogsResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.EraseLogsResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.EraseLogsResponse} EraseLogsResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        EraseLogsResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies an EraseLogsResponse message.
         * @function verify
         * @memberof insole.EraseLogsResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        EraseLogsResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                if (typeof message.ok !== "boolean")
                    return "ok: boolean expected";
            return null;
        };

        /**
         * Creates an EraseLogsResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.EraseLogsResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.EraseLogsResponse} EraseLogsResponse
         */
        EraseLogsResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.EraseLogsResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.EraseLogsResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.EraseLogsResponse();
            if (object.ok != null)
                message.ok = Boolean(object.ok);
            return message;
        };

        /**
         * Creates a plain object from an EraseLogsResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.EraseLogsResponse
         * @static
         * @param {insole.EraseLogsResponse} message EraseLogsResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        EraseLogsResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults)
                object.ok = false;
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                object.ok = message.ok;
            return object;
        };

        /**
         * Converts this EraseLogsResponse to JSON.
         * @function toJSON
         * @memberof insole.EraseLogsResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        EraseLogsResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for EraseLogsResponse
         * @function getTypeUrl
         * @memberof insole.EraseLogsResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        EraseLogsResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.EraseLogsResponse";
        };

        return EraseLogsResponse;
    })();

    insole.GaitStride = (function() {

        /**
         * Properties of a GaitStride.
         * @memberof insole
         * @interface IGaitStride
         * @property {number|null} [strideLength] GaitStride strideLength
         * @property {number|null} [strideHeight] GaitStride strideHeight
         * @property {number|null} [speed] GaitStride speed
         * @property {number|null} [pronation] GaitStride pronation
         * @property {number|null} [strikeAngle] GaitStride strikeAngle
         * @property {number|null} [cadence] GaitStride cadence
         * @property {number|null} [landingForce] GaitStride landingForce
         * @property {number|null} [contactTime] GaitStride contactTime
         * @property {number|null} [gaitType] GaitStride gaitType
         * @property {number|null} [footStrike] GaitStride footStrike
         */

        /**
         * Constructs a new GaitStride.
         * @memberof insole
         * @classdesc Represents a GaitStride.
         * @implements IGaitStride
         * @constructor
         * @param {insole.IGaitStride=} [properties] Properties to set
         */
        function GaitStride(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GaitStride strideLength.
         * @member {number} strideLength
         * @memberof insole.GaitStride
         * @instance
         */
        GaitStride.prototype.strideLength = 0;

        /**
         * GaitStride strideHeight.
         * @member {number} strideHeight
         * @memberof insole.GaitStride
         * @instance
         */
        GaitStride.prototype.strideHeight = 0;

        /**
         * GaitStride speed.
         * @member {number} speed
         * @memberof insole.GaitStride
         * @instance
         */
        GaitStride.prototype.speed = 0;

        /**
         * GaitStride pronation.
         * @member {number} pronation
         * @memberof insole.GaitStride
         * @instance
         */
        GaitStride.prototype.pronation = 0;

        /**
         * GaitStride strikeAngle.
         * @member {number} strikeAngle
         * @memberof insole.GaitStride
         * @instance
         */
        GaitStride.prototype.strikeAngle = 0;

        /**
         * GaitStride cadence.
         * @member {number} cadence
         * @memberof insole.GaitStride
         * @instance
         */
        GaitStride.prototype.cadence = 0;

        /**
         * GaitStride landingForce.
         * @member {number} landingForce
         * @memberof insole.GaitStride
         * @instance
         */
        GaitStride.prototype.landingForce = 0;

        /**
         * GaitStride contactTime.
         * @member {number} contactTime
         * @memberof insole.GaitStride
         * @instance
         */
        GaitStride.prototype.contactTime = 0;

        /**
         * GaitStride gaitType.
         * @member {number} gaitType
         * @memberof insole.GaitStride
         * @instance
         */
        GaitStride.prototype.gaitType = 0;

        /**
         * GaitStride footStrike.
         * @member {number} footStrike
         * @memberof insole.GaitStride
         * @instance
         */
        GaitStride.prototype.footStrike = 0;

        /**
         * Creates a new GaitStride instance using the specified properties.
         * @function create
         * @memberof insole.GaitStride
         * @static
         * @param {insole.IGaitStride=} [properties] Properties to set
         * @returns {insole.GaitStride} GaitStride instance
         */
        GaitStride.create = function create(properties) {
            return new GaitStride(properties);
        };

        /**
         * Encodes the specified GaitStride message. Does not implicitly {@link insole.GaitStride.verify|verify} messages.
         * @function encode
         * @memberof insole.GaitStride
         * @static
         * @param {insole.IGaitStride} message GaitStride message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GaitStride.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.strideLength != null && Object.hasOwnProperty.call(message, "strideLength"))
                writer.uint32(/* id 1, wireType 5 =*/13).float(message.strideLength);
            if (message.strideHeight != null && Object.hasOwnProperty.call(message, "strideHeight"))
                writer.uint32(/* id 2, wireType 5 =*/21).float(message.strideHeight);
            if (message.speed != null && Object.hasOwnProperty.call(message, "speed"))
                writer.uint32(/* id 3, wireType 5 =*/29).float(message.speed);
            if (message.pronation != null && Object.hasOwnProperty.call(message, "pronation"))
                writer.uint32(/* id 4, wireType 5 =*/37).float(message.pronation);
            if (message.strikeAngle != null && Object.hasOwnProperty.call(message, "strikeAngle"))
                writer.uint32(/* id 5, wireType 5 =*/45).float(message.strikeAngle);
            if (message.cadence != null && Object.hasOwnProperty.call(message, "cadence"))
                writer.uint32(/* id 6, wireType 5 =*/53).float(message.cadence);
            if (message.landingForce != null && Object.hasOwnProperty.call(message, "landingForce"))
                writer.uint32(/* id 7, wireType 5 =*/61).float(message.landingForce);
            if (message.contactTime != null && Object.hasOwnProperty.call(message, "contactTime"))
                writer.uint32(/* id 8, wireType 5 =*/69).float(message.contactTime);
            if (message.gaitType != null && Object.hasOwnProperty.call(message, "gaitType"))
                writer.uint32(/* id 9, wireType 0 =*/72).int32(message.gaitType);
            if (message.footStrike != null && Object.hasOwnProperty.call(message, "footStrike"))
                writer.uint32(/* id 10, wireType 0 =*/80).int32(message.footStrike);
            return writer;
        };

        /**
         * Encodes the specified GaitStride message, length delimited. Does not implicitly {@link insole.GaitStride.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.GaitStride
         * @static
         * @param {insole.IGaitStride} message GaitStride message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GaitStride.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a GaitStride message from the specified reader or buffer.
         * @function decode
         * @memberof insole.GaitStride
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.GaitStride} GaitStride
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GaitStride.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.GaitStride();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.strideLength = reader.float();
                        break;
                    }
                case 2: {
                        message.strideHeight = reader.float();
                        break;
                    }
                case 3: {
                        message.speed = reader.float();
                        break;
                    }
                case 4: {
                        message.pronation = reader.float();
                        break;
                    }
                case 5: {
                        message.strikeAngle = reader.float();
                        break;
                    }
                case 6: {
                        message.cadence = reader.float();
                        break;
                    }
                case 7: {
                        message.landingForce = reader.float();
                        break;
                    }
                case 8: {
                        message.contactTime = reader.float();
                        break;
                    }
                case 9: {
                        message.gaitType = reader.int32();
                        break;
                    }
                case 10: {
                        message.footStrike = reader.int32();
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
         * Decodes a GaitStride message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.GaitStride
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.GaitStride} GaitStride
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GaitStride.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GaitStride message.
         * @function verify
         * @memberof insole.GaitStride
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GaitStride.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.strideLength != null && Object.hasOwnProperty.call(message, "strideLength"))
                if (typeof message.strideLength !== "number")
                    return "strideLength: number expected";
            if (message.strideHeight != null && Object.hasOwnProperty.call(message, "strideHeight"))
                if (typeof message.strideHeight !== "number")
                    return "strideHeight: number expected";
            if (message.speed != null && Object.hasOwnProperty.call(message, "speed"))
                if (typeof message.speed !== "number")
                    return "speed: number expected";
            if (message.pronation != null && Object.hasOwnProperty.call(message, "pronation"))
                if (typeof message.pronation !== "number")
                    return "pronation: number expected";
            if (message.strikeAngle != null && Object.hasOwnProperty.call(message, "strikeAngle"))
                if (typeof message.strikeAngle !== "number")
                    return "strikeAngle: number expected";
            if (message.cadence != null && Object.hasOwnProperty.call(message, "cadence"))
                if (typeof message.cadence !== "number")
                    return "cadence: number expected";
            if (message.landingForce != null && Object.hasOwnProperty.call(message, "landingForce"))
                if (typeof message.landingForce !== "number")
                    return "landingForce: number expected";
            if (message.contactTime != null && Object.hasOwnProperty.call(message, "contactTime"))
                if (typeof message.contactTime !== "number")
                    return "contactTime: number expected";
            if (message.gaitType != null && Object.hasOwnProperty.call(message, "gaitType"))
                if (!$util.isInteger(message.gaitType))
                    return "gaitType: integer expected";
            if (message.footStrike != null && Object.hasOwnProperty.call(message, "footStrike"))
                if (!$util.isInteger(message.footStrike))
                    return "footStrike: integer expected";
            return null;
        };

        /**
         * Creates a GaitStride message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.GaitStride
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.GaitStride} GaitStride
         */
        GaitStride.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.GaitStride)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.GaitStride: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.GaitStride();
            if (object.strideLength != null)
                message.strideLength = Number(object.strideLength);
            if (object.strideHeight != null)
                message.strideHeight = Number(object.strideHeight);
            if (object.speed != null)
                message.speed = Number(object.speed);
            if (object.pronation != null)
                message.pronation = Number(object.pronation);
            if (object.strikeAngle != null)
                message.strikeAngle = Number(object.strikeAngle);
            if (object.cadence != null)
                message.cadence = Number(object.cadence);
            if (object.landingForce != null)
                message.landingForce = Number(object.landingForce);
            if (object.contactTime != null)
                message.contactTime = Number(object.contactTime);
            if (object.gaitType != null)
                message.gaitType = object.gaitType | 0;
            if (object.footStrike != null)
                message.footStrike = object.footStrike | 0;
            return message;
        };

        /**
         * Creates a plain object from a GaitStride message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.GaitStride
         * @static
         * @param {insole.GaitStride} message GaitStride
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GaitStride.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.strideLength = 0;
                object.strideHeight = 0;
                object.speed = 0;
                object.pronation = 0;
                object.strikeAngle = 0;
                object.cadence = 0;
                object.landingForce = 0;
                object.contactTime = 0;
                object.gaitType = 0;
                object.footStrike = 0;
            }
            if (message.strideLength != null && Object.hasOwnProperty.call(message, "strideLength"))
                object.strideLength = options.json && !isFinite(message.strideLength) ? String(message.strideLength) : message.strideLength;
            if (message.strideHeight != null && Object.hasOwnProperty.call(message, "strideHeight"))
                object.strideHeight = options.json && !isFinite(message.strideHeight) ? String(message.strideHeight) : message.strideHeight;
            if (message.speed != null && Object.hasOwnProperty.call(message, "speed"))
                object.speed = options.json && !isFinite(message.speed) ? String(message.speed) : message.speed;
            if (message.pronation != null && Object.hasOwnProperty.call(message, "pronation"))
                object.pronation = options.json && !isFinite(message.pronation) ? String(message.pronation) : message.pronation;
            if (message.strikeAngle != null && Object.hasOwnProperty.call(message, "strikeAngle"))
                object.strikeAngle = options.json && !isFinite(message.strikeAngle) ? String(message.strikeAngle) : message.strikeAngle;
            if (message.cadence != null && Object.hasOwnProperty.call(message, "cadence"))
                object.cadence = options.json && !isFinite(message.cadence) ? String(message.cadence) : message.cadence;
            if (message.landingForce != null && Object.hasOwnProperty.call(message, "landingForce"))
                object.landingForce = options.json && !isFinite(message.landingForce) ? String(message.landingForce) : message.landingForce;
            if (message.contactTime != null && Object.hasOwnProperty.call(message, "contactTime"))
                object.contactTime = options.json && !isFinite(message.contactTime) ? String(message.contactTime) : message.contactTime;
            if (message.gaitType != null && Object.hasOwnProperty.call(message, "gaitType"))
                object.gaitType = message.gaitType;
            if (message.footStrike != null && Object.hasOwnProperty.call(message, "footStrike"))
                object.footStrike = message.footStrike;
            return object;
        };

        /**
         * Converts this GaitStride to JSON.
         * @function toJSON
         * @memberof insole.GaitStride
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GaitStride.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for GaitStride
         * @function getTypeUrl
         * @memberof insole.GaitStride
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        GaitStride.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.GaitStride";
        };

        return GaitStride;
    })();

    insole.GetGaitLiveRequest = (function() {

        /**
         * Properties of a GetGaitLiveRequest.
         * @memberof insole
         * @interface IGetGaitLiveRequest
         */

        /**
         * Constructs a new GetGaitLiveRequest.
         * @memberof insole
         * @classdesc Represents a GetGaitLiveRequest.
         * @implements IGetGaitLiveRequest
         * @constructor
         * @param {insole.IGetGaitLiveRequest=} [properties] Properties to set
         */
        function GetGaitLiveRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new GetGaitLiveRequest instance using the specified properties.
         * @function create
         * @memberof insole.GetGaitLiveRequest
         * @static
         * @param {insole.IGetGaitLiveRequest=} [properties] Properties to set
         * @returns {insole.GetGaitLiveRequest} GetGaitLiveRequest instance
         */
        GetGaitLiveRequest.create = function create(properties) {
            return new GetGaitLiveRequest(properties);
        };

        /**
         * Encodes the specified GetGaitLiveRequest message. Does not implicitly {@link insole.GetGaitLiveRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.GetGaitLiveRequest
         * @static
         * @param {insole.IGetGaitLiveRequest} message GetGaitLiveRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetGaitLiveRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            return writer;
        };

        /**
         * Encodes the specified GetGaitLiveRequest message, length delimited. Does not implicitly {@link insole.GetGaitLiveRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.GetGaitLiveRequest
         * @static
         * @param {insole.IGetGaitLiveRequest} message GetGaitLiveRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetGaitLiveRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a GetGaitLiveRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.GetGaitLiveRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.GetGaitLiveRequest} GetGaitLiveRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetGaitLiveRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.GetGaitLiveRequest();
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
         * Decodes a GetGaitLiveRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.GetGaitLiveRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.GetGaitLiveRequest} GetGaitLiveRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetGaitLiveRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetGaitLiveRequest message.
         * @function verify
         * @memberof insole.GetGaitLiveRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetGaitLiveRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            return null;
        };

        /**
         * Creates a GetGaitLiveRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.GetGaitLiveRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.GetGaitLiveRequest} GetGaitLiveRequest
         */
        GetGaitLiveRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.GetGaitLiveRequest)
                return object;
            return new $root.insole.GetGaitLiveRequest();
        };

        /**
         * Creates a plain object from a GetGaitLiveRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.GetGaitLiveRequest
         * @static
         * @param {insole.GetGaitLiveRequest} message GetGaitLiveRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetGaitLiveRequest.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this GetGaitLiveRequest to JSON.
         * @function toJSON
         * @memberof insole.GetGaitLiveRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetGaitLiveRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for GetGaitLiveRequest
         * @function getTypeUrl
         * @memberof insole.GetGaitLiveRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        GetGaitLiveRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.GetGaitLiveRequest";
        };

        return GetGaitLiveRequest;
    })();

    insole.GetGaitLiveResponse = (function() {

        /**
         * Properties of a GetGaitLiveResponse.
         * @memberof insole
         * @interface IGetGaitLiveResponse
         * @property {boolean|null} [measuring] GetGaitLiveResponse measuring
         * @property {number|null} [sessionId] GetGaitLiveResponse sessionId
         * @property {number|null} [steps] GetGaitLiveResponse steps
         * @property {number|null} [distanceM] GetGaitLiveResponse distanceM
         * @property {number|null} [strideSeq] GetGaitLiveResponse strideSeq
         * @property {insole.IGaitStride|null} [last] GetGaitLiveResponse last
         */

        /**
         * Constructs a new GetGaitLiveResponse.
         * @memberof insole
         * @classdesc Represents a GetGaitLiveResponse.
         * @implements IGetGaitLiveResponse
         * @constructor
         * @param {insole.IGetGaitLiveResponse=} [properties] Properties to set
         */
        function GetGaitLiveResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GetGaitLiveResponse measuring.
         * @member {boolean} measuring
         * @memberof insole.GetGaitLiveResponse
         * @instance
         */
        GetGaitLiveResponse.prototype.measuring = false;

        /**
         * GetGaitLiveResponse sessionId.
         * @member {number} sessionId
         * @memberof insole.GetGaitLiveResponse
         * @instance
         */
        GetGaitLiveResponse.prototype.sessionId = 0;

        /**
         * GetGaitLiveResponse steps.
         * @member {number} steps
         * @memberof insole.GetGaitLiveResponse
         * @instance
         */
        GetGaitLiveResponse.prototype.steps = 0;

        /**
         * GetGaitLiveResponse distanceM.
         * @member {number} distanceM
         * @memberof insole.GetGaitLiveResponse
         * @instance
         */
        GetGaitLiveResponse.prototype.distanceM = 0;

        /**
         * GetGaitLiveResponse strideSeq.
         * @member {number} strideSeq
         * @memberof insole.GetGaitLiveResponse
         * @instance
         */
        GetGaitLiveResponse.prototype.strideSeq = 0;

        /**
         * GetGaitLiveResponse last.
         * @member {insole.IGaitStride|null|undefined} last
         * @memberof insole.GetGaitLiveResponse
         * @instance
         */
        GetGaitLiveResponse.prototype.last = null;

        /**
         * Creates a new GetGaitLiveResponse instance using the specified properties.
         * @function create
         * @memberof insole.GetGaitLiveResponse
         * @static
         * @param {insole.IGetGaitLiveResponse=} [properties] Properties to set
         * @returns {insole.GetGaitLiveResponse} GetGaitLiveResponse instance
         */
        GetGaitLiveResponse.create = function create(properties) {
            return new GetGaitLiveResponse(properties);
        };

        /**
         * Encodes the specified GetGaitLiveResponse message. Does not implicitly {@link insole.GetGaitLiveResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.GetGaitLiveResponse
         * @static
         * @param {insole.IGetGaitLiveResponse} message GetGaitLiveResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetGaitLiveResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.measuring != null && Object.hasOwnProperty.call(message, "measuring"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.measuring);
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.sessionId);
            if (message.steps != null && Object.hasOwnProperty.call(message, "steps"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.steps);
            if (message.distanceM != null && Object.hasOwnProperty.call(message, "distanceM"))
                writer.uint32(/* id 4, wireType 5 =*/37).float(message.distanceM);
            if (message.strideSeq != null && Object.hasOwnProperty.call(message, "strideSeq"))
                writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.strideSeq);
            if (message.last != null && Object.hasOwnProperty.call(message, "last"))
                $root.insole.GaitStride.encode(message.last, writer.uint32(/* id 6, wireType 2 =*/50).fork(), q + 1).ldelim();
            return writer;
        };

        /**
         * Encodes the specified GetGaitLiveResponse message, length delimited. Does not implicitly {@link insole.GetGaitLiveResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.GetGaitLiveResponse
         * @static
         * @param {insole.IGetGaitLiveResponse} message GetGaitLiveResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetGaitLiveResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a GetGaitLiveResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.GetGaitLiveResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.GetGaitLiveResponse} GetGaitLiveResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetGaitLiveResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.GetGaitLiveResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.measuring = reader.bool();
                        break;
                    }
                case 2: {
                        message.sessionId = reader.uint32();
                        break;
                    }
                case 3: {
                        message.steps = reader.uint32();
                        break;
                    }
                case 4: {
                        message.distanceM = reader.float();
                        break;
                    }
                case 5: {
                        message.strideSeq = reader.uint32();
                        break;
                    }
                case 6: {
                        message.last = $root.insole.GaitStride.decode(reader, reader.uint32(), undefined, long + 1);
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
         * Decodes a GetGaitLiveResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.GetGaitLiveResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.GetGaitLiveResponse} GetGaitLiveResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetGaitLiveResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetGaitLiveResponse message.
         * @function verify
         * @memberof insole.GetGaitLiveResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetGaitLiveResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.measuring != null && Object.hasOwnProperty.call(message, "measuring"))
                if (typeof message.measuring !== "boolean")
                    return "measuring: boolean expected";
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                if (!$util.isInteger(message.sessionId))
                    return "sessionId: integer expected";
            if (message.steps != null && Object.hasOwnProperty.call(message, "steps"))
                if (!$util.isInteger(message.steps))
                    return "steps: integer expected";
            if (message.distanceM != null && Object.hasOwnProperty.call(message, "distanceM"))
                if (typeof message.distanceM !== "number")
                    return "distanceM: number expected";
            if (message.strideSeq != null && Object.hasOwnProperty.call(message, "strideSeq"))
                if (!$util.isInteger(message.strideSeq))
                    return "strideSeq: integer expected";
            if (message.last != null && Object.hasOwnProperty.call(message, "last")) {
                let error = $root.insole.GaitStride.verify(message.last, long + 1);
                if (error)
                    return "last." + error;
            }
            return null;
        };

        /**
         * Creates a GetGaitLiveResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.GetGaitLiveResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.GetGaitLiveResponse} GetGaitLiveResponse
         */
        GetGaitLiveResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.GetGaitLiveResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.GetGaitLiveResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.GetGaitLiveResponse();
            if (object.measuring != null)
                message.measuring = Boolean(object.measuring);
            if (object.sessionId != null)
                message.sessionId = object.sessionId >>> 0;
            if (object.steps != null)
                message.steps = object.steps >>> 0;
            if (object.distanceM != null)
                message.distanceM = Number(object.distanceM);
            if (object.strideSeq != null)
                message.strideSeq = object.strideSeq >>> 0;
            if (object.last != null) {
                if (!$util.isObject(object.last))
                    throw TypeError(".insole.GetGaitLiveResponse.last: object expected");
                message.last = $root.insole.GaitStride.fromObject(object.last, long + 1);
            }
            return message;
        };

        /**
         * Creates a plain object from a GetGaitLiveResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.GetGaitLiveResponse
         * @static
         * @param {insole.GetGaitLiveResponse} message GetGaitLiveResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetGaitLiveResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.measuring = false;
                object.sessionId = 0;
                object.steps = 0;
                object.distanceM = 0;
                object.strideSeq = 0;
                object.last = null;
            }
            if (message.measuring != null && Object.hasOwnProperty.call(message, "measuring"))
                object.measuring = message.measuring;
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                object.sessionId = message.sessionId;
            if (message.steps != null && Object.hasOwnProperty.call(message, "steps"))
                object.steps = message.steps;
            if (message.distanceM != null && Object.hasOwnProperty.call(message, "distanceM"))
                object.distanceM = options.json && !isFinite(message.distanceM) ? String(message.distanceM) : message.distanceM;
            if (message.strideSeq != null && Object.hasOwnProperty.call(message, "strideSeq"))
                object.strideSeq = message.strideSeq;
            if (message.last != null && Object.hasOwnProperty.call(message, "last"))
                object.last = $root.insole.GaitStride.toObject(message.last, options, q + 1);
            return object;
        };

        /**
         * Converts this GetGaitLiveResponse to JSON.
         * @function toJSON
         * @memberof insole.GetGaitLiveResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetGaitLiveResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for GetGaitLiveResponse
         * @function getTypeUrl
         * @memberof insole.GetGaitLiveResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        GetGaitLiveResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.GetGaitLiveResponse";
        };

        return GetGaitLiveResponse;
    })();

    insole.ReadChunkRequest = (function() {

        /**
         * Properties of a ReadChunkRequest.
         * @memberof insole
         * @interface IReadChunkRequest
         * @property {number|null} [index] ReadChunkRequest index
         */

        /**
         * Constructs a new ReadChunkRequest.
         * @memberof insole
         * @classdesc Represents a ReadChunkRequest.
         * @implements IReadChunkRequest
         * @constructor
         * @param {insole.IReadChunkRequest=} [properties] Properties to set
         */
        function ReadChunkRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ReadChunkRequest index.
         * @member {number} index
         * @memberof insole.ReadChunkRequest
         * @instance
         */
        ReadChunkRequest.prototype.index = 0;

        /**
         * Creates a new ReadChunkRequest instance using the specified properties.
         * @function create
         * @memberof insole.ReadChunkRequest
         * @static
         * @param {insole.IReadChunkRequest=} [properties] Properties to set
         * @returns {insole.ReadChunkRequest} ReadChunkRequest instance
         */
        ReadChunkRequest.create = function create(properties) {
            return new ReadChunkRequest(properties);
        };

        /**
         * Encodes the specified ReadChunkRequest message. Does not implicitly {@link insole.ReadChunkRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.ReadChunkRequest
         * @static
         * @param {insole.IReadChunkRequest} message ReadChunkRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ReadChunkRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.index != null && Object.hasOwnProperty.call(message, "index"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.index);
            return writer;
        };

        /**
         * Encodes the specified ReadChunkRequest message, length delimited. Does not implicitly {@link insole.ReadChunkRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.ReadChunkRequest
         * @static
         * @param {insole.IReadChunkRequest} message ReadChunkRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ReadChunkRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a ReadChunkRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.ReadChunkRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.ReadChunkRequest} ReadChunkRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ReadChunkRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.ReadChunkRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.index = reader.uint32();
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
         * Decodes a ReadChunkRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.ReadChunkRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.ReadChunkRequest} ReadChunkRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ReadChunkRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ReadChunkRequest message.
         * @function verify
         * @memberof insole.ReadChunkRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ReadChunkRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.index != null && Object.hasOwnProperty.call(message, "index"))
                if (!$util.isInteger(message.index))
                    return "index: integer expected";
            return null;
        };

        /**
         * Creates a ReadChunkRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.ReadChunkRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.ReadChunkRequest} ReadChunkRequest
         */
        ReadChunkRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.ReadChunkRequest)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.ReadChunkRequest: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.ReadChunkRequest();
            if (object.index != null)
                message.index = object.index >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a ReadChunkRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.ReadChunkRequest
         * @static
         * @param {insole.ReadChunkRequest} message ReadChunkRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ReadChunkRequest.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults)
                object.index = 0;
            if (message.index != null && Object.hasOwnProperty.call(message, "index"))
                object.index = message.index;
            return object;
        };

        /**
         * Converts this ReadChunkRequest to JSON.
         * @function toJSON
         * @memberof insole.ReadChunkRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ReadChunkRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ReadChunkRequest
         * @function getTypeUrl
         * @memberof insole.ReadChunkRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ReadChunkRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.ReadChunkRequest";
        };

        return ReadChunkRequest;
    })();

    insole.ReadChunkResponse = (function() {

        /**
         * Properties of a ReadChunkResponse.
         * @memberof insole
         * @interface IReadChunkResponse
         * @property {boolean|null} [ok] ReadChunkResponse ok
         * @property {number|null} [total] ReadChunkResponse total
         * @property {insole.IGaitSummary|null} [summary] ReadChunkResponse summary
         */

        /**
         * Constructs a new ReadChunkResponse.
         * @memberof insole
         * @classdesc Represents a ReadChunkResponse.
         * @implements IReadChunkResponse
         * @constructor
         * @param {insole.IReadChunkResponse=} [properties] Properties to set
         */
        function ReadChunkResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ReadChunkResponse ok.
         * @member {boolean} ok
         * @memberof insole.ReadChunkResponse
         * @instance
         */
        ReadChunkResponse.prototype.ok = false;

        /**
         * ReadChunkResponse total.
         * @member {number} total
         * @memberof insole.ReadChunkResponse
         * @instance
         */
        ReadChunkResponse.prototype.total = 0;

        /**
         * ReadChunkResponse summary.
         * @member {insole.IGaitSummary|null|undefined} summary
         * @memberof insole.ReadChunkResponse
         * @instance
         */
        ReadChunkResponse.prototype.summary = null;

        /**
         * Creates a new ReadChunkResponse instance using the specified properties.
         * @function create
         * @memberof insole.ReadChunkResponse
         * @static
         * @param {insole.IReadChunkResponse=} [properties] Properties to set
         * @returns {insole.ReadChunkResponse} ReadChunkResponse instance
         */
        ReadChunkResponse.create = function create(properties) {
            return new ReadChunkResponse(properties);
        };

        /**
         * Encodes the specified ReadChunkResponse message. Does not implicitly {@link insole.ReadChunkResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.ReadChunkResponse
         * @static
         * @param {insole.IReadChunkResponse} message ReadChunkResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ReadChunkResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.ok);
            if (message.total != null && Object.hasOwnProperty.call(message, "total"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.total);
            if (message.summary != null && Object.hasOwnProperty.call(message, "summary"))
                $root.insole.GaitSummary.encode(message.summary, writer.uint32(/* id 3, wireType 2 =*/26).fork(), q + 1).ldelim();
            return writer;
        };

        /**
         * Encodes the specified ReadChunkResponse message, length delimited. Does not implicitly {@link insole.ReadChunkResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.ReadChunkResponse
         * @static
         * @param {insole.IReadChunkResponse} message ReadChunkResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ReadChunkResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a ReadChunkResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.ReadChunkResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.ReadChunkResponse} ReadChunkResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ReadChunkResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.ReadChunkResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.ok = reader.bool();
                        break;
                    }
                case 2: {
                        message.total = reader.uint32();
                        break;
                    }
                case 3: {
                        message.summary = $root.insole.GaitSummary.decode(reader, reader.uint32(), undefined, long + 1);
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
         * Decodes a ReadChunkResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.ReadChunkResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.ReadChunkResponse} ReadChunkResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ReadChunkResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ReadChunkResponse message.
         * @function verify
         * @memberof insole.ReadChunkResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ReadChunkResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                if (typeof message.ok !== "boolean")
                    return "ok: boolean expected";
            if (message.total != null && Object.hasOwnProperty.call(message, "total"))
                if (!$util.isInteger(message.total))
                    return "total: integer expected";
            if (message.summary != null && Object.hasOwnProperty.call(message, "summary")) {
                let error = $root.insole.GaitSummary.verify(message.summary, long + 1);
                if (error)
                    return "summary." + error;
            }
            return null;
        };

        /**
         * Creates a ReadChunkResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.ReadChunkResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.ReadChunkResponse} ReadChunkResponse
         */
        ReadChunkResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.ReadChunkResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.ReadChunkResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.ReadChunkResponse();
            if (object.ok != null)
                message.ok = Boolean(object.ok);
            if (object.total != null)
                message.total = object.total >>> 0;
            if (object.summary != null) {
                if (!$util.isObject(object.summary))
                    throw TypeError(".insole.ReadChunkResponse.summary: object expected");
                message.summary = $root.insole.GaitSummary.fromObject(object.summary, long + 1);
            }
            return message;
        };

        /**
         * Creates a plain object from a ReadChunkResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.ReadChunkResponse
         * @static
         * @param {insole.ReadChunkResponse} message ReadChunkResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ReadChunkResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.ok = false;
                object.total = 0;
                object.summary = null;
            }
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                object.ok = message.ok;
            if (message.total != null && Object.hasOwnProperty.call(message, "total"))
                object.total = message.total;
            if (message.summary != null && Object.hasOwnProperty.call(message, "summary"))
                object.summary = $root.insole.GaitSummary.toObject(message.summary, options, q + 1);
            return object;
        };

        /**
         * Converts this ReadChunkResponse to JSON.
         * @function toJSON
         * @memberof insole.ReadChunkResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ReadChunkResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ReadChunkResponse
         * @function getTypeUrl
         * @memberof insole.ReadChunkResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ReadChunkResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.ReadChunkResponse";
        };

        return ReadChunkResponse;
    })();

    insole.GaitEvent = (function() {

        /**
         * Properties of a GaitEvent.
         * @memberof insole
         * @interface IGaitEvent
         * @property {number|null} [sessionId] GaitEvent sessionId
         * @property {number|null} [tRelMs] GaitEvent tRelMs
         * @property {number|null} [seq] GaitEvent seq
         * @property {number|null} [type] GaitEvent type
         * @property {number|null} [footStrike] GaitEvent footStrike
         * @property {number|null} [value] GaitEvent value
         */

        /**
         * Constructs a new GaitEvent.
         * @memberof insole
         * @classdesc Represents a GaitEvent.
         * @implements IGaitEvent
         * @constructor
         * @param {insole.IGaitEvent=} [properties] Properties to set
         */
        function GaitEvent(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GaitEvent sessionId.
         * @member {number} sessionId
         * @memberof insole.GaitEvent
         * @instance
         */
        GaitEvent.prototype.sessionId = 0;

        /**
         * GaitEvent tRelMs.
         * @member {number} tRelMs
         * @memberof insole.GaitEvent
         * @instance
         */
        GaitEvent.prototype.tRelMs = 0;

        /**
         * GaitEvent seq.
         * @member {number} seq
         * @memberof insole.GaitEvent
         * @instance
         */
        GaitEvent.prototype.seq = 0;

        /**
         * GaitEvent type.
         * @member {number} type
         * @memberof insole.GaitEvent
         * @instance
         */
        GaitEvent.prototype.type = 0;

        /**
         * GaitEvent footStrike.
         * @member {number} footStrike
         * @memberof insole.GaitEvent
         * @instance
         */
        GaitEvent.prototype.footStrike = 0;

        /**
         * GaitEvent value.
         * @member {number} value
         * @memberof insole.GaitEvent
         * @instance
         */
        GaitEvent.prototype.value = 0;

        /**
         * Creates a new GaitEvent instance using the specified properties.
         * @function create
         * @memberof insole.GaitEvent
         * @static
         * @param {insole.IGaitEvent=} [properties] Properties to set
         * @returns {insole.GaitEvent} GaitEvent instance
         */
        GaitEvent.create = function create(properties) {
            return new GaitEvent(properties);
        };

        /**
         * Encodes the specified GaitEvent message. Does not implicitly {@link insole.GaitEvent.verify|verify} messages.
         * @function encode
         * @memberof insole.GaitEvent
         * @static
         * @param {insole.IGaitEvent} message GaitEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GaitEvent.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.sessionId);
            if (message.tRelMs != null && Object.hasOwnProperty.call(message, "tRelMs"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.tRelMs);
            if (message.seq != null && Object.hasOwnProperty.call(message, "seq"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.seq);
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.type);
            if (message.footStrike != null && Object.hasOwnProperty.call(message, "footStrike"))
                writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.footStrike);
            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                writer.uint32(/* id 6, wireType 5 =*/53).float(message.value);
            return writer;
        };

        /**
         * Encodes the specified GaitEvent message, length delimited. Does not implicitly {@link insole.GaitEvent.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.GaitEvent
         * @static
         * @param {insole.IGaitEvent} message GaitEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GaitEvent.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a GaitEvent message from the specified reader or buffer.
         * @function decode
         * @memberof insole.GaitEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.GaitEvent} GaitEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GaitEvent.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.GaitEvent();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.sessionId = reader.uint32();
                        break;
                    }
                case 2: {
                        message.tRelMs = reader.uint32();
                        break;
                    }
                case 3: {
                        message.seq = reader.uint32();
                        break;
                    }
                case 4: {
                        message.type = reader.uint32();
                        break;
                    }
                case 5: {
                        message.footStrike = reader.uint32();
                        break;
                    }
                case 6: {
                        message.value = reader.float();
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
         * Decodes a GaitEvent message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.GaitEvent
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.GaitEvent} GaitEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GaitEvent.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GaitEvent message.
         * @function verify
         * @memberof insole.GaitEvent
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GaitEvent.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                if (!$util.isInteger(message.sessionId))
                    return "sessionId: integer expected";
            if (message.tRelMs != null && Object.hasOwnProperty.call(message, "tRelMs"))
                if (!$util.isInteger(message.tRelMs))
                    return "tRelMs: integer expected";
            if (message.seq != null && Object.hasOwnProperty.call(message, "seq"))
                if (!$util.isInteger(message.seq))
                    return "seq: integer expected";
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                if (!$util.isInteger(message.type))
                    return "type: integer expected";
            if (message.footStrike != null && Object.hasOwnProperty.call(message, "footStrike"))
                if (!$util.isInteger(message.footStrike))
                    return "footStrike: integer expected";
            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                if (typeof message.value !== "number")
                    return "value: number expected";
            return null;
        };

        /**
         * Creates a GaitEvent message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.GaitEvent
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.GaitEvent} GaitEvent
         */
        GaitEvent.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.GaitEvent)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.GaitEvent: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.GaitEvent();
            if (object.sessionId != null)
                message.sessionId = object.sessionId >>> 0;
            if (object.tRelMs != null)
                message.tRelMs = object.tRelMs >>> 0;
            if (object.seq != null)
                message.seq = object.seq >>> 0;
            if (object.type != null)
                message.type = object.type >>> 0;
            if (object.footStrike != null)
                message.footStrike = object.footStrike >>> 0;
            if (object.value != null)
                message.value = Number(object.value);
            return message;
        };

        /**
         * Creates a plain object from a GaitEvent message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.GaitEvent
         * @static
         * @param {insole.GaitEvent} message GaitEvent
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GaitEvent.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.sessionId = 0;
                object.tRelMs = 0;
                object.seq = 0;
                object.type = 0;
                object.footStrike = 0;
                object.value = 0;
            }
            if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
                object.sessionId = message.sessionId;
            if (message.tRelMs != null && Object.hasOwnProperty.call(message, "tRelMs"))
                object.tRelMs = message.tRelMs;
            if (message.seq != null && Object.hasOwnProperty.call(message, "seq"))
                object.seq = message.seq;
            if (message.type != null && Object.hasOwnProperty.call(message, "type"))
                object.type = message.type;
            if (message.footStrike != null && Object.hasOwnProperty.call(message, "footStrike"))
                object.footStrike = message.footStrike;
            if (message.value != null && Object.hasOwnProperty.call(message, "value"))
                object.value = options.json && !isFinite(message.value) ? String(message.value) : message.value;
            return object;
        };

        /**
         * Converts this GaitEvent to JSON.
         * @function toJSON
         * @memberof insole.GaitEvent
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GaitEvent.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for GaitEvent
         * @function getTypeUrl
         * @memberof insole.GaitEvent
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        GaitEvent.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.GaitEvent";
        };

        return GaitEvent;
    })();

    insole.ReadEventRequest = (function() {

        /**
         * Properties of a ReadEventRequest.
         * @memberof insole
         * @interface IReadEventRequest
         * @property {number|null} [index] ReadEventRequest index
         */

        /**
         * Constructs a new ReadEventRequest.
         * @memberof insole
         * @classdesc Represents a ReadEventRequest.
         * @implements IReadEventRequest
         * @constructor
         * @param {insole.IReadEventRequest=} [properties] Properties to set
         */
        function ReadEventRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ReadEventRequest index.
         * @member {number} index
         * @memberof insole.ReadEventRequest
         * @instance
         */
        ReadEventRequest.prototype.index = 0;

        /**
         * Creates a new ReadEventRequest instance using the specified properties.
         * @function create
         * @memberof insole.ReadEventRequest
         * @static
         * @param {insole.IReadEventRequest=} [properties] Properties to set
         * @returns {insole.ReadEventRequest} ReadEventRequest instance
         */
        ReadEventRequest.create = function create(properties) {
            return new ReadEventRequest(properties);
        };

        /**
         * Encodes the specified ReadEventRequest message. Does not implicitly {@link insole.ReadEventRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.ReadEventRequest
         * @static
         * @param {insole.IReadEventRequest} message ReadEventRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ReadEventRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.index != null && Object.hasOwnProperty.call(message, "index"))
                writer.uint32(/* id 1, wireType 0 =*/8).uint32(message.index);
            return writer;
        };

        /**
         * Encodes the specified ReadEventRequest message, length delimited. Does not implicitly {@link insole.ReadEventRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.ReadEventRequest
         * @static
         * @param {insole.IReadEventRequest} message ReadEventRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ReadEventRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a ReadEventRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.ReadEventRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.ReadEventRequest} ReadEventRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ReadEventRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.ReadEventRequest();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.index = reader.uint32();
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
         * Decodes a ReadEventRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.ReadEventRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.ReadEventRequest} ReadEventRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ReadEventRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ReadEventRequest message.
         * @function verify
         * @memberof insole.ReadEventRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ReadEventRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.index != null && Object.hasOwnProperty.call(message, "index"))
                if (!$util.isInteger(message.index))
                    return "index: integer expected";
            return null;
        };

        /**
         * Creates a ReadEventRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.ReadEventRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.ReadEventRequest} ReadEventRequest
         */
        ReadEventRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.ReadEventRequest)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.ReadEventRequest: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.ReadEventRequest();
            if (object.index != null)
                message.index = object.index >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a ReadEventRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.ReadEventRequest
         * @static
         * @param {insole.ReadEventRequest} message ReadEventRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ReadEventRequest.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults)
                object.index = 0;
            if (message.index != null && Object.hasOwnProperty.call(message, "index"))
                object.index = message.index;
            return object;
        };

        /**
         * Converts this ReadEventRequest to JSON.
         * @function toJSON
         * @memberof insole.ReadEventRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ReadEventRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ReadEventRequest
         * @function getTypeUrl
         * @memberof insole.ReadEventRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ReadEventRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.ReadEventRequest";
        };

        return ReadEventRequest;
    })();

    insole.ReadEventResponse = (function() {

        /**
         * Properties of a ReadEventResponse.
         * @memberof insole
         * @interface IReadEventResponse
         * @property {boolean|null} [ok] ReadEventResponse ok
         * @property {number|null} [total] ReadEventResponse total
         * @property {insole.IGaitEvent|null} [event] ReadEventResponse event
         */

        /**
         * Constructs a new ReadEventResponse.
         * @memberof insole
         * @classdesc Represents a ReadEventResponse.
         * @implements IReadEventResponse
         * @constructor
         * @param {insole.IReadEventResponse=} [properties] Properties to set
         */
        function ReadEventResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * ReadEventResponse ok.
         * @member {boolean} ok
         * @memberof insole.ReadEventResponse
         * @instance
         */
        ReadEventResponse.prototype.ok = false;

        /**
         * ReadEventResponse total.
         * @member {number} total
         * @memberof insole.ReadEventResponse
         * @instance
         */
        ReadEventResponse.prototype.total = 0;

        /**
         * ReadEventResponse event.
         * @member {insole.IGaitEvent|null|undefined} event
         * @memberof insole.ReadEventResponse
         * @instance
         */
        ReadEventResponse.prototype.event = null;

        /**
         * Creates a new ReadEventResponse instance using the specified properties.
         * @function create
         * @memberof insole.ReadEventResponse
         * @static
         * @param {insole.IReadEventResponse=} [properties] Properties to set
         * @returns {insole.ReadEventResponse} ReadEventResponse instance
         */
        ReadEventResponse.create = function create(properties) {
            return new ReadEventResponse(properties);
        };

        /**
         * Encodes the specified ReadEventResponse message. Does not implicitly {@link insole.ReadEventResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.ReadEventResponse
         * @static
         * @param {insole.IReadEventResponse} message ReadEventResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ReadEventResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.ok);
            if (message.total != null && Object.hasOwnProperty.call(message, "total"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.total);
            if (message.event != null && Object.hasOwnProperty.call(message, "event"))
                $root.insole.GaitEvent.encode(message.event, writer.uint32(/* id 3, wireType 2 =*/26).fork(), q + 1).ldelim();
            return writer;
        };

        /**
         * Encodes the specified ReadEventResponse message, length delimited. Does not implicitly {@link insole.ReadEventResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.ReadEventResponse
         * @static
         * @param {insole.IReadEventResponse} message ReadEventResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        ReadEventResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a ReadEventResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.ReadEventResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.ReadEventResponse} ReadEventResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ReadEventResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.ReadEventResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.ok = reader.bool();
                        break;
                    }
                case 2: {
                        message.total = reader.uint32();
                        break;
                    }
                case 3: {
                        message.event = $root.insole.GaitEvent.decode(reader, reader.uint32(), undefined, long + 1);
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
         * Decodes a ReadEventResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.ReadEventResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.ReadEventResponse} ReadEventResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        ReadEventResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a ReadEventResponse message.
         * @function verify
         * @memberof insole.ReadEventResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        ReadEventResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                if (typeof message.ok !== "boolean")
                    return "ok: boolean expected";
            if (message.total != null && Object.hasOwnProperty.call(message, "total"))
                if (!$util.isInteger(message.total))
                    return "total: integer expected";
            if (message.event != null && Object.hasOwnProperty.call(message, "event")) {
                let error = $root.insole.GaitEvent.verify(message.event, long + 1);
                if (error)
                    return "event." + error;
            }
            return null;
        };

        /**
         * Creates a ReadEventResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.ReadEventResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.ReadEventResponse} ReadEventResponse
         */
        ReadEventResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.ReadEventResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.ReadEventResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.ReadEventResponse();
            if (object.ok != null)
                message.ok = Boolean(object.ok);
            if (object.total != null)
                message.total = object.total >>> 0;
            if (object.event != null) {
                if (!$util.isObject(object.event))
                    throw TypeError(".insole.ReadEventResponse.event: object expected");
                message.event = $root.insole.GaitEvent.fromObject(object.event, long + 1);
            }
            return message;
        };

        /**
         * Creates a plain object from a ReadEventResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.ReadEventResponse
         * @static
         * @param {insole.ReadEventResponse} message ReadEventResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        ReadEventResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.ok = false;
                object.total = 0;
                object.event = null;
            }
            if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
                object.ok = message.ok;
            if (message.total != null && Object.hasOwnProperty.call(message, "total"))
                object.total = message.total;
            if (message.event != null && Object.hasOwnProperty.call(message, "event"))
                object.event = $root.insole.GaitEvent.toObject(message.event, options, q + 1);
            return object;
        };

        /**
         * Converts this ReadEventResponse to JSON.
         * @function toJSON
         * @memberof insole.ReadEventResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        ReadEventResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for ReadEventResponse
         * @function getTypeUrl
         * @memberof insole.ReadEventResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        ReadEventResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.ReadEventResponse";
        };

        return ReadEventResponse;
    })();

    insole.GetFaultLogRequest = (function() {

        /**
         * Properties of a GetFaultLogRequest.
         * @memberof insole
         * @interface IGetFaultLogRequest
         */

        /**
         * Constructs a new GetFaultLogRequest.
         * @memberof insole
         * @classdesc Represents a GetFaultLogRequest.
         * @implements IGetFaultLogRequest
         * @constructor
         * @param {insole.IGetFaultLogRequest=} [properties] Properties to set
         */
        function GetFaultLogRequest(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * Creates a new GetFaultLogRequest instance using the specified properties.
         * @function create
         * @memberof insole.GetFaultLogRequest
         * @static
         * @param {insole.IGetFaultLogRequest=} [properties] Properties to set
         * @returns {insole.GetFaultLogRequest} GetFaultLogRequest instance
         */
        GetFaultLogRequest.create = function create(properties) {
            return new GetFaultLogRequest(properties);
        };

        /**
         * Encodes the specified GetFaultLogRequest message. Does not implicitly {@link insole.GetFaultLogRequest.verify|verify} messages.
         * @function encode
         * @memberof insole.GetFaultLogRequest
         * @static
         * @param {insole.IGetFaultLogRequest} message GetFaultLogRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetFaultLogRequest.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            return writer;
        };

        /**
         * Encodes the specified GetFaultLogRequest message, length delimited. Does not implicitly {@link insole.GetFaultLogRequest.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.GetFaultLogRequest
         * @static
         * @param {insole.IGetFaultLogRequest} message GetFaultLogRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetFaultLogRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a GetFaultLogRequest message from the specified reader or buffer.
         * @function decode
         * @memberof insole.GetFaultLogRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.GetFaultLogRequest} GetFaultLogRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetFaultLogRequest.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.GetFaultLogRequest();
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
         * Decodes a GetFaultLogRequest message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.GetFaultLogRequest
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.GetFaultLogRequest} GetFaultLogRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetFaultLogRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetFaultLogRequest message.
         * @function verify
         * @memberof insole.GetFaultLogRequest
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetFaultLogRequest.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            return null;
        };

        /**
         * Creates a GetFaultLogRequest message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.GetFaultLogRequest
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.GetFaultLogRequest} GetFaultLogRequest
         */
        GetFaultLogRequest.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.GetFaultLogRequest)
                return object;
            return new $root.insole.GetFaultLogRequest();
        };

        /**
         * Creates a plain object from a GetFaultLogRequest message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.GetFaultLogRequest
         * @static
         * @param {insole.GetFaultLogRequest} message GetFaultLogRequest
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetFaultLogRequest.toObject = function toObject() {
            return {};
        };

        /**
         * Converts this GetFaultLogRequest to JSON.
         * @function toJSON
         * @memberof insole.GetFaultLogRequest
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetFaultLogRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for GetFaultLogRequest
         * @function getTypeUrl
         * @memberof insole.GetFaultLogRequest
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        GetFaultLogRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.GetFaultLogRequest";
        };

        return GetFaultLogRequest;
    })();

    insole.GetFaultLogResponse = (function() {

        /**
         * Properties of a GetFaultLogResponse.
         * @memberof insole
         * @interface IGetFaultLogResponse
         * @property {boolean|null} [valid] GetFaultLogResponse valid
         * @property {number|null} [bootCount] GetFaultLogResponse bootCount
         * @property {number|null} [faultCount] GetFaultLogResponse faultCount
         * @property {number|null} [softCount] GetFaultLogResponse softCount
         * @property {number|null} [fatalReason] GetFaultLogResponse fatalReason
         * @property {number|null} [fatalPc] GetFaultLogResponse fatalPc
         * @property {number|null} [fatalLr] GetFaultLogResponse fatalLr
         * @property {number|null} [fatalUptimeMs] GetFaultLogResponse fatalUptimeMs
         * @property {string|null} [fatalThread] GetFaultLogResponse fatalThread
         * @property {string|null} [fatalDetail] GetFaultLogResponse fatalDetail
         * @property {number|null} [softReason] GetFaultLogResponse softReason
         * @property {number|null} [softExtra] GetFaultLogResponse softExtra
         * @property {number|null} [softUptimeMs] GetFaultLogResponse softUptimeMs
         * @property {string|null} [softThread] GetFaultLogResponse softThread
         * @property {string|null} [softDetail] GetFaultLogResponse softDetail
         * @property {number|null} [samplerStackFree] GetFaultLogResponse samplerStackFree
         * @property {number|null} [gaitUpdateMaxUs] GetFaultLogResponse gaitUpdateMaxUs
         * @property {number|null} [gaitFlushMaxMs] GetFaultLogResponse gaitFlushMaxMs
         * @property {number|null} [resetCause] GetFaultLogResponse resetCause
         * @property {number|null} [samplesDropped] GetFaultLogResponse samplesDropped
         */

        /**
         * Constructs a new GetFaultLogResponse.
         * @memberof insole
         * @classdesc Represents a GetFaultLogResponse.
         * @implements IGetFaultLogResponse
         * @constructor
         * @param {insole.IGetFaultLogResponse=} [properties] Properties to set
         */
        function GetFaultLogResponse(properties) {
            if (properties)
                for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null && keys[i] !== "__proto__")
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * GetFaultLogResponse valid.
         * @member {boolean} valid
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.valid = false;

        /**
         * GetFaultLogResponse bootCount.
         * @member {number} bootCount
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.bootCount = 0;

        /**
         * GetFaultLogResponse faultCount.
         * @member {number} faultCount
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.faultCount = 0;

        /**
         * GetFaultLogResponse softCount.
         * @member {number} softCount
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.softCount = 0;

        /**
         * GetFaultLogResponse fatalReason.
         * @member {number} fatalReason
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.fatalReason = 0;

        /**
         * GetFaultLogResponse fatalPc.
         * @member {number} fatalPc
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.fatalPc = 0;

        /**
         * GetFaultLogResponse fatalLr.
         * @member {number} fatalLr
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.fatalLr = 0;

        /**
         * GetFaultLogResponse fatalUptimeMs.
         * @member {number} fatalUptimeMs
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.fatalUptimeMs = 0;

        /**
         * GetFaultLogResponse fatalThread.
         * @member {string} fatalThread
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.fatalThread = "";

        /**
         * GetFaultLogResponse fatalDetail.
         * @member {string} fatalDetail
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.fatalDetail = "";

        /**
         * GetFaultLogResponse softReason.
         * @member {number} softReason
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.softReason = 0;

        /**
         * GetFaultLogResponse softExtra.
         * @member {number} softExtra
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.softExtra = 0;

        /**
         * GetFaultLogResponse softUptimeMs.
         * @member {number} softUptimeMs
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.softUptimeMs = 0;

        /**
         * GetFaultLogResponse softThread.
         * @member {string} softThread
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.softThread = "";

        /**
         * GetFaultLogResponse softDetail.
         * @member {string} softDetail
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.softDetail = "";

        /**
         * GetFaultLogResponse samplerStackFree.
         * @member {number} samplerStackFree
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.samplerStackFree = 0;

        /**
         * GetFaultLogResponse gaitUpdateMaxUs.
         * @member {number} gaitUpdateMaxUs
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.gaitUpdateMaxUs = 0;

        /**
         * GetFaultLogResponse gaitFlushMaxMs.
         * @member {number} gaitFlushMaxMs
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.gaitFlushMaxMs = 0;

        /**
         * GetFaultLogResponse resetCause.
         * @member {number} resetCause
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.resetCause = 0;

        /**
         * GetFaultLogResponse samplesDropped.
         * @member {number} samplesDropped
         * @memberof insole.GetFaultLogResponse
         * @instance
         */
        GetFaultLogResponse.prototype.samplesDropped = 0;

        /**
         * Creates a new GetFaultLogResponse instance using the specified properties.
         * @function create
         * @memberof insole.GetFaultLogResponse
         * @static
         * @param {insole.IGetFaultLogResponse=} [properties] Properties to set
         * @returns {insole.GetFaultLogResponse} GetFaultLogResponse instance
         */
        GetFaultLogResponse.create = function create(properties) {
            return new GetFaultLogResponse(properties);
        };

        /**
         * Encodes the specified GetFaultLogResponse message. Does not implicitly {@link insole.GetFaultLogResponse.verify|verify} messages.
         * @function encode
         * @memberof insole.GetFaultLogResponse
         * @static
         * @param {insole.IGetFaultLogResponse} message GetFaultLogResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetFaultLogResponse.encode = function encode(message, writer, q) {
            if (!writer)
                writer = $Writer.create();
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            if (message.valid != null && Object.hasOwnProperty.call(message, "valid"))
                writer.uint32(/* id 1, wireType 0 =*/8).bool(message.valid);
            if (message.bootCount != null && Object.hasOwnProperty.call(message, "bootCount"))
                writer.uint32(/* id 2, wireType 0 =*/16).uint32(message.bootCount);
            if (message.faultCount != null && Object.hasOwnProperty.call(message, "faultCount"))
                writer.uint32(/* id 3, wireType 0 =*/24).uint32(message.faultCount);
            if (message.softCount != null && Object.hasOwnProperty.call(message, "softCount"))
                writer.uint32(/* id 4, wireType 0 =*/32).uint32(message.softCount);
            if (message.fatalReason != null && Object.hasOwnProperty.call(message, "fatalReason"))
                writer.uint32(/* id 5, wireType 0 =*/40).uint32(message.fatalReason);
            if (message.fatalPc != null && Object.hasOwnProperty.call(message, "fatalPc"))
                writer.uint32(/* id 6, wireType 0 =*/48).uint32(message.fatalPc);
            if (message.fatalLr != null && Object.hasOwnProperty.call(message, "fatalLr"))
                writer.uint32(/* id 7, wireType 0 =*/56).uint32(message.fatalLr);
            if (message.fatalUptimeMs != null && Object.hasOwnProperty.call(message, "fatalUptimeMs"))
                writer.uint32(/* id 8, wireType 0 =*/64).uint32(message.fatalUptimeMs);
            if (message.fatalThread != null && Object.hasOwnProperty.call(message, "fatalThread"))
                writer.uint32(/* id 9, wireType 2 =*/74).string(message.fatalThread);
            if (message.fatalDetail != null && Object.hasOwnProperty.call(message, "fatalDetail"))
                writer.uint32(/* id 10, wireType 2 =*/82).string(message.fatalDetail);
            if (message.softReason != null && Object.hasOwnProperty.call(message, "softReason"))
                writer.uint32(/* id 11, wireType 0 =*/88).uint32(message.softReason);
            if (message.softExtra != null && Object.hasOwnProperty.call(message, "softExtra"))
                writer.uint32(/* id 12, wireType 0 =*/96).uint32(message.softExtra);
            if (message.softUptimeMs != null && Object.hasOwnProperty.call(message, "softUptimeMs"))
                writer.uint32(/* id 13, wireType 0 =*/104).uint32(message.softUptimeMs);
            if (message.softThread != null && Object.hasOwnProperty.call(message, "softThread"))
                writer.uint32(/* id 14, wireType 2 =*/114).string(message.softThread);
            if (message.softDetail != null && Object.hasOwnProperty.call(message, "softDetail"))
                writer.uint32(/* id 15, wireType 2 =*/122).string(message.softDetail);
            if (message.samplerStackFree != null && Object.hasOwnProperty.call(message, "samplerStackFree"))
                writer.uint32(/* id 16, wireType 0 =*/128).uint32(message.samplerStackFree);
            if (message.gaitUpdateMaxUs != null && Object.hasOwnProperty.call(message, "gaitUpdateMaxUs"))
                writer.uint32(/* id 17, wireType 0 =*/136).uint32(message.gaitUpdateMaxUs);
            if (message.gaitFlushMaxMs != null && Object.hasOwnProperty.call(message, "gaitFlushMaxMs"))
                writer.uint32(/* id 18, wireType 0 =*/144).uint32(message.gaitFlushMaxMs);
            if (message.resetCause != null && Object.hasOwnProperty.call(message, "resetCause"))
                writer.uint32(/* id 19, wireType 0 =*/152).uint32(message.resetCause);
            if (message.samplesDropped != null && Object.hasOwnProperty.call(message, "samplesDropped"))
                writer.uint32(/* id 20, wireType 0 =*/160).uint32(message.samplesDropped);
            return writer;
        };

        /**
         * Encodes the specified GetFaultLogResponse message, length delimited. Does not implicitly {@link insole.GetFaultLogResponse.verify|verify} messages.
         * @function encodeDelimited
         * @memberof insole.GetFaultLogResponse
         * @static
         * @param {insole.IGetFaultLogResponse} message GetFaultLogResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        GetFaultLogResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
        };

        /**
         * Decodes a GetFaultLogResponse message from the specified reader or buffer.
         * @function decode
         * @memberof insole.GetFaultLogResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {insole.GetFaultLogResponse} GetFaultLogResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetFaultLogResponse.decode = function decode(reader, length, error, long) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            if (long === undefined)
                long = 0;
            if (long > $Reader.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let end = length === undefined ? reader.len : reader.pos + length, message = new $root.insole.GetFaultLogResponse();
            while (reader.pos < end) {
                let tag = reader.uint32();
                if (tag === error)
                    break;
                switch (tag >>> 3) {
                case 1: {
                        message.valid = reader.bool();
                        break;
                    }
                case 2: {
                        message.bootCount = reader.uint32();
                        break;
                    }
                case 3: {
                        message.faultCount = reader.uint32();
                        break;
                    }
                case 4: {
                        message.softCount = reader.uint32();
                        break;
                    }
                case 5: {
                        message.fatalReason = reader.uint32();
                        break;
                    }
                case 6: {
                        message.fatalPc = reader.uint32();
                        break;
                    }
                case 7: {
                        message.fatalLr = reader.uint32();
                        break;
                    }
                case 8: {
                        message.fatalUptimeMs = reader.uint32();
                        break;
                    }
                case 9: {
                        message.fatalThread = reader.string();
                        break;
                    }
                case 10: {
                        message.fatalDetail = reader.string();
                        break;
                    }
                case 11: {
                        message.softReason = reader.uint32();
                        break;
                    }
                case 12: {
                        message.softExtra = reader.uint32();
                        break;
                    }
                case 13: {
                        message.softUptimeMs = reader.uint32();
                        break;
                    }
                case 14: {
                        message.softThread = reader.string();
                        break;
                    }
                case 15: {
                        message.softDetail = reader.string();
                        break;
                    }
                case 16: {
                        message.samplerStackFree = reader.uint32();
                        break;
                    }
                case 17: {
                        message.gaitUpdateMaxUs = reader.uint32();
                        break;
                    }
                case 18: {
                        message.gaitFlushMaxMs = reader.uint32();
                        break;
                    }
                case 19: {
                        message.resetCause = reader.uint32();
                        break;
                    }
                case 20: {
                        message.samplesDropped = reader.uint32();
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
         * Decodes a GetFaultLogResponse message from the specified reader or buffer, length delimited.
         * @function decodeDelimited
         * @memberof insole.GetFaultLogResponse
         * @static
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {insole.GetFaultLogResponse} GetFaultLogResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        GetFaultLogResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = new $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a GetFaultLogResponse message.
         * @function verify
         * @memberof insole.GetFaultLogResponse
         * @static
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {string|null} `null` if valid, otherwise the reason why it is not
         */
        GetFaultLogResponse.verify = function verify(message, long) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                return "maximum nesting depth exceeded";
            if (message.valid != null && Object.hasOwnProperty.call(message, "valid"))
                if (typeof message.valid !== "boolean")
                    return "valid: boolean expected";
            if (message.bootCount != null && Object.hasOwnProperty.call(message, "bootCount"))
                if (!$util.isInteger(message.bootCount))
                    return "bootCount: integer expected";
            if (message.faultCount != null && Object.hasOwnProperty.call(message, "faultCount"))
                if (!$util.isInteger(message.faultCount))
                    return "faultCount: integer expected";
            if (message.softCount != null && Object.hasOwnProperty.call(message, "softCount"))
                if (!$util.isInteger(message.softCount))
                    return "softCount: integer expected";
            if (message.fatalReason != null && Object.hasOwnProperty.call(message, "fatalReason"))
                if (!$util.isInteger(message.fatalReason))
                    return "fatalReason: integer expected";
            if (message.fatalPc != null && Object.hasOwnProperty.call(message, "fatalPc"))
                if (!$util.isInteger(message.fatalPc))
                    return "fatalPc: integer expected";
            if (message.fatalLr != null && Object.hasOwnProperty.call(message, "fatalLr"))
                if (!$util.isInteger(message.fatalLr))
                    return "fatalLr: integer expected";
            if (message.fatalUptimeMs != null && Object.hasOwnProperty.call(message, "fatalUptimeMs"))
                if (!$util.isInteger(message.fatalUptimeMs))
                    return "fatalUptimeMs: integer expected";
            if (message.fatalThread != null && Object.hasOwnProperty.call(message, "fatalThread"))
                if (!$util.isString(message.fatalThread))
                    return "fatalThread: string expected";
            if (message.fatalDetail != null && Object.hasOwnProperty.call(message, "fatalDetail"))
                if (!$util.isString(message.fatalDetail))
                    return "fatalDetail: string expected";
            if (message.softReason != null && Object.hasOwnProperty.call(message, "softReason"))
                if (!$util.isInteger(message.softReason))
                    return "softReason: integer expected";
            if (message.softExtra != null && Object.hasOwnProperty.call(message, "softExtra"))
                if (!$util.isInteger(message.softExtra))
                    return "softExtra: integer expected";
            if (message.softUptimeMs != null && Object.hasOwnProperty.call(message, "softUptimeMs"))
                if (!$util.isInteger(message.softUptimeMs))
                    return "softUptimeMs: integer expected";
            if (message.softThread != null && Object.hasOwnProperty.call(message, "softThread"))
                if (!$util.isString(message.softThread))
                    return "softThread: string expected";
            if (message.softDetail != null && Object.hasOwnProperty.call(message, "softDetail"))
                if (!$util.isString(message.softDetail))
                    return "softDetail: string expected";
            if (message.samplerStackFree != null && Object.hasOwnProperty.call(message, "samplerStackFree"))
                if (!$util.isInteger(message.samplerStackFree))
                    return "samplerStackFree: integer expected";
            if (message.gaitUpdateMaxUs != null && Object.hasOwnProperty.call(message, "gaitUpdateMaxUs"))
                if (!$util.isInteger(message.gaitUpdateMaxUs))
                    return "gaitUpdateMaxUs: integer expected";
            if (message.gaitFlushMaxMs != null && Object.hasOwnProperty.call(message, "gaitFlushMaxMs"))
                if (!$util.isInteger(message.gaitFlushMaxMs))
                    return "gaitFlushMaxMs: integer expected";
            if (message.resetCause != null && Object.hasOwnProperty.call(message, "resetCause"))
                if (!$util.isInteger(message.resetCause))
                    return "resetCause: integer expected";
            if (message.samplesDropped != null && Object.hasOwnProperty.call(message, "samplesDropped"))
                if (!$util.isInteger(message.samplesDropped))
                    return "samplesDropped: integer expected";
            return null;
        };

        /**
         * Creates a GetFaultLogResponse message from a plain object. Also converts values to their respective internal types.
         * @function fromObject
         * @memberof insole.GetFaultLogResponse
         * @static
         * @param {Object.<string,*>} object Plain object
         * @returns {insole.GetFaultLogResponse} GetFaultLogResponse
         */
        GetFaultLogResponse.fromObject = function fromObject(object, long) {
            if (object instanceof $root.insole.GetFaultLogResponse)
                return object;
            if (!$util.isObject(object))
                throw TypeError(".insole.GetFaultLogResponse: object expected");
            if (long === undefined)
                long = 0;
            if (long > $util.recursionLimit)
                throw Error("maximum nesting depth exceeded");
            let message = new $root.insole.GetFaultLogResponse();
            if (object.valid != null)
                message.valid = Boolean(object.valid);
            if (object.bootCount != null)
                message.bootCount = object.bootCount >>> 0;
            if (object.faultCount != null)
                message.faultCount = object.faultCount >>> 0;
            if (object.softCount != null)
                message.softCount = object.softCount >>> 0;
            if (object.fatalReason != null)
                message.fatalReason = object.fatalReason >>> 0;
            if (object.fatalPc != null)
                message.fatalPc = object.fatalPc >>> 0;
            if (object.fatalLr != null)
                message.fatalLr = object.fatalLr >>> 0;
            if (object.fatalUptimeMs != null)
                message.fatalUptimeMs = object.fatalUptimeMs >>> 0;
            if (object.fatalThread != null)
                message.fatalThread = String(object.fatalThread);
            if (object.fatalDetail != null)
                message.fatalDetail = String(object.fatalDetail);
            if (object.softReason != null)
                message.softReason = object.softReason >>> 0;
            if (object.softExtra != null)
                message.softExtra = object.softExtra >>> 0;
            if (object.softUptimeMs != null)
                message.softUptimeMs = object.softUptimeMs >>> 0;
            if (object.softThread != null)
                message.softThread = String(object.softThread);
            if (object.softDetail != null)
                message.softDetail = String(object.softDetail);
            if (object.samplerStackFree != null)
                message.samplerStackFree = object.samplerStackFree >>> 0;
            if (object.gaitUpdateMaxUs != null)
                message.gaitUpdateMaxUs = object.gaitUpdateMaxUs >>> 0;
            if (object.gaitFlushMaxMs != null)
                message.gaitFlushMaxMs = object.gaitFlushMaxMs >>> 0;
            if (object.resetCause != null)
                message.resetCause = object.resetCause >>> 0;
            if (object.samplesDropped != null)
                message.samplesDropped = object.samplesDropped >>> 0;
            return message;
        };

        /**
         * Creates a plain object from a GetFaultLogResponse message. Also converts values to other types if specified.
         * @function toObject
         * @memberof insole.GetFaultLogResponse
         * @static
         * @param {insole.GetFaultLogResponse} message GetFaultLogResponse
         * @param {$protobuf.IConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        GetFaultLogResponse.toObject = function toObject(message, options, q) {
            if (!options)
                options = {};
            if (q === undefined)
                q = 0;
            if (q > $util.recursionLimit)
                throw Error("max depth exceeded");
            let object = {};
            if (options.defaults) {
                object.valid = false;
                object.bootCount = 0;
                object.faultCount = 0;
                object.softCount = 0;
                object.fatalReason = 0;
                object.fatalPc = 0;
                object.fatalLr = 0;
                object.fatalUptimeMs = 0;
                object.fatalThread = "";
                object.fatalDetail = "";
                object.softReason = 0;
                object.softExtra = 0;
                object.softUptimeMs = 0;
                object.softThread = "";
                object.softDetail = "";
                object.samplerStackFree = 0;
                object.gaitUpdateMaxUs = 0;
                object.gaitFlushMaxMs = 0;
                object.resetCause = 0;
                object.samplesDropped = 0;
            }
            if (message.valid != null && Object.hasOwnProperty.call(message, "valid"))
                object.valid = message.valid;
            if (message.bootCount != null && Object.hasOwnProperty.call(message, "bootCount"))
                object.bootCount = message.bootCount;
            if (message.faultCount != null && Object.hasOwnProperty.call(message, "faultCount"))
                object.faultCount = message.faultCount;
            if (message.softCount != null && Object.hasOwnProperty.call(message, "softCount"))
                object.softCount = message.softCount;
            if (message.fatalReason != null && Object.hasOwnProperty.call(message, "fatalReason"))
                object.fatalReason = message.fatalReason;
            if (message.fatalPc != null && Object.hasOwnProperty.call(message, "fatalPc"))
                object.fatalPc = message.fatalPc;
            if (message.fatalLr != null && Object.hasOwnProperty.call(message, "fatalLr"))
                object.fatalLr = message.fatalLr;
            if (message.fatalUptimeMs != null && Object.hasOwnProperty.call(message, "fatalUptimeMs"))
                object.fatalUptimeMs = message.fatalUptimeMs;
            if (message.fatalThread != null && Object.hasOwnProperty.call(message, "fatalThread"))
                object.fatalThread = message.fatalThread;
            if (message.fatalDetail != null && Object.hasOwnProperty.call(message, "fatalDetail"))
                object.fatalDetail = message.fatalDetail;
            if (message.softReason != null && Object.hasOwnProperty.call(message, "softReason"))
                object.softReason = message.softReason;
            if (message.softExtra != null && Object.hasOwnProperty.call(message, "softExtra"))
                object.softExtra = message.softExtra;
            if (message.softUptimeMs != null && Object.hasOwnProperty.call(message, "softUptimeMs"))
                object.softUptimeMs = message.softUptimeMs;
            if (message.softThread != null && Object.hasOwnProperty.call(message, "softThread"))
                object.softThread = message.softThread;
            if (message.softDetail != null && Object.hasOwnProperty.call(message, "softDetail"))
                object.softDetail = message.softDetail;
            if (message.samplerStackFree != null && Object.hasOwnProperty.call(message, "samplerStackFree"))
                object.samplerStackFree = message.samplerStackFree;
            if (message.gaitUpdateMaxUs != null && Object.hasOwnProperty.call(message, "gaitUpdateMaxUs"))
                object.gaitUpdateMaxUs = message.gaitUpdateMaxUs;
            if (message.gaitFlushMaxMs != null && Object.hasOwnProperty.call(message, "gaitFlushMaxMs"))
                object.gaitFlushMaxMs = message.gaitFlushMaxMs;
            if (message.resetCause != null && Object.hasOwnProperty.call(message, "resetCause"))
                object.resetCause = message.resetCause;
            if (message.samplesDropped != null && Object.hasOwnProperty.call(message, "samplesDropped"))
                object.samplesDropped = message.samplesDropped;
            return object;
        };

        /**
         * Converts this GetFaultLogResponse to JSON.
         * @function toJSON
         * @memberof insole.GetFaultLogResponse
         * @instance
         * @returns {Object.<string,*>} JSON object
         */
        GetFaultLogResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        /**
         * Gets the default type url for GetFaultLogResponse
         * @function getTypeUrl
         * @memberof insole.GetFaultLogResponse
         * @static
         * @param {string} [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
         * @returns {string} The default type url
         */
        GetFaultLogResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
            if (typeUrlPrefix === undefined) {
                typeUrlPrefix = "type.googleapis.com";
            }
            return typeUrlPrefix + "/insole.GetFaultLogResponse";
        };

        return GetFaultLogResponse;
    })();

    return insole;
})();

export { $root as default };

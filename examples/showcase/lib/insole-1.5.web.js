"use strict";
var Insole15 = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // node_modules/@protobufjs/aspromise/index.js
  var require_aspromise = __commonJS({
    "node_modules/@protobufjs/aspromise/index.js"(exports, module) {
      "use strict";
      module.exports = asPromise;
      function asPromise(fn, ctx) {
        var params = new Array(arguments.length - 1), offset = 0, index = 2, pending = true;
        while (index < arguments.length)
          params[offset++] = arguments[index++];
        return new Promise(function executor(resolve, reject) {
          params[offset] = function callback(err) {
            if (pending) {
              pending = false;
              if (err)
                reject(err);
              else {
                var params2 = new Array(arguments.length - 1), offset2 = 0;
                while (offset2 < params2.length)
                  params2[offset2++] = arguments[offset2];
                resolve.apply(null, params2);
              }
            }
          };
          try {
            fn.apply(ctx || null, params);
          } catch (err) {
            if (pending) {
              pending = false;
              reject(err);
            }
          }
        });
      }
    }
  });

  // node_modules/@protobufjs/base64/index.js
  var require_base64 = __commonJS({
    "node_modules/@protobufjs/base64/index.js"(exports) {
      "use strict";
      var base64 = exports;
      base64.length = function length(string) {
        var p = string.length;
        if (!p)
          return 0;
        var n = 0;
        while (--p % 4 > 1 && string.charAt(p) === "=")
          ++n;
        return Math.ceil(string.length * 3) / 4 - n;
      };
      var b64 = new Array(64);
      var s64 = new Array(123);
      for (i = 0; i < 64; )
        s64[b64[i] = i < 26 ? i + 65 : i < 52 ? i + 71 : i < 62 ? i - 4 : i - 59 | 43] = i++;
      var i;
      base64.encode = function encode(buffer, start, end) {
        var parts = null, chunk = [];
        var i2 = 0, j = 0, t;
        while (start < end) {
          var b = buffer[start++];
          switch (j) {
            case 0:
              chunk[i2++] = b64[b >> 2];
              t = (b & 3) << 4;
              j = 1;
              break;
            case 1:
              chunk[i2++] = b64[t | b >> 4];
              t = (b & 15) << 2;
              j = 2;
              break;
            case 2:
              chunk[i2++] = b64[t | b >> 6];
              chunk[i2++] = b64[b & 63];
              j = 0;
              break;
          }
          if (i2 > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk));
            i2 = 0;
          }
        }
        if (j) {
          chunk[i2++] = b64[t];
          chunk[i2++] = 61;
          if (j === 1)
            chunk[i2++] = 61;
        }
        if (parts) {
          if (i2)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i2)));
          return parts.join("");
        }
        return String.fromCharCode.apply(String, chunk.slice(0, i2));
      };
      var invalidEncoding = "invalid encoding";
      base64.decode = function decode(string, buffer, offset) {
        var start = offset;
        var j = 0, t;
        for (var i2 = 0; i2 < string.length; ) {
          var c = string.charCodeAt(i2++);
          if (c === 61 && j > 1)
            break;
          if ((c = s64[c]) === void 0)
            throw Error(invalidEncoding);
          switch (j) {
            case 0:
              t = c;
              j = 1;
              break;
            case 1:
              buffer[offset++] = t << 2 | (c & 48) >> 4;
              t = c;
              j = 2;
              break;
            case 2:
              buffer[offset++] = (t & 15) << 4 | (c & 60) >> 2;
              t = c;
              j = 3;
              break;
            case 3:
              buffer[offset++] = (t & 3) << 6 | c;
              j = 0;
              break;
          }
        }
        if (j === 1)
          throw Error(invalidEncoding);
        return offset - start;
      };
      base64.test = function test(string) {
        return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(string);
      };
    }
  });

  // node_modules/@protobufjs/eventemitter/index.js
  var require_eventemitter = __commonJS({
    "node_modules/@protobufjs/eventemitter/index.js"(exports, module) {
      "use strict";
      module.exports = EventEmitter;
      function EventEmitter() {
        this._listeners = /* @__PURE__ */ Object.create(null);
      }
      EventEmitter.prototype.on = function on(evt, fn, ctx) {
        (this._listeners[evt] || (this._listeners[evt] = [])).push({
          fn,
          ctx: ctx || this
        });
        return this;
      };
      EventEmitter.prototype.off = function off(evt, fn) {
        if (evt === void 0)
          this._listeners = /* @__PURE__ */ Object.create(null);
        else {
          if (fn === void 0)
            this._listeners[evt] = [];
          else {
            var listeners = this._listeners[evt];
            if (!listeners)
              return this;
            for (var i = 0; i < listeners.length; )
              if (listeners[i].fn === fn)
                listeners.splice(i, 1);
              else
                ++i;
          }
        }
        return this;
      };
      EventEmitter.prototype.emit = function emit(evt) {
        var listeners = this._listeners[evt];
        if (listeners) {
          var args = [], i = 1;
          for (; i < arguments.length; )
            args.push(arguments[i++]);
          for (i = 0; i < listeners.length; )
            listeners[i].fn.apply(listeners[i++].ctx, args);
        }
        return this;
      };
    }
  });

  // node_modules/@protobufjs/float/index.js
  var require_float = __commonJS({
    "node_modules/@protobufjs/float/index.js"(exports, module) {
      "use strict";
      module.exports = factory(factory);
      function factory(exports2) {
        if (typeof Float32Array !== "undefined") (function() {
          var f32 = new Float32Array([-0]), f8b = new Uint8Array(f32.buffer), le = f8b[3] === 128;
          function writeFloat_f32_cpy(val, buf, pos) {
            f32[0] = val;
            buf[pos] = f8b[0];
            buf[pos + 1] = f8b[1];
            buf[pos + 2] = f8b[2];
            buf[pos + 3] = f8b[3];
          }
          function writeFloat_f32_rev(val, buf, pos) {
            f32[0] = val;
            buf[pos] = f8b[3];
            buf[pos + 1] = f8b[2];
            buf[pos + 2] = f8b[1];
            buf[pos + 3] = f8b[0];
          }
          exports2.writeFloatLE = le ? writeFloat_f32_cpy : writeFloat_f32_rev;
          exports2.writeFloatBE = le ? writeFloat_f32_rev : writeFloat_f32_cpy;
          function readFloat_f32_cpy(buf, pos) {
            f8b[0] = buf[pos];
            f8b[1] = buf[pos + 1];
            f8b[2] = buf[pos + 2];
            f8b[3] = buf[pos + 3];
            return f32[0];
          }
          function readFloat_f32_rev(buf, pos) {
            f8b[3] = buf[pos];
            f8b[2] = buf[pos + 1];
            f8b[1] = buf[pos + 2];
            f8b[0] = buf[pos + 3];
            return f32[0];
          }
          exports2.readFloatLE = le ? readFloat_f32_cpy : readFloat_f32_rev;
          exports2.readFloatBE = le ? readFloat_f32_rev : readFloat_f32_cpy;
        })();
        else (function() {
          function writeFloat_ieee754(writeUint, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign)
              val = -val;
            if (val === 0)
              writeUint(1 / val > 0 ? (
                /* positive */
                0
              ) : (
                /* negative 0 */
                2147483648
              ), buf, pos);
            else if (isNaN(val))
              writeUint(2143289344, buf, pos);
            else if (val > 34028234663852886e22)
              writeUint((sign << 31 | 2139095040) >>> 0, buf, pos);
            else if (val < 11754943508222875e-54)
              writeUint((sign << 31 | Math.round(val / 1401298464324817e-60)) >>> 0, buf, pos);
            else {
              var exponent = Math.floor(Math.log(val) / Math.LN2), mantissa = Math.round(val * Math.pow(2, -exponent) * 8388608) & 8388607;
              writeUint((sign << 31 | exponent + 127 << 23 | mantissa) >>> 0, buf, pos);
            }
          }
          exports2.writeFloatLE = writeFloat_ieee754.bind(null, writeUintLE);
          exports2.writeFloatBE = writeFloat_ieee754.bind(null, writeUintBE);
          function readFloat_ieee754(readUint, buf, pos) {
            var uint = readUint(buf, pos), sign = (uint >> 31) * 2 + 1, exponent = uint >>> 23 & 255, mantissa = uint & 8388607;
            return exponent === 255 ? mantissa ? NaN : sign * Infinity : exponent === 0 ? sign * 1401298464324817e-60 * mantissa : sign * Math.pow(2, exponent - 150) * (mantissa + 8388608);
          }
          exports2.readFloatLE = readFloat_ieee754.bind(null, readUintLE);
          exports2.readFloatBE = readFloat_ieee754.bind(null, readUintBE);
        })();
        if (typeof Float64Array !== "undefined") (function() {
          var f64 = new Float64Array([-0]), f8b = new Uint8Array(f64.buffer), le = f8b[7] === 128;
          function writeDouble_f64_cpy(val, buf, pos) {
            f64[0] = val;
            buf[pos] = f8b[0];
            buf[pos + 1] = f8b[1];
            buf[pos + 2] = f8b[2];
            buf[pos + 3] = f8b[3];
            buf[pos + 4] = f8b[4];
            buf[pos + 5] = f8b[5];
            buf[pos + 6] = f8b[6];
            buf[pos + 7] = f8b[7];
          }
          function writeDouble_f64_rev(val, buf, pos) {
            f64[0] = val;
            buf[pos] = f8b[7];
            buf[pos + 1] = f8b[6];
            buf[pos + 2] = f8b[5];
            buf[pos + 3] = f8b[4];
            buf[pos + 4] = f8b[3];
            buf[pos + 5] = f8b[2];
            buf[pos + 6] = f8b[1];
            buf[pos + 7] = f8b[0];
          }
          exports2.writeDoubleLE = le ? writeDouble_f64_cpy : writeDouble_f64_rev;
          exports2.writeDoubleBE = le ? writeDouble_f64_rev : writeDouble_f64_cpy;
          function readDouble_f64_cpy(buf, pos) {
            f8b[0] = buf[pos];
            f8b[1] = buf[pos + 1];
            f8b[2] = buf[pos + 2];
            f8b[3] = buf[pos + 3];
            f8b[4] = buf[pos + 4];
            f8b[5] = buf[pos + 5];
            f8b[6] = buf[pos + 6];
            f8b[7] = buf[pos + 7];
            return f64[0];
          }
          function readDouble_f64_rev(buf, pos) {
            f8b[7] = buf[pos];
            f8b[6] = buf[pos + 1];
            f8b[5] = buf[pos + 2];
            f8b[4] = buf[pos + 3];
            f8b[3] = buf[pos + 4];
            f8b[2] = buf[pos + 5];
            f8b[1] = buf[pos + 6];
            f8b[0] = buf[pos + 7];
            return f64[0];
          }
          exports2.readDoubleLE = le ? readDouble_f64_cpy : readDouble_f64_rev;
          exports2.readDoubleBE = le ? readDouble_f64_rev : readDouble_f64_cpy;
        })();
        else (function() {
          function writeDouble_ieee754(writeUint, off0, off1, val, buf, pos) {
            var sign = val < 0 ? 1 : 0;
            if (sign)
              val = -val;
            if (val === 0) {
              writeUint(0, buf, pos + off0);
              writeUint(1 / val > 0 ? (
                /* positive */
                0
              ) : (
                /* negative 0 */
                2147483648
              ), buf, pos + off1);
            } else if (isNaN(val)) {
              writeUint(0, buf, pos + off0);
              writeUint(2146959360, buf, pos + off1);
            } else if (val > 17976931348623157e292) {
              writeUint(0, buf, pos + off0);
              writeUint((sign << 31 | 2146435072) >>> 0, buf, pos + off1);
            } else {
              var mantissa;
              if (val < 22250738585072014e-324) {
                mantissa = val / 5e-324;
                writeUint(mantissa >>> 0, buf, pos + off0);
                writeUint((sign << 31 | mantissa / 4294967296) >>> 0, buf, pos + off1);
              } else {
                var exponent = Math.floor(Math.log(val) / Math.LN2);
                if (exponent === 1024)
                  exponent = 1023;
                mantissa = val * Math.pow(2, -exponent);
                writeUint(mantissa * 4503599627370496 >>> 0, buf, pos + off0);
                writeUint((sign << 31 | exponent + 1023 << 20 | mantissa * 1048576 & 1048575) >>> 0, buf, pos + off1);
              }
            }
          }
          exports2.writeDoubleLE = writeDouble_ieee754.bind(null, writeUintLE, 0, 4);
          exports2.writeDoubleBE = writeDouble_ieee754.bind(null, writeUintBE, 4, 0);
          function readDouble_ieee754(readUint, off0, off1, buf, pos) {
            var lo = readUint(buf, pos + off0), hi = readUint(buf, pos + off1);
            var sign = (hi >> 31) * 2 + 1, exponent = hi >>> 20 & 2047, mantissa = 4294967296 * (hi & 1048575) + lo;
            return exponent === 2047 ? mantissa ? NaN : sign * Infinity : exponent === 0 ? sign * 5e-324 * mantissa : sign * Math.pow(2, exponent - 1075) * (mantissa + 4503599627370496);
          }
          exports2.readDoubleLE = readDouble_ieee754.bind(null, readUintLE, 0, 4);
          exports2.readDoubleBE = readDouble_ieee754.bind(null, readUintBE, 4, 0);
        })();
        return exports2;
      }
      function writeUintLE(val, buf, pos) {
        buf[pos] = val & 255;
        buf[pos + 1] = val >>> 8 & 255;
        buf[pos + 2] = val >>> 16 & 255;
        buf[pos + 3] = val >>> 24;
      }
      function writeUintBE(val, buf, pos) {
        buf[pos] = val >>> 24;
        buf[pos + 1] = val >>> 16 & 255;
        buf[pos + 2] = val >>> 8 & 255;
        buf[pos + 3] = val & 255;
      }
      function readUintLE(buf, pos) {
        return (buf[pos] | buf[pos + 1] << 8 | buf[pos + 2] << 16 | buf[pos + 3] << 24) >>> 0;
      }
      function readUintBE(buf, pos) {
        return (buf[pos] << 24 | buf[pos + 1] << 16 | buf[pos + 2] << 8 | buf[pos + 3]) >>> 0;
      }
    }
  });

  // node_modules/@protobufjs/utf8/index.js
  var require_utf8 = __commonJS({
    "node_modules/@protobufjs/utf8/index.js"(exports) {
      "use strict";
      var utf8 = exports;
      var replacementCharCode = 65533;
      utf8.length = function utf8_length(string) {
        var len = 0, c = 0;
        for (var i = 0; i < string.length; ++i) {
          c = string.charCodeAt(i);
          if (c < 128)
            len += 1;
          else if (c < 2048)
            len += 2;
          else if ((c & 64512) === 55296 && (string.charCodeAt(i + 1) & 64512) === 56320) {
            ++i;
            len += 4;
          } else
            len += 3;
        }
        return len;
      };
      utf8.read = function utf8_read(buffer, start, end) {
        if (end - start < 1)
          return "";
        var parts = null, chunk = [], i = 0, t, t2, c2, c3;
        while (start < end) {
          t = buffer[start++];
          if (t <= 127) {
            chunk[i++] = t;
          } else if (t >= 192 && t < 224) {
            c2 = (t & 31) << 6 | buffer[start++] & 63;
            chunk[i++] = c2 >= 128 ? c2 : replacementCharCode;
          } else if (t >= 224 && t < 240) {
            c3 = (t & 15) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
            chunk[i++] = c3 >= 2048 ? c3 : replacementCharCode;
          } else if (t >= 240) {
            t2 = (t & 7) << 18 | (buffer[start++] & 63) << 12 | (buffer[start++] & 63) << 6 | buffer[start++] & 63;
            if (t2 < 65536 || t2 > 1114111)
              chunk[i++] = replacementCharCode;
            else {
              t2 -= 65536;
              chunk[i++] = 55296 + (t2 >> 10);
              chunk[i++] = 56320 + (t2 & 1023);
            }
          }
          if (i > 8191) {
            (parts || (parts = [])).push(String.fromCharCode.apply(String, chunk.slice(0, i)));
            i = 0;
          }
        }
        if (parts) {
          if (i)
            parts.push(String.fromCharCode.apply(String, chunk.slice(0, i)));
          return parts.join("");
        }
        return String.fromCharCode.apply(String, chunk.slice(0, i));
      };
      utf8.write = function utf8_write(string, buffer, offset) {
        var start = offset, c1, c2;
        for (var i = 0; i < string.length; ++i) {
          c1 = string.charCodeAt(i);
          if (c1 < 128) {
            buffer[offset++] = c1;
          } else if (c1 < 2048) {
            buffer[offset++] = c1 >> 6 | 192;
            buffer[offset++] = c1 & 63 | 128;
          } else if ((c1 & 64512) === 55296 && ((c2 = string.charCodeAt(i + 1)) & 64512) === 56320) {
            c1 = 65536 + ((c1 & 1023) << 10) + (c2 & 1023);
            ++i;
            buffer[offset++] = c1 >> 18 | 240;
            buffer[offset++] = c1 >> 12 & 63 | 128;
            buffer[offset++] = c1 >> 6 & 63 | 128;
            buffer[offset++] = c1 & 63 | 128;
          } else {
            buffer[offset++] = c1 >> 12 | 224;
            buffer[offset++] = c1 >> 6 & 63 | 128;
            buffer[offset++] = c1 & 63 | 128;
          }
        }
        return offset - start;
      };
    }
  });

  // node_modules/@protobufjs/pool/index.js
  var require_pool = __commonJS({
    "node_modules/@protobufjs/pool/index.js"(exports, module) {
      "use strict";
      module.exports = pool;
      function pool(alloc, slice, size) {
        var SIZE = size || 8192;
        var MAX = SIZE >>> 1;
        var slab = null;
        var offset = SIZE;
        return function pool_alloc(size2) {
          if (size2 < 1 || size2 > MAX)
            return alloc(size2);
          if (offset + size2 > SIZE) {
            slab = alloc(SIZE);
            offset = 0;
          }
          var buf = slice.call(slab, offset, offset += size2);
          if (offset & 7)
            offset = (offset | 7) + 1;
          return buf;
        };
      }
    }
  });

  // node_modules/protobufjs/src/util/longbits.js
  var require_longbits = __commonJS({
    "node_modules/protobufjs/src/util/longbits.js"(exports, module) {
      "use strict";
      module.exports = LongBits;
      var util3 = require_minimal();
      function LongBits(lo, hi) {
        this.lo = lo >>> 0;
        this.hi = hi >>> 0;
      }
      var zero = LongBits.zero = new LongBits(0, 0);
      zero.toNumber = function() {
        return 0;
      };
      zero.zzEncode = zero.zzDecode = function() {
        return this;
      };
      zero.length = function() {
        return 1;
      };
      var zeroHash = LongBits.zeroHash = "\0\0\0\0\0\0\0\0";
      LongBits.fromNumber = function fromNumber(value) {
        if (value === 0)
          return zero;
        var sign = value < 0;
        if (sign)
          value = -value;
        var lo = value >>> 0, hi = (value - lo) / 4294967296 >>> 0;
        if (sign) {
          hi = ~hi >>> 0;
          lo = ~lo >>> 0;
          if (++lo > 4294967295) {
            lo = 0;
            if (++hi > 4294967295)
              hi = 0;
          }
        }
        return new LongBits(lo, hi);
      };
      LongBits.from = function from(value) {
        if (typeof value === "number")
          return LongBits.fromNumber(value);
        if (util3.isString(value)) {
          if (util3.Long)
            value = util3.Long.fromString(value);
          else
            return LongBits.fromNumber(parseInt(value, 10));
        }
        return value.low || value.high ? new LongBits(value.low >>> 0, value.high >>> 0) : zero;
      };
      LongBits.prototype.toNumber = function toNumber(unsigned) {
        if (!unsigned && this.hi >>> 31) {
          var lo = ~this.lo + 1 >>> 0, hi = ~this.hi >>> 0;
          if (!lo)
            hi = hi + 1 >>> 0;
          return -(lo + hi * 4294967296);
        }
        return this.lo + this.hi * 4294967296;
      };
      LongBits.prototype.toLong = function toLong(unsigned) {
        return util3.Long ? new util3.Long(this.lo | 0, this.hi | 0, Boolean(unsigned)) : { low: this.lo | 0, high: this.hi | 0, unsigned: Boolean(unsigned) };
      };
      var charCodeAt = String.prototype.charCodeAt;
      LongBits.fromHash = function fromHash(hash) {
        if (hash === zeroHash)
          return zero;
        return new LongBits(
          (charCodeAt.call(hash, 0) | charCodeAt.call(hash, 1) << 8 | charCodeAt.call(hash, 2) << 16 | charCodeAt.call(hash, 3) << 24) >>> 0,
          (charCodeAt.call(hash, 4) | charCodeAt.call(hash, 5) << 8 | charCodeAt.call(hash, 6) << 16 | charCodeAt.call(hash, 7) << 24) >>> 0
        );
      };
      LongBits.prototype.toHash = function toHash() {
        return String.fromCharCode(
          this.lo & 255,
          this.lo >>> 8 & 255,
          this.lo >>> 16 & 255,
          this.lo >>> 24,
          this.hi & 255,
          this.hi >>> 8 & 255,
          this.hi >>> 16 & 255,
          this.hi >>> 24
        );
      };
      LongBits.prototype.zzEncode = function zzEncode() {
        var mask = this.hi >> 31;
        this.hi = ((this.hi << 1 | this.lo >>> 31) ^ mask) >>> 0;
        this.lo = (this.lo << 1 ^ mask) >>> 0;
        return this;
      };
      LongBits.prototype.zzDecode = function zzDecode() {
        var mask = -(this.lo & 1);
        this.lo = ((this.lo >>> 1 | this.hi << 31) ^ mask) >>> 0;
        this.hi = (this.hi >>> 1 ^ mask) >>> 0;
        return this;
      };
      LongBits.prototype.length = function length() {
        var part0 = this.lo, part1 = (this.lo >>> 28 | this.hi << 4) >>> 0, part2 = this.hi >>> 24;
        return part2 === 0 ? part1 === 0 ? part0 < 16384 ? part0 < 128 ? 1 : 2 : part0 < 2097152 ? 3 : 4 : part1 < 16384 ? part1 < 128 ? 5 : 6 : part1 < 2097152 ? 7 : 8 : part2 < 128 ? 9 : 10;
      };
    }
  });

  // node_modules/long/umd/index.js
  var require_umd = __commonJS({
    "node_modules/long/umd/index.js"(exports, module) {
      (function(global2, factory) {
        function preferDefault(exports2) {
          return exports2.default || exports2;
        }
        if (typeof define === "function" && define.amd) {
          define([], function() {
            var exports2 = {};
            factory(exports2);
            return preferDefault(exports2);
          });
        } else if (typeof exports === "object") {
          factory(exports);
          if (typeof module === "object") module.exports = preferDefault(exports);
        } else {
          (function() {
            var exports2 = {};
            factory(exports2);
            global2.Long = preferDefault(exports2);
          })();
        }
      })(
        typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : exports,
        function(_exports) {
          "use strict";
          Object.defineProperty(_exports, "__esModule", {
            value: true
          });
          _exports.default = void 0;
          var wasm = null;
          try {
            wasm = new WebAssembly.Instance(
              new WebAssembly.Module(
                new Uint8Array([
                  // \0asm
                  0,
                  97,
                  115,
                  109,
                  // version 1
                  1,
                  0,
                  0,
                  0,
                  // section "type"
                  1,
                  13,
                  2,
                  // 0, () => i32
                  96,
                  0,
                  1,
                  127,
                  // 1, (i32, i32, i32, i32) => i32
                  96,
                  4,
                  127,
                  127,
                  127,
                  127,
                  1,
                  127,
                  // section "function"
                  3,
                  7,
                  6,
                  // 0, type 0
                  0,
                  // 1, type 1
                  1,
                  // 2, type 1
                  1,
                  // 3, type 1
                  1,
                  // 4, type 1
                  1,
                  // 5, type 1
                  1,
                  // section "global"
                  6,
                  6,
                  1,
                  // 0, "high", mutable i32
                  127,
                  1,
                  65,
                  0,
                  11,
                  // section "export"
                  7,
                  50,
                  6,
                  // 0, "mul"
                  3,
                  109,
                  117,
                  108,
                  0,
                  1,
                  // 1, "div_s"
                  5,
                  100,
                  105,
                  118,
                  95,
                  115,
                  0,
                  2,
                  // 2, "div_u"
                  5,
                  100,
                  105,
                  118,
                  95,
                  117,
                  0,
                  3,
                  // 3, "rem_s"
                  5,
                  114,
                  101,
                  109,
                  95,
                  115,
                  0,
                  4,
                  // 4, "rem_u"
                  5,
                  114,
                  101,
                  109,
                  95,
                  117,
                  0,
                  5,
                  // 5, "get_high"
                  8,
                  103,
                  101,
                  116,
                  95,
                  104,
                  105,
                  103,
                  104,
                  0,
                  0,
                  // section "code"
                  10,
                  191,
                  1,
                  6,
                  // 0, "get_high"
                  4,
                  0,
                  35,
                  0,
                  11,
                  // 1, "mul"
                  36,
                  1,
                  1,
                  126,
                  32,
                  0,
                  173,
                  32,
                  1,
                  173,
                  66,
                  32,
                  134,
                  132,
                  32,
                  2,
                  173,
                  32,
                  3,
                  173,
                  66,
                  32,
                  134,
                  132,
                  126,
                  34,
                  4,
                  66,
                  32,
                  135,
                  167,
                  36,
                  0,
                  32,
                  4,
                  167,
                  11,
                  // 2, "div_s"
                  36,
                  1,
                  1,
                  126,
                  32,
                  0,
                  173,
                  32,
                  1,
                  173,
                  66,
                  32,
                  134,
                  132,
                  32,
                  2,
                  173,
                  32,
                  3,
                  173,
                  66,
                  32,
                  134,
                  132,
                  127,
                  34,
                  4,
                  66,
                  32,
                  135,
                  167,
                  36,
                  0,
                  32,
                  4,
                  167,
                  11,
                  // 3, "div_u"
                  36,
                  1,
                  1,
                  126,
                  32,
                  0,
                  173,
                  32,
                  1,
                  173,
                  66,
                  32,
                  134,
                  132,
                  32,
                  2,
                  173,
                  32,
                  3,
                  173,
                  66,
                  32,
                  134,
                  132,
                  128,
                  34,
                  4,
                  66,
                  32,
                  135,
                  167,
                  36,
                  0,
                  32,
                  4,
                  167,
                  11,
                  // 4, "rem_s"
                  36,
                  1,
                  1,
                  126,
                  32,
                  0,
                  173,
                  32,
                  1,
                  173,
                  66,
                  32,
                  134,
                  132,
                  32,
                  2,
                  173,
                  32,
                  3,
                  173,
                  66,
                  32,
                  134,
                  132,
                  129,
                  34,
                  4,
                  66,
                  32,
                  135,
                  167,
                  36,
                  0,
                  32,
                  4,
                  167,
                  11,
                  // 5, "rem_u"
                  36,
                  1,
                  1,
                  126,
                  32,
                  0,
                  173,
                  32,
                  1,
                  173,
                  66,
                  32,
                  134,
                  132,
                  32,
                  2,
                  173,
                  32,
                  3,
                  173,
                  66,
                  32,
                  134,
                  132,
                  130,
                  34,
                  4,
                  66,
                  32,
                  135,
                  167,
                  36,
                  0,
                  32,
                  4,
                  167,
                  11
                ])
              ),
              {}
            ).exports;
          } catch {
          }
          function Long(low, high, unsigned) {
            this.low = low | 0;
            this.high = high | 0;
            this.unsigned = !!unsigned;
          }
          Long.prototype.__isLong__;
          Object.defineProperty(Long.prototype, "__isLong__", {
            value: true
          });
          function isLong(obj) {
            return (obj && obj["__isLong__"]) === true;
          }
          function ctz32(value) {
            var c = Math.clz32(value & -value);
            return value ? 31 - c : c;
          }
          Long.isLong = isLong;
          var INT_CACHE = {};
          var UINT_CACHE = {};
          function fromInt(value, unsigned) {
            var obj, cachedObj, cache;
            if (unsigned) {
              value >>>= 0;
              if (cache = 0 <= value && value < 256) {
                cachedObj = UINT_CACHE[value];
                if (cachedObj) return cachedObj;
              }
              obj = fromBits(value, 0, true);
              if (cache) UINT_CACHE[value] = obj;
              return obj;
            } else {
              value |= 0;
              if (cache = -128 <= value && value < 128) {
                cachedObj = INT_CACHE[value];
                if (cachedObj) return cachedObj;
              }
              obj = fromBits(value, value < 0 ? -1 : 0, false);
              if (cache) INT_CACHE[value] = obj;
              return obj;
            }
          }
          Long.fromInt = fromInt;
          function fromNumber(value, unsigned) {
            if (isNaN(value)) return unsigned ? UZERO : ZERO;
            if (unsigned) {
              if (value < 0) return UZERO;
              if (value >= TWO_PWR_64_DBL) return MAX_UNSIGNED_VALUE;
            } else {
              if (value <= -TWO_PWR_63_DBL) return MIN_VALUE;
              if (value + 1 >= TWO_PWR_63_DBL) return MAX_VALUE;
            }
            if (value < 0) return fromNumber(-value, unsigned).neg();
            return fromBits(
              value % TWO_PWR_32_DBL | 0,
              value / TWO_PWR_32_DBL | 0,
              unsigned
            );
          }
          Long.fromNumber = fromNumber;
          function fromBits(lowBits, highBits, unsigned) {
            return new Long(lowBits, highBits, unsigned);
          }
          Long.fromBits = fromBits;
          var pow_dbl = Math.pow;
          function fromString(str, unsigned, radix) {
            if (str.length === 0) throw Error("empty string");
            if (typeof unsigned === "number") {
              radix = unsigned;
              unsigned = false;
            } else {
              unsigned = !!unsigned;
            }
            if (str === "NaN" || str === "Infinity" || str === "+Infinity" || str === "-Infinity")
              return unsigned ? UZERO : ZERO;
            radix = radix || 10;
            if (radix < 2 || 36 < radix) throw RangeError("radix");
            var p;
            if ((p = str.indexOf("-")) > 0) throw Error("interior hyphen");
            else if (p === 0) {
              return fromString(str.substring(1), unsigned, radix).neg();
            }
            var radixToPower = fromNumber(pow_dbl(radix, 8));
            var result = ZERO;
            for (var i = 0; i < str.length; i += 8) {
              var size = Math.min(8, str.length - i), value = parseInt(str.substring(i, i + size), radix);
              if (size < 8) {
                var power = fromNumber(pow_dbl(radix, size));
                result = result.mul(power).add(fromNumber(value));
              } else {
                result = result.mul(radixToPower);
                result = result.add(fromNumber(value));
              }
            }
            result.unsigned = unsigned;
            return result;
          }
          Long.fromString = fromString;
          function fromValue(val, unsigned) {
            if (typeof val === "number") return fromNumber(val, unsigned);
            if (typeof val === "string") return fromString(val, unsigned);
            return fromBits(
              val.low,
              val.high,
              typeof unsigned === "boolean" ? unsigned : val.unsigned
            );
          }
          Long.fromValue = fromValue;
          var TWO_PWR_16_DBL = 1 << 16;
          var TWO_PWR_24_DBL = 1 << 24;
          var TWO_PWR_32_DBL = TWO_PWR_16_DBL * TWO_PWR_16_DBL;
          var TWO_PWR_64_DBL = TWO_PWR_32_DBL * TWO_PWR_32_DBL;
          var TWO_PWR_63_DBL = TWO_PWR_64_DBL / 2;
          var TWO_PWR_24 = fromInt(TWO_PWR_24_DBL);
          var ZERO = fromInt(0);
          Long.ZERO = ZERO;
          var UZERO = fromInt(0, true);
          Long.UZERO = UZERO;
          var ONE = fromInt(1);
          Long.ONE = ONE;
          var UONE = fromInt(1, true);
          Long.UONE = UONE;
          var NEG_ONE = fromInt(-1);
          Long.NEG_ONE = NEG_ONE;
          var MAX_VALUE = fromBits(4294967295 | 0, 2147483647 | 0, false);
          Long.MAX_VALUE = MAX_VALUE;
          var MAX_UNSIGNED_VALUE = fromBits(4294967295 | 0, 4294967295 | 0, true);
          Long.MAX_UNSIGNED_VALUE = MAX_UNSIGNED_VALUE;
          var MIN_VALUE = fromBits(0, 2147483648 | 0, false);
          Long.MIN_VALUE = MIN_VALUE;
          var LongPrototype = Long.prototype;
          LongPrototype.toInt = function toInt() {
            return this.unsigned ? this.low >>> 0 : this.low;
          };
          LongPrototype.toNumber = function toNumber() {
            if (this.unsigned)
              return (this.high >>> 0) * TWO_PWR_32_DBL + (this.low >>> 0);
            return this.high * TWO_PWR_32_DBL + (this.low >>> 0);
          };
          LongPrototype.toString = function toString(radix) {
            radix = radix || 10;
            if (radix < 2 || 36 < radix) throw RangeError("radix");
            if (this.isZero()) return "0";
            if (this.isNegative()) {
              if (this.eq(MIN_VALUE)) {
                var radixLong = fromNumber(radix), div = this.div(radixLong), rem1 = div.mul(radixLong).sub(this);
                return div.toString(radix) + rem1.toInt().toString(radix);
              } else return "-" + this.neg().toString(radix);
            }
            var radixToPower = fromNumber(pow_dbl(radix, 6), this.unsigned), rem = this;
            var result = "";
            while (true) {
              var remDiv = rem.div(radixToPower), intval = rem.sub(remDiv.mul(radixToPower)).toInt() >>> 0, digits = intval.toString(radix);
              rem = remDiv;
              if (rem.isZero()) return digits + result;
              else {
                while (digits.length < 6) digits = "0" + digits;
                result = "" + digits + result;
              }
            }
          };
          LongPrototype.getHighBits = function getHighBits() {
            return this.high;
          };
          LongPrototype.getHighBitsUnsigned = function getHighBitsUnsigned() {
            return this.high >>> 0;
          };
          LongPrototype.getLowBits = function getLowBits() {
            return this.low;
          };
          LongPrototype.getLowBitsUnsigned = function getLowBitsUnsigned() {
            return this.low >>> 0;
          };
          LongPrototype.getNumBitsAbs = function getNumBitsAbs() {
            if (this.isNegative())
              return this.eq(MIN_VALUE) ? 64 : this.neg().getNumBitsAbs();
            var val = this.high != 0 ? this.high : this.low;
            for (var bit = 31; bit > 0; bit--) if ((val & 1 << bit) != 0) break;
            return this.high != 0 ? bit + 33 : bit + 1;
          };
          LongPrototype.isSafeInteger = function isSafeInteger() {
            var top11Bits = this.high >> 21;
            if (!top11Bits) return true;
            if (this.unsigned) return false;
            return top11Bits === -1 && !(this.low === 0 && this.high === -2097152);
          };
          LongPrototype.isZero = function isZero() {
            return this.high === 0 && this.low === 0;
          };
          LongPrototype.eqz = LongPrototype.isZero;
          LongPrototype.isNegative = function isNegative() {
            return !this.unsigned && this.high < 0;
          };
          LongPrototype.isPositive = function isPositive() {
            return this.unsigned || this.high >= 0;
          };
          LongPrototype.isOdd = function isOdd() {
            return (this.low & 1) === 1;
          };
          LongPrototype.isEven = function isEven() {
            return (this.low & 1) === 0;
          };
          LongPrototype.equals = function equals(other) {
            if (!isLong(other)) other = fromValue(other);
            if (this.unsigned !== other.unsigned && this.high >>> 31 === 1 && other.high >>> 31 === 1)
              return false;
            return this.high === other.high && this.low === other.low;
          };
          LongPrototype.eq = LongPrototype.equals;
          LongPrototype.notEquals = function notEquals(other) {
            return !this.eq(
              /* validates */
              other
            );
          };
          LongPrototype.neq = LongPrototype.notEquals;
          LongPrototype.ne = LongPrototype.notEquals;
          LongPrototype.lessThan = function lessThan(other) {
            return this.comp(
              /* validates */
              other
            ) < 0;
          };
          LongPrototype.lt = LongPrototype.lessThan;
          LongPrototype.lessThanOrEqual = function lessThanOrEqual(other) {
            return this.comp(
              /* validates */
              other
            ) <= 0;
          };
          LongPrototype.lte = LongPrototype.lessThanOrEqual;
          LongPrototype.le = LongPrototype.lessThanOrEqual;
          LongPrototype.greaterThan = function greaterThan(other) {
            return this.comp(
              /* validates */
              other
            ) > 0;
          };
          LongPrototype.gt = LongPrototype.greaterThan;
          LongPrototype.greaterThanOrEqual = function greaterThanOrEqual(other) {
            return this.comp(
              /* validates */
              other
            ) >= 0;
          };
          LongPrototype.gte = LongPrototype.greaterThanOrEqual;
          LongPrototype.ge = LongPrototype.greaterThanOrEqual;
          LongPrototype.compare = function compare(other) {
            if (!isLong(other)) other = fromValue(other);
            if (this.eq(other)) return 0;
            var thisNeg = this.isNegative(), otherNeg = other.isNegative();
            if (thisNeg && !otherNeg) return -1;
            if (!thisNeg && otherNeg) return 1;
            if (!this.unsigned) return this.sub(other).isNegative() ? -1 : 1;
            return other.high >>> 0 > this.high >>> 0 || other.high === this.high && other.low >>> 0 > this.low >>> 0 ? -1 : 1;
          };
          LongPrototype.comp = LongPrototype.compare;
          LongPrototype.negate = function negate() {
            if (!this.unsigned && this.eq(MIN_VALUE)) return MIN_VALUE;
            return this.not().add(ONE);
          };
          LongPrototype.neg = LongPrototype.negate;
          LongPrototype.add = function add(addend) {
            if (!isLong(addend)) addend = fromValue(addend);
            var a48 = this.high >>> 16;
            var a32 = this.high & 65535;
            var a16 = this.low >>> 16;
            var a00 = this.low & 65535;
            var b48 = addend.high >>> 16;
            var b32 = addend.high & 65535;
            var b16 = addend.low >>> 16;
            var b00 = addend.low & 65535;
            var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
            c00 += a00 + b00;
            c16 += c00 >>> 16;
            c00 &= 65535;
            c16 += a16 + b16;
            c32 += c16 >>> 16;
            c16 &= 65535;
            c32 += a32 + b32;
            c48 += c32 >>> 16;
            c32 &= 65535;
            c48 += a48 + b48;
            c48 &= 65535;
            return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
          };
          LongPrototype.subtract = function subtract(subtrahend) {
            if (!isLong(subtrahend)) subtrahend = fromValue(subtrahend);
            return this.add(subtrahend.neg());
          };
          LongPrototype.sub = LongPrototype.subtract;
          LongPrototype.multiply = function multiply(multiplier) {
            if (this.isZero()) return this;
            if (!isLong(multiplier)) multiplier = fromValue(multiplier);
            if (wasm) {
              var low = wasm["mul"](
                this.low,
                this.high,
                multiplier.low,
                multiplier.high
              );
              return fromBits(low, wasm["get_high"](), this.unsigned);
            }
            if (multiplier.isZero()) return this.unsigned ? UZERO : ZERO;
            if (this.eq(MIN_VALUE)) return multiplier.isOdd() ? MIN_VALUE : ZERO;
            if (multiplier.eq(MIN_VALUE)) return this.isOdd() ? MIN_VALUE : ZERO;
            if (this.isNegative()) {
              if (multiplier.isNegative()) return this.neg().mul(multiplier.neg());
              else return this.neg().mul(multiplier).neg();
            } else if (multiplier.isNegative())
              return this.mul(multiplier.neg()).neg();
            if (this.lt(TWO_PWR_24) && multiplier.lt(TWO_PWR_24))
              return fromNumber(
                this.toNumber() * multiplier.toNumber(),
                this.unsigned
              );
            var a48 = this.high >>> 16;
            var a32 = this.high & 65535;
            var a16 = this.low >>> 16;
            var a00 = this.low & 65535;
            var b48 = multiplier.high >>> 16;
            var b32 = multiplier.high & 65535;
            var b16 = multiplier.low >>> 16;
            var b00 = multiplier.low & 65535;
            var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
            c00 += a00 * b00;
            c16 += c00 >>> 16;
            c00 &= 65535;
            c16 += a16 * b00;
            c32 += c16 >>> 16;
            c16 &= 65535;
            c16 += a00 * b16;
            c32 += c16 >>> 16;
            c16 &= 65535;
            c32 += a32 * b00;
            c48 += c32 >>> 16;
            c32 &= 65535;
            c32 += a16 * b16;
            c48 += c32 >>> 16;
            c32 &= 65535;
            c32 += a00 * b32;
            c48 += c32 >>> 16;
            c32 &= 65535;
            c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
            c48 &= 65535;
            return fromBits(c16 << 16 | c00, c48 << 16 | c32, this.unsigned);
          };
          LongPrototype.mul = LongPrototype.multiply;
          LongPrototype.divide = function divide(divisor) {
            if (!isLong(divisor)) divisor = fromValue(divisor);
            if (divisor.isZero()) throw Error("division by zero");
            if (wasm) {
              if (!this.unsigned && this.high === -2147483648 && divisor.low === -1 && divisor.high === -1) {
                return this;
              }
              var low = (this.unsigned ? wasm["div_u"] : wasm["div_s"])(
                this.low,
                this.high,
                divisor.low,
                divisor.high
              );
              return fromBits(low, wasm["get_high"](), this.unsigned);
            }
            if (this.isZero()) return this.unsigned ? UZERO : ZERO;
            var approx, rem, res;
            if (!this.unsigned) {
              if (this.eq(MIN_VALUE)) {
                if (divisor.eq(ONE) || divisor.eq(NEG_ONE))
                  return MIN_VALUE;
                else if (divisor.eq(MIN_VALUE)) return ONE;
                else {
                  var halfThis = this.shr(1);
                  approx = halfThis.div(divisor).shl(1);
                  if (approx.eq(ZERO)) {
                    return divisor.isNegative() ? ONE : NEG_ONE;
                  } else {
                    rem = this.sub(divisor.mul(approx));
                    res = approx.add(rem.div(divisor));
                    return res;
                  }
                }
              } else if (divisor.eq(MIN_VALUE)) return this.unsigned ? UZERO : ZERO;
              if (this.isNegative()) {
                if (divisor.isNegative()) return this.neg().div(divisor.neg());
                return this.neg().div(divisor).neg();
              } else if (divisor.isNegative()) return this.div(divisor.neg()).neg();
              res = ZERO;
            } else {
              if (!divisor.unsigned) divisor = divisor.toUnsigned();
              if (divisor.gt(this)) return UZERO;
              if (divisor.gt(this.shru(1)))
                return UONE;
              res = UZERO;
            }
            rem = this;
            while (rem.gte(divisor)) {
              approx = Math.max(1, Math.floor(rem.toNumber() / divisor.toNumber()));
              var log2 = Math.ceil(Math.log(approx) / Math.LN2), delta = log2 <= 48 ? 1 : pow_dbl(2, log2 - 48), approxRes = fromNumber(approx), approxRem = approxRes.mul(divisor);
              while (approxRem.isNegative() || approxRem.gt(rem)) {
                approx -= delta;
                approxRes = fromNumber(approx, this.unsigned);
                approxRem = approxRes.mul(divisor);
              }
              if (approxRes.isZero()) approxRes = ONE;
              res = res.add(approxRes);
              rem = rem.sub(approxRem);
            }
            return res;
          };
          LongPrototype.div = LongPrototype.divide;
          LongPrototype.modulo = function modulo(divisor) {
            if (!isLong(divisor)) divisor = fromValue(divisor);
            if (wasm) {
              var low = (this.unsigned ? wasm["rem_u"] : wasm["rem_s"])(
                this.low,
                this.high,
                divisor.low,
                divisor.high
              );
              return fromBits(low, wasm["get_high"](), this.unsigned);
            }
            return this.sub(this.div(divisor).mul(divisor));
          };
          LongPrototype.mod = LongPrototype.modulo;
          LongPrototype.rem = LongPrototype.modulo;
          LongPrototype.not = function not() {
            return fromBits(~this.low, ~this.high, this.unsigned);
          };
          LongPrototype.countLeadingZeros = function countLeadingZeros() {
            return this.high ? Math.clz32(this.high) : Math.clz32(this.low) + 32;
          };
          LongPrototype.clz = LongPrototype.countLeadingZeros;
          LongPrototype.countTrailingZeros = function countTrailingZeros() {
            return this.low ? ctz32(this.low) : ctz32(this.high) + 32;
          };
          LongPrototype.ctz = LongPrototype.countTrailingZeros;
          LongPrototype.and = function and(other) {
            if (!isLong(other)) other = fromValue(other);
            return fromBits(
              this.low & other.low,
              this.high & other.high,
              this.unsigned
            );
          };
          LongPrototype.or = function or(other) {
            if (!isLong(other)) other = fromValue(other);
            return fromBits(
              this.low | other.low,
              this.high | other.high,
              this.unsigned
            );
          };
          LongPrototype.xor = function xor(other) {
            if (!isLong(other)) other = fromValue(other);
            return fromBits(
              this.low ^ other.low,
              this.high ^ other.high,
              this.unsigned
            );
          };
          LongPrototype.shiftLeft = function shiftLeft(numBits) {
            if (isLong(numBits)) numBits = numBits.toInt();
            if ((numBits &= 63) === 0) return this;
            else if (numBits < 32)
              return fromBits(
                this.low << numBits,
                this.high << numBits | this.low >>> 32 - numBits,
                this.unsigned
              );
            else return fromBits(0, this.low << numBits - 32, this.unsigned);
          };
          LongPrototype.shl = LongPrototype.shiftLeft;
          LongPrototype.shiftRight = function shiftRight(numBits) {
            if (isLong(numBits)) numBits = numBits.toInt();
            if ((numBits &= 63) === 0) return this;
            else if (numBits < 32)
              return fromBits(
                this.low >>> numBits | this.high << 32 - numBits,
                this.high >> numBits,
                this.unsigned
              );
            else
              return fromBits(
                this.high >> numBits - 32,
                this.high >= 0 ? 0 : -1,
                this.unsigned
              );
          };
          LongPrototype.shr = LongPrototype.shiftRight;
          LongPrototype.shiftRightUnsigned = function shiftRightUnsigned(numBits) {
            if (isLong(numBits)) numBits = numBits.toInt();
            if ((numBits &= 63) === 0) return this;
            if (numBits < 32)
              return fromBits(
                this.low >>> numBits | this.high << 32 - numBits,
                this.high >>> numBits,
                this.unsigned
              );
            if (numBits === 32) return fromBits(this.high, 0, this.unsigned);
            return fromBits(this.high >>> numBits - 32, 0, this.unsigned);
          };
          LongPrototype.shru = LongPrototype.shiftRightUnsigned;
          LongPrototype.shr_u = LongPrototype.shiftRightUnsigned;
          LongPrototype.rotateLeft = function rotateLeft(numBits) {
            var b;
            if (isLong(numBits)) numBits = numBits.toInt();
            if ((numBits &= 63) === 0) return this;
            if (numBits === 32) return fromBits(this.high, this.low, this.unsigned);
            if (numBits < 32) {
              b = 32 - numBits;
              return fromBits(
                this.low << numBits | this.high >>> b,
                this.high << numBits | this.low >>> b,
                this.unsigned
              );
            }
            numBits -= 32;
            b = 32 - numBits;
            return fromBits(
              this.high << numBits | this.low >>> b,
              this.low << numBits | this.high >>> b,
              this.unsigned
            );
          };
          LongPrototype.rotl = LongPrototype.rotateLeft;
          LongPrototype.rotateRight = function rotateRight(numBits) {
            var b;
            if (isLong(numBits)) numBits = numBits.toInt();
            if ((numBits &= 63) === 0) return this;
            if (numBits === 32) return fromBits(this.high, this.low, this.unsigned);
            if (numBits < 32) {
              b = 32 - numBits;
              return fromBits(
                this.high << b | this.low >>> numBits,
                this.low << b | this.high >>> numBits,
                this.unsigned
              );
            }
            numBits -= 32;
            b = 32 - numBits;
            return fromBits(
              this.low << b | this.high >>> numBits,
              this.high << b | this.low >>> numBits,
              this.unsigned
            );
          };
          LongPrototype.rotr = LongPrototype.rotateRight;
          LongPrototype.toSigned = function toSigned() {
            if (!this.unsigned) return this;
            return fromBits(this.low, this.high, false);
          };
          LongPrototype.toUnsigned = function toUnsigned() {
            if (this.unsigned) return this;
            return fromBits(this.low, this.high, true);
          };
          LongPrototype.toBytes = function toBytes(le) {
            return le ? this.toBytesLE() : this.toBytesBE();
          };
          LongPrototype.toBytesLE = function toBytesLE() {
            var hi = this.high, lo = this.low;
            return [
              lo & 255,
              lo >>> 8 & 255,
              lo >>> 16 & 255,
              lo >>> 24,
              hi & 255,
              hi >>> 8 & 255,
              hi >>> 16 & 255,
              hi >>> 24
            ];
          };
          LongPrototype.toBytesBE = function toBytesBE() {
            var hi = this.high, lo = this.low;
            return [
              hi >>> 24,
              hi >>> 16 & 255,
              hi >>> 8 & 255,
              hi & 255,
              lo >>> 24,
              lo >>> 16 & 255,
              lo >>> 8 & 255,
              lo & 255
            ];
          };
          Long.fromBytes = function fromBytes(bytes, unsigned, le) {
            return le ? Long.fromBytesLE(bytes, unsigned) : Long.fromBytesBE(bytes, unsigned);
          };
          Long.fromBytesLE = function fromBytesLE(bytes, unsigned) {
            return new Long(
              bytes[0] | bytes[1] << 8 | bytes[2] << 16 | bytes[3] << 24,
              bytes[4] | bytes[5] << 8 | bytes[6] << 16 | bytes[7] << 24,
              unsigned
            );
          };
          Long.fromBytesBE = function fromBytesBE(bytes, unsigned) {
            return new Long(
              bytes[4] << 24 | bytes[5] << 16 | bytes[6] << 8 | bytes[7],
              bytes[0] << 24 | bytes[1] << 16 | bytes[2] << 8 | bytes[3],
              unsigned
            );
          };
          if (typeof BigInt === "function") {
            Long.fromBigInt = function fromBigInt(value, unsigned) {
              var lowBits = Number(BigInt.asIntN(32, value));
              var highBits = Number(BigInt.asIntN(32, value >> BigInt(32)));
              return fromBits(lowBits, highBits, unsigned);
            };
            Long.fromValue = function fromValueWithBigInt(value, unsigned) {
              if (typeof value === "bigint") return Long.fromBigInt(value, unsigned);
              return fromValue(value, unsigned);
            };
            LongPrototype.toBigInt = function toBigInt() {
              var lowBigInt = BigInt(this.low >>> 0);
              var highBigInt = BigInt(this.unsigned ? this.high >>> 0 : this.high);
              return highBigInt << BigInt(32) | lowBigInt;
            };
          }
          var _default = _exports.default = Long;
        }
      );
    }
  });

  // node_modules/protobufjs/src/util/minimal.js
  var require_minimal = __commonJS({
    "node_modules/protobufjs/src/util/minimal.js"(exports) {
      "use strict";
      var util3 = exports;
      util3.asPromise = require_aspromise();
      util3.base64 = require_base64();
      util3.EventEmitter = require_eventemitter();
      util3.float = require_float();
      util3.utf8 = require_utf8();
      util3.pool = require_pool();
      util3.LongBits = require_longbits();
      function isUnsafeProperty(key) {
        return key === "__proto__" || key === "prototype" || key === "constructor";
      }
      util3.isUnsafeProperty = isUnsafeProperty;
      util3.isNode = Boolean(typeof global !== "undefined" && global && global.process && global.process.versions && global.process.versions.node);
      util3.global = util3.isNode && global || typeof window !== "undefined" && window || typeof self !== "undefined" && self || exports;
      util3.emptyArray = Object.freeze ? Object.freeze([]) : (
        /* istanbul ignore next */
        []
      );
      util3.emptyObject = Object.freeze ? Object.freeze({}) : (
        /* istanbul ignore next */
        {}
      );
      util3.isInteger = Number.isInteger || /* istanbul ignore next */
      function isInteger(value) {
        return typeof value === "number" && isFinite(value) && Math.floor(value) === value;
      };
      util3.isString = function isString(value) {
        return typeof value === "string" || value instanceof String;
      };
      util3.isObject = function isObject(value) {
        return value && typeof value === "object";
      };
      util3.isset = /**
       * Checks if a property on a message is considered to be present.
       * @param {Object} obj Plain object or message instance
       * @param {string} prop Property name
       * @returns {boolean} `true` if considered to be present, otherwise `false`
       */
      util3.isSet = function isSet(obj, prop) {
        var value = obj[prop];
        if (value != null && Object.hasOwnProperty.call(obj, prop))
          return typeof value !== "object" || (Array.isArray(value) ? value.length : Object.keys(value).length) > 0;
        return false;
      };
      util3.Buffer = function() {
        try {
          var Buffer2 = util3.global.Buffer;
          return Buffer2.prototype.utf8Write ? Buffer2 : (
            /* istanbul ignore next */
            null
          );
        } catch (e) {
          return null;
        }
      }();
      util3._Buffer_from = null;
      util3._Buffer_allocUnsafe = null;
      util3.newBuffer = function newBuffer(sizeOrArray) {
        return typeof sizeOrArray === "number" ? util3.Buffer ? util3._Buffer_allocUnsafe(sizeOrArray) : new util3.Array(sizeOrArray) : util3.Buffer ? util3._Buffer_from(sizeOrArray) : typeof Uint8Array === "undefined" ? sizeOrArray : new Uint8Array(sizeOrArray);
      };
      util3.Array = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
      util3.Long = /* istanbul ignore next */
      util3.global.dcodeIO && /* istanbul ignore next */
      util3.global.dcodeIO.Long || /* istanbul ignore next */
      util3.global.Long || function() {
        try {
          var Long = require_umd();
          return Long && Long.isLong ? Long : null;
        } catch (e) {
          return null;
        }
      }();
      util3.key2Re = /^true|false|0|1$/;
      util3.key32Re = /^-?(?:0|[1-9][0-9]*)$/;
      util3.key64Re = /^(?:[\\x00-\\xff]{8}|-?(?:0|[1-9][0-9]*))$/;
      util3.longToHash = function longToHash(value) {
        return value ? util3.LongBits.from(value).toHash() : util3.LongBits.zeroHash;
      };
      util3.longFromHash = function longFromHash(hash, unsigned) {
        var bits = util3.LongBits.fromHash(hash);
        if (util3.Long)
          return util3.Long.fromBits(bits.lo, bits.hi, unsigned);
        return bits.toNumber(Boolean(unsigned));
      };
      function merge(dst) {
        var ifNotSet = typeof arguments[arguments.length - 1] === "boolean", limit = ifNotSet ? arguments.length - 1 : arguments.length;
        ifNotSet = ifNotSet && arguments[arguments.length - 1];
        for (var a = 1; a < limit; ++a) {
          var src = arguments[a];
          if (!src)
            continue;
          for (var keys = Object.keys(src), i = 0; i < keys.length; ++i)
            if (!isUnsafeProperty(keys[i]) && (dst[keys[i]] === void 0 || !ifNotSet))
              dst[keys[i]] = src[keys[i]];
        }
        return dst;
      }
      util3.merge = merge;
      util3.nestingLimit = 32;
      util3.recursionLimit = 100;
      util3.makeProp = function makeProp(obj, key) {
        Object.defineProperty(obj, key, {
          enumerable: true,
          configurable: true,
          writable: true
        });
      };
      util3.lcFirst = function lcFirst(str) {
        return str.charAt(0).toLowerCase() + str.substring(1);
      };
      function newError(name) {
        function CustomError(message, properties) {
          if (!(this instanceof CustomError))
            return new CustomError(message, properties);
          Object.defineProperty(this, "message", { get: function() {
            return message;
          } });
          if (Error.captureStackTrace)
            Error.captureStackTrace(this, CustomError);
          else
            Object.defineProperty(this, "stack", { value: new Error().stack || "" });
          if (properties)
            merge(this, properties);
        }
        CustomError.prototype = Object.create(Error.prototype, {
          constructor: {
            value: CustomError,
            writable: true,
            enumerable: false,
            configurable: true
          },
          name: {
            get: function get() {
              return name;
            },
            set: void 0,
            enumerable: false,
            // configurable: false would accurately preserve the behavior of
            // the original, but I'm guessing that was not intentional.
            // For an actual error subclass, this property would
            // be configurable.
            configurable: true
          },
          toString: {
            value: function value() {
              return this.name + ": " + this.message;
            },
            writable: true,
            enumerable: false,
            configurable: true
          }
        });
        return CustomError;
      }
      util3.newError = newError;
      util3.ProtocolError = newError("ProtocolError");
      util3.oneOfGetter = function getOneOf(fieldNames) {
        var fieldMap = {};
        for (var i = 0; i < fieldNames.length; ++i)
          fieldMap[fieldNames[i]] = 1;
        return function() {
          for (var keys = Object.keys(this), i2 = keys.length - 1; i2 > -1; --i2)
            if (fieldMap[keys[i2]] === 1 && this[keys[i2]] !== void 0 && this[keys[i2]] !== null)
              return keys[i2];
        };
      };
      util3.oneOfSetter = function setOneOf(fieldNames) {
        return function(name) {
          for (var i = 0; i < fieldNames.length; ++i)
            if (fieldNames[i] !== name)
              delete this[fieldNames[i]];
        };
      };
      util3.toJSONOptions = {
        longs: String,
        enums: String,
        bytes: String,
        json: true
      };
      util3._configure = function() {
        var Buffer2 = util3.Buffer;
        if (!Buffer2) {
          util3._Buffer_from = util3._Buffer_allocUnsafe = null;
          return;
        }
        util3._Buffer_from = Buffer2.from !== Uint8Array.from && Buffer2.from || /* istanbul ignore next */
        function Buffer_from(value, encoding) {
          return new Buffer2(value, encoding);
        };
        util3._Buffer_allocUnsafe = Buffer2.allocUnsafe || /* istanbul ignore next */
        function Buffer_allocUnsafe(size) {
          return new Buffer2(size);
        };
      };
    }
  });

  // node_modules/protobufjs/src/writer.js
  var require_writer = __commonJS({
    "node_modules/protobufjs/src/writer.js"(exports, module) {
      "use strict";
      module.exports = Writer2;
      var util3 = require_minimal();
      var BufferWriter;
      var LongBits = util3.LongBits;
      var base64 = util3.base64;
      var utf8 = util3.utf8;
      function Op(fn, len, val) {
        this.fn = fn;
        this.len = len;
        this.next = void 0;
        this.val = val;
      }
      function noop() {
      }
      function State(writer) {
        this.head = writer.head;
        this.tail = writer.tail;
        this.len = writer.len;
        this.next = writer.states;
      }
      function Writer2() {
        this.len = 0;
        this.head = new Op(noop, 0, 0);
        this.tail = this.head;
        this.states = null;
      }
      var create = function create2() {
        return util3.Buffer ? function create_buffer_setup() {
          return (Writer2.create = function create_buffer() {
            return new BufferWriter();
          })();
        } : function create_array() {
          return new Writer2();
        };
      };
      Writer2.create = create();
      Writer2.alloc = function alloc(size) {
        return new util3.Array(size);
      };
      if (util3.Array !== Array)
        Writer2.alloc = util3.pool(Writer2.alloc, util3.Array.prototype.subarray);
      Writer2.prototype._push = function push(fn, len, val) {
        this.tail = this.tail.next = new Op(fn, len, val);
        this.len += len;
        return this;
      };
      function writeByte(val, buf, pos) {
        buf[pos] = val & 255;
      }
      function writeVarint32(val, buf, pos) {
        while (val > 127) {
          buf[pos++] = val & 127 | 128;
          val >>>= 7;
        }
        buf[pos] = val;
      }
      function VarintOp(len, val) {
        this.len = len;
        this.next = void 0;
        this.val = val;
      }
      VarintOp.prototype = Object.create(Op.prototype);
      VarintOp.prototype.fn = writeVarint32;
      Writer2.prototype.uint32 = function write_uint32(value) {
        this.len += (this.tail = this.tail.next = new VarintOp(
          (value = value >>> 0) < 128 ? 1 : value < 16384 ? 2 : value < 2097152 ? 3 : value < 268435456 ? 4 : 5,
          value
        )).len;
        return this;
      };
      Writer2.prototype.int32 = function write_int32(value) {
        return (value |= 0) < 0 ? this._push(writeVarint64, 10, LongBits.fromNumber(value)) : this.uint32(value);
      };
      Writer2.prototype.sint32 = function write_sint32(value) {
        return this.uint32((value << 1 ^ value >> 31) >>> 0);
      };
      function writeVarint64(val, buf, pos) {
        var lo = val.lo, hi = val.hi;
        while (hi) {
          buf[pos++] = lo & 127 | 128;
          lo = (lo >>> 7 | hi << 25) >>> 0;
          hi >>>= 7;
        }
        while (lo > 127) {
          buf[pos++] = lo & 127 | 128;
          lo = lo >>> 7;
        }
        buf[pos++] = lo;
      }
      Writer2.prototype.uint64 = function write_uint64(value) {
        var bits = LongBits.from(value);
        return this._push(writeVarint64, bits.length(), bits);
      };
      Writer2.prototype.int64 = Writer2.prototype.uint64;
      Writer2.prototype.sint64 = function write_sint64(value) {
        var bits = LongBits.from(value).zzEncode();
        return this._push(writeVarint64, bits.length(), bits);
      };
      Writer2.prototype.bool = function write_bool(value) {
        return this._push(writeByte, 1, value ? 1 : 0);
      };
      function writeFixed32(val, buf, pos) {
        buf[pos] = val & 255;
        buf[pos + 1] = val >>> 8 & 255;
        buf[pos + 2] = val >>> 16 & 255;
        buf[pos + 3] = val >>> 24;
      }
      Writer2.prototype.fixed32 = function write_fixed32(value) {
        return this._push(writeFixed32, 4, value >>> 0);
      };
      Writer2.prototype.sfixed32 = Writer2.prototype.fixed32;
      Writer2.prototype.fixed64 = function write_fixed64(value) {
        var bits = LongBits.from(value);
        return this._push(writeFixed32, 4, bits.lo)._push(writeFixed32, 4, bits.hi);
      };
      Writer2.prototype.sfixed64 = Writer2.prototype.fixed64;
      Writer2.prototype.float = function write_float(value) {
        return this._push(util3.float.writeFloatLE, 4, value);
      };
      Writer2.prototype.double = function write_double(value) {
        return this._push(util3.float.writeDoubleLE, 8, value);
      };
      var writeBytes = util3.Array.prototype.set ? function writeBytes_set(val, buf, pos) {
        buf.set(val, pos);
      } : function writeBytes_for(val, buf, pos) {
        for (var i = 0; i < val.length; ++i)
          buf[pos + i] = val[i];
      };
      Writer2.prototype.bytes = function write_bytes(value) {
        var len = value.length >>> 0;
        if (!len)
          return this._push(writeByte, 1, 0);
        if (util3.isString(value)) {
          var buf = Writer2.alloc(len = base64.length(value));
          base64.decode(value, buf, 0);
          value = buf;
        }
        return this.uint32(len)._push(writeBytes, len, value);
      };
      Writer2.prototype.string = function write_string(value) {
        var len = utf8.length(value);
        return len ? this.uint32(len)._push(utf8.write, len, value) : this._push(writeByte, 1, 0);
      };
      Writer2.prototype.fork = function fork() {
        this.states = new State(this);
        this.head = this.tail = new Op(noop, 0, 0);
        this.len = 0;
        return this;
      };
      Writer2.prototype.reset = function reset() {
        if (this.states) {
          this.head = this.states.head;
          this.tail = this.states.tail;
          this.len = this.states.len;
          this.states = this.states.next;
        } else {
          this.head = this.tail = new Op(noop, 0, 0);
          this.len = 0;
        }
        return this;
      };
      Writer2.prototype.ldelim = function ldelim() {
        var head = this.head, tail = this.tail, len = this.len;
        this.reset().uint32(len);
        if (len) {
          this.tail.next = head.next;
          this.tail = tail;
          this.len += len;
        }
        return this;
      };
      Writer2.prototype.finish = function finish() {
        var head = this.head.next, buf = this.constructor.alloc(this.len), pos = 0;
        while (head) {
          head.fn(head.val, buf, pos);
          pos += head.len;
          head = head.next;
        }
        return buf;
      };
      Writer2._configure = function(BufferWriter_) {
        BufferWriter = BufferWriter_;
        Writer2.create = create();
        BufferWriter._configure();
      };
    }
  });

  // node_modules/protobufjs/src/writer_buffer.js
  var require_writer_buffer = __commonJS({
    "node_modules/protobufjs/src/writer_buffer.js"(exports, module) {
      "use strict";
      module.exports = BufferWriter;
      var Writer2 = require_writer();
      (BufferWriter.prototype = Object.create(Writer2.prototype)).constructor = BufferWriter;
      var util3 = require_minimal();
      function BufferWriter() {
        Writer2.call(this);
      }
      BufferWriter._configure = function() {
        BufferWriter.alloc = util3._Buffer_allocUnsafe;
        BufferWriter.writeBytesBuffer = util3.Buffer && util3.Buffer.prototype instanceof Uint8Array && util3.Buffer.prototype.set.name === "set" ? function writeBytesBuffer_set(val, buf, pos) {
          buf.set(val, pos);
        } : function writeBytesBuffer_copy(val, buf, pos) {
          if (val.copy)
            val.copy(buf, pos, 0, val.length);
          else for (var i = 0; i < val.length; )
            buf[pos++] = val[i++];
        };
      };
      BufferWriter.prototype.bytes = function write_bytes_buffer(value) {
        if (util3.isString(value))
          value = util3._Buffer_from(value, "base64");
        var len = value.length >>> 0;
        this.uint32(len);
        if (len)
          this._push(BufferWriter.writeBytesBuffer, len, value);
        return this;
      };
      function writeStringBuffer(val, buf, pos) {
        if (val.length < 40)
          util3.utf8.write(val, buf, pos);
        else if (buf.utf8Write)
          buf.utf8Write(val, pos);
        else
          buf.write(val, pos);
      }
      BufferWriter.prototype.string = function write_string_buffer(value) {
        var len = util3.Buffer.byteLength(value);
        this.uint32(len);
        if (len)
          this._push(writeStringBuffer, len, value);
        return this;
      };
      BufferWriter._configure();
    }
  });

  // node_modules/protobufjs/src/reader.js
  var require_reader = __commonJS({
    "node_modules/protobufjs/src/reader.js"(exports, module) {
      "use strict";
      module.exports = Reader2;
      var util3 = require_minimal();
      var BufferReader;
      var LongBits = util3.LongBits;
      var utf8 = util3.utf8;
      function indexOutOfRange(reader, writeLength) {
        return RangeError("index out of range: " + reader.pos + " + " + (writeLength || 1) + " > " + reader.len);
      }
      function Reader2(buffer) {
        this.buf = buffer;
        this.pos = 0;
        this.len = buffer.length;
      }
      var create_array = typeof Uint8Array !== "undefined" ? function create_typed_array(buffer) {
        if (buffer instanceof Uint8Array || Array.isArray(buffer))
          return new Reader2(buffer);
        throw Error("illegal buffer");
      } : function create_array2(buffer) {
        if (Array.isArray(buffer))
          return new Reader2(buffer);
        throw Error("illegal buffer");
      };
      var create = function create2() {
        return util3.Buffer ? function create_buffer_setup(buffer) {
          return (Reader2.create = function create_buffer(buffer2) {
            return util3.Buffer.isBuffer(buffer2) ? new BufferReader(buffer2) : create_array(buffer2);
          })(buffer);
        } : create_array;
      };
      Reader2.create = create();
      Reader2.prototype._slice = util3.Array.prototype.subarray || /* istanbul ignore next */
      util3.Array.prototype.slice;
      Reader2.prototype.uint32 = /* @__PURE__ */ function read_uint32_setup() {
        var value = 4294967295;
        return function read_uint32() {
          value = (this.buf[this.pos] & 127) >>> 0;
          if (this.buf[this.pos++] < 128) return value;
          value = (value | (this.buf[this.pos] & 127) << 7) >>> 0;
          if (this.buf[this.pos++] < 128) return value;
          value = (value | (this.buf[this.pos] & 127) << 14) >>> 0;
          if (this.buf[this.pos++] < 128) return value;
          value = (value | (this.buf[this.pos] & 127) << 21) >>> 0;
          if (this.buf[this.pos++] < 128) return value;
          value = (value | (this.buf[this.pos] & 15) << 28) >>> 0;
          if (this.buf[this.pos++] < 128) return value;
          if ((this.pos += 5) > this.len) {
            this.pos = this.len;
            throw indexOutOfRange(this, 10);
          }
          return value;
        };
      }();
      Reader2.prototype.int32 = function read_int32() {
        return this.uint32() | 0;
      };
      Reader2.prototype.sint32 = function read_sint32() {
        var value = this.uint32();
        return value >>> 1 ^ -(value & 1) | 0;
      };
      function readLongVarint() {
        var bits = new LongBits(0, 0);
        var i = 0;
        if (this.len - this.pos > 4) {
          for (; i < 4; ++i) {
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
              return bits;
          }
          bits.lo = (bits.lo | (this.buf[this.pos] & 127) << 28) >>> 0;
          bits.hi = (bits.hi | (this.buf[this.pos] & 127) >> 4) >>> 0;
          if (this.buf[this.pos++] < 128)
            return bits;
          i = 0;
        } else {
          for (; i < 3; ++i) {
            if (this.pos >= this.len)
              throw indexOutOfRange(this);
            bits.lo = (bits.lo | (this.buf[this.pos] & 127) << i * 7) >>> 0;
            if (this.buf[this.pos++] < 128)
              return bits;
          }
          bits.lo = (bits.lo | (this.buf[this.pos++] & 127) << i * 7) >>> 0;
          return bits;
        }
        if (this.len - this.pos > 4) {
          for (; i < 5; ++i) {
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
              return bits;
          }
        } else {
          for (; i < 5; ++i) {
            if (this.pos >= this.len)
              throw indexOutOfRange(this);
            bits.hi = (bits.hi | (this.buf[this.pos] & 127) << i * 7 + 3) >>> 0;
            if (this.buf[this.pos++] < 128)
              return bits;
          }
        }
        throw Error("invalid varint encoding");
      }
      Reader2.prototype.bool = function read_bool() {
        return this.uint32() !== 0;
      };
      function readFixed32_end(buf, end) {
        return (buf[end - 4] | buf[end - 3] << 8 | buf[end - 2] << 16 | buf[end - 1] << 24) >>> 0;
      }
      Reader2.prototype.fixed32 = function read_fixed32() {
        if (this.pos + 4 > this.len)
          throw indexOutOfRange(this, 4);
        return readFixed32_end(this.buf, this.pos += 4);
      };
      Reader2.prototype.sfixed32 = function read_sfixed32() {
        if (this.pos + 4 > this.len)
          throw indexOutOfRange(this, 4);
        return readFixed32_end(this.buf, this.pos += 4) | 0;
      };
      function readFixed64() {
        if (this.pos + 8 > this.len)
          throw indexOutOfRange(this, 8);
        return new LongBits(readFixed32_end(this.buf, this.pos += 4), readFixed32_end(this.buf, this.pos += 4));
      }
      Reader2.prototype.float = function read_float() {
        if (this.pos + 4 > this.len)
          throw indexOutOfRange(this, 4);
        var value = util3.float.readFloatLE(this.buf, this.pos);
        this.pos += 4;
        return value;
      };
      Reader2.prototype.double = function read_double() {
        if (this.pos + 8 > this.len)
          throw indexOutOfRange(this, 4);
        var value = util3.float.readDoubleLE(this.buf, this.pos);
        this.pos += 8;
        return value;
      };
      Reader2.prototype.bytes = function read_bytes() {
        var length = this.uint32(), start = this.pos, end = this.pos + length;
        if (end > this.len)
          throw indexOutOfRange(this, length);
        this.pos += length;
        if (Array.isArray(this.buf))
          return this.buf.slice(start, end);
        if (start === end) {
          var nativeBuffer = util3.Buffer;
          return nativeBuffer ? nativeBuffer.alloc(0) : new this.buf.constructor(0);
        }
        return this._slice.call(this.buf, start, end);
      };
      Reader2.prototype.string = function read_string() {
        var bytes = this.bytes();
        return utf8.read(bytes, 0, bytes.length);
      };
      Reader2.prototype.skip = function skip(length) {
        if (typeof length === "number") {
          if (this.pos + length > this.len)
            throw indexOutOfRange(this, length);
          this.pos += length;
        } else {
          do {
            if (this.pos >= this.len)
              throw indexOutOfRange(this);
          } while (this.buf[this.pos++] & 128);
        }
        return this;
      };
      Reader2.recursionLimit = util3.recursionLimit;
      Reader2.prototype.skipType = function(wireType, depth) {
        if (depth === void 0) depth = 0;
        if (depth > Reader2.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        switch (wireType) {
          case 0:
            this.skip();
            break;
          case 1:
            this.skip(8);
            break;
          case 2:
            this.skip(this.uint32());
            break;
          case 3:
            while ((wireType = this.uint32() & 7) !== 4) {
              this.skipType(wireType, depth + 1);
            }
            break;
          case 5:
            this.skip(4);
            break;
          /* istanbul ignore next */
          default:
            throw Error("invalid wire type " + wireType + " at offset " + this.pos);
        }
        return this;
      };
      Reader2._configure = function(BufferReader_) {
        BufferReader = BufferReader_;
        Reader2.create = create();
        BufferReader._configure();
        var fn = util3.Long ? "toLong" : (
          /* istanbul ignore next */
          "toNumber"
        );
        util3.merge(Reader2.prototype, {
          int64: function read_int64() {
            return readLongVarint.call(this)[fn](false);
          },
          uint64: function read_uint64() {
            return readLongVarint.call(this)[fn](true);
          },
          sint64: function read_sint64() {
            return readLongVarint.call(this).zzDecode()[fn](false);
          },
          fixed64: function read_fixed64() {
            return readFixed64.call(this)[fn](true);
          },
          sfixed64: function read_sfixed64() {
            return readFixed64.call(this)[fn](false);
          }
        });
      };
    }
  });

  // node_modules/protobufjs/src/reader_buffer.js
  var require_reader_buffer = __commonJS({
    "node_modules/protobufjs/src/reader_buffer.js"(exports, module) {
      "use strict";
      module.exports = BufferReader;
      var Reader2 = require_reader();
      (BufferReader.prototype = Object.create(Reader2.prototype)).constructor = BufferReader;
      var util3 = require_minimal();
      function BufferReader(buffer) {
        Reader2.call(this, buffer);
      }
      BufferReader._configure = function() {
        if (util3.Buffer)
          BufferReader.prototype._slice = util3.Buffer.prototype.slice;
      };
      BufferReader.prototype.string = function read_string_buffer() {
        var len = this.uint32();
        return this.buf.utf8Slice ? this.buf.utf8Slice(this.pos, this.pos = Math.min(this.pos + len, this.len)) : this.buf.toString("utf-8", this.pos, this.pos = Math.min(this.pos + len, this.len));
      };
      BufferReader._configure();
    }
  });

  // node_modules/protobufjs/src/rpc/service.js
  var require_service = __commonJS({
    "node_modules/protobufjs/src/rpc/service.js"(exports, module) {
      "use strict";
      module.exports = Service;
      var util3 = require_minimal();
      (Service.prototype = Object.create(util3.EventEmitter.prototype)).constructor = Service;
      function Service(rpcImpl, requestDelimited, responseDelimited) {
        if (typeof rpcImpl !== "function")
          throw TypeError("rpcImpl must be a function");
        util3.EventEmitter.call(this);
        this.rpcImpl = rpcImpl;
        this.requestDelimited = Boolean(requestDelimited);
        this.responseDelimited = Boolean(responseDelimited);
      }
      Service.prototype.rpcCall = function rpcCall(method, requestCtor, responseCtor, request, callback) {
        if (!request)
          throw TypeError("request must be specified");
        var self2 = this;
        if (!callback)
          return util3.asPromise(rpcCall, self2, method, requestCtor, responseCtor, request);
        if (!self2.rpcImpl) {
          setTimeout(function() {
            callback(Error("already ended"));
          }, 0);
          return void 0;
        }
        try {
          return self2.rpcImpl(
            method,
            requestCtor[self2.requestDelimited ? "encodeDelimited" : "encode"](request).finish(),
            function rpcCallback(err, response) {
              if (err) {
                self2.emit("error", err, method);
                return callback(err);
              }
              if (response === null) {
                self2.end(
                  /* endedByRPC */
                  true
                );
                return void 0;
              }
              if (!(response instanceof responseCtor)) {
                try {
                  response = responseCtor[self2.responseDelimited ? "decodeDelimited" : "decode"](response);
                } catch (err2) {
                  self2.emit("error", err2, method);
                  return callback(err2);
                }
              }
              self2.emit("data", response, method);
              return callback(null, response);
            }
          );
        } catch (err) {
          self2.emit("error", err, method);
          setTimeout(function() {
            callback(err);
          }, 0);
          return void 0;
        }
      };
      Service.prototype.end = function end(endedByRPC) {
        if (this.rpcImpl) {
          if (!endedByRPC)
            this.rpcImpl(null, null, null);
          this.rpcImpl = null;
          this.emit("end").off();
        }
        return this;
      };
    }
  });

  // node_modules/protobufjs/src/rpc.js
  var require_rpc = __commonJS({
    "node_modules/protobufjs/src/rpc.js"(exports) {
      "use strict";
      var rpc = exports;
      rpc.Service = require_service();
    }
  });

  // node_modules/protobufjs/src/roots.js
  var require_roots = __commonJS({
    "node_modules/protobufjs/src/roots.js"(exports, module) {
      "use strict";
      module.exports = /* @__PURE__ */ Object.create(null);
    }
  });

  // node_modules/protobufjs/src/index-minimal.js
  var require_index_minimal = __commonJS({
    "node_modules/protobufjs/src/index-minimal.js"(exports) {
      "use strict";
      var protobuf2 = exports;
      protobuf2.build = "minimal";
      protobuf2.Writer = require_writer();
      protobuf2.BufferWriter = require_writer_buffer();
      protobuf2.Reader = require_reader();
      protobuf2.BufferReader = require_reader_buffer();
      protobuf2.util = require_minimal();
      protobuf2.rpc = require_rpc();
      protobuf2.roots = require_roots();
      protobuf2.configure = configure2;
      function configure2() {
        protobuf2.util._configure();
        protobuf2.Writer._configure(protobuf2.BufferWriter);
        protobuf2.Reader._configure(protobuf2.BufferReader);
      }
      configure2();
    }
  });

  // node_modules/protobufjs/minimal.js
  var require_minimal2 = __commonJS({
    "node_modules/protobufjs/minimal.js"(exports, module) {
      "use strict";
      module.exports = require_index_minimal();
    }
  });

  // node_modules/@blerpc/protocol-ts/dist/containerTypes.js
  var require_containerTypes = __commonJS({
    "node_modules/@blerpc/protocol-ts/dist/containerTypes.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ATT_OVERHEAD = exports.CONTROL_HEADER_SIZE = exports.SUBSEQUENT_HEADER_SIZE = exports.FIRST_HEADER_SIZE = exports.CAPABILITY_FLAG_ENCRYPTION_SUPPORTED = exports.BLERPC_ERROR_BUSY = exports.BLERPC_ERROR_RESPONSE_TOO_LARGE = exports.ControlCmd = exports.ContainerType = void 0;
      exports.containerTypeFromValue = containerTypeFromValue;
      exports.controlCmdFromValue = controlCmdFromValue;
      var ContainerType2;
      (function(ContainerType3) {
        ContainerType3[ContainerType3["FIRST"] = 0] = "FIRST";
        ContainerType3[ContainerType3["SUBSEQUENT"] = 1] = "SUBSEQUENT";
        ContainerType3[ContainerType3["CONTROL"] = 3] = "CONTROL";
      })(ContainerType2 || (exports.ContainerType = ContainerType2 = {}));
      function containerTypeFromValue(v) {
        switch (v) {
          case 0:
            return ContainerType2.FIRST;
          case 1:
            return ContainerType2.SUBSEQUENT;
          case 3:
            return ContainerType2.CONTROL;
          default:
            throw new Error(`Unknown ContainerType: ${v}`);
        }
      }
      var ControlCmd2;
      (function(ControlCmd3) {
        ControlCmd3[ControlCmd3["NONE"] = 0] = "NONE";
        ControlCmd3[ControlCmd3["TIMEOUT"] = 1] = "TIMEOUT";
        ControlCmd3[ControlCmd3["STREAM_END_C2P"] = 2] = "STREAM_END_C2P";
        ControlCmd3[ControlCmd3["STREAM_END_P2C"] = 3] = "STREAM_END_P2C";
        ControlCmd3[ControlCmd3["CAPABILITIES"] = 4] = "CAPABILITIES";
        ControlCmd3[ControlCmd3["ERROR"] = 5] = "ERROR";
        ControlCmd3[ControlCmd3["KEY_EXCHANGE"] = 6] = "KEY_EXCHANGE";
      })(ControlCmd2 || (exports.ControlCmd = ControlCmd2 = {}));
      function controlCmdFromValue(v) {
        switch (v) {
          case 0:
            return ControlCmd2.NONE;
          case 1:
            return ControlCmd2.TIMEOUT;
          case 2:
            return ControlCmd2.STREAM_END_C2P;
          case 3:
            return ControlCmd2.STREAM_END_P2C;
          case 4:
            return ControlCmd2.CAPABILITIES;
          case 5:
            return ControlCmd2.ERROR;
          case 6:
            return ControlCmd2.KEY_EXCHANGE;
          default:
            throw new Error(`Unknown ControlCmd: ${v}`);
        }
      }
      exports.BLERPC_ERROR_RESPONSE_TOO_LARGE = 1;
      exports.BLERPC_ERROR_BUSY = 2;
      exports.CAPABILITY_FLAG_ENCRYPTION_SUPPORTED = 1;
      exports.FIRST_HEADER_SIZE = 6;
      exports.SUBSEQUENT_HEADER_SIZE = 4;
      exports.CONTROL_HEADER_SIZE = 4;
      exports.ATT_OVERHEAD = 3;
    }
  });

  // node_modules/@blerpc/protocol-ts/dist/container.js
  var require_container = __commonJS({
    "node_modules/@blerpc/protocol-ts/dist/container.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.Container = void 0;
      exports.packFlags = packFlags;
      exports.unpackFlags = unpackFlags;
      var containerTypes_1 = require_containerTypes();
      function packFlags(type, cmd = containerTypes_1.ControlCmd.NONE) {
        return (type & 3) << 6 | (cmd & 15) << 2;
      }
      function unpackFlags(flagsByte) {
        const type = (0, containerTypes_1.containerTypeFromValue)(flagsByte >> 6 & 3);
        const cmd = (0, containerTypes_1.controlCmdFromValue)(flagsByte >> 2 & 15);
        return [type, cmd];
      }
      var Container2 = class _Container {
        constructor(params) {
          this.transactionId = params.transactionId;
          this.sequenceNumber = params.sequenceNumber;
          this.containerType = params.containerType;
          this.controlCmd = params.controlCmd ?? containerTypes_1.ControlCmd.NONE;
          this.totalLength = params.totalLength ?? 0;
          this.payload = params.payload ?? new Uint8Array(0);
        }
        /** Serialize container to bytes. */
        serialize() {
          const flags = packFlags(this.containerType, this.controlCmd);
          if (this.containerType === containerTypes_1.ContainerType.FIRST) {
            const buf = new ArrayBuffer(containerTypes_1.FIRST_HEADER_SIZE + this.payload.length);
            const view = new DataView(buf);
            const bytes = new Uint8Array(buf);
            view.setUint8(0, this.transactionId);
            view.setUint8(1, this.sequenceNumber);
            view.setUint8(2, flags);
            view.setUint16(3, this.totalLength, true);
            view.setUint8(5, this.payload.length);
            bytes.set(this.payload, containerTypes_1.FIRST_HEADER_SIZE);
            return bytes;
          } else {
            const buf = new ArrayBuffer(containerTypes_1.SUBSEQUENT_HEADER_SIZE + this.payload.length);
            const view = new DataView(buf);
            const bytes = new Uint8Array(buf);
            view.setUint8(0, this.transactionId);
            view.setUint8(1, this.sequenceNumber);
            view.setUint8(2, flags);
            view.setUint8(3, this.payload.length);
            bytes.set(this.payload, containerTypes_1.SUBSEQUENT_HEADER_SIZE);
            return bytes;
          }
        }
        /** Deserialize bytes into a Container. */
        static deserialize(data) {
          if (data.length < 4) {
            throw new Error(`Container too short: ${data.length} bytes`);
          }
          const transactionId = data[0];
          const sequenceNumber = data[1];
          const [containerType, controlCmd] = unpackFlags(data[2]);
          if (containerType === containerTypes_1.ContainerType.FIRST) {
            if (data.length < containerTypes_1.FIRST_HEADER_SIZE) {
              throw new Error(`FIRST container too short: ${data.length} bytes`);
            }
            const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
            const totalLength = view.getUint16(3, true);
            const payloadLen = data[5];
            if (data.length < containerTypes_1.FIRST_HEADER_SIZE + payloadLen) {
              throw new Error(`FIRST container payload truncated: need ${containerTypes_1.FIRST_HEADER_SIZE + payloadLen}, got ${data.length}`);
            }
            const payload = data.slice(containerTypes_1.FIRST_HEADER_SIZE, containerTypes_1.FIRST_HEADER_SIZE + payloadLen);
            return new _Container({
              transactionId,
              sequenceNumber,
              containerType,
              controlCmd,
              totalLength,
              payload
            });
          } else {
            const payloadLen = data[3];
            if (data.length < containerTypes_1.SUBSEQUENT_HEADER_SIZE + payloadLen) {
              throw new Error(`Container payload truncated: need ${containerTypes_1.SUBSEQUENT_HEADER_SIZE + payloadLen}, got ${data.length}`);
            }
            const payload = data.slice(containerTypes_1.SUBSEQUENT_HEADER_SIZE, containerTypes_1.SUBSEQUENT_HEADER_SIZE + payloadLen);
            return new _Container({
              transactionId,
              sequenceNumber,
              containerType,
              controlCmd,
              payload
            });
          }
        }
      };
      exports.Container = Container2;
    }
  });

  // node_modules/@blerpc/protocol-ts/dist/containerSplitter.js
  var require_containerSplitter = __commonJS({
    "node_modules/@blerpc/protocol-ts/dist/containerSplitter.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ContainerSplitter = void 0;
      var container_1 = require_container();
      var containerTypes_1 = require_containerTypes();
      var ContainerSplitter2 = class {
        constructor(mtu = 247) {
          this._transactionCounter = 0;
          this._mtu = mtu;
        }
        /** Usable bytes per BLE packet (MTU - ATT overhead). */
        get effectiveMtu() {
          return this._mtu - containerTypes_1.ATT_OVERHEAD;
        }
        /** Get next transaction ID (auto-increments, wraps at 256). */
        nextTransactionId() {
          const tid = this._transactionCounter;
          this._transactionCounter = this._transactionCounter + 1 & 255;
          return tid;
        }
        /**
         * Split payload into a list of containers.
         *
         * Throws if payload is too large for 8-bit sequence_number (>255 containers) or > 65535 bytes.
         */
        split(payload, transactionId) {
          transactionId = transactionId ?? this.nextTransactionId();
          const totalLength = payload.length;
          if (totalLength > 65535) {
            throw new Error(`Payload too large: ${totalLength} > 65535`);
          }
          const containers = [];
          const firstMaxPayload = this.effectiveMtu - containerTypes_1.FIRST_HEADER_SIZE;
          const firstEnd = firstMaxPayload < totalLength ? firstMaxPayload : totalLength;
          const firstPayload = payload.slice(0, firstEnd);
          containers.push(new container_1.Container({
            transactionId,
            sequenceNumber: 0,
            containerType: containerTypes_1.ContainerType.FIRST,
            totalLength,
            payload: firstPayload
          }));
          let offset = firstPayload.length;
          let seq = 1;
          const subsequentMaxPayload = this.effectiveMtu - containerTypes_1.SUBSEQUENT_HEADER_SIZE;
          while (offset < totalLength) {
            if (seq > 255) {
              throw new Error(`Payload requires more than 256 containers (seq=${seq}), exceeding 8-bit sequence_number limit`);
            }
            const chunkEnd = offset + subsequentMaxPayload < totalLength ? offset + subsequentMaxPayload : totalLength;
            const chunk = payload.slice(offset, chunkEnd);
            containers.push(new container_1.Container({
              transactionId,
              sequenceNumber: seq,
              containerType: containerTypes_1.ContainerType.SUBSEQUENT,
              payload: chunk
            }));
            offset += chunk.length;
            seq++;
          }
          return containers;
        }
      };
      exports.ContainerSplitter = ContainerSplitter2;
    }
  });

  // node_modules/@blerpc/protocol-ts/dist/containerAssembler.js
  var require_containerAssembler = __commonJS({
    "node_modules/@blerpc/protocol-ts/dist/containerAssembler.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.ContainerAssembler = void 0;
      var containerTypes_1 = require_containerTypes();
      var ContainerAssembler2 = class {
        constructor() {
          this._transactions = /* @__PURE__ */ new Map();
        }
        /** Feed a container. Returns complete payload when done, else null. */
        feed(container) {
          if (container.containerType === containerTypes_1.ContainerType.CONTROL) {
            return null;
          }
          const tid = container.transactionId;
          if (container.containerType === containerTypes_1.ContainerType.FIRST) {
            this._transactions.set(tid, {
              totalLength: container.totalLength,
              expectedSeq: 1,
              fragments: [container.payload],
              receivedLength: container.payload.length
            });
          } else if (this._transactions.has(tid)) {
            const state2 = this._transactions.get(tid);
            if (container.sequenceNumber !== state2.expectedSeq) {
              this._transactions.delete(tid);
              return null;
            }
            state2.fragments.push(container.payload);
            state2.receivedLength += container.payload.length;
            state2.expectedSeq += 1;
          } else {
            return null;
          }
          const state = this._transactions.get(tid);
          if (state.receivedLength >= state.totalLength) {
            const combined = new Uint8Array(state.receivedLength);
            let offset = 0;
            for (const f of state.fragments) {
              combined.set(f, offset);
              offset += f.length;
            }
            this._transactions.delete(tid);
            return combined.slice(0, state.totalLength);
          }
          return null;
        }
        /** Clear all pending assembly state. */
        reset() {
          this._transactions.clear();
        }
        /** Visible for testing: check if a transaction is tracked. */
        hasTransaction(tid) {
          return this._transactions.has(tid);
        }
      };
      exports.ContainerAssembler = ContainerAssembler2;
    }
  });

  // node_modules/@blerpc/protocol-ts/dist/commandPacket.js
  var require_commandPacket = __commonJS({
    "node_modules/@blerpc/protocol-ts/dist/commandPacket.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.CommandPacket = exports.CommandType = void 0;
      var CommandType2;
      (function(CommandType3) {
        CommandType3[CommandType3["REQUEST"] = 0] = "REQUEST";
        CommandType3[CommandType3["RESPONSE"] = 1] = "RESPONSE";
      })(CommandType2 || (exports.CommandType = CommandType2 = {}));
      var textEncoder = new TextEncoder();
      var textDecoder = new TextDecoder("utf-8");
      var CommandPacket2 = class _CommandPacket {
        constructor(params) {
          this.cmdType = params.cmdType;
          this.cmdName = params.cmdName;
          this.data = params.data ?? new Uint8Array(0);
        }
        /** Serialize command to bytes. */
        serialize() {
          const nameBytes = textEncoder.encode(this.cmdName);
          if (nameBytes.length > 255) {
            throw new Error(`cmd_name too long: ${nameBytes.length} > 255`);
          }
          if (this.data.length > 65535) {
            throw new Error(`data too long: ${this.data.length} > 65535`);
          }
          const byte0 = (this.cmdType & 1) << 7;
          const totalLen = 1 + 1 + nameBytes.length + 2 + this.data.length;
          const buf = new ArrayBuffer(totalLen);
          const view = new DataView(buf);
          const bytes = new Uint8Array(buf);
          let offset = 0;
          view.setUint8(offset++, byte0);
          view.setUint8(offset++, nameBytes.length);
          bytes.set(nameBytes, offset);
          offset += nameBytes.length;
          view.setUint16(offset, this.data.length, true);
          offset += 2;
          bytes.set(this.data, offset);
          return bytes;
        }
        /** Deserialize bytes into a CommandPacket. */
        static deserialize(data) {
          if (data.length < 2) {
            throw new Error(`Command packet too short: ${data.length} bytes`);
          }
          const cmdType = (data[0] >> 7 & 1) === 0 ? CommandType2.REQUEST : CommandType2.RESPONSE;
          const cmdNameLen = data[1];
          let offset = 2;
          if (data.length < offset + cmdNameLen + 2) {
            throw new Error("Command packet truncated");
          }
          const cmdName = textDecoder.decode(data.slice(offset, offset + cmdNameLen));
          offset += cmdNameLen;
          const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
          const dataLen = view.getUint16(offset, true);
          offset += 2;
          if (data.length < offset + dataLen) {
            throw new Error(`Command packet data truncated: need ${offset + dataLen}, got ${data.length}`);
          }
          const payload = data.slice(offset, offset + dataLen);
          return new _CommandPacket({
            cmdType,
            cmdName,
            data: payload
          });
        }
      };
      exports.CommandPacket = CommandPacket2;
    }
  });

  // node_modules/@blerpc/protocol-ts/dist/controlContainers.js
  var require_controlContainers = __commonJS({
    "node_modules/@blerpc/protocol-ts/dist/controlContainers.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.makeTimeoutRequest = makeTimeoutRequest2;
      exports.makeTimeoutResponse = makeTimeoutResponse;
      exports.makeStreamEndC2P = makeStreamEndC2P2;
      exports.makeStreamEndP2C = makeStreamEndP2C;
      exports.makeCapabilitiesRequest = makeCapabilitiesRequest2;
      exports.makeCapabilitiesResponse = makeCapabilitiesResponse;
      exports.makeErrorResponse = makeErrorResponse;
      exports.makeKeyExchange = makeKeyExchange2;
      var container_1 = require_container();
      var containerTypes_1 = require_containerTypes();
      function makeTimeoutRequest2(transactionId, sequenceNumber = 0) {
        return new container_1.Container({
          transactionId,
          sequenceNumber,
          containerType: containerTypes_1.ContainerType.CONTROL,
          controlCmd: containerTypes_1.ControlCmd.TIMEOUT
        });
      }
      function makeTimeoutResponse(transactionId, timeoutMs, sequenceNumber = 0) {
        const payload = new Uint8Array(2);
        const view = new DataView(payload.buffer);
        view.setUint16(0, timeoutMs, true);
        return new container_1.Container({
          transactionId,
          sequenceNumber,
          containerType: containerTypes_1.ContainerType.CONTROL,
          controlCmd: containerTypes_1.ControlCmd.TIMEOUT,
          payload
        });
      }
      function makeStreamEndC2P2(transactionId, sequenceNumber = 0) {
        return new container_1.Container({
          transactionId,
          sequenceNumber,
          containerType: containerTypes_1.ContainerType.CONTROL,
          controlCmd: containerTypes_1.ControlCmd.STREAM_END_C2P
        });
      }
      function makeStreamEndP2C(transactionId, sequenceNumber = 0) {
        return new container_1.Container({
          transactionId,
          sequenceNumber,
          containerType: containerTypes_1.ContainerType.CONTROL,
          controlCmd: containerTypes_1.ControlCmd.STREAM_END_P2C
        });
      }
      function makeCapabilitiesRequest2(transactionId, options = {}) {
        const payload = new Uint8Array(6);
        const view = new DataView(payload.buffer);
        view.setUint16(0, options.maxRequestPayloadSize ?? 0, true);
        view.setUint16(2, options.maxResponsePayloadSize ?? 0, true);
        view.setUint16(4, options.flags ?? 0, true);
        return new container_1.Container({
          transactionId,
          sequenceNumber: options.sequenceNumber ?? 0,
          containerType: containerTypes_1.ContainerType.CONTROL,
          controlCmd: containerTypes_1.ControlCmd.CAPABILITIES,
          payload
        });
      }
      function makeCapabilitiesResponse(transactionId, options) {
        const payload = new Uint8Array(6);
        const view = new DataView(payload.buffer);
        view.setUint16(0, options.maxRequestPayloadSize, true);
        view.setUint16(2, options.maxResponsePayloadSize, true);
        view.setUint16(4, options.flags ?? 0, true);
        return new container_1.Container({
          transactionId,
          sequenceNumber: options.sequenceNumber ?? 0,
          containerType: containerTypes_1.ContainerType.CONTROL,
          controlCmd: containerTypes_1.ControlCmd.CAPABILITIES,
          payload
        });
      }
      function makeErrorResponse(transactionId, errorCode, sequenceNumber = 0) {
        return new container_1.Container({
          transactionId,
          sequenceNumber,
          containerType: containerTypes_1.ContainerType.CONTROL,
          controlCmd: containerTypes_1.ControlCmd.ERROR,
          payload: new Uint8Array([errorCode])
        });
      }
      function makeKeyExchange2(transactionId, payload, sequenceNumber = 0) {
        return new container_1.Container({
          transactionId,
          sequenceNumber,
          containerType: containerTypes_1.ContainerType.CONTROL,
          controlCmd: containerTypes_1.ControlCmd.KEY_EXCHANGE,
          payload
        });
      }
    }
  });

  // node_modules/@noble/hashes/crypto.js
  var require_crypto = __commonJS({
    "node_modules/@noble/hashes/crypto.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.crypto = void 0;
      exports.crypto = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
    }
  });

  // node_modules/@noble/hashes/utils.js
  var require_utils = __commonJS({
    "node_modules/@noble/hashes/utils.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.wrapXOFConstructorWithOpts = exports.wrapConstructorWithOpts = exports.wrapConstructor = exports.Hash = exports.nextTick = exports.swap32IfBE = exports.byteSwapIfBE = exports.swap8IfBE = exports.isLE = void 0;
      exports.isBytes = isBytes;
      exports.anumber = anumber;
      exports.abytes = abytes;
      exports.ahash = ahash;
      exports.aexists = aexists;
      exports.aoutput = aoutput;
      exports.u8 = u8;
      exports.u32 = u32;
      exports.clean = clean;
      exports.createView = createView;
      exports.rotr = rotr;
      exports.rotl = rotl;
      exports.byteSwap = byteSwap;
      exports.byteSwap32 = byteSwap32;
      exports.bytesToHex = bytesToHex;
      exports.hexToBytes = hexToBytes;
      exports.asyncLoop = asyncLoop;
      exports.utf8ToBytes = utf8ToBytes;
      exports.bytesToUtf8 = bytesToUtf8;
      exports.toBytes = toBytes;
      exports.kdfInputToBytes = kdfInputToBytes;
      exports.concatBytes = concatBytes;
      exports.checkOpts = checkOpts;
      exports.createHasher = createHasher;
      exports.createOptHasher = createOptHasher;
      exports.createXOFer = createXOFer;
      exports.randomBytes = randomBytes;
      var crypto_1 = require_crypto();
      function isBytes(a) {
        return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
      }
      function anumber(n) {
        if (!Number.isSafeInteger(n) || n < 0)
          throw new Error("positive integer expected, got " + n);
      }
      function abytes(b, ...lengths) {
        if (!isBytes(b))
          throw new Error("Uint8Array expected");
        if (lengths.length > 0 && !lengths.includes(b.length))
          throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
      }
      function ahash(h) {
        if (typeof h !== "function" || typeof h.create !== "function")
          throw new Error("Hash should be wrapped by utils.createHasher");
        anumber(h.outputLen);
        anumber(h.blockLen);
      }
      function aexists(instance, checkFinished = true) {
        if (instance.destroyed)
          throw new Error("Hash instance has been destroyed");
        if (checkFinished && instance.finished)
          throw new Error("Hash#digest() has already been called");
      }
      function aoutput(out, instance) {
        abytes(out);
        const min = instance.outputLen;
        if (out.length < min) {
          throw new Error("digestInto() expects output buffer of length at least " + min);
        }
      }
      function u8(arr) {
        return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
      }
      function u32(arr) {
        return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
      }
      function clean(...arrays) {
        for (let i = 0; i < arrays.length; i++) {
          arrays[i].fill(0);
        }
      }
      function createView(arr) {
        return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
      }
      function rotr(word, shift) {
        return word << 32 - shift | word >>> shift;
      }
      function rotl(word, shift) {
        return word << shift | word >>> 32 - shift >>> 0;
      }
      exports.isLE = (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
      function byteSwap(word) {
        return word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
      }
      exports.swap8IfBE = exports.isLE ? (n) => n : (n) => byteSwap(n);
      exports.byteSwapIfBE = exports.swap8IfBE;
      function byteSwap32(arr) {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = byteSwap(arr[i]);
        }
        return arr;
      }
      exports.swap32IfBE = exports.isLE ? (u) => u : byteSwap32;
      var hasHexBuiltin = /* @__PURE__ */ (() => (
        // @ts-ignore
        typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
      ))();
      var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
      function bytesToHex(bytes) {
        abytes(bytes);
        if (hasHexBuiltin)
          return bytes.toHex();
        let hex = "";
        for (let i = 0; i < bytes.length; i++) {
          hex += hexes[bytes[i]];
        }
        return hex;
      }
      var asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
      function asciiToBase16(ch) {
        if (ch >= asciis._0 && ch <= asciis._9)
          return ch - asciis._0;
        if (ch >= asciis.A && ch <= asciis.F)
          return ch - (asciis.A - 10);
        if (ch >= asciis.a && ch <= asciis.f)
          return ch - (asciis.a - 10);
        return;
      }
      function hexToBytes(hex) {
        if (typeof hex !== "string")
          throw new Error("hex string expected, got " + typeof hex);
        if (hasHexBuiltin)
          return Uint8Array.fromHex(hex);
        const hl = hex.length;
        const al = hl / 2;
        if (hl % 2)
          throw new Error("hex string expected, got unpadded hex of length " + hl);
        const array = new Uint8Array(al);
        for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
          const n1 = asciiToBase16(hex.charCodeAt(hi));
          const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
          if (n1 === void 0 || n2 === void 0) {
            const char = hex[hi] + hex[hi + 1];
            throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
          }
          array[ai] = n1 * 16 + n2;
        }
        return array;
      }
      var nextTick = async () => {
      };
      exports.nextTick = nextTick;
      async function asyncLoop(iters, tick, cb) {
        let ts = Date.now();
        for (let i = 0; i < iters; i++) {
          cb(i);
          const diff = Date.now() - ts;
          if (diff >= 0 && diff < tick)
            continue;
          await (0, exports.nextTick)();
          ts += diff;
        }
      }
      function utf8ToBytes(str) {
        if (typeof str !== "string")
          throw new Error("string expected");
        return new Uint8Array(new TextEncoder().encode(str));
      }
      function bytesToUtf8(bytes) {
        return new TextDecoder().decode(bytes);
      }
      function toBytes(data) {
        if (typeof data === "string")
          data = utf8ToBytes(data);
        abytes(data);
        return data;
      }
      function kdfInputToBytes(data) {
        if (typeof data === "string")
          data = utf8ToBytes(data);
        abytes(data);
        return data;
      }
      function concatBytes(...arrays) {
        let sum = 0;
        for (let i = 0; i < arrays.length; i++) {
          const a = arrays[i];
          abytes(a);
          sum += a.length;
        }
        const res = new Uint8Array(sum);
        for (let i = 0, pad = 0; i < arrays.length; i++) {
          const a = arrays[i];
          res.set(a, pad);
          pad += a.length;
        }
        return res;
      }
      function checkOpts(defaults, opts) {
        if (opts !== void 0 && {}.toString.call(opts) !== "[object Object]")
          throw new Error("options should be object or undefined");
        const merged = Object.assign(defaults, opts);
        return merged;
      }
      var Hash = class {
      };
      exports.Hash = Hash;
      function createHasher(hashCons) {
        const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
        const tmp = hashCons();
        hashC.outputLen = tmp.outputLen;
        hashC.blockLen = tmp.blockLen;
        hashC.create = () => hashCons();
        return hashC;
      }
      function createOptHasher(hashCons) {
        const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
        const tmp = hashCons({});
        hashC.outputLen = tmp.outputLen;
        hashC.blockLen = tmp.blockLen;
        hashC.create = (opts) => hashCons(opts);
        return hashC;
      }
      function createXOFer(hashCons) {
        const hashC = (msg, opts) => hashCons(opts).update(toBytes(msg)).digest();
        const tmp = hashCons({});
        hashC.outputLen = tmp.outputLen;
        hashC.blockLen = tmp.blockLen;
        hashC.create = (opts) => hashCons(opts);
        return hashC;
      }
      exports.wrapConstructor = createHasher;
      exports.wrapConstructorWithOpts = createOptHasher;
      exports.wrapXOFConstructorWithOpts = createXOFer;
      function randomBytes(bytesLength = 32) {
        if (crypto_1.crypto && typeof crypto_1.crypto.getRandomValues === "function") {
          return crypto_1.crypto.getRandomValues(new Uint8Array(bytesLength));
        }
        if (crypto_1.crypto && typeof crypto_1.crypto.randomBytes === "function") {
          return Uint8Array.from(crypto_1.crypto.randomBytes(bytesLength));
        }
        throw new Error("crypto.getRandomValues must be defined");
      }
    }
  });

  // node_modules/@noble/hashes/_md.js
  var require_md = __commonJS({
    "node_modules/@noble/hashes/_md.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.SHA512_IV = exports.SHA384_IV = exports.SHA224_IV = exports.SHA256_IV = exports.HashMD = void 0;
      exports.setBigUint64 = setBigUint64;
      exports.Chi = Chi;
      exports.Maj = Maj;
      var utils_ts_1 = require_utils();
      function setBigUint64(view, byteOffset, value, isLE) {
        if (typeof view.setBigUint64 === "function")
          return view.setBigUint64(byteOffset, value, isLE);
        const _32n = BigInt(32);
        const _u32_max = BigInt(4294967295);
        const wh = Number(value >> _32n & _u32_max);
        const wl = Number(value & _u32_max);
        const h = isLE ? 4 : 0;
        const l = isLE ? 0 : 4;
        view.setUint32(byteOffset + h, wh, isLE);
        view.setUint32(byteOffset + l, wl, isLE);
      }
      function Chi(a, b, c) {
        return a & b ^ ~a & c;
      }
      function Maj(a, b, c) {
        return a & b ^ a & c ^ b & c;
      }
      var HashMD = class extends utils_ts_1.Hash {
        constructor(blockLen, outputLen, padOffset, isLE) {
          super();
          this.finished = false;
          this.length = 0;
          this.pos = 0;
          this.destroyed = false;
          this.blockLen = blockLen;
          this.outputLen = outputLen;
          this.padOffset = padOffset;
          this.isLE = isLE;
          this.buffer = new Uint8Array(blockLen);
          this.view = (0, utils_ts_1.createView)(this.buffer);
        }
        update(data) {
          (0, utils_ts_1.aexists)(this);
          data = (0, utils_ts_1.toBytes)(data);
          (0, utils_ts_1.abytes)(data);
          const { view, buffer, blockLen } = this;
          const len = data.length;
          for (let pos = 0; pos < len; ) {
            const take = Math.min(blockLen - this.pos, len - pos);
            if (take === blockLen) {
              const dataView = (0, utils_ts_1.createView)(data);
              for (; blockLen <= len - pos; pos += blockLen)
                this.process(dataView, pos);
              continue;
            }
            buffer.set(data.subarray(pos, pos + take), this.pos);
            this.pos += take;
            pos += take;
            if (this.pos === blockLen) {
              this.process(view, 0);
              this.pos = 0;
            }
          }
          this.length += data.length;
          this.roundClean();
          return this;
        }
        digestInto(out) {
          (0, utils_ts_1.aexists)(this);
          (0, utils_ts_1.aoutput)(out, this);
          this.finished = true;
          const { buffer, view, blockLen, isLE } = this;
          let { pos } = this;
          buffer[pos++] = 128;
          (0, utils_ts_1.clean)(this.buffer.subarray(pos));
          if (this.padOffset > blockLen - pos) {
            this.process(view, 0);
            pos = 0;
          }
          for (let i = pos; i < blockLen; i++)
            buffer[i] = 0;
          setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
          this.process(view, 0);
          const oview = (0, utils_ts_1.createView)(out);
          const len = this.outputLen;
          if (len % 4)
            throw new Error("_sha2: outputLen should be aligned to 32bit");
          const outLen = len / 4;
          const state = this.get();
          if (outLen > state.length)
            throw new Error("_sha2: outputLen bigger than state");
          for (let i = 0; i < outLen; i++)
            oview.setUint32(4 * i, state[i], isLE);
        }
        digest() {
          const { buffer, outputLen } = this;
          this.digestInto(buffer);
          const res = buffer.slice(0, outputLen);
          this.destroy();
          return res;
        }
        _cloneInto(to) {
          to || (to = new this.constructor());
          to.set(...this.get());
          const { blockLen, buffer, length, finished, destroyed, pos } = this;
          to.destroyed = destroyed;
          to.finished = finished;
          to.length = length;
          to.pos = pos;
          if (length % blockLen)
            to.buffer.set(buffer);
          return to;
        }
        clone() {
          return this._cloneInto();
        }
      };
      exports.HashMD = HashMD;
      exports.SHA256_IV = Uint32Array.from([
        1779033703,
        3144134277,
        1013904242,
        2773480762,
        1359893119,
        2600822924,
        528734635,
        1541459225
      ]);
      exports.SHA224_IV = Uint32Array.from([
        3238371032,
        914150663,
        812702999,
        4144912697,
        4290775857,
        1750603025,
        1694076839,
        3204075428
      ]);
      exports.SHA384_IV = Uint32Array.from([
        3418070365,
        3238371032,
        1654270250,
        914150663,
        2438529370,
        812702999,
        355462360,
        4144912697,
        1731405415,
        4290775857,
        2394180231,
        1750603025,
        3675008525,
        1694076839,
        1203062813,
        3204075428
      ]);
      exports.SHA512_IV = Uint32Array.from([
        1779033703,
        4089235720,
        3144134277,
        2227873595,
        1013904242,
        4271175723,
        2773480762,
        1595750129,
        1359893119,
        2917565137,
        2600822924,
        725511199,
        528734635,
        4215389547,
        1541459225,
        327033209
      ]);
    }
  });

  // node_modules/@noble/hashes/_u64.js
  var require_u64 = __commonJS({
    "node_modules/@noble/hashes/_u64.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.toBig = exports.shrSL = exports.shrSH = exports.rotrSL = exports.rotrSH = exports.rotrBL = exports.rotrBH = exports.rotr32L = exports.rotr32H = exports.rotlSL = exports.rotlSH = exports.rotlBL = exports.rotlBH = exports.add5L = exports.add5H = exports.add4L = exports.add4H = exports.add3L = exports.add3H = void 0;
      exports.add = add;
      exports.fromBig = fromBig;
      exports.split = split;
      var U32_MASK64 = /* @__PURE__ */ BigInt(2 ** 32 - 1);
      var _32n = /* @__PURE__ */ BigInt(32);
      function fromBig(n, le = false) {
        if (le)
          return { h: Number(n & U32_MASK64), l: Number(n >> _32n & U32_MASK64) };
        return { h: Number(n >> _32n & U32_MASK64) | 0, l: Number(n & U32_MASK64) | 0 };
      }
      function split(lst, le = false) {
        const len = lst.length;
        let Ah = new Uint32Array(len);
        let Al = new Uint32Array(len);
        for (let i = 0; i < len; i++) {
          const { h, l } = fromBig(lst[i], le);
          [Ah[i], Al[i]] = [h, l];
        }
        return [Ah, Al];
      }
      var toBig = (h, l) => BigInt(h >>> 0) << _32n | BigInt(l >>> 0);
      exports.toBig = toBig;
      var shrSH = (h, _l, s) => h >>> s;
      exports.shrSH = shrSH;
      var shrSL = (h, l, s) => h << 32 - s | l >>> s;
      exports.shrSL = shrSL;
      var rotrSH = (h, l, s) => h >>> s | l << 32 - s;
      exports.rotrSH = rotrSH;
      var rotrSL = (h, l, s) => h << 32 - s | l >>> s;
      exports.rotrSL = rotrSL;
      var rotrBH = (h, l, s) => h << 64 - s | l >>> s - 32;
      exports.rotrBH = rotrBH;
      var rotrBL = (h, l, s) => h >>> s - 32 | l << 64 - s;
      exports.rotrBL = rotrBL;
      var rotr32H = (_h, l) => l;
      exports.rotr32H = rotr32H;
      var rotr32L = (h, _l) => h;
      exports.rotr32L = rotr32L;
      var rotlSH = (h, l, s) => h << s | l >>> 32 - s;
      exports.rotlSH = rotlSH;
      var rotlSL = (h, l, s) => l << s | h >>> 32 - s;
      exports.rotlSL = rotlSL;
      var rotlBH = (h, l, s) => l << s - 32 | h >>> 64 - s;
      exports.rotlBH = rotlBH;
      var rotlBL = (h, l, s) => h << s - 32 | l >>> 64 - s;
      exports.rotlBL = rotlBL;
      function add(Ah, Al, Bh, Bl) {
        const l = (Al >>> 0) + (Bl >>> 0);
        return { h: Ah + Bh + (l / 2 ** 32 | 0) | 0, l: l | 0 };
      }
      var add3L = (Al, Bl, Cl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0);
      exports.add3L = add3L;
      var add3H = (low, Ah, Bh, Ch) => Ah + Bh + Ch + (low / 2 ** 32 | 0) | 0;
      exports.add3H = add3H;
      var add4L = (Al, Bl, Cl, Dl) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0);
      exports.add4L = add4L;
      var add4H = (low, Ah, Bh, Ch, Dh) => Ah + Bh + Ch + Dh + (low / 2 ** 32 | 0) | 0;
      exports.add4H = add4H;
      var add5L = (Al, Bl, Cl, Dl, El) => (Al >>> 0) + (Bl >>> 0) + (Cl >>> 0) + (Dl >>> 0) + (El >>> 0);
      exports.add5L = add5L;
      var add5H = (low, Ah, Bh, Ch, Dh, Eh) => Ah + Bh + Ch + Dh + Eh + (low / 2 ** 32 | 0) | 0;
      exports.add5H = add5H;
      var u64 = {
        fromBig,
        split,
        toBig,
        shrSH,
        shrSL,
        rotrSH,
        rotrSL,
        rotrBH,
        rotrBL,
        rotr32H,
        rotr32L,
        rotlSH,
        rotlSL,
        rotlBH,
        rotlBL,
        add,
        add3L,
        add3H,
        add4L,
        add4H,
        add5H,
        add5L
      };
      exports.default = u64;
    }
  });

  // node_modules/@noble/hashes/sha2.js
  var require_sha2 = __commonJS({
    "node_modules/@noble/hashes/sha2.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.sha512_224 = exports.sha512_256 = exports.sha384 = exports.sha512 = exports.sha224 = exports.sha256 = exports.SHA512_256 = exports.SHA512_224 = exports.SHA384 = exports.SHA512 = exports.SHA224 = exports.SHA256 = void 0;
      var _md_ts_1 = require_md();
      var u64 = require_u64();
      var utils_ts_1 = require_utils();
      var SHA256_K = /* @__PURE__ */ Uint32Array.from([
        1116352408,
        1899447441,
        3049323471,
        3921009573,
        961987163,
        1508970993,
        2453635748,
        2870763221,
        3624381080,
        310598401,
        607225278,
        1426881987,
        1925078388,
        2162078206,
        2614888103,
        3248222580,
        3835390401,
        4022224774,
        264347078,
        604807628,
        770255983,
        1249150122,
        1555081692,
        1996064986,
        2554220882,
        2821834349,
        2952996808,
        3210313671,
        3336571891,
        3584528711,
        113926993,
        338241895,
        666307205,
        773529912,
        1294757372,
        1396182291,
        1695183700,
        1986661051,
        2177026350,
        2456956037,
        2730485921,
        2820302411,
        3259730800,
        3345764771,
        3516065817,
        3600352804,
        4094571909,
        275423344,
        430227734,
        506948616,
        659060556,
        883997877,
        958139571,
        1322822218,
        1537002063,
        1747873779,
        1955562222,
        2024104815,
        2227730452,
        2361852424,
        2428436474,
        2756734187,
        3204031479,
        3329325298
      ]);
      var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
      var SHA256 = class extends _md_ts_1.HashMD {
        constructor(outputLen = 32) {
          super(64, outputLen, 8, false);
          this.A = _md_ts_1.SHA256_IV[0] | 0;
          this.B = _md_ts_1.SHA256_IV[1] | 0;
          this.C = _md_ts_1.SHA256_IV[2] | 0;
          this.D = _md_ts_1.SHA256_IV[3] | 0;
          this.E = _md_ts_1.SHA256_IV[4] | 0;
          this.F = _md_ts_1.SHA256_IV[5] | 0;
          this.G = _md_ts_1.SHA256_IV[6] | 0;
          this.H = _md_ts_1.SHA256_IV[7] | 0;
        }
        get() {
          const { A, B, C, D, E, F, G, H } = this;
          return [A, B, C, D, E, F, G, H];
        }
        // prettier-ignore
        set(A, B, C, D, E, F, G, H) {
          this.A = A | 0;
          this.B = B | 0;
          this.C = C | 0;
          this.D = D | 0;
          this.E = E | 0;
          this.F = F | 0;
          this.G = G | 0;
          this.H = H | 0;
        }
        process(view, offset) {
          for (let i = 0; i < 16; i++, offset += 4)
            SHA256_W[i] = view.getUint32(offset, false);
          for (let i = 16; i < 64; i++) {
            const W15 = SHA256_W[i - 15];
            const W2 = SHA256_W[i - 2];
            const s0 = (0, utils_ts_1.rotr)(W15, 7) ^ (0, utils_ts_1.rotr)(W15, 18) ^ W15 >>> 3;
            const s1 = (0, utils_ts_1.rotr)(W2, 17) ^ (0, utils_ts_1.rotr)(W2, 19) ^ W2 >>> 10;
            SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
          }
          let { A, B, C, D, E, F, G, H } = this;
          for (let i = 0; i < 64; i++) {
            const sigma1 = (0, utils_ts_1.rotr)(E, 6) ^ (0, utils_ts_1.rotr)(E, 11) ^ (0, utils_ts_1.rotr)(E, 25);
            const T1 = H + sigma1 + (0, _md_ts_1.Chi)(E, F, G) + SHA256_K[i] + SHA256_W[i] | 0;
            const sigma0 = (0, utils_ts_1.rotr)(A, 2) ^ (0, utils_ts_1.rotr)(A, 13) ^ (0, utils_ts_1.rotr)(A, 22);
            const T2 = sigma0 + (0, _md_ts_1.Maj)(A, B, C) | 0;
            H = G;
            G = F;
            F = E;
            E = D + T1 | 0;
            D = C;
            C = B;
            B = A;
            A = T1 + T2 | 0;
          }
          A = A + this.A | 0;
          B = B + this.B | 0;
          C = C + this.C | 0;
          D = D + this.D | 0;
          E = E + this.E | 0;
          F = F + this.F | 0;
          G = G + this.G | 0;
          H = H + this.H | 0;
          this.set(A, B, C, D, E, F, G, H);
        }
        roundClean() {
          (0, utils_ts_1.clean)(SHA256_W);
        }
        destroy() {
          this.set(0, 0, 0, 0, 0, 0, 0, 0);
          (0, utils_ts_1.clean)(this.buffer);
        }
      };
      exports.SHA256 = SHA256;
      var SHA224 = class extends SHA256 {
        constructor() {
          super(28);
          this.A = _md_ts_1.SHA224_IV[0] | 0;
          this.B = _md_ts_1.SHA224_IV[1] | 0;
          this.C = _md_ts_1.SHA224_IV[2] | 0;
          this.D = _md_ts_1.SHA224_IV[3] | 0;
          this.E = _md_ts_1.SHA224_IV[4] | 0;
          this.F = _md_ts_1.SHA224_IV[5] | 0;
          this.G = _md_ts_1.SHA224_IV[6] | 0;
          this.H = _md_ts_1.SHA224_IV[7] | 0;
        }
      };
      exports.SHA224 = SHA224;
      var K512 = /* @__PURE__ */ (() => u64.split([
        "0x428a2f98d728ae22",
        "0x7137449123ef65cd",
        "0xb5c0fbcfec4d3b2f",
        "0xe9b5dba58189dbbc",
        "0x3956c25bf348b538",
        "0x59f111f1b605d019",
        "0x923f82a4af194f9b",
        "0xab1c5ed5da6d8118",
        "0xd807aa98a3030242",
        "0x12835b0145706fbe",
        "0x243185be4ee4b28c",
        "0x550c7dc3d5ffb4e2",
        "0x72be5d74f27b896f",
        "0x80deb1fe3b1696b1",
        "0x9bdc06a725c71235",
        "0xc19bf174cf692694",
        "0xe49b69c19ef14ad2",
        "0xefbe4786384f25e3",
        "0x0fc19dc68b8cd5b5",
        "0x240ca1cc77ac9c65",
        "0x2de92c6f592b0275",
        "0x4a7484aa6ea6e483",
        "0x5cb0a9dcbd41fbd4",
        "0x76f988da831153b5",
        "0x983e5152ee66dfab",
        "0xa831c66d2db43210",
        "0xb00327c898fb213f",
        "0xbf597fc7beef0ee4",
        "0xc6e00bf33da88fc2",
        "0xd5a79147930aa725",
        "0x06ca6351e003826f",
        "0x142929670a0e6e70",
        "0x27b70a8546d22ffc",
        "0x2e1b21385c26c926",
        "0x4d2c6dfc5ac42aed",
        "0x53380d139d95b3df",
        "0x650a73548baf63de",
        "0x766a0abb3c77b2a8",
        "0x81c2c92e47edaee6",
        "0x92722c851482353b",
        "0xa2bfe8a14cf10364",
        "0xa81a664bbc423001",
        "0xc24b8b70d0f89791",
        "0xc76c51a30654be30",
        "0xd192e819d6ef5218",
        "0xd69906245565a910",
        "0xf40e35855771202a",
        "0x106aa07032bbd1b8",
        "0x19a4c116b8d2d0c8",
        "0x1e376c085141ab53",
        "0x2748774cdf8eeb99",
        "0x34b0bcb5e19b48a8",
        "0x391c0cb3c5c95a63",
        "0x4ed8aa4ae3418acb",
        "0x5b9cca4f7763e373",
        "0x682e6ff3d6b2b8a3",
        "0x748f82ee5defb2fc",
        "0x78a5636f43172f60",
        "0x84c87814a1f0ab72",
        "0x8cc702081a6439ec",
        "0x90befffa23631e28",
        "0xa4506cebde82bde9",
        "0xbef9a3f7b2c67915",
        "0xc67178f2e372532b",
        "0xca273eceea26619c",
        "0xd186b8c721c0c207",
        "0xeada7dd6cde0eb1e",
        "0xf57d4f7fee6ed178",
        "0x06f067aa72176fba",
        "0x0a637dc5a2c898a6",
        "0x113f9804bef90dae",
        "0x1b710b35131c471b",
        "0x28db77f523047d84",
        "0x32caab7b40c72493",
        "0x3c9ebe0a15c9bebc",
        "0x431d67c49c100d4c",
        "0x4cc5d4becb3e42b6",
        "0x597f299cfc657e2a",
        "0x5fcb6fab3ad6faec",
        "0x6c44198c4a475817"
      ].map((n) => BigInt(n))))();
      var SHA512_Kh = /* @__PURE__ */ (() => K512[0])();
      var SHA512_Kl = /* @__PURE__ */ (() => K512[1])();
      var SHA512_W_H = /* @__PURE__ */ new Uint32Array(80);
      var SHA512_W_L = /* @__PURE__ */ new Uint32Array(80);
      var SHA512 = class extends _md_ts_1.HashMD {
        constructor(outputLen = 64) {
          super(128, outputLen, 16, false);
          this.Ah = _md_ts_1.SHA512_IV[0] | 0;
          this.Al = _md_ts_1.SHA512_IV[1] | 0;
          this.Bh = _md_ts_1.SHA512_IV[2] | 0;
          this.Bl = _md_ts_1.SHA512_IV[3] | 0;
          this.Ch = _md_ts_1.SHA512_IV[4] | 0;
          this.Cl = _md_ts_1.SHA512_IV[5] | 0;
          this.Dh = _md_ts_1.SHA512_IV[6] | 0;
          this.Dl = _md_ts_1.SHA512_IV[7] | 0;
          this.Eh = _md_ts_1.SHA512_IV[8] | 0;
          this.El = _md_ts_1.SHA512_IV[9] | 0;
          this.Fh = _md_ts_1.SHA512_IV[10] | 0;
          this.Fl = _md_ts_1.SHA512_IV[11] | 0;
          this.Gh = _md_ts_1.SHA512_IV[12] | 0;
          this.Gl = _md_ts_1.SHA512_IV[13] | 0;
          this.Hh = _md_ts_1.SHA512_IV[14] | 0;
          this.Hl = _md_ts_1.SHA512_IV[15] | 0;
        }
        // prettier-ignore
        get() {
          const { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
          return [Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl];
        }
        // prettier-ignore
        set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl) {
          this.Ah = Ah | 0;
          this.Al = Al | 0;
          this.Bh = Bh | 0;
          this.Bl = Bl | 0;
          this.Ch = Ch | 0;
          this.Cl = Cl | 0;
          this.Dh = Dh | 0;
          this.Dl = Dl | 0;
          this.Eh = Eh | 0;
          this.El = El | 0;
          this.Fh = Fh | 0;
          this.Fl = Fl | 0;
          this.Gh = Gh | 0;
          this.Gl = Gl | 0;
          this.Hh = Hh | 0;
          this.Hl = Hl | 0;
        }
        process(view, offset) {
          for (let i = 0; i < 16; i++, offset += 4) {
            SHA512_W_H[i] = view.getUint32(offset);
            SHA512_W_L[i] = view.getUint32(offset += 4);
          }
          for (let i = 16; i < 80; i++) {
            const W15h = SHA512_W_H[i - 15] | 0;
            const W15l = SHA512_W_L[i - 15] | 0;
            const s0h = u64.rotrSH(W15h, W15l, 1) ^ u64.rotrSH(W15h, W15l, 8) ^ u64.shrSH(W15h, W15l, 7);
            const s0l = u64.rotrSL(W15h, W15l, 1) ^ u64.rotrSL(W15h, W15l, 8) ^ u64.shrSL(W15h, W15l, 7);
            const W2h = SHA512_W_H[i - 2] | 0;
            const W2l = SHA512_W_L[i - 2] | 0;
            const s1h = u64.rotrSH(W2h, W2l, 19) ^ u64.rotrBH(W2h, W2l, 61) ^ u64.shrSH(W2h, W2l, 6);
            const s1l = u64.rotrSL(W2h, W2l, 19) ^ u64.rotrBL(W2h, W2l, 61) ^ u64.shrSL(W2h, W2l, 6);
            const SUMl = u64.add4L(s0l, s1l, SHA512_W_L[i - 7], SHA512_W_L[i - 16]);
            const SUMh = u64.add4H(SUMl, s0h, s1h, SHA512_W_H[i - 7], SHA512_W_H[i - 16]);
            SHA512_W_H[i] = SUMh | 0;
            SHA512_W_L[i] = SUMl | 0;
          }
          let { Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl } = this;
          for (let i = 0; i < 80; i++) {
            const sigma1h = u64.rotrSH(Eh, El, 14) ^ u64.rotrSH(Eh, El, 18) ^ u64.rotrBH(Eh, El, 41);
            const sigma1l = u64.rotrSL(Eh, El, 14) ^ u64.rotrSL(Eh, El, 18) ^ u64.rotrBL(Eh, El, 41);
            const CHIh = Eh & Fh ^ ~Eh & Gh;
            const CHIl = El & Fl ^ ~El & Gl;
            const T1ll = u64.add5L(Hl, sigma1l, CHIl, SHA512_Kl[i], SHA512_W_L[i]);
            const T1h = u64.add5H(T1ll, Hh, sigma1h, CHIh, SHA512_Kh[i], SHA512_W_H[i]);
            const T1l = T1ll | 0;
            const sigma0h = u64.rotrSH(Ah, Al, 28) ^ u64.rotrBH(Ah, Al, 34) ^ u64.rotrBH(Ah, Al, 39);
            const sigma0l = u64.rotrSL(Ah, Al, 28) ^ u64.rotrBL(Ah, Al, 34) ^ u64.rotrBL(Ah, Al, 39);
            const MAJh = Ah & Bh ^ Ah & Ch ^ Bh & Ch;
            const MAJl = Al & Bl ^ Al & Cl ^ Bl & Cl;
            Hh = Gh | 0;
            Hl = Gl | 0;
            Gh = Fh | 0;
            Gl = Fl | 0;
            Fh = Eh | 0;
            Fl = El | 0;
            ({ h: Eh, l: El } = u64.add(Dh | 0, Dl | 0, T1h | 0, T1l | 0));
            Dh = Ch | 0;
            Dl = Cl | 0;
            Ch = Bh | 0;
            Cl = Bl | 0;
            Bh = Ah | 0;
            Bl = Al | 0;
            const All = u64.add3L(T1l, sigma0l, MAJl);
            Ah = u64.add3H(All, T1h, sigma0h, MAJh);
            Al = All | 0;
          }
          ({ h: Ah, l: Al } = u64.add(this.Ah | 0, this.Al | 0, Ah | 0, Al | 0));
          ({ h: Bh, l: Bl } = u64.add(this.Bh | 0, this.Bl | 0, Bh | 0, Bl | 0));
          ({ h: Ch, l: Cl } = u64.add(this.Ch | 0, this.Cl | 0, Ch | 0, Cl | 0));
          ({ h: Dh, l: Dl } = u64.add(this.Dh | 0, this.Dl | 0, Dh | 0, Dl | 0));
          ({ h: Eh, l: El } = u64.add(this.Eh | 0, this.El | 0, Eh | 0, El | 0));
          ({ h: Fh, l: Fl } = u64.add(this.Fh | 0, this.Fl | 0, Fh | 0, Fl | 0));
          ({ h: Gh, l: Gl } = u64.add(this.Gh | 0, this.Gl | 0, Gh | 0, Gl | 0));
          ({ h: Hh, l: Hl } = u64.add(this.Hh | 0, this.Hl | 0, Hh | 0, Hl | 0));
          this.set(Ah, Al, Bh, Bl, Ch, Cl, Dh, Dl, Eh, El, Fh, Fl, Gh, Gl, Hh, Hl);
        }
        roundClean() {
          (0, utils_ts_1.clean)(SHA512_W_H, SHA512_W_L);
        }
        destroy() {
          (0, utils_ts_1.clean)(this.buffer);
          this.set(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        }
      };
      exports.SHA512 = SHA512;
      var SHA384 = class extends SHA512 {
        constructor() {
          super(48);
          this.Ah = _md_ts_1.SHA384_IV[0] | 0;
          this.Al = _md_ts_1.SHA384_IV[1] | 0;
          this.Bh = _md_ts_1.SHA384_IV[2] | 0;
          this.Bl = _md_ts_1.SHA384_IV[3] | 0;
          this.Ch = _md_ts_1.SHA384_IV[4] | 0;
          this.Cl = _md_ts_1.SHA384_IV[5] | 0;
          this.Dh = _md_ts_1.SHA384_IV[6] | 0;
          this.Dl = _md_ts_1.SHA384_IV[7] | 0;
          this.Eh = _md_ts_1.SHA384_IV[8] | 0;
          this.El = _md_ts_1.SHA384_IV[9] | 0;
          this.Fh = _md_ts_1.SHA384_IV[10] | 0;
          this.Fl = _md_ts_1.SHA384_IV[11] | 0;
          this.Gh = _md_ts_1.SHA384_IV[12] | 0;
          this.Gl = _md_ts_1.SHA384_IV[13] | 0;
          this.Hh = _md_ts_1.SHA384_IV[14] | 0;
          this.Hl = _md_ts_1.SHA384_IV[15] | 0;
        }
      };
      exports.SHA384 = SHA384;
      var T224_IV = /* @__PURE__ */ Uint32Array.from([
        2352822216,
        424955298,
        1944164710,
        2312950998,
        502970286,
        855612546,
        1738396948,
        1479516111,
        258812777,
        2077511080,
        2011393907,
        79989058,
        1067287976,
        1780299464,
        286451373,
        2446758561
      ]);
      var T256_IV = /* @__PURE__ */ Uint32Array.from([
        573645204,
        4230739756,
        2673172387,
        3360449730,
        596883563,
        1867755857,
        2520282905,
        1497426621,
        2519219938,
        2827943907,
        3193839141,
        1401305490,
        721525244,
        746961066,
        246885852,
        2177182882
      ]);
      var SHA512_224 = class extends SHA512 {
        constructor() {
          super(28);
          this.Ah = T224_IV[0] | 0;
          this.Al = T224_IV[1] | 0;
          this.Bh = T224_IV[2] | 0;
          this.Bl = T224_IV[3] | 0;
          this.Ch = T224_IV[4] | 0;
          this.Cl = T224_IV[5] | 0;
          this.Dh = T224_IV[6] | 0;
          this.Dl = T224_IV[7] | 0;
          this.Eh = T224_IV[8] | 0;
          this.El = T224_IV[9] | 0;
          this.Fh = T224_IV[10] | 0;
          this.Fl = T224_IV[11] | 0;
          this.Gh = T224_IV[12] | 0;
          this.Gl = T224_IV[13] | 0;
          this.Hh = T224_IV[14] | 0;
          this.Hl = T224_IV[15] | 0;
        }
      };
      exports.SHA512_224 = SHA512_224;
      var SHA512_256 = class extends SHA512 {
        constructor() {
          super(32);
          this.Ah = T256_IV[0] | 0;
          this.Al = T256_IV[1] | 0;
          this.Bh = T256_IV[2] | 0;
          this.Bl = T256_IV[3] | 0;
          this.Ch = T256_IV[4] | 0;
          this.Cl = T256_IV[5] | 0;
          this.Dh = T256_IV[6] | 0;
          this.Dl = T256_IV[7] | 0;
          this.Eh = T256_IV[8] | 0;
          this.El = T256_IV[9] | 0;
          this.Fh = T256_IV[10] | 0;
          this.Fl = T256_IV[11] | 0;
          this.Gh = T256_IV[12] | 0;
          this.Gl = T256_IV[13] | 0;
          this.Hh = T256_IV[14] | 0;
          this.Hl = T256_IV[15] | 0;
        }
      };
      exports.SHA512_256 = SHA512_256;
      exports.sha256 = (0, utils_ts_1.createHasher)(() => new SHA256());
      exports.sha224 = (0, utils_ts_1.createHasher)(() => new SHA224());
      exports.sha512 = (0, utils_ts_1.createHasher)(() => new SHA512());
      exports.sha384 = (0, utils_ts_1.createHasher)(() => new SHA384());
      exports.sha512_256 = (0, utils_ts_1.createHasher)(() => new SHA512_256());
      exports.sha512_224 = (0, utils_ts_1.createHasher)(() => new SHA512_224());
    }
  });

  // node_modules/@noble/curves/utils.js
  var require_utils2 = __commonJS({
    "node_modules/@noble/curves/utils.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.notImplemented = exports.bitMask = exports.utf8ToBytes = exports.randomBytes = exports.isBytes = exports.hexToBytes = exports.concatBytes = exports.bytesToUtf8 = exports.bytesToHex = exports.anumber = exports.abytes = void 0;
      exports.abool = abool;
      exports._abool2 = _abool2;
      exports._abytes2 = _abytes2;
      exports.numberToHexUnpadded = numberToHexUnpadded;
      exports.hexToNumber = hexToNumber;
      exports.bytesToNumberBE = bytesToNumberBE;
      exports.bytesToNumberLE = bytesToNumberLE;
      exports.numberToBytesBE = numberToBytesBE;
      exports.numberToBytesLE = numberToBytesLE;
      exports.numberToVarBytesBE = numberToVarBytesBE;
      exports.ensureBytes = ensureBytes;
      exports.equalBytes = equalBytes;
      exports.copyBytes = copyBytes;
      exports.asciiToBytes = asciiToBytes;
      exports.inRange = inRange;
      exports.aInRange = aInRange;
      exports.bitLen = bitLen;
      exports.bitGet = bitGet;
      exports.bitSet = bitSet;
      exports.createHmacDrbg = createHmacDrbg;
      exports.validateObject = validateObject;
      exports.isHash = isHash;
      exports._validateObject = _validateObject;
      exports.memoized = memoized;
      var utils_js_1 = require_utils();
      var utils_js_2 = require_utils();
      Object.defineProperty(exports, "abytes", { enumerable: true, get: function() {
        return utils_js_2.abytes;
      } });
      Object.defineProperty(exports, "anumber", { enumerable: true, get: function() {
        return utils_js_2.anumber;
      } });
      Object.defineProperty(exports, "bytesToHex", { enumerable: true, get: function() {
        return utils_js_2.bytesToHex;
      } });
      Object.defineProperty(exports, "bytesToUtf8", { enumerable: true, get: function() {
        return utils_js_2.bytesToUtf8;
      } });
      Object.defineProperty(exports, "concatBytes", { enumerable: true, get: function() {
        return utils_js_2.concatBytes;
      } });
      Object.defineProperty(exports, "hexToBytes", { enumerable: true, get: function() {
        return utils_js_2.hexToBytes;
      } });
      Object.defineProperty(exports, "isBytes", { enumerable: true, get: function() {
        return utils_js_2.isBytes;
      } });
      Object.defineProperty(exports, "randomBytes", { enumerable: true, get: function() {
        return utils_js_2.randomBytes;
      } });
      Object.defineProperty(exports, "utf8ToBytes", { enumerable: true, get: function() {
        return utils_js_2.utf8ToBytes;
      } });
      var _0n = /* @__PURE__ */ BigInt(0);
      var _1n = /* @__PURE__ */ BigInt(1);
      function abool(title, value) {
        if (typeof value !== "boolean")
          throw new Error(title + " boolean expected, got " + value);
      }
      function _abool2(value, title = "") {
        if (typeof value !== "boolean") {
          const prefix = title && `"${title}"`;
          throw new Error(prefix + "expected boolean, got type=" + typeof value);
        }
        return value;
      }
      function _abytes2(value, length, title = "") {
        const bytes = (0, utils_js_1.isBytes)(value);
        const len = value?.length;
        const needsLen = length !== void 0;
        if (!bytes || needsLen && len !== length) {
          const prefix = title && `"${title}" `;
          const ofLen = needsLen ? ` of length ${length}` : "";
          const got = bytes ? `length=${len}` : `type=${typeof value}`;
          throw new Error(prefix + "expected Uint8Array" + ofLen + ", got " + got);
        }
        return value;
      }
      function numberToHexUnpadded(num) {
        const hex = num.toString(16);
        return hex.length & 1 ? "0" + hex : hex;
      }
      function hexToNumber(hex) {
        if (typeof hex !== "string")
          throw new Error("hex string expected, got " + typeof hex);
        return hex === "" ? _0n : BigInt("0x" + hex);
      }
      function bytesToNumberBE(bytes) {
        return hexToNumber((0, utils_js_1.bytesToHex)(bytes));
      }
      function bytesToNumberLE(bytes) {
        (0, utils_js_1.abytes)(bytes);
        return hexToNumber((0, utils_js_1.bytesToHex)(Uint8Array.from(bytes).reverse()));
      }
      function numberToBytesBE(n, len) {
        return (0, utils_js_1.hexToBytes)(n.toString(16).padStart(len * 2, "0"));
      }
      function numberToBytesLE(n, len) {
        return numberToBytesBE(n, len).reverse();
      }
      function numberToVarBytesBE(n) {
        return (0, utils_js_1.hexToBytes)(numberToHexUnpadded(n));
      }
      function ensureBytes(title, hex, expectedLength) {
        let res;
        if (typeof hex === "string") {
          try {
            res = (0, utils_js_1.hexToBytes)(hex);
          } catch (e) {
            throw new Error(title + " must be hex string or Uint8Array, cause: " + e);
          }
        } else if ((0, utils_js_1.isBytes)(hex)) {
          res = Uint8Array.from(hex);
        } else {
          throw new Error(title + " must be hex string or Uint8Array");
        }
        const len = res.length;
        if (typeof expectedLength === "number" && len !== expectedLength)
          throw new Error(title + " of length " + expectedLength + " expected, got " + len);
        return res;
      }
      function equalBytes(a, b) {
        if (a.length !== b.length)
          return false;
        let diff = 0;
        for (let i = 0; i < a.length; i++)
          diff |= a[i] ^ b[i];
        return diff === 0;
      }
      function copyBytes(bytes) {
        return Uint8Array.from(bytes);
      }
      function asciiToBytes(ascii) {
        return Uint8Array.from(ascii, (c, i) => {
          const charCode = c.charCodeAt(0);
          if (c.length !== 1 || charCode > 127) {
            throw new Error(`string contains non-ASCII character "${ascii[i]}" with code ${charCode} at position ${i}`);
          }
          return charCode;
        });
      }
      var isPosBig = (n) => typeof n === "bigint" && _0n <= n;
      function inRange(n, min, max) {
        return isPosBig(n) && isPosBig(min) && isPosBig(max) && min <= n && n < max;
      }
      function aInRange(title, n, min, max) {
        if (!inRange(n, min, max))
          throw new Error("expected valid " + title + ": " + min + " <= n < " + max + ", got " + n);
      }
      function bitLen(n) {
        let len;
        for (len = 0; n > _0n; n >>= _1n, len += 1)
          ;
        return len;
      }
      function bitGet(n, pos) {
        return n >> BigInt(pos) & _1n;
      }
      function bitSet(n, pos, value) {
        return n | (value ? _1n : _0n) << BigInt(pos);
      }
      var bitMask = (n) => (_1n << BigInt(n)) - _1n;
      exports.bitMask = bitMask;
      function createHmacDrbg(hashLen, qByteLen, hmacFn) {
        if (typeof hashLen !== "number" || hashLen < 2)
          throw new Error("hashLen must be a number");
        if (typeof qByteLen !== "number" || qByteLen < 2)
          throw new Error("qByteLen must be a number");
        if (typeof hmacFn !== "function")
          throw new Error("hmacFn must be a function");
        const u8n = (len) => new Uint8Array(len);
        const u8of = (byte) => Uint8Array.of(byte);
        let v = u8n(hashLen);
        let k = u8n(hashLen);
        let i = 0;
        const reset = () => {
          v.fill(1);
          k.fill(0);
          i = 0;
        };
        const h = (...b) => hmacFn(k, v, ...b);
        const reseed = (seed = u8n(0)) => {
          k = h(u8of(0), seed);
          v = h();
          if (seed.length === 0)
            return;
          k = h(u8of(1), seed);
          v = h();
        };
        const gen = () => {
          if (i++ >= 1e3)
            throw new Error("drbg: tried 1000 values");
          let len = 0;
          const out = [];
          while (len < qByteLen) {
            v = h();
            const sl = v.slice();
            out.push(sl);
            len += v.length;
          }
          return (0, utils_js_1.concatBytes)(...out);
        };
        const genUntil = (seed, pred) => {
          reset();
          reseed(seed);
          let res = void 0;
          while (!(res = pred(gen())))
            reseed();
          reset();
          return res;
        };
        return genUntil;
      }
      var validatorFns = {
        bigint: (val) => typeof val === "bigint",
        function: (val) => typeof val === "function",
        boolean: (val) => typeof val === "boolean",
        string: (val) => typeof val === "string",
        stringOrUint8Array: (val) => typeof val === "string" || (0, utils_js_1.isBytes)(val),
        isSafeInteger: (val) => Number.isSafeInteger(val),
        array: (val) => Array.isArray(val),
        field: (val, object) => object.Fp.isValid(val),
        hash: (val) => typeof val === "function" && Number.isSafeInteger(val.outputLen)
      };
      function validateObject(object, validators, optValidators = {}) {
        const checkField = (fieldName, type, isOptional) => {
          const checkVal = validatorFns[type];
          if (typeof checkVal !== "function")
            throw new Error("invalid validator function");
          const val = object[fieldName];
          if (isOptional && val === void 0)
            return;
          if (!checkVal(val, object)) {
            throw new Error("param " + String(fieldName) + " is invalid. Expected " + type + ", got " + val);
          }
        };
        for (const [fieldName, type] of Object.entries(validators))
          checkField(fieldName, type, false);
        for (const [fieldName, type] of Object.entries(optValidators))
          checkField(fieldName, type, true);
        return object;
      }
      function isHash(val) {
        return typeof val === "function" && Number.isSafeInteger(val.outputLen);
      }
      function _validateObject(object, fields, optFields = {}) {
        if (!object || typeof object !== "object")
          throw new Error("expected valid options object");
        function checkField(fieldName, expectedType, isOpt) {
          const val = object[fieldName];
          if (isOpt && val === void 0)
            return;
          const current = typeof val;
          if (current !== expectedType || val === null)
            throw new Error(`param "${fieldName}" is invalid: expected ${expectedType}, got ${current}`);
        }
        Object.entries(fields).forEach(([k, v]) => checkField(k, v, false));
        Object.entries(optFields).forEach(([k, v]) => checkField(k, v, true));
      }
      var notImplemented = () => {
        throw new Error("not implemented");
      };
      exports.notImplemented = notImplemented;
      function memoized(fn) {
        const map = /* @__PURE__ */ new WeakMap();
        return (arg, ...args) => {
          const val = map.get(arg);
          if (val !== void 0)
            return val;
          const computed = fn(arg, ...args);
          map.set(arg, computed);
          return computed;
        };
      }
    }
  });

  // node_modules/@noble/curves/abstract/modular.js
  var require_modular = __commonJS({
    "node_modules/@noble/curves/abstract/modular.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.isNegativeLE = void 0;
      exports.mod = mod;
      exports.pow = pow;
      exports.pow2 = pow2;
      exports.invert = invert;
      exports.tonelliShanks = tonelliShanks;
      exports.FpSqrt = FpSqrt;
      exports.validateField = validateField;
      exports.FpPow = FpPow;
      exports.FpInvertBatch = FpInvertBatch;
      exports.FpDiv = FpDiv;
      exports.FpLegendre = FpLegendre;
      exports.FpIsSquare = FpIsSquare;
      exports.nLength = nLength;
      exports.Field = Field;
      exports.FpSqrtOdd = FpSqrtOdd;
      exports.FpSqrtEven = FpSqrtEven;
      exports.hashToPrivateScalar = hashToPrivateScalar;
      exports.getFieldBytesLength = getFieldBytesLength;
      exports.getMinHashLength = getMinHashLength;
      exports.mapHashToField = mapHashToField;
      var utils_ts_1 = require_utils2();
      var _0n = BigInt(0);
      var _1n = BigInt(1);
      var _2n = /* @__PURE__ */ BigInt(2);
      var _3n = /* @__PURE__ */ BigInt(3);
      var _4n = /* @__PURE__ */ BigInt(4);
      var _5n = /* @__PURE__ */ BigInt(5);
      var _7n = /* @__PURE__ */ BigInt(7);
      var _8n = /* @__PURE__ */ BigInt(8);
      var _9n = /* @__PURE__ */ BigInt(9);
      var _16n = /* @__PURE__ */ BigInt(16);
      function mod(a, b) {
        const result = a % b;
        return result >= _0n ? result : b + result;
      }
      function pow(num, power, modulo) {
        return FpPow(Field(modulo), num, power);
      }
      function pow2(x, power, modulo) {
        let res = x;
        while (power-- > _0n) {
          res *= res;
          res %= modulo;
        }
        return res;
      }
      function invert(number, modulo) {
        if (number === _0n)
          throw new Error("invert: expected non-zero number");
        if (modulo <= _0n)
          throw new Error("invert: expected positive modulus, got " + modulo);
        let a = mod(number, modulo);
        let b = modulo;
        let x = _0n, y = _1n, u = _1n, v = _0n;
        while (a !== _0n) {
          const q = b / a;
          const r = b % a;
          const m = x - u * q;
          const n = y - v * q;
          b = a, a = r, x = u, y = v, u = m, v = n;
        }
        const gcd = b;
        if (gcd !== _1n)
          throw new Error("invert: does not exist");
        return mod(x, modulo);
      }
      function assertIsSquare(Fp, root, n) {
        if (!Fp.eql(Fp.sqr(root), n))
          throw new Error("Cannot find square root");
      }
      function sqrt3mod4(Fp, n) {
        const p1div4 = (Fp.ORDER + _1n) / _4n;
        const root = Fp.pow(n, p1div4);
        assertIsSquare(Fp, root, n);
        return root;
      }
      function sqrt5mod8(Fp, n) {
        const p5div8 = (Fp.ORDER - _5n) / _8n;
        const n2 = Fp.mul(n, _2n);
        const v = Fp.pow(n2, p5div8);
        const nv = Fp.mul(n, v);
        const i = Fp.mul(Fp.mul(nv, _2n), v);
        const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
        assertIsSquare(Fp, root, n);
        return root;
      }
      function sqrt9mod16(P) {
        const Fp_ = Field(P);
        const tn = tonelliShanks(P);
        const c1 = tn(Fp_, Fp_.neg(Fp_.ONE));
        const c2 = tn(Fp_, c1);
        const c3 = tn(Fp_, Fp_.neg(c1));
        const c4 = (P + _7n) / _16n;
        return (Fp, n) => {
          let tv1 = Fp.pow(n, c4);
          let tv2 = Fp.mul(tv1, c1);
          const tv3 = Fp.mul(tv1, c2);
          const tv4 = Fp.mul(tv1, c3);
          const e1 = Fp.eql(Fp.sqr(tv2), n);
          const e2 = Fp.eql(Fp.sqr(tv3), n);
          tv1 = Fp.cmov(tv1, tv2, e1);
          tv2 = Fp.cmov(tv4, tv3, e2);
          const e3 = Fp.eql(Fp.sqr(tv2), n);
          const root = Fp.cmov(tv1, tv2, e3);
          assertIsSquare(Fp, root, n);
          return root;
        };
      }
      function tonelliShanks(P) {
        if (P < _3n)
          throw new Error("sqrt is not defined for small field");
        let Q = P - _1n;
        let S = 0;
        while (Q % _2n === _0n) {
          Q /= _2n;
          S++;
        }
        let Z = _2n;
        const _Fp = Field(P);
        while (FpLegendre(_Fp, Z) === 1) {
          if (Z++ > 1e3)
            throw new Error("Cannot find square root: probably non-prime P");
        }
        if (S === 1)
          return sqrt3mod4;
        let cc = _Fp.pow(Z, Q);
        const Q1div2 = (Q + _1n) / _2n;
        return function tonelliSlow(Fp, n) {
          if (Fp.is0(n))
            return n;
          if (FpLegendre(Fp, n) !== 1)
            throw new Error("Cannot find square root");
          let M = S;
          let c = Fp.mul(Fp.ONE, cc);
          let t = Fp.pow(n, Q);
          let R = Fp.pow(n, Q1div2);
          while (!Fp.eql(t, Fp.ONE)) {
            if (Fp.is0(t))
              return Fp.ZERO;
            let i = 1;
            let t_tmp = Fp.sqr(t);
            while (!Fp.eql(t_tmp, Fp.ONE)) {
              i++;
              t_tmp = Fp.sqr(t_tmp);
              if (i === M)
                throw new Error("Cannot find square root");
            }
            const exponent = _1n << BigInt(M - i - 1);
            const b = Fp.pow(c, exponent);
            M = i;
            c = Fp.sqr(b);
            t = Fp.mul(t, c);
            R = Fp.mul(R, b);
          }
          return R;
        };
      }
      function FpSqrt(P) {
        if (P % _4n === _3n)
          return sqrt3mod4;
        if (P % _8n === _5n)
          return sqrt5mod8;
        if (P % _16n === _9n)
          return sqrt9mod16(P);
        return tonelliShanks(P);
      }
      var isNegativeLE = (num, modulo) => (mod(num, modulo) & _1n) === _1n;
      exports.isNegativeLE = isNegativeLE;
      var FIELD_FIELDS = [
        "create",
        "isValid",
        "is0",
        "neg",
        "inv",
        "sqrt",
        "sqr",
        "eql",
        "add",
        "sub",
        "mul",
        "pow",
        "div",
        "addN",
        "subN",
        "mulN",
        "sqrN"
      ];
      function validateField(field) {
        const initial = {
          ORDER: "bigint",
          MASK: "bigint",
          BYTES: "number",
          BITS: "number"
        };
        const opts = FIELD_FIELDS.reduce((map, val) => {
          map[val] = "function";
          return map;
        }, initial);
        (0, utils_ts_1._validateObject)(field, opts);
        return field;
      }
      function FpPow(Fp, num, power) {
        if (power < _0n)
          throw new Error("invalid exponent, negatives unsupported");
        if (power === _0n)
          return Fp.ONE;
        if (power === _1n)
          return num;
        let p = Fp.ONE;
        let d = num;
        while (power > _0n) {
          if (power & _1n)
            p = Fp.mul(p, d);
          d = Fp.sqr(d);
          power >>= _1n;
        }
        return p;
      }
      function FpInvertBatch(Fp, nums, passZero = false) {
        const inverted = new Array(nums.length).fill(passZero ? Fp.ZERO : void 0);
        const multipliedAcc = nums.reduce((acc, num, i) => {
          if (Fp.is0(num))
            return acc;
          inverted[i] = acc;
          return Fp.mul(acc, num);
        }, Fp.ONE);
        const invertedAcc = Fp.inv(multipliedAcc);
        nums.reduceRight((acc, num, i) => {
          if (Fp.is0(num))
            return acc;
          inverted[i] = Fp.mul(acc, inverted[i]);
          return Fp.mul(acc, num);
        }, invertedAcc);
        return inverted;
      }
      function FpDiv(Fp, lhs, rhs) {
        return Fp.mul(lhs, typeof rhs === "bigint" ? invert(rhs, Fp.ORDER) : Fp.inv(rhs));
      }
      function FpLegendre(Fp, n) {
        const p1mod2 = (Fp.ORDER - _1n) / _2n;
        const powered = Fp.pow(n, p1mod2);
        const yes = Fp.eql(powered, Fp.ONE);
        const zero = Fp.eql(powered, Fp.ZERO);
        const no = Fp.eql(powered, Fp.neg(Fp.ONE));
        if (!yes && !zero && !no)
          throw new Error("invalid Legendre symbol result");
        return yes ? 1 : zero ? 0 : -1;
      }
      function FpIsSquare(Fp, n) {
        const l = FpLegendre(Fp, n);
        return l === 1;
      }
      function nLength(n, nBitLength) {
        if (nBitLength !== void 0)
          (0, utils_ts_1.anumber)(nBitLength);
        const _nBitLength = nBitLength !== void 0 ? nBitLength : n.toString(2).length;
        const nByteLength = Math.ceil(_nBitLength / 8);
        return { nBitLength: _nBitLength, nByteLength };
      }
      function Field(ORDER, bitLenOrOpts, isLE = false, opts = {}) {
        if (ORDER <= _0n)
          throw new Error("invalid field: expected ORDER > 0, got " + ORDER);
        let _nbitLength = void 0;
        let _sqrt = void 0;
        let modFromBytes = false;
        let allowedLengths = void 0;
        if (typeof bitLenOrOpts === "object" && bitLenOrOpts != null) {
          if (opts.sqrt || isLE)
            throw new Error("cannot specify opts in two arguments");
          const _opts = bitLenOrOpts;
          if (_opts.BITS)
            _nbitLength = _opts.BITS;
          if (_opts.sqrt)
            _sqrt = _opts.sqrt;
          if (typeof _opts.isLE === "boolean")
            isLE = _opts.isLE;
          if (typeof _opts.modFromBytes === "boolean")
            modFromBytes = _opts.modFromBytes;
          allowedLengths = _opts.allowedLengths;
        } else {
          if (typeof bitLenOrOpts === "number")
            _nbitLength = bitLenOrOpts;
          if (opts.sqrt)
            _sqrt = opts.sqrt;
        }
        const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, _nbitLength);
        if (BYTES > 2048)
          throw new Error("invalid field: expected ORDER of <= 2048 bytes");
        let sqrtP;
        const f = Object.freeze({
          ORDER,
          isLE,
          BITS,
          BYTES,
          MASK: (0, utils_ts_1.bitMask)(BITS),
          ZERO: _0n,
          ONE: _1n,
          allowedLengths,
          create: (num) => mod(num, ORDER),
          isValid: (num) => {
            if (typeof num !== "bigint")
              throw new Error("invalid field element: expected bigint, got " + typeof num);
            return _0n <= num && num < ORDER;
          },
          is0: (num) => num === _0n,
          // is valid and invertible
          isValidNot0: (num) => !f.is0(num) && f.isValid(num),
          isOdd: (num) => (num & _1n) === _1n,
          neg: (num) => mod(-num, ORDER),
          eql: (lhs, rhs) => lhs === rhs,
          sqr: (num) => mod(num * num, ORDER),
          add: (lhs, rhs) => mod(lhs + rhs, ORDER),
          sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
          mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
          pow: (num, power) => FpPow(f, num, power),
          div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
          // Same as above, but doesn't normalize
          sqrN: (num) => num * num,
          addN: (lhs, rhs) => lhs + rhs,
          subN: (lhs, rhs) => lhs - rhs,
          mulN: (lhs, rhs) => lhs * rhs,
          inv: (num) => invert(num, ORDER),
          sqrt: _sqrt || ((n) => {
            if (!sqrtP)
              sqrtP = FpSqrt(ORDER);
            return sqrtP(f, n);
          }),
          toBytes: (num) => isLE ? (0, utils_ts_1.numberToBytesLE)(num, BYTES) : (0, utils_ts_1.numberToBytesBE)(num, BYTES),
          fromBytes: (bytes, skipValidation = true) => {
            if (allowedLengths) {
              if (!allowedLengths.includes(bytes.length) || bytes.length > BYTES) {
                throw new Error("Field.fromBytes: expected " + allowedLengths + " bytes, got " + bytes.length);
              }
              const padded = new Uint8Array(BYTES);
              padded.set(bytes, isLE ? 0 : padded.length - bytes.length);
              bytes = padded;
            }
            if (bytes.length !== BYTES)
              throw new Error("Field.fromBytes: expected " + BYTES + " bytes, got " + bytes.length);
            let scalar = isLE ? (0, utils_ts_1.bytesToNumberLE)(bytes) : (0, utils_ts_1.bytesToNumberBE)(bytes);
            if (modFromBytes)
              scalar = mod(scalar, ORDER);
            if (!skipValidation) {
              if (!f.isValid(scalar))
                throw new Error("invalid field element: outside of range 0..ORDER");
            }
            return scalar;
          },
          // TODO: we don't need it here, move out to separate fn
          invertBatch: (lst) => FpInvertBatch(f, lst),
          // We can't move this out because Fp6, Fp12 implement it
          // and it's unclear what to return in there.
          cmov: (a, b, c) => c ? b : a
        });
        return Object.freeze(f);
      }
      function FpSqrtOdd(Fp, elm) {
        if (!Fp.isOdd)
          throw new Error("Field doesn't have isOdd");
        const root = Fp.sqrt(elm);
        return Fp.isOdd(root) ? root : Fp.neg(root);
      }
      function FpSqrtEven(Fp, elm) {
        if (!Fp.isOdd)
          throw new Error("Field doesn't have isOdd");
        const root = Fp.sqrt(elm);
        return Fp.isOdd(root) ? Fp.neg(root) : root;
      }
      function hashToPrivateScalar(hash, groupOrder, isLE = false) {
        hash = (0, utils_ts_1.ensureBytes)("privateHash", hash);
        const hashLen = hash.length;
        const minLen = nLength(groupOrder).nByteLength + 8;
        if (minLen < 24 || hashLen < minLen || hashLen > 1024)
          throw new Error("hashToPrivateScalar: expected " + minLen + "-1024 bytes of input, got " + hashLen);
        const num = isLE ? (0, utils_ts_1.bytesToNumberLE)(hash) : (0, utils_ts_1.bytesToNumberBE)(hash);
        return mod(num, groupOrder - _1n) + _1n;
      }
      function getFieldBytesLength(fieldOrder) {
        if (typeof fieldOrder !== "bigint")
          throw new Error("field order must be bigint");
        const bitLength = fieldOrder.toString(2).length;
        return Math.ceil(bitLength / 8);
      }
      function getMinHashLength(fieldOrder) {
        const length = getFieldBytesLength(fieldOrder);
        return length + Math.ceil(length / 2);
      }
      function mapHashToField(key, fieldOrder, isLE = false) {
        const len = key.length;
        const fieldLen = getFieldBytesLength(fieldOrder);
        const minLen = getMinHashLength(fieldOrder);
        if (len < 16 || len < minLen || len > 1024)
          throw new Error("expected " + minLen + "-1024 bytes of input, got " + len);
        const num = isLE ? (0, utils_ts_1.bytesToNumberLE)(key) : (0, utils_ts_1.bytesToNumberBE)(key);
        const reduced = mod(num, fieldOrder - _1n) + _1n;
        return isLE ? (0, utils_ts_1.numberToBytesLE)(reduced, fieldLen) : (0, utils_ts_1.numberToBytesBE)(reduced, fieldLen);
      }
    }
  });

  // node_modules/@noble/curves/abstract/curve.js
  var require_curve = __commonJS({
    "node_modules/@noble/curves/abstract/curve.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.wNAF = void 0;
      exports.negateCt = negateCt;
      exports.normalizeZ = normalizeZ;
      exports.mulEndoUnsafe = mulEndoUnsafe;
      exports.pippenger = pippenger;
      exports.precomputeMSMUnsafe = precomputeMSMUnsafe;
      exports.validateBasic = validateBasic;
      exports._createCurveFields = _createCurveFields;
      var utils_ts_1 = require_utils2();
      var modular_ts_1 = require_modular();
      var _0n = BigInt(0);
      var _1n = BigInt(1);
      function negateCt(condition, item) {
        const neg = item.negate();
        return condition ? neg : item;
      }
      function normalizeZ(c, points) {
        const invertedZs = (0, modular_ts_1.FpInvertBatch)(c.Fp, points.map((p) => p.Z));
        return points.map((p, i) => c.fromAffine(p.toAffine(invertedZs[i])));
      }
      function validateW(W, bits) {
        if (!Number.isSafeInteger(W) || W <= 0 || W > bits)
          throw new Error("invalid window size, expected [1.." + bits + "], got W=" + W);
      }
      function calcWOpts(W, scalarBits) {
        validateW(W, scalarBits);
        const windows = Math.ceil(scalarBits / W) + 1;
        const windowSize = 2 ** (W - 1);
        const maxNumber = 2 ** W;
        const mask = (0, utils_ts_1.bitMask)(W);
        const shiftBy = BigInt(W);
        return { windows, windowSize, mask, maxNumber, shiftBy };
      }
      function calcOffsets(n, window2, wOpts) {
        const { windowSize, mask, maxNumber, shiftBy } = wOpts;
        let wbits = Number(n & mask);
        let nextN = n >> shiftBy;
        if (wbits > windowSize) {
          wbits -= maxNumber;
          nextN += _1n;
        }
        const offsetStart = window2 * windowSize;
        const offset = offsetStart + Math.abs(wbits) - 1;
        const isZero = wbits === 0;
        const isNeg = wbits < 0;
        const isNegF = window2 % 2 !== 0;
        const offsetF = offsetStart;
        return { nextN, offset, isZero, isNeg, isNegF, offsetF };
      }
      function validateMSMPoints(points, c) {
        if (!Array.isArray(points))
          throw new Error("array expected");
        points.forEach((p, i) => {
          if (!(p instanceof c))
            throw new Error("invalid point at index " + i);
        });
      }
      function validateMSMScalars(scalars, field) {
        if (!Array.isArray(scalars))
          throw new Error("array of scalars expected");
        scalars.forEach((s, i) => {
          if (!field.isValid(s))
            throw new Error("invalid scalar at index " + i);
        });
      }
      var pointPrecomputes = /* @__PURE__ */ new WeakMap();
      var pointWindowSizes = /* @__PURE__ */ new WeakMap();
      function getW(P) {
        return pointWindowSizes.get(P) || 1;
      }
      function assert0(n) {
        if (n !== _0n)
          throw new Error("invalid wNAF");
      }
      var wNAF = class {
        // Parametrized with a given Point class (not individual point)
        constructor(Point, bits) {
          this.BASE = Point.BASE;
          this.ZERO = Point.ZERO;
          this.Fn = Point.Fn;
          this.bits = bits;
        }
        // non-const time multiplication ladder
        _unsafeLadder(elm, n, p = this.ZERO) {
          let d = elm;
          while (n > _0n) {
            if (n & _1n)
              p = p.add(d);
            d = d.double();
            n >>= _1n;
          }
          return p;
        }
        /**
         * Creates a wNAF precomputation window. Used for caching.
         * Default window size is set by `utils.precompute()` and is equal to 8.
         * Number of precomputed points depends on the curve size:
         * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
         * - 𝑊 is the window size
         * - 𝑛 is the bitlength of the curve order.
         * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
         * @param point Point instance
         * @param W window size
         * @returns precomputed point tables flattened to a single array
         */
        precomputeWindow(point, W) {
          const { windows, windowSize } = calcWOpts(W, this.bits);
          const points = [];
          let p = point;
          let base = p;
          for (let window2 = 0; window2 < windows; window2++) {
            base = p;
            points.push(base);
            for (let i = 1; i < windowSize; i++) {
              base = base.add(p);
              points.push(base);
            }
            p = base.double();
          }
          return points;
        }
        /**
         * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
         * More compact implementation:
         * https://github.com/paulmillr/noble-secp256k1/blob/47cb1669b6e506ad66b35fe7d76132ae97465da2/index.ts#L502-L541
         * @returns real and fake (for const-time) points
         */
        wNAF(W, precomputes, n) {
          if (!this.Fn.isValid(n))
            throw new Error("invalid scalar");
          let p = this.ZERO;
          let f = this.BASE;
          const wo = calcWOpts(W, this.bits);
          for (let window2 = 0; window2 < wo.windows; window2++) {
            const { nextN, offset, isZero, isNeg, isNegF, offsetF } = calcOffsets(n, window2, wo);
            n = nextN;
            if (isZero) {
              f = f.add(negateCt(isNegF, precomputes[offsetF]));
            } else {
              p = p.add(negateCt(isNeg, precomputes[offset]));
            }
          }
          assert0(n);
          return { p, f };
        }
        /**
         * Implements ec unsafe (non const-time) multiplication using precomputed tables and w-ary non-adjacent form.
         * @param acc accumulator point to add result of multiplication
         * @returns point
         */
        wNAFUnsafe(W, precomputes, n, acc = this.ZERO) {
          const wo = calcWOpts(W, this.bits);
          for (let window2 = 0; window2 < wo.windows; window2++) {
            if (n === _0n)
              break;
            const { nextN, offset, isZero, isNeg } = calcOffsets(n, window2, wo);
            n = nextN;
            if (isZero) {
              continue;
            } else {
              const item = precomputes[offset];
              acc = acc.add(isNeg ? item.negate() : item);
            }
          }
          assert0(n);
          return acc;
        }
        getPrecomputes(W, point, transform) {
          let comp = pointPrecomputes.get(point);
          if (!comp) {
            comp = this.precomputeWindow(point, W);
            if (W !== 1) {
              if (typeof transform === "function")
                comp = transform(comp);
              pointPrecomputes.set(point, comp);
            }
          }
          return comp;
        }
        cached(point, scalar, transform) {
          const W = getW(point);
          return this.wNAF(W, this.getPrecomputes(W, point, transform), scalar);
        }
        unsafe(point, scalar, transform, prev) {
          const W = getW(point);
          if (W === 1)
            return this._unsafeLadder(point, scalar, prev);
          return this.wNAFUnsafe(W, this.getPrecomputes(W, point, transform), scalar, prev);
        }
        // We calculate precomputes for elliptic curve point multiplication
        // using windowed method. This specifies window size and
        // stores precomputed values. Usually only base point would be precomputed.
        createCache(P, W) {
          validateW(W, this.bits);
          pointWindowSizes.set(P, W);
          pointPrecomputes.delete(P);
        }
        hasCache(elm) {
          return getW(elm) !== 1;
        }
      };
      exports.wNAF = wNAF;
      function mulEndoUnsafe(Point, point, k1, k2) {
        let acc = point;
        let p1 = Point.ZERO;
        let p2 = Point.ZERO;
        while (k1 > _0n || k2 > _0n) {
          if (k1 & _1n)
            p1 = p1.add(acc);
          if (k2 & _1n)
            p2 = p2.add(acc);
          acc = acc.double();
          k1 >>= _1n;
          k2 >>= _1n;
        }
        return { p1, p2 };
      }
      function pippenger(c, fieldN, points, scalars) {
        validateMSMPoints(points, c);
        validateMSMScalars(scalars, fieldN);
        const plength = points.length;
        const slength = scalars.length;
        if (plength !== slength)
          throw new Error("arrays of points and scalars must have equal length");
        const zero = c.ZERO;
        const wbits = (0, utils_ts_1.bitLen)(BigInt(plength));
        let windowSize = 1;
        if (wbits > 12)
          windowSize = wbits - 3;
        else if (wbits > 4)
          windowSize = wbits - 2;
        else if (wbits > 0)
          windowSize = 2;
        const MASK = (0, utils_ts_1.bitMask)(windowSize);
        const buckets = new Array(Number(MASK) + 1).fill(zero);
        const lastBits = Math.floor((fieldN.BITS - 1) / windowSize) * windowSize;
        let sum = zero;
        for (let i = lastBits; i >= 0; i -= windowSize) {
          buckets.fill(zero);
          for (let j = 0; j < slength; j++) {
            const scalar = scalars[j];
            const wbits2 = Number(scalar >> BigInt(i) & MASK);
            buckets[wbits2] = buckets[wbits2].add(points[j]);
          }
          let resI = zero;
          for (let j = buckets.length - 1, sumI = zero; j > 0; j--) {
            sumI = sumI.add(buckets[j]);
            resI = resI.add(sumI);
          }
          sum = sum.add(resI);
          if (i !== 0)
            for (let j = 0; j < windowSize; j++)
              sum = sum.double();
        }
        return sum;
      }
      function precomputeMSMUnsafe(c, fieldN, points, windowSize) {
        validateW(windowSize, fieldN.BITS);
        validateMSMPoints(points, c);
        const zero = c.ZERO;
        const tableSize = 2 ** windowSize - 1;
        const chunks = Math.ceil(fieldN.BITS / windowSize);
        const MASK = (0, utils_ts_1.bitMask)(windowSize);
        const tables = points.map((p) => {
          const res = [];
          for (let i = 0, acc = p; i < tableSize; i++) {
            res.push(acc);
            acc = acc.add(p);
          }
          return res;
        });
        return (scalars) => {
          validateMSMScalars(scalars, fieldN);
          if (scalars.length > points.length)
            throw new Error("array of scalars must be smaller than array of points");
          let res = zero;
          for (let i = 0; i < chunks; i++) {
            if (res !== zero)
              for (let j = 0; j < windowSize; j++)
                res = res.double();
            const shiftBy = BigInt(chunks * windowSize - (i + 1) * windowSize);
            for (let j = 0; j < scalars.length; j++) {
              const n = scalars[j];
              const curr = Number(n >> shiftBy & MASK);
              if (!curr)
                continue;
              res = res.add(tables[j][curr - 1]);
            }
          }
          return res;
        };
      }
      function validateBasic(curve) {
        (0, modular_ts_1.validateField)(curve.Fp);
        (0, utils_ts_1.validateObject)(curve, {
          n: "bigint",
          h: "bigint",
          Gx: "field",
          Gy: "field"
        }, {
          nBitLength: "isSafeInteger",
          nByteLength: "isSafeInteger"
        });
        return Object.freeze({
          ...(0, modular_ts_1.nLength)(curve.n, curve.nBitLength),
          ...curve,
          ...{ p: curve.Fp.ORDER }
        });
      }
      function createField(order, field, isLE) {
        if (field) {
          if (field.ORDER !== order)
            throw new Error("Field.ORDER must match order: Fp == p, Fn == n");
          (0, modular_ts_1.validateField)(field);
          return field;
        } else {
          return (0, modular_ts_1.Field)(order, { isLE });
        }
      }
      function _createCurveFields(type, CURVE, curveOpts = {}, FpFnLE) {
        if (FpFnLE === void 0)
          FpFnLE = type === "edwards";
        if (!CURVE || typeof CURVE !== "object")
          throw new Error(`expected valid ${type} CURVE object`);
        for (const p of ["p", "n", "h"]) {
          const val = CURVE[p];
          if (!(typeof val === "bigint" && val > _0n))
            throw new Error(`CURVE.${p} must be positive bigint`);
        }
        const Fp = createField(CURVE.p, curveOpts.Fp, FpFnLE);
        const Fn = createField(CURVE.n, curveOpts.Fn, FpFnLE);
        const _b = type === "weierstrass" ? "b" : "d";
        const params = ["Gx", "Gy", "a", _b];
        for (const p of params) {
          if (!Fp.isValid(CURVE[p]))
            throw new Error(`CURVE.${p} must be valid field element of CURVE.Fp`);
        }
        CURVE = Object.freeze(Object.assign({}, CURVE));
        return { CURVE, Fp, Fn };
      }
    }
  });

  // node_modules/@noble/curves/abstract/edwards.js
  var require_edwards = __commonJS({
    "node_modules/@noble/curves/abstract/edwards.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.PrimeEdwardsPoint = void 0;
      exports.edwards = edwards;
      exports.eddsa = eddsa;
      exports.twistedEdwards = twistedEdwards;
      var utils_ts_1 = require_utils2();
      var curve_ts_1 = require_curve();
      var modular_ts_1 = require_modular();
      var _0n = BigInt(0);
      var _1n = BigInt(1);
      var _2n = BigInt(2);
      var _8n = BigInt(8);
      function isEdValidXY(Fp, CURVE, x, y) {
        const x2 = Fp.sqr(x);
        const y2 = Fp.sqr(y);
        const left = Fp.add(Fp.mul(CURVE.a, x2), y2);
        const right = Fp.add(Fp.ONE, Fp.mul(CURVE.d, Fp.mul(x2, y2)));
        return Fp.eql(left, right);
      }
      function edwards(params, extraOpts = {}) {
        const validated = (0, curve_ts_1._createCurveFields)("edwards", params, extraOpts, extraOpts.FpFnLE);
        const { Fp, Fn } = validated;
        let CURVE = validated.CURVE;
        const { h: cofactor } = CURVE;
        (0, utils_ts_1._validateObject)(extraOpts, {}, { uvRatio: "function" });
        const MASK = _2n << BigInt(Fn.BYTES * 8) - _1n;
        const modP = (n) => Fp.create(n);
        const uvRatio = extraOpts.uvRatio || ((u, v) => {
          try {
            return { isValid: true, value: Fp.sqrt(Fp.div(u, v)) };
          } catch (e) {
            return { isValid: false, value: _0n };
          }
        });
        if (!isEdValidXY(Fp, CURVE, CURVE.Gx, CURVE.Gy))
          throw new Error("bad curve params: generator point");
        function acoord(title, n, banZero = false) {
          const min = banZero ? _1n : _0n;
          (0, utils_ts_1.aInRange)("coordinate " + title, n, min, MASK);
          return n;
        }
        function aextpoint(other) {
          if (!(other instanceof Point))
            throw new Error("ExtendedPoint expected");
        }
        const toAffineMemo = (0, utils_ts_1.memoized)((p, iz) => {
          const { X, Y, Z } = p;
          const is0 = p.is0();
          if (iz == null)
            iz = is0 ? _8n : Fp.inv(Z);
          const x = modP(X * iz);
          const y = modP(Y * iz);
          const zz = Fp.mul(Z, iz);
          if (is0)
            return { x: _0n, y: _1n };
          if (zz !== _1n)
            throw new Error("invZ was invalid");
          return { x, y };
        });
        const assertValidMemo = (0, utils_ts_1.memoized)((p) => {
          const { a, d } = CURVE;
          if (p.is0())
            throw new Error("bad point: ZERO");
          const { X, Y, Z, T } = p;
          const X2 = modP(X * X);
          const Y2 = modP(Y * Y);
          const Z2 = modP(Z * Z);
          const Z4 = modP(Z2 * Z2);
          const aX2 = modP(X2 * a);
          const left = modP(Z2 * modP(aX2 + Y2));
          const right = modP(Z4 + modP(d * modP(X2 * Y2)));
          if (left !== right)
            throw new Error("bad point: equation left != right (1)");
          const XY = modP(X * Y);
          const ZT = modP(Z * T);
          if (XY !== ZT)
            throw new Error("bad point: equation left != right (2)");
          return true;
        });
        class Point {
          constructor(X, Y, Z, T) {
            this.X = acoord("x", X);
            this.Y = acoord("y", Y);
            this.Z = acoord("z", Z, true);
            this.T = acoord("t", T);
            Object.freeze(this);
          }
          static CURVE() {
            return CURVE;
          }
          static fromAffine(p) {
            if (p instanceof Point)
              throw new Error("extended point not allowed");
            const { x, y } = p || {};
            acoord("x", x);
            acoord("y", y);
            return new Point(x, y, _1n, modP(x * y));
          }
          // Uses algo from RFC8032 5.1.3.
          static fromBytes(bytes, zip215 = false) {
            const len = Fp.BYTES;
            const { a, d } = CURVE;
            bytes = (0, utils_ts_1.copyBytes)((0, utils_ts_1._abytes2)(bytes, len, "point"));
            (0, utils_ts_1._abool2)(zip215, "zip215");
            const normed = (0, utils_ts_1.copyBytes)(bytes);
            const lastByte = bytes[len - 1];
            normed[len - 1] = lastByte & ~128;
            const y = (0, utils_ts_1.bytesToNumberLE)(normed);
            const max = zip215 ? MASK : Fp.ORDER;
            (0, utils_ts_1.aInRange)("point.y", y, _0n, max);
            const y2 = modP(y * y);
            const u = modP(y2 - _1n);
            const v = modP(d * y2 - a);
            let { isValid, value: x } = uvRatio(u, v);
            if (!isValid)
              throw new Error("bad point: invalid y coordinate");
            const isXOdd = (x & _1n) === _1n;
            const isLastByteOdd = (lastByte & 128) !== 0;
            if (!zip215 && x === _0n && isLastByteOdd)
              throw new Error("bad point: x=0 and x_0=1");
            if (isLastByteOdd !== isXOdd)
              x = modP(-x);
            return Point.fromAffine({ x, y });
          }
          static fromHex(bytes, zip215 = false) {
            return Point.fromBytes((0, utils_ts_1.ensureBytes)("point", bytes), zip215);
          }
          get x() {
            return this.toAffine().x;
          }
          get y() {
            return this.toAffine().y;
          }
          precompute(windowSize = 8, isLazy = true) {
            wnaf.createCache(this, windowSize);
            if (!isLazy)
              this.multiply(_2n);
            return this;
          }
          // Useful in fromAffine() - not for fromBytes(), which always created valid points.
          assertValidity() {
            assertValidMemo(this);
          }
          // Compare one point to another.
          equals(other) {
            aextpoint(other);
            const { X: X1, Y: Y1, Z: Z1 } = this;
            const { X: X2, Y: Y2, Z: Z2 } = other;
            const X1Z2 = modP(X1 * Z2);
            const X2Z1 = modP(X2 * Z1);
            const Y1Z2 = modP(Y1 * Z2);
            const Y2Z1 = modP(Y2 * Z1);
            return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
          }
          is0() {
            return this.equals(Point.ZERO);
          }
          negate() {
            return new Point(modP(-this.X), this.Y, this.Z, modP(-this.T));
          }
          // Fast algo for doubling Extended Point.
          // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#doubling-dbl-2008-hwcd
          // Cost: 4M + 4S + 1*a + 6add + 1*2.
          double() {
            const { a } = CURVE;
            const { X: X1, Y: Y1, Z: Z1 } = this;
            const A = modP(X1 * X1);
            const B = modP(Y1 * Y1);
            const C = modP(_2n * modP(Z1 * Z1));
            const D = modP(a * A);
            const x1y1 = X1 + Y1;
            const E = modP(modP(x1y1 * x1y1) - A - B);
            const G = D + B;
            const F = G - C;
            const H = D - B;
            const X3 = modP(E * F);
            const Y3 = modP(G * H);
            const T3 = modP(E * H);
            const Z3 = modP(F * G);
            return new Point(X3, Y3, Z3, T3);
          }
          // Fast algo for adding 2 Extended Points.
          // https://hyperelliptic.org/EFD/g1p/auto-twisted-extended.html#addition-add-2008-hwcd
          // Cost: 9M + 1*a + 1*d + 7add.
          add(other) {
            aextpoint(other);
            const { a, d } = CURVE;
            const { X: X1, Y: Y1, Z: Z1, T: T1 } = this;
            const { X: X2, Y: Y2, Z: Z2, T: T2 } = other;
            const A = modP(X1 * X2);
            const B = modP(Y1 * Y2);
            const C = modP(T1 * d * T2);
            const D = modP(Z1 * Z2);
            const E = modP((X1 + Y1) * (X2 + Y2) - A - B);
            const F = D - C;
            const G = D + C;
            const H = modP(B - a * A);
            const X3 = modP(E * F);
            const Y3 = modP(G * H);
            const T3 = modP(E * H);
            const Z3 = modP(F * G);
            return new Point(X3, Y3, Z3, T3);
          }
          subtract(other) {
            return this.add(other.negate());
          }
          // Constant-time multiplication.
          multiply(scalar) {
            if (!Fn.isValidNot0(scalar))
              throw new Error("invalid scalar: expected 1 <= sc < curve.n");
            const { p, f } = wnaf.cached(this, scalar, (p2) => (0, curve_ts_1.normalizeZ)(Point, p2));
            return (0, curve_ts_1.normalizeZ)(Point, [p, f])[0];
          }
          // Non-constant-time multiplication. Uses double-and-add algorithm.
          // It's faster, but should only be used when you don't care about
          // an exposed private key e.g. sig verification.
          // Does NOT allow scalars higher than CURVE.n.
          // Accepts optional accumulator to merge with multiply (important for sparse scalars)
          multiplyUnsafe(scalar, acc = Point.ZERO) {
            if (!Fn.isValid(scalar))
              throw new Error("invalid scalar: expected 0 <= sc < curve.n");
            if (scalar === _0n)
              return Point.ZERO;
            if (this.is0() || scalar === _1n)
              return this;
            return wnaf.unsafe(this, scalar, (p) => (0, curve_ts_1.normalizeZ)(Point, p), acc);
          }
          // Checks if point is of small order.
          // If you add something to small order point, you will have "dirty"
          // point with torsion component.
          // Multiplies point by cofactor and checks if the result is 0.
          isSmallOrder() {
            return this.multiplyUnsafe(cofactor).is0();
          }
          // Multiplies point by curve order and checks if the result is 0.
          // Returns `false` is the point is dirty.
          isTorsionFree() {
            return wnaf.unsafe(this, CURVE.n).is0();
          }
          // Converts Extended point to default (x, y) coordinates.
          // Can accept precomputed Z^-1 - for example, from invertBatch.
          toAffine(invertedZ) {
            return toAffineMemo(this, invertedZ);
          }
          clearCofactor() {
            if (cofactor === _1n)
              return this;
            return this.multiplyUnsafe(cofactor);
          }
          toBytes() {
            const { x, y } = this.toAffine();
            const bytes = Fp.toBytes(y);
            bytes[bytes.length - 1] |= x & _1n ? 128 : 0;
            return bytes;
          }
          toHex() {
            return (0, utils_ts_1.bytesToHex)(this.toBytes());
          }
          toString() {
            return `<Point ${this.is0() ? "ZERO" : this.toHex()}>`;
          }
          // TODO: remove
          get ex() {
            return this.X;
          }
          get ey() {
            return this.Y;
          }
          get ez() {
            return this.Z;
          }
          get et() {
            return this.T;
          }
          static normalizeZ(points) {
            return (0, curve_ts_1.normalizeZ)(Point, points);
          }
          static msm(points, scalars) {
            return (0, curve_ts_1.pippenger)(Point, Fn, points, scalars);
          }
          _setWindowSize(windowSize) {
            this.precompute(windowSize);
          }
          toRawBytes() {
            return this.toBytes();
          }
        }
        Point.BASE = new Point(CURVE.Gx, CURVE.Gy, _1n, modP(CURVE.Gx * CURVE.Gy));
        Point.ZERO = new Point(_0n, _1n, _1n, _0n);
        Point.Fp = Fp;
        Point.Fn = Fn;
        const wnaf = new curve_ts_1.wNAF(Point, Fn.BITS);
        Point.BASE.precompute(8);
        return Point;
      }
      var PrimeEdwardsPoint = class {
        constructor(ep) {
          this.ep = ep;
        }
        // Static methods that must be implemented by subclasses
        static fromBytes(_bytes) {
          (0, utils_ts_1.notImplemented)();
        }
        static fromHex(_hex) {
          (0, utils_ts_1.notImplemented)();
        }
        get x() {
          return this.toAffine().x;
        }
        get y() {
          return this.toAffine().y;
        }
        // Common implementations
        clearCofactor() {
          return this;
        }
        assertValidity() {
          this.ep.assertValidity();
        }
        toAffine(invertedZ) {
          return this.ep.toAffine(invertedZ);
        }
        toHex() {
          return (0, utils_ts_1.bytesToHex)(this.toBytes());
        }
        toString() {
          return this.toHex();
        }
        isTorsionFree() {
          return true;
        }
        isSmallOrder() {
          return false;
        }
        add(other) {
          this.assertSame(other);
          return this.init(this.ep.add(other.ep));
        }
        subtract(other) {
          this.assertSame(other);
          return this.init(this.ep.subtract(other.ep));
        }
        multiply(scalar) {
          return this.init(this.ep.multiply(scalar));
        }
        multiplyUnsafe(scalar) {
          return this.init(this.ep.multiplyUnsafe(scalar));
        }
        double() {
          return this.init(this.ep.double());
        }
        negate() {
          return this.init(this.ep.negate());
        }
        precompute(windowSize, isLazy) {
          return this.init(this.ep.precompute(windowSize, isLazy));
        }
        /** @deprecated use `toBytes` */
        toRawBytes() {
          return this.toBytes();
        }
      };
      exports.PrimeEdwardsPoint = PrimeEdwardsPoint;
      function eddsa(Point, cHash, eddsaOpts = {}) {
        if (typeof cHash !== "function")
          throw new Error('"hash" function param is required');
        (0, utils_ts_1._validateObject)(eddsaOpts, {}, {
          adjustScalarBytes: "function",
          randomBytes: "function",
          domain: "function",
          prehash: "function",
          mapToCurve: "function"
        });
        const { prehash } = eddsaOpts;
        const { BASE, Fp, Fn } = Point;
        const randomBytes = eddsaOpts.randomBytes || utils_ts_1.randomBytes;
        const adjustScalarBytes = eddsaOpts.adjustScalarBytes || ((bytes) => bytes);
        const domain = eddsaOpts.domain || ((data, ctx, phflag) => {
          (0, utils_ts_1._abool2)(phflag, "phflag");
          if (ctx.length || phflag)
            throw new Error("Contexts/pre-hash are not supported");
          return data;
        });
        function modN_LE(hash) {
          return Fn.create((0, utils_ts_1.bytesToNumberLE)(hash));
        }
        function getPrivateScalar(key) {
          const len = lengths.secretKey;
          key = (0, utils_ts_1.ensureBytes)("private key", key, len);
          const hashed = (0, utils_ts_1.ensureBytes)("hashed private key", cHash(key), 2 * len);
          const head = adjustScalarBytes(hashed.slice(0, len));
          const prefix = hashed.slice(len, 2 * len);
          const scalar = modN_LE(head);
          return { head, prefix, scalar };
        }
        function getExtendedPublicKey(secretKey) {
          const { head, prefix, scalar } = getPrivateScalar(secretKey);
          const point = BASE.multiply(scalar);
          const pointBytes = point.toBytes();
          return { head, prefix, scalar, point, pointBytes };
        }
        function getPublicKey(secretKey) {
          return getExtendedPublicKey(secretKey).pointBytes;
        }
        function hashDomainToScalar(context = Uint8Array.of(), ...msgs) {
          const msg = (0, utils_ts_1.concatBytes)(...msgs);
          return modN_LE(cHash(domain(msg, (0, utils_ts_1.ensureBytes)("context", context), !!prehash)));
        }
        function sign(msg, secretKey, options = {}) {
          msg = (0, utils_ts_1.ensureBytes)("message", msg);
          if (prehash)
            msg = prehash(msg);
          const { prefix, scalar, pointBytes } = getExtendedPublicKey(secretKey);
          const r = hashDomainToScalar(options.context, prefix, msg);
          const R = BASE.multiply(r).toBytes();
          const k = hashDomainToScalar(options.context, R, pointBytes, msg);
          const s = Fn.create(r + k * scalar);
          if (!Fn.isValid(s))
            throw new Error("sign failed: invalid s");
          const rs = (0, utils_ts_1.concatBytes)(R, Fn.toBytes(s));
          return (0, utils_ts_1._abytes2)(rs, lengths.signature, "result");
        }
        const verifyOpts = { zip215: true };
        function verify(sig, msg, publicKey, options = verifyOpts) {
          const { context, zip215 } = options;
          const len = lengths.signature;
          sig = (0, utils_ts_1.ensureBytes)("signature", sig, len);
          msg = (0, utils_ts_1.ensureBytes)("message", msg);
          publicKey = (0, utils_ts_1.ensureBytes)("publicKey", publicKey, lengths.publicKey);
          if (zip215 !== void 0)
            (0, utils_ts_1._abool2)(zip215, "zip215");
          if (prehash)
            msg = prehash(msg);
          const mid = len / 2;
          const r = sig.subarray(0, mid);
          const s = (0, utils_ts_1.bytesToNumberLE)(sig.subarray(mid, len));
          let A, R, SB;
          try {
            A = Point.fromBytes(publicKey, zip215);
            R = Point.fromBytes(r, zip215);
            SB = BASE.multiplyUnsafe(s);
          } catch (error) {
            return false;
          }
          if (!zip215 && A.isSmallOrder())
            return false;
          const k = hashDomainToScalar(context, R.toBytes(), A.toBytes(), msg);
          const RkA = R.add(A.multiplyUnsafe(k));
          return RkA.subtract(SB).clearCofactor().is0();
        }
        const _size = Fp.BYTES;
        const lengths = {
          secretKey: _size,
          publicKey: _size,
          signature: 2 * _size,
          seed: _size
        };
        function randomSecretKey(seed = randomBytes(lengths.seed)) {
          return (0, utils_ts_1._abytes2)(seed, lengths.seed, "seed");
        }
        function keygen(seed) {
          const secretKey = utils.randomSecretKey(seed);
          return { secretKey, publicKey: getPublicKey(secretKey) };
        }
        function isValidSecretKey(key) {
          return (0, utils_ts_1.isBytes)(key) && key.length === Fn.BYTES;
        }
        function isValidPublicKey(key, zip215) {
          try {
            return !!Point.fromBytes(key, zip215);
          } catch (error) {
            return false;
          }
        }
        const utils = {
          getExtendedPublicKey,
          randomSecretKey,
          isValidSecretKey,
          isValidPublicKey,
          /**
           * Converts ed public key to x public key. Uses formula:
           * - ed25519:
           *   - `(u, v) = ((1+y)/(1-y), sqrt(-486664)*u/x)`
           *   - `(x, y) = (sqrt(-486664)*u/v, (u-1)/(u+1))`
           * - ed448:
           *   - `(u, v) = ((y-1)/(y+1), sqrt(156324)*u/x)`
           *   - `(x, y) = (sqrt(156324)*u/v, (1+u)/(1-u))`
           */
          toMontgomery(publicKey) {
            const { y } = Point.fromBytes(publicKey);
            const size = lengths.publicKey;
            const is25519 = size === 32;
            if (!is25519 && size !== 57)
              throw new Error("only defined for 25519 and 448");
            const u = is25519 ? Fp.div(_1n + y, _1n - y) : Fp.div(y - _1n, y + _1n);
            return Fp.toBytes(u);
          },
          toMontgomerySecret(secretKey) {
            const size = lengths.secretKey;
            (0, utils_ts_1._abytes2)(secretKey, size);
            const hashed = cHash(secretKey.subarray(0, size));
            return adjustScalarBytes(hashed).subarray(0, size);
          },
          /** @deprecated */
          randomPrivateKey: randomSecretKey,
          /** @deprecated */
          precompute(windowSize = 8, point = Point.BASE) {
            return point.precompute(windowSize, false);
          }
        };
        return Object.freeze({
          keygen,
          getPublicKey,
          sign,
          verify,
          utils,
          Point,
          lengths
        });
      }
      function _eddsa_legacy_opts_to_new(c) {
        const CURVE = {
          a: c.a,
          d: c.d,
          p: c.Fp.ORDER,
          n: c.n,
          h: c.h,
          Gx: c.Gx,
          Gy: c.Gy
        };
        const Fp = c.Fp;
        const Fn = (0, modular_ts_1.Field)(CURVE.n, c.nBitLength, true);
        const curveOpts = { Fp, Fn, uvRatio: c.uvRatio };
        const eddsaOpts = {
          randomBytes: c.randomBytes,
          adjustScalarBytes: c.adjustScalarBytes,
          domain: c.domain,
          prehash: c.prehash,
          mapToCurve: c.mapToCurve
        };
        return { CURVE, curveOpts, hash: c.hash, eddsaOpts };
      }
      function _eddsa_new_output_to_legacy(c, eddsa2) {
        const Point = eddsa2.Point;
        const legacy = Object.assign({}, eddsa2, {
          ExtendedPoint: Point,
          CURVE: c,
          nBitLength: Point.Fn.BITS,
          nByteLength: Point.Fn.BYTES
        });
        return legacy;
      }
      function twistedEdwards(c) {
        const { CURVE, curveOpts, hash, eddsaOpts } = _eddsa_legacy_opts_to_new(c);
        const Point = edwards(CURVE, curveOpts);
        const EDDSA = eddsa(Point, hash, eddsaOpts);
        return _eddsa_new_output_to_legacy(c, EDDSA);
      }
    }
  });

  // node_modules/@noble/curves/abstract/hash-to-curve.js
  var require_hash_to_curve = __commonJS({
    "node_modules/@noble/curves/abstract/hash-to-curve.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports._DST_scalar = void 0;
      exports.expand_message_xmd = expand_message_xmd;
      exports.expand_message_xof = expand_message_xof;
      exports.hash_to_field = hash_to_field;
      exports.isogenyMap = isogenyMap;
      exports.createHasher = createHasher;
      var utils_ts_1 = require_utils2();
      var modular_ts_1 = require_modular();
      var os2ip = utils_ts_1.bytesToNumberBE;
      function i2osp(value, length) {
        anum(value);
        anum(length);
        if (value < 0 || value >= 1 << 8 * length)
          throw new Error("invalid I2OSP input: " + value);
        const res = Array.from({ length }).fill(0);
        for (let i = length - 1; i >= 0; i--) {
          res[i] = value & 255;
          value >>>= 8;
        }
        return new Uint8Array(res);
      }
      function strxor(a, b) {
        const arr = new Uint8Array(a.length);
        for (let i = 0; i < a.length; i++) {
          arr[i] = a[i] ^ b[i];
        }
        return arr;
      }
      function anum(item) {
        if (!Number.isSafeInteger(item))
          throw new Error("number expected");
      }
      function normDST(DST) {
        if (!(0, utils_ts_1.isBytes)(DST) && typeof DST !== "string")
          throw new Error("DST must be Uint8Array or string");
        return typeof DST === "string" ? (0, utils_ts_1.utf8ToBytes)(DST) : DST;
      }
      function expand_message_xmd(msg, DST, lenInBytes, H) {
        (0, utils_ts_1.abytes)(msg);
        anum(lenInBytes);
        DST = normDST(DST);
        if (DST.length > 255)
          DST = H((0, utils_ts_1.concatBytes)((0, utils_ts_1.utf8ToBytes)("H2C-OVERSIZE-DST-"), DST));
        const { outputLen: b_in_bytes, blockLen: r_in_bytes } = H;
        const ell = Math.ceil(lenInBytes / b_in_bytes);
        if (lenInBytes > 65535 || ell > 255)
          throw new Error("expand_message_xmd: invalid lenInBytes");
        const DST_prime = (0, utils_ts_1.concatBytes)(DST, i2osp(DST.length, 1));
        const Z_pad = i2osp(0, r_in_bytes);
        const l_i_b_str = i2osp(lenInBytes, 2);
        const b = new Array(ell);
        const b_0 = H((0, utils_ts_1.concatBytes)(Z_pad, msg, l_i_b_str, i2osp(0, 1), DST_prime));
        b[0] = H((0, utils_ts_1.concatBytes)(b_0, i2osp(1, 1), DST_prime));
        for (let i = 1; i <= ell; i++) {
          const args = [strxor(b_0, b[i - 1]), i2osp(i + 1, 1), DST_prime];
          b[i] = H((0, utils_ts_1.concatBytes)(...args));
        }
        const pseudo_random_bytes = (0, utils_ts_1.concatBytes)(...b);
        return pseudo_random_bytes.slice(0, lenInBytes);
      }
      function expand_message_xof(msg, DST, lenInBytes, k, H) {
        (0, utils_ts_1.abytes)(msg);
        anum(lenInBytes);
        DST = normDST(DST);
        if (DST.length > 255) {
          const dkLen = Math.ceil(2 * k / 8);
          DST = H.create({ dkLen }).update((0, utils_ts_1.utf8ToBytes)("H2C-OVERSIZE-DST-")).update(DST).digest();
        }
        if (lenInBytes > 65535 || DST.length > 255)
          throw new Error("expand_message_xof: invalid lenInBytes");
        return H.create({ dkLen: lenInBytes }).update(msg).update(i2osp(lenInBytes, 2)).update(DST).update(i2osp(DST.length, 1)).digest();
      }
      function hash_to_field(msg, count, options) {
        (0, utils_ts_1._validateObject)(options, {
          p: "bigint",
          m: "number",
          k: "number",
          hash: "function"
        });
        const { p, k, m, hash, expand, DST } = options;
        if (!(0, utils_ts_1.isHash)(options.hash))
          throw new Error("expected valid hash");
        (0, utils_ts_1.abytes)(msg);
        anum(count);
        const log2p = p.toString(2).length;
        const L = Math.ceil((log2p + k) / 8);
        const len_in_bytes = count * m * L;
        let prb;
        if (expand === "xmd") {
          prb = expand_message_xmd(msg, DST, len_in_bytes, hash);
        } else if (expand === "xof") {
          prb = expand_message_xof(msg, DST, len_in_bytes, k, hash);
        } else if (expand === "_internal_pass") {
          prb = msg;
        } else {
          throw new Error('expand must be "xmd" or "xof"');
        }
        const u = new Array(count);
        for (let i = 0; i < count; i++) {
          const e = new Array(m);
          for (let j = 0; j < m; j++) {
            const elm_offset = L * (j + i * m);
            const tv = prb.subarray(elm_offset, elm_offset + L);
            e[j] = (0, modular_ts_1.mod)(os2ip(tv), p);
          }
          u[i] = e;
        }
        return u;
      }
      function isogenyMap(field, map) {
        const coeff = map.map((i) => Array.from(i).reverse());
        return (x, y) => {
          const [xn, xd, yn, yd] = coeff.map((val) => val.reduce((acc, i) => field.add(field.mul(acc, x), i)));
          const [xd_inv, yd_inv] = (0, modular_ts_1.FpInvertBatch)(field, [xd, yd], true);
          x = field.mul(xn, xd_inv);
          y = field.mul(y, field.mul(yn, yd_inv));
          return { x, y };
        };
      }
      exports._DST_scalar = (0, utils_ts_1.utf8ToBytes)("HashToScalar-");
      function createHasher(Point, mapToCurve, defaults) {
        if (typeof mapToCurve !== "function")
          throw new Error("mapToCurve() must be defined");
        function map(num) {
          return Point.fromAffine(mapToCurve(num));
        }
        function clear(initial) {
          const P = initial.clearCofactor();
          if (P.equals(Point.ZERO))
            return Point.ZERO;
          P.assertValidity();
          return P;
        }
        return {
          defaults,
          hashToCurve(msg, options) {
            const opts = Object.assign({}, defaults, options);
            const u = hash_to_field(msg, 2, opts);
            const u0 = map(u[0]);
            const u1 = map(u[1]);
            return clear(u0.add(u1));
          },
          encodeToCurve(msg, options) {
            const optsDst = defaults.encodeDST ? { DST: defaults.encodeDST } : {};
            const opts = Object.assign({}, defaults, optsDst, options);
            const u = hash_to_field(msg, 1, opts);
            const u0 = map(u[0]);
            return clear(u0);
          },
          /** See {@link H2CHasher} */
          mapToCurve(scalars) {
            if (!Array.isArray(scalars))
              throw new Error("expected array of bigints");
            for (const i of scalars)
              if (typeof i !== "bigint")
                throw new Error("expected array of bigints");
            return clear(map(scalars));
          },
          // hash_to_scalar can produce 0: https://www.rfc-editor.org/errata/eid8393
          // RFC 9380, draft-irtf-cfrg-bbs-signatures-08
          hashToScalar(msg, options) {
            const N = Point.Fn.ORDER;
            const opts = Object.assign({}, defaults, { p: N, m: 1, DST: exports._DST_scalar }, options);
            return hash_to_field(msg, 1, opts)[0][0];
          }
        };
      }
    }
  });

  // node_modules/@noble/curves/abstract/montgomery.js
  var require_montgomery = __commonJS({
    "node_modules/@noble/curves/abstract/montgomery.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.montgomery = montgomery;
      var utils_ts_1 = require_utils2();
      var modular_ts_1 = require_modular();
      var _0n = BigInt(0);
      var _1n = BigInt(1);
      var _2n = BigInt(2);
      function validateOpts(curve) {
        (0, utils_ts_1._validateObject)(curve, {
          adjustScalarBytes: "function",
          powPminus2: "function"
        });
        return Object.freeze({ ...curve });
      }
      function montgomery(curveDef) {
        const CURVE = validateOpts(curveDef);
        const { P, type, adjustScalarBytes, powPminus2, randomBytes: rand } = CURVE;
        const is25519 = type === "x25519";
        if (!is25519 && type !== "x448")
          throw new Error("invalid type");
        const randomBytes_ = rand || utils_ts_1.randomBytes;
        const montgomeryBits = is25519 ? 255 : 448;
        const fieldLen = is25519 ? 32 : 56;
        const Gu = is25519 ? BigInt(9) : BigInt(5);
        const a24 = is25519 ? BigInt(121665) : BigInt(39081);
        const minScalar = is25519 ? _2n ** BigInt(254) : _2n ** BigInt(447);
        const maxAdded = is25519 ? BigInt(8) * _2n ** BigInt(251) - _1n : BigInt(4) * _2n ** BigInt(445) - _1n;
        const maxScalar = minScalar + maxAdded + _1n;
        const modP = (n) => (0, modular_ts_1.mod)(n, P);
        const GuBytes = encodeU(Gu);
        function encodeU(u) {
          return (0, utils_ts_1.numberToBytesLE)(modP(u), fieldLen);
        }
        function decodeU(u) {
          const _u = (0, utils_ts_1.ensureBytes)("u coordinate", u, fieldLen);
          if (is25519)
            _u[31] &= 127;
          return modP((0, utils_ts_1.bytesToNumberLE)(_u));
        }
        function decodeScalar(scalar) {
          return (0, utils_ts_1.bytesToNumberLE)(adjustScalarBytes((0, utils_ts_1.ensureBytes)("scalar", scalar, fieldLen)));
        }
        function scalarMult(scalar, u) {
          const pu = montgomeryLadder(decodeU(u), decodeScalar(scalar));
          if (pu === _0n)
            throw new Error("invalid private or public key received");
          return encodeU(pu);
        }
        function scalarMultBase(scalar) {
          return scalarMult(scalar, GuBytes);
        }
        function cswap(swap, x_2, x_3) {
          const dummy = modP(swap * (x_2 - x_3));
          x_2 = modP(x_2 - dummy);
          x_3 = modP(x_3 + dummy);
          return { x_2, x_3 };
        }
        function montgomeryLadder(u, scalar) {
          (0, utils_ts_1.aInRange)("u", u, _0n, P);
          (0, utils_ts_1.aInRange)("scalar", scalar, minScalar, maxScalar);
          const k = scalar;
          const x_1 = u;
          let x_2 = _1n;
          let z_2 = _0n;
          let x_3 = u;
          let z_3 = _1n;
          let swap = _0n;
          for (let t = BigInt(montgomeryBits - 1); t >= _0n; t--) {
            const k_t = k >> t & _1n;
            swap ^= k_t;
            ({ x_2, x_3 } = cswap(swap, x_2, x_3));
            ({ x_2: z_2, x_3: z_3 } = cswap(swap, z_2, z_3));
            swap = k_t;
            const A = x_2 + z_2;
            const AA = modP(A * A);
            const B = x_2 - z_2;
            const BB = modP(B * B);
            const E = AA - BB;
            const C = x_3 + z_3;
            const D = x_3 - z_3;
            const DA = modP(D * A);
            const CB = modP(C * B);
            const dacb = DA + CB;
            const da_cb = DA - CB;
            x_3 = modP(dacb * dacb);
            z_3 = modP(x_1 * modP(da_cb * da_cb));
            x_2 = modP(AA * BB);
            z_2 = modP(E * (AA + modP(a24 * E)));
          }
          ({ x_2, x_3 } = cswap(swap, x_2, x_3));
          ({ x_2: z_2, x_3: z_3 } = cswap(swap, z_2, z_3));
          const z2 = powPminus2(z_2);
          return modP(x_2 * z2);
        }
        const lengths = {
          secretKey: fieldLen,
          publicKey: fieldLen,
          seed: fieldLen
        };
        const randomSecretKey = (seed = randomBytes_(fieldLen)) => {
          (0, utils_ts_1.abytes)(seed, lengths.seed);
          return seed;
        };
        function keygen(seed) {
          const secretKey = randomSecretKey(seed);
          return { secretKey, publicKey: scalarMultBase(secretKey) };
        }
        const utils = {
          randomSecretKey,
          randomPrivateKey: randomSecretKey
        };
        return {
          keygen,
          getSharedSecret: (secretKey, publicKey) => scalarMult(secretKey, publicKey),
          getPublicKey: (secretKey) => scalarMultBase(secretKey),
          scalarMult,
          scalarMultBase,
          utils,
          GuBytes: GuBytes.slice(),
          lengths
        };
      }
    }
  });

  // node_modules/@noble/curves/ed25519.js
  var require_ed25519 = __commonJS({
    "node_modules/@noble/curves/ed25519.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.hash_to_ristretto255 = exports.hashToRistretto255 = exports.encodeToCurve = exports.hashToCurve = exports.RistrettoPoint = exports.edwardsToMontgomery = exports.ED25519_TORSION_SUBGROUP = exports.ristretto255_hasher = exports.ristretto255 = exports.ed25519_hasher = exports.x25519 = exports.ed25519ph = exports.ed25519ctx = exports.ed25519 = void 0;
      exports.edwardsToMontgomeryPub = edwardsToMontgomeryPub;
      exports.edwardsToMontgomeryPriv = edwardsToMontgomeryPriv;
      var sha2_js_1 = require_sha2();
      var utils_js_1 = require_utils();
      var curve_ts_1 = require_curve();
      var edwards_ts_1 = require_edwards();
      var hash_to_curve_ts_1 = require_hash_to_curve();
      var modular_ts_1 = require_modular();
      var montgomery_ts_1 = require_montgomery();
      var utils_ts_1 = require_utils2();
      var _0n = /* @__PURE__ */ BigInt(0);
      var _1n = BigInt(1);
      var _2n = BigInt(2);
      var _3n = BigInt(3);
      var _5n = BigInt(5);
      var _8n = BigInt(8);
      var ed25519_CURVE_p = BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffed");
      var ed25519_CURVE = /* @__PURE__ */ (() => ({
        p: ed25519_CURVE_p,
        n: BigInt("0x1000000000000000000000000000000014def9dea2f79cd65812631a5cf5d3ed"),
        h: _8n,
        a: BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffec"),
        d: BigInt("0x52036cee2b6ffe738cc740797779e89800700a4d4141d8ab75eb4dca135978a3"),
        Gx: BigInt("0x216936d3cd6e53fec0a4e231fdd6dc5c692cc7609525a7b2c9562d608f25d51a"),
        Gy: BigInt("0x6666666666666666666666666666666666666666666666666666666666666658")
      }))();
      function ed25519_pow_2_252_3(x) {
        const _10n = BigInt(10), _20n = BigInt(20), _40n = BigInt(40), _80n = BigInt(80);
        const P = ed25519_CURVE_p;
        const x2 = x * x % P;
        const b2 = x2 * x % P;
        const b4 = (0, modular_ts_1.pow2)(b2, _2n, P) * b2 % P;
        const b5 = (0, modular_ts_1.pow2)(b4, _1n, P) * x % P;
        const b10 = (0, modular_ts_1.pow2)(b5, _5n, P) * b5 % P;
        const b20 = (0, modular_ts_1.pow2)(b10, _10n, P) * b10 % P;
        const b40 = (0, modular_ts_1.pow2)(b20, _20n, P) * b20 % P;
        const b80 = (0, modular_ts_1.pow2)(b40, _40n, P) * b40 % P;
        const b160 = (0, modular_ts_1.pow2)(b80, _80n, P) * b80 % P;
        const b240 = (0, modular_ts_1.pow2)(b160, _80n, P) * b80 % P;
        const b250 = (0, modular_ts_1.pow2)(b240, _10n, P) * b10 % P;
        const pow_p_5_8 = (0, modular_ts_1.pow2)(b250, _2n, P) * x % P;
        return { pow_p_5_8, b2 };
      }
      function adjustScalarBytes(bytes) {
        bytes[0] &= 248;
        bytes[31] &= 127;
        bytes[31] |= 64;
        return bytes;
      }
      var ED25519_SQRT_M1 = /* @__PURE__ */ BigInt("19681161376707505956807079304988542015446066515923890162744021073123829784752");
      function uvRatio(u, v) {
        const P = ed25519_CURVE_p;
        const v3 = (0, modular_ts_1.mod)(v * v * v, P);
        const v7 = (0, modular_ts_1.mod)(v3 * v3 * v, P);
        const pow = ed25519_pow_2_252_3(u * v7).pow_p_5_8;
        let x = (0, modular_ts_1.mod)(u * v3 * pow, P);
        const vx2 = (0, modular_ts_1.mod)(v * x * x, P);
        const root1 = x;
        const root2 = (0, modular_ts_1.mod)(x * ED25519_SQRT_M1, P);
        const useRoot1 = vx2 === u;
        const useRoot2 = vx2 === (0, modular_ts_1.mod)(-u, P);
        const noRoot = vx2 === (0, modular_ts_1.mod)(-u * ED25519_SQRT_M1, P);
        if (useRoot1)
          x = root1;
        if (useRoot2 || noRoot)
          x = root2;
        if ((0, modular_ts_1.isNegativeLE)(x, P))
          x = (0, modular_ts_1.mod)(-x, P);
        return { isValid: useRoot1 || useRoot2, value: x };
      }
      var Fp = /* @__PURE__ */ (() => (0, modular_ts_1.Field)(ed25519_CURVE.p, { isLE: true }))();
      var Fn = /* @__PURE__ */ (() => (0, modular_ts_1.Field)(ed25519_CURVE.n, { isLE: true }))();
      var ed25519Defaults = /* @__PURE__ */ (() => ({
        ...ed25519_CURVE,
        Fp,
        hash: sha2_js_1.sha512,
        adjustScalarBytes,
        // dom2
        // Ratio of u to v. Allows us to combine inversion and square root. Uses algo from RFC8032 5.1.3.
        // Constant-time, u/√v
        uvRatio
      }))();
      exports.ed25519 = (() => (0, edwards_ts_1.twistedEdwards)(ed25519Defaults))();
      function ed25519_domain(data, ctx, phflag) {
        if (ctx.length > 255)
          throw new Error("Context is too big");
        return (0, utils_js_1.concatBytes)((0, utils_js_1.utf8ToBytes)("SigEd25519 no Ed25519 collisions"), new Uint8Array([phflag ? 1 : 0, ctx.length]), ctx, data);
      }
      exports.ed25519ctx = (() => (0, edwards_ts_1.twistedEdwards)({
        ...ed25519Defaults,
        domain: ed25519_domain
      }))();
      exports.ed25519ph = (() => (0, edwards_ts_1.twistedEdwards)(Object.assign({}, ed25519Defaults, {
        domain: ed25519_domain,
        prehash: sha2_js_1.sha512
      })))();
      exports.x25519 = (() => {
        const P = Fp.ORDER;
        return (0, montgomery_ts_1.montgomery)({
          P,
          type: "x25519",
          powPminus2: (x) => {
            const { pow_p_5_8, b2 } = ed25519_pow_2_252_3(x);
            return (0, modular_ts_1.mod)((0, modular_ts_1.pow2)(pow_p_5_8, _3n, P) * b2, P);
          },
          adjustScalarBytes
        });
      })();
      var ELL2_C1 = /* @__PURE__ */ (() => (ed25519_CURVE_p + _3n) / _8n)();
      var ELL2_C2 = /* @__PURE__ */ (() => Fp.pow(_2n, ELL2_C1))();
      var ELL2_C3 = /* @__PURE__ */ (() => Fp.sqrt(Fp.neg(Fp.ONE)))();
      function map_to_curve_elligator2_curve25519(u) {
        const ELL2_C4 = (ed25519_CURVE_p - _5n) / _8n;
        const ELL2_J = BigInt(486662);
        let tv1 = Fp.sqr(u);
        tv1 = Fp.mul(tv1, _2n);
        let xd = Fp.add(tv1, Fp.ONE);
        let x1n = Fp.neg(ELL2_J);
        let tv2 = Fp.sqr(xd);
        let gxd = Fp.mul(tv2, xd);
        let gx1 = Fp.mul(tv1, ELL2_J);
        gx1 = Fp.mul(gx1, x1n);
        gx1 = Fp.add(gx1, tv2);
        gx1 = Fp.mul(gx1, x1n);
        let tv3 = Fp.sqr(gxd);
        tv2 = Fp.sqr(tv3);
        tv3 = Fp.mul(tv3, gxd);
        tv3 = Fp.mul(tv3, gx1);
        tv2 = Fp.mul(tv2, tv3);
        let y11 = Fp.pow(tv2, ELL2_C4);
        y11 = Fp.mul(y11, tv3);
        let y12 = Fp.mul(y11, ELL2_C3);
        tv2 = Fp.sqr(y11);
        tv2 = Fp.mul(tv2, gxd);
        let e1 = Fp.eql(tv2, gx1);
        let y1 = Fp.cmov(y12, y11, e1);
        let x2n = Fp.mul(x1n, tv1);
        let y21 = Fp.mul(y11, u);
        y21 = Fp.mul(y21, ELL2_C2);
        let y22 = Fp.mul(y21, ELL2_C3);
        let gx2 = Fp.mul(gx1, tv1);
        tv2 = Fp.sqr(y21);
        tv2 = Fp.mul(tv2, gxd);
        let e2 = Fp.eql(tv2, gx2);
        let y2 = Fp.cmov(y22, y21, e2);
        tv2 = Fp.sqr(y1);
        tv2 = Fp.mul(tv2, gxd);
        let e3 = Fp.eql(tv2, gx1);
        let xn = Fp.cmov(x2n, x1n, e3);
        let y = Fp.cmov(y2, y1, e3);
        let e4 = Fp.isOdd(y);
        y = Fp.cmov(y, Fp.neg(y), e3 !== e4);
        return { xMn: xn, xMd: xd, yMn: y, yMd: _1n };
      }
      var ELL2_C1_EDWARDS = /* @__PURE__ */ (() => (0, modular_ts_1.FpSqrtEven)(Fp, Fp.neg(BigInt(486664))))();
      function map_to_curve_elligator2_edwards25519(u) {
        const { xMn, xMd, yMn, yMd } = map_to_curve_elligator2_curve25519(u);
        let xn = Fp.mul(xMn, yMd);
        xn = Fp.mul(xn, ELL2_C1_EDWARDS);
        let xd = Fp.mul(xMd, yMn);
        let yn = Fp.sub(xMn, xMd);
        let yd = Fp.add(xMn, xMd);
        let tv1 = Fp.mul(xd, yd);
        let e = Fp.eql(tv1, Fp.ZERO);
        xn = Fp.cmov(xn, Fp.ZERO, e);
        xd = Fp.cmov(xd, Fp.ONE, e);
        yn = Fp.cmov(yn, Fp.ONE, e);
        yd = Fp.cmov(yd, Fp.ONE, e);
        const [xd_inv, yd_inv] = (0, modular_ts_1.FpInvertBatch)(Fp, [xd, yd], true);
        return { x: Fp.mul(xn, xd_inv), y: Fp.mul(yn, yd_inv) };
      }
      exports.ed25519_hasher = (() => (0, hash_to_curve_ts_1.createHasher)(exports.ed25519.Point, (scalars) => map_to_curve_elligator2_edwards25519(scalars[0]), {
        DST: "edwards25519_XMD:SHA-512_ELL2_RO_",
        encodeDST: "edwards25519_XMD:SHA-512_ELL2_NU_",
        p: ed25519_CURVE_p,
        m: 1,
        k: 128,
        expand: "xmd",
        hash: sha2_js_1.sha512
      }))();
      var SQRT_M1 = ED25519_SQRT_M1;
      var SQRT_AD_MINUS_ONE = /* @__PURE__ */ BigInt("25063068953384623474111414158702152701244531502492656460079210482610430750235");
      var INVSQRT_A_MINUS_D = /* @__PURE__ */ BigInt("54469307008909316920995813868745141605393597292927456921205312896311721017578");
      var ONE_MINUS_D_SQ = /* @__PURE__ */ BigInt("1159843021668779879193775521855586647937357759715417654439879720876111806838");
      var D_MINUS_ONE_SQ = /* @__PURE__ */ BigInt("40440834346308536858101042469323190826248399146238708352240133220865137265952");
      var invertSqrt = (number) => uvRatio(_1n, number);
      var MAX_255B = /* @__PURE__ */ BigInt("0x7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
      var bytes255ToNumberLE = (bytes) => exports.ed25519.Point.Fp.create((0, utils_ts_1.bytesToNumberLE)(bytes) & MAX_255B);
      function calcElligatorRistrettoMap(r0) {
        const { d } = ed25519_CURVE;
        const P = ed25519_CURVE_p;
        const mod = (n) => Fp.create(n);
        const r = mod(SQRT_M1 * r0 * r0);
        const Ns = mod((r + _1n) * ONE_MINUS_D_SQ);
        let c = BigInt(-1);
        const D = mod((c - d * r) * mod(r + d));
        let { isValid: Ns_D_is_sq, value: s } = uvRatio(Ns, D);
        let s_ = mod(s * r0);
        if (!(0, modular_ts_1.isNegativeLE)(s_, P))
          s_ = mod(-s_);
        if (!Ns_D_is_sq)
          s = s_;
        if (!Ns_D_is_sq)
          c = r;
        const Nt = mod(c * (r - _1n) * D_MINUS_ONE_SQ - D);
        const s2 = s * s;
        const W0 = mod((s + s) * D);
        const W1 = mod(Nt * SQRT_AD_MINUS_ONE);
        const W2 = mod(_1n - s2);
        const W3 = mod(_1n + s2);
        return new exports.ed25519.Point(mod(W0 * W3), mod(W2 * W1), mod(W1 * W3), mod(W0 * W2));
      }
      function ristretto255_map(bytes) {
        (0, utils_js_1.abytes)(bytes, 64);
        const r1 = bytes255ToNumberLE(bytes.subarray(0, 32));
        const R1 = calcElligatorRistrettoMap(r1);
        const r2 = bytes255ToNumberLE(bytes.subarray(32, 64));
        const R2 = calcElligatorRistrettoMap(r2);
        return new _RistrettoPoint(R1.add(R2));
      }
      var _RistrettoPoint = class __RistrettoPoint extends edwards_ts_1.PrimeEdwardsPoint {
        constructor(ep) {
          super(ep);
        }
        static fromAffine(ap) {
          return new __RistrettoPoint(exports.ed25519.Point.fromAffine(ap));
        }
        assertSame(other) {
          if (!(other instanceof __RistrettoPoint))
            throw new Error("RistrettoPoint expected");
        }
        init(ep) {
          return new __RistrettoPoint(ep);
        }
        /** @deprecated use `import { ristretto255_hasher } from '@noble/curves/ed25519.js';` */
        static hashToCurve(hex) {
          return ristretto255_map((0, utils_ts_1.ensureBytes)("ristrettoHash", hex, 64));
        }
        static fromBytes(bytes) {
          (0, utils_js_1.abytes)(bytes, 32);
          const { a, d } = ed25519_CURVE;
          const P = ed25519_CURVE_p;
          const mod = (n) => Fp.create(n);
          const s = bytes255ToNumberLE(bytes);
          if (!(0, utils_ts_1.equalBytes)(Fp.toBytes(s), bytes) || (0, modular_ts_1.isNegativeLE)(s, P))
            throw new Error("invalid ristretto255 encoding 1");
          const s2 = mod(s * s);
          const u1 = mod(_1n + a * s2);
          const u2 = mod(_1n - a * s2);
          const u1_2 = mod(u1 * u1);
          const u2_2 = mod(u2 * u2);
          const v = mod(a * d * u1_2 - u2_2);
          const { isValid, value: I } = invertSqrt(mod(v * u2_2));
          const Dx = mod(I * u2);
          const Dy = mod(I * Dx * v);
          let x = mod((s + s) * Dx);
          if ((0, modular_ts_1.isNegativeLE)(x, P))
            x = mod(-x);
          const y = mod(u1 * Dy);
          const t = mod(x * y);
          if (!isValid || (0, modular_ts_1.isNegativeLE)(t, P) || y === _0n)
            throw new Error("invalid ristretto255 encoding 2");
          return new __RistrettoPoint(new exports.ed25519.Point(x, y, _1n, t));
        }
        /**
         * Converts ristretto-encoded string to ristretto point.
         * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-decode).
         * @param hex Ristretto-encoded 32 bytes. Not every 32-byte string is valid ristretto encoding
         */
        static fromHex(hex) {
          return __RistrettoPoint.fromBytes((0, utils_ts_1.ensureBytes)("ristrettoHex", hex, 32));
        }
        static msm(points, scalars) {
          return (0, curve_ts_1.pippenger)(__RistrettoPoint, exports.ed25519.Point.Fn, points, scalars);
        }
        /**
         * Encodes ristretto point to Uint8Array.
         * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-encode).
         */
        toBytes() {
          let { X, Y, Z, T } = this.ep;
          const P = ed25519_CURVE_p;
          const mod = (n) => Fp.create(n);
          const u1 = mod(mod(Z + Y) * mod(Z - Y));
          const u2 = mod(X * Y);
          const u2sq = mod(u2 * u2);
          const { value: invsqrt } = invertSqrt(mod(u1 * u2sq));
          const D1 = mod(invsqrt * u1);
          const D2 = mod(invsqrt * u2);
          const zInv = mod(D1 * D2 * T);
          let D;
          if ((0, modular_ts_1.isNegativeLE)(T * zInv, P)) {
            let _x = mod(Y * SQRT_M1);
            let _y = mod(X * SQRT_M1);
            X = _x;
            Y = _y;
            D = mod(D1 * INVSQRT_A_MINUS_D);
          } else {
            D = D2;
          }
          if ((0, modular_ts_1.isNegativeLE)(X * zInv, P))
            Y = mod(-Y);
          let s = mod((Z - Y) * D);
          if ((0, modular_ts_1.isNegativeLE)(s, P))
            s = mod(-s);
          return Fp.toBytes(s);
        }
        /**
         * Compares two Ristretto points.
         * Described in [RFC9496](https://www.rfc-editor.org/rfc/rfc9496#name-equals).
         */
        equals(other) {
          this.assertSame(other);
          const { X: X1, Y: Y1 } = this.ep;
          const { X: X2, Y: Y2 } = other.ep;
          const mod = (n) => Fp.create(n);
          const one = mod(X1 * Y2) === mod(Y1 * X2);
          const two = mod(Y1 * Y2) === mod(X1 * X2);
          return one || two;
        }
        is0() {
          return this.equals(__RistrettoPoint.ZERO);
        }
      };
      _RistrettoPoint.BASE = /* @__PURE__ */ (() => new _RistrettoPoint(exports.ed25519.Point.BASE))();
      _RistrettoPoint.ZERO = /* @__PURE__ */ (() => new _RistrettoPoint(exports.ed25519.Point.ZERO))();
      _RistrettoPoint.Fp = /* @__PURE__ */ (() => Fp)();
      _RistrettoPoint.Fn = /* @__PURE__ */ (() => Fn)();
      exports.ristretto255 = { Point: _RistrettoPoint };
      exports.ristretto255_hasher = {
        hashToCurve(msg, options) {
          const DST = options?.DST || "ristretto255_XMD:SHA-512_R255MAP_RO_";
          const xmd = (0, hash_to_curve_ts_1.expand_message_xmd)(msg, DST, 64, sha2_js_1.sha512);
          return ristretto255_map(xmd);
        },
        hashToScalar(msg, options = { DST: hash_to_curve_ts_1._DST_scalar }) {
          const xmd = (0, hash_to_curve_ts_1.expand_message_xmd)(msg, options.DST, 64, sha2_js_1.sha512);
          return Fn.create((0, utils_ts_1.bytesToNumberLE)(xmd));
        }
      };
      exports.ED25519_TORSION_SUBGROUP = [
        "0100000000000000000000000000000000000000000000000000000000000000",
        "c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac037a",
        "0000000000000000000000000000000000000000000000000000000000000080",
        "26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc05",
        "ecffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff7f",
        "26e8958fc2b227b045c3f489f2ef98f0d5dfac05d3c63339b13802886d53fc85",
        "0000000000000000000000000000000000000000000000000000000000000000",
        "c7176a703d4dd84fba3c0b760d10670f2a2053fa2c39ccc64ec7fd7792ac03fa"
      ];
      function edwardsToMontgomeryPub(edwardsPub) {
        return exports.ed25519.utils.toMontgomery((0, utils_ts_1.ensureBytes)("pub", edwardsPub));
      }
      exports.edwardsToMontgomery = edwardsToMontgomeryPub;
      function edwardsToMontgomeryPriv(edwardsPriv) {
        return exports.ed25519.utils.toMontgomerySecret((0, utils_ts_1.ensureBytes)("pub", edwardsPriv));
      }
      exports.RistrettoPoint = _RistrettoPoint;
      exports.hashToCurve = (() => exports.ed25519_hasher.hashToCurve)();
      exports.encodeToCurve = (() => exports.ed25519_hasher.encodeToCurve)();
      exports.hashToRistretto255 = (() => exports.ristretto255_hasher.hashToCurve)();
      exports.hash_to_ristretto255 = (() => exports.ristretto255_hasher.hashToCurve)();
    }
  });

  // node_modules/@noble/ciphers/utils.js
  var require_utils3 = __commonJS({
    "node_modules/@noble/ciphers/utils.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.wrapCipher = exports.Hash = exports.nextTick = exports.isLE = void 0;
      exports.isBytes = isBytes;
      exports.abool = abool;
      exports.anumber = anumber;
      exports.abytes = abytes;
      exports.ahash = ahash;
      exports.aexists = aexists;
      exports.aoutput = aoutput;
      exports.u8 = u8;
      exports.u32 = u32;
      exports.clean = clean;
      exports.createView = createView;
      exports.bytesToHex = bytesToHex;
      exports.hexToBytes = hexToBytes;
      exports.hexToNumber = hexToNumber;
      exports.bytesToNumberBE = bytesToNumberBE;
      exports.numberToBytesBE = numberToBytesBE;
      exports.utf8ToBytes = utf8ToBytes;
      exports.bytesToUtf8 = bytesToUtf8;
      exports.toBytes = toBytes;
      exports.overlapBytes = overlapBytes;
      exports.complexOverlapBytes = complexOverlapBytes;
      exports.concatBytes = concatBytes;
      exports.checkOpts = checkOpts;
      exports.equalBytes = equalBytes;
      exports.getOutput = getOutput;
      exports.setBigUint64 = setBigUint64;
      exports.u64Lengths = u64Lengths;
      exports.isAligned32 = isAligned32;
      exports.copyBytes = copyBytes;
      function isBytes(a) {
        return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array";
      }
      function abool(b) {
        if (typeof b !== "boolean")
          throw new Error(`boolean expected, not ${b}`);
      }
      function anumber(n) {
        if (!Number.isSafeInteger(n) || n < 0)
          throw new Error("positive integer expected, got " + n);
      }
      function abytes(b, ...lengths) {
        if (!isBytes(b))
          throw new Error("Uint8Array expected");
        if (lengths.length > 0 && !lengths.includes(b.length))
          throw new Error("Uint8Array expected of length " + lengths + ", got length=" + b.length);
      }
      function ahash(h) {
        if (typeof h !== "function" || typeof h.create !== "function")
          throw new Error("Hash should be wrapped by utils.createHasher");
        anumber(h.outputLen);
        anumber(h.blockLen);
      }
      function aexists(instance, checkFinished = true) {
        if (instance.destroyed)
          throw new Error("Hash instance has been destroyed");
        if (checkFinished && instance.finished)
          throw new Error("Hash#digest() has already been called");
      }
      function aoutput(out, instance) {
        abytes(out);
        const min = instance.outputLen;
        if (out.length < min) {
          throw new Error("digestInto() expects output buffer of length at least " + min);
        }
      }
      function u8(arr) {
        return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
      }
      function u32(arr) {
        return new Uint32Array(arr.buffer, arr.byteOffset, Math.floor(arr.byteLength / 4));
      }
      function clean(...arrays) {
        for (let i = 0; i < arrays.length; i++) {
          arrays[i].fill(0);
        }
      }
      function createView(arr) {
        return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
      }
      exports.isLE = (() => new Uint8Array(new Uint32Array([287454020]).buffer)[0] === 68)();
      var hasHexBuiltin = /* @__PURE__ */ (() => (
        // @ts-ignore
        typeof Uint8Array.from([]).toHex === "function" && typeof Uint8Array.fromHex === "function"
      ))();
      var hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
      function bytesToHex(bytes) {
        abytes(bytes);
        if (hasHexBuiltin)
          return bytes.toHex();
        let hex = "";
        for (let i = 0; i < bytes.length; i++) {
          hex += hexes[bytes[i]];
        }
        return hex;
      }
      var asciis = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
      function asciiToBase16(ch) {
        if (ch >= asciis._0 && ch <= asciis._9)
          return ch - asciis._0;
        if (ch >= asciis.A && ch <= asciis.F)
          return ch - (asciis.A - 10);
        if (ch >= asciis.a && ch <= asciis.f)
          return ch - (asciis.a - 10);
        return;
      }
      function hexToBytes(hex) {
        if (typeof hex !== "string")
          throw new Error("hex string expected, got " + typeof hex);
        if (hasHexBuiltin)
          return Uint8Array.fromHex(hex);
        const hl = hex.length;
        const al = hl / 2;
        if (hl % 2)
          throw new Error("hex string expected, got unpadded hex of length " + hl);
        const array = new Uint8Array(al);
        for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
          const n1 = asciiToBase16(hex.charCodeAt(hi));
          const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
          if (n1 === void 0 || n2 === void 0) {
            const char = hex[hi] + hex[hi + 1];
            throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
          }
          array[ai] = n1 * 16 + n2;
        }
        return array;
      }
      function hexToNumber(hex) {
        if (typeof hex !== "string")
          throw new Error("hex string expected, got " + typeof hex);
        return BigInt(hex === "" ? "0" : "0x" + hex);
      }
      function bytesToNumberBE(bytes) {
        return hexToNumber(bytesToHex(bytes));
      }
      function numberToBytesBE(n, len) {
        return hexToBytes(n.toString(16).padStart(len * 2, "0"));
      }
      var nextTick = async () => {
      };
      exports.nextTick = nextTick;
      function utf8ToBytes(str) {
        if (typeof str !== "string")
          throw new Error("string expected");
        return new Uint8Array(new TextEncoder().encode(str));
      }
      function bytesToUtf8(bytes) {
        return new TextDecoder().decode(bytes);
      }
      function toBytes(data) {
        if (typeof data === "string")
          data = utf8ToBytes(data);
        else if (isBytes(data))
          data = copyBytes(data);
        else
          throw new Error("Uint8Array expected, got " + typeof data);
        return data;
      }
      function overlapBytes(a, b) {
        return a.buffer === b.buffer && // best we can do, may fail with an obscure Proxy
        a.byteOffset < b.byteOffset + b.byteLength && // a starts before b end
        b.byteOffset < a.byteOffset + a.byteLength;
      }
      function complexOverlapBytes(input, output) {
        if (overlapBytes(input, output) && input.byteOffset < output.byteOffset)
          throw new Error("complex overlap of input and output is not supported");
      }
      function concatBytes(...arrays) {
        let sum = 0;
        for (let i = 0; i < arrays.length; i++) {
          const a = arrays[i];
          abytes(a);
          sum += a.length;
        }
        const res = new Uint8Array(sum);
        for (let i = 0, pad = 0; i < arrays.length; i++) {
          const a = arrays[i];
          res.set(a, pad);
          pad += a.length;
        }
        return res;
      }
      function checkOpts(defaults, opts) {
        if (opts == null || typeof opts !== "object")
          throw new Error("options must be defined");
        const merged = Object.assign(defaults, opts);
        return merged;
      }
      function equalBytes(a, b) {
        if (a.length !== b.length)
          return false;
        let diff = 0;
        for (let i = 0; i < a.length; i++)
          diff |= a[i] ^ b[i];
        return diff === 0;
      }
      var Hash = class {
      };
      exports.Hash = Hash;
      var wrapCipher = /* @__NO_SIDE_EFFECTS__ */ (params, constructor) => {
        function wrappedCipher(key, ...args) {
          abytes(key);
          if (!exports.isLE)
            throw new Error("Non little-endian hardware is not yet supported");
          if (params.nonceLength !== void 0) {
            const nonce = args[0];
            if (!nonce)
              throw new Error("nonce / iv required");
            if (params.varSizeNonce)
              abytes(nonce);
            else
              abytes(nonce, params.nonceLength);
          }
          const tagl = params.tagLength;
          if (tagl && args[1] !== void 0) {
            abytes(args[1]);
          }
          const cipher = constructor(key, ...args);
          const checkOutput = (fnLength, output) => {
            if (output !== void 0) {
              if (fnLength !== 2)
                throw new Error("cipher output not supported");
              abytes(output);
            }
          };
          let called = false;
          const wrCipher = {
            encrypt(data, output) {
              if (called)
                throw new Error("cannot encrypt() twice with same key + nonce");
              called = true;
              abytes(data);
              checkOutput(cipher.encrypt.length, output);
              return cipher.encrypt(data, output);
            },
            decrypt(data, output) {
              abytes(data);
              if (tagl && data.length < tagl)
                throw new Error("invalid ciphertext length: smaller than tagLength=" + tagl);
              checkOutput(cipher.decrypt.length, output);
              return cipher.decrypt(data, output);
            }
          };
          return wrCipher;
        }
        Object.assign(wrappedCipher, params);
        return wrappedCipher;
      };
      exports.wrapCipher = wrapCipher;
      function getOutput(expectedLength, out, onlyAligned = true) {
        if (out === void 0)
          return new Uint8Array(expectedLength);
        if (out.length !== expectedLength)
          throw new Error("invalid output length, expected " + expectedLength + ", got: " + out.length);
        if (onlyAligned && !isAligned32(out))
          throw new Error("invalid output, must be aligned");
        return out;
      }
      function setBigUint64(view, byteOffset, value, isLE) {
        if (typeof view.setBigUint64 === "function")
          return view.setBigUint64(byteOffset, value, isLE);
        const _32n = BigInt(32);
        const _u32_max = BigInt(4294967295);
        const wh = Number(value >> _32n & _u32_max);
        const wl = Number(value & _u32_max);
        const h = isLE ? 4 : 0;
        const l = isLE ? 0 : 4;
        view.setUint32(byteOffset + h, wh, isLE);
        view.setUint32(byteOffset + l, wl, isLE);
      }
      function u64Lengths(dataLength, aadLength, isLE) {
        abool(isLE);
        const num = new Uint8Array(16);
        const view = createView(num);
        setBigUint64(view, 0, BigInt(aadLength), isLE);
        setBigUint64(view, 8, BigInt(dataLength), isLE);
        return num;
      }
      function isAligned32(bytes) {
        return bytes.byteOffset % 4 === 0;
      }
      function copyBytes(bytes) {
        return Uint8Array.from(bytes);
      }
    }
  });

  // node_modules/@noble/ciphers/_polyval.js
  var require_polyval = __commonJS({
    "node_modules/@noble/ciphers/_polyval.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.polyval = exports.ghash = void 0;
      exports._toGHASHKey = _toGHASHKey;
      var utils_ts_1 = require_utils3();
      var BLOCK_SIZE = 16;
      var ZEROS16 = /* @__PURE__ */ new Uint8Array(16);
      var ZEROS32 = (0, utils_ts_1.u32)(ZEROS16);
      var POLY = 225;
      var mul2 = (s0, s1, s2, s3) => {
        const hiBit = s3 & 1;
        return {
          s3: s2 << 31 | s3 >>> 1,
          s2: s1 << 31 | s2 >>> 1,
          s1: s0 << 31 | s1 >>> 1,
          s0: s0 >>> 1 ^ POLY << 24 & -(hiBit & 1)
          // reduce % poly
        };
      };
      var swapLE = (n) => (n >>> 0 & 255) << 24 | (n >>> 8 & 255) << 16 | (n >>> 16 & 255) << 8 | n >>> 24 & 255 | 0;
      function _toGHASHKey(k) {
        k.reverse();
        const hiBit = k[15] & 1;
        let carry = 0;
        for (let i = 0; i < k.length; i++) {
          const t = k[i];
          k[i] = t >>> 1 | carry;
          carry = (t & 1) << 7;
        }
        k[0] ^= -hiBit & 225;
        return k;
      }
      var estimateWindow = (bytes) => {
        if (bytes > 64 * 1024)
          return 8;
        if (bytes > 1024)
          return 4;
        return 2;
      };
      var GHASH = class {
        // We select bits per window adaptively based on expectedLength
        constructor(key, expectedLength) {
          this.blockLen = BLOCK_SIZE;
          this.outputLen = BLOCK_SIZE;
          this.s0 = 0;
          this.s1 = 0;
          this.s2 = 0;
          this.s3 = 0;
          this.finished = false;
          key = (0, utils_ts_1.toBytes)(key);
          (0, utils_ts_1.abytes)(key, 16);
          const kView = (0, utils_ts_1.createView)(key);
          let k0 = kView.getUint32(0, false);
          let k1 = kView.getUint32(4, false);
          let k2 = kView.getUint32(8, false);
          let k3 = kView.getUint32(12, false);
          const doubles = [];
          for (let i = 0; i < 128; i++) {
            doubles.push({ s0: swapLE(k0), s1: swapLE(k1), s2: swapLE(k2), s3: swapLE(k3) });
            ({ s0: k0, s1: k1, s2: k2, s3: k3 } = mul2(k0, k1, k2, k3));
          }
          const W = estimateWindow(expectedLength || 1024);
          if (![1, 2, 4, 8].includes(W))
            throw new Error("ghash: invalid window size, expected 2, 4 or 8");
          this.W = W;
          const bits = 128;
          const windows = bits / W;
          const windowSize = this.windowSize = 2 ** W;
          const items = [];
          for (let w = 0; w < windows; w++) {
            for (let byte = 0; byte < windowSize; byte++) {
              let s0 = 0, s1 = 0, s2 = 0, s3 = 0;
              for (let j = 0; j < W; j++) {
                const bit = byte >>> W - j - 1 & 1;
                if (!bit)
                  continue;
                const { s0: d0, s1: d1, s2: d2, s3: d3 } = doubles[W * w + j];
                s0 ^= d0, s1 ^= d1, s2 ^= d2, s3 ^= d3;
              }
              items.push({ s0, s1, s2, s3 });
            }
          }
          this.t = items;
        }
        _updateBlock(s0, s1, s2, s3) {
          s0 ^= this.s0, s1 ^= this.s1, s2 ^= this.s2, s3 ^= this.s3;
          const { W, t, windowSize } = this;
          let o0 = 0, o1 = 0, o2 = 0, o3 = 0;
          const mask = (1 << W) - 1;
          let w = 0;
          for (const num of [s0, s1, s2, s3]) {
            for (let bytePos = 0; bytePos < 4; bytePos++) {
              const byte = num >>> 8 * bytePos & 255;
              for (let bitPos = 8 / W - 1; bitPos >= 0; bitPos--) {
                const bit = byte >>> W * bitPos & mask;
                const { s0: e0, s1: e1, s2: e2, s3: e3 } = t[w * windowSize + bit];
                o0 ^= e0, o1 ^= e1, o2 ^= e2, o3 ^= e3;
                w += 1;
              }
            }
          }
          this.s0 = o0;
          this.s1 = o1;
          this.s2 = o2;
          this.s3 = o3;
        }
        update(data) {
          (0, utils_ts_1.aexists)(this);
          data = (0, utils_ts_1.toBytes)(data);
          (0, utils_ts_1.abytes)(data);
          const b32 = (0, utils_ts_1.u32)(data);
          const blocks = Math.floor(data.length / BLOCK_SIZE);
          const left = data.length % BLOCK_SIZE;
          for (let i = 0; i < blocks; i++) {
            this._updateBlock(b32[i * 4 + 0], b32[i * 4 + 1], b32[i * 4 + 2], b32[i * 4 + 3]);
          }
          if (left) {
            ZEROS16.set(data.subarray(blocks * BLOCK_SIZE));
            this._updateBlock(ZEROS32[0], ZEROS32[1], ZEROS32[2], ZEROS32[3]);
            (0, utils_ts_1.clean)(ZEROS32);
          }
          return this;
        }
        destroy() {
          const { t } = this;
          for (const elm of t) {
            elm.s0 = 0, elm.s1 = 0, elm.s2 = 0, elm.s3 = 0;
          }
        }
        digestInto(out) {
          (0, utils_ts_1.aexists)(this);
          (0, utils_ts_1.aoutput)(out, this);
          this.finished = true;
          const { s0, s1, s2, s3 } = this;
          const o32 = (0, utils_ts_1.u32)(out);
          o32[0] = s0;
          o32[1] = s1;
          o32[2] = s2;
          o32[3] = s3;
          return out;
        }
        digest() {
          const res = new Uint8Array(BLOCK_SIZE);
          this.digestInto(res);
          this.destroy();
          return res;
        }
      };
      var Polyval = class extends GHASH {
        constructor(key, expectedLength) {
          key = (0, utils_ts_1.toBytes)(key);
          (0, utils_ts_1.abytes)(key);
          const ghKey = _toGHASHKey((0, utils_ts_1.copyBytes)(key));
          super(ghKey, expectedLength);
          (0, utils_ts_1.clean)(ghKey);
        }
        update(data) {
          data = (0, utils_ts_1.toBytes)(data);
          (0, utils_ts_1.aexists)(this);
          const b32 = (0, utils_ts_1.u32)(data);
          const left = data.length % BLOCK_SIZE;
          const blocks = Math.floor(data.length / BLOCK_SIZE);
          for (let i = 0; i < blocks; i++) {
            this._updateBlock(swapLE(b32[i * 4 + 3]), swapLE(b32[i * 4 + 2]), swapLE(b32[i * 4 + 1]), swapLE(b32[i * 4 + 0]));
          }
          if (left) {
            ZEROS16.set(data.subarray(blocks * BLOCK_SIZE));
            this._updateBlock(swapLE(ZEROS32[3]), swapLE(ZEROS32[2]), swapLE(ZEROS32[1]), swapLE(ZEROS32[0]));
            (0, utils_ts_1.clean)(ZEROS32);
          }
          return this;
        }
        digestInto(out) {
          (0, utils_ts_1.aexists)(this);
          (0, utils_ts_1.aoutput)(out, this);
          this.finished = true;
          const { s0, s1, s2, s3 } = this;
          const o32 = (0, utils_ts_1.u32)(out);
          o32[0] = s0;
          o32[1] = s1;
          o32[2] = s2;
          o32[3] = s3;
          return out.reverse();
        }
      };
      function wrapConstructorWithKey(hashCons) {
        const hashC = (msg, key) => hashCons(key, msg.length).update((0, utils_ts_1.toBytes)(msg)).digest();
        const tmp = hashCons(new Uint8Array(16), 0);
        hashC.outputLen = tmp.outputLen;
        hashC.blockLen = tmp.blockLen;
        hashC.create = (key, expectedLength) => hashCons(key, expectedLength);
        return hashC;
      }
      exports.ghash = wrapConstructorWithKey((key, expectedLength) => new GHASH(key, expectedLength));
      exports.polyval = wrapConstructorWithKey((key, expectedLength) => new Polyval(key, expectedLength));
    }
  });

  // node_modules/@noble/ciphers/aes.js
  var require_aes = __commonJS({
    "node_modules/@noble/ciphers/aes.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.unsafe = exports.aeskwp = exports.aeskw = exports.siv = exports.gcmsiv = exports.gcm = exports.cfb = exports.cbc = exports.ecb = exports.ctr = void 0;
      var _polyval_ts_1 = require_polyval();
      var utils_ts_1 = require_utils3();
      var BLOCK_SIZE = 16;
      var BLOCK_SIZE32 = 4;
      var EMPTY_BLOCK = /* @__PURE__ */ new Uint8Array(BLOCK_SIZE);
      var POLY = 283;
      function mul2(n) {
        return n << 1 ^ POLY & -(n >> 7);
      }
      function mul(a, b) {
        let res = 0;
        for (; b > 0; b >>= 1) {
          res ^= a & -(b & 1);
          a = mul2(a);
        }
        return res;
      }
      var sbox = /* @__PURE__ */ (() => {
        const t = new Uint8Array(256);
        for (let i = 0, x = 1; i < 256; i++, x ^= mul2(x))
          t[i] = x;
        const box = new Uint8Array(256);
        box[0] = 99;
        for (let i = 0; i < 255; i++) {
          let x = t[255 - i];
          x |= x << 8;
          box[t[i]] = (x ^ x >> 4 ^ x >> 5 ^ x >> 6 ^ x >> 7 ^ 99) & 255;
        }
        (0, utils_ts_1.clean)(t);
        return box;
      })();
      var invSbox = /* @__PURE__ */ sbox.map((_, j) => sbox.indexOf(j));
      var rotr32_8 = (n) => n << 24 | n >>> 8;
      var rotl32_8 = (n) => n << 8 | n >>> 24;
      var byteSwap = (word) => word << 24 & 4278190080 | word << 8 & 16711680 | word >>> 8 & 65280 | word >>> 24 & 255;
      function genTtable(sbox2, fn) {
        if (sbox2.length !== 256)
          throw new Error("Wrong sbox length");
        const T0 = new Uint32Array(256).map((_, j) => fn(sbox2[j]));
        const T1 = T0.map(rotl32_8);
        const T2 = T1.map(rotl32_8);
        const T3 = T2.map(rotl32_8);
        const T01 = new Uint32Array(256 * 256);
        const T23 = new Uint32Array(256 * 256);
        const sbox22 = new Uint16Array(256 * 256);
        for (let i = 0; i < 256; i++) {
          for (let j = 0; j < 256; j++) {
            const idx = i * 256 + j;
            T01[idx] = T0[i] ^ T1[j];
            T23[idx] = T2[i] ^ T3[j];
            sbox22[idx] = sbox2[i] << 8 | sbox2[j];
          }
        }
        return { sbox: sbox2, sbox2: sbox22, T0, T1, T2, T3, T01, T23 };
      }
      var tableEncoding = /* @__PURE__ */ genTtable(sbox, (s) => mul(s, 3) << 24 | s << 16 | s << 8 | mul(s, 2));
      var tableDecoding = /* @__PURE__ */ genTtable(invSbox, (s) => mul(s, 11) << 24 | mul(s, 13) << 16 | mul(s, 9) << 8 | mul(s, 14));
      var xPowers = /* @__PURE__ */ (() => {
        const p = new Uint8Array(16);
        for (let i = 0, x = 1; i < 16; i++, x = mul2(x))
          p[i] = x;
        return p;
      })();
      function expandKeyLE(key) {
        (0, utils_ts_1.abytes)(key);
        const len = key.length;
        if (![16, 24, 32].includes(len))
          throw new Error("aes: invalid key size, should be 16, 24 or 32, got " + len);
        const { sbox2 } = tableEncoding;
        const toClean = [];
        if (!(0, utils_ts_1.isAligned32)(key))
          toClean.push(key = (0, utils_ts_1.copyBytes)(key));
        const k32 = (0, utils_ts_1.u32)(key);
        const Nk = k32.length;
        const subByte = (n) => applySbox(sbox2, n, n, n, n);
        const xk = new Uint32Array(len + 28);
        xk.set(k32);
        for (let i = Nk; i < xk.length; i++) {
          let t = xk[i - 1];
          if (i % Nk === 0)
            t = subByte(rotr32_8(t)) ^ xPowers[i / Nk - 1];
          else if (Nk > 6 && i % Nk === 4)
            t = subByte(t);
          xk[i] = xk[i - Nk] ^ t;
        }
        (0, utils_ts_1.clean)(...toClean);
        return xk;
      }
      function expandKeyDecLE(key) {
        const encKey = expandKeyLE(key);
        const xk = encKey.slice();
        const Nk = encKey.length;
        const { sbox2 } = tableEncoding;
        const { T0, T1, T2, T3 } = tableDecoding;
        for (let i = 0; i < Nk; i += 4) {
          for (let j = 0; j < 4; j++)
            xk[i + j] = encKey[Nk - i - 4 + j];
        }
        (0, utils_ts_1.clean)(encKey);
        for (let i = 4; i < Nk - 4; i++) {
          const x = xk[i];
          const w = applySbox(sbox2, x, x, x, x);
          xk[i] = T0[w & 255] ^ T1[w >>> 8 & 255] ^ T2[w >>> 16 & 255] ^ T3[w >>> 24];
        }
        return xk;
      }
      function apply0123(T01, T23, s0, s1, s2, s3) {
        return T01[s0 << 8 & 65280 | s1 >>> 8 & 255] ^ T23[s2 >>> 8 & 65280 | s3 >>> 24 & 255];
      }
      function applySbox(sbox2, s0, s1, s2, s3) {
        return sbox2[s0 & 255 | s1 & 65280] | sbox2[s2 >>> 16 & 255 | s3 >>> 16 & 65280] << 16;
      }
      function encrypt(xk, s0, s1, s2, s3) {
        const { sbox2, T01, T23 } = tableEncoding;
        let k = 0;
        s0 ^= xk[k++], s1 ^= xk[k++], s2 ^= xk[k++], s3 ^= xk[k++];
        const rounds = xk.length / 4 - 2;
        for (let i = 0; i < rounds; i++) {
          const t02 = xk[k++] ^ apply0123(T01, T23, s0, s1, s2, s3);
          const t12 = xk[k++] ^ apply0123(T01, T23, s1, s2, s3, s0);
          const t22 = xk[k++] ^ apply0123(T01, T23, s2, s3, s0, s1);
          const t32 = xk[k++] ^ apply0123(T01, T23, s3, s0, s1, s2);
          s0 = t02, s1 = t12, s2 = t22, s3 = t32;
        }
        const t0 = xk[k++] ^ applySbox(sbox2, s0, s1, s2, s3);
        const t1 = xk[k++] ^ applySbox(sbox2, s1, s2, s3, s0);
        const t2 = xk[k++] ^ applySbox(sbox2, s2, s3, s0, s1);
        const t3 = xk[k++] ^ applySbox(sbox2, s3, s0, s1, s2);
        return { s0: t0, s1: t1, s2: t2, s3: t3 };
      }
      function decrypt(xk, s0, s1, s2, s3) {
        const { sbox2, T01, T23 } = tableDecoding;
        let k = 0;
        s0 ^= xk[k++], s1 ^= xk[k++], s2 ^= xk[k++], s3 ^= xk[k++];
        const rounds = xk.length / 4 - 2;
        for (let i = 0; i < rounds; i++) {
          const t02 = xk[k++] ^ apply0123(T01, T23, s0, s3, s2, s1);
          const t12 = xk[k++] ^ apply0123(T01, T23, s1, s0, s3, s2);
          const t22 = xk[k++] ^ apply0123(T01, T23, s2, s1, s0, s3);
          const t32 = xk[k++] ^ apply0123(T01, T23, s3, s2, s1, s0);
          s0 = t02, s1 = t12, s2 = t22, s3 = t32;
        }
        const t0 = xk[k++] ^ applySbox(sbox2, s0, s3, s2, s1);
        const t1 = xk[k++] ^ applySbox(sbox2, s1, s0, s3, s2);
        const t2 = xk[k++] ^ applySbox(sbox2, s2, s1, s0, s3);
        const t3 = xk[k++] ^ applySbox(sbox2, s3, s2, s1, s0);
        return { s0: t0, s1: t1, s2: t2, s3: t3 };
      }
      function ctrCounter(xk, nonce, src, dst) {
        (0, utils_ts_1.abytes)(nonce, BLOCK_SIZE);
        (0, utils_ts_1.abytes)(src);
        const srcLen = src.length;
        dst = (0, utils_ts_1.getOutput)(srcLen, dst);
        (0, utils_ts_1.complexOverlapBytes)(src, dst);
        const ctr = nonce;
        const c32 = (0, utils_ts_1.u32)(ctr);
        let { s0, s1, s2, s3 } = encrypt(xk, c32[0], c32[1], c32[2], c32[3]);
        const src32 = (0, utils_ts_1.u32)(src);
        const dst32 = (0, utils_ts_1.u32)(dst);
        for (let i = 0; i + 4 <= src32.length; i += 4) {
          dst32[i + 0] = src32[i + 0] ^ s0;
          dst32[i + 1] = src32[i + 1] ^ s1;
          dst32[i + 2] = src32[i + 2] ^ s2;
          dst32[i + 3] = src32[i + 3] ^ s3;
          let carry = 1;
          for (let i2 = ctr.length - 1; i2 >= 0; i2--) {
            carry = carry + (ctr[i2] & 255) | 0;
            ctr[i2] = carry & 255;
            carry >>>= 8;
          }
          ({ s0, s1, s2, s3 } = encrypt(xk, c32[0], c32[1], c32[2], c32[3]));
        }
        const start = BLOCK_SIZE * Math.floor(src32.length / BLOCK_SIZE32);
        if (start < srcLen) {
          const b32 = new Uint32Array([s0, s1, s2, s3]);
          const buf = (0, utils_ts_1.u8)(b32);
          for (let i = start, pos = 0; i < srcLen; i++, pos++)
            dst[i] = src[i] ^ buf[pos];
          (0, utils_ts_1.clean)(b32);
        }
        return dst;
      }
      function ctr32(xk, isLE, nonce, src, dst) {
        (0, utils_ts_1.abytes)(nonce, BLOCK_SIZE);
        (0, utils_ts_1.abytes)(src);
        dst = (0, utils_ts_1.getOutput)(src.length, dst);
        const ctr = nonce;
        const c32 = (0, utils_ts_1.u32)(ctr);
        const view = (0, utils_ts_1.createView)(ctr);
        const src32 = (0, utils_ts_1.u32)(src);
        const dst32 = (0, utils_ts_1.u32)(dst);
        const ctrPos = isLE ? 0 : 12;
        const srcLen = src.length;
        let ctrNum = view.getUint32(ctrPos, isLE);
        let { s0, s1, s2, s3 } = encrypt(xk, c32[0], c32[1], c32[2], c32[3]);
        for (let i = 0; i + 4 <= src32.length; i += 4) {
          dst32[i + 0] = src32[i + 0] ^ s0;
          dst32[i + 1] = src32[i + 1] ^ s1;
          dst32[i + 2] = src32[i + 2] ^ s2;
          dst32[i + 3] = src32[i + 3] ^ s3;
          ctrNum = ctrNum + 1 >>> 0;
          view.setUint32(ctrPos, ctrNum, isLE);
          ({ s0, s1, s2, s3 } = encrypt(xk, c32[0], c32[1], c32[2], c32[3]));
        }
        const start = BLOCK_SIZE * Math.floor(src32.length / BLOCK_SIZE32);
        if (start < srcLen) {
          const b32 = new Uint32Array([s0, s1, s2, s3]);
          const buf = (0, utils_ts_1.u8)(b32);
          for (let i = start, pos = 0; i < srcLen; i++, pos++)
            dst[i] = src[i] ^ buf[pos];
          (0, utils_ts_1.clean)(b32);
        }
        return dst;
      }
      exports.ctr = (0, utils_ts_1.wrapCipher)({ blockSize: 16, nonceLength: 16 }, function aesctr(key, nonce) {
        function processCtr(buf, dst) {
          (0, utils_ts_1.abytes)(buf);
          if (dst !== void 0) {
            (0, utils_ts_1.abytes)(dst);
            if (!(0, utils_ts_1.isAligned32)(dst))
              throw new Error("unaligned destination");
          }
          const xk = expandKeyLE(key);
          const n = (0, utils_ts_1.copyBytes)(nonce);
          const toClean = [xk, n];
          if (!(0, utils_ts_1.isAligned32)(buf))
            toClean.push(buf = (0, utils_ts_1.copyBytes)(buf));
          const out = ctrCounter(xk, n, buf, dst);
          (0, utils_ts_1.clean)(...toClean);
          return out;
        }
        return {
          encrypt: (plaintext, dst) => processCtr(plaintext, dst),
          decrypt: (ciphertext, dst) => processCtr(ciphertext, dst)
        };
      });
      function validateBlockDecrypt(data) {
        (0, utils_ts_1.abytes)(data);
        if (data.length % BLOCK_SIZE !== 0) {
          throw new Error("aes-(cbc/ecb).decrypt ciphertext should consist of blocks with size " + BLOCK_SIZE);
        }
      }
      function validateBlockEncrypt(plaintext, pcks5, dst) {
        (0, utils_ts_1.abytes)(plaintext);
        let outLen = plaintext.length;
        const remaining = outLen % BLOCK_SIZE;
        if (!pcks5 && remaining !== 0)
          throw new Error("aec/(cbc-ecb): unpadded plaintext with disabled padding");
        if (!(0, utils_ts_1.isAligned32)(plaintext))
          plaintext = (0, utils_ts_1.copyBytes)(plaintext);
        const b = (0, utils_ts_1.u32)(plaintext);
        if (pcks5) {
          let left = BLOCK_SIZE - remaining;
          if (!left)
            left = BLOCK_SIZE;
          outLen = outLen + left;
        }
        dst = (0, utils_ts_1.getOutput)(outLen, dst);
        (0, utils_ts_1.complexOverlapBytes)(plaintext, dst);
        const o = (0, utils_ts_1.u32)(dst);
        return { b, o, out: dst };
      }
      function validatePCKS(data, pcks5) {
        if (!pcks5)
          return data;
        const len = data.length;
        if (!len)
          throw new Error("aes/pcks5: empty ciphertext not allowed");
        const lastByte = data[len - 1];
        if (lastByte <= 0 || lastByte > 16)
          throw new Error("aes/pcks5: wrong padding");
        const out = data.subarray(0, -lastByte);
        for (let i = 0; i < lastByte; i++)
          if (data[len - i - 1] !== lastByte)
            throw new Error("aes/pcks5: wrong padding");
        return out;
      }
      function padPCKS(left) {
        const tmp = new Uint8Array(16);
        const tmp32 = (0, utils_ts_1.u32)(tmp);
        tmp.set(left);
        const paddingByte = BLOCK_SIZE - left.length;
        for (let i = BLOCK_SIZE - paddingByte; i < BLOCK_SIZE; i++)
          tmp[i] = paddingByte;
        return tmp32;
      }
      exports.ecb = (0, utils_ts_1.wrapCipher)({ blockSize: 16 }, function aesecb(key, opts = {}) {
        const pcks5 = !opts.disablePadding;
        return {
          encrypt(plaintext, dst) {
            const { b, o, out: _out } = validateBlockEncrypt(plaintext, pcks5, dst);
            const xk = expandKeyLE(key);
            let i = 0;
            for (; i + 4 <= b.length; ) {
              const { s0, s1, s2, s3 } = encrypt(xk, b[i + 0], b[i + 1], b[i + 2], b[i + 3]);
              o[i++] = s0, o[i++] = s1, o[i++] = s2, o[i++] = s3;
            }
            if (pcks5) {
              const tmp32 = padPCKS(plaintext.subarray(i * 4));
              const { s0, s1, s2, s3 } = encrypt(xk, tmp32[0], tmp32[1], tmp32[2], tmp32[3]);
              o[i++] = s0, o[i++] = s1, o[i++] = s2, o[i++] = s3;
            }
            (0, utils_ts_1.clean)(xk);
            return _out;
          },
          decrypt(ciphertext, dst) {
            validateBlockDecrypt(ciphertext);
            const xk = expandKeyDecLE(key);
            dst = (0, utils_ts_1.getOutput)(ciphertext.length, dst);
            const toClean = [xk];
            if (!(0, utils_ts_1.isAligned32)(ciphertext))
              toClean.push(ciphertext = (0, utils_ts_1.copyBytes)(ciphertext));
            (0, utils_ts_1.complexOverlapBytes)(ciphertext, dst);
            const b = (0, utils_ts_1.u32)(ciphertext);
            const o = (0, utils_ts_1.u32)(dst);
            for (let i = 0; i + 4 <= b.length; ) {
              const { s0, s1, s2, s3 } = decrypt(xk, b[i + 0], b[i + 1], b[i + 2], b[i + 3]);
              o[i++] = s0, o[i++] = s1, o[i++] = s2, o[i++] = s3;
            }
            (0, utils_ts_1.clean)(...toClean);
            return validatePCKS(dst, pcks5);
          }
        };
      });
      exports.cbc = (0, utils_ts_1.wrapCipher)({ blockSize: 16, nonceLength: 16 }, function aescbc(key, iv, opts = {}) {
        const pcks5 = !opts.disablePadding;
        return {
          encrypt(plaintext, dst) {
            const xk = expandKeyLE(key);
            const { b, o, out: _out } = validateBlockEncrypt(plaintext, pcks5, dst);
            let _iv = iv;
            const toClean = [xk];
            if (!(0, utils_ts_1.isAligned32)(_iv))
              toClean.push(_iv = (0, utils_ts_1.copyBytes)(_iv));
            const n32 = (0, utils_ts_1.u32)(_iv);
            let s0 = n32[0], s1 = n32[1], s2 = n32[2], s3 = n32[3];
            let i = 0;
            for (; i + 4 <= b.length; ) {
              s0 ^= b[i + 0], s1 ^= b[i + 1], s2 ^= b[i + 2], s3 ^= b[i + 3];
              ({ s0, s1, s2, s3 } = encrypt(xk, s0, s1, s2, s3));
              o[i++] = s0, o[i++] = s1, o[i++] = s2, o[i++] = s3;
            }
            if (pcks5) {
              const tmp32 = padPCKS(plaintext.subarray(i * 4));
              s0 ^= tmp32[0], s1 ^= tmp32[1], s2 ^= tmp32[2], s3 ^= tmp32[3];
              ({ s0, s1, s2, s3 } = encrypt(xk, s0, s1, s2, s3));
              o[i++] = s0, o[i++] = s1, o[i++] = s2, o[i++] = s3;
            }
            (0, utils_ts_1.clean)(...toClean);
            return _out;
          },
          decrypt(ciphertext, dst) {
            validateBlockDecrypt(ciphertext);
            const xk = expandKeyDecLE(key);
            let _iv = iv;
            const toClean = [xk];
            if (!(0, utils_ts_1.isAligned32)(_iv))
              toClean.push(_iv = (0, utils_ts_1.copyBytes)(_iv));
            const n32 = (0, utils_ts_1.u32)(_iv);
            dst = (0, utils_ts_1.getOutput)(ciphertext.length, dst);
            if (!(0, utils_ts_1.isAligned32)(ciphertext))
              toClean.push(ciphertext = (0, utils_ts_1.copyBytes)(ciphertext));
            (0, utils_ts_1.complexOverlapBytes)(ciphertext, dst);
            const b = (0, utils_ts_1.u32)(ciphertext);
            const o = (0, utils_ts_1.u32)(dst);
            let s0 = n32[0], s1 = n32[1], s2 = n32[2], s3 = n32[3];
            for (let i = 0; i + 4 <= b.length; ) {
              const ps0 = s0, ps1 = s1, ps2 = s2, ps3 = s3;
              s0 = b[i + 0], s1 = b[i + 1], s2 = b[i + 2], s3 = b[i + 3];
              const { s0: o0, s1: o1, s2: o2, s3: o3 } = decrypt(xk, s0, s1, s2, s3);
              o[i++] = o0 ^ ps0, o[i++] = o1 ^ ps1, o[i++] = o2 ^ ps2, o[i++] = o3 ^ ps3;
            }
            (0, utils_ts_1.clean)(...toClean);
            return validatePCKS(dst, pcks5);
          }
        };
      });
      exports.cfb = (0, utils_ts_1.wrapCipher)({ blockSize: 16, nonceLength: 16 }, function aescfb(key, iv) {
        function processCfb(src, isEncrypt, dst) {
          (0, utils_ts_1.abytes)(src);
          const srcLen = src.length;
          dst = (0, utils_ts_1.getOutput)(srcLen, dst);
          if ((0, utils_ts_1.overlapBytes)(src, dst))
            throw new Error("overlapping src and dst not supported.");
          const xk = expandKeyLE(key);
          let _iv = iv;
          const toClean = [xk];
          if (!(0, utils_ts_1.isAligned32)(_iv))
            toClean.push(_iv = (0, utils_ts_1.copyBytes)(_iv));
          if (!(0, utils_ts_1.isAligned32)(src))
            toClean.push(src = (0, utils_ts_1.copyBytes)(src));
          const src32 = (0, utils_ts_1.u32)(src);
          const dst32 = (0, utils_ts_1.u32)(dst);
          const next32 = isEncrypt ? dst32 : src32;
          const n32 = (0, utils_ts_1.u32)(_iv);
          let s0 = n32[0], s1 = n32[1], s2 = n32[2], s3 = n32[3];
          for (let i = 0; i + 4 <= src32.length; ) {
            const { s0: e0, s1: e1, s2: e2, s3: e3 } = encrypt(xk, s0, s1, s2, s3);
            dst32[i + 0] = src32[i + 0] ^ e0;
            dst32[i + 1] = src32[i + 1] ^ e1;
            dst32[i + 2] = src32[i + 2] ^ e2;
            dst32[i + 3] = src32[i + 3] ^ e3;
            s0 = next32[i++], s1 = next32[i++], s2 = next32[i++], s3 = next32[i++];
          }
          const start = BLOCK_SIZE * Math.floor(src32.length / BLOCK_SIZE32);
          if (start < srcLen) {
            ({ s0, s1, s2, s3 } = encrypt(xk, s0, s1, s2, s3));
            const buf = (0, utils_ts_1.u8)(new Uint32Array([s0, s1, s2, s3]));
            for (let i = start, pos = 0; i < srcLen; i++, pos++)
              dst[i] = src[i] ^ buf[pos];
            (0, utils_ts_1.clean)(buf);
          }
          (0, utils_ts_1.clean)(...toClean);
          return dst;
        }
        return {
          encrypt: (plaintext, dst) => processCfb(plaintext, true, dst),
          decrypt: (ciphertext, dst) => processCfb(ciphertext, false, dst)
        };
      });
      function computeTag(fn, isLE, key, data, AAD) {
        const aadLength = AAD ? AAD.length : 0;
        const h = fn.create(key, data.length + aadLength);
        if (AAD)
          h.update(AAD);
        const num = (0, utils_ts_1.u64Lengths)(8 * data.length, 8 * aadLength, isLE);
        h.update(data);
        h.update(num);
        const res = h.digest();
        (0, utils_ts_1.clean)(num);
        return res;
      }
      exports.gcm = (0, utils_ts_1.wrapCipher)({ blockSize: 16, nonceLength: 12, tagLength: 16, varSizeNonce: true }, function aesgcm(key, nonce, AAD) {
        if (nonce.length < 8)
          throw new Error("aes/gcm: invalid nonce length");
        const tagLength = 16;
        function _computeTag(authKey, tagMask, data) {
          const tag = computeTag(_polyval_ts_1.ghash, false, authKey, data, AAD);
          for (let i = 0; i < tagMask.length; i++)
            tag[i] ^= tagMask[i];
          return tag;
        }
        function deriveKeys() {
          const xk = expandKeyLE(key);
          const authKey = EMPTY_BLOCK.slice();
          const counter = EMPTY_BLOCK.slice();
          ctr32(xk, false, counter, counter, authKey);
          if (nonce.length === 12) {
            counter.set(nonce);
          } else {
            const nonceLen = EMPTY_BLOCK.slice();
            const view = (0, utils_ts_1.createView)(nonceLen);
            (0, utils_ts_1.setBigUint64)(view, 8, BigInt(nonce.length * 8), false);
            const g = _polyval_ts_1.ghash.create(authKey).update(nonce).update(nonceLen);
            g.digestInto(counter);
            g.destroy();
          }
          const tagMask = ctr32(xk, false, counter, EMPTY_BLOCK);
          return { xk, authKey, counter, tagMask };
        }
        return {
          encrypt(plaintext) {
            const { xk, authKey, counter, tagMask } = deriveKeys();
            const out = new Uint8Array(plaintext.length + tagLength);
            const toClean = [xk, authKey, counter, tagMask];
            if (!(0, utils_ts_1.isAligned32)(plaintext))
              toClean.push(plaintext = (0, utils_ts_1.copyBytes)(plaintext));
            ctr32(xk, false, counter, plaintext, out.subarray(0, plaintext.length));
            const tag = _computeTag(authKey, tagMask, out.subarray(0, out.length - tagLength));
            toClean.push(tag);
            out.set(tag, plaintext.length);
            (0, utils_ts_1.clean)(...toClean);
            return out;
          },
          decrypt(ciphertext) {
            const { xk, authKey, counter, tagMask } = deriveKeys();
            const toClean = [xk, authKey, tagMask, counter];
            if (!(0, utils_ts_1.isAligned32)(ciphertext))
              toClean.push(ciphertext = (0, utils_ts_1.copyBytes)(ciphertext));
            const data = ciphertext.subarray(0, -tagLength);
            const passedTag = ciphertext.subarray(-tagLength);
            const tag = _computeTag(authKey, tagMask, data);
            toClean.push(tag);
            if (!(0, utils_ts_1.equalBytes)(tag, passedTag))
              throw new Error("aes/gcm: invalid ghash tag");
            const out = ctr32(xk, false, counter, data);
            (0, utils_ts_1.clean)(...toClean);
            return out;
          }
        };
      });
      var limit = (name, min, max) => (value) => {
        if (!Number.isSafeInteger(value) || min > value || value > max) {
          const minmax = "[" + min + ".." + max + "]";
          throw new Error("" + name + ": expected value in range " + minmax + ", got " + value);
        }
      };
      exports.gcmsiv = (0, utils_ts_1.wrapCipher)({ blockSize: 16, nonceLength: 12, tagLength: 16, varSizeNonce: true }, function aessiv(key, nonce, AAD) {
        const tagLength = 16;
        const AAD_LIMIT = limit("AAD", 0, 2 ** 36);
        const PLAIN_LIMIT = limit("plaintext", 0, 2 ** 36);
        const NONCE_LIMIT = limit("nonce", 12, 12);
        const CIPHER_LIMIT = limit("ciphertext", 16, 2 ** 36 + 16);
        (0, utils_ts_1.abytes)(key, 16, 24, 32);
        NONCE_LIMIT(nonce.length);
        if (AAD !== void 0)
          AAD_LIMIT(AAD.length);
        function deriveKeys() {
          const xk = expandKeyLE(key);
          const encKey = new Uint8Array(key.length);
          const authKey = new Uint8Array(16);
          const toClean = [xk, encKey];
          let _nonce = nonce;
          if (!(0, utils_ts_1.isAligned32)(_nonce))
            toClean.push(_nonce = (0, utils_ts_1.copyBytes)(_nonce));
          const n32 = (0, utils_ts_1.u32)(_nonce);
          let s0 = 0, s1 = n32[0], s2 = n32[1], s3 = n32[2];
          let counter = 0;
          for (const derivedKey of [authKey, encKey].map(utils_ts_1.u32)) {
            const d32 = (0, utils_ts_1.u32)(derivedKey);
            for (let i = 0; i < d32.length; i += 2) {
              const { s0: o0, s1: o1 } = encrypt(xk, s0, s1, s2, s3);
              d32[i + 0] = o0;
              d32[i + 1] = o1;
              s0 = ++counter;
            }
          }
          const res = { authKey, encKey: expandKeyLE(encKey) };
          (0, utils_ts_1.clean)(...toClean);
          return res;
        }
        function _computeTag(encKey, authKey, data) {
          const tag = computeTag(_polyval_ts_1.polyval, true, authKey, data, AAD);
          for (let i = 0; i < 12; i++)
            tag[i] ^= nonce[i];
          tag[15] &= 127;
          const t32 = (0, utils_ts_1.u32)(tag);
          let s0 = t32[0], s1 = t32[1], s2 = t32[2], s3 = t32[3];
          ({ s0, s1, s2, s3 } = encrypt(encKey, s0, s1, s2, s3));
          t32[0] = s0, t32[1] = s1, t32[2] = s2, t32[3] = s3;
          return tag;
        }
        function processSiv(encKey, tag, input) {
          let block = (0, utils_ts_1.copyBytes)(tag);
          block[15] |= 128;
          const res = ctr32(encKey, true, block, input);
          (0, utils_ts_1.clean)(block);
          return res;
        }
        return {
          encrypt(plaintext) {
            PLAIN_LIMIT(plaintext.length);
            const { encKey, authKey } = deriveKeys();
            const tag = _computeTag(encKey, authKey, plaintext);
            const toClean = [encKey, authKey, tag];
            if (!(0, utils_ts_1.isAligned32)(plaintext))
              toClean.push(plaintext = (0, utils_ts_1.copyBytes)(plaintext));
            const out = new Uint8Array(plaintext.length + tagLength);
            out.set(tag, plaintext.length);
            out.set(processSiv(encKey, tag, plaintext));
            (0, utils_ts_1.clean)(...toClean);
            return out;
          },
          decrypt(ciphertext) {
            CIPHER_LIMIT(ciphertext.length);
            const tag = ciphertext.subarray(-tagLength);
            const { encKey, authKey } = deriveKeys();
            const toClean = [encKey, authKey];
            if (!(0, utils_ts_1.isAligned32)(ciphertext))
              toClean.push(ciphertext = (0, utils_ts_1.copyBytes)(ciphertext));
            const plaintext = processSiv(encKey, tag, ciphertext.subarray(0, -tagLength));
            const expectedTag = _computeTag(encKey, authKey, plaintext);
            toClean.push(expectedTag);
            if (!(0, utils_ts_1.equalBytes)(tag, expectedTag)) {
              (0, utils_ts_1.clean)(...toClean);
              throw new Error("invalid polyval tag");
            }
            (0, utils_ts_1.clean)(...toClean);
            return plaintext;
          }
        };
      });
      exports.siv = exports.gcmsiv;
      function isBytes32(a) {
        return a instanceof Uint32Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint32Array";
      }
      function encryptBlock(xk, block) {
        (0, utils_ts_1.abytes)(block, 16);
        if (!isBytes32(xk))
          throw new Error("_encryptBlock accepts result of expandKeyLE");
        const b32 = (0, utils_ts_1.u32)(block);
        let { s0, s1, s2, s3 } = encrypt(xk, b32[0], b32[1], b32[2], b32[3]);
        b32[0] = s0, b32[1] = s1, b32[2] = s2, b32[3] = s3;
        return block;
      }
      function decryptBlock(xk, block) {
        (0, utils_ts_1.abytes)(block, 16);
        if (!isBytes32(xk))
          throw new Error("_decryptBlock accepts result of expandKeyLE");
        const b32 = (0, utils_ts_1.u32)(block);
        let { s0, s1, s2, s3 } = decrypt(xk, b32[0], b32[1], b32[2], b32[3]);
        b32[0] = s0, b32[1] = s1, b32[2] = s2, b32[3] = s3;
        return block;
      }
      var AESW = {
        /*
        High-level pseudocode:
        ```
        A: u64 = IV
        out = []
        for (let i=0, ctr = 0; i<6; i++) {
          for (const chunk of chunks(plaintext, 8)) {
            A ^= swapEndianess(ctr++)
            [A, res] = chunks(encrypt(A || chunk), 8);
            out ||= res
          }
        }
        out = A || out
        ```
        Decrypt is the same, but reversed.
        */
        encrypt(kek, out) {
          if (out.length >= 2 ** 32)
            throw new Error("plaintext should be less than 4gb");
          const xk = expandKeyLE(kek);
          if (out.length === 16)
            encryptBlock(xk, out);
          else {
            const o32 = (0, utils_ts_1.u32)(out);
            let a0 = o32[0], a1 = o32[1];
            for (let j = 0, ctr = 1; j < 6; j++) {
              for (let pos = 2; pos < o32.length; pos += 2, ctr++) {
                const { s0, s1, s2, s3 } = encrypt(xk, a0, a1, o32[pos], o32[pos + 1]);
                a0 = s0, a1 = s1 ^ byteSwap(ctr), o32[pos] = s2, o32[pos + 1] = s3;
              }
            }
            o32[0] = a0, o32[1] = a1;
          }
          xk.fill(0);
        },
        decrypt(kek, out) {
          if (out.length - 8 >= 2 ** 32)
            throw new Error("ciphertext should be less than 4gb");
          const xk = expandKeyDecLE(kek);
          const chunks = out.length / 8 - 1;
          if (chunks === 1)
            decryptBlock(xk, out);
          else {
            const o32 = (0, utils_ts_1.u32)(out);
            let a0 = o32[0], a1 = o32[1];
            for (let j = 0, ctr = chunks * 6; j < 6; j++) {
              for (let pos = chunks * 2; pos >= 1; pos -= 2, ctr--) {
                a1 ^= byteSwap(ctr);
                const { s0, s1, s2, s3 } = decrypt(xk, a0, a1, o32[pos], o32[pos + 1]);
                a0 = s0, a1 = s1, o32[pos] = s2, o32[pos + 1] = s3;
              }
            }
            o32[0] = a0, o32[1] = a1;
          }
          xk.fill(0);
        }
      };
      var AESKW_IV = /* @__PURE__ */ new Uint8Array(8).fill(166);
      exports.aeskw = (0, utils_ts_1.wrapCipher)({ blockSize: 8 }, (kek) => ({
        encrypt(plaintext) {
          if (!plaintext.length || plaintext.length % 8 !== 0)
            throw new Error("invalid plaintext length");
          if (plaintext.length === 8)
            throw new Error("8-byte keys not allowed in AESKW, use AESKWP instead");
          const out = (0, utils_ts_1.concatBytes)(AESKW_IV, plaintext);
          AESW.encrypt(kek, out);
          return out;
        },
        decrypt(ciphertext) {
          if (ciphertext.length % 8 !== 0 || ciphertext.length < 3 * 8)
            throw new Error("invalid ciphertext length");
          const out = (0, utils_ts_1.copyBytes)(ciphertext);
          AESW.decrypt(kek, out);
          if (!(0, utils_ts_1.equalBytes)(out.subarray(0, 8), AESKW_IV))
            throw new Error("integrity check failed");
          out.subarray(0, 8).fill(0);
          return out.subarray(8);
        }
      }));
      var AESKWP_IV = 2790873510;
      exports.aeskwp = (0, utils_ts_1.wrapCipher)({ blockSize: 8 }, (kek) => ({
        encrypt(plaintext) {
          if (!plaintext.length)
            throw new Error("invalid plaintext length");
          const padded = Math.ceil(plaintext.length / 8) * 8;
          const out = new Uint8Array(8 + padded);
          out.set(plaintext, 8);
          const out32 = (0, utils_ts_1.u32)(out);
          out32[0] = AESKWP_IV;
          out32[1] = byteSwap(plaintext.length);
          AESW.encrypt(kek, out);
          return out;
        },
        decrypt(ciphertext) {
          if (ciphertext.length < 16)
            throw new Error("invalid ciphertext length");
          const out = (0, utils_ts_1.copyBytes)(ciphertext);
          const o32 = (0, utils_ts_1.u32)(out);
          AESW.decrypt(kek, out);
          const len = byteSwap(o32[1]) >>> 0;
          const padded = Math.ceil(len / 8) * 8;
          if (o32[0] !== AESKWP_IV || out.length - 8 !== padded)
            throw new Error("integrity check failed");
          for (let i = len; i < padded; i++)
            if (out[8 + i] !== 0)
              throw new Error("integrity check failed");
          out.subarray(0, 8).fill(0);
          return out.subarray(8, 8 + len);
        }
      }));
      exports.unsafe = {
        expandKeyLE,
        expandKeyDecLE,
        encrypt,
        decrypt,
        encryptBlock,
        decryptBlock,
        ctrCounter,
        ctr32
      };
    }
  });

  // node_modules/@noble/ciphers/crypto.js
  var require_crypto2 = __commonJS({
    "node_modules/@noble/ciphers/crypto.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.crypto = void 0;
      exports.crypto = typeof globalThis === "object" && "crypto" in globalThis ? globalThis.crypto : void 0;
    }
  });

  // node_modules/@noble/ciphers/webcrypto.js
  var require_webcrypto = __commonJS({
    "node_modules/@noble/ciphers/webcrypto.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.gcm = exports.ctr = exports.cbc = exports.utils = void 0;
      exports.randomBytes = randomBytes;
      exports.getWebcryptoSubtle = getWebcryptoSubtle;
      exports.managedNonce = managedNonce;
      var crypto_1 = require_crypto2();
      var utils_ts_1 = require_utils3();
      function randomBytes(bytesLength = 32) {
        if (crypto_1.crypto && typeof crypto_1.crypto.getRandomValues === "function") {
          return crypto_1.crypto.getRandomValues(new Uint8Array(bytesLength));
        }
        if (crypto_1.crypto && typeof crypto_1.crypto.randomBytes === "function") {
          return Uint8Array.from(crypto_1.crypto.randomBytes(bytesLength));
        }
        throw new Error("crypto.getRandomValues must be defined");
      }
      function getWebcryptoSubtle() {
        if (crypto_1.crypto && typeof crypto_1.crypto.subtle === "object" && crypto_1.crypto.subtle != null)
          return crypto_1.crypto.subtle;
        throw new Error("crypto.subtle must be defined");
      }
      function managedNonce(fn) {
        const { nonceLength } = fn;
        (0, utils_ts_1.anumber)(nonceLength);
        return (key, ...args) => ({
          encrypt(plaintext, ...argsEnc) {
            const nonce = randomBytes(nonceLength);
            const ciphertext = fn(key, nonce, ...args).encrypt(plaintext, ...argsEnc);
            const out = (0, utils_ts_1.concatBytes)(nonce, ciphertext);
            ciphertext.fill(0);
            return out;
          },
          decrypt(ciphertext, ...argsDec) {
            const nonce = ciphertext.subarray(0, nonceLength);
            const data = ciphertext.subarray(nonceLength);
            return fn(key, nonce, ...args).decrypt(data, ...argsDec);
          }
        });
      }
      exports.utils = {
        async encrypt(key, keyParams, cryptParams, plaintext) {
          const cr = getWebcryptoSubtle();
          const iKey = await cr.importKey("raw", key, keyParams, true, ["encrypt"]);
          const ciphertext = await cr.encrypt(cryptParams, iKey, plaintext);
          return new Uint8Array(ciphertext);
        },
        async decrypt(key, keyParams, cryptParams, ciphertext) {
          const cr = getWebcryptoSubtle();
          const iKey = await cr.importKey("raw", key, keyParams, true, ["decrypt"]);
          const plaintext = await cr.decrypt(cryptParams, iKey, ciphertext);
          return new Uint8Array(plaintext);
        }
      };
      var mode = {
        CBC: "AES-CBC",
        CTR: "AES-CTR",
        GCM: "AES-GCM"
      };
      function getCryptParams(algo, nonce, AAD) {
        if (algo === mode.CBC)
          return { name: mode.CBC, iv: nonce };
        if (algo === mode.CTR)
          return { name: mode.CTR, counter: nonce, length: 64 };
        if (algo === mode.GCM) {
          if (AAD)
            return { name: mode.GCM, iv: nonce, additionalData: AAD };
          else
            return { name: mode.GCM, iv: nonce };
        }
        throw new Error("unknown aes block mode");
      }
      function generate(algo) {
        return (key, nonce, AAD) => {
          (0, utils_ts_1.abytes)(key);
          (0, utils_ts_1.abytes)(nonce);
          const keyParams = { name: algo, length: key.length * 8 };
          const cryptParams = getCryptParams(algo, nonce, AAD);
          let consumed = false;
          return {
            // keyLength,
            encrypt(plaintext) {
              (0, utils_ts_1.abytes)(plaintext);
              if (consumed)
                throw new Error("Cannot encrypt() twice with same key / nonce");
              consumed = true;
              return exports.utils.encrypt(key, keyParams, cryptParams, plaintext);
            },
            decrypt(ciphertext) {
              (0, utils_ts_1.abytes)(ciphertext);
              return exports.utils.decrypt(key, keyParams, cryptParams, ciphertext);
            }
          };
        };
      }
      exports.cbc = (() => generate(mode.CBC))();
      exports.ctr = (() => generate(mode.CTR))();
      exports.gcm = /* @__PURE__ */ (() => generate(mode.GCM))();
    }
  });

  // node_modules/@noble/hashes/hmac.js
  var require_hmac = __commonJS({
    "node_modules/@noble/hashes/hmac.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.hmac = exports.HMAC = void 0;
      var utils_ts_1 = require_utils();
      var HMAC = class extends utils_ts_1.Hash {
        constructor(hash, _key) {
          super();
          this.finished = false;
          this.destroyed = false;
          (0, utils_ts_1.ahash)(hash);
          const key = (0, utils_ts_1.toBytes)(_key);
          this.iHash = hash.create();
          if (typeof this.iHash.update !== "function")
            throw new Error("Expected instance of class which extends utils.Hash");
          this.blockLen = this.iHash.blockLen;
          this.outputLen = this.iHash.outputLen;
          const blockLen = this.blockLen;
          const pad = new Uint8Array(blockLen);
          pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
          for (let i = 0; i < pad.length; i++)
            pad[i] ^= 54;
          this.iHash.update(pad);
          this.oHash = hash.create();
          for (let i = 0; i < pad.length; i++)
            pad[i] ^= 54 ^ 92;
          this.oHash.update(pad);
          (0, utils_ts_1.clean)(pad);
        }
        update(buf) {
          (0, utils_ts_1.aexists)(this);
          this.iHash.update(buf);
          return this;
        }
        digestInto(out) {
          (0, utils_ts_1.aexists)(this);
          (0, utils_ts_1.abytes)(out, this.outputLen);
          this.finished = true;
          this.iHash.digestInto(out);
          this.oHash.update(out);
          this.oHash.digestInto(out);
          this.destroy();
        }
        digest() {
          const out = new Uint8Array(this.oHash.outputLen);
          this.digestInto(out);
          return out;
        }
        _cloneInto(to) {
          to || (to = Object.create(Object.getPrototypeOf(this), {}));
          const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
          to = to;
          to.finished = finished;
          to.destroyed = destroyed;
          to.blockLen = blockLen;
          to.outputLen = outputLen;
          to.oHash = oHash._cloneInto(to.oHash);
          to.iHash = iHash._cloneInto(to.iHash);
          return to;
        }
        clone() {
          return this._cloneInto();
        }
        destroy() {
          this.destroyed = true;
          this.oHash.destroy();
          this.iHash.destroy();
        }
      };
      exports.HMAC = HMAC;
      var hmac = (hash, key, message) => new HMAC(hash, key).update(message).digest();
      exports.hmac = hmac;
      exports.hmac.create = (hash, key) => new HMAC(hash, key);
    }
  });

  // node_modules/@noble/hashes/hkdf.js
  var require_hkdf = __commonJS({
    "node_modules/@noble/hashes/hkdf.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.hkdf = void 0;
      exports.extract = extract;
      exports.expand = expand;
      var hmac_ts_1 = require_hmac();
      var utils_ts_1 = require_utils();
      function extract(hash, ikm, salt) {
        (0, utils_ts_1.ahash)(hash);
        if (salt === void 0)
          salt = new Uint8Array(hash.outputLen);
        return (0, hmac_ts_1.hmac)(hash, (0, utils_ts_1.toBytes)(salt), (0, utils_ts_1.toBytes)(ikm));
      }
      var HKDF_COUNTER = /* @__PURE__ */ Uint8Array.from([0]);
      var EMPTY_BUFFER = /* @__PURE__ */ Uint8Array.of();
      function expand(hash, prk, info, length = 32) {
        (0, utils_ts_1.ahash)(hash);
        (0, utils_ts_1.anumber)(length);
        const olen = hash.outputLen;
        if (length > 255 * olen)
          throw new Error("Length should be <= 255*HashLen");
        const blocks = Math.ceil(length / olen);
        if (info === void 0)
          info = EMPTY_BUFFER;
        const okm = new Uint8Array(blocks * olen);
        const HMAC = hmac_ts_1.hmac.create(hash, prk);
        const HMACTmp = HMAC._cloneInto();
        const T = new Uint8Array(HMAC.outputLen);
        for (let counter = 0; counter < blocks; counter++) {
          HKDF_COUNTER[0] = counter + 1;
          HMACTmp.update(counter === 0 ? EMPTY_BUFFER : T).update(info).update(HKDF_COUNTER).digestInto(T);
          okm.set(T, olen * counter);
          HMAC._cloneInto(HMACTmp);
        }
        HMAC.destroy();
        HMACTmp.destroy();
        (0, utils_ts_1.clean)(T, HKDF_COUNTER);
        return okm.slice(0, length);
      }
      var hkdf = (hash, ikm, salt, info, length) => expand(hash, extract(hash, ikm, salt), info, length);
      exports.hkdf = hkdf;
    }
  });

  // node_modules/@noble/hashes/sha256.js
  var require_sha256 = __commonJS({
    "node_modules/@noble/hashes/sha256.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.sha224 = exports.SHA224 = exports.sha256 = exports.SHA256 = void 0;
      var sha2_ts_1 = require_sha2();
      exports.SHA256 = sha2_ts_1.SHA256;
      exports.sha256 = sha2_ts_1.sha256;
      exports.SHA224 = sha2_ts_1.SHA224;
      exports.sha224 = sha2_ts_1.sha224;
    }
  });

  // node_modules/@blerpc/protocol-ts/dist/crypto.js
  var require_crypto3 = __commonJS({
    "node_modules/@blerpc/protocol-ts/dist/crypto.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.PeripheralKeyExchange = exports.CentralKeyExchange = exports.BlerpcCryptoSession = exports.BlerpcCrypto = exports.KEY_EXCHANGE_STEP4 = exports.KEY_EXCHANGE_STEP3 = exports.KEY_EXCHANGE_STEP2 = exports.KEY_EXCHANGE_STEP1 = exports.CONFIRM_PERIPHERAL = exports.CONFIRM_CENTRAL = exports.DIRECTION_P2C = exports.DIRECTION_C2P = void 0;
      exports.tofuVerify = tofuVerify;
      exports.centralPerformKeyExchange = centralPerformKeyExchange2;
      var ed25519_1 = require_ed25519();
      var ed25519_2 = require_ed25519();
      var aes_1 = require_aes();
      var webcrypto_1 = require_webcrypto();
      var hkdf_1 = require_hkdf();
      var sha256_1 = require_sha256();
      exports.DIRECTION_C2P = 0;
      exports.DIRECTION_P2C = 1;
      var encoder = new TextEncoder();
      exports.CONFIRM_CENTRAL = encoder.encode("BLERPC_CONFIRM_C");
      exports.CONFIRM_PERIPHERAL = encoder.encode("BLERPC_CONFIRM_P");
      exports.KEY_EXCHANGE_STEP1 = 1;
      exports.KEY_EXCHANGE_STEP2 = 2;
      exports.KEY_EXCHANGE_STEP3 = 3;
      exports.KEY_EXCHANGE_STEP4 = 4;
      function concatBytes(...arrays) {
        const totalLen = arrays.reduce((sum, a) => sum + a.length, 0);
        const result = new Uint8Array(totalLen);
        let offset = 0;
        for (const a of arrays) {
          result.set(a, offset);
          offset += a.length;
        }
        return result;
      }
      function uint8ArrayEquals(a, b) {
        if (a.length !== b.length)
          return false;
        for (let i = 0; i < a.length; i++) {
          if (a[i] !== b[i])
            return false;
        }
        return true;
      }
      var BlerpcCrypto = class _BlerpcCrypto {
        /** Generate an X25519 key pair. Returns [privateKey(32), publicKey(32)]. */
        static generateX25519KeyPair() {
          const privateKey = (0, webcrypto_1.randomBytes)(32);
          const publicKey = ed25519_1.x25519.getPublicKey(privateKey);
          return [privateKey, publicKey];
        }
        /** Get the raw 32-byte public key from a private key. */
        static x25519PublicKey(privateKey) {
          return ed25519_1.x25519.getPublicKey(privateKey);
        }
        /** Compute X25519 shared secret (32 bytes). */
        static x25519SharedSecret(privateKey, peerPublicKey) {
          return ed25519_1.x25519.getSharedSecret(privateKey, peerPublicKey);
        }
        /**
         * Derive 16-byte AES-128 session key using HKDF-SHA256.
         *
         * salt = centralPubkey || peripheralPubkey (64 bytes)
         * info = "blerpc-session-key"
         */
        static deriveSessionKey(sharedSecret, centralPubkey, peripheralPubkey) {
          const salt = concatBytes(centralPubkey, peripheralPubkey);
          const info = encoder.encode("blerpc-session-key");
          return (0, hkdf_1.hkdf)(sha256_1.sha256, sharedSecret, salt, info, 16);
        }
        /** Generate an Ed25519 key pair. Returns [privateKey(32), publicKey(32)]. */
        static generateEd25519KeyPair() {
          const privateKey = (0, webcrypto_1.randomBytes)(32);
          const publicKey = ed25519_2.ed25519.getPublicKey(privateKey);
          return [privateKey, publicKey];
        }
        /** Get the raw 32-byte public key from an Ed25519 private key. */
        static ed25519PublicKey(privateKey) {
          return ed25519_2.ed25519.getPublicKey(privateKey);
        }
        /** Sign a message with Ed25519. Returns 64-byte signature. */
        static ed25519Sign(privateKey, message) {
          return ed25519_2.ed25519.sign(message, privateKey);
        }
        /** Verify an Ed25519 signature. Returns true if valid. */
        static ed25519Verify(publicKey, message, signature) {
          try {
            return ed25519_2.ed25519.verify(signature, message, publicKey);
          } catch {
            return false;
          }
        }
        /** Build 12-byte AES-GCM nonce: counter(4B LE) || direction(1B) || zeros(7B). */
        static _buildNonce(counter, direction) {
          const buf = new ArrayBuffer(12);
          const view = new DataView(buf);
          view.setUint32(0, counter, true);
          view.setUint8(4, direction);
          return new Uint8Array(buf);
        }
        /**
         * Encrypt a command payload.
         *
         * Returns: [counter:4BLE][ciphertext:NB][tag:16B]
         */
        static encryptCommand(sessionKey, counter, direction, plaintext) {
          const nonce = _BlerpcCrypto._buildNonce(counter, direction);
          const aes = (0, aes_1.gcm)(sessionKey, nonce);
          const sealed = aes.encrypt(plaintext);
          const counterBytes = new Uint8Array(4);
          new DataView(counterBytes.buffer).setUint32(0, counter, true);
          return concatBytes(counterBytes, sealed);
        }
        /**
         * Decrypt a command payload.
         *
         * Input: [counter:4BLE][ciphertext:NB][tag:16B]
         * Returns: [counter, plaintext]
         */
        static decryptCommand(sessionKey, direction, data) {
          if (data.length < 20) {
            throw new Error(`Encrypted payload too short: ${data.length}`);
          }
          const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
          const counter = view.getUint32(0, true);
          const sealed = data.slice(4);
          const nonce = _BlerpcCrypto._buildNonce(counter, direction);
          const aes = (0, aes_1.gcm)(sessionKey, nonce);
          const plaintext = aes.decrypt(sealed);
          return [counter, plaintext];
        }
        /**
         * Encrypt a confirmation message for key exchange step 3/4.
         *
         * Returns: [nonce:12B][ciphertext:16B][tag:16B] = 44 bytes
         */
        static encryptConfirmation(sessionKey, message) {
          const nonce = (0, webcrypto_1.randomBytes)(12);
          const aes = (0, aes_1.gcm)(sessionKey, nonce);
          const sealed = aes.encrypt(message);
          return concatBytes(nonce, sealed);
        }
        /**
         * Decrypt a confirmation message from key exchange step 3/4.
         *
         * Input: [nonce:12B][ciphertext:16B][tag:16B] = 44 bytes
         * Returns: plaintext (16 bytes)
         */
        static decryptConfirmation(sessionKey, data) {
          if (data.length < 44) {
            throw new Error(`Confirmation too short: ${data.length}`);
          }
          const nonce = data.slice(0, 12);
          const sealed = data.slice(12);
          const aes = (0, aes_1.gcm)(sessionKey, nonce);
          return aes.decrypt(sealed);
        }
        /** Build KEY_EXCHANGE step 1 payload (33 bytes). [step:u8=0x01][central_x25519_pubkey:32B] */
        static buildStep1Payload(centralX25519Pubkey) {
          return concatBytes(new Uint8Array([exports.KEY_EXCHANGE_STEP1]), centralX25519Pubkey);
        }
        /** Parse KEY_EXCHANGE step 1 payload. Returns central_x25519_pubkey (32 bytes). */
        static parseStep1Payload(data) {
          if (data.length < 33 || data[0] !== exports.KEY_EXCHANGE_STEP1) {
            throw new Error("Invalid step 1 payload");
          }
          return data.slice(1, 33);
        }
        /**
         * Build KEY_EXCHANGE step 2 payload (129 bytes).
         * [step:u8=0x02][peripheral_x25519_pubkey:32B][ed25519_signature:64B][peripheral_ed25519_pubkey:32B]
         */
        static buildStep2Payload(peripheralX25519Pubkey, ed25519Signature, peripheralEd25519Pubkey) {
          return concatBytes(new Uint8Array([exports.KEY_EXCHANGE_STEP2]), peripheralX25519Pubkey, ed25519Signature, peripheralEd25519Pubkey);
        }
        /** Parse KEY_EXCHANGE step 2 payload. Returns [peripheral_x25519_pubkey, signature, peripheral_ed25519_pubkey]. */
        static parseStep2Payload(data) {
          if (data.length < 129 || data[0] !== exports.KEY_EXCHANGE_STEP2) {
            throw new Error("Invalid step 2 payload");
          }
          return [data.slice(1, 33), data.slice(33, 97), data.slice(97, 129)];
        }
        /** Build KEY_EXCHANGE step 3 payload (45 bytes). [step:u8=0x03][nonce:12B][ciphertext:16B][tag:16B] */
        static buildStep3Payload(confirmationEncrypted) {
          return concatBytes(new Uint8Array([exports.KEY_EXCHANGE_STEP3]), confirmationEncrypted);
        }
        /** Parse KEY_EXCHANGE step 3 payload. Returns the encrypted confirmation (44 bytes). */
        static parseStep3Payload(data) {
          if (data.length < 45 || data[0] !== exports.KEY_EXCHANGE_STEP3) {
            throw new Error("Invalid step 3 payload");
          }
          return data.slice(1, 45);
        }
        /** Build KEY_EXCHANGE step 4 payload (45 bytes). [step:u8=0x04][nonce:12B][ciphertext:16B][tag:16B] */
        static buildStep4Payload(confirmationEncrypted) {
          return concatBytes(new Uint8Array([exports.KEY_EXCHANGE_STEP4]), confirmationEncrypted);
        }
        /** Parse KEY_EXCHANGE step 4 payload. Returns the encrypted confirmation (44 bytes). */
        static parseStep4Payload(data) {
          if (data.length < 45 || data[0] !== exports.KEY_EXCHANGE_STEP4) {
            throw new Error("Invalid step 4 payload");
          }
          return data.slice(1, 45);
        }
      };
      exports.BlerpcCrypto = BlerpcCrypto;
      var BlerpcCryptoSession2 = class {
        constructor(sessionKey, isCentral) {
          this.txCounter = 0;
          this._rxCounter = 0;
          this._rxFirstDone = false;
          this._sessionKey = sessionKey;
          this._txDirection = isCentral ? exports.DIRECTION_C2P : exports.DIRECTION_P2C;
          this._rxDirection = isCentral ? exports.DIRECTION_P2C : exports.DIRECTION_C2P;
        }
        /** Encrypt plaintext with auto-incrementing TX counter. */
        encrypt(plaintext) {
          if (this.txCounter >= 4294967295) {
            throw new Error("TX counter overflow: session must be rekeyed");
          }
          const encrypted = BlerpcCrypto.encryptCommand(this._sessionKey, this.txCounter, this._txDirection, plaintext);
          this.txCounter++;
          return encrypted;
        }
        /** Decrypt data with replay detection on RX counter. */
        decrypt(data) {
          const [counter, plaintext] = BlerpcCrypto.decryptCommand(this._sessionKey, this._rxDirection, data);
          if (this._rxFirstDone && counter <= this._rxCounter) {
            throw new Error(`Replay detected: counter=${counter}`);
          }
          this._rxCounter = counter;
          this._rxFirstDone = true;
          return plaintext;
        }
      };
      exports.BlerpcCryptoSession = BlerpcCryptoSession2;
      var CentralKeyExchange = class {
        constructor() {
          this._x25519PrivKey = null;
          this._x25519Pubkey = null;
          this._sessionKey = null;
          this._state = 0;
        }
        /** Generate ephemeral X25519 keypair and return step 1 payload. */
        start() {
          if (this._state !== 0)
            throw new Error("Invalid state for start()");
          const [priv, pub] = BlerpcCrypto.generateX25519KeyPair();
          this._x25519PrivKey = priv;
          this._x25519Pubkey = pub;
          this._state = 1;
          return BlerpcCrypto.buildStep1Payload(pub);
        }
        /** Parse step 2, verify signature, derive session key, return step 3 payload. */
        processStep2(step2Payload, verifyKeyCb) {
          if (this._state !== 1)
            throw new Error("Invalid state for processStep2()");
          const [periphX25519Pub, signature, periphEd25519Pub] = BlerpcCrypto.parseStep2Payload(step2Payload);
          const signMsg = concatBytes(this._x25519Pubkey, periphX25519Pub);
          const valid = BlerpcCrypto.ed25519Verify(periphEd25519Pub, signMsg, signature);
          if (!valid) {
            throw new Error("Ed25519 signature verification failed");
          }
          if (verifyKeyCb && !verifyKeyCb(periphEd25519Pub)) {
            throw new Error("Peripheral key rejected by verify callback");
          }
          const sharedSecret = BlerpcCrypto.x25519SharedSecret(this._x25519PrivKey, periphX25519Pub);
          this._sessionKey = BlerpcCrypto.deriveSessionKey(sharedSecret, this._x25519Pubkey, periphX25519Pub);
          const encryptedConfirm = BlerpcCrypto.encryptConfirmation(this._sessionKey, exports.CONFIRM_CENTRAL);
          this._state = 2;
          return BlerpcCrypto.buildStep3Payload(encryptedConfirm);
        }
        /** Parse step 4, verify peripheral confirmation, return session. */
        finish(step4Payload) {
          if (this._state !== 2)
            throw new Error("Invalid state for finish()");
          const encryptedPeriph = BlerpcCrypto.parseStep4Payload(step4Payload);
          const plaintext = BlerpcCrypto.decryptConfirmation(this._sessionKey, encryptedPeriph);
          if (!uint8ArrayEquals(plaintext, exports.CONFIRM_PERIPHERAL)) {
            throw new Error("Peripheral confirmation mismatch");
          }
          return new BlerpcCryptoSession2(this._sessionKey, true);
        }
      };
      exports.CentralKeyExchange = CentralKeyExchange;
      var PeripheralKeyExchange = class {
        constructor(ed25519PrivKey, ed25519PubKey) {
          this._sessionKey = null;
          this._state = 0;
          this._ed25519PrivKey = ed25519PrivKey;
          this._ed25519PubKey = ed25519PubKey;
        }
        /** Visible for testing. */
        get sessionKey() {
          return this._sessionKey;
        }
        /** Parse step 1, generate ephemeral X25519 keypair, sign, derive session key, return step 2 payload. */
        processStep1(step1Payload) {
          if (this._state !== 0)
            throw new Error("Invalid state for processStep1()");
          const centralX25519Pub = BlerpcCrypto.parseStep1Payload(step1Payload);
          const [x25519Priv, x25519Pub] = BlerpcCrypto.generateX25519KeyPair();
          const signMsg = concatBytes(centralX25519Pub, x25519Pub);
          const signature = BlerpcCrypto.ed25519Sign(this._ed25519PrivKey, signMsg);
          const sharedSecret = BlerpcCrypto.x25519SharedSecret(x25519Priv, centralX25519Pub);
          this._sessionKey = BlerpcCrypto.deriveSessionKey(sharedSecret, centralX25519Pub, x25519Pub);
          this._state = 1;
          return BlerpcCrypto.buildStep2Payload(x25519Pub, signature, this._ed25519PubKey);
        }
        /** Parse step 3, verify confirmation, return [step4Payload, session]. */
        processStep3(step3Payload) {
          if (this._state !== 1)
            throw new Error("Invalid state for processStep3()");
          const encrypted = BlerpcCrypto.parseStep3Payload(step3Payload);
          const plaintext = BlerpcCrypto.decryptConfirmation(this._sessionKey, encrypted);
          if (!uint8ArrayEquals(plaintext, exports.CONFIRM_CENTRAL)) {
            throw new Error("Central confirmation mismatch");
          }
          const encryptedConfirm = BlerpcCrypto.encryptConfirmation(this._sessionKey, exports.CONFIRM_PERIPHERAL);
          const step4 = BlerpcCrypto.buildStep4Payload(encryptedConfirm);
          const session = new BlerpcCryptoSession2(this._sessionKey, false);
          return [step4, session];
        }
        /**
         * Dispatch a key exchange payload by step byte.
         * Returns [responsePayload, sessionOrNull].
         */
        handleStep(payload) {
          if (payload.length === 0) {
            throw new Error("Empty key exchange payload");
          }
          const step = payload[0];
          if (step === exports.KEY_EXCHANGE_STEP1) {
            if (this._state !== 0)
              throw new Error("Invalid state for step 1");
            const response = this.processStep1(payload);
            return [response, null];
          } else if (step === exports.KEY_EXCHANGE_STEP3) {
            if (this._state !== 1)
              throw new Error("Invalid state for step 3");
            const [step4, session] = this.processStep3(payload);
            return [step4, session];
          } else {
            throw new Error(`Invalid key exchange step: 0x${step.toString(16).padStart(2, "0")}`);
          }
        }
        /** Reset key exchange state for new connection. */
        reset() {
          this._state = 0;
          this._sessionKey = null;
        }
      };
      exports.PeripheralKeyExchange = PeripheralKeyExchange;
      function tofuVerify(store, deviceId, ed25519Pubkey) {
        const hex = Array.from(ed25519Pubkey).map((b) => b.toString(16).padStart(2, "0")).join("");
        const stored = store.get(deviceId);
        if (stored == null) {
          store.put(deviceId, hex);
          return true;
        }
        return stored === hex;
      }
      async function centralPerformKeyExchange2(options) {
        const pinIdentity = options.pinIdentity ?? true;
        let effectiveVerifyCb;
        if (options.verifyKeyCb) {
          effectiveVerifyCb = options.verifyKeyCb;
        } else if (!pinIdentity) {
          effectiveVerifyCb = void 0;
        } else if (options.knownKeys && options.deviceId != null) {
          const store = options.knownKeys;
          const id = options.deviceId;
          effectiveVerifyCb = (pub) => tofuVerify(store, id, pub);
        } else {
          throw new Error("Identity pinning is on by default but no KnownKeyStore/deviceId was provided. Pass knownKeys and deviceId to pin the peripheral identity (TOFU), or set pinIdentity: false to opt out (encrypted but unauthenticated).");
        }
        const kx = new CentralKeyExchange();
        const step1 = kx.start();
        await options.send(step1);
        const step2 = await options.receive();
        const step3 = kx.processStep2(step2, effectiveVerifyCb);
        await options.send(step3);
        const step4 = await options.receive();
        return kx.finish(step4);
      }
    }
  });

  // node_modules/@blerpc/protocol-ts/dist/index.js
  var require_dist = __commonJS({
    "node_modules/@blerpc/protocol-ts/dist/index.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.tofuVerify = exports.centralPerformKeyExchange = exports.PeripheralKeyExchange = exports.CentralKeyExchange = exports.BlerpcCryptoSession = exports.BlerpcCrypto = exports.KEY_EXCHANGE_STEP4 = exports.KEY_EXCHANGE_STEP3 = exports.KEY_EXCHANGE_STEP2 = exports.KEY_EXCHANGE_STEP1 = exports.CONFIRM_PERIPHERAL = exports.CONFIRM_CENTRAL = exports.DIRECTION_P2C = exports.DIRECTION_C2P = exports.makeKeyExchange = exports.makeErrorResponse = exports.makeCapabilitiesResponse = exports.makeCapabilitiesRequest = exports.makeStreamEndP2C = exports.makeStreamEndC2P = exports.makeTimeoutResponse = exports.makeTimeoutRequest = exports.CommandPacket = exports.CommandType = exports.ContainerAssembler = exports.ContainerSplitter = exports.Container = exports.unpackFlags = exports.packFlags = exports.ATT_OVERHEAD = exports.CONTROL_HEADER_SIZE = exports.SUBSEQUENT_HEADER_SIZE = exports.FIRST_HEADER_SIZE = exports.CAPABILITY_FLAG_ENCRYPTION_SUPPORTED = exports.BLERPC_ERROR_BUSY = exports.BLERPC_ERROR_RESPONSE_TOO_LARGE = exports.controlCmdFromValue = exports.ControlCmd = exports.containerTypeFromValue = exports.ContainerType = void 0;
      var containerTypes_1 = require_containerTypes();
      Object.defineProperty(exports, "ContainerType", { enumerable: true, get: function() {
        return containerTypes_1.ContainerType;
      } });
      Object.defineProperty(exports, "containerTypeFromValue", { enumerable: true, get: function() {
        return containerTypes_1.containerTypeFromValue;
      } });
      Object.defineProperty(exports, "ControlCmd", { enumerable: true, get: function() {
        return containerTypes_1.ControlCmd;
      } });
      Object.defineProperty(exports, "controlCmdFromValue", { enumerable: true, get: function() {
        return containerTypes_1.controlCmdFromValue;
      } });
      Object.defineProperty(exports, "BLERPC_ERROR_RESPONSE_TOO_LARGE", { enumerable: true, get: function() {
        return containerTypes_1.BLERPC_ERROR_RESPONSE_TOO_LARGE;
      } });
      Object.defineProperty(exports, "BLERPC_ERROR_BUSY", { enumerable: true, get: function() {
        return containerTypes_1.BLERPC_ERROR_BUSY;
      } });
      Object.defineProperty(exports, "CAPABILITY_FLAG_ENCRYPTION_SUPPORTED", { enumerable: true, get: function() {
        return containerTypes_1.CAPABILITY_FLAG_ENCRYPTION_SUPPORTED;
      } });
      Object.defineProperty(exports, "FIRST_HEADER_SIZE", { enumerable: true, get: function() {
        return containerTypes_1.FIRST_HEADER_SIZE;
      } });
      Object.defineProperty(exports, "SUBSEQUENT_HEADER_SIZE", { enumerable: true, get: function() {
        return containerTypes_1.SUBSEQUENT_HEADER_SIZE;
      } });
      Object.defineProperty(exports, "CONTROL_HEADER_SIZE", { enumerable: true, get: function() {
        return containerTypes_1.CONTROL_HEADER_SIZE;
      } });
      Object.defineProperty(exports, "ATT_OVERHEAD", { enumerable: true, get: function() {
        return containerTypes_1.ATT_OVERHEAD;
      } });
      var container_1 = require_container();
      Object.defineProperty(exports, "packFlags", { enumerable: true, get: function() {
        return container_1.packFlags;
      } });
      Object.defineProperty(exports, "unpackFlags", { enumerable: true, get: function() {
        return container_1.unpackFlags;
      } });
      Object.defineProperty(exports, "Container", { enumerable: true, get: function() {
        return container_1.Container;
      } });
      var containerSplitter_1 = require_containerSplitter();
      Object.defineProperty(exports, "ContainerSplitter", { enumerable: true, get: function() {
        return containerSplitter_1.ContainerSplitter;
      } });
      var containerAssembler_1 = require_containerAssembler();
      Object.defineProperty(exports, "ContainerAssembler", { enumerable: true, get: function() {
        return containerAssembler_1.ContainerAssembler;
      } });
      var commandPacket_1 = require_commandPacket();
      Object.defineProperty(exports, "CommandType", { enumerable: true, get: function() {
        return commandPacket_1.CommandType;
      } });
      Object.defineProperty(exports, "CommandPacket", { enumerable: true, get: function() {
        return commandPacket_1.CommandPacket;
      } });
      var controlContainers_1 = require_controlContainers();
      Object.defineProperty(exports, "makeTimeoutRequest", { enumerable: true, get: function() {
        return controlContainers_1.makeTimeoutRequest;
      } });
      Object.defineProperty(exports, "makeTimeoutResponse", { enumerable: true, get: function() {
        return controlContainers_1.makeTimeoutResponse;
      } });
      Object.defineProperty(exports, "makeStreamEndC2P", { enumerable: true, get: function() {
        return controlContainers_1.makeStreamEndC2P;
      } });
      Object.defineProperty(exports, "makeStreamEndP2C", { enumerable: true, get: function() {
        return controlContainers_1.makeStreamEndP2C;
      } });
      Object.defineProperty(exports, "makeCapabilitiesRequest", { enumerable: true, get: function() {
        return controlContainers_1.makeCapabilitiesRequest;
      } });
      Object.defineProperty(exports, "makeCapabilitiesResponse", { enumerable: true, get: function() {
        return controlContainers_1.makeCapabilitiesResponse;
      } });
      Object.defineProperty(exports, "makeErrorResponse", { enumerable: true, get: function() {
        return controlContainers_1.makeErrorResponse;
      } });
      Object.defineProperty(exports, "makeKeyExchange", { enumerable: true, get: function() {
        return controlContainers_1.makeKeyExchange;
      } });
      var crypto_1 = require_crypto3();
      Object.defineProperty(exports, "DIRECTION_C2P", { enumerable: true, get: function() {
        return crypto_1.DIRECTION_C2P;
      } });
      Object.defineProperty(exports, "DIRECTION_P2C", { enumerable: true, get: function() {
        return crypto_1.DIRECTION_P2C;
      } });
      Object.defineProperty(exports, "CONFIRM_CENTRAL", { enumerable: true, get: function() {
        return crypto_1.CONFIRM_CENTRAL;
      } });
      Object.defineProperty(exports, "CONFIRM_PERIPHERAL", { enumerable: true, get: function() {
        return crypto_1.CONFIRM_PERIPHERAL;
      } });
      Object.defineProperty(exports, "KEY_EXCHANGE_STEP1", { enumerable: true, get: function() {
        return crypto_1.KEY_EXCHANGE_STEP1;
      } });
      Object.defineProperty(exports, "KEY_EXCHANGE_STEP2", { enumerable: true, get: function() {
        return crypto_1.KEY_EXCHANGE_STEP2;
      } });
      Object.defineProperty(exports, "KEY_EXCHANGE_STEP3", { enumerable: true, get: function() {
        return crypto_1.KEY_EXCHANGE_STEP3;
      } });
      Object.defineProperty(exports, "KEY_EXCHANGE_STEP4", { enumerable: true, get: function() {
        return crypto_1.KEY_EXCHANGE_STEP4;
      } });
      Object.defineProperty(exports, "BlerpcCrypto", { enumerable: true, get: function() {
        return crypto_1.BlerpcCrypto;
      } });
      Object.defineProperty(exports, "BlerpcCryptoSession", { enumerable: true, get: function() {
        return crypto_1.BlerpcCryptoSession;
      } });
      Object.defineProperty(exports, "CentralKeyExchange", { enumerable: true, get: function() {
        return crypto_1.CentralKeyExchange;
      } });
      Object.defineProperty(exports, "PeripheralKeyExchange", { enumerable: true, get: function() {
        return crypto_1.PeripheralKeyExchange;
      } });
      Object.defineProperty(exports, "centralPerformKeyExchange", { enumerable: true, get: function() {
        return crypto_1.centralPerformKeyExchange;
      } });
      Object.defineProperty(exports, "tofuVerify", { enumerable: true, get: function() {
        return crypto_1.tofuVerify;
      } });
    }
  });

  // src/index.ts
  var index_exports = {};
  __export(index_exports, {
    BlerpcClient: () => BlerpcClient,
    CHAR_UUID: () => CHAR_UUID,
    InsoleClient: () => InsoleClient,
    LocalStorageKnownKeyStore: () => LocalStorageKnownKeyStore,
    PayloadTooLargeError: () => PayloadTooLargeError,
    PeripheralErrorException: () => PeripheralErrorException,
    ProtocolException: () => ProtocolException,
    ResponseTooLargeError: () => ResponseTooLargeError,
    SAMPLE_PERIOD_MS: () => SAMPLE_PERIOD_MS,
    SERVICE_UUID: () => SERVICE_UUID,
    WINDOW_MS: () => WINDOW_MS,
    WebBluetoothTransport: () => WebBluetoothTransport,
    insole: () => insole
  });
  var protobuf = __toESM(require_minimal2(), 1);

  // src/client/BlerpcClient.ts
  var import_protocol_ts = __toESM(require_dist(), 1);

  // src/ble/WebBluetoothTransport.ts
  var SERVICE_UUID = "12340001-0000-1000-8000-00805f9b34fb";
  var CHAR_UUID = "12340002-0000-1000-8000-00805f9b34fb";
  var WebBluetoothTransport = class {
    constructor(options = {}) {
      this._device = null;
      this._char = null;
      this._onValue = null;
      this._notifyQueue = [];
      this._notifyWaiter = null;
      this._mtu = options.mtu ?? 247;
      this._namePrefix = options.namePrefix ?? "Orphe";
    }
    get mtu() {
      return this._mtu;
    }
    /**
     * Open the browser device chooser and return the selected device as a
     * one-element list. `timeout` is accepted for API parity but ignored — the
     * chooser is driven by the user, not a scan window. Must run inside a user
     * gesture and a secure context.
     */
    async scan(_timeout = 5e3) {
      if (typeof navigator === "undefined" || !navigator.bluetooth) {
        throw new Error("Web Bluetooth is not available (use Chrome/Edge over HTTPS or localhost)");
      }
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }, { namePrefix: this._namePrefix }],
        optionalServices: [SERVICE_UUID]
      });
      return [
        {
          device,
          name: device.name ?? null,
          address: device.id,
          rssi: 0
          // not exposed by Web Bluetooth
        }
      ];
    }
    async connect(scannedDevice) {
      const device = scannedDevice.device;
      this._device = device;
      if (!device.gatt) throw new Error("Device has no GATT server");
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      this._char = await service.getCharacteristic(CHAR_UUID);
      this._notifyQueue = [];
      this._notifyWaiter = null;
      this._onValue = (ev) => {
        const target = ev.target;
        const dv = target.value;
        if (!dv) return;
        const data = new Uint8Array(dv.byteLength);
        for (let i = 0; i < dv.byteLength; i++) data[i] = dv.getUint8(i);
        if (this._notifyWaiter) {
          const waiter = this._notifyWaiter;
          this._notifyWaiter = null;
          waiter.resolve(data);
        } else {
          this._notifyQueue.push(data);
        }
      };
      this._char.addEventListener("characteristicvaluechanged", this._onValue);
      await this._char.startNotifications();
    }
    async write(data) {
      if (!this._char) throw new Error("Not connected");
      const buf = new Uint8Array(data);
      if (this._char.writeValueWithoutResponse) {
        await this._char.writeValueWithoutResponse(buf);
      } else {
        await this._char.writeValue(buf);
      }
    }
    async readNotify(timeout = 2e3) {
      if (!this._char) throw new Error("Not connected");
      if (this._notifyQueue.length > 0) {
        return this._notifyQueue.shift();
      }
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          this._notifyWaiter = null;
          reject(new Error("Timeout waiting for notification"));
        }, timeout);
        this._notifyWaiter = {
          resolve: (value) => {
            clearTimeout(timer);
            resolve(value);
          },
          reject: (reason) => {
            clearTimeout(timer);
            reject(reason);
          }
        };
      });
    }
    async drainNotifications() {
      this._notifyQueue = [];
      try {
        for (; ; ) {
          await this.readNotify(100);
        }
      } catch {
      }
    }
    disconnect() {
      if (this._char && this._onValue) {
        this._char.removeEventListener("characteristicvaluechanged", this._onValue);
      }
      this._onValue = null;
      this._notifyQueue = [];
      this._notifyWaiter = null;
      if (this._device?.gatt?.connected) {
        this._device.gatt.disconnect();
      }
      this._device = null;
      this._char = null;
    }
  };

  // src/proto/insole.js
  var $protobuf = __toESM(require_minimal2(), 1);
  var $Reader = $protobuf.Reader;
  var $Writer = $protobuf.Writer;
  var $util = $protobuf.util;
  var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});
  var insole = $root.insole = (() => {
    const insole2 = {};
    insole2.EchoRequest = function() {
      function EchoRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      EchoRequest.prototype.message = "";
      EchoRequest.create = function create(properties) {
        return new EchoRequest(properties);
      };
      EchoRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.message != null && Object.hasOwnProperty.call(message, "message"))
          writer.uint32(
            /* id 1, wireType 2 =*/
            10
          ).string(message.message);
        return writer;
      };
      EchoRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      EchoRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.EchoRequest();
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
      EchoRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      EchoRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.message != null && Object.hasOwnProperty.call(message, "message")) {
          if (!$util.isString(message.message))
            return "message: string expected";
        }
        return null;
      };
      EchoRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.EchoRequest)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.EchoRequest: object expected");
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let message = new $root.insole.EchoRequest();
        if (object.message != null)
          message.message = String(object.message);
        return message;
      };
      EchoRequest.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      EchoRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      EchoRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.EchoRequest";
      };
      return EchoRequest;
    }();
    insole2.EchoResponse = function() {
      function EchoResponse(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      EchoResponse.prototype.message = "";
      EchoResponse.create = function create(properties) {
        return new EchoResponse(properties);
      };
      EchoResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.message != null && Object.hasOwnProperty.call(message, "message"))
          writer.uint32(
            /* id 1, wireType 2 =*/
            10
          ).string(message.message);
        return writer;
      };
      EchoResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      EchoResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.EchoResponse();
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
      EchoResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      EchoResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.message != null && Object.hasOwnProperty.call(message, "message")) {
          if (!$util.isString(message.message))
            return "message: string expected";
        }
        return null;
      };
      EchoResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.EchoResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.EchoResponse: object expected");
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let message = new $root.insole.EchoResponse();
        if (object.message != null)
          message.message = String(object.message);
        return message;
      };
      EchoResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      EchoResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      EchoResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.EchoResponse";
      };
      return EchoResponse;
    }();
    insole2.SetTimeRequest = function() {
      function SetTimeRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      SetTimeRequest.prototype.epochMs = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;
      SetTimeRequest.create = function create(properties) {
        return new SetTimeRequest(properties);
      };
      SetTimeRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.epochMs != null && Object.hasOwnProperty.call(message, "epochMs"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).uint64(message.epochMs);
        return writer;
      };
      SetTimeRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      SetTimeRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.SetTimeRequest();
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
      SetTimeRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      SetTimeRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.epochMs != null && Object.hasOwnProperty.call(message, "epochMs")) {
          if (!$util.isInteger(message.epochMs) && !(message.epochMs && $util.isInteger(message.epochMs.low) && $util.isInteger(message.epochMs.high)))
            return "epochMs: integer|Long expected";
        }
        return null;
      };
      SetTimeRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.SetTimeRequest)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.SetTimeRequest: object expected");
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let message = new $root.insole.SetTimeRequest();
        if (object.epochMs != null) {
          if ($util.Long)
            message.epochMs = $util.Long.fromValue(object.epochMs, true);
          else if (typeof object.epochMs === "string")
            message.epochMs = parseInt(object.epochMs, 10);
          else if (typeof object.epochMs === "number")
            message.epochMs = object.epochMs;
          else if (typeof object.epochMs === "object")
            message.epochMs = new $util.LongBits(object.epochMs.low >>> 0, object.epochMs.high >>> 0).toNumber(true);
        }
        return message;
      };
      SetTimeRequest.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      SetTimeRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      SetTimeRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.SetTimeRequest";
      };
      return SetTimeRequest;
    }();
    insole2.SetTimeResponse = function() {
      function SetTimeResponse(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      SetTimeResponse.prototype.epochMs = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;
      SetTimeResponse.create = function create(properties) {
        return new SetTimeResponse(properties);
      };
      SetTimeResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.epochMs != null && Object.hasOwnProperty.call(message, "epochMs"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).uint64(message.epochMs);
        return writer;
      };
      SetTimeResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      SetTimeResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.SetTimeResponse();
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
      SetTimeResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      SetTimeResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.epochMs != null && Object.hasOwnProperty.call(message, "epochMs")) {
          if (!$util.isInteger(message.epochMs) && !(message.epochMs && $util.isInteger(message.epochMs.low) && $util.isInteger(message.epochMs.high)))
            return "epochMs: integer|Long expected";
        }
        return null;
      };
      SetTimeResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.SetTimeResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.SetTimeResponse: object expected");
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let message = new $root.insole.SetTimeResponse();
        if (object.epochMs != null) {
          if ($util.Long)
            message.epochMs = $util.Long.fromValue(object.epochMs, true);
          else if (typeof object.epochMs === "string")
            message.epochMs = parseInt(object.epochMs, 10);
          else if (typeof object.epochMs === "number")
            message.epochMs = object.epochMs;
          else if (typeof object.epochMs === "object")
            message.epochMs = new $util.LongBits(object.epochMs.low >>> 0, object.epochMs.high >>> 0).toNumber(true);
        }
        return message;
      };
      SetTimeResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      SetTimeResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      SetTimeResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.SetTimeResponse";
      };
      return SetTimeResponse;
    }();
    insole2.ImuSample = function() {
      function ImuSample(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      ImuSample.prototype.accelLateral = 0;
      ImuSample.prototype.accelLongitudinal = 0;
      ImuSample.prototype.accelVertical = 0;
      ImuSample.prototype.gyroPitch = 0;
      ImuSample.prototype.gyroRoll = 0;
      ImuSample.prototype.gyroYaw = 0;
      ImuSample.create = function create(properties) {
        return new ImuSample(properties);
      };
      ImuSample.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.accelLateral != null && Object.hasOwnProperty.call(message, "accelLateral"))
          writer.uint32(
            /* id 1, wireType 5 =*/
            13
          ).float(message.accelLateral);
        if (message.accelLongitudinal != null && Object.hasOwnProperty.call(message, "accelLongitudinal"))
          writer.uint32(
            /* id 2, wireType 5 =*/
            21
          ).float(message.accelLongitudinal);
        if (message.accelVertical != null && Object.hasOwnProperty.call(message, "accelVertical"))
          writer.uint32(
            /* id 3, wireType 5 =*/
            29
          ).float(message.accelVertical);
        if (message.gyroPitch != null && Object.hasOwnProperty.call(message, "gyroPitch"))
          writer.uint32(
            /* id 4, wireType 5 =*/
            37
          ).float(message.gyroPitch);
        if (message.gyroRoll != null && Object.hasOwnProperty.call(message, "gyroRoll"))
          writer.uint32(
            /* id 5, wireType 5 =*/
            45
          ).float(message.gyroRoll);
        if (message.gyroYaw != null && Object.hasOwnProperty.call(message, "gyroYaw"))
          writer.uint32(
            /* id 6, wireType 5 =*/
            53
          ).float(message.gyroYaw);
        return writer;
      };
      ImuSample.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      ImuSample.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.ImuSample();
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
      ImuSample.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      ImuSample.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.accelLateral != null && Object.hasOwnProperty.call(message, "accelLateral")) {
          if (typeof message.accelLateral !== "number")
            return "accelLateral: number expected";
        }
        if (message.accelLongitudinal != null && Object.hasOwnProperty.call(message, "accelLongitudinal")) {
          if (typeof message.accelLongitudinal !== "number")
            return "accelLongitudinal: number expected";
        }
        if (message.accelVertical != null && Object.hasOwnProperty.call(message, "accelVertical")) {
          if (typeof message.accelVertical !== "number")
            return "accelVertical: number expected";
        }
        if (message.gyroPitch != null && Object.hasOwnProperty.call(message, "gyroPitch")) {
          if (typeof message.gyroPitch !== "number")
            return "gyroPitch: number expected";
        }
        if (message.gyroRoll != null && Object.hasOwnProperty.call(message, "gyroRoll")) {
          if (typeof message.gyroRoll !== "number")
            return "gyroRoll: number expected";
        }
        if (message.gyroYaw != null && Object.hasOwnProperty.call(message, "gyroYaw")) {
          if (typeof message.gyroYaw !== "number")
            return "gyroYaw: number expected";
        }
        return null;
      };
      ImuSample.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.ImuSample)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.ImuSample: object expected");
        if (long === void 0)
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
      ImuSample.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      ImuSample.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      ImuSample.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.ImuSample";
      };
      return ImuSample;
    }();
    insole2.PressureSample = function() {
      function PressureSample(properties) {
        this.mv = [];
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      PressureSample.prototype.mv = $util.emptyArray;
      PressureSample.create = function create(properties) {
        return new PressureSample(properties);
      };
      PressureSample.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.mv != null && message.mv.length) {
          writer.uint32(
            /* id 1, wireType 2 =*/
            10
          ).fork();
          for (let i = 0; i < message.mv.length; ++i)
            writer.float(message.mv[i]);
          writer.ldelim();
        }
        return writer;
      };
      PressureSample.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      PressureSample.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.PressureSample();
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
      PressureSample.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      PressureSample.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
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
      PressureSample.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.PressureSample)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.PressureSample: object expected");
        if (long === void 0)
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
      PressureSample.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      PressureSample.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      PressureSample.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.PressureSample";
      };
      return PressureSample;
    }();
    insole2.WindowStatus = function() {
      const valuesById = {}, values = Object.create(valuesById);
      values[valuesById[0] = "WINDOW_STATUS_UNSPECIFIED"] = 0;
      values[valuesById[1] = "WINDOW_STATUS_OK"] = 1;
      values[valuesById[2] = "WINDOW_STATUS_TOO_OLD"] = 2;
      values[valuesById[3] = "WINDOW_STATUS_TOO_NEW"] = 3;
      values[valuesById[4] = "WINDOW_STATUS_TIME_NOT_SET"] = 4;
      return values;
    }();
    insole2.GetWindowRequest = function() {
      function GetWindowRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      GetWindowRequest.prototype.startMs = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;
      GetWindowRequest.create = function create(properties) {
        return new GetWindowRequest(properties);
      };
      GetWindowRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).uint64(message.startMs);
        return writer;
      };
      GetWindowRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      GetWindowRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.GetWindowRequest();
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
      GetWindowRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      GetWindowRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs")) {
          if (!$util.isInteger(message.startMs) && !(message.startMs && $util.isInteger(message.startMs.low) && $util.isInteger(message.startMs.high)))
            return "startMs: integer|Long expected";
        }
        return null;
      };
      GetWindowRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.GetWindowRequest)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.GetWindowRequest: object expected");
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let message = new $root.insole.GetWindowRequest();
        if (object.startMs != null) {
          if ($util.Long)
            message.startMs = $util.Long.fromValue(object.startMs, true);
          else if (typeof object.startMs === "string")
            message.startMs = parseInt(object.startMs, 10);
          else if (typeof object.startMs === "number")
            message.startMs = object.startMs;
          else if (typeof object.startMs === "object")
            message.startMs = new $util.LongBits(object.startMs.low >>> 0, object.startMs.high >>> 0).toNumber(true);
        }
        return message;
      };
      GetWindowRequest.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      GetWindowRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      GetWindowRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.GetWindowRequest";
      };
      return GetWindowRequest;
    }();
    insole2.GetWindowResponse = function() {
      function GetWindowResponse(properties) {
        this.imu = [];
        this.pressure = [];
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      GetWindowResponse.prototype.status = 0;
      GetWindowResponse.prototype.startMs = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;
      GetWindowResponse.prototype.oldestMs = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;
      GetWindowResponse.prototype.newestMs = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;
      GetWindowResponse.prototype.imu = $util.emptyArray;
      GetWindowResponse.prototype.pressure = $util.emptyArray;
      GetWindowResponse.create = function create(properties) {
        return new GetWindowResponse(properties);
      };
      GetWindowResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.status != null && Object.hasOwnProperty.call(message, "status"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).int32(message.status);
        if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs"))
          writer.uint32(
            /* id 2, wireType 0 =*/
            16
          ).uint64(message.startMs);
        if (message.oldestMs != null && Object.hasOwnProperty.call(message, "oldestMs"))
          writer.uint32(
            /* id 3, wireType 0 =*/
            24
          ).uint64(message.oldestMs);
        if (message.newestMs != null && Object.hasOwnProperty.call(message, "newestMs"))
          writer.uint32(
            /* id 4, wireType 0 =*/
            32
          ).uint64(message.newestMs);
        if (message.imu != null && message.imu.length)
          for (let i = 0; i < message.imu.length; ++i)
            $root.insole.ImuSample.encode(message.imu[i], writer.uint32(
              /* id 5, wireType 2 =*/
              42
            ).fork(), q + 1).ldelim();
        if (message.pressure != null && message.pressure.length)
          for (let i = 0; i < message.pressure.length; ++i)
            $root.insole.PressureSample.encode(message.pressure[i], writer.uint32(
              /* id 6, wireType 2 =*/
              50
            ).fork(), q + 1).ldelim();
        return writer;
      };
      GetWindowResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      GetWindowResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.GetWindowResponse();
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
              message.imu.push($root.insole.ImuSample.decode(reader, reader.uint32(), void 0, long + 1));
              break;
            }
            case 6: {
              if (!(message.pressure && message.pressure.length))
                message.pressure = [];
              message.pressure.push($root.insole.PressureSample.decode(reader, reader.uint32(), void 0, long + 1));
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };
      GetWindowResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      GetWindowResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
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
        if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs")) {
          if (!$util.isInteger(message.startMs) && !(message.startMs && $util.isInteger(message.startMs.low) && $util.isInteger(message.startMs.high)))
            return "startMs: integer|Long expected";
        }
        if (message.oldestMs != null && Object.hasOwnProperty.call(message, "oldestMs")) {
          if (!$util.isInteger(message.oldestMs) && !(message.oldestMs && $util.isInteger(message.oldestMs.low) && $util.isInteger(message.oldestMs.high)))
            return "oldestMs: integer|Long expected";
        }
        if (message.newestMs != null && Object.hasOwnProperty.call(message, "newestMs")) {
          if (!$util.isInteger(message.newestMs) && !(message.newestMs && $util.isInteger(message.newestMs.low) && $util.isInteger(message.newestMs.high)))
            return "newestMs: integer|Long expected";
        }
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
      GetWindowResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.GetWindowResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.GetWindowResponse: object expected");
        if (long === void 0)
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
        if (object.startMs != null) {
          if ($util.Long)
            message.startMs = $util.Long.fromValue(object.startMs, true);
          else if (typeof object.startMs === "string")
            message.startMs = parseInt(object.startMs, 10);
          else if (typeof object.startMs === "number")
            message.startMs = object.startMs;
          else if (typeof object.startMs === "object")
            message.startMs = new $util.LongBits(object.startMs.low >>> 0, object.startMs.high >>> 0).toNumber(true);
        }
        if (object.oldestMs != null) {
          if ($util.Long)
            message.oldestMs = $util.Long.fromValue(object.oldestMs, true);
          else if (typeof object.oldestMs === "string")
            message.oldestMs = parseInt(object.oldestMs, 10);
          else if (typeof object.oldestMs === "number")
            message.oldestMs = object.oldestMs;
          else if (typeof object.oldestMs === "object")
            message.oldestMs = new $util.LongBits(object.oldestMs.low >>> 0, object.oldestMs.high >>> 0).toNumber(true);
        }
        if (object.newestMs != null) {
          if ($util.Long)
            message.newestMs = $util.Long.fromValue(object.newestMs, true);
          else if (typeof object.newestMs === "string")
            message.newestMs = parseInt(object.newestMs, 10);
          else if (typeof object.newestMs === "number")
            message.newestMs = object.newestMs;
          else if (typeof object.newestMs === "object")
            message.newestMs = new $util.LongBits(object.newestMs.low >>> 0, object.newestMs.high >>> 0).toNumber(true);
        }
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
      GetWindowResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
          object.status = options.enums === String ? $root.insole.WindowStatus[message.status] === void 0 ? message.status : $root.insole.WindowStatus[message.status] : message.status;
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
      GetWindowResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      GetWindowResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.GetWindowResponse";
      };
      return GetWindowResponse;
    }();
    insole2.Foot = function() {
      const valuesById = {}, values = Object.create(valuesById);
      values[valuesById[0] = "FOOT_UNSPECIFIED"] = 0;
      values[valuesById[1] = "FOOT_LEFT"] = 1;
      values[valuesById[2] = "FOOT_RIGHT"] = 2;
      return values;
    }();
    insole2.SetDeviceIdRequest = function() {
      function SetDeviceIdRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      SetDeviceIdRequest.prototype.deviceId = 0;
      SetDeviceIdRequest.create = function create(properties) {
        return new SetDeviceIdRequest(properties);
      };
      SetDeviceIdRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).uint32(message.deviceId);
        return writer;
      };
      SetDeviceIdRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      SetDeviceIdRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.SetDeviceIdRequest();
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
      SetDeviceIdRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      SetDeviceIdRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId")) {
          if (!$util.isInteger(message.deviceId))
            return "deviceId: integer expected";
        }
        return null;
      };
      SetDeviceIdRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.SetDeviceIdRequest)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.SetDeviceIdRequest: object expected");
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let message = new $root.insole.SetDeviceIdRequest();
        if (object.deviceId != null)
          message.deviceId = object.deviceId >>> 0;
        return message;
      };
      SetDeviceIdRequest.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      SetDeviceIdRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      SetDeviceIdRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.SetDeviceIdRequest";
      };
      return SetDeviceIdRequest;
    }();
    insole2.SetDeviceIdResponse = function() {
      function SetDeviceIdResponse(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      SetDeviceIdResponse.prototype.deviceId = 0;
      SetDeviceIdResponse.create = function create(properties) {
        return new SetDeviceIdResponse(properties);
      };
      SetDeviceIdResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).uint32(message.deviceId);
        return writer;
      };
      SetDeviceIdResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      SetDeviceIdResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.SetDeviceIdResponse();
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
      SetDeviceIdResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      SetDeviceIdResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId")) {
          if (!$util.isInteger(message.deviceId))
            return "deviceId: integer expected";
        }
        return null;
      };
      SetDeviceIdResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.SetDeviceIdResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.SetDeviceIdResponse: object expected");
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let message = new $root.insole.SetDeviceIdResponse();
        if (object.deviceId != null)
          message.deviceId = object.deviceId >>> 0;
        return message;
      };
      SetDeviceIdResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      SetDeviceIdResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      SetDeviceIdResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.SetDeviceIdResponse";
      };
      return SetDeviceIdResponse;
    }();
    insole2.SetFootRequest = function() {
      function SetFootRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      SetFootRequest.prototype.foot = 0;
      SetFootRequest.create = function create(properties) {
        return new SetFootRequest(properties);
      };
      SetFootRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).int32(message.foot);
        return writer;
      };
      SetFootRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      SetFootRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.SetFootRequest();
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
      SetFootRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      SetFootRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
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
      SetFootRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.SetFootRequest)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.SetFootRequest: object expected");
        if (long === void 0)
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
      SetFootRequest.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        let object = {};
        if (options.defaults)
          object.foot = options.enums === String ? "FOOT_UNSPECIFIED" : 0;
        if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
          object.foot = options.enums === String ? $root.insole.Foot[message.foot] === void 0 ? message.foot : $root.insole.Foot[message.foot] : message.foot;
        return object;
      };
      SetFootRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      SetFootRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.SetFootRequest";
      };
      return SetFootRequest;
    }();
    insole2.SetFootResponse = function() {
      function SetFootResponse(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      SetFootResponse.prototype.foot = 0;
      SetFootResponse.create = function create(properties) {
        return new SetFootResponse(properties);
      };
      SetFootResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).int32(message.foot);
        return writer;
      };
      SetFootResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      SetFootResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.SetFootResponse();
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
      SetFootResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      SetFootResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
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
      SetFootResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.SetFootResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.SetFootResponse: object expected");
        if (long === void 0)
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
      SetFootResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        let object = {};
        if (options.defaults)
          object.foot = options.enums === String ? "FOOT_UNSPECIFIED" : 0;
        if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
          object.foot = options.enums === String ? $root.insole.Foot[message.foot] === void 0 ? message.foot : $root.insole.Foot[message.foot] : message.foot;
        return object;
      };
      SetFootResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      SetFootResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.SetFootResponse";
      };
      return SetFootResponse;
    }();
    insole2.GetConfigRequest = function() {
      function GetConfigRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      GetConfigRequest.create = function create(properties) {
        return new GetConfigRequest(properties);
      };
      GetConfigRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        return writer;
      };
      GetConfigRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      GetConfigRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.GetConfigRequest();
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
      GetConfigRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      GetConfigRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        return null;
      };
      GetConfigRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.GetConfigRequest)
          return object;
        return new $root.insole.GetConfigRequest();
      };
      GetConfigRequest.toObject = function toObject() {
        return {};
      };
      GetConfigRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      GetConfigRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.GetConfigRequest";
      };
      return GetConfigRequest;
    }();
    insole2.GetConfigResponse = function() {
      function GetConfigResponse(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      GetConfigResponse.prototype.deviceId = 0;
      GetConfigResponse.prototype.foot = 0;
      GetConfigResponse.prototype.firmwareVersion = "";
      GetConfigResponse.prototype.logTimeUnitSec = 0;
      GetConfigResponse.prototype.logDistanceUnitCode = 0;
      GetConfigResponse.create = function create(properties) {
        return new GetConfigResponse(properties);
      };
      GetConfigResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).uint32(message.deviceId);
        if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
          writer.uint32(
            /* id 2, wireType 0 =*/
            16
          ).int32(message.foot);
        if (message.firmwareVersion != null && Object.hasOwnProperty.call(message, "firmwareVersion"))
          writer.uint32(
            /* id 3, wireType 2 =*/
            26
          ).string(message.firmwareVersion);
        if (message.logTimeUnitSec != null && Object.hasOwnProperty.call(message, "logTimeUnitSec"))
          writer.uint32(
            /* id 4, wireType 0 =*/
            32
          ).uint32(message.logTimeUnitSec);
        if (message.logDistanceUnitCode != null && Object.hasOwnProperty.call(message, "logDistanceUnitCode"))
          writer.uint32(
            /* id 5, wireType 0 =*/
            40
          ).uint32(message.logDistanceUnitCode);
        return writer;
      };
      GetConfigResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      GetConfigResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.GetConfigResponse();
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
      GetConfigResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      GetConfigResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.deviceId != null && Object.hasOwnProperty.call(message, "deviceId")) {
          if (!$util.isInteger(message.deviceId))
            return "deviceId: integer expected";
        }
        if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
          switch (message.foot) {
            default:
              return "foot: enum value expected";
            case 0:
            case 1:
            case 2:
              break;
          }
        if (message.firmwareVersion != null && Object.hasOwnProperty.call(message, "firmwareVersion")) {
          if (!$util.isString(message.firmwareVersion))
            return "firmwareVersion: string expected";
        }
        if (message.logTimeUnitSec != null && Object.hasOwnProperty.call(message, "logTimeUnitSec")) {
          if (!$util.isInteger(message.logTimeUnitSec))
            return "logTimeUnitSec: integer expected";
        }
        if (message.logDistanceUnitCode != null && Object.hasOwnProperty.call(message, "logDistanceUnitCode")) {
          if (!$util.isInteger(message.logDistanceUnitCode))
            return "logDistanceUnitCode: integer expected";
        }
        return null;
      };
      GetConfigResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.GetConfigResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.GetConfigResponse: object expected");
        if (long === void 0)
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
      GetConfigResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
          object.foot = options.enums === String ? $root.insole.Foot[message.foot] === void 0 ? message.foot : $root.insole.Foot[message.foot] : message.foot;
        if (message.firmwareVersion != null && Object.hasOwnProperty.call(message, "firmwareVersion"))
          object.firmwareVersion = message.firmwareVersion;
        if (message.logTimeUnitSec != null && Object.hasOwnProperty.call(message, "logTimeUnitSec"))
          object.logTimeUnitSec = message.logTimeUnitSec;
        if (message.logDistanceUnitCode != null && Object.hasOwnProperty.call(message, "logDistanceUnitCode"))
          object.logDistanceUnitCode = message.logDistanceUnitCode;
        return object;
      };
      GetConfigResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      GetConfigResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.GetConfigResponse";
      };
      return GetConfigResponse;
    }();
    insole2.SetLogUnitRequest = function() {
      function SetLogUnitRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      SetLogUnitRequest.prototype.timeUnitSec = 0;
      SetLogUnitRequest.prototype.distanceUnitCode = 0;
      SetLogUnitRequest.create = function create(properties) {
        return new SetLogUnitRequest(properties);
      };
      SetLogUnitRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.timeUnitSec != null && Object.hasOwnProperty.call(message, "timeUnitSec"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).uint32(message.timeUnitSec);
        if (message.distanceUnitCode != null && Object.hasOwnProperty.call(message, "distanceUnitCode"))
          writer.uint32(
            /* id 2, wireType 0 =*/
            16
          ).uint32(message.distanceUnitCode);
        return writer;
      };
      SetLogUnitRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      SetLogUnitRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.SetLogUnitRequest();
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
      SetLogUnitRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      SetLogUnitRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.timeUnitSec != null && Object.hasOwnProperty.call(message, "timeUnitSec")) {
          if (!$util.isInteger(message.timeUnitSec))
            return "timeUnitSec: integer expected";
        }
        if (message.distanceUnitCode != null && Object.hasOwnProperty.call(message, "distanceUnitCode")) {
          if (!$util.isInteger(message.distanceUnitCode))
            return "distanceUnitCode: integer expected";
        }
        return null;
      };
      SetLogUnitRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.SetLogUnitRequest)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.SetLogUnitRequest: object expected");
        if (long === void 0)
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
      SetLogUnitRequest.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      SetLogUnitRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      SetLogUnitRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.SetLogUnitRequest";
      };
      return SetLogUnitRequest;
    }();
    insole2.SetLogUnitResponse = function() {
      function SetLogUnitResponse(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      SetLogUnitResponse.prototype.ok = false;
      SetLogUnitResponse.prototype.timeUnitSec = 0;
      SetLogUnitResponse.prototype.distanceUnitCode = 0;
      SetLogUnitResponse.create = function create(properties) {
        return new SetLogUnitResponse(properties);
      };
      SetLogUnitResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).bool(message.ok);
        if (message.timeUnitSec != null && Object.hasOwnProperty.call(message, "timeUnitSec"))
          writer.uint32(
            /* id 2, wireType 0 =*/
            16
          ).uint32(message.timeUnitSec);
        if (message.distanceUnitCode != null && Object.hasOwnProperty.call(message, "distanceUnitCode"))
          writer.uint32(
            /* id 3, wireType 0 =*/
            24
          ).uint32(message.distanceUnitCode);
        return writer;
      };
      SetLogUnitResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      SetLogUnitResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.SetLogUnitResponse();
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
      SetLogUnitResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      SetLogUnitResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok")) {
          if (typeof message.ok !== "boolean")
            return "ok: boolean expected";
        }
        if (message.timeUnitSec != null && Object.hasOwnProperty.call(message, "timeUnitSec")) {
          if (!$util.isInteger(message.timeUnitSec))
            return "timeUnitSec: integer expected";
        }
        if (message.distanceUnitCode != null && Object.hasOwnProperty.call(message, "distanceUnitCode")) {
          if (!$util.isInteger(message.distanceUnitCode))
            return "distanceUnitCode: integer expected";
        }
        return null;
      };
      SetLogUnitResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.SetLogUnitResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.SetLogUnitResponse: object expected");
        if (long === void 0)
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
      SetLogUnitResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      SetLogUnitResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      SetLogUnitResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.SetLogUnitResponse";
      };
      return SetLogUnitResponse;
    }();
    insole2.OtaBeginRequest = function() {
      function OtaBeginRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      OtaBeginRequest.prototype.totalSize = 0;
      OtaBeginRequest.create = function create(properties) {
        return new OtaBeginRequest(properties);
      };
      OtaBeginRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.totalSize != null && Object.hasOwnProperty.call(message, "totalSize"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).uint32(message.totalSize);
        return writer;
      };
      OtaBeginRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      OtaBeginRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.OtaBeginRequest();
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
      OtaBeginRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      OtaBeginRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.totalSize != null && Object.hasOwnProperty.call(message, "totalSize")) {
          if (!$util.isInteger(message.totalSize))
            return "totalSize: integer expected";
        }
        return null;
      };
      OtaBeginRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.OtaBeginRequest)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.OtaBeginRequest: object expected");
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let message = new $root.insole.OtaBeginRequest();
        if (object.totalSize != null)
          message.totalSize = object.totalSize >>> 0;
        return message;
      };
      OtaBeginRequest.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      OtaBeginRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      OtaBeginRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.OtaBeginRequest";
      };
      return OtaBeginRequest;
    }();
    insole2.OtaBeginResponse = function() {
      function OtaBeginResponse(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      OtaBeginResponse.prototype.ok = false;
      OtaBeginResponse.prototype.maxChunk = 0;
      OtaBeginResponse.create = function create(properties) {
        return new OtaBeginResponse(properties);
      };
      OtaBeginResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).bool(message.ok);
        if (message.maxChunk != null && Object.hasOwnProperty.call(message, "maxChunk"))
          writer.uint32(
            /* id 2, wireType 0 =*/
            16
          ).uint32(message.maxChunk);
        return writer;
      };
      OtaBeginResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      OtaBeginResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.OtaBeginResponse();
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
      OtaBeginResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      OtaBeginResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok")) {
          if (typeof message.ok !== "boolean")
            return "ok: boolean expected";
        }
        if (message.maxChunk != null && Object.hasOwnProperty.call(message, "maxChunk")) {
          if (!$util.isInteger(message.maxChunk))
            return "maxChunk: integer expected";
        }
        return null;
      };
      OtaBeginResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.OtaBeginResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.OtaBeginResponse: object expected");
        if (long === void 0)
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
      OtaBeginResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      OtaBeginResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      OtaBeginResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.OtaBeginResponse";
      };
      return OtaBeginResponse;
    }();
    insole2.OtaWriteRequest = function() {
      function OtaWriteRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      OtaWriteRequest.prototype.offset = 0;
      OtaWriteRequest.prototype.data = $util.newBuffer([]);
      OtaWriteRequest.create = function create(properties) {
        return new OtaWriteRequest(properties);
      };
      OtaWriteRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.offset != null && Object.hasOwnProperty.call(message, "offset"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).uint32(message.offset);
        if (message.data != null && Object.hasOwnProperty.call(message, "data"))
          writer.uint32(
            /* id 2, wireType 2 =*/
            18
          ).bytes(message.data);
        return writer;
      };
      OtaWriteRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      OtaWriteRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.OtaWriteRequest();
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
      OtaWriteRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      OtaWriteRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.offset != null && Object.hasOwnProperty.call(message, "offset")) {
          if (!$util.isInteger(message.offset))
            return "offset: integer expected";
        }
        if (message.data != null && Object.hasOwnProperty.call(message, "data")) {
          if (!(message.data && typeof message.data.length === "number" || $util.isString(message.data)))
            return "data: buffer expected";
        }
        return null;
      };
      OtaWriteRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.OtaWriteRequest)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.OtaWriteRequest: object expected");
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let message = new $root.insole.OtaWriteRequest();
        if (object.offset != null)
          message.offset = object.offset >>> 0;
        if (object.data != null) {
          if (typeof object.data === "string")
            $util.base64.decode(object.data, message.data = $util.newBuffer($util.base64.length(object.data)), 0);
          else if (object.data.length >= 0)
            message.data = object.data;
        }
        return message;
      };
      OtaWriteRequest.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      OtaWriteRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      OtaWriteRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.OtaWriteRequest";
      };
      return OtaWriteRequest;
    }();
    insole2.OtaWriteResponse = function() {
      function OtaWriteResponse(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      OtaWriteResponse.prototype.ok = false;
      OtaWriteResponse.prototype.received = 0;
      OtaWriteResponse.create = function create(properties) {
        return new OtaWriteResponse(properties);
      };
      OtaWriteResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).bool(message.ok);
        if (message.received != null && Object.hasOwnProperty.call(message, "received"))
          writer.uint32(
            /* id 2, wireType 0 =*/
            16
          ).uint32(message.received);
        return writer;
      };
      OtaWriteResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      OtaWriteResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.OtaWriteResponse();
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
      OtaWriteResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      OtaWriteResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok")) {
          if (typeof message.ok !== "boolean")
            return "ok: boolean expected";
        }
        if (message.received != null && Object.hasOwnProperty.call(message, "received")) {
          if (!$util.isInteger(message.received))
            return "received: integer expected";
        }
        return null;
      };
      OtaWriteResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.OtaWriteResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.OtaWriteResponse: object expected");
        if (long === void 0)
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
      OtaWriteResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      OtaWriteResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      OtaWriteResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.OtaWriteResponse";
      };
      return OtaWriteResponse;
    }();
    insole2.OtaApplyRequest = function() {
      function OtaApplyRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      OtaApplyRequest.create = function create(properties) {
        return new OtaApplyRequest(properties);
      };
      OtaApplyRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        return writer;
      };
      OtaApplyRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      OtaApplyRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.OtaApplyRequest();
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
      OtaApplyRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      OtaApplyRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        return null;
      };
      OtaApplyRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.OtaApplyRequest)
          return object;
        return new $root.insole.OtaApplyRequest();
      };
      OtaApplyRequest.toObject = function toObject() {
        return {};
      };
      OtaApplyRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      OtaApplyRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.OtaApplyRequest";
      };
      return OtaApplyRequest;
    }();
    insole2.OtaApplyResponse = function() {
      function OtaApplyResponse(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      OtaApplyResponse.prototype.ok = false;
      OtaApplyResponse.create = function create(properties) {
        return new OtaApplyResponse(properties);
      };
      OtaApplyResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).bool(message.ok);
        return writer;
      };
      OtaApplyResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      OtaApplyResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.OtaApplyResponse();
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
      OtaApplyResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      OtaApplyResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok")) {
          if (typeof message.ok !== "boolean")
            return "ok: boolean expected";
        }
        return null;
      };
      OtaApplyResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.OtaApplyResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.OtaApplyResponse: object expected");
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let message = new $root.insole.OtaApplyResponse();
        if (object.ok != null)
          message.ok = Boolean(object.ok);
        return message;
      };
      OtaApplyResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      OtaApplyResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      OtaApplyResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.OtaApplyResponse";
      };
      return OtaApplyResponse;
    }();
    insole2.StartMeasurementRequest = function() {
      function StartMeasurementRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      StartMeasurementRequest.prototype.activityId = 0;
      StartMeasurementRequest.create = function create(properties) {
        return new StartMeasurementRequest(properties);
      };
      StartMeasurementRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.activityId != null && Object.hasOwnProperty.call(message, "activityId"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).uint32(message.activityId);
        return writer;
      };
      StartMeasurementRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      StartMeasurementRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.StartMeasurementRequest();
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
      StartMeasurementRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      StartMeasurementRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.activityId != null && Object.hasOwnProperty.call(message, "activityId")) {
          if (!$util.isInteger(message.activityId))
            return "activityId: integer expected";
        }
        return null;
      };
      StartMeasurementRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.StartMeasurementRequest)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.StartMeasurementRequest: object expected");
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let message = new $root.insole.StartMeasurementRequest();
        if (object.activityId != null)
          message.activityId = object.activityId >>> 0;
        return message;
      };
      StartMeasurementRequest.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      StartMeasurementRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      StartMeasurementRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.StartMeasurementRequest";
      };
      return StartMeasurementRequest;
    }();
    insole2.StartMeasurementResponse = function() {
      function StartMeasurementResponse(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      StartMeasurementResponse.prototype.ok = false;
      StartMeasurementResponse.prototype.sessionId = 0;
      StartMeasurementResponse.prototype.activityId = 0;
      StartMeasurementResponse.create = function create(properties) {
        return new StartMeasurementResponse(properties);
      };
      StartMeasurementResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).bool(message.ok);
        if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
          writer.uint32(
            /* id 2, wireType 0 =*/
            16
          ).uint32(message.sessionId);
        if (message.activityId != null && Object.hasOwnProperty.call(message, "activityId"))
          writer.uint32(
            /* id 3, wireType 0 =*/
            24
          ).uint32(message.activityId);
        return writer;
      };
      StartMeasurementResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      StartMeasurementResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.StartMeasurementResponse();
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
      StartMeasurementResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      StartMeasurementResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok")) {
          if (typeof message.ok !== "boolean")
            return "ok: boolean expected";
        }
        if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId")) {
          if (!$util.isInteger(message.sessionId))
            return "sessionId: integer expected";
        }
        if (message.activityId != null && Object.hasOwnProperty.call(message, "activityId")) {
          if (!$util.isInteger(message.activityId))
            return "activityId: integer expected";
        }
        return null;
      };
      StartMeasurementResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.StartMeasurementResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.StartMeasurementResponse: object expected");
        if (long === void 0)
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
      StartMeasurementResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      StartMeasurementResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      StartMeasurementResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.StartMeasurementResponse";
      };
      return StartMeasurementResponse;
    }();
    insole2.StopMeasurementRequest = function() {
      function StopMeasurementRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      StopMeasurementRequest.create = function create(properties) {
        return new StopMeasurementRequest(properties);
      };
      StopMeasurementRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        return writer;
      };
      StopMeasurementRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      StopMeasurementRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.StopMeasurementRequest();
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
      StopMeasurementRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      StopMeasurementRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        return null;
      };
      StopMeasurementRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.StopMeasurementRequest)
          return object;
        return new $root.insole.StopMeasurementRequest();
      };
      StopMeasurementRequest.toObject = function toObject() {
        return {};
      };
      StopMeasurementRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      StopMeasurementRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.StopMeasurementRequest";
      };
      return StopMeasurementRequest;
    }();
    insole2.StopMeasurementResponse = function() {
      function StopMeasurementResponse(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      StopMeasurementResponse.prototype.ok = false;
      StopMeasurementResponse.prototype.sessionId = 0;
      StopMeasurementResponse.prototype.steps = 0;
      StopMeasurementResponse.prototype.recorded = false;
      StopMeasurementResponse.create = function create(properties) {
        return new StopMeasurementResponse(properties);
      };
      StopMeasurementResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).bool(message.ok);
        if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
          writer.uint32(
            /* id 2, wireType 0 =*/
            16
          ).uint32(message.sessionId);
        if (message.steps != null && Object.hasOwnProperty.call(message, "steps"))
          writer.uint32(
            /* id 3, wireType 0 =*/
            24
          ).uint32(message.steps);
        if (message.recorded != null && Object.hasOwnProperty.call(message, "recorded"))
          writer.uint32(
            /* id 4, wireType 0 =*/
            32
          ).bool(message.recorded);
        return writer;
      };
      StopMeasurementResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      StopMeasurementResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.StopMeasurementResponse();
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
      StopMeasurementResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      StopMeasurementResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok")) {
          if (typeof message.ok !== "boolean")
            return "ok: boolean expected";
        }
        if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId")) {
          if (!$util.isInteger(message.sessionId))
            return "sessionId: integer expected";
        }
        if (message.steps != null && Object.hasOwnProperty.call(message, "steps")) {
          if (!$util.isInteger(message.steps))
            return "steps: integer expected";
        }
        if (message.recorded != null && Object.hasOwnProperty.call(message, "recorded")) {
          if (typeof message.recorded !== "boolean")
            return "recorded: boolean expected";
        }
        return null;
      };
      StopMeasurementResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.StopMeasurementResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.StopMeasurementResponse: object expected");
        if (long === void 0)
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
      StopMeasurementResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      StopMeasurementResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      StopMeasurementResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.StopMeasurementResponse";
      };
      return StopMeasurementResponse;
    }();
    insole2.LogMeta = function() {
      function LogMeta(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      LogMeta.prototype.sessionId = 0;
      LogMeta.prototype.startMs = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;
      LogMeta.prototype.elapsedMs = 0;
      LogMeta.prototype.steps = 0;
      LogMeta.create = function create(properties) {
        return new LogMeta(properties);
      };
      LogMeta.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).uint32(message.sessionId);
        if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs"))
          writer.uint32(
            /* id 2, wireType 0 =*/
            16
          ).uint64(message.startMs);
        if (message.elapsedMs != null && Object.hasOwnProperty.call(message, "elapsedMs"))
          writer.uint32(
            /* id 3, wireType 0 =*/
            24
          ).uint32(message.elapsedMs);
        if (message.steps != null && Object.hasOwnProperty.call(message, "steps"))
          writer.uint32(
            /* id 4, wireType 0 =*/
            32
          ).uint32(message.steps);
        return writer;
      };
      LogMeta.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      LogMeta.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.LogMeta();
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
      LogMeta.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      LogMeta.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId")) {
          if (!$util.isInteger(message.sessionId))
            return "sessionId: integer expected";
        }
        if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs")) {
          if (!$util.isInteger(message.startMs) && !(message.startMs && $util.isInteger(message.startMs.low) && $util.isInteger(message.startMs.high)))
            return "startMs: integer|Long expected";
        }
        if (message.elapsedMs != null && Object.hasOwnProperty.call(message, "elapsedMs")) {
          if (!$util.isInteger(message.elapsedMs))
            return "elapsedMs: integer expected";
        }
        if (message.steps != null && Object.hasOwnProperty.call(message, "steps")) {
          if (!$util.isInteger(message.steps))
            return "steps: integer expected";
        }
        return null;
      };
      LogMeta.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.LogMeta)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.LogMeta: object expected");
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let message = new $root.insole.LogMeta();
        if (object.sessionId != null)
          message.sessionId = object.sessionId >>> 0;
        if (object.startMs != null) {
          if ($util.Long)
            message.startMs = $util.Long.fromValue(object.startMs, true);
          else if (typeof object.startMs === "string")
            message.startMs = parseInt(object.startMs, 10);
          else if (typeof object.startMs === "number")
            message.startMs = object.startMs;
          else if (typeof object.startMs === "object")
            message.startMs = new $util.LongBits(object.startMs.low >>> 0, object.startMs.high >>> 0).toNumber(true);
        }
        if (object.elapsedMs != null)
          message.elapsedMs = object.elapsedMs >>> 0;
        if (object.steps != null)
          message.steps = object.steps >>> 0;
        return message;
      };
      LogMeta.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      LogMeta.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      LogMeta.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.LogMeta";
      };
      return LogMeta;
    }();
    insole2.ListLogsRequest = function() {
      function ListLogsRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      ListLogsRequest.create = function create(properties) {
        return new ListLogsRequest(properties);
      };
      ListLogsRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        return writer;
      };
      ListLogsRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      ListLogsRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.ListLogsRequest();
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
      ListLogsRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      ListLogsRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        return null;
      };
      ListLogsRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.ListLogsRequest)
          return object;
        return new $root.insole.ListLogsRequest();
      };
      ListLogsRequest.toObject = function toObject() {
        return {};
      };
      ListLogsRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      ListLogsRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.ListLogsRequest";
      };
      return ListLogsRequest;
    }();
    insole2.ListLogsResponse = function() {
      function ListLogsResponse(properties) {
        this.logs = [];
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      ListLogsResponse.prototype.total = 0;
      ListLogsResponse.prototype.logs = $util.emptyArray;
      ListLogsResponse.create = function create(properties) {
        return new ListLogsResponse(properties);
      };
      ListLogsResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.total != null && Object.hasOwnProperty.call(message, "total"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).uint32(message.total);
        if (message.logs != null && message.logs.length)
          for (let i = 0; i < message.logs.length; ++i)
            $root.insole.LogMeta.encode(message.logs[i], writer.uint32(
              /* id 2, wireType 2 =*/
              18
            ).fork(), q + 1).ldelim();
        return writer;
      };
      ListLogsResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      ListLogsResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.ListLogsResponse();
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
              message.logs.push($root.insole.LogMeta.decode(reader, reader.uint32(), void 0, long + 1));
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };
      ListLogsResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      ListLogsResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.total != null && Object.hasOwnProperty.call(message, "total")) {
          if (!$util.isInteger(message.total))
            return "total: integer expected";
        }
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
      ListLogsResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.ListLogsResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.ListLogsResponse: object expected");
        if (long === void 0)
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
      ListLogsResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      ListLogsResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      ListLogsResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.ListLogsResponse";
      };
      return ListLogsResponse;
    }();
    insole2.GaitStat = function() {
      function GaitStat(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      GaitStat.prototype.average = 0;
      GaitStat.prototype.variance = 0;
      GaitStat.prototype.minimum = 0;
      GaitStat.prototype.maximum = 0;
      GaitStat.create = function create(properties) {
        return new GaitStat(properties);
      };
      GaitStat.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.average != null && Object.hasOwnProperty.call(message, "average"))
          writer.uint32(
            /* id 1, wireType 5 =*/
            13
          ).float(message.average);
        if (message.variance != null && Object.hasOwnProperty.call(message, "variance"))
          writer.uint32(
            /* id 2, wireType 5 =*/
            21
          ).float(message.variance);
        if (message.minimum != null && Object.hasOwnProperty.call(message, "minimum"))
          writer.uint32(
            /* id 3, wireType 5 =*/
            29
          ).float(message.minimum);
        if (message.maximum != null && Object.hasOwnProperty.call(message, "maximum"))
          writer.uint32(
            /* id 4, wireType 5 =*/
            37
          ).float(message.maximum);
        return writer;
      };
      GaitStat.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      GaitStat.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.GaitStat();
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
      GaitStat.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      GaitStat.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.average != null && Object.hasOwnProperty.call(message, "average")) {
          if (typeof message.average !== "number")
            return "average: number expected";
        }
        if (message.variance != null && Object.hasOwnProperty.call(message, "variance")) {
          if (typeof message.variance !== "number")
            return "variance: number expected";
        }
        if (message.minimum != null && Object.hasOwnProperty.call(message, "minimum")) {
          if (typeof message.minimum !== "number")
            return "minimum: number expected";
        }
        if (message.maximum != null && Object.hasOwnProperty.call(message, "maximum")) {
          if (typeof message.maximum !== "number")
            return "maximum: number expected";
        }
        return null;
      };
      GaitStat.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.GaitStat)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.GaitStat: object expected");
        if (long === void 0)
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
      GaitStat.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      GaitStat.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      GaitStat.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.GaitStat";
      };
      return GaitStat;
    }();
    insole2.GaitSummary = function() {
      function GaitSummary(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      GaitSummary.prototype.sessionId = 0;
      GaitSummary.prototype.startMs = $util.Long ? $util.Long.fromBits(0, 0, true) : 0;
      GaitSummary.prototype.elapsedMs = 0;
      GaitSummary.prototype.steps = 0;
      GaitSummary.prototype.distanceM = 0;
      GaitSummary.prototype.foot = 0;
      GaitSummary.prototype.stride = null;
      GaitSummary.prototype.strideHeight = null;
      GaitSummary.prototype.speed = null;
      GaitSummary.prototype.pronation = null;
      GaitSummary.prototype.strikeAngle = null;
      GaitSummary.prototype.cadence = null;
      GaitSummary.prototype.landingForce = null;
      GaitSummary.prototype.contactTime = null;
      GaitSummary.prototype.activityId = 0;
      GaitSummary.create = function create(properties) {
        return new GaitSummary(properties);
      };
      GaitSummary.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).uint32(message.sessionId);
        if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs"))
          writer.uint32(
            /* id 2, wireType 0 =*/
            16
          ).uint64(message.startMs);
        if (message.elapsedMs != null && Object.hasOwnProperty.call(message, "elapsedMs"))
          writer.uint32(
            /* id 3, wireType 0 =*/
            24
          ).uint32(message.elapsedMs);
        if (message.steps != null && Object.hasOwnProperty.call(message, "steps"))
          writer.uint32(
            /* id 4, wireType 0 =*/
            32
          ).uint32(message.steps);
        if (message.distanceM != null && Object.hasOwnProperty.call(message, "distanceM"))
          writer.uint32(
            /* id 5, wireType 5 =*/
            45
          ).float(message.distanceM);
        if (message.foot != null && Object.hasOwnProperty.call(message, "foot"))
          writer.uint32(
            /* id 6, wireType 0 =*/
            48
          ).int32(message.foot);
        if (message.stride != null && Object.hasOwnProperty.call(message, "stride"))
          $root.insole.GaitStat.encode(message.stride, writer.uint32(
            /* id 7, wireType 2 =*/
            58
          ).fork(), q + 1).ldelim();
        if (message.strideHeight != null && Object.hasOwnProperty.call(message, "strideHeight"))
          $root.insole.GaitStat.encode(message.strideHeight, writer.uint32(
            /* id 8, wireType 2 =*/
            66
          ).fork(), q + 1).ldelim();
        if (message.speed != null && Object.hasOwnProperty.call(message, "speed"))
          $root.insole.GaitStat.encode(message.speed, writer.uint32(
            /* id 9, wireType 2 =*/
            74
          ).fork(), q + 1).ldelim();
        if (message.pronation != null && Object.hasOwnProperty.call(message, "pronation"))
          $root.insole.GaitStat.encode(message.pronation, writer.uint32(
            /* id 10, wireType 2 =*/
            82
          ).fork(), q + 1).ldelim();
        if (message.strikeAngle != null && Object.hasOwnProperty.call(message, "strikeAngle"))
          $root.insole.GaitStat.encode(message.strikeAngle, writer.uint32(
            /* id 11, wireType 2 =*/
            90
          ).fork(), q + 1).ldelim();
        if (message.cadence != null && Object.hasOwnProperty.call(message, "cadence"))
          $root.insole.GaitStat.encode(message.cadence, writer.uint32(
            /* id 12, wireType 2 =*/
            98
          ).fork(), q + 1).ldelim();
        if (message.landingForce != null && Object.hasOwnProperty.call(message, "landingForce"))
          $root.insole.GaitStat.encode(message.landingForce, writer.uint32(
            /* id 13, wireType 2 =*/
            106
          ).fork(), q + 1).ldelim();
        if (message.contactTime != null && Object.hasOwnProperty.call(message, "contactTime"))
          $root.insole.GaitStat.encode(message.contactTime, writer.uint32(
            /* id 14, wireType 2 =*/
            114
          ).fork(), q + 1).ldelim();
        if (message.activityId != null && Object.hasOwnProperty.call(message, "activityId"))
          writer.uint32(
            /* id 15, wireType 0 =*/
            120
          ).uint32(message.activityId);
        return writer;
      };
      GaitSummary.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      GaitSummary.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.GaitSummary();
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
              message.stride = $root.insole.GaitStat.decode(reader, reader.uint32(), void 0, long + 1);
              break;
            }
            case 8: {
              message.strideHeight = $root.insole.GaitStat.decode(reader, reader.uint32(), void 0, long + 1);
              break;
            }
            case 9: {
              message.speed = $root.insole.GaitStat.decode(reader, reader.uint32(), void 0, long + 1);
              break;
            }
            case 10: {
              message.pronation = $root.insole.GaitStat.decode(reader, reader.uint32(), void 0, long + 1);
              break;
            }
            case 11: {
              message.strikeAngle = $root.insole.GaitStat.decode(reader, reader.uint32(), void 0, long + 1);
              break;
            }
            case 12: {
              message.cadence = $root.insole.GaitStat.decode(reader, reader.uint32(), void 0, long + 1);
              break;
            }
            case 13: {
              message.landingForce = $root.insole.GaitStat.decode(reader, reader.uint32(), void 0, long + 1);
              break;
            }
            case 14: {
              message.contactTime = $root.insole.GaitStat.decode(reader, reader.uint32(), void 0, long + 1);
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
      GaitSummary.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      GaitSummary.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId")) {
          if (!$util.isInteger(message.sessionId))
            return "sessionId: integer expected";
        }
        if (message.startMs != null && Object.hasOwnProperty.call(message, "startMs")) {
          if (!$util.isInteger(message.startMs) && !(message.startMs && $util.isInteger(message.startMs.low) && $util.isInteger(message.startMs.high)))
            return "startMs: integer|Long expected";
        }
        if (message.elapsedMs != null && Object.hasOwnProperty.call(message, "elapsedMs")) {
          if (!$util.isInteger(message.elapsedMs))
            return "elapsedMs: integer expected";
        }
        if (message.steps != null && Object.hasOwnProperty.call(message, "steps")) {
          if (!$util.isInteger(message.steps))
            return "steps: integer expected";
        }
        if (message.distanceM != null && Object.hasOwnProperty.call(message, "distanceM")) {
          if (typeof message.distanceM !== "number")
            return "distanceM: number expected";
        }
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
        if (message.activityId != null && Object.hasOwnProperty.call(message, "activityId")) {
          if (!$util.isInteger(message.activityId))
            return "activityId: integer expected";
        }
        return null;
      };
      GaitSummary.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.GaitSummary)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.GaitSummary: object expected");
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let message = new $root.insole.GaitSummary();
        if (object.sessionId != null)
          message.sessionId = object.sessionId >>> 0;
        if (object.startMs != null) {
          if ($util.Long)
            message.startMs = $util.Long.fromValue(object.startMs, true);
          else if (typeof object.startMs === "string")
            message.startMs = parseInt(object.startMs, 10);
          else if (typeof object.startMs === "number")
            message.startMs = object.startMs;
          else if (typeof object.startMs === "object")
            message.startMs = new $util.LongBits(object.startMs.low >>> 0, object.startMs.high >>> 0).toNumber(true);
        }
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
      GaitSummary.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
          object.foot = options.enums === String ? $root.insole.Foot[message.foot] === void 0 ? message.foot : $root.insole.Foot[message.foot] : message.foot;
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
      GaitSummary.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      GaitSummary.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.GaitSummary";
      };
      return GaitSummary;
    }();
    insole2.ReadLogRequest = function() {
      function ReadLogRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      ReadLogRequest.prototype.index = 0;
      ReadLogRequest.create = function create(properties) {
        return new ReadLogRequest(properties);
      };
      ReadLogRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.index != null && Object.hasOwnProperty.call(message, "index"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).uint32(message.index);
        return writer;
      };
      ReadLogRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      ReadLogRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.ReadLogRequest();
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
      ReadLogRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      ReadLogRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.index != null && Object.hasOwnProperty.call(message, "index")) {
          if (!$util.isInteger(message.index))
            return "index: integer expected";
        }
        return null;
      };
      ReadLogRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.ReadLogRequest)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.ReadLogRequest: object expected");
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let message = new $root.insole.ReadLogRequest();
        if (object.index != null)
          message.index = object.index >>> 0;
        return message;
      };
      ReadLogRequest.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      ReadLogRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      ReadLogRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.ReadLogRequest";
      };
      return ReadLogRequest;
    }();
    insole2.ReadLogResponse = function() {
      function ReadLogResponse(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      ReadLogResponse.prototype.ok = false;
      ReadLogResponse.prototype.total = 0;
      ReadLogResponse.prototype.summary = null;
      ReadLogResponse.create = function create(properties) {
        return new ReadLogResponse(properties);
      };
      ReadLogResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).bool(message.ok);
        if (message.total != null && Object.hasOwnProperty.call(message, "total"))
          writer.uint32(
            /* id 2, wireType 0 =*/
            16
          ).uint32(message.total);
        if (message.summary != null && Object.hasOwnProperty.call(message, "summary"))
          $root.insole.GaitSummary.encode(message.summary, writer.uint32(
            /* id 3, wireType 2 =*/
            26
          ).fork(), q + 1).ldelim();
        return writer;
      };
      ReadLogResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      ReadLogResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.ReadLogResponse();
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
              message.summary = $root.insole.GaitSummary.decode(reader, reader.uint32(), void 0, long + 1);
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };
      ReadLogResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      ReadLogResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok")) {
          if (typeof message.ok !== "boolean")
            return "ok: boolean expected";
        }
        if (message.total != null && Object.hasOwnProperty.call(message, "total")) {
          if (!$util.isInteger(message.total))
            return "total: integer expected";
        }
        if (message.summary != null && Object.hasOwnProperty.call(message, "summary")) {
          let error = $root.insole.GaitSummary.verify(message.summary, long + 1);
          if (error)
            return "summary." + error;
        }
        return null;
      };
      ReadLogResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.ReadLogResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.ReadLogResponse: object expected");
        if (long === void 0)
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
      ReadLogResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      ReadLogResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      ReadLogResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.ReadLogResponse";
      };
      return ReadLogResponse;
    }();
    insole2.EraseLogsRequest = function() {
      function EraseLogsRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      EraseLogsRequest.create = function create(properties) {
        return new EraseLogsRequest(properties);
      };
      EraseLogsRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        return writer;
      };
      EraseLogsRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      EraseLogsRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.EraseLogsRequest();
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
      EraseLogsRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      EraseLogsRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        return null;
      };
      EraseLogsRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.EraseLogsRequest)
          return object;
        return new $root.insole.EraseLogsRequest();
      };
      EraseLogsRequest.toObject = function toObject() {
        return {};
      };
      EraseLogsRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      EraseLogsRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.EraseLogsRequest";
      };
      return EraseLogsRequest;
    }();
    insole2.EraseLogsResponse = function() {
      function EraseLogsResponse(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      EraseLogsResponse.prototype.ok = false;
      EraseLogsResponse.create = function create(properties) {
        return new EraseLogsResponse(properties);
      };
      EraseLogsResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).bool(message.ok);
        return writer;
      };
      EraseLogsResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      EraseLogsResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.EraseLogsResponse();
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
      EraseLogsResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      EraseLogsResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok")) {
          if (typeof message.ok !== "boolean")
            return "ok: boolean expected";
        }
        return null;
      };
      EraseLogsResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.EraseLogsResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.EraseLogsResponse: object expected");
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let message = new $root.insole.EraseLogsResponse();
        if (object.ok != null)
          message.ok = Boolean(object.ok);
        return message;
      };
      EraseLogsResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      EraseLogsResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      EraseLogsResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.EraseLogsResponse";
      };
      return EraseLogsResponse;
    }();
    insole2.GaitStride = function() {
      function GaitStride(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      GaitStride.prototype.strideLength = 0;
      GaitStride.prototype.strideHeight = 0;
      GaitStride.prototype.speed = 0;
      GaitStride.prototype.pronation = 0;
      GaitStride.prototype.strikeAngle = 0;
      GaitStride.prototype.cadence = 0;
      GaitStride.prototype.landingForce = 0;
      GaitStride.prototype.contactTime = 0;
      GaitStride.prototype.gaitType = 0;
      GaitStride.prototype.footStrike = 0;
      GaitStride.create = function create(properties) {
        return new GaitStride(properties);
      };
      GaitStride.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.strideLength != null && Object.hasOwnProperty.call(message, "strideLength"))
          writer.uint32(
            /* id 1, wireType 5 =*/
            13
          ).float(message.strideLength);
        if (message.strideHeight != null && Object.hasOwnProperty.call(message, "strideHeight"))
          writer.uint32(
            /* id 2, wireType 5 =*/
            21
          ).float(message.strideHeight);
        if (message.speed != null && Object.hasOwnProperty.call(message, "speed"))
          writer.uint32(
            /* id 3, wireType 5 =*/
            29
          ).float(message.speed);
        if (message.pronation != null && Object.hasOwnProperty.call(message, "pronation"))
          writer.uint32(
            /* id 4, wireType 5 =*/
            37
          ).float(message.pronation);
        if (message.strikeAngle != null && Object.hasOwnProperty.call(message, "strikeAngle"))
          writer.uint32(
            /* id 5, wireType 5 =*/
            45
          ).float(message.strikeAngle);
        if (message.cadence != null && Object.hasOwnProperty.call(message, "cadence"))
          writer.uint32(
            /* id 6, wireType 5 =*/
            53
          ).float(message.cadence);
        if (message.landingForce != null && Object.hasOwnProperty.call(message, "landingForce"))
          writer.uint32(
            /* id 7, wireType 5 =*/
            61
          ).float(message.landingForce);
        if (message.contactTime != null && Object.hasOwnProperty.call(message, "contactTime"))
          writer.uint32(
            /* id 8, wireType 5 =*/
            69
          ).float(message.contactTime);
        if (message.gaitType != null && Object.hasOwnProperty.call(message, "gaitType"))
          writer.uint32(
            /* id 9, wireType 0 =*/
            72
          ).int32(message.gaitType);
        if (message.footStrike != null && Object.hasOwnProperty.call(message, "footStrike"))
          writer.uint32(
            /* id 10, wireType 0 =*/
            80
          ).int32(message.footStrike);
        return writer;
      };
      GaitStride.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      GaitStride.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.GaitStride();
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
      GaitStride.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      GaitStride.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.strideLength != null && Object.hasOwnProperty.call(message, "strideLength")) {
          if (typeof message.strideLength !== "number")
            return "strideLength: number expected";
        }
        if (message.strideHeight != null && Object.hasOwnProperty.call(message, "strideHeight")) {
          if (typeof message.strideHeight !== "number")
            return "strideHeight: number expected";
        }
        if (message.speed != null && Object.hasOwnProperty.call(message, "speed")) {
          if (typeof message.speed !== "number")
            return "speed: number expected";
        }
        if (message.pronation != null && Object.hasOwnProperty.call(message, "pronation")) {
          if (typeof message.pronation !== "number")
            return "pronation: number expected";
        }
        if (message.strikeAngle != null && Object.hasOwnProperty.call(message, "strikeAngle")) {
          if (typeof message.strikeAngle !== "number")
            return "strikeAngle: number expected";
        }
        if (message.cadence != null && Object.hasOwnProperty.call(message, "cadence")) {
          if (typeof message.cadence !== "number")
            return "cadence: number expected";
        }
        if (message.landingForce != null && Object.hasOwnProperty.call(message, "landingForce")) {
          if (typeof message.landingForce !== "number")
            return "landingForce: number expected";
        }
        if (message.contactTime != null && Object.hasOwnProperty.call(message, "contactTime")) {
          if (typeof message.contactTime !== "number")
            return "contactTime: number expected";
        }
        if (message.gaitType != null && Object.hasOwnProperty.call(message, "gaitType")) {
          if (!$util.isInteger(message.gaitType))
            return "gaitType: integer expected";
        }
        if (message.footStrike != null && Object.hasOwnProperty.call(message, "footStrike")) {
          if (!$util.isInteger(message.footStrike))
            return "footStrike: integer expected";
        }
        return null;
      };
      GaitStride.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.GaitStride)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.GaitStride: object expected");
        if (long === void 0)
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
      GaitStride.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      GaitStride.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      GaitStride.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.GaitStride";
      };
      return GaitStride;
    }();
    insole2.GetGaitLiveRequest = function() {
      function GetGaitLiveRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      GetGaitLiveRequest.create = function create(properties) {
        return new GetGaitLiveRequest(properties);
      };
      GetGaitLiveRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        return writer;
      };
      GetGaitLiveRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      GetGaitLiveRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.GetGaitLiveRequest();
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
      GetGaitLiveRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      GetGaitLiveRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        return null;
      };
      GetGaitLiveRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.GetGaitLiveRequest)
          return object;
        return new $root.insole.GetGaitLiveRequest();
      };
      GetGaitLiveRequest.toObject = function toObject() {
        return {};
      };
      GetGaitLiveRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      GetGaitLiveRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.GetGaitLiveRequest";
      };
      return GetGaitLiveRequest;
    }();
    insole2.GetGaitLiveResponse = function() {
      function GetGaitLiveResponse(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      GetGaitLiveResponse.prototype.measuring = false;
      GetGaitLiveResponse.prototype.sessionId = 0;
      GetGaitLiveResponse.prototype.steps = 0;
      GetGaitLiveResponse.prototype.distanceM = 0;
      GetGaitLiveResponse.prototype.strideSeq = 0;
      GetGaitLiveResponse.prototype.last = null;
      GetGaitLiveResponse.create = function create(properties) {
        return new GetGaitLiveResponse(properties);
      };
      GetGaitLiveResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.measuring != null && Object.hasOwnProperty.call(message, "measuring"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).bool(message.measuring);
        if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
          writer.uint32(
            /* id 2, wireType 0 =*/
            16
          ).uint32(message.sessionId);
        if (message.steps != null && Object.hasOwnProperty.call(message, "steps"))
          writer.uint32(
            /* id 3, wireType 0 =*/
            24
          ).uint32(message.steps);
        if (message.distanceM != null && Object.hasOwnProperty.call(message, "distanceM"))
          writer.uint32(
            /* id 4, wireType 5 =*/
            37
          ).float(message.distanceM);
        if (message.strideSeq != null && Object.hasOwnProperty.call(message, "strideSeq"))
          writer.uint32(
            /* id 5, wireType 0 =*/
            40
          ).uint32(message.strideSeq);
        if (message.last != null && Object.hasOwnProperty.call(message, "last"))
          $root.insole.GaitStride.encode(message.last, writer.uint32(
            /* id 6, wireType 2 =*/
            50
          ).fork(), q + 1).ldelim();
        return writer;
      };
      GetGaitLiveResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      GetGaitLiveResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.GetGaitLiveResponse();
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
              message.last = $root.insole.GaitStride.decode(reader, reader.uint32(), void 0, long + 1);
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };
      GetGaitLiveResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      GetGaitLiveResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.measuring != null && Object.hasOwnProperty.call(message, "measuring")) {
          if (typeof message.measuring !== "boolean")
            return "measuring: boolean expected";
        }
        if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId")) {
          if (!$util.isInteger(message.sessionId))
            return "sessionId: integer expected";
        }
        if (message.steps != null && Object.hasOwnProperty.call(message, "steps")) {
          if (!$util.isInteger(message.steps))
            return "steps: integer expected";
        }
        if (message.distanceM != null && Object.hasOwnProperty.call(message, "distanceM")) {
          if (typeof message.distanceM !== "number")
            return "distanceM: number expected";
        }
        if (message.strideSeq != null && Object.hasOwnProperty.call(message, "strideSeq")) {
          if (!$util.isInteger(message.strideSeq))
            return "strideSeq: integer expected";
        }
        if (message.last != null && Object.hasOwnProperty.call(message, "last")) {
          let error = $root.insole.GaitStride.verify(message.last, long + 1);
          if (error)
            return "last." + error;
        }
        return null;
      };
      GetGaitLiveResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.GetGaitLiveResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.GetGaitLiveResponse: object expected");
        if (long === void 0)
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
      GetGaitLiveResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      GetGaitLiveResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      GetGaitLiveResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.GetGaitLiveResponse";
      };
      return GetGaitLiveResponse;
    }();
    insole2.ReadChunkRequest = function() {
      function ReadChunkRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      ReadChunkRequest.prototype.index = 0;
      ReadChunkRequest.create = function create(properties) {
        return new ReadChunkRequest(properties);
      };
      ReadChunkRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.index != null && Object.hasOwnProperty.call(message, "index"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).uint32(message.index);
        return writer;
      };
      ReadChunkRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      ReadChunkRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.ReadChunkRequest();
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
      ReadChunkRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      ReadChunkRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.index != null && Object.hasOwnProperty.call(message, "index")) {
          if (!$util.isInteger(message.index))
            return "index: integer expected";
        }
        return null;
      };
      ReadChunkRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.ReadChunkRequest)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.ReadChunkRequest: object expected");
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let message = new $root.insole.ReadChunkRequest();
        if (object.index != null)
          message.index = object.index >>> 0;
        return message;
      };
      ReadChunkRequest.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      ReadChunkRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      ReadChunkRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.ReadChunkRequest";
      };
      return ReadChunkRequest;
    }();
    insole2.ReadChunkResponse = function() {
      function ReadChunkResponse(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      ReadChunkResponse.prototype.ok = false;
      ReadChunkResponse.prototype.total = 0;
      ReadChunkResponse.prototype.summary = null;
      ReadChunkResponse.create = function create(properties) {
        return new ReadChunkResponse(properties);
      };
      ReadChunkResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).bool(message.ok);
        if (message.total != null && Object.hasOwnProperty.call(message, "total"))
          writer.uint32(
            /* id 2, wireType 0 =*/
            16
          ).uint32(message.total);
        if (message.summary != null && Object.hasOwnProperty.call(message, "summary"))
          $root.insole.GaitSummary.encode(message.summary, writer.uint32(
            /* id 3, wireType 2 =*/
            26
          ).fork(), q + 1).ldelim();
        return writer;
      };
      ReadChunkResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      ReadChunkResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.ReadChunkResponse();
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
              message.summary = $root.insole.GaitSummary.decode(reader, reader.uint32(), void 0, long + 1);
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };
      ReadChunkResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      ReadChunkResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok")) {
          if (typeof message.ok !== "boolean")
            return "ok: boolean expected";
        }
        if (message.total != null && Object.hasOwnProperty.call(message, "total")) {
          if (!$util.isInteger(message.total))
            return "total: integer expected";
        }
        if (message.summary != null && Object.hasOwnProperty.call(message, "summary")) {
          let error = $root.insole.GaitSummary.verify(message.summary, long + 1);
          if (error)
            return "summary." + error;
        }
        return null;
      };
      ReadChunkResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.ReadChunkResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.ReadChunkResponse: object expected");
        if (long === void 0)
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
      ReadChunkResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      ReadChunkResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      ReadChunkResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.ReadChunkResponse";
      };
      return ReadChunkResponse;
    }();
    insole2.GaitEvent = function() {
      function GaitEvent(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      GaitEvent.prototype.sessionId = 0;
      GaitEvent.prototype.tRelMs = 0;
      GaitEvent.prototype.seq = 0;
      GaitEvent.prototype.type = 0;
      GaitEvent.prototype.footStrike = 0;
      GaitEvent.prototype.value = 0;
      GaitEvent.create = function create(properties) {
        return new GaitEvent(properties);
      };
      GaitEvent.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).uint32(message.sessionId);
        if (message.tRelMs != null && Object.hasOwnProperty.call(message, "tRelMs"))
          writer.uint32(
            /* id 2, wireType 0 =*/
            16
          ).uint32(message.tRelMs);
        if (message.seq != null && Object.hasOwnProperty.call(message, "seq"))
          writer.uint32(
            /* id 3, wireType 0 =*/
            24
          ).uint32(message.seq);
        if (message.type != null && Object.hasOwnProperty.call(message, "type"))
          writer.uint32(
            /* id 4, wireType 0 =*/
            32
          ).uint32(message.type);
        if (message.footStrike != null && Object.hasOwnProperty.call(message, "footStrike"))
          writer.uint32(
            /* id 5, wireType 0 =*/
            40
          ).uint32(message.footStrike);
        if (message.value != null && Object.hasOwnProperty.call(message, "value"))
          writer.uint32(
            /* id 6, wireType 5 =*/
            53
          ).float(message.value);
        return writer;
      };
      GaitEvent.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      GaitEvent.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.GaitEvent();
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
      GaitEvent.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      GaitEvent.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.sessionId != null && Object.hasOwnProperty.call(message, "sessionId")) {
          if (!$util.isInteger(message.sessionId))
            return "sessionId: integer expected";
        }
        if (message.tRelMs != null && Object.hasOwnProperty.call(message, "tRelMs")) {
          if (!$util.isInteger(message.tRelMs))
            return "tRelMs: integer expected";
        }
        if (message.seq != null && Object.hasOwnProperty.call(message, "seq")) {
          if (!$util.isInteger(message.seq))
            return "seq: integer expected";
        }
        if (message.type != null && Object.hasOwnProperty.call(message, "type")) {
          if (!$util.isInteger(message.type))
            return "type: integer expected";
        }
        if (message.footStrike != null && Object.hasOwnProperty.call(message, "footStrike")) {
          if (!$util.isInteger(message.footStrike))
            return "footStrike: integer expected";
        }
        if (message.value != null && Object.hasOwnProperty.call(message, "value")) {
          if (typeof message.value !== "number")
            return "value: number expected";
        }
        return null;
      };
      GaitEvent.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.GaitEvent)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.GaitEvent: object expected");
        if (long === void 0)
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
      GaitEvent.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      GaitEvent.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      GaitEvent.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.GaitEvent";
      };
      return GaitEvent;
    }();
    insole2.ReadEventRequest = function() {
      function ReadEventRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      ReadEventRequest.prototype.index = 0;
      ReadEventRequest.create = function create(properties) {
        return new ReadEventRequest(properties);
      };
      ReadEventRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.index != null && Object.hasOwnProperty.call(message, "index"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).uint32(message.index);
        return writer;
      };
      ReadEventRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      ReadEventRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.ReadEventRequest();
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
      ReadEventRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      ReadEventRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.index != null && Object.hasOwnProperty.call(message, "index")) {
          if (!$util.isInteger(message.index))
            return "index: integer expected";
        }
        return null;
      };
      ReadEventRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.ReadEventRequest)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.ReadEventRequest: object expected");
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let message = new $root.insole.ReadEventRequest();
        if (object.index != null)
          message.index = object.index >>> 0;
        return message;
      };
      ReadEventRequest.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      ReadEventRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      ReadEventRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.ReadEventRequest";
      };
      return ReadEventRequest;
    }();
    insole2.ReadEventResponse = function() {
      function ReadEventResponse(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      ReadEventResponse.prototype.ok = false;
      ReadEventResponse.prototype.total = 0;
      ReadEventResponse.prototype.event = null;
      ReadEventResponse.create = function create(properties) {
        return new ReadEventResponse(properties);
      };
      ReadEventResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).bool(message.ok);
        if (message.total != null && Object.hasOwnProperty.call(message, "total"))
          writer.uint32(
            /* id 2, wireType 0 =*/
            16
          ).uint32(message.total);
        if (message.event != null && Object.hasOwnProperty.call(message, "event"))
          $root.insole.GaitEvent.encode(message.event, writer.uint32(
            /* id 3, wireType 2 =*/
            26
          ).fork(), q + 1).ldelim();
        return writer;
      };
      ReadEventResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      ReadEventResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.ReadEventResponse();
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
              message.event = $root.insole.GaitEvent.decode(reader, reader.uint32(), void 0, long + 1);
              break;
            }
            default:
              reader.skipType(tag & 7, long);
              break;
          }
        }
        return message;
      };
      ReadEventResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      ReadEventResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.ok != null && Object.hasOwnProperty.call(message, "ok")) {
          if (typeof message.ok !== "boolean")
            return "ok: boolean expected";
        }
        if (message.total != null && Object.hasOwnProperty.call(message, "total")) {
          if (!$util.isInteger(message.total))
            return "total: integer expected";
        }
        if (message.event != null && Object.hasOwnProperty.call(message, "event")) {
          let error = $root.insole.GaitEvent.verify(message.event, long + 1);
          if (error)
            return "event." + error;
        }
        return null;
      };
      ReadEventResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.ReadEventResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.ReadEventResponse: object expected");
        if (long === void 0)
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
      ReadEventResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      ReadEventResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      ReadEventResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.ReadEventResponse";
      };
      return ReadEventResponse;
    }();
    insole2.GetFaultLogRequest = function() {
      function GetFaultLogRequest(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      GetFaultLogRequest.create = function create(properties) {
        return new GetFaultLogRequest(properties);
      };
      GetFaultLogRequest.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        return writer;
      };
      GetFaultLogRequest.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      GetFaultLogRequest.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.GetFaultLogRequest();
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
      GetFaultLogRequest.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      GetFaultLogRequest.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        return null;
      };
      GetFaultLogRequest.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.GetFaultLogRequest)
          return object;
        return new $root.insole.GetFaultLogRequest();
      };
      GetFaultLogRequest.toObject = function toObject() {
        return {};
      };
      GetFaultLogRequest.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      GetFaultLogRequest.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.GetFaultLogRequest";
      };
      return GetFaultLogRequest;
    }();
    insole2.GetFaultLogResponse = function() {
      function GetFaultLogResponse(properties) {
        if (properties) {
          for (let keys = Object.keys(properties), i = 0; i < keys.length; ++i)
            if (properties[keys[i]] != null && keys[i] !== "__proto__")
              this[keys[i]] = properties[keys[i]];
        }
      }
      GetFaultLogResponse.prototype.valid = false;
      GetFaultLogResponse.prototype.bootCount = 0;
      GetFaultLogResponse.prototype.faultCount = 0;
      GetFaultLogResponse.prototype.softCount = 0;
      GetFaultLogResponse.prototype.fatalReason = 0;
      GetFaultLogResponse.prototype.fatalPc = 0;
      GetFaultLogResponse.prototype.fatalLr = 0;
      GetFaultLogResponse.prototype.fatalUptimeMs = 0;
      GetFaultLogResponse.prototype.fatalThread = "";
      GetFaultLogResponse.prototype.fatalDetail = "";
      GetFaultLogResponse.prototype.softReason = 0;
      GetFaultLogResponse.prototype.softExtra = 0;
      GetFaultLogResponse.prototype.softUptimeMs = 0;
      GetFaultLogResponse.prototype.softThread = "";
      GetFaultLogResponse.prototype.softDetail = "";
      GetFaultLogResponse.prototype.samplerStackFree = 0;
      GetFaultLogResponse.prototype.gaitUpdateMaxUs = 0;
      GetFaultLogResponse.prototype.gaitFlushMaxMs = 0;
      GetFaultLogResponse.prototype.resetCause = 0;
      GetFaultLogResponse.prototype.samplesDropped = 0;
      GetFaultLogResponse.create = function create(properties) {
        return new GetFaultLogResponse(properties);
      };
      GetFaultLogResponse.encode = function encode(message, writer, q) {
        if (!writer)
          writer = $Writer.create();
        if (q === void 0)
          q = 0;
        if (q > $util.recursionLimit)
          throw Error("max depth exceeded");
        if (message.valid != null && Object.hasOwnProperty.call(message, "valid"))
          writer.uint32(
            /* id 1, wireType 0 =*/
            8
          ).bool(message.valid);
        if (message.bootCount != null && Object.hasOwnProperty.call(message, "bootCount"))
          writer.uint32(
            /* id 2, wireType 0 =*/
            16
          ).uint32(message.bootCount);
        if (message.faultCount != null && Object.hasOwnProperty.call(message, "faultCount"))
          writer.uint32(
            /* id 3, wireType 0 =*/
            24
          ).uint32(message.faultCount);
        if (message.softCount != null && Object.hasOwnProperty.call(message, "softCount"))
          writer.uint32(
            /* id 4, wireType 0 =*/
            32
          ).uint32(message.softCount);
        if (message.fatalReason != null && Object.hasOwnProperty.call(message, "fatalReason"))
          writer.uint32(
            /* id 5, wireType 0 =*/
            40
          ).uint32(message.fatalReason);
        if (message.fatalPc != null && Object.hasOwnProperty.call(message, "fatalPc"))
          writer.uint32(
            /* id 6, wireType 0 =*/
            48
          ).uint32(message.fatalPc);
        if (message.fatalLr != null && Object.hasOwnProperty.call(message, "fatalLr"))
          writer.uint32(
            /* id 7, wireType 0 =*/
            56
          ).uint32(message.fatalLr);
        if (message.fatalUptimeMs != null && Object.hasOwnProperty.call(message, "fatalUptimeMs"))
          writer.uint32(
            /* id 8, wireType 0 =*/
            64
          ).uint32(message.fatalUptimeMs);
        if (message.fatalThread != null && Object.hasOwnProperty.call(message, "fatalThread"))
          writer.uint32(
            /* id 9, wireType 2 =*/
            74
          ).string(message.fatalThread);
        if (message.fatalDetail != null && Object.hasOwnProperty.call(message, "fatalDetail"))
          writer.uint32(
            /* id 10, wireType 2 =*/
            82
          ).string(message.fatalDetail);
        if (message.softReason != null && Object.hasOwnProperty.call(message, "softReason"))
          writer.uint32(
            /* id 11, wireType 0 =*/
            88
          ).uint32(message.softReason);
        if (message.softExtra != null && Object.hasOwnProperty.call(message, "softExtra"))
          writer.uint32(
            /* id 12, wireType 0 =*/
            96
          ).uint32(message.softExtra);
        if (message.softUptimeMs != null && Object.hasOwnProperty.call(message, "softUptimeMs"))
          writer.uint32(
            /* id 13, wireType 0 =*/
            104
          ).uint32(message.softUptimeMs);
        if (message.softThread != null && Object.hasOwnProperty.call(message, "softThread"))
          writer.uint32(
            /* id 14, wireType 2 =*/
            114
          ).string(message.softThread);
        if (message.softDetail != null && Object.hasOwnProperty.call(message, "softDetail"))
          writer.uint32(
            /* id 15, wireType 2 =*/
            122
          ).string(message.softDetail);
        if (message.samplerStackFree != null && Object.hasOwnProperty.call(message, "samplerStackFree"))
          writer.uint32(
            /* id 16, wireType 0 =*/
            128
          ).uint32(message.samplerStackFree);
        if (message.gaitUpdateMaxUs != null && Object.hasOwnProperty.call(message, "gaitUpdateMaxUs"))
          writer.uint32(
            /* id 17, wireType 0 =*/
            136
          ).uint32(message.gaitUpdateMaxUs);
        if (message.gaitFlushMaxMs != null && Object.hasOwnProperty.call(message, "gaitFlushMaxMs"))
          writer.uint32(
            /* id 18, wireType 0 =*/
            144
          ).uint32(message.gaitFlushMaxMs);
        if (message.resetCause != null && Object.hasOwnProperty.call(message, "resetCause"))
          writer.uint32(
            /* id 19, wireType 0 =*/
            152
          ).uint32(message.resetCause);
        if (message.samplesDropped != null && Object.hasOwnProperty.call(message, "samplesDropped"))
          writer.uint32(
            /* id 20, wireType 0 =*/
            160
          ).uint32(message.samplesDropped);
        return writer;
      };
      GetFaultLogResponse.encodeDelimited = function encodeDelimited(message, writer) {
        return this.encode(message, writer && writer.len ? writer.fork() : writer).ldelim();
      };
      GetFaultLogResponse.decode = function decode(reader, length, error, long) {
        if (!(reader instanceof $Reader))
          reader = $Reader.create(reader);
        if (long === void 0)
          long = 0;
        if (long > $Reader.recursionLimit)
          throw Error("maximum nesting depth exceeded");
        let end = length === void 0 ? reader.len : reader.pos + length, message = new $root.insole.GetFaultLogResponse();
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
      GetFaultLogResponse.decodeDelimited = function decodeDelimited(reader) {
        if (!(reader instanceof $Reader))
          reader = new $Reader(reader);
        return this.decode(reader, reader.uint32());
      };
      GetFaultLogResponse.verify = function verify(message, long) {
        if (typeof message !== "object" || message === null)
          return "object expected";
        if (long === void 0)
          long = 0;
        if (long > $util.recursionLimit)
          return "maximum nesting depth exceeded";
        if (message.valid != null && Object.hasOwnProperty.call(message, "valid")) {
          if (typeof message.valid !== "boolean")
            return "valid: boolean expected";
        }
        if (message.bootCount != null && Object.hasOwnProperty.call(message, "bootCount")) {
          if (!$util.isInteger(message.bootCount))
            return "bootCount: integer expected";
        }
        if (message.faultCount != null && Object.hasOwnProperty.call(message, "faultCount")) {
          if (!$util.isInteger(message.faultCount))
            return "faultCount: integer expected";
        }
        if (message.softCount != null && Object.hasOwnProperty.call(message, "softCount")) {
          if (!$util.isInteger(message.softCount))
            return "softCount: integer expected";
        }
        if (message.fatalReason != null && Object.hasOwnProperty.call(message, "fatalReason")) {
          if (!$util.isInteger(message.fatalReason))
            return "fatalReason: integer expected";
        }
        if (message.fatalPc != null && Object.hasOwnProperty.call(message, "fatalPc")) {
          if (!$util.isInteger(message.fatalPc))
            return "fatalPc: integer expected";
        }
        if (message.fatalLr != null && Object.hasOwnProperty.call(message, "fatalLr")) {
          if (!$util.isInteger(message.fatalLr))
            return "fatalLr: integer expected";
        }
        if (message.fatalUptimeMs != null && Object.hasOwnProperty.call(message, "fatalUptimeMs")) {
          if (!$util.isInteger(message.fatalUptimeMs))
            return "fatalUptimeMs: integer expected";
        }
        if (message.fatalThread != null && Object.hasOwnProperty.call(message, "fatalThread")) {
          if (!$util.isString(message.fatalThread))
            return "fatalThread: string expected";
        }
        if (message.fatalDetail != null && Object.hasOwnProperty.call(message, "fatalDetail")) {
          if (!$util.isString(message.fatalDetail))
            return "fatalDetail: string expected";
        }
        if (message.softReason != null && Object.hasOwnProperty.call(message, "softReason")) {
          if (!$util.isInteger(message.softReason))
            return "softReason: integer expected";
        }
        if (message.softExtra != null && Object.hasOwnProperty.call(message, "softExtra")) {
          if (!$util.isInteger(message.softExtra))
            return "softExtra: integer expected";
        }
        if (message.softUptimeMs != null && Object.hasOwnProperty.call(message, "softUptimeMs")) {
          if (!$util.isInteger(message.softUptimeMs))
            return "softUptimeMs: integer expected";
        }
        if (message.softThread != null && Object.hasOwnProperty.call(message, "softThread")) {
          if (!$util.isString(message.softThread))
            return "softThread: string expected";
        }
        if (message.softDetail != null && Object.hasOwnProperty.call(message, "softDetail")) {
          if (!$util.isString(message.softDetail))
            return "softDetail: string expected";
        }
        if (message.samplerStackFree != null && Object.hasOwnProperty.call(message, "samplerStackFree")) {
          if (!$util.isInteger(message.samplerStackFree))
            return "samplerStackFree: integer expected";
        }
        if (message.gaitUpdateMaxUs != null && Object.hasOwnProperty.call(message, "gaitUpdateMaxUs")) {
          if (!$util.isInteger(message.gaitUpdateMaxUs))
            return "gaitUpdateMaxUs: integer expected";
        }
        if (message.gaitFlushMaxMs != null && Object.hasOwnProperty.call(message, "gaitFlushMaxMs")) {
          if (!$util.isInteger(message.gaitFlushMaxMs))
            return "gaitFlushMaxMs: integer expected";
        }
        if (message.resetCause != null && Object.hasOwnProperty.call(message, "resetCause")) {
          if (!$util.isInteger(message.resetCause))
            return "resetCause: integer expected";
        }
        if (message.samplesDropped != null && Object.hasOwnProperty.call(message, "samplesDropped")) {
          if (!$util.isInteger(message.samplesDropped))
            return "samplesDropped: integer expected";
        }
        return null;
      };
      GetFaultLogResponse.fromObject = function fromObject(object, long) {
        if (object instanceof $root.insole.GetFaultLogResponse)
          return object;
        if (!$util.isObject(object))
          throw TypeError(".insole.GetFaultLogResponse: object expected");
        if (long === void 0)
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
      GetFaultLogResponse.toObject = function toObject(message, options, q) {
        if (!options)
          options = {};
        if (q === void 0)
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
      GetFaultLogResponse.prototype.toJSON = function toJSON() {
        return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
      };
      GetFaultLogResponse.getTypeUrl = function getTypeUrl(typeUrlPrefix) {
        if (typeUrlPrefix === void 0) {
          typeUrlPrefix = "type.googleapis.com";
        }
        return typeUrlPrefix + "/insole.GetFaultLogResponse";
      };
      return GetFaultLogResponse;
    }();
    return insole2;
  })();

  // src/client/GeneratedClient.ts
  var GeneratedClient = class {
    async echo({ message = "" } = {}) {
      const req = insole.EchoRequest.create({ message });
      const respData = await this.call("echo", insole.EchoRequest.encode(req).finish());
      return insole.EchoResponse.decode(respData);
    }
    async setTime({ epochMs = 0 } = {}) {
      const req = insole.SetTimeRequest.create({ epochMs });
      const respData = await this.call("set_time", insole.SetTimeRequest.encode(req).finish());
      return insole.SetTimeResponse.decode(respData);
    }
    async getWindow({ startMs = 0 } = {}) {
      const req = insole.GetWindowRequest.create({ startMs });
      const respData = await this.call("get_window", insole.GetWindowRequest.encode(req).finish());
      return insole.GetWindowResponse.decode(respData);
    }
    async setDeviceId({
      deviceId = 0
    } = {}) {
      const req = insole.SetDeviceIdRequest.create({ deviceId });
      const respData = await this.call("set_device_id", insole.SetDeviceIdRequest.encode(req).finish());
      return insole.SetDeviceIdResponse.decode(respData);
    }
    async setFoot({ foot = 0 } = {}) {
      const req = insole.SetFootRequest.create({ foot });
      const respData = await this.call("set_foot", insole.SetFootRequest.encode(req).finish());
      return insole.SetFootResponse.decode(respData);
    }
    async getConfig() {
      const req = insole.GetConfigRequest.create({});
      const respData = await this.call("get_config", insole.GetConfigRequest.encode(req).finish());
      return insole.GetConfigResponse.decode(respData);
    }
    async setLogUnit({
      timeUnitSec = 0,
      distanceUnitCode = 0
    } = {}) {
      const req = insole.SetLogUnitRequest.create({ timeUnitSec, distanceUnitCode });
      const respData = await this.call("set_log_unit", insole.SetLogUnitRequest.encode(req).finish());
      return insole.SetLogUnitResponse.decode(respData);
    }
    async otaBegin({ totalSize = 0 } = {}) {
      const req = insole.OtaBeginRequest.create({ totalSize });
      const respData = await this.call("ota_begin", insole.OtaBeginRequest.encode(req).finish());
      return insole.OtaBeginResponse.decode(respData);
    }
    async otaWrite({
      offset = 0,
      data = new Uint8Array(0)
    } = {}) {
      const req = insole.OtaWriteRequest.create({ offset, data });
      const respData = await this.call("ota_write", insole.OtaWriteRequest.encode(req).finish());
      return insole.OtaWriteResponse.decode(respData);
    }
    async otaApply() {
      const req = insole.OtaApplyRequest.create({});
      const respData = await this.call("ota_apply", insole.OtaApplyRequest.encode(req).finish());
      return insole.OtaApplyResponse.decode(respData);
    }
    async startMeasurement({
      activityId = 0
    } = {}) {
      const req = insole.StartMeasurementRequest.create({ activityId });
      const respData = await this.call("start_measurement", insole.StartMeasurementRequest.encode(req).finish());
      return insole.StartMeasurementResponse.decode(respData);
    }
    async stopMeasurement() {
      const req = insole.StopMeasurementRequest.create({});
      const respData = await this.call("stop_measurement", insole.StopMeasurementRequest.encode(req).finish());
      return insole.StopMeasurementResponse.decode(respData);
    }
    async listLogs() {
      const req = insole.ListLogsRequest.create({});
      const respData = await this.call("list_logs", insole.ListLogsRequest.encode(req).finish());
      return insole.ListLogsResponse.decode(respData);
    }
    async readLog({ index = 0 } = {}) {
      const req = insole.ReadLogRequest.create({ index });
      const respData = await this.call("read_log", insole.ReadLogRequest.encode(req).finish());
      return insole.ReadLogResponse.decode(respData);
    }
    async eraseLogs() {
      const req = insole.EraseLogsRequest.create({});
      const respData = await this.call("erase_logs", insole.EraseLogsRequest.encode(req).finish());
      return insole.EraseLogsResponse.decode(respData);
    }
    async getGaitLive() {
      const req = insole.GetGaitLiveRequest.create({});
      const respData = await this.call("get_gait_live", insole.GetGaitLiveRequest.encode(req).finish());
      return insole.GetGaitLiveResponse.decode(respData);
    }
    async readChunk({ index = 0 } = {}) {
      const req = insole.ReadChunkRequest.create({ index });
      const respData = await this.call("read_chunk", insole.ReadChunkRequest.encode(req).finish());
      return insole.ReadChunkResponse.decode(respData);
    }
    async readEvent({ index = 0 } = {}) {
      const req = insole.ReadEventRequest.create({ index });
      const respData = await this.call("read_event", insole.ReadEventRequest.encode(req).finish());
      return insole.ReadEventResponse.decode(respData);
    }
    async getFaultLog() {
      const req = insole.GetFaultLogRequest.create({});
      const respData = await this.call("get_fault_log", insole.GetFaultLogRequest.encode(req).finish());
      return insole.GetFaultLogResponse.decode(respData);
    }
  };

  // src/client/knownKeys.ts
  var STORE_KEY = "blerpc_known_keys";
  var LocalStorageKnownKeyStore = class _LocalStorageKnownKeyStore {
    constructor(keys) {
      this.dirty = false;
      this.keys = keys;
    }
    /** Load the store. Call before the key exchange. */
    static async load() {
      let keys = {};
      try {
        const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORE_KEY) : null;
        if (raw) keys = JSON.parse(raw);
      } catch {
      }
      return new _LocalStorageKnownKeyStore(keys);
    }
    get(deviceId) {
      return this.keys[deviceId] ?? null;
    }
    put(deviceId, hexEd25519Pubkey) {
      this.keys[deviceId] = hexEd25519Pubkey;
      this.dirty = true;
    }
    /** Flush newly pinned keys to storage. Call after a successful key exchange. */
    async persist() {
      if (!this.dirty) return;
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(STORE_KEY, JSON.stringify(this.keys));
        }
        this.dirty = false;
      } catch {
      }
    }
  };

  // src/client/BlerpcClient.ts
  var PayloadTooLargeError = class extends Error {
    constructor(actual, limit) {
      super(`Request payload (${actual} bytes) exceeds peripheral limit (${limit} bytes)`);
      this.actual = actual;
      this.limit = limit;
    }
  };
  var ResponseTooLargeError = class extends Error {
    constructor(message) {
      super(`ResponseTooLargeError: ${message}`);
    }
  };
  var PeripheralErrorException = class extends Error {
    constructor(errorCode) {
      super(`PeripheralErrorException: 0x${errorCode.toString(16).padStart(2, "0")}`);
      this.errorCode = errorCode;
    }
  };
  var ProtocolException = class extends Error {
    constructor(message) {
      super(`ProtocolException: ${message}`);
    }
  };
  var BlerpcClient = class extends GeneratedClient {
    constructor(transport = new WebBluetoothTransport(), requireEncryption = true, pinIdentity = true) {
      super();
      this._splitter = null;
      this._assembler = new import_protocol_ts.ContainerAssembler();
      this._timeout = 100;
      this._maxRequestPayloadSize = null;
      // Encryption state
      this._session = null;
      this._peerAddress = null;
      this._knownKeys = null;
      this.transport = transport;
      this.requireEncryption = requireEncryption;
      this.pinIdentity = pinIdentity;
    }
    get mtu() {
      return this.transport.mtu;
    }
    get isEncrypted() {
      return this._session !== null;
    }
    get maxRequestPayloadSize() {
      return this._maxRequestPayloadSize;
    }
    _readTimeout(firstRead) {
      if (!firstRead) return this._timeout;
      return this._timeout > 2e3 ? this._timeout : 2e3;
    }
    _handleControlError(container) {
      if (container.controlCmd === import_protocol_ts.ControlCmd.ERROR && container.payload.length > 0) {
        const errorCode = container.payload[0];
        if (errorCode === import_protocol_ts.BLERPC_ERROR_RESPONSE_TOO_LARGE) {
          throw new ResponseTooLargeError("Response exceeds peripheral's max_response_payload_size");
        }
        throw new PeripheralErrorException(errorCode);
      }
    }
    async scan(timeout) {
      return this.transport.scan(timeout ?? 5e3);
    }
    async connect(device) {
      this._peerAddress = device.address;
      if (this.pinIdentity) {
        this._knownKeys = await LocalStorageKnownKeyStore.load();
      }
      await this.transport.connect(device);
      this._splitter = new import_protocol_ts.ContainerSplitter(this.transport.mtu);
      try {
        await this._requestTimeout();
      } catch {
        console.log("Peripheral did not respond to timeout request, using default");
      }
      try {
        await this._requestCapabilities();
      } catch {
        console.log("Peripheral did not respond to capabilities request");
      }
      if (this.requireEncryption && this._session === null) {
        throw new Error(
          "Encryption required but key exchange was not completed. The peripheral may not support encryption or a MitM may have stripped the encryption capability flag."
        );
      }
    }
    async _requestTimeout() {
      const s = this._splitter;
      const tid = s.nextTransactionId();
      const req = (0, import_protocol_ts.makeTimeoutRequest)(tid);
      await this.transport.write(req.serialize());
      const data = await this.transport.readNotify(1e3);
      const resp = import_protocol_ts.Container.deserialize(data);
      if (resp.containerType === import_protocol_ts.ContainerType.CONTROL && resp.controlCmd === import_protocol_ts.ControlCmd.TIMEOUT && resp.payload.length === 2) {
        const bd = new DataView(
          resp.payload.buffer,
          resp.payload.byteOffset,
          resp.payload.byteLength
        );
        const ms = bd.getUint16(0, true);
        this._timeout = ms;
        console.log(`Peripheral timeout: ${ms}ms`);
      }
    }
    async _requestCapabilities() {
      const s = this._splitter;
      const tid = s.nextTransactionId();
      const req = (0, import_protocol_ts.makeCapabilitiesRequest)(tid);
      await this.transport.write(req.serialize());
      const data = await this.transport.readNotify(1e3);
      const resp = import_protocol_ts.Container.deserialize(data);
      if (resp.containerType === import_protocol_ts.ContainerType.CONTROL && resp.controlCmd === import_protocol_ts.ControlCmd.CAPABILITIES && resp.payload.length >= 6) {
        const bd = new DataView(
          resp.payload.buffer,
          resp.payload.byteOffset,
          resp.payload.byteLength
        );
        const maxReq = bd.getUint16(0, true);
        const flags = bd.getUint16(4, true);
        this._maxRequestPayloadSize = maxReq;
        console.log(
          `Capabilities: max_req=${maxReq}, flags=0x${flags.toString(16).padStart(4, "0")}`
        );
        if (flags & import_protocol_ts.CAPABILITY_FLAG_ENCRYPTION_SUPPORTED) {
          await this._performKeyExchange();
        }
      }
    }
    async _performKeyExchange() {
      const s = this._splitter;
      const knownKeys = this._knownKeys;
      try {
        this._session = await (0, import_protocol_ts.centralPerformKeyExchange)({
          send: async (payload) => {
            const tid = s.nextTransactionId();
            const req = (0, import_protocol_ts.makeKeyExchange)(tid, payload);
            await this.transport.write(req.serialize());
          },
          receive: async () => {
            const data = await this.transport.readNotify(2e3);
            const resp = import_protocol_ts.Container.deserialize(data);
            if (resp.containerType !== import_protocol_ts.ContainerType.CONTROL || resp.controlCmd !== import_protocol_ts.ControlCmd.KEY_EXCHANGE) {
              throw new Error("Expected KEY_EXCHANGE response, got something else");
            }
            return resp.payload;
          },
          knownKeys: knownKeys ?? void 0,
          deviceId: this._peerAddress ?? void 0,
          pinIdentity: this.pinIdentity
        });
        await knownKeys?.persist();
        console.log("E2E encryption established");
      } catch (e) {
        console.log("Key exchange failed:", e);
        if (this.requireEncryption) throw e;
      }
    }
    _encryptPayload(payload) {
      if (this._session === null) {
        if (this.requireEncryption) {
          throw new Error("Encryption required but no session established");
        }
        return payload;
      }
      return this._session.encrypt(payload);
    }
    _decryptPayload(payload) {
      if (this._session === null) {
        if (this.requireEncryption) {
          throw new Error("Encryption required but no session established");
        }
        return payload;
      }
      return this._session.decrypt(payload);
    }
    async call(cmdName, requestData) {
      const s = this._splitter ?? (() => {
        throw new Error("Not connected");
      })();
      const cmd = new import_protocol_ts.CommandPacket({
        cmdType: import_protocol_ts.CommandType.REQUEST,
        cmdName,
        data: requestData
      });
      const payload = cmd.serialize();
      if (this._maxRequestPayloadSize !== null && payload.length > this._maxRequestPayloadSize) {
        throw new PayloadTooLargeError(payload.length, this._maxRequestPayloadSize);
      }
      const sendPayload = this._encryptPayload(payload);
      const containers = s.split(sendPayload);
      for (const c of containers) {
        await this.transport.write(c.serialize());
      }
      this._assembler.reset();
      let firstRead = true;
      for (; ; ) {
        const notifyData = await this.transport.readNotify(this._readTimeout(firstRead));
        firstRead = false;
        const container = import_protocol_ts.Container.deserialize(notifyData);
        if (container.containerType === import_protocol_ts.ContainerType.CONTROL) {
          this._handleControlError(container);
          continue;
        }
        const result = this._assembler.feed(container);
        if (result !== null) {
          const decrypted = this._decryptPayload(result);
          const resp = import_protocol_ts.CommandPacket.deserialize(decrypted);
          if (resp.cmdType !== import_protocol_ts.CommandType.RESPONSE) {
            throw new ProtocolException(`Expected response, got type=${resp.cmdType}`);
          }
          if (resp.cmdName !== cmdName) {
            throw new ProtocolException(
              `Command name mismatch: expected '${cmdName}', got '${resp.cmdName}'`
            );
          }
          return resp.data;
        }
      }
    }
    async streamReceive(cmdName, requestData) {
      const s = this._splitter ?? (() => {
        throw new Error("Not connected");
      })();
      const cmd = new import_protocol_ts.CommandPacket({
        cmdType: import_protocol_ts.CommandType.REQUEST,
        cmdName,
        data: requestData
      });
      const payload = cmd.serialize();
      if (this._maxRequestPayloadSize !== null && payload.length > this._maxRequestPayloadSize) {
        throw new PayloadTooLargeError(payload.length, this._maxRequestPayloadSize);
      }
      const sendPayload = this._encryptPayload(payload);
      const containers = s.split(sendPayload);
      for (const c of containers) {
        await this.transport.write(c.serialize());
      }
      const results = [];
      this._assembler.reset();
      let firstRead = true;
      for (; ; ) {
        const notifyData = await this.transport.readNotify(this._readTimeout(firstRead));
        firstRead = false;
        const container = import_protocol_ts.Container.deserialize(notifyData);
        if (container.containerType === import_protocol_ts.ContainerType.CONTROL) {
          if (container.controlCmd === import_protocol_ts.ControlCmd.STREAM_END_P2C) break;
          this._handleControlError(container);
          continue;
        }
        const result = this._assembler.feed(container);
        if (result !== null) {
          const decrypted = this._decryptPayload(result);
          const resp = import_protocol_ts.CommandPacket.deserialize(decrypted);
          if (resp.cmdType !== import_protocol_ts.CommandType.RESPONSE) {
            throw new ProtocolException(`Expected response, got type=${resp.cmdType}`);
          }
          results.push(resp.data);
        }
      }
      return results;
    }
    async streamSend(cmdName, messages, finalCmdName) {
      const s = this._splitter ?? (() => {
        throw new Error("Not connected");
      })();
      for (const msgData of messages) {
        const cmd = new import_protocol_ts.CommandPacket({
          cmdType: import_protocol_ts.CommandType.REQUEST,
          cmdName,
          data: msgData
        });
        const payload = cmd.serialize();
        const sendPayload = this._encryptPayload(payload);
        const containers = s.split(sendPayload);
        for (const c of containers) {
          await this.transport.write(c.serialize());
        }
      }
      const tid = s.nextTransactionId();
      const streamEnd = (0, import_protocol_ts.makeStreamEndC2P)(tid);
      await this.transport.write(streamEnd.serialize());
      this._assembler.reset();
      let firstRead = true;
      for (; ; ) {
        const notifyData = await this.transport.readNotify(this._readTimeout(firstRead));
        firstRead = false;
        const container = import_protocol_ts.Container.deserialize(notifyData);
        if (container.containerType === import_protocol_ts.ContainerType.CONTROL) {
          this._handleControlError(container);
          continue;
        }
        const result = this._assembler.feed(container);
        if (result !== null) {
          const decrypted = this._decryptPayload(result);
          const resp = import_protocol_ts.CommandPacket.deserialize(decrypted);
          if (resp.cmdType !== import_protocol_ts.CommandType.RESPONSE) {
            throw new ProtocolException(`Expected response, got type=${resp.cmdType}`);
          }
          if (resp.cmdName !== finalCmdName) {
            throw new ProtocolException(
              `Command name mismatch: expected '${finalCmdName}', got '${resp.cmdName}'`
            );
          }
          return resp.data;
        }
      }
    }
    disconnect() {
      this.transport.disconnect();
      this._session = null;
      this._splitter = null;
    }
  };

  // src/client/InsoleClient.ts
  var WINDOW_MS = 100;
  var SAMPLE_PERIOD_MS = 5;
  var FOOT_NAME = {
    0: "unspecified",
    1: "left",
    2: "right"
  };
  var DEG2RAD = Math.PI / 180;
  var MADGWICK_BETA = 0.1;
  function updateMadgwickImu(q, gx, gy, gz, ax, ay, az, dt, beta = MADGWICK_BETA) {
    let [q0, q1, q2, q3] = q;
    let qDot0 = 0.5 * (-q1 * gx - q2 * gy - q3 * gz);
    let qDot1 = 0.5 * (q0 * gx + q2 * gz - q3 * gy);
    let qDot2 = 0.5 * (q0 * gy - q1 * gz + q3 * gx);
    let qDot3 = 0.5 * (q0 * gz + q1 * gy - q2 * gx);
    const anorm = Math.hypot(ax, ay, az);
    if (anorm > 0) {
      ax /= anorm;
      ay /= anorm;
      az /= anorm;
      const _2q0 = 2 * q0;
      const _2q1 = 2 * q1;
      const _2q2 = 2 * q2;
      const _2q3 = 2 * q3;
      const _4q0 = 4 * q0;
      const _4q1 = 4 * q1;
      const _4q2 = 4 * q2;
      const _8q1 = 8 * q1;
      const _8q2 = 8 * q2;
      const q0q0 = q0 * q0;
      const q1q1 = q1 * q1;
      const q2q2 = q2 * q2;
      const q3q3 = q3 * q3;
      let s0 = _4q0 * q2q2 + _2q2 * ax + _4q0 * q1q1 - _2q1 * ay;
      let s1 = _4q1 * q3q3 - _2q3 * ax + 4 * q0q0 * q1 - _2q0 * ay - _4q1 + _8q1 * q1q1 + _8q1 * q2q2 + _4q1 * az;
      let s2 = 4 * q0q0 * q2 + _2q0 * ax + _4q2 * q3q3 - _2q3 * ay - _4q2 + _8q2 * q1q1 + _8q2 * q2q2 + _4q2 * az;
      let s3 = 4 * q1q1 * q3 - _2q1 * ax + 4 * q2q2 * q3 - _2q2 * ay;
      const snorm = Math.hypot(s0, s1, s2, s3);
      if (snorm > 0) {
        s0 /= snorm;
        s1 /= snorm;
        s2 /= snorm;
        s3 /= snorm;
        qDot0 -= beta * s0;
        qDot1 -= beta * s1;
        qDot2 -= beta * s2;
        qDot3 -= beta * s3;
      }
    }
    q0 += qDot0 * dt;
    q1 += qDot1 * dt;
    q2 += qDot2 * dt;
    q3 += qDot3 * dt;
    const n = Math.hypot(q0, q1, q2, q3) || 1;
    return [q0 / n, q1 / n, q2 / n, q3 / n];
  }
  function quatToEuler(q) {
    const [w, x, y, z] = q;
    const roll = Math.atan2(2 * (w * x + y * z), 1 - 2 * (x * x + y * y));
    const sinp = 2 * (w * y - z * x);
    const pitch = Math.abs(sinp) >= 1 ? Math.sign(sinp) * Math.PI / 2 : Math.asin(sinp);
    const yaw = Math.atan2(2 * (w * z + x * y), 1 - 2 * (y * y + z * z));
    return { pitch, roll, yaw };
  }
  var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  var InsoleClient = class extends BlerpcClient {
    constructor(options = {}) {
      super(
        new WebBluetoothTransport({ mtu: options.mtu, namePrefix: options.namePrefix }),
        options.requireEncryption ?? true,
        options.pinIdentity ?? true
      );
      this._monitoring = false;
      // Orientation estimate (Madgwick IMU fusion), [w,x,y,z]. Reset per monitor run.
      this._q = [1, 0, 0, 0];
    }
    /** Read the persisted device configuration into a friendly shape. */
    async getConfigInfo() {
      const g = await this.getConfig();
      const deviceId = Number(g.deviceId) >>> 0;
      return {
        deviceId,
        deviceIdHex: "0x" + deviceId.toString(16).toUpperCase().padStart(8, "0"),
        foot: FOOT_NAME[g.foot] ?? "unspecified",
        firmwareVersion: g.firmwareVersion ?? "",
        logTimeUnitSec: Number(g.logTimeUnitSec) || 0,
        logDistanceUnitCode: Number(g.logDistanceUnitCode) || 0
      };
    }
    /** True while a monitor loop is running. */
    get isMonitoring() {
      return this._monitoring;
    }
    /**
     * Turn one decoded OK window into per-sample frames, advancing the Madgwick
     * orientation filter one step per sample so each frame carries an estimated
     * quaternion + Euler (the device itself streams no orientation).
     */
    framesFromWindow(resp, startMs, serialBase) {
      const imu = resp.imu ?? [];
      const pressure = resp.pressure ?? [];
      const n = Math.min(imu.length, pressure.length);
      const dt = SAMPLE_PERIOD_MS / 1e3;
      const frames = [];
      for (let i = 0; i < n; i++) {
        const im = imu[i];
        const mv = Array.from(pressure[i].mv ?? []);
        const ax = im.accelLateral ?? 0;
        const ay = im.accelLongitudinal ?? 0;
        const az = im.accelVertical ?? 0;
        const gx = im.gyroPitch ?? 0;
        const gy = im.gyroRoll ?? 0;
        const gz = im.gyroYaw ?? 0;
        this._q = updateMadgwickImu(
          this._q,
          gx * DEG2RAD,
          gy * DEG2RAD,
          gz * DEG2RAD,
          ax,
          ay,
          az,
          dt
        );
        const [w, qx, qy, qz] = this._q;
        frames.push({
          t: startMs + i * SAMPLE_PERIOD_MS,
          serial: serialBase + i,
          press: mv.length ? mv.slice(0, 6) : null,
          acc: { x: ax, y: ay, z: az },
          gyro: { x: gx, y: gy, z: gz },
          quat: { w, x: qx, y: qy, z: qz },
          euler: quatToEuler(this._q)
        });
      }
      return frames;
    }
    /**
     * Live monitor: set the clock, then repeatedly fetch the newest 100 ms window
     * and emit its samples via `onFrame`. Runs until `stopMonitor()`. This mirrors
     * `insole_cli/stream.py`'s `monitor` — it skips ahead when it falls behind, so
     * it is a live readout, not a lossless capture.
     */
    async startMonitor(onFrame, opts = {}) {
      if (this._monitoring) return;
      this._monitoring = true;
      this._q = [1, 0, 0, 0];
      const WS = insole.WindowStatus;
      let base = Date.now();
      await this.setTime({ epochMs: base });
      let t = base;
      let serial = 0;
      while (this._monitoring) {
        try {
          const resp = await this.getWindow({ startMs: t });
          const status = resp.status;
          if (status === WS.WINDOW_STATUS_OK) {
            const frames = this.framesFromWindow(resp, t, serial);
            for (const f of frames) onFrame(f);
            serial += frames.length;
            t += WINDOW_MS;
          } else if (status === WS.WINDOW_STATUS_TOO_NEW) {
            await sleep(WINDOW_MS);
          } else if (status === WS.WINDOW_STATUS_TOO_OLD) {
            const newest = Number(resp.newestMs) || t + WINDOW_MS;
            t = Math.max(t + WINDOW_MS, newest - WINDOW_MS);
          } else {
            base = Date.now();
            await this.setTime({ epochMs: base });
            t = base;
          }
        } catch (e) {
          opts.onError?.(e);
          await sleep(20);
        }
      }
    }
    /** Stop the monitor loop started by startMonitor(). */
    stopMonitor() {
      this._monitoring = false;
    }
    disconnect() {
      this._monitoring = false;
      super.disconnect();
    }
  };

  // src/index.ts
  protobuf.util.Long = null;
  protobuf.configure();
  return __toCommonJS(index_exports);
})();
/*! Bundled license information:

long/umd/index.js:
  (**
   * @license
   * Copyright 2009 The Closure Library Authors
   * Copyright 2020 Daniel Wirtz / The long.js Authors.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *     http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   *
   * SPDX-License-Identifier: Apache-2.0
   *)

@noble/hashes/utils.js:
  (*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/utils.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/abstract/modular.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/abstract/curve.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/abstract/edwards.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/abstract/montgomery.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/curves/ed25519.js:
  (*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) *)

@noble/ciphers/utils.js:
  (*! noble-ciphers - MIT License (c) 2023 Paul Miller (paulmillr.com) *)
*/

(function() {
    var modules = {}, definitions = {};
    var _require = function(path) {
        if (modules[path]) return modules[path];
        var module = {
            exports: {}
        }, definition = definitions[path];
        if (!definition) {
            try {
                return require(path);
            } catch (e) {}
            throw new Error("unable to load " + path);
        }
        return modules[path] = module.exports = definition(_require, module, module.exports, path);
    };
    var define = function(path, definition) {
        definitions[path] = definition;
    };
    if (typeof global == "undefined") {
        global = window;
    }
    if (typeof window == "undefined") {
        global.window = global;
    }
    if (typeof window.process == "undefined") {
        window.process = {};
    }
    define("asyngleton/test-web/asyngleton-test.js", function(require, module, exports, __dirname, __filename) {
        var expect = require("expect.js/expect.js"), structr = require("structr/lib/index.js"), asyngleton = require("asyngleton/lib/index.js");
        describe("asyngleton", function() {
            var Person = structr({
                __construct: function() {
                    this._getNameCount = 0;
                },
                getName: asyngleton(function(callback) {
                    this._getNameCount++;
                    setTimeout(callback, 1, "craig");
                }),
                getNameReset: asyngleton(true, function(callback) {
                    this._getNameCount++;
                    setTimeout(callback, 1, "craig" + this._getNameCount);
                })
            });
            it("can call getName a bunch of times and only be called once", function(next) {
                var person = new Person, name;
                for (var i = 100; i--; ) {
                    person.getName(function(n) {
                        name = n;
                    });
                }
                setTimeout(function() {
                    expect(person._getNameCount).to.be(1);
                    expect(name).to.be("craig");
                    next();
                }, 2);
            });
            it("can call getNameReset a bunch of times, and only be recalled after each time it successfuly calls", function(next) {
                var person = new Person, name, i = 0;
                function tick() {
                    person.getNameReset(function(n) {
                        name = n;
                    });
                    if (++i < 50) setTimeout(tick, 2);
                }
                tick();
                setTimeout(function() {
                    expect(person._getNameCount).to.be(50);
                    expect(name).to.be("craig50");
                    next();
                }, 1e3);
            });
        });
        return module.exports;
    });
    define("expect.js/expect.js", function(require, module, exports, __dirname, __filename) {
        (function(global, module) {
            if ("undefined" == typeof module) {
                var module = {
                    exports: {}
                }, exports = module.exports;
            }
            module.exports = expect;
            expect.Assertion = Assertion;
            expect.version = "0.1.2";
            var flags = {
                not: [ "to", "be", "have", "include", "only" ],
                to: [ "be", "have", "include", "only", "not" ],
                only: [ "have" ],
                have: [ "own" ],
                be: [ "an" ]
            };
            function expect(obj) {
                return new Assertion(obj);
            }
            function Assertion(obj, flag, parent) {
                this.obj = obj;
                this.flags = {};
                if (undefined != parent) {
                    this.flags[flag] = true;
                    for (var i in parent.flags) {
                        if (parent.flags.hasOwnProperty(i)) {
                            this.flags[i] = true;
                        }
                    }
                }
                var $flags = flag ? flags[flag] : keys(flags), self = this;
                if ($flags) {
                    for (var i = 0, l = $flags.length; i < l; i++) {
                        if (this.flags[$flags[i]]) continue;
                        var name = $flags[i], assertion = new Assertion(this.obj, name, this);
                        if ("function" == typeof Assertion.prototype[name]) {
                            var old = this[name];
                            this[name] = function() {
                                return old.apply(self, arguments);
                            };
                            for (var fn in Assertion.prototype) {
                                if (Assertion.prototype.hasOwnProperty(fn) && fn != name) {
                                    this[name][fn] = bind(assertion[fn], assertion);
                                }
                            }
                        } else {
                            this[name] = assertion;
                        }
                    }
                }
            }
            Assertion.prototype.assert = function(truth, msg, error) {
                var msg = this.flags.not ? error : msg, ok = this.flags.not ? !truth : truth;
                if (!ok) {
                    throw new Error(msg.call(this));
                }
                this.and = new Assertion(this.obj);
            };
            Assertion.prototype.ok = function() {
                this.assert(!!this.obj, function() {
                    return "expected " + i(this.obj) + " to be truthy";
                }, function() {
                    return "expected " + i(this.obj) + " to be falsy";
                });
            };
            Assertion.prototype.throwError = Assertion.prototype.throwException = function(fn) {
                expect(this.obj).to.be.a("function");
                var thrown = false, not = this.flags.not;
                try {
                    this.obj();
                } catch (e) {
                    if ("function" == typeof fn) {
                        fn(e);
                    } else if ("object" == typeof fn) {
                        var subject = "string" == typeof e ? e : e.message;
                        if (not) {
                            expect(subject).to.not.match(fn);
                        } else {
                            expect(subject).to.match(fn);
                        }
                    }
                    thrown = true;
                }
                if ("object" == typeof fn && not) {
                    this.flags.not = false;
                }
                var name = this.obj.name || "fn";
                this.assert(thrown, function() {
                    return "expected " + name + " to throw an exception";
                }, function() {
                    return "expected " + name + " not to throw an exception";
                });
            };
            Assertion.prototype.empty = function() {
                var expectation;
                if ("object" == typeof this.obj && null !== this.obj && !isArray(this.obj)) {
                    if ("number" == typeof this.obj.length) {
                        expectation = !this.obj.length;
                    } else {
                        expectation = !keys(this.obj).length;
                    }
                } else {
                    if ("string" != typeof this.obj) {
                        expect(this.obj).to.be.an("object");
                    }
                    expect(this.obj).to.have.property("length");
                    expectation = !this.obj.length;
                }
                this.assert(expectation, function() {
                    return "expected " + i(this.obj) + " to be empty";
                }, function() {
                    return "expected " + i(this.obj) + " to not be empty";
                });
                return this;
            };
            Assertion.prototype.be = Assertion.prototype.equal = function(obj) {
                this.assert(obj === this.obj, function() {
                    return "expected " + i(this.obj) + " to equal " + i(obj);
                }, function() {
                    return "expected " + i(this.obj) + " to not equal " + i(obj);
                });
                return this;
            };
            Assertion.prototype.eql = function(obj) {
                this.assert(expect.eql(obj, this.obj), function() {
                    return "expected " + i(this.obj) + " to sort of equal " + i(obj);
                }, function() {
                    return "expected " + i(this.obj) + " to sort of not equal " + i(obj);
                });
                return this;
            };
            Assertion.prototype.within = function(start, finish) {
                var range = start + ".." + finish;
                this.assert(this.obj >= start && this.obj <= finish, function() {
                    return "expected " + i(this.obj) + " to be within " + range;
                }, function() {
                    return "expected " + i(this.obj) + " to not be within " + range;
                });
                return this;
            };
            Assertion.prototype.a = Assertion.prototype.an = function(type) {
                if ("string" == typeof type) {
                    var n = /^[aeiou]/.test(type) ? "n" : "";
                    this.assert("array" == type ? isArray(this.obj) : "object" == type ? "object" == typeof this.obj && null !== this.obj : type == typeof this.obj, function() {
                        return "expected " + i(this.obj) + " to be a" + n + " " + type;
                    }, function() {
                        return "expected " + i(this.obj) + " not to be a" + n + " " + type;
                    });
                } else {
                    var name = type.name || "supplied constructor";
                    this.assert(this.obj instanceof type, function() {
                        return "expected " + i(this.obj) + " to be an instance of " + name;
                    }, function() {
                        return "expected " + i(this.obj) + " not to be an instance of " + name;
                    });
                }
                return this;
            };
            Assertion.prototype.greaterThan = Assertion.prototype.above = function(n) {
                this.assert(this.obj > n, function() {
                    return "expected " + i(this.obj) + " to be above " + n;
                }, function() {
                    return "expected " + i(this.obj) + " to be below " + n;
                });
                return this;
            };
            Assertion.prototype.lessThan = Assertion.prototype.below = function(n) {
                this.assert(this.obj < n, function() {
                    return "expected " + i(this.obj) + " to be below " + n;
                }, function() {
                    return "expected " + i(this.obj) + " to be above " + n;
                });
                return this;
            };
            Assertion.prototype.match = function(regexp) {
                this.assert(regexp.exec(this.obj), function() {
                    return "expected " + i(this.obj) + " to match " + regexp;
                }, function() {
                    return "expected " + i(this.obj) + " not to match " + regexp;
                });
                return this;
            };
            Assertion.prototype.length = function(n) {
                expect(this.obj).to.have.property("length");
                var len = this.obj.length;
                this.assert(n == len, function() {
                    return "expected " + i(this.obj) + " to have a length of " + n + " but got " + len;
                }, function() {
                    return "expected " + i(this.obj) + " to not have a length of " + len;
                });
                return this;
            };
            Assertion.prototype.property = function(name, val) {
                if (this.flags.own) {
                    this.assert(Object.prototype.hasOwnProperty.call(this.obj, name), function() {
                        return "expected " + i(this.obj) + " to have own property " + i(name);
                    }, function() {
                        return "expected " + i(this.obj) + " to not have own property " + i(name);
                    });
                    return this;
                }
                if (this.flags.not && undefined !== val) {
                    if (undefined === this.obj[name]) {
                        throw new Error(i(this.obj) + " has no property " + i(name));
                    }
                } else {
                    var hasProp;
                    try {
                        hasProp = name in this.obj;
                    } catch (e) {
                        hasProp = undefined !== this.obj[name];
                    }
                    this.assert(hasProp, function() {
                        return "expected " + i(this.obj) + " to have a property " + i(name);
                    }, function() {
                        return "expected " + i(this.obj) + " to not have a property " + i(name);
                    });
                }
                if (undefined !== val) {
                    this.assert(val === this.obj[name], function() {
                        return "expected " + i(this.obj) + " to have a property " + i(name) + " of " + i(val) + ", but got " + i(this.obj[name]);
                    }, function() {
                        return "expected " + i(this.obj) + " to not have a property " + i(name) + " of " + i(val);
                    });
                }
                this.obj = this.obj[name];
                return this;
            };
            Assertion.prototype.string = Assertion.prototype.contain = function(obj) {
                if ("string" == typeof this.obj) {
                    this.assert(~this.obj.indexOf(obj), function() {
                        return "expected " + i(this.obj) + " to contain " + i(obj);
                    }, function() {
                        return "expected " + i(this.obj) + " to not contain " + i(obj);
                    });
                } else {
                    this.assert(~indexOf(this.obj, obj), function() {
                        return "expected " + i(this.obj) + " to contain " + i(obj);
                    }, function() {
                        return "expected " + i(this.obj) + " to not contain " + i(obj);
                    });
                }
                return this;
            };
            Assertion.prototype.key = Assertion.prototype.keys = function($keys) {
                var str, ok = true;
                $keys = isArray($keys) ? $keys : Array.prototype.slice.call(arguments);
                if (!$keys.length) throw new Error("keys required");
                var actual = keys(this.obj), len = $keys.length;
                ok = every($keys, function(key) {
                    return ~indexOf(actual, key);
                });
                if (!this.flags.not && this.flags.only) {
                    ok = ok && $keys.length == actual.length;
                }
                if (len > 1) {
                    $keys = map($keys, function(key) {
                        return i(key);
                    });
                    var last = $keys.pop();
                    str = $keys.join(", ") + ", and " + last;
                } else {
                    str = i($keys[0]);
                }
                str = (len > 1 ? "keys " : "key ") + str;
                str = (!this.flags.only ? "include " : "only have ") + str;
                this.assert(ok, function() {
                    return "expected " + i(this.obj) + " to " + str;
                }, function() {
                    return "expected " + i(this.obj) + " to not " + str;
                });
                return this;
            };
            Assertion.prototype.fail = function(msg) {
                msg = msg || "explicit failure";
                this.assert(false, msg, msg);
                return this;
            };
            function bind(fn, scope) {
                return function() {
                    return fn.apply(scope, arguments);
                };
            }
            function every(arr, fn, thisObj) {
                var scope = thisObj || global;
                for (var i = 0, j = arr.length; i < j; ++i) {
                    if (!fn.call(scope, arr[i], i, arr)) {
                        return false;
                    }
                }
                return true;
            }
            function indexOf(arr, o, i) {
                if (Array.prototype.indexOf) {
                    return Array.prototype.indexOf.call(arr, o, i);
                }
                if (arr.length === undefined) {
                    return -1;
                }
                for (var j = arr.length, i = i < 0 ? i + j < 0 ? 0 : i + j : i || 0; i < j && arr[i] !== o; i++) ;
                return j <= i ? -1 : i;
            }
            var getOuterHTML = function(element) {
                if ("outerHTML" in element) return element.outerHTML;
                var ns = "http://www.w3.org/1999/xhtml";
                var container = document.createElementNS(ns, "_");
                var elemProto = (window.HTMLElement || window.Element).prototype;
                var xmlSerializer = new XMLSerializer;
                var html;
                if (document.xmlVersion) {
                    return xmlSerializer.serializeToString(element);
                } else {
                    container.appendChild(element.cloneNode(false));
                    html = container.innerHTML.replace("><", ">" + element.innerHTML + "<");
                    container.innerHTML = "";
                    return html;
                }
            };
            var isDOMElement = function(object) {
                if (typeof HTMLElement === "object") {
                    return object instanceof HTMLElement;
                } else {
                    return object && typeof object === "object" && object.nodeType === 1 && typeof object.nodeName === "string";
                }
            };
            function i(obj, showHidden, depth) {
                var seen = [];
                function stylize(str) {
                    return str;
                }
                function format(value, recurseTimes) {
                    if (value && typeof value.inspect === "function" && value !== exports && !(value.constructor && value.constructor.prototype === value)) {
                        return value.inspect(recurseTimes);
                    }
                    switch (typeof value) {
                      case "undefined":
                        return stylize("undefined", "undefined");
                      case "string":
                        var simple = "'" + json.stringify(value).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
                        return stylize(simple, "string");
                      case "number":
                        return stylize("" + value, "number");
                      case "boolean":
                        return stylize("" + value, "boolean");
                    }
                    if (value === null) {
                        return stylize("null", "null");
                    }
                    if (isDOMElement(value)) {
                        return getOuterHTML(value);
                    }
                    var visible_keys = keys(value);
                    var $keys = showHidden ? Object.getOwnPropertyNames(value) : visible_keys;
                    if (typeof value === "function" && $keys.length === 0) {
                        if (isRegExp(value)) {
                            return stylize("" + value, "regexp");
                        } else {
                            var name = value.name ? ": " + value.name : "";
                            return stylize("[Function" + name + "]", "special");
                        }
                    }
                    if (isDate(value) && $keys.length === 0) {
                        return stylize(value.toUTCString(), "date");
                    }
                    var base, type, braces;
                    if (isArray(value)) {
                        type = "Array";
                        braces = [ "[", "]" ];
                    } else {
                        type = "Object";
                        braces = [ "{", "}" ];
                    }
                    if (typeof value === "function") {
                        var n = value.name ? ": " + value.name : "";
                        base = isRegExp(value) ? " " + value : " [Function" + n + "]";
                    } else {
                        base = "";
                    }
                    if (isDate(value)) {
                        base = " " + value.toUTCString();
                    }
                    if ($keys.length === 0) {
                        return braces[0] + base + braces[1];
                    }
                    if (recurseTimes < 0) {
                        if (isRegExp(value)) {
                            return stylize("" + value, "regexp");
                        } else {
                            return stylize("[Object]", "special");
                        }
                    }
                    seen.push(value);
                    var output = map($keys, function(key) {
                        var name, str;
                        if (value.__lookupGetter__) {
                            if (value.__lookupGetter__(key)) {
                                if (value.__lookupSetter__(key)) {
                                    str = stylize("[Getter/Setter]", "special");
                                } else {
                                    str = stylize("[Getter]", "special");
                                }
                            } else {
                                if (value.__lookupSetter__(key)) {
                                    str = stylize("[Setter]", "special");
                                }
                            }
                        }
                        if (indexOf(visible_keys, key) < 0) {
                            name = "[" + key + "]";
                        }
                        if (!str) {
                            if (indexOf(seen, value[key]) < 0) {
                                if (recurseTimes === null) {
                                    str = format(value[key]);
                                } else {
                                    str = format(value[key], recurseTimes - 1);
                                }
                                if (str.indexOf("\n") > -1) {
                                    if (isArray(value)) {
                                        str = map(str.split("\n"), function(line) {
                                            return "  " + line;
                                        }).join("\n").substr(2);
                                    } else {
                                        str = "\n" + map(str.split("\n"), function(line) {
                                            return "   " + line;
                                        }).join("\n");
                                    }
                                }
                            } else {
                                str = stylize("[Circular]", "special");
                            }
                        }
                        if (typeof name === "undefined") {
                            if (type === "Array" && key.match(/^\d+$/)) {
                                return str;
                            }
                            name = json.stringify("" + key);
                            if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
                                name = name.substr(1, name.length - 2);
                                name = stylize(name, "name");
                            } else {
                                name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
                                name = stylize(name, "string");
                            }
                        }
                        return name + ": " + str;
                    });
                    seen.pop();
                    var numLinesEst = 0;
                    var length = reduce(output, function(prev, cur) {
                        numLinesEst++;
                        if (indexOf(cur, "\n") >= 0) numLinesEst++;
                        return prev + cur.length + 1;
                    }, 0);
                    if (length > 50) {
                        output = braces[0] + (base === "" ? "" : base + "\n ") + " " + output.join(",\n  ") + " " + braces[1];
                    } else {
                        output = braces[0] + base + " " + output.join(", ") + " " + braces[1];
                    }
                    return output;
                }
                return format(obj, typeof depth === "undefined" ? 2 : depth);
            }
            function isArray(ar) {
                return Object.prototype.toString.call(ar) == "[object Array]";
            }
            function isRegExp(re) {
                var s;
                try {
                    s = "" + re;
                } catch (e) {
                    return false;
                }
                return re instanceof RegExp || typeof re === "function" && re.constructor.name === "RegExp" && re.compile && re.test && re.exec && s.match(/^\/.*\/[gim]{0,3}$/);
            }
            function isDate(d) {
                if (d instanceof Date) return true;
                return false;
            }
            function keys(obj) {
                if (Object.keys) {
                    return Object.keys(obj);
                }
                var keys = [];
                for (var i in obj) {
                    if (Object.prototype.hasOwnProperty.call(obj, i)) {
                        keys.push(i);
                    }
                }
                return keys;
            }
            function map(arr, mapper, that) {
                if (Array.prototype.map) {
                    return Array.prototype.map.call(arr, mapper, that);
                }
                var other = new Array(arr.length);
                for (var i = 0, n = arr.length; i < n; i++) if (i in arr) other[i] = mapper.call(that, arr[i], i, arr);
                return other;
            }
            function reduce(arr, fun) {
                if (Array.prototype.reduce) {
                    return Array.prototype.reduce.apply(arr, Array.prototype.slice.call(arguments, 1));
                }
                var len = +this.length;
                if (typeof fun !== "function") throw new TypeError;
                if (len === 0 && arguments.length === 1) throw new TypeError;
                var i = 0;
                if (arguments.length >= 2) {
                    var rv = arguments[1];
                } else {
                    do {
                        if (i in this) {
                            rv = this[i++];
                            break;
                        }
                        if (++i >= len) throw new TypeError;
                    } while (true);
                }
                for (; i < len; i++) {
                    if (i in this) rv = fun.call(null, rv, this[i], i, this);
                }
                return rv;
            }
            expect.eql = function eql(actual, expected) {
                if (actual === expected) {
                    return true;
                } else if ("undefined" != typeof Buffer && Buffer.isBuffer(actual) && Buffer.isBuffer(expected)) {
                    if (actual.length != expected.length) return false;
                    for (var i = 0; i < actual.length; i++) {
                        if (actual[i] !== expected[i]) return false;
                    }
                    return true;
                } else if (actual instanceof Date && expected instanceof Date) {
                    return actual.getTime() === expected.getTime();
                } else if (typeof actual != "object" && typeof expected != "object") {
                    return actual == expected;
                } else {
                    return objEquiv(actual, expected);
                }
            };
            function isUndefinedOrNull(value) {
                return value === null || value === undefined;
            }
            function isArguments(object) {
                return Object.prototype.toString.call(object) == "[object Arguments]";
            }
            function objEquiv(a, b) {
                if (isUndefinedOrNull(a) || isUndefinedOrNull(b)) return false;
                if (a.prototype !== b.prototype) return false;
                if (isArguments(a)) {
                    if (!isArguments(b)) {
                        return false;
                    }
                    a = pSlice.call(a);
                    b = pSlice.call(b);
                    return expect.eql(a, b);
                }
                try {
                    var ka = keys(a), kb = keys(b), key, i;
                } catch (e) {
                    return false;
                }
                if (ka.length != kb.length) return false;
                ka.sort();
                kb.sort();
                for (i = ka.length - 1; i >= 0; i--) {
                    if (ka[i] != kb[i]) return false;
                }
                for (i = ka.length - 1; i >= 0; i--) {
                    key = ka[i];
                    if (!expect.eql(a[key], b[key])) return false;
                }
                return true;
            }
            var json = function() {
                "use strict";
                if ("object" == typeof JSON && JSON.parse && JSON.stringify) {
                    return {
                        parse: nativeJSON.parse,
                        stringify: nativeJSON.stringify
                    };
                }
                var JSON = {};
                function f(n) {
                    return n < 10 ? "0" + n : n;
                }
                function date(d, key) {
                    return isFinite(d.valueOf()) ? d.getUTCFullYear() + "-" + f(d.getUTCMonth() + 1) + "-" + f(d.getUTCDate()) + "T" + f(d.getUTCHours()) + ":" + f(d.getUTCMinutes()) + ":" + f(d.getUTCSeconds()) + "Z" : null;
                }
                var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g, gap, indent, meta = {
                    "\b": "\\b",
                    "	": "\\t",
                    "\n": "\\n",
                    "\f": "\\f",
                    "\r": "\\r",
                    '"': '\\"',
                    "\\": "\\\\"
                }, rep;
                function quote(string) {
                    escapable.lastIndex = 0;
                    return escapable.test(string) ? '"' + string.replace(escapable, function(a) {
                        var c = meta[a];
                        return typeof c === "string" ? c : "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                    }) + '"' : '"' + string + '"';
                }
                function str(key, holder) {
                    var i, k, v, length, mind = gap, partial, value = holder[key];
                    if (value instanceof Date) {
                        value = date(key);
                    }
                    if (typeof rep === "function") {
                        value = rep.call(holder, key, value);
                    }
                    switch (typeof value) {
                      case "string":
                        return quote(value);
                      case "number":
                        return isFinite(value) ? String(value) : "null";
                      case "boolean":
                      case "null":
                        return String(value);
                      case "object":
                        if (!value) {
                            return "null";
                        }
                        gap += indent;
                        partial = [];
                        if (Object.prototype.toString.apply(value) === "[object Array]") {
                            length = value.length;
                            for (i = 0; i < length; i += 1) {
                                partial[i] = str(i, value) || "null";
                            }
                            v = partial.length === 0 ? "[]" : gap ? "[\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "]" : "[" + partial.join(",") + "]";
                            gap = mind;
                            return v;
                        }
                        if (rep && typeof rep === "object") {
                            length = rep.length;
                            for (i = 0; i < length; i += 1) {
                                if (typeof rep[i] === "string") {
                                    k = rep[i];
                                    v = str(k, value);
                                    if (v) {
                                        partial.push(quote(k) + (gap ? ": " : ":") + v);
                                    }
                                }
                            }
                        } else {
                            for (k in value) {
                                if (Object.prototype.hasOwnProperty.call(value, k)) {
                                    v = str(k, value);
                                    if (v) {
                                        partial.push(quote(k) + (gap ? ": " : ":") + v);
                                    }
                                }
                            }
                        }
                        v = partial.length === 0 ? "{}" : gap ? "{\n" + gap + partial.join(",\n" + gap) + "\n" + mind + "}" : "{" + partial.join(",") + "}";
                        gap = mind;
                        return v;
                    }
                }
                JSON.stringify = function(value, replacer, space) {
                    var i;
                    gap = "";
                    indent = "";
                    if (typeof space === "number") {
                        for (i = 0; i < space; i += 1) {
                            indent += " ";
                        }
                    } else if (typeof space === "string") {
                        indent = space;
                    }
                    rep = replacer;
                    if (replacer && typeof replacer !== "function" && (typeof replacer !== "object" || typeof replacer.length !== "number")) {
                        throw new Error("JSON.stringify");
                    }
                    return str("", {
                        "": value
                    });
                };
                JSON.parse = function(text, reviver) {
                    var j;
                    function walk(holder, key) {
                        var k, v, value = holder[key];
                        if (value && typeof value === "object") {
                            for (k in value) {
                                if (Object.prototype.hasOwnProperty.call(value, k)) {
                                    v = walk(value, k);
                                    if (v !== undefined) {
                                        value[k] = v;
                                    } else {
                                        delete value[k];
                                    }
                                }
                            }
                        }
                        return reviver.call(holder, key, value);
                    }
                    text = String(text);
                    cx.lastIndex = 0;
                    if (cx.test(text)) {
                        text = text.replace(cx, function(a) {
                            return "\\u" + ("0000" + a.charCodeAt(0).toString(16)).slice(-4);
                        });
                    }
                    if (/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, "@").replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, "]").replace(/(?:^|:|,)(?:\s*\[)+/g, ""))) {
                        j = eval("(" + text + ")");
                        return typeof reviver === "function" ? walk({
                            "": j
                        }, "") : j;
                    }
                    throw new SyntaxError("JSON.parse");
                };
                return JSON;
            }();
            if ("undefined" != typeof window) {
                window.expect = module.exports;
            }
        })(this, "undefined" != typeof module ? module : {}, "undefined" != typeof exports ? exports : {});
        return module.exports;
    });
    define("structr/lib/index.js", function(require, module, exports, __dirname, __filename) {
        var Structr = function() {
            var that = Structr.extend.apply(null, arguments);
            if (!that.structurized) {
                that = Structr.ize(that);
            }
            for (var prop in that) {
                that.__construct.prototype[prop] = that[prop];
            }
            if (!that.__construct.extend) {
                that.__construct.extend = function() {
                    return Structr.apply(null, [ that ].concat(Array.apply([], arguments)));
                };
            }
            return that.__construct;
        };
        Structr.copy = function(from, to, lite) {
            if (typeof to == "boolean") {
                lite = to;
                to = undefined;
            }
            if (!to) to = from instanceof Array ? [] : {};
            var i;
            for (i in from) {
                var fromValue = from[i], toValue = to[i], newValue;
                if (!lite && typeof fromValue == "object" && (!fromValue || fromValue.constructor.prototype == Object.prototype || fromValue instanceof Array)) {
                    if (toValue && fromValue instanceof toValue.constructor) {
                        newValue = toValue;
                    } else {
                        newValue = fromValue instanceof Array ? [] : {};
                    }
                    Structr.copy(fromValue, newValue);
                } else {
                    newValue = fromValue;
                }
                to[i] = newValue;
            }
            return to;
        };
        Structr.getMethod = function(that, property) {
            return function() {
                return that[property].apply(that, arguments);
            };
        };
        Structr.wrap = function(that, prop) {
            if (that._wrapped) return that;
            that._wrapped = true;
            function wrap(target) {
                return function() {
                    return target.apply(that, arguments);
                };
            }
            if (prop) {
                that[prop] = wrap(target[prop]);
                return that;
            }
            for (var property in that) {
                var target = that[property];
                if (typeof target == "function") {
                    that[property] = wrap(target);
                }
            }
            return that;
        };
        Structr.findProperties = function(target, modifier) {
            var props = [], property;
            for (property in target) {
                var v = target[property];
                if (v && v[modifier]) {
                    props.push(property);
                }
            }
            return props;
        };
        Structr.nArgs = function(func) {
            var inf = func.toString().replace(/\{[\W\S]+\}/g, "").match(/\w+(?=[,\)])/g);
            return inf ? inf.length : 0;
        };
        Structr.getFuncsByNArgs = function(that, property) {
            return that.__private["overload::" + property] || (that.__private["overload::" + property] = {});
        };
        Structr.getOverloadedMethod = function(that, property, nArgs) {
            var funcsByNArgs = Structr.getFuncsByNArgs(that, property);
            return funcsByNArgs[nArgs];
        };
        Structr.setOverloadedMethod = function(that, property, func, nArgs) {
            var funcsByNArgs = Structr.getFuncsByNArgs(that, property);
            if (func.overloaded) return funcsByNArgs;
            funcsByNArgs[nArgs || Structr.nArgs(func)] = func;
            return funcsByNArgs;
        };
        Structr._mixin = {
            operators: {}
        };
        Structr.mixin = function(options) {
            switch (options.type) {
              case "operator":
                Structr._mixin.operators[options.name] = options.factory;
                break;
              default:
                throw new Error("Mixin type " + options.type + "does not exist");
                break;
            }
        };
        Structr.modifiers = {
            _override: function(that, property, newMethod) {
                var oldMethod = that.__private && that.__private[property] || that[property] || function() {}, parentMethod = oldMethod;
                if (oldMethod.overloaded) {
                    var overloadedMethod = oldMethod, nArgs = Structr.nArgs(newMethod);
                    parentMethod = Structr.getOverloadedMethod(that, property, nArgs);
                }
                var wrappedMethod = function() {
                    this._super = parentMethod;
                    var ret = newMethod.apply(this, arguments);
                    delete this._super;
                    return ret;
                };
                wrappedMethod.parent = newMethod;
                if (oldMethod.overloaded) {
                    return Structr.modifiers._overload(that, property, wrappedMethod, nArgs);
                }
                return wrappedMethod;
            },
            _explicit: function(that, property, gs) {
                var pprop = "__" + property;
                if (typeof gs != "object") {
                    gs = {};
                }
                if (!gs.get) {
                    gs.get = function() {
                        return this._value;
                    };
                }
                if (!gs.set) {
                    gs.set = function(value) {
                        this._value = value;
                    };
                }
                return function(value) {
                    if (!arguments.length) {
                        this._value = this[pprop];
                        var ret = gs.get.apply(this);
                        delete this._value;
                        return ret;
                    } else {
                        if (this[pprop] == value) return;
                        this._value = this[pprop];
                        gs.set.apply(this, [ value ]);
                        this[pprop] = this._value;
                    }
                };
            },
            _implicit: function(that, property, egs) {
                that.__private[property] = egs;
                that.__defineGetter__(property, egs);
                that.__defineSetter__(property, egs);
            },
            _overload: function(that, property, value, nArgs) {
                var funcsByNArgs = Structr.setOverloadedMethod(that, property, value, nArgs);
                var multiFunc = function() {
                    var func = funcsByNArgs[arguments.length];
                    if (func) {
                        return funcsByNArgs[arguments.length].apply(this, arguments);
                    } else {
                        var expected = [];
                        for (var sizes in funcsByNArgs) {
                            expected.push(sizes);
                        }
                        throw new Error("Expected " + expected.join(",") + " parameters, got " + arguments.length + ".");
                    }
                };
                multiFunc.overloaded = true;
                return multiFunc;
            },
            _abstract: function(that, property, value) {
                var ret = function() {
                    throw new Error('"' + property + '" is abstract and must be overridden.');
                };
                ret.isAbstract = true;
                return ret;
            }
        };
        Structr.parseProperty = function(property) {
            var parts = property.split(" ");
            var modifiers = [], name = parts.pop(), metadata = [];
            for (var i = 0, n = parts.length; i < n; i++) {
                var part = parts[i];
                if (part.substr(0, 1) == "[") {
                    metadata.push(Structr.parseMetadata(part));
                    continue;
                }
                modifiers.push(part);
            }
            return {
                name: name,
                modifiers: modifiers,
                metadata: metadata
            };
        };
        Structr.parseMetadata = function(metadata) {
            var parts = metadata.match(/\[(\w+)(\((.*?)\))?\]/), name = String(parts[1]).toLowerCase(), params = parts[2] || "()", paramParts = params.length > 2 ? params.substr(1, params.length - 2).split(",") : [];
            var values = {};
            for (var i = paramParts.length; i--; ) {
                var paramPart = paramParts[i].split("=");
                values[paramPart[0]] = paramPart[1] || true;
            }
            return {
                name: name,
                params: values
            };
        };
        Structr.extend = function() {
            var from = {}, mixins = Array.prototype.slice.call(arguments, 0), to = mixins.pop();
            if (mixins.length > 1) {
                for (var i = 0, n = mixins.length; i < n; i++) {
                    var mixin = mixins[i];
                    from = Structr.extend(from, typeof mixin == "function" ? mixin.prototype : mixin);
                }
            } else {
                from = mixins.pop() || from;
            }
            if (typeof from == "function") {
                var fromConstructor = from;
                from = Structr.copy(from.prototype);
                from.__construct = fromConstructor;
            }
            var that = {
                __private: {
                    propertyModifiers: {}
                }
            };
            Structr.copy(from, that);
            var usedProperties = {}, property;
            for (property in to) {
                var value = to[property];
                var propModifiersAr = Structr.parseProperty(property), propertyName = propModifiersAr.name, modifierList = that.__private.propertyModifiers[propertyName] || (that.__private.propertyModifiers[propertyName] = []);
                if (propModifiersAr.modifiers.length) {
                    var propModifiers = {};
                    for (var i = propModifiersAr.modifiers.length; i--; ) {
                        var modifier = propModifiersAr.modifiers[i];
                        propModifiers["_" + propModifiersAr.modifiers[i]] = 1;
                        if (modifierList.indexOf(modifier) == -1) {
                            modifierList.push(modifier);
                        }
                    }
                    if (propModifiers._merge) {
                        value = Structr.copy(from[propertyName], value);
                    }
                    if (propModifiers._explicit || propModifiers._implicit) {
                        value = Structr.modifiers._explicit(that, propertyName, value);
                    }
                    for (var name in Structr._mixin.operators) {
                        if (propModifiers["_" + name]) {
                            value = Structr._mixin.operators[name](that, propertyName, value);
                        }
                    }
                    if (propModifiers._override) {
                        value = Structr.modifiers._override(that, propertyName, value);
                    }
                    if (propModifiers._abstract) {
                        value = Structr.modifiers._abstract(that, propertyName, value);
                    }
                    if (propModifiers._implicit) {
                        Structr.modifiers._implicit(that, propertyName, value);
                        continue;
                    }
                }
                for (var j = modifierList.length; j--; ) {
                    value[modifierList[j]] = true;
                }
                if (usedProperties[propertyName]) {
                    var oldValue = that[propertyName];
                    if (!oldValue.overloaded) Structr.modifiers._overload(that, propertyName, oldValue, undefined);
                    value = Structr.modifiers._overload(that, propertyName, value, undefined);
                }
                usedProperties[propertyName] = 1;
                that.__private[propertyName] = that[propertyName] = value;
            }
            if (that.__construct && from.__construct && that.__construct == from.__construct) {
                that.__construct = Structr.modifiers._override(that, "__construct", function() {
                    this._super.apply(this, arguments);
                });
            } else if (!that.__construct) {
                that.__construct = function() {};
            }
            for (var property in from.__construct) {
                if (from.__construct[property]["static"] && !that[property]) {
                    that.__construct[property] = from.__construct[property];
                }
            }
            var propertyName;
            for (propertyName in that) {
                var value = that[propertyName];
                if (value && value["static"]) {
                    that.__construct[propertyName] = value;
                    delete that[propertyName];
                }
                if (usedProperties[propertyName]) continue;
                if (value.isAbstract) {
                    value();
                }
            }
            return that;
        };
        Structr.fh = function(that) {
            if (!that) {
                that = {};
            }
            that = Structr.extend({}, that);
            return Structr.ize(that);
        };
        Structr.ize = function(that) {
            that.structurized = true;
            that.getMethod = function(property) {
                return Structr.getMethod(this, property);
            };
            that.extend = function() {
                return Structr.extend.apply(null, [ this ].concat(arguments));
            };
            that.copyTo = function(target, lite) {
                Structr.copy(this, target, lite);
            };
            that.wrap = function(property) {
                return Structr.wrap(this, property);
            };
            return that;
        };
        module.exports = Structr;
        return module.exports;
    });
    define("asyngleton/lib/index.js", function(require, module, exports, __dirname, __filename) {
        var EventEmitter = require("events/index.js").EventEmitter;
        var singletonIndex = 0;
        function singleton(resetEachCall, fn) {
            if (arguments.length == 1) {
                fn = resetEachCall;
                resetEachCall = false;
            }
            var _id = singletonIndex++;
            var asyngleton = function() {
                var asyng = asyngleton.info.call(this), self = this;
                var args, cb, callback = arguments[arguments.length - 1];
                if (!(typeof callback == "function")) {
                    callback = function() {};
                }
                if (asyng.result) {
                    callback.apply(this, asyng.result);
                    return this;
                }
                asyng.em.once("singleton", callback);
                if (asyng.loading) {
                    return this;
                }
                asyng.loading = true;
                args = Array.prototype.slice.call(arguments, 0);
                cb = function() {
                    var result = asyng.result = Array.prototype.slice.call(arguments, 0);
                    if (resetEachCall) {
                        asyngleton.reset.call(self);
                    }
                    asyng.em.emit.apply(asyng.em, [ "singleton" ].concat(result));
                };
                args.pop();
                args.push(cb);
                fn.apply(this, args);
                return this;
            };
            asyngleton.reset = function() {
                var asyng = asyngleton.info.call(this);
                asyng.loading = false;
                asyng.result = undefined;
                return asyngleton;
            };
            asyngleton.info = function() {
                if (!this._asyngleton) {
                    this._asyngleton = {};
                }
                var asyng;
                if (!(asyng = this._asyngleton[_id])) {
                    asyng = this._asyngleton[_id] = {
                        result: null,
                        loading: false,
                        em: new EventEmitter
                    };
                }
                return asyng;
            };
            return asyngleton;
        }
        function createDictionary() {
            var _dict = {};
            return {
                get: function(key, fn) {
                    if (_dict[key]) return _dict[key];
                    var asyngleton = _dict[key] = singleton(fn);
                    asyngleton.dispose = function() {
                        delete _dict[key];
                    };
                    return asyngleton;
                }
            };
        }
        function structrFactory(that, property, value) {
            return singleton(value);
        }
        module.exports = singleton;
        module.exports.dictionary = createDictionary;
        module.exports.type = "operator";
        module.exports.factory = structrFactory;
        return module.exports;
    });
    define("events/index.js", function(require, module, exports, __dirname, __filename) {
        var isArray = Array.isArray;
        function EventEmitter() {}
        exports.EventEmitter = EventEmitter;
        var defaultMaxListeners = 100;
        EventEmitter.prototype.setMaxListeners = function(n) {
            if (!this._events) this._events = {};
            this._events.maxListeners = n;
        };
        EventEmitter.prototype.emit = function() {
            var type = arguments[0];
            if (type === "error") {
                if (!this._events || !this._events.error || isArray(this._events.error) && !this._events.error.length) {
                    if (arguments[1] instanceof Error) {
                        throw arguments[1];
                    } else {
                        throw new Error("Uncaught, unspecified 'error' event.");
                    }
                    return false;
                }
            }
            if (!this._events) return false;
            var handler = this._events[type];
            if (!handler) return false;
            if (typeof handler == "function") {
                switch (arguments.length) {
                  case 1:
                    handler.call(this);
                    break;
                  case 2:
                    handler.call(this, arguments[1]);
                    break;
                  case 3:
                    handler.call(this, arguments[1], arguments[2]);
                    break;
                  default:
                    var l = arguments.length;
                    var args = new Array(l - 1);
                    for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
                    handler.apply(this, args);
                }
                return true;
            } else if (isArray(handler)) {
                var l = arguments.length;
                var args = new Array(l - 1);
                for (var i = 1; i < l; i++) args[i - 1] = arguments[i];
                var listeners = handler.slice();
                for (var i = 0, l = listeners.length; i < l; i++) {
                    listeners[i].apply(this, args);
                }
                return true;
            } else {
                return false;
            }
        };
        EventEmitter.prototype.addListener = function(type, listener) {
            if ("function" !== typeof listener) {
                throw new Error("addListener only takes instances of Function");
            }
            if (!this._events) this._events = {};
            this.emit("newListener", type, listener);
            if (!this._events[type]) {
                this._events[type] = listener;
            } else if (isArray(this._events[type])) {
                this._events[type].push(listener);
                if (!this._events[type].warned) {
                    var m;
                    if (this._events.maxListeners !== undefined) {
                        m = this._events.maxListeners;
                    } else {
                        m = defaultMaxListeners;
                    }
                    if (m && m > 0 && this._events[type].length > m) {
                        this._events[type].warned = true;
                        console.error("(node) warning: possible EventEmitter memory " + "leak detected. %d listeners added. " + "Use emitter.setMaxListeners() to increase limit.", this._events[type].length);
                        console.trace();
                    }
                }
            } else {
                this._events[type] = [ this._events[type], listener ];
            }
            return this;
        };
        EventEmitter.prototype.on = EventEmitter.prototype.addListener;
        EventEmitter.prototype.once = function(type, listener) {
            if ("function" !== typeof listener) {
                throw new Error(".once only takes instances of Function");
            }
            var self = this;
            function g() {
                self.removeListener(type, g);
                listener.apply(this, arguments);
            }
            g.listener = listener;
            self.on(type, g);
            return this;
        };
        EventEmitter.prototype.removeListener = function(type, listener) {
            if ("function" !== typeof listener) {
                throw new Error("removeListener only takes instances of Function");
            }
            if (!this._events || !this._events[type]) return this;
            var list = this._events[type];
            if (isArray(list)) {
                var position = -1;
                for (var i = 0, length = list.length; i < length; i++) {
                    if (list[i] === listener || list[i].listener && list[i].listener === listener) {
                        position = i;
                        break;
                    }
                }
                if (position < 0) return this;
                list.splice(position, 1);
                if (list.length == 0) delete this._events[type];
            } else if (list === listener || list.listener && list.listener === listener) {
                delete this._events[type];
            }
            return this;
        };
        EventEmitter.prototype.removeAllListeners = function(type) {
            if (arguments.length === 0) {
                this._events = {};
                return this;
            }
            if (type && this._events && this._events[type]) this._events[type] = null;
            return this;
        };
        EventEmitter.prototype.listeners = function(type) {
            if (!this._events) this._events = {};
            if (!this._events[type]) this._events[type] = [];
            if (!isArray(this._events[type])) {
                this._events[type] = [ this._events[type] ];
            }
            return this._events[type];
        };
        return module.exports;
    });
    var entries = [ "asyngleton/test-web/asyngleton-test.js" ];
    for (var i = entries.length; i--; ) {
        _require(entries[i]);
    }
})();
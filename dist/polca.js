var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Polca;
(function (Polca) {
    Polca.helpCache = {};
    Polca.version = "0.9";
    var TokenType;
    (function (TokenType) {
        TokenType[TokenType["None"] = 0] = "None";
        TokenType[TokenType["SingleString"] = 1] = "SingleString";
        TokenType[TokenType["DoubleString"] = 2] = "DoubleString";
    })(TokenType || (TokenType = {}));
    function compile(str) {
        var char_, i, word = '', currentContainer, currentTokenKind = TokenType.None, escape = false;
        var containerStack = [];
        var root = (currentContainer = new Structures.CustomFunc("", true));
        function finishWord() {
            if (currentTokenKind === TokenType.SingleString)
                currentContainer.elements.push(word);
            else if (currentTokenKind === TokenType.DoubleString) {
                if (char_ !== '"')
                    throw new Exceptions.SyntaxError("Unclosed string");
                else
                    currentContainer.elements.push(word);
            }
            else if (word != '') {
                if (!isNaN(Number(word)))
                    currentContainer.elements.push(Number(word));
                else
                    currentContainer.elements.push(new Structures.ID(word));
            }
            word = '';
            currentTokenKind = TokenType.None;
        }
        for (i = 0; i < str.length; i++) {
            char_ = str[i];
            if (currentTokenKind === TokenType.DoubleString) {
                if (escape) {
                    word += char_;
                    escape = false;
                }
                else if (char_ === '\\')
                    escape = true;
                else if (char_ === '"')
                    finishWord();
                else
                    word += char_;
            }
            else {
                switch (char_) {
                    case ' ':
                    case "\n":
                        finishWord();
                        break;
                    case "'":
                        finishWord();
                        currentTokenKind = TokenType.SingleString;
                        break;
                    case '"':
                        finishWord();
                        currentTokenKind = TokenType.DoubleString;
                        break;
                    case '(':
                        finishWord();
                        var functionContainer = new Structures.CustomFunc("");
                        currentContainer.elements.push(functionContainer);
                        containerStack.push(currentContainer);
                        currentContainer = functionContainer;
                        break;
                    case ')':
                        finishWord();
                        if (!(currentContainer instanceof Structures.CustomFunc)) {
                            throw new Exceptions.SyntaxError("Unexpected symbol ')'");
                        }
                        currentContainer = containerStack.pop();
                        break;
                    case '[':
                        finishWord();
                        var subStackContainer = new Structures.SubStack();
                        currentContainer.elements.push(subStackContainer);
                        containerStack.push(currentContainer);
                        currentContainer = subStackContainer;
                        break;
                    case ']':
                        finishWord();
                        if (!(currentContainer instanceof Structures.SubStack)) {
                            throw new Exceptions.SyntaxError("Unexpected symbol ']'");
                        }
                        currentContainer = containerStack.pop();
                        break;
                    default:
                        word += char_;
                }
            }
        }
        char_ = null;
        finishWord();
        if (currentContainer !== root)
            throw new Exceptions.SyntaxError('Unclosed parentesis.');
        return root;
    }
    Polca.compile = compile;
    function exec(structure, parentContext) {
        if (!parentContext)
            parentContext = new Context();
        var context = parentContext.fork();
        structure.call(context);
        return context;
    }
    Polca.exec = exec;
    var Context = /** @class */ (function () {
        function Context(scope, stack, info) {
            if (scope === void 0) { scope = new Scope(); }
            if (stack === void 0) { stack = new Stack(); }
            if (info === void 0) { info = []; }
            this.scope = scope;
            this.stack = stack;
            this.info = info;
        }
        Context.prototype.fork = function () {
            return new Context(this.scope.fork(), this.stack.fork());
        };
        Context.prototype.subContext = function (scope) {
            if (scope === void 0) { scope = this.scope; }
            return new Context(scope.fork(), this.stack, this.info);
        };
        Context.prototype.subStackContext = function () {
            return new Context(this.scope.fork(), new Polca.SubStack(), this.info);
        };
        return Context;
    }());
    Polca.Context = Context;
    var Scope = /** @class */ (function () {
        function Scope() {
            this.obj = {};
        }
        Scope.prototype.get = function (name) {
            var val = this.obj[name];
            if (val === undefined)
                throw new Exceptions.ReferenceError(name);
            else if (val instanceof Function)
                return new Structures.NativeFunc(val, name);
            else
                return val;
        };
        Scope.prototype.set = function (name, value) {
            this.obj[name] = value;
        };
        Scope.prototype.fork = function () {
            return Scope.from(this.obj);
        };
        Scope.from = function (source) {
            var newValue = new Scope();
            newValue.obj = Object.create(source);
            return newValue;
        };
        return Scope;
    }());
    Polca.Scope = Scope;
    var Stack = /** @class */ (function () {
        function Stack() {
            this.ary = [];
        }
        Stack.prototype.pull = function (num) {
            if (this.ary.length < num)
                throw new Exceptions.StackUnderflowError();
            return this.ary.splice(this.ary.length - num);
        };
        Stack.prototype.push = function (val) {
            if (val instanceof Array)
                this.ary.push.apply(this.ary, val);
            else if (val !== undefined)
                this.ary.push(val);
        };
        Stack.prototype.fork = function () {
            var newStack = new this.constructor();
            newStack.ary = this.ary.slice();
            return newStack;
        };
        Stack.prototype.dropAll = function () {
            this.ary = [];
        };
        Stack.maskString = function (str) {
            return str.replace("\\", "\\\\").replace('"', '\\"');
        };
        Stack.prototype.toString = function () {
            return this.ary.reduce(function (sum, element, i) {
                if (i != 0)
                    sum += ' ';
                if (typeof element === 'string')
                    return sum + '"' + Polca.Stack.maskString(element) + '"';
                else
                    return sum + element.toString();
            }, "");
        };
        return Stack;
    }());
    Polca.Stack = Stack;
    var SubStack = /** @class */ (function (_super) {
        __extends(SubStack, _super);
        function SubStack() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        SubStack.prototype.toString = function () {
            return "[" + _super.prototype.toString.call(this) + "]";
        };
        SubStack.prototype.libPush = function (value) {
            var newStack = new SubStack();
            newStack.ary = this.ary.slice(0);
            newStack.ary.push(value);
            return newStack;
        };
        SubStack.prototype.libPop = function () {
            var newStack = new SubStack();
            newStack.ary = this.ary.slice(0, this.ary.length - 1);
            return [this.ary[this.ary.length - 1], newStack];
        };
        return SubStack;
    }(Stack));
    Polca.SubStack = SubStack;
    var Structures;
    (function (Structures) {
        var ID = /** @class */ (function () {
            function ID(name) {
                this.name = name;
            }
            ID.prototype.call = function (context) {
                var val = context.scope.get(this.name);
                return val.call ? val.call(context) : val;
            };
            ID.prototype.toString = function () {
                return this.name;
            };
            return ID;
        }());
        Structures.ID = ID;
        var SubStack = /** @class */ (function () {
            function SubStack() {
                this.elements = [];
            }
            SubStack.prototype.call = function (context) {
                var subcontext = context.subStackContext();
                var substack = subcontext.stack;
                this.elements.forEach(function (element) {
                    if (element instanceof ID) {
                        substack.push(element.call(subcontext));
                    }
                    else if (element instanceof CustomFunc) {
                        substack.push(element.bind(subcontext.scope));
                    }
                    else {
                        substack.push(element);
                    }
                });
                context.stack.push(substack);
            };
            return SubStack;
        }());
        Structures.SubStack = SubStack;
        var Func = /** @class */ (function () {
            function Func() {
            }
            return Func;
        }());
        Structures.Func = Func;
        var CustomFunc = /** @class */ (function () {
            function CustomFunc(name, root) {
                if (root === void 0) { root = false; }
                this.name = name;
                this.root = root;
                this.elements = [];
            }
            CustomFunc.prototype.call = function (context) {
                if (!this.root)
                    context = context.subContext(this.binding);
                this.elements.forEach(function (element) {
                    if (element instanceof ID) {
                        context.stack.push(element.call(context));
                    }
                    else if (element instanceof CustomFunc) {
                        context.stack.push(element.bind(context.scope));
                    }
                    else if (element instanceof SubStack) {
                        context.stack.push(element.call(context));
                    }
                    else {
                        context.stack.push(element);
                    }
                });
            };
            CustomFunc.prototype.toString = function () {
                var result = '(', first = true;
                this.elements.forEach(function (element) {
                    if (first)
                        first = false;
                    else
                        result += ' ';
                    if (typeof element == 'string')
                        result += '"' + element + '"';
                    else
                        result += element.toString();
                });
                return result + ')';
            };
            CustomFunc.prototype.cat = function (other) {
                var newFunc = new Polca.Structures.CustomFunc("(" + this.name + " " + other.name + ")");
                newFunc.elements = this.elements.concat(other.elements);
                return newFunc;
            };
            CustomFunc.prototype.bind = function (scope) {
                var newFunc = new CustomFunc(this.name, this.root);
                newFunc.elements = this.elements;
                newFunc.binding = scope;
                return newFunc;
            };
            return CustomFunc;
        }());
        Structures.CustomFunc = CustomFunc;
        var NativeFunc = /** @class */ (function () {
            function NativeFunc(func, name) {
                this.func = func;
                this.name = name;
            }
            NativeFunc.prototype.call = function (context) {
                var args = context.stack.pull(this.func.length);
                context.stack.push(this.func.apply(context, args));
            };
            NativeFunc.prototype.toString = function () {
                return this.name ? '(' + this.name + ')' : this.func['name'];
            };
            return NativeFunc;
        }());
        Structures.NativeFunc = NativeFunc;
    })(Structures = Polca.Structures || (Polca.Structures = {}));
    var Exceptions;
    (function (Exceptions) {
        var Exception = /** @class */ (function (_super) {
            __extends(Exception, _super);
            function Exception(message) {
                var _this = _super.call(this, message) || this;
                _this.message = message;
                _this.stack = new Error().stack;
                return _this;
            }
            Exception.prototype.toString = function () {
                return this.name + ': ' + this.message;
            };
            return Exception;
        }(Error));
        Exceptions.Exception = Exception;
        var ReferenceError = /** @class */ (function (_super) {
            __extends(ReferenceError, _super);
            function ReferenceError(name) {
                var _this = _super.call(this, "Unknown Variable '" + name + "'") || this;
                _this.name = "ReferenceError";
                return _this;
            }
            return ReferenceError;
        }(Exception));
        Exceptions.ReferenceError = ReferenceError;
        var StackUnderflowError = /** @class */ (function (_super) {
            __extends(StackUnderflowError, _super);
            function StackUnderflowError() {
                var _this = _super.call(this, "Not enough values on stack.") || this;
                _this.name = "StackUnderflowError";
                return _this;
            }
            return StackUnderflowError;
        }(Exception));
        Exceptions.StackUnderflowError = StackUnderflowError;
        var SyntaxError = /** @class */ (function (_super) {
            __extends(SyntaxError, _super);
            function SyntaxError(msg) {
                var _this = _super.call(this, msg) || this;
                _this.name = "SyntaxError";
                return _this;
            }
            return SyntaxError;
        }(Exception));
        Exceptions.SyntaxError = SyntaxError;
    })(Exceptions = Polca.Exceptions || (Polca.Exceptions = {}));
})(Polca || (Polca = {}));
//# sourceMappingURL=polca.js.map
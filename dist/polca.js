var Polca;
(function (Polca) {
    Polca.helpCache = {};
    Polca.version = "0.9";
    let TokenType;
    (function (TokenType) {
        TokenType[TokenType["None"] = 0] = "None";
        TokenType[TokenType["SingleString"] = 1] = "SingleString";
        TokenType[TokenType["DoubleString"] = 2] = "DoubleString";
    })(TokenType || (TokenType = {}));
    function compile(str) {
        let char_, i, word = '', currentContainer, currentTokenKind = TokenType.None, escape = false;
        const containerStack = [];
        const root = (currentContainer = new Structures.CustomFunc("", true));
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
                        const functionContainer = new Structures.CustomFunc("");
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
                        const subStackContainer = new Structures.SubStack();
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
        const context = parentContext.fork();
        structure.call(context);
        return context;
    }
    Polca.exec = exec;
    class Context {
        constructor(scope = new Scope(), stack = new Stack(), info = []) {
            this.scope = scope;
            this.stack = stack;
            this.info = info;
        }
        fork() {
            return new Context(this.scope.fork(), this.stack.fork());
        }
        subContext(scope = this.scope) {
            return new Context(scope.fork(), this.stack, this.info);
        }
        subStackContext() {
            return new Context(this.scope.fork(), new Polca.SubStack(), this.info);
        }
    }
    Polca.Context = Context;
    class Scope {
        constructor() {
            this.obj = {};
        }
        get(name) {
            const val = this.obj[name];
            if (val === undefined)
                throw new Exceptions.ReferenceError(name);
            else if (val instanceof Function)
                return new Structures.NativeFunc(val, name);
            else
                return val;
        }
        set(name, value) {
            this.obj[name] = value;
        }
        fork() {
            return Scope.from(this.obj);
        }
        static from(source) {
            const newValue = new Scope();
            newValue.obj = Object.create(source);
            return newValue;
        }
    }
    Polca.Scope = Scope;
    class Stack {
        constructor(ary = []) {
            this.ary = ary;
        }
        get length() { return this.ary.length; }
        at(pos) {
            return this.ary[pos >= 0 ? pos : this.length + pos];
        }
        pull(num) {
            if (this.ary.length < num)
                throw new Exceptions.StackUnderflowError();
            return this.ary.splice(this.ary.length - num);
        }
        push(val) {
            if (val instanceof Array)
                this.ary.push.apply(this.ary, val);
            else if (val !== undefined)
                this.ary.push(val);
        }
        fork() {
            const newStack = new this.constructor();
            newStack.ary = this.ary.slice();
            return newStack;
        }
        dropAll() {
            this.ary = [];
        }
        static maskString(str) {
            return str.replace("\\", "\\\\").replace('"', '\\"');
        }
        toString() {
            return this.ary.reduce((sum, element, i) => {
                if (i != 0)
                    sum += ' ';
                if (typeof element === 'string')
                    return sum + '"' + Polca.Stack.maskString(element) + '"';
                else
                    return sum + element.toString();
            }, "");
        }
    }
    Polca.Stack = Stack;
    class SubStack extends Stack {
        constructor() {
            super(...arguments);
            this.type = "Substack";
        }
        toString() {
            return "[" + super.toString() + "]";
        }
        slice(...params) { return new SubStack(this.ary.slice(...params)); }
        insert(pos, value) {
            const posOffset = pos >= 0 ? pos : this.length - pos + 1;
            return new SubStack([
                ...this.ary.slice(0, posOffset),
                value,
                ...this.ary.slice(posOffset)
            ]);
        }
        extract(pos) {
            return [
                this.at(pos),
                new SubStack([
                    ...this.ary.slice(0, pos),
                    ...this.ary.slice(pos + 1 || Infinity)
                ])
            ];
        }
        cat(other) {
            return new SubStack([...this.ary, ...other.ary]);
        }
    }
    Polca.SubStack = SubStack;
    let Structures;
    (function (Structures) {
        class ID {
            constructor(name) {
                this.name = name;
            }
            call(context) {
                const val = context.scope.get(this.name);
                return val.call ? val.call(context) : val;
            }
            toString() {
                return this.name;
            }
        }
        Structures.ID = ID;
        class SubStack {
            constructor() {
                this.elements = [];
            }
            call(context) {
                const subcontext = context.subStackContext();
                const substack = subcontext.stack;
                this.elements.forEach((element) => {
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
            }
            toString() {
                let result = '[';
                let first = true;
                for (const element of this.elements) {
                    if (first)
                        first = false;
                    else
                        result += ' ';
                    if (typeof element === 'string')
                        result += `"${element}"`;
                    else
                        result += element.toString();
                }
                return result + "]";
            }
        }
        Structures.SubStack = SubStack;
        class Func {
            constructor(name) {
                this.name = name;
                this.type = "Function";
            }
            cat(other) {
                const newFunc = new Polca.Structures.CustomFunc("(" + this.name + " " + other.name + ")", false);
                newFunc.elements = [
                    ...(this instanceof CustomFunc ? this.elements : [new Structures.ID(this.name)]),
                    ...(other instanceof CustomFunc ? other.elements : [new Structures.ID(other.name)])
                ];
                return newFunc;
            }
        }
        Structures.Func = Func;
        class CustomFunc extends Func {
            constructor(name, root = false) {
                super(name);
                this.root = root;
                this.elements = [];
            }
            call(context) {
                if (!this.root)
                    context = context.subContext(this.binding);
                this.elements.forEach((element) => {
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
            }
            toString() {
                let result = '(', first = true;
                this.elements.forEach((element) => {
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
            }
            bind(scope) {
                const newFunc = new CustomFunc(this.name, this.root);
                newFunc.elements = this.elements;
                newFunc.binding = scope;
                return newFunc;
            }
        }
        Structures.CustomFunc = CustomFunc;
        class NativeFunc extends Func {
            constructor(func, name) {
                super(name);
                this.func = func;
                this.type = "Function";
            }
            call(context) {
                const args = context.stack.pull(this.func.length);
                context.stack.push(this.func.apply(context, args));
            }
            toString() {
                return this.name ? '(' + this.name + ')' : this.func['name'];
            }
        }
        Structures.NativeFunc = NativeFunc;
    })(Structures = Polca.Structures || (Polca.Structures = {}));
    let Exceptions;
    (function (Exceptions) {
        class Exception extends Error {
            constructor(message) {
                super(message);
                this.message = message;
                this.stack = new Error().stack;
            }
            toString() {
                return this.name + ': ' + this.message;
            }
        }
        Exceptions.Exception = Exception;
        class ReferenceError extends Exception {
            constructor(name) {
                super("Unknown Variable '" + name + "'");
                this.name = "ReferenceError";
            }
        }
        Exceptions.ReferenceError = ReferenceError;
        class StackUnderflowError extends Exception {
            constructor() {
                super("Not enough values on stack.");
                this.name = "StackUnderflowError";
            }
        }
        Exceptions.StackUnderflowError = StackUnderflowError;
        class SyntaxError extends Exception {
            constructor(msg) {
                super(msg);
                this.name = "SyntaxError";
            }
        }
        Exceptions.SyntaxError = SyntaxError;
    })(Exceptions = Polca.Exceptions || (Polca.Exceptions = {}));
})(Polca || (Polca = {}));
//# sourceMappingURL=polca.js.map
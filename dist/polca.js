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
        constructor() {
            this.ary = [];
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
        toString() {
            return "[" + super.toString() + "]";
        }
        libPush(value) {
            const newStack = new SubStack();
            newStack.ary = this.ary.slice(0);
            newStack.ary.push(value);
            return newStack;
        }
        libPop() {
            const newStack = new SubStack();
            newStack.ary = this.ary.slice(0, this.ary.length - 1);
            return [this.ary[this.ary.length - 1], newStack];
        }
        cat (other) {
            const newStack = new SubStack ()
            newStack.ary = [...this.ary, ...other.ary]
            return newStack
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
        }
        Structures.SubStack = SubStack;
        class Func {
        }
        Structures.Func = Func;
        class CustomFunc {
            constructor(name, root = false) {
                this.name = name;
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
            cat(other) {
                const newFunc = new Polca.Structures.CustomFunc("(" + this.name + " " + other.name + ")");
                newFunc.elements = this.elements.concat(other.elements);
                return newFunc;
            }
            bind(scope) {
                const newFunc = new CustomFunc(this.name, this.root);
                newFunc.elements = this.elements;
                newFunc.binding = scope;
                return newFunc;
            }
        }
        Structures.CustomFunc = CustomFunc;
        class NativeFunc {
            constructor(func, name) {
                this.func = func;
                this.name = name;
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
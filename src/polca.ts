module Polca {
    export const helpCache = {};
    export const version = "0.9";

    enum TokenType {
        None, SingleString, DoubleString
    }

    export function compile(str: string) {
        let char_, i,
            word = '',
            currentContainer,
            currentTokenKind = TokenType.None,
            escape = false;
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
            } else if (word != '') {
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
                } else if (char_ === '\\')
                    escape = true;
                else if (char_ === '"')
                    finishWord();
                else
                    word += char_;
            } else {
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
                            throw new Exceptions.SyntaxError("Unexpected symbol ')'")
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
                            throw new Exceptions.SyntaxError("Unexpected symbol ']'")
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

        if (currentContainer !== root) throw new Exceptions.SyntaxError('Unclosed parentesis.');
        return root;
    }

    export function exec (structure: Structures.Structure, parentContext: Context): Context {
        if (!parentContext) parentContext = new Context();
        const context = parentContext.fork();

        structure.call(context);

        return context;
    }

    export class Context {
        constructor(
            public scope: Scope = new Scope(),
            public stack: Stack = new Stack(),
            public info: string[] = []
        ) {}

        fork() {
            return new Context(this.scope.fork(), this.stack.fork());
        }

        subContext(scope: Scope = this.scope) {
            return new Context(scope.fork(), this.stack, this.info);
        }

        subStackContext() {
            return new Context (this.scope.fork(), new Polca.SubStack(), this.info);
        }
    }

    export class Scope {
        private obj = {};

        get(name:string) {
            const val = this.obj[name];
            if (val === undefined)
                throw new Exceptions.ReferenceError (name);
            else if (val instanceof Function)
                return new Structures.NativeFunc(val, name);
            else
                return val;
        }

        set(name:string, value) {
            this.obj[name] = value;
        }

        fork():Scope {
            return Scope.from(this.obj);
        }

        static from(source:Object) {
            const newValue = new Scope();
            newValue.obj = Object.create(source);
            return newValue;
        }
    }

    export class Stack {
        constructor(public ary = []) {}

        pull(num) {
            if (this.ary.length < num)
                throw new Exceptions.StackUnderflowError ();

            return this.ary.splice(this.ary.length - num);
        }

        push(val) {
            if (val instanceof Array)
                this.ary.push.apply(this.ary, val);
            else if (val !== undefined)
                this.ary.push(val);
        }

        fork(): Stack {
            const newStack = new (<any>this.constructor)();
            newStack.ary = this.ary.slice();
            return newStack;
        }

        dropAll() {
            this.ary = [];
        }

        static maskString(str: string) {
            return str.replace("\\", "\\\\").replace('"', '\\"');
        }

        toString(): string {
            return this.ary.reduce((sum, element, i) => {
                if (i != 0) sum += ' ';
                if (typeof element === 'string')
                    return sum + '"' + Polca.Stack.maskString(element) + '"';
                else
                    return sum + element.toString();
            }, "");
        }
    }

    export class SubStack extends Stack {
        readonly type = "Substack";

        toString(): string {
            return "[" + super.toString() + "]";
        }

        get length() { return this.ary.length; }

        at (pos : number) {
            return this.ary[pos >= 0 ? pos : this.length + pos]
        }

        push(value: any) {
            return new SubStack([...this.ary, value]);
        }
        unshift (value: any) {
            return new SubStack([value, ...this.ary]);
        }
        pop() {
            return [
                this.ary[this.ary.length - 1],
                new SubStack (this.ary.slice(0, this.ary.length - 1))
            ];
        }
        shift () {
            return [
                this.ary[0],
                new SubStack (this.ary.slice(1, this.ary.length))
            ];
        }
        cat (other : SubStack) {
            return new SubStack ([...this.ary, ...other.ary])
        }
    }

    export module Structures {
        export interface Structure {
            call(context: Context)
            toString(): string
        }

        export class ID implements Structure {
            private name: string;

            constructor(name: string) {
                this.name = name;
            }

            call(context: Context) {
                const val = context.scope.get(this.name);
                return val.call ? val.call(context) : val;
            }

            toString(): string {
                return this.name;
            }
        }

        export class SubStack implements Structure {
            private elements = [];

            constructor() {}

            call(context: Polca.Context) {
                const subcontext = context.subStackContext();
                const substack = subcontext.stack;
                this.elements.forEach((element) => {
                    if (element instanceof ID) {
                        substack.push(element.call(subcontext));
                    } else if (element instanceof CustomFunc) {
                        substack.push(element.bind(subcontext.scope));
                    } else {
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

        export abstract class Func implements Structure {
            readonly type = "Function";

            protected constructor (protected name: string) {}
            abstract call(context: Context);

            cat(other: Func) {
                const newFunc = new Polca.Structures.CustomFunc(
                    "(" + this.name + " " + other.name + ")",
                    false
                );
                newFunc.elements = [
                    ...(this instanceof CustomFunc ? this.elements : [new Structures.ID(this.name)]),
                    ...(other instanceof CustomFunc ? other.elements : [new Structures.ID(other.name)])
                ];
                return newFunc;
            }
        }

        export class CustomFunc extends Func {
            public elements = []
            private binding: Scope;

            constructor(name: string, private root: boolean = false) {
                super(name);
            }

            call(context: Context) {
                if (!this.root) context = context.subContext(this.binding);
                this.elements.forEach((element) => {
                    if (element instanceof ID) {
                        context.stack.push(element.call(context));
                    } else if (element instanceof CustomFunc) {
                        context.stack.push(element.bind(context.scope));
                    } else if (element instanceof SubStack) {
                        context.stack.push(element.call(context));
                    } else {
                        context.stack.push(element);
                    }
                })
            }

            toString(): string {
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

            bind(scope: Scope) {
                const newFunc = new CustomFunc(this.name, this.root);
                newFunc.elements = this.elements;
                newFunc.binding = scope;
                return newFunc;
            }
        }

        export class NativeFunc extends Func {
            readonly type = "Function";

            constructor(
                private func: Function,
                name: string
            ) {
                super(name);
            }

            call(context: Context) {
                const args = context.stack.pull(this.func.length);
                context.stack.push(this.func.apply(context, args));
            }

            toString(): string {
                return this.name ? '(' + this.name + ')' : this.func['name'];
            }
        }
    }

    export module Exceptions {
        export declare class Error {
            public name: string;
            public message: string;
            public stack: string;
            constructor(message?: string);
        }

        export class Exception extends Error {
            constructor(message: string) {
                super(message);
                this.message = message;
                this.stack = (<any>new Error()).stack;
            }
            toString() {
                return this.name + ': ' + this.message;
            }
        }

        export class ReferenceError extends Exception {
            public name = "ReferenceError";

            constructor (name) {
                super("Unknown Variable '" + name + "'");
            }
        }

        export class StackUnderflowError extends Exception {
            public name = "StackUnderflowError";

            constructor () {
                super("Not enough values on stack.");
            }
        }

        export class SyntaxError extends Exception {
            public name = "SyntaxError";

            constructor (msg) {
                super(msg);
            }
        }
    }
}

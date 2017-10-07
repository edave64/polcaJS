module Polca {
    export var helpCache = {};
    export var version = "0.9";

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
                        const newContainer = new Structures.CustomFunc("");
                        currentContainer.elements.push(newContainer);
                        containerStack.push(currentContainer);
                        currentContainer = newContainer;
                        break;
                    case ')':
                        finishWord();
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
        private ary = [];

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
            const newStack = new Stack();
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

        export abstract class Func implements Structure {
            abstract call(context: Context);
        }

        export class CustomFunc implements Func {
            private elements = [];
            private binding: Scope;

            constructor(private name: string, private root: boolean = false) {}

            call(context: Context) {
                if (!this.root) context = context.subContext(this.binding);
                this.elements.forEach((element) => {
                    if (element instanceof ID) {
                        context.stack.push(element.call(context));
                    } else if (element instanceof CustomFunc) {
                        context.stack.push(element.bind(context.scope));
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

            cat(other: CustomFunc) {
                const newFunc = new Polca.Structures.CustomFunc("(" + this.name + " " + other.name + ")");
                newFunc.elements = this.elements.concat(other.elements);
                return newFunc;
            }

            bind(scope: Scope) {
                const newFunc = new CustomFunc(this.name, this.root);
                newFunc.elements = this.elements;
                newFunc.binding = scope;
                return newFunc;
            }
        }

        export class NativeFunc implements Func {
            constructor(
                private func: Function,
                private name: string
            ) {}

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

module Polca {
    export var helpCache = {};

    export function compile(str: string) {
        var char_, i, word = '', currentTokenKind = '', escape = false,
            currentContainer, containerStack = [];

        var root = (currentContainer = new Structures.Func("", true));

        function finishWord() {
            if (currentTokenKind === "'string")
                currentContainer.elements.push(word);
            else if (currentTokenKind === '"string') {
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
            currentTokenKind = '';
        }

        for (i = 0; i < str.length; i++) {
            char_ = str[i];
            if (currentTokenKind === '"string') {
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
                        currentTokenKind = "'string";
                        break;
                    case '"':
                        finishWord();
                        currentTokenKind = '"string';
                        break;
                    case '(':
                        finishWord();
                        var newContainer = new Structures.Func ("");
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

    export function exec (structure: Structures.Structure, parentContext: Context) {
        if (!parentContext) parentContext = new Context();
        var context = parentContext.fork();

        structure.call(context);

        return context;
    }

    export class Context {
        constructor(
            public scope: Scope = new Scope(),
            public stack: Stack = new Stack()
        ) {}

        fork() {
            return new Context(this.scope.fork(), this.stack.fork());
        }

        subContext(scope: Scope = this.scope) {
            return new Context(scope.fork(), this.stack);
        }
    }

    export class Scope {
        private obj = {};

        get(name:string) {
            var val = this.obj[name];
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
            var newValue = new Scope();
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
            var newStack = new Stack();
            newStack.ary = this.ary.slice();
            return newStack;
        }

        dropAll() {
            this.ary = [];
        }

        static maskString(str: string) {
            return str.replace("\\", "\\\\").replace('"', '\\"');
        }

        toString() {
            return this.ary.reduce(function (sum, element, i) {
                if (i != 0) sum += ' ';
                if (typeof element === 'string' || element instanceof String)
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
                var val = context.scope.get(this.name);
                return val.call ? val.call(context) : val;
            }

            toString(): string {
                return this.name;
            }
        }

        export class Func implements Structure {
            private elements = [];
            private binding: Scope;

            constructor(private name: String, private root: boolean = false) {}

            call(context: Context) {
                if (!this.root) context = context.subContext(this.binding);
                this.elements.every(function (element) {
                    if (element instanceof ID) {
                        context.stack.push(element.call(context));
                    } else if (element instanceof Func) {
                        context.stack.push(element.bind(context.scope));
                    } else
                        context.stack.push(element);
                    return true;
                })
            }

            toString(): string {
                var result = '(', first = true;
                this.elements.every(function (element) {
                    if (first)
                        first = false;
                    else
                        result += ' ';

                    if ((typeof element == 'string') || (element instanceof String))
                        result += '"' + element + '"';
                    else
                        result += element.toString();

                    return true;
                });
                return result + ')';
            }

            bind(scope: Scope) {
                var newFunc = new Func (this.name, this.root);
                newFunc.elements = this.elements;
                newFunc.binding = scope;
                return newFunc;
            }
        }

        export class NativeFunc implements Structure {
            constructor(
                private func: Function,
                private name: string
            ) {}

            call(context: Context) {
                var args = context.stack.pull(this.func.length);
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
            constructor(public message: string) {
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

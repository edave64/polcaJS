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

    function formatString (str: string) {
        const simple = !(/['"\(\)\[\]\s]/.test(str));
        if (simple) {
            return `'${str}`;
        } else {
            return `"${str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
        }
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

        get length() { return this.ary.length; }

        at (pos : number) {
            return this.ary[pos >= 0 ? pos : this.length + pos]
        }

        pull(num) {
            if (this.length < num)
                throw new Exceptions.StackUnderflowError ();

            return this.ary.splice(this.length - num);
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

        toString(): string {
            return this.ary.reduce((sum, element, i) => {
                if (i != 0) sum += ' ';
                if (typeof element === 'string') {
                    return sum + formatString(element)
                }
                else
                    return sum + element.toString();
            }, "");
        }

        toHtml(): HTMLElement {
            const out = document.createElement('span');
            let first = true;
            for (const ele of this.ary) {
                if (!first) out.appendChild(document.createTextNode(' '))
                if (typeof ele === 'string') {
                    out.appendChild(document.createTextNode(formatString(ele)));
                } else if (ele.toHtml) {
                    out.appendChild(ele.toHtml());
                } else {
                    out.appendChild(document.createTextNode(ele.toString()));
                }
                first = false;
            }
            return out;
        }
    }

    export function equal (a: any, b: any) : boolean {
        return a instanceof SubStack ? a.equal(b) : a === b;
    }

    export function ord (a: any, b: any) : number {
        if (Polca.equal(a, b)) return 0;
        if ((typeof a === 'number') && (typeof b === 'number')) {
            return a < b ? -1 : 1;
        }
        if ((typeof a === 'string') && (typeof b === 'string')) {
            return a < b ? -1 : 1;
        }
        throw new Error ("Comparison error: no sorting for the given elements is known.");
    }

    export class SubStack extends Stack {
        readonly type = "Substack";

        toString(): string {
            return "[" + super.toString() + "]";
        }

        toHtml(): HTMLElement {
            const out = super.toHtml();
            if (out.firstChild) {
                out.insertBefore(document.createTextNode('['), out.firstChild);
            } else {
                out.appendChild(document.createTextNode('['));
            }
            out.appendChild(document.createTextNode(']'));
            return out;
        }

        // todo: recursive equality checking does not work correctly!
        equal (other: SubStack) : boolean {
            if (this.length != other.length) return false
            return this.ary.every((val, idx) =>
                equal(val, other.at(idx))
            )
        }

        has (item : any) : boolean {
            return this.ary.some(part => equal(part, item)
        )}

        count (item : any) : number {return this.ary.reduce(
                (prev, part) => prev + equal(part, item)
            , 0);
        }

        // removes item once, if present. (otherwise return identical SubStack)
        removeOne (item : any) : SubStack {
            let aleadyfound = false;
            return new SubStack (this.ary.filter (part => {
                if (aleadyfound) return true
                else if (equal(part, item)) {
                    aleadyfound = true;
                    return false;
                } else return true
            }))
        }

        // removes elements from other substack as a bag/set operation
        removeSubstack (other : SubStack) : SubStack {
            return other.ary.reduce (
                (prev, item) => prev.removeOne(item),
                this
            )
        }

        substackIntersection (other : SubStack) : SubStack {
            return this.removeSubstack (this.removeSubstack (other))
        }

        substackUnion (other : SubStack) : SubStack {
            return this.cat (other.removeSubstack (this)) 
        }

        addIfNew (item : any) : SubStack {
            return this.has (item) ? this :
            new SubStack ([...this.ary, item]);
        }

        uniqify () : SubStack {
            return this.ary.reduce (
                (prev, item) => prev.addIfNew(item),
                new SubStack ([])
            );
        }

        slice (...params) : SubStack { return new SubStack (this.ary.slice(...params)) }

        insert (pos: number, value : any) : SubStack {
            const posOffset = pos >= 0 ? pos : this.length - pos + 1
            return new SubStack ([
                ...this.ary.slice (0, posOffset),
                value,
                ...this.ary.slice (posOffset)
            ])
        }

        extract (pos: number) : any {
            if (!this.length) throw 'can\'t extract: substack empty'
            else if (pos >= this.length || pos < -this.length)
                throw 'can\'t extract: out of range'
            else return [
                new SubStack ([
                    ...this.ary.slice(0, pos),
                    ...this.ary.slice(pos + 1 || Infinity)
                ]), this.at(pos)
            ];
        }

        cat (other : SubStack) : SubStack {
            return new SubStack ([...this.ary, ...other.ary])
        }

        cut (pos: number) : Array<SubStack> {
            return [
                new SubStack (this.ary.slice(0, pos)),
                new SubStack (this.ary.slice(pos))
            ]
        }

        reverse () : SubStack { return new SubStack (this.ary.reverse()) }
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
                    if (element instanceof ID || element instanceof Structures.SubStack) {
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
                        result += formatString(element);
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

                    if (typeof element === 'string')
                        result += formatString(element);
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

globalThis.Polca = Polca;

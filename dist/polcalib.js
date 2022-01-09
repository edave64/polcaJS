polcaLib = (function () {
    const dict = {
        version: Polca.version,
        // imports from Math
        'abs ||': Math.abs, 'sign ±': Math.sign,
        exp: Math.exp,
        'floor ⌋': Math.floor, 'ceil ⌉': Math.ceil,
        'min ⌊': Math.min, 'max ⌈': Math.max,
        round: Math.round,
        'sqrt 2√': Math.sqrt,
        rand: Math.random,
        ln: Math.log,
        'pi π': Math.PI, 'tau τ': Math.PI * 2,
        e: Math.E,
        hypot: (substack) => Math.hypot(...substack.ary),
        sin: Math.sin, asin: Math.asin, sinh: Math.sinh, asinh: Math.asinh,
        cos: Math.cos, acos: Math.acos, cosh: Math.cosh, acosh: Math.acosh,
        tan: Math.tan, atan: Math.atan, tanh: Math.tanh, atanh: Math.atanh,
        // various mathematical
        'pow ^ **': (a, b) => a ** b, 'root rt √': (a, b) => a ** (1 / b),
        log: (x, base) => Math.log(x) / Math.log(base),
        l10: x => Math.log(x) / Math.LN10, l2: x => Math.log(x) / Math.LN2,
        'inc ++': x => x + 1, 'dec --': x => x - 1,
        '_': x => -x,
        div: (x, y) => (x - x % y) / y,
        'mod %': (a, b) => ((a % b) + b) % b,
        '=': (a, b) => Number(Polca.equal(a, b)),
        // Forth stack operations
        'drop ;': a => { }, '2drop 2;': (a, b) => { },
        'dup |\\': a => [a, a], '2dup 2|\\': (a, b) => [a, b, a, b],
        'swap ><': (a, b) => [b, a], '2swap >><<': (a, b, c, d) => [c, d, a, b],
        'rot ><<': (a, b, c) => [b, c, a], '-rot >><': (a, b, c) => [c, a, b],
        'over': (a, b) => [a, b, a], 'tuck': (a, b) => [b, a, b],
        'nip': (a, b) => [b],
        'pick @>'(from) { return this.stack.at(from); },
        'roll @><'(position) {
            return this.stack.ary.splice(-1 - position, 1);
        },
        // various stack operations
        'dropall ;;'() {
            this.stack.dropAll();
        },
        'nroll @n><'(position, amount) {
            return this.stack.ary.splice(-1 - position, amount);
        },
        // others
        'exec !'(arg) {
            if (arg.type == 'Function')
                return arg.call(this);
            else if (arg instanceof Polca.SubStack) {
                const param = this.stack.ary.pop();
                const { ary } = arg;
                return ary[param < 0 ? ary.length + param : param];
            }
            else
                throw '"!" only works on arrays and functions';
        },
        'typeof': (v) => v.type,
        'set :'(value, name) {
            this.scope.set(name, value);
        },
        'setall ::'(value, names) {
            names.ary.forEach(name => this.scope.set(name, value));
        },
        'get .'(name) {
            return this.scope.get(name);
        },
        info(str) {
            this.info.push(str);
        },
        'times ?'(proc, number) {
            for (; number > 0; number--) {
                proc.call(this);
            }
        },
        '2map ¨'(vec1, vec2, fun) {
            const { SubStack } = Polca;
            let count = 0;
            const goal = Math.max(vec1.length ?? 1, vec2.length ?? 1);
            let result = new SubStack([]);
            const access = (vec, idx) => vec instanceof SubStack ? vec.at(idx % vec.length) :
                typeof vec == 'string' ? vec[idx % vec.length] :
                    vec;
            do {
                result = result.cat(polcaLib.execIn(fun, new SubStack([
                    access(vec1, count),
                    access(vec2, count)
                ])));
            } while (++count < goal);
            return result;
        },
        '?else ?:'(proc, else_, number) {
            if (number > 0)
                for (; number > 0; number--) {
                    proc.call(this);
                }
            else if (number <= 0)
                for (; number <= 0; number++) {
                    else_.call(this);
                }
        },
        timesI(proc, number) {
            for (; number > 0; number--) {
                this.stack.push(number);
                proc.call(this);
            }
        },
        'length #'(obj) {
            if (obj instanceof String || obj instanceof Polca.SubStack)
                return obj.length;
            else
                throw new Error("length is not implemented for this type");
        },
        forLength(proc, rest) {
            while (this.stack.length > rest) {
                proc.call(this);
            }
        },
        number(x) {
            return Number(x);
        },
        /* Based on JavaCalc 1.6  ©1996-2000 Ken Kikuchi { */
        factorial(n) {
            switch (true) {
                case n < 0: /* if negative */
                    return polcaLib.gamma(n + 1);
                case n === 0 || n === 1:
                    return 1;
                case polcaLib.abs(n) - polcaLib.floor(polcaLib.abs(n)) === 0: /* if positive integer */
                    return n * polcaLib.factorial(n - 1);
                default: /* if non-integer */
                    return polcaLib.gamma(n + 1);
            }
        },
        'gamma γ'(x) {
            if (x <= 0) {
                if (polcaLib.abs(x) - polcaLib.floor(polcaLib.abs(x)) === 0)
                    throw "Complex Infinity";
                else
                    return polcaLib.PI /
                        (polcaLib.sin(polcaLib.PI * x) * polcaLib.exp(polcaLib.loggamma(1 - x)));
            }
            else
                return polcaLib.exp(polcaLib.loggamma(x));
        },
        loggamma(x) {
            var v = 1, w;
            while (x < 8) {
                v *= x;
                x++;
            }
            w = 1 / (x * x);
            return ((((((((-3617 / 122400) * w + 7 / 1092) * w - 691 / 360360) * w + 5 / 5940) * w - 1 / 1680) * w + 1 / 1260) * w - 1 / 360) * w + 1 / 12) / x + 0.5 * polcaLib.ln(2 * polcaLib.PI) - polcaLib.ln(v) - x + (x - 0.5) * polcaLib.ln(x);
        },
        /* } Based on JavaCalc 1.6  ©1996-2000 Ken Kikuchi */
        'cat , 😺'(a, b) {
            if (a.type === b.type && a.cat)
                return a.cat(b);
            else if (typeof a == 'string' && typeof b == 'string')
                return a + b;
            else {
                throw new Error("Type Error: can only concatenate two functions, substacks or strings");
            }
        },
        'compare <>': (a, b) => a < b ? -1 : a > b ? 1 : 0,
        // substack operations
        'push |<'(substack, value) {
            if (!(substack instanceof Polca.SubStack))
                throw new Error("push is not implemented for this type");
            else
                return substack.insert(-1, value);
        },
        'pop |>'(substack) {
            if (!(substack instanceof Polca.SubStack))
                throw new Error("pop is not implemented for this type");
            else
                return substack.extract(-1);
        },
        'unshift >|'(substack, value) {
            if (!(substack instanceof Polca.SubStack))
                throw new Error("unshift is not implemented for this type");
            else
                return substack.insert(0, value);
        },
        'shift <|'(substack) {
            if (!(substack instanceof Polca.SubStack))
                throw new Error("shift is not implemented for this type");
            else
                return substack.extract(0);
        },
        'extract <|>'(substack, pos) { return substack.extract(pos); },
        'insert >|<'(substack, value, pos) { return substack.insert(pos, value); },
        'at @'(substack, pos) { return substack.at(pos); },
        'slice |/| 🔪'(substack, start, end) { return substack.slice(start, end); },
        'reverse rev Я'(arg) {
            if (arg instanceof Polca.SubStack)
                return arg.reverse();
            else if (typeof arg == 'string')
                return arg.split('').reverse('').join('');
            else
                throw Error("'reverse' is not implemented for this type");
        },
        'cut </> ✂'(substack, pos) { return substack.cut(pos); },
        'first car head 1st'(substack) {
            if (!(substack instanceof Polca.SubStack))
                throw new Error("'first' is not implemented for this type");
            else
                return substack.at(0);
        },
        'without ⯾': (substack1, substack2) => substack1.removeSubstack(substack2),
        'union ∪': (substack1, substack2) => substack1.substackUnion(substack2),
        'intersection ∩': (substack1, substack2) => substack1.substackIntersection(substack2),
        'dissolve …'(substack) {
            if (!(substack instanceof Polca.SubStack))
                throw new Error("dissolve is not implemented for this type");
            return substack.ary;
        },
        'box □'() {
            return new Polca.SubStack(this.stack.ary.splice(0));
        },
        /**
         * @param {Polca.Structures.Func} callback
         * @param {Polca.SubStack} substack
         */
        execIn(callback, substack) {
            if (!(callback instanceof Polca.Structures.CustomFunc))
                throw new Error("execIn is not implemented for this type");
            if (!(substack instanceof Polca.SubStack))
                throw new Error("execIn is not implemented for this type");
            var execStack = substack.fork();
            callback.call(new Polca.Context(this.scope, execStack, this.info));
            return execStack;
        },
        cLog: x = console.log(x)
    };
    const polcaLib = {};
    for (const name in dict) {
        name.split(' ').forEach(symbol => polcaLib[symbol] = dict[name]);
    }
    Number.prototype.type = 'number';
    String.prototype.type = 'string';
    Function.prototype.type = 'procedure';
    // Push operator methods to polcaLib module
    ['+', '-', '*', '/'].forEach(function (op) {
        polcaLib[op] = new Function('a,b', 'return a' + op + 'b');
    });
    // Same for comparisons
    ['<', '<=', '>=', '>'].forEach(function (op) {
        polcaLib[op] = new Function('a,b', 'return polcaLib.compare(a, b)' + op + '0');
    });
    return polcaLib;
}());
//# sourceMappingURL=polcalib.js.map
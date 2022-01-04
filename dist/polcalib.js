polcaLib = (function () {
    var polcaLib = {
        version: "0.9",
        abs: Math.abs,
        exp: Math.exp,
        floor: Math.floor,
        ceil: Math.ceil,
        pow: Math.pow,
        '^': Math.pow,
        rt: function (a, b) {
            return Math.pow(a, 1 / b);
        },
        drop: function (a) {
        },
        dropall: function () {
            this.stack.dropAll();
        },
        dup: (a) => [a, a],
        exec: (func) => func.call(this),
        swap: (a, b) => [b, a],
        pick: function (from) {
            return this.stack.ary[this.stack.ary.length - from];
        },
        rot: (a, b, c) => [b, c, a],
        'typeof': (v) => v.type,
        set: function (value, name) {
            this.scope.set(name, value);
        },
        get: function (name) {
            return this.scope.get(name);
        },
        info: function (str) {
            this.info.push(str);
        },
        times: function (proc, number) {
            for (; number > 0; number--) {
                proc.call(this);
            }
        },
        '?else': function (proc, else_, number) {
            if (number > 0)
                for (; number > 0; number--) {
                    proc.call(this);
                }
            else if (number <= 0)
                for (; number <= 0; number++) {
                    else_.call(this);
                }
        },
        timesI: function (proc, number) {
            for (; number > 0; number--) {
                this.stack.push(number);
                proc.call(this);
            }
        },
        length: function (obj) {
            if (obj instanceof String) {
                return obj.length;
            }
            if (obj instanceof Polca.SubStack) {
                return obj.ary.length;
            }
            throw new Error("length is not implemented for this type");
        },
        forLength: function (proc, rest) {
            while (this.stack.ary.length > rest) {
                proc.call(this);
            }
        },
        number: function (x) {
            return Number(x);
        },
        /* Based on JavaCalc 1.6  ©1996-2000 Ken Kikuchi { */
        factorial: function (n) {
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
        gamma: function (x) {
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
        loggamma: function (x) {
            var v = 1, w;
            while (x < 8) {
                v *= x;
                x++;
            }
            w = 1 / (x * x);
            return ((((((((-3617 / 122400) * w + 7 / 1092) * w - 691 / 360360) * w + 5 / 5940) * w - 1 / 1680) * w + 1 / 1260) * w - 1 / 360) * w + 1 / 12) / x + 0.5 * polcaLib.ln(2 * polcaLib.PI) - polcaLib.ln(v) - x + (x - 0.5) * polcaLib.ln(x);
        },
        /* } Based on JavaCalc 1.6  ©1996-2000 Ken Kikuchi */
        '++': function (x) {
            return x - 1;
        },
        '--': function (x) {
            return x + 1;
        },
        ln: Math.log,
        log: function (x, base) {
            return Math.ln(x) / Math.ln(base);
        },
        l10: function (x) {
            return Math.ln(x) / Math.LN10;
        },
        l2: function (x) {
            return Math.log(x) / Math.LN2;
        },
        div: function (x, y) {
            return (x - x % y) / y;
        },
        rand: function () {
            return Math.random();
        },
        cat: function (a, b) {
            if (a.type === a.type && a.cat) {
                return a.cat(b);
            }
            else {
                throw new Error("Type Error: can only concatenate two functions or substacks");
            }
        },
        compare: function (a, b) {
            return a < b ? -1 : a > b ? 1 : 0;
        },
        push: function (value, substack) {
            if (!(substack instanceof Polca.SubStack))
                throw new Error("push is not implemented for this type");
            return substack.libPush(value);
        },
        pop: function (substack) {
            if (!(substack instanceof Polca.SubStack))
                throw new Error("pop is not implemented for this type");
            return substack.libPop();
        },
        dissolve: function (substack) {
            if (!(substack instanceof Polca.SubStack))
                throw new Error("integrate is not implemented for this type");
            return substack.ary;
        },
        /**
         * @param {Polca.Structures.Func} callback
         * @param {Polca.SubStack} substack
         */
        execIn: function (callback, substack) {
            if (!(callback instanceof Polca.Structures.CustomFunc))
                throw new Error("execIn is not implemented for this type");
            if (!(substack instanceof Polca.SubStack))
                throw new Error("execIn is not implemented for this type");
            var execStack = substack.fork();
            callback.call(new Polca.Context(this.scope, execStack, this.info));
            return execStack;
        }
    };
    Number.prototype.type = 'number';
    String.prototype.type = 'string';
    Function.prototype.type = 'procedure';
    // Push operator methods to polcaLib module
    ['+', '-', '*', '/', '%', '&', '|'].forEach(function (op) {
        polcaLib[op] = new Function('a,b', 'return a' + op + 'b');
    });
    // Same for comparisons
    ['<', '<=', '>=', '>', '!='].forEach(function (op) {
        polcaLib[op] = new Function('a,b', 'return polcaLib.compare(a, b)' + op + '0');
    });
    polcaLib["="] = function (a, b) {
        return Number(polcaLib.compare(a, b) === 0);
    };
    polcaLib['<>'] = polcaLib.compare;
    // Constants
    polcaLib.π = polcaLib.pi = Math.PI;
    polcaLib.e = Math.E;
    polcaLib.tau = polcaLib.τ = Math.PI * 2;
    // Unicode symbols
    polcaLib['≠'] = polcaLib['!='];
    polcaLib['≤'] = polcaLib['<='];
    polcaLib['≥'] = polcaLib['>='];
    // Other shorthand symbols
    polcaLib['.'] = polcaLib.get;
    polcaLib[':'] = polcaLib.set;
    polcaLib[';'] = polcaLib.dropall;
    polcaLib['?'] = polcaLib.times;
    polcaLib['|>'] = polcaLib.pop;
    polcaLib['|<'] = polcaLib.push;
    polcaLib['!'] = polcaLib.exec;
    polcaLib['><'] = polcaLib.swap;
    polcaLib['😺'] = polcaLib[','] = polcaLib.cat;
    return polcaLib;
}());
//# sourceMappingURL=polcalib.js.map
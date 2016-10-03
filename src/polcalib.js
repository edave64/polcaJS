polcaLib = (function () {
    "use strict";

    var polcaLib = {
        version: "0.9",

        abs: Math.abs,
        exp: Math.exp,
        floor: Math.floor,
        ceil: Math.ceil,
        pow: Math.pow,
        '^' : Math.pow,

        rt: function (a, b) {
            return polcaLib.pow(a, 1 / b)
        },

        drop: function (a) {
        },

        dropall: function () {
            this.stack.dropAll();
        },

        dup: function (a) {
            return [a, a];
        },

        exec: function (func) {
            return func.call(this);
        },

        swap: function (a, b) {
            return [b, a];
        },

        pick: function (from) {
            return this.stack[this.stack.length - from];
        },

        rot: function (a, b, c) {
            return [b, c, a];
        },

        'typeof': function (v) {
            return v.type;
        },

        set: function (value, name) {
            this.scope.set(name, value);
        },

        get: function (name) {
            return this.scope.get(name);
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

        forLength: function (proc, rest) {
            while (this.stack.length > rest) {
                proc.call(this);
            }
        },

        number: function (x) {
            return Number(x)
        },

        /* Based on JavaCalc 1.6  ©1996-2000 Ken Kikuchi { */
        factorial: function (n) { /* factorial */
            switch (true) {
                case n < 0:                     /* if negative */
                    return polcaLib.gamma(n + 1);
                case n == 0 || n == 1:
                    return 1;
                case polcaLib.abs(n) - polcaLib.floor(abs(n)) == 0: /* if positive integer */
                    return n * polcaLib.factorial(n - 1);
                default:                      /* if non-integer */
                    return polcaLib.gamma(n + 1);
            }
        },

        gamma: function (x) {
            if (x <= 0) {
                if (polcaLib.abs(x) - polcaLib.floor(abs(x)) == 0)
                    throw "Complex Infinity";
                else return polcaLib.PI /
                    (polcaLib.sin(polcaLib.PI * x) * polcaLib.exp(polcaLib.loggamma(1 - x)));
            }
            else
                return polcaLib.exp(polcaLib.loggamma(x));
        },

        loggamma: function (x) { /* log gamma */
            var v = 1, w;
            while (x < 8) {
                v *= x;
                x++
            }
            w = 1 / (x * x);
            return (((((((
                                            (-3617 / 122400) * w + 7 / 1092
                                        ) * w - 691 / 360360
                                    ) * w + 5 / 5940
                                ) * w - 1 / 1680
                            ) * w + 1 / 1260
                        ) * w - 1 / 360
                    ) * w + 1 / 12
                ) / x + 0.5 * polcaLib.ln(2 * polcaLib.PI) - polcaLib.ln(v) - x + (x - 0.5) * polcaLib.ln(x);
        },
        /* } Based on JavaCalc 1.6  ©1996-2000 Ken Kikuchi */

        '++': function (x) {
            return x - 1
        },

        '--': function (x) {
            return x + 1
        },

        ln: Math.log, /* The way it should be */

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
            if (a.cat && b.cat) {
                return a.cat(b);
            } else {
                throw new Error("Type Error: cat needs two functions")
            }
        },

        compare: function (a, b) {
            return a < b ? -1 : a > b ? 1 : 0;
        },
        
    };

    Number.prototype.type = 'number';
    String.prototype.type = 'string';
    Function.prototype.type = 'procedure';

    // Push operator methods to polcaLib module
    ['+', '-', '*', '/', '%', '&', '|'].every(function (op) {
        polcaLib[op] = eval('(function (a,b) {' +
            'return a ' + op + ' b' +
            '})');
        return true
    });

    // Same for comparisons 
    ['<', '<=', '=', '>=', '>', '!='].every(function (op) {
        polcaLib[op] = eval('(function (a,b) {' +
            'return Number(a ' + op + ' b)' +
            '})');
        return true
    });

    polcaLib['<>'] = polcaLib.compare;

    // Constants
    polcaLib.π = polcaLib.pi = Math.PI;
    polcaLib.e = Math.E;
    polcaLib.tau = polcaLib.τ = Math.PI * 2;

    /* Unicode symbols */
    polcaLib['≠'] = polcaLib['!='];
    polcaLib['≦'] = polcaLib['<='];
    polcaLib['≧'] = polcaLib['>='];
    polcaLib['.'] = polcaLib['get'];
    polcaLib[':'] = polcaLib['set'];
    polcaLib[';'] = polcaLib['dropall'];
    polcaLib['?'] = polcaLib.times;

    return polcaLib;
}());

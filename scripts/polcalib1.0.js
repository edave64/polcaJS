polcaLib = {};
polcaLib.version = '1.0';

Number.prototype.type = 'number';
String.prototype.type = 'string';
Function.prototype.type = 'procedure';

// Push operator methods to polcaLib module
['+', '-', '*', '/', '%', '&', '|'].every(function (opp) {
    polcaLib[opp] = eval('(function (a,b) {' +
        'return a ' + opp + ' b' +
        '})');
    return true
});

/* Push binary returning Operators to Math module (false and true to 0 and 1)*/
['<', '>', '='].every(function (opp) {
    polcaLib[opp] = eval('(function (a,b) {' +
        'return Number(a ' + opp + ' b)' +
        '})');
    return true;
});

/* Use opposite Operators to reduce code for extensions */
[
    ['<=', '>'],
    ['>=', '<'],
    ['!=', '=']
].every(function (opps) {
    var operator = opps[1];
    polcaLib[opps[0]] = function (a, b) {
        return Number(!polcaLib[operator](a, b));
    };
    return true;
});

// Constants
_.extend(polcaLib, function () {
    this.π = this.pi = this.PI = Math.PI;
    this.e = this.E = Math.E;
    this.tau = this.τ = this.π * 2
});

//noinspection JSUnusedGlobalSymbols
_.extend(polcaLib, {
    abs: Math.abs,
    exp: Math.exp,
    floor: Math.floor,
    ceil: Math.ceil,
    pow: Math.pow,

    rt: function (a, b) {
        return polcaLib.pow(a, 1 / b)
    },

    drop: function (a) {
    },

    dropall: function () {
        this.stack = [];
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
        this.userScope[name] = value;
    },

    get: function (name) {
        return this.get(name);
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
            this.push(number);
            proc.call(this);
        }
    },

    forLength: function (proc, rest) {
        while (this.length > rest) {
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

    '++': function (o) {
        return polcaLib['+'](o, 1)
    },

    '--': function (o) {
        return polcaLib['-'](o, 1)
    },

    ln: Math.log, /* The way it should be */

    log: function (x, base) {
        if (x.type == 'ratio') x = x.toNumber();
        return polcaLib.ln(x) / polcaLib.ln(base);
    },

    l10: function (x) {
        return polcaLib.ln(x) / polcaLib.LN10;
    },

    l2: function (x) {
        return polcaLib.ln(x) / polcaLib.LN2;
    },

    div: function (x, y) {
        return (x - x % y) / y;
    },

    rand: function () {
        return polcaLib.random();
    },

    cat: function (a, b) {
        if (a instanceof polca.structures.Func && b instanceof polca.structures.Func) {
            var newFunc = new polca.structures.Func;
            newFunc.elements = a.elements.concat(b.elements);
            return newFunc;
        } else {
            throw new Error("Type Error: cat needs two functions")
        }

    }
});


/* Alias methods and Operators */
_.extend(polcaLib, function () {
    this['?'] = this.times;

    /* Unicode symbols */
    this['≠'] = this['!='];
    this['≦'] = this['<='];
    this['≧'] = this['>='];
    this['.'] = this['get'];
    this[':'] = this['set'];
    this[';'] = this['dropall'];
});

var Ratio = (function () {
    function Ratio(num, denom) {
        this.type = 'ratio';
        var tens, gcd;
        if (!denom && typeof num == 'number' && !isNaN(num) && isFinite(num)) {
            tens = 1;
            // find numbers after comma to make flat numbers
            if (num % 1 != 0)
                tens = Math.pow(10, (num % 1).toString().length - 2);
            num = num * tens;
            denom = tens;
        }
        else if (typeof num == 'number' && typeof denom == 'number'
            && !isNaN(num) && !isNaN(denom) && isFinite(num) && isFinite(denom)) {
            if (!(num % 1 == 0 && denom % 1 == 0)) {
                // find numbers after comma to make flat numbers
                tens = Math.pow(10, Math.max((num % 1).toString().length - 2, (denom % 2).toString().length - 2));
                num = num * tens;
                denom = denom * tens;
            }
        }
        else {
            throw 'numerator and denominator have to be numbers';
        }
        gcd = Ratio.gcd(num, denom);
        this.numerator = num / gcd;
        this.denominator = denom / gcd;
    }
    /* Calculates the greatest common divisor */
    Ratio.gcd = function (num, denom) {
        var a = num, b = denom, r = 0;
        while (b != 0) {
            r = a % b;
            a = b;
            b = r;
        }
        return a;
    };
    Ratio.prototype.toNumber = function () {
        return this.numerator / this.denominator;
    };
    Ratio.prototype.toString = function () {
        return 'ratio ' + this.numerator.toString() + ' ' +
            this.denominator.toString();
    };
    return Ratio;
}());
(function () {
    function convert(a) {
        if (a instanceof Ratio)
            return a;
        else
            return new Ratio(a);
    }
    function binaryRatioWrap(oldFunc, alternative) {
        var func = function (a, b) {
            if (a instanceof Ratio || b instanceof Ratio) {
                a = convert(a);
                b = convert(b);
                alternative(a, b);
            }
            else
                oldFunc(a, b);
        };
        func.name = oldFunc.name;
    }
    polcaLib['+'] = binaryRatioWrap(polcaLib['+'], function (a, b) {
        return new Ratio(a.numerator * b.denominator + b.numerator * a.denominator, a.denominator * b.denominator);
    });
    polcaLib['-'] = binaryRatioWrap(polcaLib['-'], function (a, b) {
        return new Ratio(a.numerator * b.denominator - b.numerator * a.denominator, a.denominator * b.denominator);
    });
    polcaLib['*'] = binaryRatioWrap(polcaLib['*'], function (a, b) {
        return new Ratio(a.numerator * b.numerator, a.denominator * b.denominator);
    });
    polcaLib['/'] = binaryRatioWrap(polcaLib['/'], function (a, b) {
        return new Ratio(a.numerator * b.denominator, a.denominator * b.numerator);
    });
    polcaLib['^'] = binaryRatioWrap(polcaLib['^'], function (a, b) {
        return Math['^'](a.toNumber(), b.toNumber());
    });
    polcaLib['compare'] = binaryRatioWrap(polcaLib['compare'], function (a, b) {
        return polcaLib['compare'](a.toNumber(), b.toNumber());
    });
}());
$.extend(polcaLib, function () {
    /* extend number method */
    var oldNumber = this.number;
    this.number = function (a) {
        if (a['toNumber'])
            return a.toNumber();
        else
            return oldNumber(a);
    };
});
$.extend(polcaLib, {
    ratio: function (a, b) {
        return new Ratio(a, b);
    },
    numerator: function (ratio) {
        if (ratio instanceof Ratio)
            return ratio.numerator;
        else
            return (new Ratio(ratio)).numerator;
    },
    denominator: function (ratio) {
        if (ratio instanceof Ratio)
            return ratio.denominator;
        else
            return (new Ratio(ratio)).denominator;
    }
});
//# sourceMappingURL=ratio.js.map
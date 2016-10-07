class Ratio {
    public type = 'ratio';
    public numerator;
    public denominator;

    constructor(num, denom?) {
        var tens, gcd;
        if (!denom && typeof num == 'number' && !isNaN(num) && isFinite(num)) {
            tens = 1;
            // find numbers after comma to make flat numbers
            if (num % 1 != 0) tens = Math.pow(10, (num % 1).toString().length - 2);
            num = num * tens;
            denom = tens
        } else if (typeof num == 'number' && typeof denom == 'number'
                && !isNaN(num) && !isNaN(denom) && isFinite(num) && isFinite(denom)) {
            if (!(num % 1 == 0 && denom % 1 == 0)) {
                // find numbers after comma to make flat numbers
                tens = Math.pow(10, Math.max(
                    (num % 1).toString().length - 2,
                    (denom % 2).toString().length - 2
                ));

                num = num * tens;
                denom = denom * tens
            }
        } else {
            throw 'numerator and denominator have to be numbers'
        }

        gcd = Ratio.gcd(num, denom);
        this.numerator = num / gcd;
        this.denominator = denom / gcd;
    }


    /* Calculates the greatest common divisor */
    private static gcd(num: number, denom: number) {
        var a = num,
            b = denom,
            r = 0;

        while (b != 0) {
            r = a % b;
            a = b;
            b = r
        }
        return a
    }

    toNumber() {
        return this.numerator / this.denominator
    }

    toString() {
        return 'ratio ' + this.numerator.toString() + ' ' +
            this.denominator.toString()
    }
}
(function () {
    function convert (a): any {
        if (a instanceof Ratio) return a;
        else return new Ratio (a);
    }

    function binaryRatioWrap (oldFunc, alternative) {
        var func = function (a, b) {
            if (a instanceof Ratio || b instanceof Ratio) {
                a = convert(a);
                b = convert(b);
                return alternative(a, b);
            } else return oldFunc(a, b);
        };
        func['name'] = oldFunc.name;
        return func;
    }

    polcaLib['+'] = binaryRatioWrap(polcaLib['+'],
        (a, b) => new Ratio(
            a.numerator * b.denominator + b.numerator * a.denominator,
            a.denominator * b.denominator
        ));

    polcaLib['-'] = binaryRatioWrap(polcaLib['-'],
        (a, b) => new Ratio(
            a.numerator * b.denominator - b.numerator * a.denominator,
            a.denominator * b.denominator
        ));

    polcaLib['*'] = binaryRatioWrap(polcaLib['*'],
        (a, b) => new Ratio(
            a.numerator * b.numerator,
            a.denominator * b.denominator
        ));

    polcaLib['/'] = binaryRatioWrap(polcaLib['/'],
        (a, b) => new Ratio(
            a.numerator * b.denominator,
            a.denominator * b.numerator
        ));

    polcaLib.pow = binaryRatioWrap(polcaLib.pow,
        (a, b) => polcaLib.pow(a.toNumber(), b.toNumber()));

    polcaLib.compare = binaryRatioWrap(polcaLib.compare,
        (a, b) => polcaLib.compare(a.toNumber(), b.toNumber()));
}());

/* extend number method */
var oldNumber = polcaLib.number;
polcaLib.number = function (a) {
    if (a['toNumber'])
        return a.toNumber();
    else
        return oldNumber(a)
};

polcaLib['ratio'] = function (a,b) {
    return new Ratio (a,b)
};

polcaLib['ratio/numerator'] = function (ratio) {
    if (ratio instanceof Ratio)
        return ratio.numerator;
    else
        return (new Ratio (ratio)).numerator
};
polcaLib['ratio/denominator'] = function (ratio) {
    if (ratio instanceof Ratio)
        return ratio.denominator;
    else
        return (new Ratio (ratio)).denominator
};

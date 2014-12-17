Ratio = $.proto({
    type: 'ratio',

    init: function (num,denom) {
        if (!denom && typeof num == 'number' && !isNaN(num) && isFinite(num)) {
            var tens = 1
            // find numbers after comma to make flat numbers
            if (num % 1 != 0) tens = Math.pow(10, (num%1).toString().length-2)
            this.numerator = num * tens
            this.denominator = tens
        } else if (typeof num == 'number' && typeof denom == 'number'
              && !isNaN(num) && !isNaN(denom) && isFinite(num) && isFinite(denom)) {
            if (num % 1 == 0 && denom % 1 == 0) {
                this.numerator = num
                this.denominator = denom
            } else {
                // find numbers after comma to make flat numbers
                var tens = Math.pow(10, Math.max(
                    (num%1).toString().length-2,
                    (denom%2).toString().length-2
                ))

                this.numerator = num * tens
                this.denominator = denom * tens
            }
        } else {
            throw 'numerator and denominator have to be numbers'
        }
        this.shorten()
    },

    /* Calculates the greatest common divisor */
    gcd : function () {
        var a = this.numerator,
            b = this.denominator,
            r = 0

        while (b != 0) {
            r = a % b
            a = b
            b = r
        }
        return a
    },

    shorten: function () {
        var t = this.gcd()
        this.numerator   = this.numerator / t
        this.denominator = this.denominator / t
    },

    toNumber: function () {
        return this.numerator / this.denominator
    },

    toString: function () {
        return 'ratio ' + this.numerator.toString() + ' ' +
            this.denominator.toString()
    }
})

Operators['ratio'] = {
    number:{},
    ratio: {
        '+': function (a,b) {
            return new Ratio (
                a.numerator * b.denominator + b.numerator * a.denominator,
                a.denominator * b.denominator
            )
        },

        '-': function (a,b) {
            return new Ratio (
                a.numerator * b.denominator - b.numerator * a.denominator,
                a.denominator * b.denominator
            )
        },

        '*': function (a,b) {
            return new Ratio (
                a.numerator * b.numerator,
                a.denominator * b.denominator
            )
        },

        '/': function (a,b) {
            return new Ratio (
                a.numerator * b.denominator,
                a.denominator * b.numerator
            )
        },

        '^': function (a,b) {
            return Math['^'](a.toNumber(),b.toNumber())
        },

        '=': function (a,b) {
            alert(a.toNumber())
            alert(b.toNumber())
            return a.toNumber() == b.toNumber()
        },

        '>': function (a,b) {
            return a.toNumber() > b.toNumber()
        },

        '<': function (a,b) {
            return a.toNumber() < b.toNumber()
        }
    }
} // ratio

$.extend(Math, function () {
    /* extend number method */
    var oldNumber = this.number;
    this.number = function (a) {
        if (a['toNumber'])
            return a.toNumber()
        else
            return oldNumber(a)
    }
})

$.extend(Math, {
    ratio : function (a,b) {
        return new Ratio (a,b)
    },
    numerator: function (ratio) {
        if (ratio instanceof Ratio)
            return ratio.numerator
        else
            return (new Ratio (ratio)).numerator
    },
    denominator: function (ratio) {
        if (ratio instanceof Ratio)
            return ratio.denominator
        else
            return (new Ratio (ratio)).denominator
    }
})

Operators['number']['ratio'] = {}

var opps = Operators['ratio']['ratio']
for (var i in opps)
    if (opps.hasOwnProperty(i)) {
        // Must be warpped with a proc, because else the inner lambdas
        // somehow forget the value of ''i'' (and because I won't use eval if
        // it can be avoided)
        (function(i){
            Operators['ratio']['number'][i] = function (a,b) {
                return Operators["ratio"]["ratio"][i](a, new Ratio (b))
            }
            Operators['number']['ratio'][i] = function (a,b) {
                return Operators["ratio"]["ratio"][i](new Ratio (a), b)
            }
        })(i)
    }

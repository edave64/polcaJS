// operator Dispacher
Operators = {
    number: { number: {}, string: {} },
    string: { number: {}, string: {} }
}

Number.prototype.type = 'number';
String.prototype.type = 'string';
Function.prototype.type = 'procedure';

// Push operator methods to Math module
['+','-','*','/','%','&','|'].every(function (opp) {
    //
    Math[opp] = function (a,b) {
        return Operators[a.type][b.type][opp](a,b)
    }
    // Create methods for standart Operators
    Operators["number"]["number"][opp] =
    Operators["string"]["number"][opp] =
    Operators["number"]["string"][opp] =
    Operators["string"]["string"][opp] = eval('(function (a,b) {\
        return a '+opp+' b\
    })')
    return true
});

/* Push binary returning Operators to Math module (false and true to 0 and 1)*/
['<','>'].every(function (opp) {
    Math[opp] = function (a,b) {
        return Operators[a.type][b.type][opp](a,b)
    }
    Operators["number"]["number"][opp] =
    Operators["string"]["number"][opp] =
    Operators["number"]["string"][opp] =
    Operators["string"]["string"][opp] = eval('(function (a,b) {\
        return Number(a '+opp+' b)\
    })')
    return true
});

/* Use opposite Operators to reduce operator dispaching */
[['<=', '>'], ['>=', '<'], ['!=', '=']].every(function(opps) {
    var operator = opps[1]
    Math[opps[0]] = function (a,b) {
        return Number(!Operators[a.type][b.type][operator](a,b))
    }
    return true
})

Operators["number"]["number"]['='] =
Operators["string"]["number"]['='] =
Operators["number"]["string"]['='] =
Operators["string"]["string"]['='] = (function (a,b) {
    return Number(a == b)
})

$.extend(Math, {
    'typeof': function (v) {
        return v.type
    },
    
    ':': function (name, value) {
        Math[name] = value;
    },
    
    get: function (name) {
        return Math[name]
    },
    
    '=': function (a,b) {
        return Operators[a.type][b.type]["="](a,b)
    },
    
    times: function (number, proc) {
        for (;number > 0;number--) {
            stack = proc()
        }
    },
    
    forLength: function (rest, proc) {
        while (stack.length > rest) {
            stack = proc()
        }
    },

    number: function (x) { return Number(x) },

    /* Based on JavaCalc 1.6  ©1996-2000 Ken Kikuchi { */
    factorial : function (n) { /* factorial */
        with(Math) {
          switch (true) {
          case n<0:                     /* if negative */
              return gamma(n+1);
          case n == 0 || n == 1:
              return 1;
          case abs(n)-floor(abs(n))==0: /* if positive integer */
              return n * factorial(n-1) ;
          default:                      /* if non-integer */
              return gamma(n+1);
          }
        }
    },

    gamma: function (x) {
        with(Math) {
            if ( x <= 0 ) {
                if (abs(x)-floor(abs(x))==0 )
                    throw "Complex Infinity" ;
                else return PI/( sin(PI*x) * exp( loggamma(1-x) ) );
                }
            else
                return exp(loggamma(x)) ;
        }
    },

    loggamma: function (x)  { /* log gamma */
        with(Math) {
            var v=1, w=0, z=0;
            while ( x<8 ) { v*=x; x++ }
            w=1/(x*x);
            return (((((((
                          (-3617/122400)*w + 7/1092
                         )*w-691/360360
                        )*w + 5/5940
                       )*w-1/1680
                      )*w + 1/1260
                     )*w-1/360
                    )*w+ 1/12
                   )/x+ 0.5 * ln(2*PI)-ln(v)-x+(x-0.5)*ln(x) ;
        }
    },
    /* } Based on JavaCalc 1.6  ©1996-2000 Ken Kikuchi */

    '++': function (o) {return Math['+'](o, 1)},
    '--': function (o) {return Math['-'](o, 1)},
    ln: Math.log, /* The way it should be */
    log: function (x,base) {
        if (x.type == 'ratio') x = x.toNumber()
        return Math.ln(x) / Math.ln(base)
    },
    l10: function (x) {
        return Math.ln(x) / Math.LN10
    },
    l2: function (x) {
        return Math.ln(x) / Math.LN2
    },
    div: function (x,y) {
        return (x-x%y) / y
    },
    
    rand: function () {
        return Math.random()
    }
});

/* Alias methods and Operators */
$.extend(Math, function () {
    this['^']  = function (a,b) { return Operators[a.type][b.type]['^'](a,b) }
    this['&&'] = this.and =
        function (a,b) { return Operators[a.type][b.type]['&&'](a,b) }
    this['||'] = this.or =
        function (a,b) { return Operators[a.type][b.type]['||'](a,b) }
    this['!']  = function (a) { return Operators[a.type]['!'](a) }

    /* Unicode symbols */
    this['≠'] = this['!=']
    this['≦'] = this['<=']
    this['≧'] = this['>='];
    this.π = this.pi = this.PI
    this.e = this.E
    this.tau = this.τ = this.π * 2
})

$.extend(Operators.number, {
    '!':  Math.factorial
})

$.extend(Operators.number.number, {
    '^':  Math.pow,
    '&&': Math.min,
    '||': Math.max
})

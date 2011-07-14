// Polca testing
var $ = require('../scripts/protojazz-min.js'),
    fs = require('fs'),
    polca
eval(fs.readFileSync('../scripts/polca08.js', 'utf-8'))
eval(fs.readFileSync('../scripts/polcalib.js', 'utf-8'))
eval(fs.readFileSync('../scripts/ratio.js', 'utf-8'))

Array.prototype.eql = function (other) {
    i = 0
    if (this.length != other.length) return false
    while (i <= this.length) {
        if (this[i] != other[i]) return false
        i++
    }
    return true
}

test_true = function(name, test){
    output = name + ': ';
    try {
        if (test())
            console.log(output + 'passed');
        else
            console.log(output + 'failed');
    } catch (e) {
        console.log(output + 'crashed!');
    }
}
stack = []
test_true('parsing', function(){ // 1 + 2 = 3
    return polca.calc('1 2 3', false).eql([1, 2, 3])
})

console.log('simple opperations')

test_true('add', function(){ // 1 + 2 = 3
    return polca.calc('+ 1 2', false).eql([3])
})

test_true('sub', function(){ // 1 - 2 = -1
    return polca.calc('1 2 -', true).eql([-1])
})

test_true('mul', function(){ // 1 * 2 = 2 | 2 * 6 = 12
    return polca.calc('* 1 2 * 2 6', false).eql([2,12])
})

test_true('div', function(){ // 1 / 2 = 0.5 | 2 / 6 = 2 / 6
    return polca.calc('1 2 / 2 6 /', true).eql([0.5,2/6])
})

test_true('mod', function(){ // (10 / 8) % 1 = 0.25
    return polca.calc('% / 10 8 1', false).eql([0.25])
})

test_true('equal', function(){ // 1 / 4 = 0.25 | 1 / 4 != 0.5
    return polca.calc('= / 1 4 0.25', false).eql([1]) &&
           polca.calc('= / 1 4 0.5',  false).eql([0])
})

test_true('unequal', function(){ // 1 / 4 = 0.25 | 1 / 4 != 0.5
    return polca.calc('!= / 1 4 0.25', false).eql([0]) &&
           polca.calc('!= / 1 4 0.5', false).eql([1])
})

console.log('assingment')

test_true('constant', function(){
    return polca.calc(': \'TRUE 1', false).eql([]) &&
           polca.calc('TRUE', false).eql([1])
})

test_true('results', function(){
    return polca.calc(': \'x1 * 3 4', false).eql([]) &&
           polca.calc('x1', false).eql([12])
})

test_true('native procedures', function(){
    return polca.calc(': \'define get \':', false).eql([]) &&
           polca.calc('define \'x2 number ratio 0.2 2', false).eql([]) &&
           polca.calc('x2', false).eql([0.1])
})

console.log('procedures')
test_true('exec', function(){
    return polca.calc('exec { + 1 } 2', false).eql([3])
})

test_true('times', function(){
    return polca.calc('times 10 { + 1 } 3', false).eql([13])
})

test_true('assingment', function(){
    return polca.calc('define \'inc3 {+ 3}', false).eql([]) &&
           polca.calc('inc3 4', false).eql([7])
})

test_true('notation handling', function(){
    return polca.calc('8 inc3', true).eql([11])
})

console.log('stack handling')
test_true('creation', function(){
    return polca.calc('8 3 4', false).eql([8,3,4]) &&
           polca.calc('8 3 4', true).eql([8,3,4])
})

test_true('deletion', function(){
    return polca.calc('del 1 8 3 4', false).eql([3,4]) &&
           polca.calc('8 3 4 2 del', true).eql([8])
})

test_true('swaping', function(){
    return polca.calc('swap 8 3 4', false).eql([3,8,4]) &&
           polca.calc('8 3 4 swap', true).eql([8,4,3])
})

test_true('multiple swaping', function(){
    return polca.calc('swap swap 8 3 4', false).eql([8,3,4]) &&
           polca.calc('8 3 4 swap swap', true).eql([8,3,4])
})

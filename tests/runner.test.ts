import '../src/polca';
import '../src/polcalib';

import { readFileSync, readdirSync } from 'fs';
import { cwd } from 'process';

function sum (a: number, b: number): number {
    return a + b;
}

const scope = Object.assign(Object.create(polcaLib), {
    test: function (func, name) {
        test(name, () => {
            if (func.type !== 'Function') {
                throw new Error("A test must be a function!");
            }
            const context = new Polca.Context (this.scope, new Polca.Stack(), this.info)
            return func.call(context);
        });
    },
    assert: function (a) {
        expect(a).toBe(1);
    },
    "=assert" (a, b) {
        if (Polca.equal(a, b)) return;
        expect(a).toBe(b);
    },
    assertCrash(func) {
        const context = new Polca.Context (this.scope.fork(), this.stack.fork(), this.info);
        expect(() => {
            (polcaLib as any).exec.call(context, func);
        }).toThrowError()
    },
    assertNoCrash(func) {
        const context = new Polca.Context (this.scope.fork(), this.stack.fork(), this.info);
        (polcaLib as any).exec.call(context, func);
    },
    parse(str) {
        return Polca.compile(str);
    }
});

const context = new Polca.Context(Polca.Scope.from(scope), new Polca.Stack());

const polcaStd = Polca.compile(readFileSync('./src/std.polca').toString());

polcaStd.call(context);

const testFiles = readdirSync('./tests').filter(x => x.endsWith('.test.polca'));

for (const file of testFiles) {
    describe(file, () => {
        const localContext = context.fork();
        const polcaContent = Polca.compile(readFileSync('./tests/' + file).toString());
        polcaContent.call(localContext);
    })
}

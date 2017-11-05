abstract class Iterator {
    public abstract next(context): [any, Iterator];
    public hasNext() {
        return 1;
    }
    public abstract skip (context, by: number): Iterator;
    public abstract toString(): string;
}

const emptyIterator: Iterator = {
    next: function(context) {
        throw new Error ("Cannot get element from an empty iterator");
    },

    hasNext: function() {
        return 0;
    },

    skip: function(context, by: number) {
        return emptyIterator;
    },

    toString: function() {
        return "empty-iter";
    }
};

const SubStack: Iterator = <Iterator><any>Polca.SubStack.prototype;

SubStack.next = function (context) {
    if (this.ary.length === 0) {
        throw new Error ("Cannot get element from an empty iterator");
    }
    if (this.ary.length === 1) {
        return [this.ary[0], emptyIterator];
    }
    const newS = new Polca.SubStack ();
    newS.ary = this.ary.slice(1);
    return [this.ary[0], <Iterator><any>newS];
};

SubStack.skip = function (context, by: number) {
    if (this.ary.length <= by) {
        return emptyIterator;
    }
    const newS = new Polca.SubStack ();
    newS.ary = this.ary.slice(by);
    return <Iterator><any>newS;
};

SubStack.hasNext = function () {
    return Number(this.ary.length !== 0);
};

class SubstackIterator extends Iterator {
    public static create (substack: Polca.SubStack, pos = 0) {
        if (substack.ary.length <= pos) {
            return emptyIterator;
        } else {
            return new SubstackIterator(substack, pos);
        }
    }

    private constructor(private subStack: Polca.SubStack, private pos = 0) { super(); }

    next(context) {
        return [this.subStack.ary[this.pos], SubstackIterator.create(this.subStack, this.pos + 1)];
    }

    skip(context, by: number) {
        return SubstackIterator.create(this.subStack, this.pos + by);
    }

    toString() {
        return this.subStack.toString() + " iter " + (this.pos > 0 ? this.pos + " skip" : "");
    }
}

class RangeIterator extends Iterator {
    public static create (start: number, end: number) {
        if (start > end) {
            return emptyIterator;
        } else {
            return new RangeIterator(start, end);
        }
    }

    private constructor(private start: number, private end: number) { super() }

    next(context) {
        return [this.start, RangeIterator.create(this.start + 1, this.end)];
    }

    skip(context, by: number): Iterator {
        return RangeIterator.create(this.start + by, this.end);
    }

    toString() {
        return this.start + " " + this.end + " range"
    }
}

function execTransformFunction (context, callback, value) {
    let stack = new Polca.SubStack();
    stack.ary = [value];

    callback.call(new Polca.Context (context.scope, stack, context.info));

    if (stack.ary.length !== 1) {
        throw new Error ("Map callback needs to return exactly one value");
    }

    return stack.ary[0];
}

class MapIterator extends Iterator {
    public static create (subEnum: Iterator, callback) {
        if (subEnum === emptyIterator) {
            return emptyIterator;
        } else {
            return new MapIterator(subEnum, callback);
        }
    }

    private constructor(private subEnum: Iterator, private callback) { super() }

    next(context) {
        let [val, nextSubEnumerator] = this.subEnum.next(context);
        return [execTransformFunction(context, this.callback, val), MapIterator.create(nextSubEnumerator, this.callback)];
    }

    skip(context, by: number): Iterator {
        return MapIterator.create(this.subEnum.skip(context, by), this.callback);
    }

    toString(): string {
        return this.subEnum.toString() + " " + this.callback.toString() + " map";
    }
}

class FilterIterator extends Iterator {
    public static create (context, subEnum: Iterator, callback) {
        while (subEnum.hasNext() > 0) {
            let [nextVal, nextIterator] = subEnum.next(context);
            if (execTransformFunction(context, callback, nextVal) > 0) {
                return new FilterIterator(subEnum, callback);
            }
            subEnum = nextIterator;
        }

        return emptyIterator;
    }

    private constructor(private subEnum: Iterator, private callback) { super() }

    next(context) {
        const [nextVal, nextIter] = this.subEnum.next(context);
        return [nextVal, FilterIterator.create(context, nextIter, this.callback)];
    }

    skip(context, by: number): Iterator {
        return FilterIterator.create(context, this.subEnum.skip(context, by), this.callback);
    }

    toString(): string {
        return this.subEnum.toString() + " " + this.callback.toString() + " filter";
    }
}

polcaLib['iter'] = function (substack) {
    return SubstackIterator.create(substack);
};

polcaLib['range'] = function (from, to) {
    return RangeIterator.create(from, to);
};

polcaLib['next'] = function (enumerator) {
    return enumerator.next(this);
};

polcaLib['has-next'] = function (enumerator) {
    return enumerator.hasNext();
};

/**
 * @param {Iterator} enumerator
 * @param {number} by
 * @returns {Iterator}
 */
polcaLib['skip'] = function (enumerator, by) {
    return enumerator.skip(this, by);
};

/**
 * @param {Iterator} enumerator
 * @param {Polca.CustomFunc} callback
 */
polcaLib['map'] = function (enumerator, callback) {
    return MapIterator.create(enumerator, callback);
};

polcaLib['filter'] = function (enumerator, callback) {
    return FilterIterator.create(this, enumerator, callback);
};

polcaLib['empty-iter'] = function () {
    return emptyIterator;
};

polcaLib['to-stack'] = function (enumerator) {
    let ret = [];
    while (enumerator.hasNext()) {
        let val;
        [val, enumerator] = enumerator.next(this);
        ret.push(val);
    }
    let stack = new Polca.SubStack();
    stack.ary = ret;
    return stack;
};
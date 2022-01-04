class PolcaIterator {
    hasNext() {
        return 1;
    }
}
const emptyIterator = {
    next: function (context) {
        throw new Error("Cannot get element from an empty iterator");
    },
    hasNext: function () {
        return 0;
    },
    skip: function (context, by) {
        return emptyIterator;
    },
    toString: function () {
        return "empty-iter";
    }
};
const SubStack = Polca.SubStack.prototype;
SubStack.next = function (context) {
    if (this.ary.length === 0) {
        throw new Error("Cannot get element from an empty iterator");
    }
    if (this.ary.length === 1) {
        return [this.ary[0], emptyIterator];
    }
    const newS = new Polca.SubStack();
    newS.ary = this.ary.slice(1);
    return [this.ary[0], newS];
};
SubStack.skip = function (context, by) {
    if (this.ary.length <= by) {
        return emptyIterator;
    }
    const newS = new Polca.SubStack();
    newS.ary = this.ary.slice(by);
    return newS;
};
SubStack.hasNext = function () {
    return Number(this.ary.length !== 0);
};
class SubstackIterator extends PolcaIterator {
    constructor(subStack, pos = 0) {
        super();
        this.subStack = subStack;
        this.pos = pos;
    }
    static create(substack, pos = 0) {
        if (substack.ary.length <= pos) {
            return emptyIterator;
        }
        else {
            return new SubstackIterator(substack, pos);
        }
    }
    next(context) {
        return [this.subStack.ary[this.pos], SubstackIterator.create(this.subStack, this.pos + 1)];
    }
    skip(context, by) {
        return SubstackIterator.create(this.subStack, this.pos + by);
    }
    toString() {
        return this.subStack.toString() + " iter " + (this.pos > 0 ? this.pos + " skip" : "");
    }
}
class RangeIterator extends PolcaIterator {
    constructor(start, end) {
        super();
        this.start = start;
        this.end = end;
    }
    static create(start, end) {
        if (start > end) {
            return emptyIterator;
        }
        else {
            return new RangeIterator(start, end);
        }
    }
    next(context) {
        return [this.start, RangeIterator.create(this.start + 1, this.end)];
    }
    skip(context, by) {
        return RangeIterator.create(this.start + by, this.end);
    }
    toString() {
        return this.start + " " + this.end + " range";
    }
}
function execTransformFunction(context, callback, value) {
    let stack = new Polca.SubStack();
    stack.ary = [value];
    callback.call(new Polca.Context(context.scope, stack, context.info));
    if (stack.ary.length !== 1) {
        throw new Error("Map callback needs to return exactly one value");
    }
    return stack.ary[0];
}
class MapIterator extends PolcaIterator {
    constructor(subEnum, callback) {
        super();
        this.subEnum = subEnum;
        this.callback = callback;
    }
    static create(subEnum, callback) {
        if (subEnum === emptyIterator) {
            return emptyIterator;
        }
        else {
            return new MapIterator(subEnum, callback);
        }
    }
    next(context) {
        let [val, nextSubEnumerator] = this.subEnum.next(context);
        return [execTransformFunction(context, this.callback, val), MapIterator.create(nextSubEnumerator, this.callback)];
    }
    skip(context, by) {
        return MapIterator.create(this.subEnum.skip(context, by), this.callback);
    }
    toString() {
        return this.subEnum.toString() + " " + this.callback.toString() + " map";
    }
}
class FilterIterator extends PolcaIterator {
    constructor(subEnum, callback) {
        super();
        this.subEnum = subEnum;
        this.callback = callback;
    }
    static create(context, subEnum, callback) {
        while (subEnum.hasNext() > 0) {
            let [nextVal, nextIterator] = subEnum.next(context);
            if (execTransformFunction(context, callback, nextVal) > 0) {
                return new FilterIterator(subEnum, callback);
            }
            subEnum = nextIterator;
        }
        return emptyIterator;
    }
    next(context) {
        const [nextVal, nextIter] = this.subEnum.next(context);
        return [nextVal, FilterIterator.create(context, nextIter, this.callback)];
    }
    skip(context, by) {
        return FilterIterator.create(context, this.subEnum.skip(context, by), this.callback);
    }
    toString() {
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
//# sourceMappingURL=iter.js.map
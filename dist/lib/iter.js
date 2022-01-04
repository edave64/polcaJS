var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Iterator = /** @class */ (function () {
    function Iterator() {
    }
    Iterator.prototype.hasNext = function () {
        return 1;
    };
    return Iterator;
}());
var emptyIterator = {
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
var SubStack = Polca.SubStack.prototype;
SubStack.next = function (context) {
    if (this.ary.length === 0) {
        throw new Error("Cannot get element from an empty iterator");
    }
    if (this.ary.length === 1) {
        return [this.ary[0], emptyIterator];
    }
    var newS = new Polca.SubStack();
    newS.ary = this.ary.slice(1);
    return [this.ary[0], newS];
};
SubStack.skip = function (context, by) {
    if (this.ary.length <= by) {
        return emptyIterator;
    }
    var newS = new Polca.SubStack();
    newS.ary = this.ary.slice(by);
    return newS;
};
SubStack.hasNext = function () {
    return Number(this.ary.length !== 0);
};
var SubstackIterator = /** @class */ (function (_super) {
    __extends(SubstackIterator, _super);
    function SubstackIterator(subStack, pos) {
        if (pos === void 0) { pos = 0; }
        var _this = _super.call(this) || this;
        _this.subStack = subStack;
        _this.pos = pos;
        return _this;
    }
    SubstackIterator.create = function (substack, pos) {
        if (pos === void 0) { pos = 0; }
        if (substack.ary.length <= pos) {
            return emptyIterator;
        }
        else {
            return new SubstackIterator(substack, pos);
        }
    };
    SubstackIterator.prototype.next = function (context) {
        return [this.subStack.ary[this.pos], SubstackIterator.create(this.subStack, this.pos + 1)];
    };
    SubstackIterator.prototype.skip = function (context, by) {
        return SubstackIterator.create(this.subStack, this.pos + by);
    };
    SubstackIterator.prototype.toString = function () {
        return this.subStack.toString() + " iter " + (this.pos > 0 ? this.pos + " skip" : "");
    };
    return SubstackIterator;
}(Iterator));
var RangeIterator = /** @class */ (function (_super) {
    __extends(RangeIterator, _super);
    function RangeIterator(start, end) {
        var _this = _super.call(this) || this;
        _this.start = start;
        _this.end = end;
        return _this;
    }
    RangeIterator.create = function (start, end) {
        if (start > end) {
            return emptyIterator;
        }
        else {
            return new RangeIterator(start, end);
        }
    };
    RangeIterator.prototype.next = function (context) {
        return [this.start, RangeIterator.create(this.start + 1, this.end)];
    };
    RangeIterator.prototype.skip = function (context, by) {
        return RangeIterator.create(this.start + by, this.end);
    };
    RangeIterator.prototype.toString = function () {
        return this.start + " " + this.end + " range";
    };
    return RangeIterator;
}(Iterator));
function execTransformFunction(context, callback, value) {
    var stack = new Polca.SubStack();
    stack.ary = [value];
    callback.call(new Polca.Context(context.scope, stack, context.info));
    if (stack.ary.length !== 1) {
        throw new Error("Map callback needs to return exactly one value");
    }
    return stack.ary[0];
}
var MapIterator = /** @class */ (function (_super) {
    __extends(MapIterator, _super);
    function MapIterator(subEnum, callback) {
        var _this = _super.call(this) || this;
        _this.subEnum = subEnum;
        _this.callback = callback;
        return _this;
    }
    MapIterator.create = function (subEnum, callback) {
        if (subEnum === emptyIterator) {
            return emptyIterator;
        }
        else {
            return new MapIterator(subEnum, callback);
        }
    };
    MapIterator.prototype.next = function (context) {
        var _a = this.subEnum.next(context), val = _a[0], nextSubEnumerator = _a[1];
        return [execTransformFunction(context, this.callback, val), MapIterator.create(nextSubEnumerator, this.callback)];
    };
    MapIterator.prototype.skip = function (context, by) {
        return MapIterator.create(this.subEnum.skip(context, by), this.callback);
    };
    MapIterator.prototype.toString = function () {
        return this.subEnum.toString() + " " + this.callback.toString() + " map";
    };
    return MapIterator;
}(Iterator));
var FilterIterator = /** @class */ (function (_super) {
    __extends(FilterIterator, _super);
    function FilterIterator(subEnum, callback) {
        var _this = _super.call(this) || this;
        _this.subEnum = subEnum;
        _this.callback = callback;
        return _this;
    }
    FilterIterator.create = function (context, subEnum, callback) {
        while (subEnum.hasNext() > 0) {
            var _a = subEnum.next(context), nextVal = _a[0], nextIterator = _a[1];
            if (execTransformFunction(context, callback, nextVal) > 0) {
                return new FilterIterator(subEnum, callback);
            }
            subEnum = nextIterator;
        }
        return emptyIterator;
    };
    FilterIterator.prototype.next = function (context) {
        var _a = this.subEnum.next(context), nextVal = _a[0], nextIter = _a[1];
        return [nextVal, FilterIterator.create(context, nextIter, this.callback)];
    };
    FilterIterator.prototype.skip = function (context, by) {
        return FilterIterator.create(context, this.subEnum.skip(context, by), this.callback);
    };
    FilterIterator.prototype.toString = function () {
        return this.subEnum.toString() + " " + this.callback.toString() + " filter";
    };
    return FilterIterator;
}(Iterator));
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
    var _a;
    var ret = [];
    while (enumerator.hasNext()) {
        var val = void 0;
        _a = enumerator.next(this), val = _a[0], enumerator = _a[1];
        ret.push(val);
    }
    var stack = new Polca.SubStack();
    stack.ary = ret;
    return stack;
};
//# sourceMappingURL=iter.js.map
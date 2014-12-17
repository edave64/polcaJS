(function () {
    "use strict";

    Function.prototype.toString = function () {
        return '(' + (this.code ? this.code : 'Unserializable Function') + ')'
    };

    window.polca = {
        help_chache: {},
        prefix: null,    // reversed notation checkbox
        user_scope: {},  // used to store user functions and variables

        Scaffold: _.proto({
            init: function (parentScope, parentStack) {
                if (parentStack) this.stack = parentStack.slice(0);
                else this.stack = [];
                if (!parentScope) parentScope = polcaLib;
                var scope = function () {
                };
                scope.prototype = parentScope;
                this.userScope = new scope();
            },

            pull: function (num) {
                if (this.stack.length < num) throw 'Not enought values on stack.';
                return this.stack.splice(this.stack.length - num);
            },

            push: function (val) {
                if (val instanceof Array)
                    this.stack.push.apply(this.stack, val);
                else if (val !== undefined)
                    this.stack.push(val);
            },

            get: function (name) {
                var subject = this.userScope[name];
                if (typeof subject == 'function')
                    return new polca.structures.NativeFunction(subject, name);
                else if (subject === undefined)
                    throw new Error('Polca error: "' + name + '" undefined!');
                else
                    return subject;
            },

            toString: function () {
                var result = '', first = true;
                this.stack.every(function (element) {
                    (first ? first = false : result += ' ');
                    if (typeof element === 'string' || element instanceof String) {
                        result += '"' + element + '"';
                    } else
                        result += element.toString();
                    return true;
                });
                return result;
            }
        }),

        compile: function (string) {
            var char_, i, word = '', currentTokenKind = '', escape = false,
                currentContainer, containerStack = [];

            var root = (currentContainer = new polca.structures.Func);

            function finishWord() {
                if (word != '') {
                    if (currentTokenKind === "'string" || currentTokenKind === '"string')
                        currentContainer.elements.push(word);
                    else if (!isNaN(Number(word)))
                        currentContainer.elements.push(Number(word));
                    else
                        currentContainer.elements.push(polca.structures.Identifier(word));
                }
                word = '';
                currentTokenKind = '';
            }

            for (i = 0; i < string.length; i++) {
                char_ = string[i];
                if (currentTokenKind === '"string') {
                    if (escape) {
                        word += char_;
                        escape = false;
                    } else if (char_ === '\\')
                        escape = true;
                    else if (char_ === '"')
                        finishWord();
                    else
                        word += char_;
                } else {
                    switch (char_) {
                        case ' ':
                        case "\n":
                            finishWord();
                            break;
                        case "'":
                            finishWord();
                            currentTokenKind = "'string";
                            break;
                        case '"':
                            finishWord();
                            currentTokenKind = '"string';
                            break;
                        case '(':
                            finishWord();
                            var newContainer = new polca.structures.Func;
                            currentContainer.elements.push(newContainer);
                            containerStack.push(currentContainer);
                            currentContainer = newContainer;
                            break;
                        case ')':
                            finishWord();
                            currentContainer = containerStack.pop();
                            break;
                        default:
                            word += char_;
                    }
                }
            }
            finishWord();

            if (currentContainer !== root) throw 'Polca Syntax Error: Encountered unclosed parentesis.';
            return root;
        },

        exec: function (structure, parentScope, parentStack) {
            if (!parentScope) parentScope = {};

            var scaffold = new polca.Scaffold(parentScope, parentStack);
            structure.call(scaffold);

            return scaffold;
        }
    };

    window.polca.structures = {
        Identifier: _.proto({
            init: function (name) {
                this.name = name;
            },

            call: function (self) {
                var val = self.get(this.name);
                return val.call ? val.call(self) : val;
            },

            toString: function () {
                return this.name;
            }
        }),

        Func: _.proto({
            init: function () {
                this.elements = [];
                this.name = '';
            },

            call: function (self) {
                this.elements.every(function (element) {
                    if (element instanceof polca.structures.Identifier) {
                        var scaffold = new polca.Scaffold(self.scope, self.stack);
                        self.push(element.call(scaffold));
                    } else
                        self.push(element);
                    return true;
                })
            },

            toString: function () {
                var result = '(', first = true;
                this.elements.every(function (element) {
                    first ? first = false : result += ' ';
                    if ((typeof element == 'string') || (element instanceof String))
                        result += '"' + element + '"';
                    else
                        result += element.toString();
                    return true;
                });
                return result + ')';
            }
        }),

        NativeFunction: _.proto({
            init: function (func, name) {
                this.Func = func;
                this.name = name;
            },

            call: function (self) {
                var args = self.pull(this.Func.length);
                self.push(this.Func.apply(self, args));
            },

            toString: function () {
                return this.name ? '(' + this.name + ')' : this.Func.name;
            }
        })
    };
}());

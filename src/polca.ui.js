/// <reference path="polca.ts"/>
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
var Polca;
(function (Polca) {
    var UI;
    (function (UI) {
        var Keys;
        (function (Keys) {
            Keys[Keys["Backspace"] = 8] = "Backspace";
            Keys[Keys["Enter"] = 13] = "Enter";
            Keys[Keys["Space"] = 32] = "Space";
            Keys[Keys["End"] = 35] = "End";
            Keys[Keys["Home"] = 36] = "Home";
            Keys[Keys["Left"] = 37] = "Left";
            Keys[Keys["Up"] = 38] = "Up";
            Keys[Keys["Right"] = 39] = "Right";
            Keys[Keys["Down"] = 40] = "Down";
            Keys[Keys["Del"] = 46] = "Del";
        })(Keys || (Keys = {}));
        var firstSection;
        var mainArea;
        var textSizeTester = document.createElement("div");
        function reset() {
            firstSection = null;
            textSizeTester.style.visibility = "false";
            textSizeTester.style.display = "inline";
            mainArea = document.getElementById('polca_content');
            mainArea.innerHTML = "";
            addSection();
        }
        UI.reset = reset;
        function addSection() {
            firstSection = new Section(new BaseSection());
            firstSection.focus();
        }
        /* Invisible Sections that hold the polcaLib-Scope */
        var BaseSection = /** @class */ (function () {
            function BaseSection() {
                this.failed = false;
                this.context = new Polca.Context(Polca.Scope.from(polcaLib), new Polca.Stack());
            }
            return BaseSection;
        }());
        var Section = /** @class */ (function (_super) {
            __extends(Section, _super);
            function Section(prev) {
                var _this = _super.call(this) || this;
                _this.infos = [];
                if (prev.next) {
                    _this.next = prev.next;
                    _this.next.prev = _this;
                }
                _this.prev = prev;
                prev.next = _this;
                _this.createUI();
                _this.exec();
                return _this;
            }
            Section.prototype.remove = function () {
                this.container.remove();
                this.prev.next = this.next;
                if (this.next) {
                    this.next.prev = this.prev;
                }
            };
            Section.prototype.focus = function () {
                this.input.focus();
            };
            Section.prototype.append = function (str) {
                str = str.trim();
                var oldText = this.input.value.replace(/\s+$/, "");
                var separator = (str != "" && oldText != "") ? " " : "";
                this.input.value = oldText + separator + str;
                this.setCursor(oldText.length);
            };
            Section.prototype.setCursor = function (pos) {
                this.input.selectionStart = this.input.selectionEnd = pos;
            };
            Section.prototype.cursorStart = function () {
                this.setCursor(0);
            };
            Section.prototype.cursorEnd = function () {
                this.setCursor(this.input.value.length);
            };
            Section.prototype.focusFirst = function () {
                if (this.prev instanceof Section) {
                    return this.prev.focusFirst();
                }
                else {
                    this.focus();
                    return this;
                }
            };
            Section.prototype.focusLast = function () {
                if (this.next) {
                    return this.next.focusLast();
                }
                else {
                    this.focus();
                    return this;
                }
            };
            Section.prototype.createUI = function () {
                this.createContainer();
                this.createInputField();
                this.createOutputField();
            };
            Section.prototype.createContainer = function () {
                var _this = this;
                this.container = document.createElement('section');
                this.container.addEventListener("focus", function (e) { return _this.focusHandler(); }, true);
                this.container.addEventListener("blur", function (e) { return _this.blurHandler(); }, true);
                if (this.next)
                    mainArea.insertBefore(this.container, this.next.container);
                else
                    mainArea.appendChild(this.container);
            };
            Section.prototype.createInputField = function () {
                var _this = this;
                var input = this.input = document.createElement('input');
                input.addEventListener("change", function () { return _this.exec(); });
                input.addEventListener("keydown", function (e) { return _this.keydownHandler(e); });
                input.addEventListener("input", function (e) { return _this.inputHandler(e); });
                this.container.appendChild(input);
            };
            Section.prototype.createOutputField = function () {
                this.output = document.createElement('output');
                this.container.appendChild(this.output);
            };
            Section.prototype.addInfo = function (str) {
                var ele = document.createElement("div");
                ele.innerHTML = str;
                ele.classList.add("info");
                this.container.appendChild(ele);
                this.infos.push(ele);
            };
            Section.prototype.removeInfo = function () {
                this.infos.forEach(function (ele) { return ele.parentElement.removeChild(ele); });
                this.infos = [];
            };
            Section.prototype.exec = function (autoexec) {
                var _this = this;
                if (autoexec === void 0) { autoexec = false; }
                this.removeInfo();
                var value = this.input.value;
                try {
                    if (this.prev.failed) {
                        this.failed = true;
                        this.output.innerHTML = "";
                    }
                    else {
                        if (this.code !== value) {
                            this.code = value;
                            this.compiled = Polca.compile(value);
                        }
                        var result = Polca.exec(this.compiled, this.prev.context);
                        this.context = result;
                        this.output.innerHTML = result.stack.toString();
                        this.context.info.forEach(function (infoStr) { return _this.addInfo(infoStr); });
                        if (this.failed) {
                            this.output.classList.remove("failed");
                        }
                        this.failed = false;
                    }
                }
                catch (e) {
                    if (!autoexec) {
                        this.output.innerHTML = e.toString();
                        this.output.classList.add("failed");
                    }
                    this.failed = true;
                    throw e;
                }
                finally {
                    if (this.next && !autoexec)
                        this.next.exec();
                }
            };
            Section.prototype.insertLine = function () {
                var input = this.input;
                var newThisLine = input.value.substr(0, input.selectionStart).replace(/\s+$/, "");
                var nextLine = input.value.substr(input.selectionEnd).trim();
                input.value = newThisLine;
                this.exec();
                new Section(this);
                this.next.input.value = nextLine;
                this.next.focus();
                this.next.cursorStart();
                this.next.exec();
            };
            Section.prototype.focusHandler = function () {
                this.container.classList.add("active");
            };
            Section.prototype.blurHandler = function () {
                this.container.classList.remove("active");
            };
            Section.prototype.inputHandler = function (e) {
                var computed = getComputedStyle(this.input);
                textSizeTester.style.font = computed.font;
                document.body.appendChild(textSizeTester);
                textSizeTester.innerHTML = this.input.value.replace(/[&<> ]/g, function (mark) { return Section.entityReplacer[mark]; });
                var width = textSizeTester.offsetWidth;
                textSizeTester.parentElement.removeChild(textSizeTester);
                this.input.style.width = width + "px";
            };
            Section.prototype.keydownHandler = function (e) {
                var _this = this;
                var sStart = this.input.selectionStart, sEnd = this.input.selectionEnd, sLen = sEnd - sStart;
                switch (e.keyCode) {
                    case Keys.Space:
                        window.setTimeout(function () { return _this.exec(true); }, 0);
                        break;
                    case Keys.Up:
                        if (this.prev instanceof Section) {
                            this.prev.focus();
                            this.prev.cursorEnd();
                            e.preventDefault();
                        }
                        break;
                    case Keys.Down:
                        if (this.next instanceof Section) {
                            this.next.focus();
                            this.next.cursorEnd();
                            e.preventDefault();
                        }
                        break;
                    case Keys.Left:
                        if (e.shiftKey)
                            break;
                        if (sStart === 0 && this.prev instanceof Section) {
                            this.prev.focus();
                            this.prev.cursorEnd();
                            e.preventDefault();
                        }
                        break;
                    case Keys.Right:
                        if (e.shiftKey)
                            break;
                        if (sEnd === this.input.value.length && this.next) {
                            this.next.focus();
                            this.next.cursorStart();
                            e.preventDefault();
                        }
                        break;
                    case Keys.Home:
                        if (e.ctrlKey)
                            this.focusFirst();
                        break;
                    case Keys.End:
                        if (e.ctrlKey)
                            this.focusLast();
                        break;
                    case Keys.Enter:
                        if (e.ctrlKey)
                            this.exec();
                        else
                            this.insertLine();
                        break;
                    case Keys.Backspace:
                        if (sStart === 0 && sLen === 0 && this.prev instanceof Section) {
                            var prev = this.prev;
                            prev.append(this.input.value);
                            prev.focus();
                            this.remove();
                            prev.exec();
                            e.preventDefault();
                            return false;
                        }
                        break;
                    case Keys.Del:
                        if (sStart === this.input.value.length && sLen === 0 && this.next) {
                            this.append(this.next.input.value);
                            this.next.remove();
                            this.exec();
                            e.preventDefault();
                            return false;
                        }
                }
            };
            Section.entityReplacer = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                ' ': '&nbsp;'
            };
            return Section;
        }(BaseSection));
    })(UI = Polca.UI || (Polca.UI = {}));
})(Polca || (Polca = {}));
//# sourceMappingURL=polca.ui.js.map
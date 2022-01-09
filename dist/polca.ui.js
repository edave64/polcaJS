/// <reference path="polca.ts"/>
var Polca;
(function (Polca) {
    let UI;
    (function (UI) {
        let Keys;
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
        let firstSection;
        let mainArea;
        const textSizeTester = document.createElement("div");
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
            const baseSection = new BaseSection();
            if (typeof polcaStd !== 'undefined') {
                polcaStd.call(baseSection.context);
            }
            firstSection = new Section(baseSection);
            firstSection.focus();
        }
        /* Invisible Sections that hold the polcaLib-Scope */
        class BaseSection {
            constructor() {
                this.failed = false;
                this.context = new Polca.Context(Polca.Scope.from(polcaLib), new Polca.Stack());
            }
        }
        class Section extends BaseSection {
            constructor(prev) {
                super();
                this.infos = [];
                if (prev.next) {
                    this.next = prev.next;
                    this.next.prev = this;
                }
                this.prev = prev;
                prev.next = this;
                this.createUI();
                this.exec();
            }
            remove() {
                this.container.remove();
                this.prev.next = this.next;
                if (this.next) {
                    this.next.prev = this.prev;
                }
            }
            focus() {
                this.input.focus();
            }
            append(str) {
                str = str.trim();
                const oldText = this.input.value.replace(/\s+$/, "");
                const separator = (str != "" && oldText != "") ? " " : "";
                this.input.value = oldText + separator + str;
                this.setCursor(oldText.length);
            }
            setCursor(pos) {
                this.input.selectionStart = this.input.selectionEnd = pos;
            }
            cursorStart() {
                this.setCursor(0);
            }
            cursorEnd() {
                this.setCursor(this.input.value.length);
            }
            focusFirst() {
                if (this.prev instanceof Section) {
                    return this.prev.focusFirst();
                }
                else {
                    this.focus();
                    return this;
                }
            }
            focusLast() {
                if (this.next) {
                    return this.next.focusLast();
                }
                else {
                    this.focus();
                    return this;
                }
            }
            createUI() {
                this.createContainer();
                this.createInputField();
                this.createOutputField();
            }
            createContainer() {
                this.container = document.createElement('section');
                this.container.addEventListener("focus", (e) => this.focusHandler(), true);
                this.container.addEventListener("blur", (e) => this.blurHandler(), true);
                if (this.next)
                    mainArea.insertBefore(this.container, this.next.container);
                else
                    mainArea.appendChild(this.container);
            }
            createInputField() {
                const input = this.input = document.createElement('input');
                input.addEventListener("change", () => this.exec());
                input.addEventListener("keydown", (e) => this.keydownHandler(e));
                input.addEventListener("input", (e) => this.inputHandler(e));
                this.container.appendChild(input);
            }
            createOutputField() {
                this.output = document.createElement('output');
                this.container.appendChild(this.output);
            }
            addInfo(str) {
                const ele = document.createElement("div");
                ele.innerHTML = str;
                ele.classList.add("info");
                this.container.appendChild(ele);
                this.infos.push(ele);
            }
            removeInfo() {
                this.infos.forEach((ele) => ele.parentElement.removeChild(ele));
                this.infos = [];
            }
            exec(autoexec = false) {
                this.removeInfo();
                const value = this.input.value;
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
                        const result = Polca.exec(this.compiled, this.prev.context);
                        this.context = result;
                        this.output.replaceChildren(result.stack.toHtml());
                        this.context.info.forEach((infoStr) => this.addInfo(infoStr));
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
            }
            insertLine() {
                const input = this.input;
                const newThisLine = input.value.substr(0, input.selectionStart).replace(/\s+$/, "");
                const nextLine = input.value.substr(input.selectionEnd).trim();
                input.value = newThisLine;
                this.exec();
                new Section(this);
                this.next.input.value = nextLine;
                this.next.focus();
                this.next.cursorStart();
                this.next.exec();
            }
            focusHandler() {
                this.container.classList.add("active");
            }
            blurHandler() {
                this.container.classList.remove("active");
            }
            inputHandler(e) {
                const computed = getComputedStyle(this.input);
                textSizeTester.style.font = computed.font;
                document.body.appendChild(textSizeTester);
                textSizeTester.innerHTML = this.input.value.replace(/[&<> ]/g, (mark) => Section.entityReplacer[mark]);
                const width = textSizeTester.offsetWidth;
                textSizeTester.parentElement.removeChild(textSizeTester);
                this.input.style.width = width + "px";
            }
            keydownHandler(e) {
                const sStart = this.input.selectionStart, sEnd = this.input.selectionEnd, sLen = sEnd - sStart;
                switch (e.keyCode) {
                    case Keys.Space:
                        window.setTimeout(() => this.exec(true), 0);
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
                            const prev = this.prev;
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
            }
        }
        Section.entityReplacer = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            ' ': '&nbsp;'
        };
    })(UI = Polca.UI || (Polca.UI = {}));
})(Polca || (Polca = {}));
//# sourceMappingURL=polca.ui.js.map
/// <reference path="polca.ts"/>

declare var polcaLib;

module Polca {
    export module UI {
        enum Keys {
            Backspace = 8,
            Enter = 13,
            Space = 32,
            End = 35,
            Home = 36,
            Left = 37,
            Up = 38,
            Right = 39,
            Down = 40,
            Del = 46
        }


        var firstSection: Section;
        var mainArea: HTMLDivElement;

        //noinspection JSUnusedLocalSymbols
        export function reset () {
            firstSection = null;
            mainArea = <HTMLDivElement>document.getElementById('polca_content');
            mainArea.innerHTML = "";
            addSection();
        }

        function addSection () {
            firstSection = new Section (new BaseSection());
            firstSection.focus();
        }

        /* Invisible Sections that hold the polcaLib-Scope */
        class BaseSection {
            public context: Context;
            public next: Section;

            public failed: boolean = false;

            constructor() {
                this.context = new Context(Scope.from(polcaLib), new Stack());
            }
        }

        class Section extends BaseSection {
            protected prev: BaseSection;
            private container: HTMLElement;
            private input: HTMLInputElement;
            private output: HTMLElement;

            private code: string;
            private compiled: Polca.Structures.CustomFunc;

            constructor(prev: BaseSection) {
                super();

                if (prev.next) {
                    this.next = prev.next;
                    this.next.prev = this;
                }
                this.prev = prev;
                prev.next = this;

                this.createUI();
                this.exec();
            }

            public remove() {
                this.container.remove();
                this.prev.next = this.next;
                if (this.next) {
                    this.next.prev = this.prev;
                }
            }

            public focus () {
                this.input.focus();
            }

            public append (str: string) {
                var str = str.trim();
                var oldText = this.input.value.replace(/\s+$/, "");
                var separator = (str != "" && oldText != "") ? " " : "";
                this.input.value = oldText + separator + str;
                this.setCursor(oldText.length);
            }

            private setCursor (pos: number) {
                this.input.selectionStart = this.input.selectionEnd = pos;
            }

            public cursorStart () {
                this.setCursor(0);
            }

            public cursorEnd () {
                this.setCursor(this.input.value.length);
            }

            public focusFirst (): Section {
                if (this.prev instanceof Section) {
                    return (<Section>this.prev).focusFirst();
                } else {
                    this.focus();
                    return this;
                }
            }

            public focusLast (): Section {
                if (this.next) {
                    return this.next.focusLast();
                } else {
                    this.focus();
                    return this;
                }
            }

            protected createUI () {
                this.createContainer();
                this.createInputField();
                this.createOutputField();
            }

            protected createContainer () {
                this.container = document.createElement('section');
                this.container.addEventListener("focus", (e) => this.focusHandler(), true);
                this.container.addEventListener("blur",  (e) => this.blurHandler(), true);

                if (this.next)
                    mainArea.insertBefore(this.container, this.next.container);
                else
                    mainArea.appendChild(this.container);
            }

            protected createInputField () {
                var input = this.input = document.createElement('input');
                input.addEventListener("change", () => this.exec());
                input.addEventListener("keydown", (e) => this.keydownHandler(<KeyboardEvent>e));
                this.container.appendChild(input);
            }

            protected createOutputField () {
                this.output = document.createElement('output');
                this.container.appendChild(this.output);
            }

            protected exec (autoexec: boolean = false) {
                var value = this.input.value;
                try {
                    if (this.prev.failed) {
                        this.failed = true;
                        this.output.innerHTML = "";
                    } else {
                        if (this.code !== value) {
                            this.code = value;
                            this.compiled = Polca.compile(value);
                        }
                        var result = Polca.exec(this.compiled, this.prev.context);
                        this.context = result;
                        this.output.innerHTML = result.stack.toString();
                        if (this.failed) {
                            this.output.classList.remove("failed");
                        }
                        this.failed = false;
                    }
                } catch (e) {
                    if (!autoexec) {
                        this.output.innerHTML = e.toString();
                        this.output.classList.add("failed");
                    }
                    this.failed = true;
                    throw e;
                } finally {
                    if (this.next && !autoexec)
                        this.next.exec();
                }
            }

            protected insertLine () {
                var input = this.input;
                var newThisLine = input.value.substr(0, input.selectionStart);
                var nextLine = input.value.substr(input.selectionEnd);
                input.value = newThisLine;
                this.exec();
                new Section(this);
                this.next.input.value = nextLine;
                this.next.focus();
                this.next.cursorStart();
                this.next.exec();
            }

            protected focusHandler () {
                this.container.classList.add("active");
            }

            protected blurHandler () {
                this.container.classList.remove("active");
            }

            protected keydownHandler (e: KeyboardEvent) {
                var sStart = this.input.selectionStart,
                    sEnd = this.input.selectionEnd,
                    sLen = sEnd - sStart;
                switch (e.keyCode) {
                    case Keys.Space:
                        window.setTimeout(() => this.exec(true), 0);
                        break;

                    case Keys.Up:
                        if (this.prev instanceof Section) {
                            (<Section>this.prev).focus();
                            (<Section>this.prev).cursorEnd();
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
                        if (e.shiftKey) break;
                        if (sStart === 0 && this.prev instanceof Section) {
                            this.prev.focus();
                            this.prev.cursorEnd();
                            e.preventDefault();
                        }
                        break;

                    case Keys.Right:
                        if (e.shiftKey) break;
                        if (sEnd === this.input.value.length && this.next) {
                            this.next.focus();
                            this.next.cursorStart();
                            e.preventDefault();
                        }
                        break;

                    case Keys.Home:
                        if (e.ctrlKey) this.focusFirst();
                        break;

                    case Keys.End:
                        if (e.ctrlKey) this.focusLast();
                        break;

                    case Keys.Enter:
                        if (e.ctrlKey)
                            this.exec();
                        else
                            this.insertLine();
                        break;

                    case Keys.Backspace:
                        if (sStart === 0 && sLen === 0 && this.prev instanceof Section) {
                            var prev = <Section>this.prev;
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
    }
}

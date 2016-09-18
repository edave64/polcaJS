/// <reference path="polca1.0.ts"/>
/// <reference path="../lib/jquery.d.ts"/>
/// <reference path="../lib/jquery-textrange.d.ts"/>

declare var polcaLib;

module Polca {
    export module UI {
        var KeyEnd = 35;
        var KeyHome = 36;
        var KeyUp = 38;
        var KeyDown = 40;
        var KeyEnter = 13;
        var KeyBackspace = 8;

        var firstSection: Section;
        var mainArea: JQuery;

        export function reset () {
            firstSection = null;
            mainArea = $('#polca_sections');
            mainArea.empty();
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
            private container: JQuery;
            private input: JQuery;
            private output: JQuery;
            private outputContainer: JQuery;

            private code: String;
            private compiled: Polca.Structures.Func;

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
                    this.next.exec();
                }
            }

            public focus () {
                this.input.focus();
            }

            public focusFirst () {
                if (this.prev instanceof Section) {
                    (<Section>this.prev).focusFirst();
                } else {
                    this.focus();
                }
            }

            public focusLast () {
                if (this.next) {
                    this.next.focusLast();
                } else {
                    this.focus();
                }
            }

            protected createUI () {
                this.createContainer();
                this.createInputField();
                this.createDeleteButton();
                this.createExecButton();
                this.createOutputField();
                this.createAddButton();
            }

            protected createContainer () {
                this.container = $('<div class="polca_section">');
                if (this.prev && this.prev instanceof Section)
                    this.container.insertAfter((<Section>this.prev).container);
                else
                    this.container.appendTo(mainArea);
            }

            protected createDeleteButton () {
                var self = this;
                $('<input type="button" class="polca_btn polca_delete_btn">').click(function () {
                    self.remove();
                }).val('x').appendTo(this.container);
            }

            protected createExecButton () {
                var self = this;
                $('<input type="button" class="polca_btn">').click(function () {
                    self.jumpToNext();
                }).val('↲').appendTo(this.container);
            }

            protected createAddButton () {
                var self = this;
                $('<input type="button" class="polca_btn">').click(function () {
                    new Section(self);
                }).val('+').appendTo(this.outputContainer);
            }

            protected createInputField () {
                var self = this;
                this.input = $('<input class="polca_in">').change(function () {
                    self.exec();
                }).keydown(function (e: JQueryKeyEventObject) {
                    return self.keydownHandler(<KeyboardEvent>e.originalEvent);
                }).appendTo(this.container);
            }

            protected createOutputField () {
                this.outputContainer = $('<div class="polca_out_wrapper">').appendTo(this.container);
                this.output = $('<div class="polca_out">').appendTo(this.outputContainer);
            }

            protected exec () {
                var value = <string> this.input.val();
                try {
                    if (this.prev.failed) {
                        this.failed = true;
                        this.output.html("");
                    } else {
                        if (this.code !== value) {
                            this.code = value;
                            this.compiled = Polca.compile(value);
                        }
                        var result = Polca.exec(this.compiled, this.prev.context);
                        this.context = result;
                        this.output.html(result.stack.toString());
                        if (this.failed) {
                            this.outputContainer.removeClass("failed");
                        }
                        this.failed = false;
                    }
                } catch (e) {
                    this.output.html(e.toString());
                    this.outputContainer.addClass("failed");
                    this.failed = true;
                    throw e;
                } finally {
                    if (this.next)
                        this.next.exec();
                }
            }

            protected jumpToNext () {
                if (!this.next)
                    new Section(this);

                this.next.focus();
            }

            protected keydownHandler (e: KeyboardEvent) {
                switch (e.keyCode) {
                    case KeyUp:
                        if (this.prev instanceof Section)
                            (<Section>this.prev).focus();
                        break;
                    case KeyDown:
                        if (this.next instanceof Section)
                            this.next.focus();
                        break;

                    case KeyHome:
                        this.focusFirst();
                        break;

                    case KeyEnd:
                        this.focusLast();
                        break;

                    case KeyEnter:
                        if (e.ctrlKey)
                            this.exec();
                        else
                            this.jumpToNext();
                        break;

                    case KeyBackspace:
                        if (this.input.textrange('get').position === 0 && this.prev instanceof Section) {
                            var prev = <Section>this.prev,
                                oldPrevText = (<string>prev.input.val()).replace(/~+$/, '');
                            prev.input.val(oldPrevText + ' ' + this.input.val());
                            prev.exec();
                            prev.focus();
                            prev.input.textrange('setcursor', oldPrevText + 1);
                            this.remove();
                            return false;
                        }
                }
            }
        }
    }
}

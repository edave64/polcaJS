(function () {
    "use strict";

    var ui = window.polca.ui = {
        sections: [],

        reset: function () {
            ui.clearAllSections();
            ui.buildAddButton();
            ui.addSection();
            ui.createBaseSection();
        },

        clearAllSections: function () {
            ui.sections.forEach(function (section) {
                ui.removeSection(section);
            })
        },

        buildAddButton: function () {
            var input = $('<input type="button" class="polca_btn" id="plus_btn" value="+" />');
            input.click(function () {
                polca.ui.addSection();
            }).prependTo($('#polca_content'));
        },

        createBaseSection: function () {
            this.sections[-1] = {
                stack: [],
                scope: polcaLib
            };
        },

        addSection: function () {
            var count = this.sections.length,
                sectionWrapper = $('<div id="section_' + count + '" class="polca_section">');

            sectionWrapper.prependTo($('#polca_sections'));
            $('<div id="polca_out_' + count + '" class="polca_out">').appendTo(sectionWrapper);
            $('<input id="polca_in_' + count + '" class="polca_in">').change(function () {
                polca.ui.exec(count);
            }).appendTo(sectionWrapper);
            $('<input type="button" class="polca_btn">').click(function () {
                polca.ui.removeSection(count);
            }).val('x').appendTo(sectionWrapper);
            $('<input type="button" class="polca_btn">').click(function () {
                polca.ui.exec(count);
            }).val('↲').appendTo(sectionWrapper);

            this.sections.push({});
            $('.polca_in:first')[0].focus();
        },

        exec: function (i) {
            var value = $('#polca_in_' + i).val(), new_ = false;
            if (this.sections[i].code === undefined) {
                new_ = true;
            }
            if (this.sections[i].code !== value) {
                this.sections[i].code = value;
                this.sections[i].compiled = polca.compile(value);
            }
            try {
                var result = polca.exec(this.sections[i].compiled, this.sections[i - 1].scope, this.sections[i - 1].stack);
                this.sections[i].stack = result.stack;
                this.sections[i].scope = result.userScope;
                $('#polca_out_' + i).html(result.toString());
                i++;
                for (; i < this.sections.length - 1; i++) {
                    this.exec(i);
                }
                if (new_) this.addSection();
            } catch (e) {
                $('#polca_out_' + i).html(e.toString());
            }
        },

        removeSection: function (i) {
            $('#section_' + i).hide();
            $('#polca_in_' + i).val('');
            this.exec(i);
        }
    };


    // TODO: HUGE rework!
    window.polca.ui = {
        sections: [],

        reset: function () {
            $('#polca_sections').empty();
            var input = $('<input type="button" class="polca_btn" id="plus_btn" value="+" />');
            input.click(function () {
                polca.ui.addSection();
            }).prependTo($('#polca_content'));
            this.addSection();

            this.sections[-1] = {
                stack: [],
                scope: polcaLib
            };
        },

        addSection: function () {
            var count = this.sections.length,
                sectionWrapper = $('<div id="section_' + count + '" class="polca_section">');

            sectionWrapper.prependTo($('#polca_sections'));
            $('<div id="polca_out_' + count + '" class="polca_out">').appendTo(sectionWrapper);
            $('<input id="polca_in_' + count + '" class="polca_in">').change(function () {
                polca.ui.exec(count);
            }).appendTo(sectionWrapper);
            $('<input type="button" class="polca_btn">').click(function () {
                polca.ui.remove(count);
            }).val('x').appendTo(sectionWrapper);
            $('<input type="button" class="polca_btn">').click(function () {
                polca.ui.exec(count);
            }).val('↲').appendTo(sectionWrapper);

            this.sections.push({});
            $('.polca_in:first')[0].focus();
        },

        exec: function (i) {
            var value = $('#polca_in_' + i).val(), new_ = false;
            if (this.sections[i].code === undefined) {
                new_ = true;
            }
            if (this.sections[i].code !== value) {
                this.sections[i].code = value;
                this.sections[i].compiled = polca.compile(value);
            }
            try {
                var result = polca.exec(this.sections[i].compiled, this.sections[i - 1].scope, this.sections[i - 1].stack);
                this.sections[i].stack = result.stack;
                this.sections[i].scope = result.userScope;
                $('#polca_out_' + i).html(result.toString());
                i++;
                for (; i < this.sections.length - 1; i++) {
                    this.exec(i);
                }
                if (new_) this.addSection();
            } catch (e) {
                $('#polca_out_' + i).html(e.toString());
            }
        },

        remove: function (i) {
            $('#section_' + i).hide();
            $('#polca_in_' + i).val('');
            this.exec(i);
        }
    };
}());

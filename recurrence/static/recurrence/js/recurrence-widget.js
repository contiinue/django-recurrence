if (!recurrence)
    var recurrence = {};

recurrence.widget = {};

let CheckRruleSyntaxTimer;
const TIME_TO_CHECK_SYNTAX_RRULE = 400

recurrence.widget.Grid = function(cols, rows) {
    this.init(cols, rows);
};
recurrence.widget.Grid.prototype = {
    init: function(cols, rows) {
        this.disabled = false;
        this.cells = [];
        this.cols = cols;
        this.rows = rows;

        this.init_dom();
    },

    init_dom: function() {
        var tbody = recurrence.widget.e('tbody');
        for (var y=0; y < this.rows; y++) {
            var tr = recurrence.widget.e('tr');
            tbody.appendChild(tr);
            for (var x=0; x < this.cols; x++) {
                var td = recurrence.widget.e('td');
                tr.appendChild(td);
                this.cells.push(td);
            }
        }
        var table = recurrence.widget.e(
            'table', {
                'class': 'grid', 'cellpadding': 0,
                'cellspacing': 0, 'border': 0},
            [tbody]);

        this.elements = {'root': table, 'table': table, 'tbody': tbody};
    },

    cell: function(col, row) {
        return this.elements.tbody.childNodes[row].childNodes[col];
    },

    enable: function () {
        recurrence.widget.remove_class('disabled');
        this.disabled = false;
    },

    disable: function () {
        recurrence.widget.add_class('disabled');
        this.disabled = true;
    }
};


recurrence.widget.CustomInputSelector = function(custom_rrule, options) {
    this.init(custom_rrule, options);
};

recurrence.widget.CustomInputSelector.prototype = {
    init: function(custom_rrule, options) {
        this.disabled = false;
        this.custom_rrule = custom_rrule;
        this.options = options || {};

        if (this.options.onchange)
            this.onchange = this.options.onchange;

        this.init_dom();
    },

    init_dom: function() {
        var custom_input_selector = this;


        var custom_input_field = recurrence.widget.e(
            'input',
            {'class': 'form-control w-100', 
            'oninput': function() {custom_input_selector.set_custom_input(this.value.toUpperCase())},
            'value': this.custom_rrule}
        )

        var custom_input_container = recurrence.widget.e(
            'div', {'class': 'custom_input_container'}, [custom_input_field]
        )

        var root = recurrence.widget.e(
            'span', {'class': 'date-selector'},
            [custom_input_container]);

        this.elements = {
            'root': root,
            'custom_input_field': custom_input_field,
        };
    },


    set_custom_input: function(custom_rrule) {
        this.custom_rrule = custom_rrule || ' '
        if (this.onchange) {
            this.onchange(this.custom_rrule);
        }
    }
}


recurrence.widget.DateSelector = function(date, options) {
    this.init(date, options);
};
recurrence.widget.DateSelector.prototype = {
    init: function(date, options) {
        this.disabled = false;
        this.date = date;
        this.calendar = null;
        this.options = options || {};

        if (this.options.onchange)
            this.onchange = this.options.onchange;

        this.init_dom();
    },

    init_dom: function() {
        var dateselector = this;
        if (this.date) 
            var date_value = recurrence.date.format(this.date, '%Y-%m-%dT%h:%i');
        else
            var date_value = '';
        var date_field = recurrence.widget.e(
            'input', {
                'class': 'date-field input_field_f input_field_f_sm', 'size': 10,
                'type': 'datetime-local',
                'value': date_value,
                'onchange': function() {dateselector.set_date(this.value);}});

        var root = recurrence.widget.e(
            'span', {'class': 'date-selector'},
            [date_field]);

        this.elements = {
            'root': root,
            'date_field': date_field,
        };
    },

    set_date: function(datestring) {
        var datetimeTokens = datestring.split('T');

        var dateTokens = datetimeTokens[0].split('-');
        var year = parseInt(dateTokens[0], 10);
        var month = parseInt(dateTokens[1], 10) - 1;
        var day = parseInt(dateTokens[2], 10);
        
        var timeTokens = datetimeTokens[1].split(':');
        var hour = parseInt(timeTokens[0], 10);
        var minute = parseInt(timeTokens[1], 10);

        var dt = new Date(year, month, day, hour, minute);
        if (String(dt) == 'Invalid Date' || String(dt) == 'NaN') {
            if (this.date && !this.options.allow_null) {
                this.elements.date_field.value = recurrence.date.format(
                    this.date, '%Y-%m-%d');
            } else {
                if (this.elements.date_field.value != '') {
                    if (this.onchange)
                        this.onchange(null);
                }
                this.elements.date_field.value = '';
            }
        } else {
            if (!this.date ||
                (year != this.date.getFullYear() ||
                 month != this.date.getMonth() ||
                 day != this.date.getDate()) ||
                 hour != this.date.getHours() ||
                 minute != this.date.getMinutes()) {

                if (!this.date)
                    this.date = recurrence.widget.date_today();

                this.date.setTime(new Date(year, month, day, hour, minute).getTime());

                this.elements.date_field.value = datestring;

                if (this.onchange)
                    this.onchange(this.date);
            }
        }
    },

    set_calendar_position: function() {
        var loc = recurrence.widget.cumulative_offset(
            this.elements.calendar_button);

        var calendar_x = loc[0];
        var calendar_y = loc[1];
        var calendar_right = (
            loc[0] + this.calendar.elements.root.clientWidth);
        var calendar_bottom = (
            loc[1] + this.calendar.elements.root.clientHeight);

        if (calendar_right > document.scrollWidth)
            calendar_x = calendar_x - (
                calendar_right - document.scrollWidth);
        if (calendar_bottom > document.scrollHeight)
            calendar_y = calendar_y - (
                calendar_bottom - document.scrollHeight);

        this.calendar.set_position(calendar_x, calendar_y);
    },

    hide_calendar: function() {
        this.calendar = null;
    },

    enable: function () {
        this.disabled = false;
        this.elements.date_field.disabled = false;
    },

    disable: function () {
        this.disabled = true;
        this.elements.date_field.disabled = true;
        if (this.calendar)
            this.calendar.close();
    }
};


recurrence.widget.Widget = function(textarea, options) {
    this.init(textarea, options);
};
recurrence.widget.Widget.prototype = {
    init: function(textarea, options) {
        if (textarea.toLowerCase)
            textarea = document.getElementById(textarea);
        this.selected_panel = null;
        this.panels = [];
        this.data = recurrence.deserialize(textarea.value);
        this.textarea = textarea;
        this.options = options;

        this.default_freq = options.default_freq || recurrence.WEEKLY;

        this.panel_id = 1

        this.init_dom();
        this.init_panels();
        recurrence.widget.default_panel();
    },

    init_dom: function() {
        var widget = this;

        var label = recurrence.widget.e(
            'span', {'class': 'recurrence-label p-4'}, 'Однократно');

        var elem = recurrence.widget.e(
            'a', {'class': 'add-button', 'href': 'javascript:void(0)'},
            [label]);

        var default_elem = recurrence.widget.e('a', {'class': 'recurrence-label', 'href': 'javascript:void(0)'})
        default_elem.innerHTML = gettext('Однократно')
        var default_freq = recurrence.widget.e('div', {'class': 'header control'}, [elem])
        var default_panel = recurrence.widget.e('div', {'class': 'panel ', 'id': 'default-panel'}, [default_freq])


        var panels = recurrence.widget.e(
            'div',
            {'class': 'panels'},
            [default_panel]
        );
        var control = recurrence.widget.e('div', {'class': 'control'});
        var root = recurrence.widget.e(
            'div', {'class': this.textarea.className}, [panels, control]);

        var add_rule = new recurrence.widget.AddButton(
            recurrence.display.labels.add_rule, {
            'onclick': function () {widget.add_rule();}
        });
        recurrence.widget.add_class(add_rule.elements.root, 'add-rule');
        control.appendChild(add_rule.elements.root);

        var add_date = new recurrence.widget.AddButton(
            recurrence.display.labels.add_date, {
            'onclick': function () {widget.add_date();}
        });
        recurrence.widget.add_class(add_date.elements.root, 'add-date');
        control.appendChild(add_date.elements.root);


        var add_custom_rrule = new recurrence.widget.AddButton(
            recurrence.display.labels.add_custom_rrule, 
            {'onclick': function () {widget.add_custom_rrule();}}
        )
        recurrence.widget.add_class(add_custom_rrule.elements.root, 'add-custom-rrule');
        control.appendChild(add_custom_rrule.elements.root);


        this.elements = {
            'root': root,
            'panels': panels,
            'control': control
        };

        // attach immediately
        recurrence.widget.add_class(this.textarea, 'hidden');
        this.textarea.parentNode.insertBefore(
            this.elements.root, this.textarea);
    },

    init_panels: function() {
        recurrence.array.foreach(
            this.data.rrules, function(item) {
                this.add_rule_panel(recurrence.widget.INCLUSION, item);
            }, this);
        recurrence.array.foreach(
            this.data.exrules, function(item) {
                this.add_rule_panel(recurrence.widget.EXCLUSION, item);
            }, this);
        recurrence.array.foreach(
            this.data.rdates, function(item) {
                this.add_date_panel(recurrence.widget.INCLUSION, item);
            }, this);
        recurrence.array.foreach(
            this.data.exdates, function(item) {
                this.add_date_panel(recurrence.widget.EXCLUSION, item);
            }, this);
        recurrence.array.foreach(
            this.data.custom_rrules, function(item) {
                this.add_custom_rrule_panel(recurrence.widget.EXCLUSION, item);
            }, this);
    },

    add_rule_panel: function(mode, rule) {
        var panel = new recurrence.widget.Panel(this);
        var form = new recurrence.widget.RuleForm(panel, mode, rule);

        panel.onexpand = function() {
            if (panel.widget.selected_panel)
                if (panel.widget.selected_panel != this)
                    panel.widget.selected_panel.collapse();
            panel.widget.selected_panel = this;
        };
        panel.onremove = function() {
            form.remove();
        };

        this.elements.panels.appendChild(panel.elements.root);
        this.panels.push(panel);
        this.update();
        return panel;
    },

    add_date_panel: function(mode, date) {
        var panel = new recurrence.widget.Panel(this);
        var form = new recurrence.widget.DateForm(panel, mode, date);

        panel.onexpand = function() {
            if (panel.widget.selected_panel)
                if (panel.widget.selected_panel != this)
                    panel.widget.selected_panel.collapse();
            panel.widget.selected_panel = this;
        };
        panel.onremove = function() {
            recurrence.widget.default_panel()
            form.remove();
        };

        this.elements.panels.appendChild(panel.elements.root);
        this.panels.push(panel);
        this.update();
        return panel;
    },

    add_custom_rrule_panel: function(mode, custom_rrule) {
        var panel = new recurrence.widget.Panel(this, {id_panel: this.get_id_panel()});
        var form = new recurrence.widget.CustomRruleForm(panel, mode, custom_rrule);

        panel.onexpand = function() {
            if (panel.widget.selected_panel)
                if (panel.widget.selected_panel != this)
                    panel.widget.selected_panel.collapse();
            panel.widget.selected_panel = this;
        };
        panel.onremove = function() {
            recurrence.widget.default_panel()
            form.remove();
        };

        this.elements.panels.appendChild(panel.elements.root);
        this.panels.push(panel);
        this.update();
        return panel;
    },

    add_rule: function(rule) {
        var rule = rule || new recurrence.Rule(this.default_freq);
        this.data.rrules.push(rule);
        this.add_rule_panel(recurrence.widget.INCLUSION, rule).expand();
    },

    add_date: function(date) {
        var date = date || recurrence.widget.date_today();
        this.data.rdates.push(date);
        this.add_date_panel(recurrence.widget.INCLUSION, date).expand();
    },

    add_custom_rrule: function(custom_rrule) {
        let custom_rrulee = custom_rrule || ' '
        this.data.custom_rrules.push(custom_rrulee);
        this.add_custom_rrule_panel(recurrence.widget.INCLUSION, custom_rrulee).expand();
    },

    get_id_panel: function() {
        this.panel_id += 1
        return this.panel_id
    },

    update: function() {
        this.textarea.value = this.data.serialize();
    }
};

recurrence.widget.default_panel = function () {
    let elem = $('#default-panel')
    if ($(".panel:not(#default-panel)").length == 0 ) {
        elem.show()
    }
    else {
        elem.hide()
    }
}

recurrence.widget.AddButton = function(label, options) {
    this.init(label, options);
};
recurrence.widget.AddButton.prototype = {
    init: function(label, options) {
        this.label = label;
        this.options = options || {};

        this.init_dom();
    },

    init_dom: function() {
        var addbutton = this;

        var plus = recurrence.widget.e(
            'span', {'class': 'plus'}, '+');
        var label = recurrence.widget.e(
            'span', {'class': 'recurrence-label'}, this.label);
        var root = recurrence.widget.e(
            'a', {'class': 'add-button', 'href': 'javascript:void(0)'},
            [plus, label]);

        root.onclick = function() {
            addbutton.options.onclick();
        };

        this.elements = {'root': root, 'plus': plus, 'label': label};
    }
};


recurrence.widget.Panel = function(widget, options) {
    this.init(widget, options);
};
recurrence.widget.Panel.prototype = {
    init: function(widget, options) {
        this.collapsed = false;
        this.widget = widget;
        this.options = options || {};

        if (this.options.onremove)
            this.onremove = this.options.onremove;
        if (this.options.onexpand)
            this.onexpand = this.options.onexpand;
        if (this.options.oncollapse)
            this.oncollapse = this.options.oncollapse;

        if (this.options.id_panel) {
            this.id_panel = this.options.id_panel
        }

        this.init_dom();
    },

    init_dom: function() {
        var panel = this;
        var remove = recurrence.widget.e('a', {
            'class': 'remove',
            'href': 'javascript:void(0)',
            'title': recurrence.display.labels.remove,
            'onclick': function() {
                panel.remove();
            }
        }, '&times;');
        var label = recurrence.widget.e('a', {
           'class': 'recurrence-label head_title_rec',
           'href': 'javascript:void(0)',
           'onclick': function() {
               if (panel.collapsed)
                   panel.expand();
               else
                   panel.collapse();
           }
        }, '&nbsp;');
        var header = recurrence.widget.e(
             'div', {'class': 'header'}, [remove, label]);
        var body = recurrence.widget.e(
            'div', {'class': 'body'});
            
        var root = recurrence.widget.e(
            'div', {'class': 'panel'}, [header, body]);

        this.elements = {
            'root': root, 'remove': remove, 'label': label,
            'header': header, 'body': body
        };

        this.collapse();
    },

    set_label: function(label) {
        var to_declension = recurrence.display.timeintervals[2]
        if (label.includes(to_declension)) {
            label = recurrence.string.capitalize(label.replace("Каждый", recurrence.display.declensions[1]));
        }
        this.elements.label.innerHTML = label;
    },

    set_body: function(element) {
        if (this.elements.body.childNodes.length)
            this.elements.body.removeChild(this.elements.body.childNodes[0]);
        this.elements.body.appendChild(element);
    },

    expand: function() {
        recurrence.widget.default_panel()
        this.collapsed = false;
        recurrence.widget.remove_class(this.elements.body, 'hidden');
        if (this.onexpand)
            this.onexpand(this);
    },

    collapse: function() {
        this.collapsed = true;
        recurrence.widget.add_class(this.elements.body, 'hidden');
        if (this.oncollapse)
            this.oncollapse(this);
    },

    remove: function() {
        var parent = this.elements.root.parentNode;
        if (parent)
            parent.removeChild(this.elements.root);
        if (this.onremove)
            this.onremove(parent);
    }
};


recurrence.widget.RuleForm = function(panel, mode, rule, options) {
    this.init(panel, mode, rule, options);
};
recurrence.widget.RuleForm.prototype = {
    init: function(panel, mode, rule, options) {
        this.selected_freq = rule.freq;
        this.panel = panel;
        this.mode = mode;
        this.rule = rule;
        this.options = options || {};

        var rule_options = {
            interval: rule.interval, until: rule.until, count: rule.count
        };

        this.freq_rules = [
            new recurrence.Rule(recurrence.YEARLY, rule_options),
            new recurrence.Rule(recurrence.MONTHLY, rule_options),
            new recurrence.Rule(recurrence.WEEKLY, rule_options),
            new recurrence.Rule(recurrence.DAILY, rule_options),
            new recurrence.Rule(recurrence.HOURLY, rule_options),
        ];
        this.freq_rules[this.rule.freq].update(this.rule);

        this.init_dom();

        this.set_freq(this.selected_freq);
    },

    init_dom: function() {
        var form = this;

        // mode

        var mode_checkbox = recurrence.widget.e(
            'input', {'class': 'checkbox', 'type': 'checkbox', 'name': 'mode'});
        var mode_label = recurrence.widget.e(
            'span', {'class': 'recurrence-label'},
            recurrence.display.labels.exclude_occurrences);
        var mode_container = recurrence.widget.e(
            'div', {'class': 'mode'},
            [mode_checkbox, mode_label]);
        if (this.mode == recurrence.widget.EXCLUSION)
            // delay for ie6 compatibility
            setTimeout(function() {
                mode_checkbox.checked = true;
                recurrence.widget.add_class(form.panel, 'exclusion');
            }, 10);

        // freq

        var freq_choices = recurrence.display.frequencies.slice(0, 5);
        var freq_options = recurrence.array.foreach(
            freq_choices, function(item, i) {
                var option = recurrence.widget.e(
                    'option', {'value': i},
                    recurrence.string.capitalize(item));
                return option;
            });
        var freq_select = recurrence.widget.e(
            'select', {'name': 'freq', 'class': "custom-select", 'id': 'inputGroupSelect01', 'aria-label':""}, freq_options);
        var freq_label = recurrence.widget.e(
            'span', {'class': 'recurrence-label'},
            recurrence.display.labels.frequency);
        var freq_container = recurrence.widget.e(
            'div', {'class': 'freq col'},
            [freq_label, freq_select]);

        // interval

        var interval_field = recurrence.widget.e(
            'input', {
            'name': 'interval', 'class': 'input_field_f input_field_f_sm', 'size': 1, 'value': this.rule.interval}
        );

        var interval_label1 = recurrence.widget.e(
            'span', {'class': 'recurrence-label '},
            recurrence.display.labels.every
        );
        var interval_label2 = recurrence.widget.e(
            'span', {'class': 'label '},
            recurrence.display.timeintervals_plural[this.rule.freq]
        );

        var interval_container = recurrence.widget.e(
            'div', {'class': 'interval test_interval'},
            [interval_label1, interval_field, interval_label2]
        );


        // until
        if (this.rule.until)
            until_value = recurrence.date.format(this.rule.until, '%Y-%m-%d');
        else
            until_value = '';
        var until_radio = recurrence.widget.e(
            'input', {'class': 'radio', 'type': 'radio',
                      'name': 'until_count', 'value': 'until'});
        var until_date_selector = new recurrence.widget.DateSelector(
            this.rule.until, {
                'onchange': function(date) {form.set_until(date);},
                'allow_null': true
            });
        var until_label = recurrence.widget.e(
            'span', {'class': 'recurrence-label'},
            recurrence.display.labels.date + ':');
        var until_container = recurrence.widget.e(
            'li', {'class': 'until'},
            [until_radio, until_label, until_date_selector.elements.root]);

        // count

        if (this.rule.count)
            count_value = this.rule.count;
        else
            count_value = 1;
        var count_radio = recurrence.widget.e(
            'input', {
                'class': 'radio', 'type': 'radio',
                'name': 'until_count', 'value': 'count'});
        var count_field = recurrence.widget.e(
            'input', {'name': 'count', 'class': 'input_field_f input_field_f_sm', 'size': 1, 'value': count_value});
        if (this.rule.count && this.rule.count < 2)
            var token = recurrence.string.capitalize(
                recurrence.display.labels.count);
        else
            var token = recurrence.string.capitalize(
                recurrence.display.labels.count_plural);
        var count_label1 = recurrence.widget.e(
            'span', {'class': 'recurrence-label'}, token.split('%(number)s')[0]);
        var count_label2 = recurrence.widget.e(
            'span', {'class': 'recurrence-label'}, token.split('%(number)s')[1]);
        var count_container = recurrence.widget.e(
            'li', {'class': 'count'},
            [count_radio, count_label1, count_field, count_label2]);

        // limit container

        var until_count_container = recurrence.widget.e(
            'ul', {'class': 'until-count'},
            [until_container, count_container]);
        var limit_checkbox = recurrence.widget.e(
            'input', {
                'class': 'checkbox', 'type': 'checkbox',
                'name': 'limit'});
        var limit_label = recurrence.widget.e(
            'span', {'class': 'recurrence-label'},
            recurrence.display.labels.repeat_until + ':');
        var limit_container = recurrence.widget.e(
            'div', {'class': 'limit'},
            [limit_checkbox, limit_label, until_count_container]);
        if (this.rule.until || this.rule.count) {
            // compatibility with ie, we delay
            setTimeout(function() {limit_checkbox.checked = true;}, 10);
        } else {
            until_radio.disabled = true;
            count_radio.disabled = true;
            until_date_selector.disable();
            recurrence.widget.add_class(until_count_container, 'disabled');
        }

        // core

        var freq_form_container = recurrence.widget.e(
            'div', {'class': 'form'});
        var root = recurrence.widget.e(
            'form', {}, [
                mode_container, freq_container, interval_container,
                freq_form_container, limit_container]);

        // events

        mode_checkbox.onclick = function() {
            if (this.checked)
                form.set_mode(recurrence.widget.EXCLUSION);
            else
                form.set_mode(recurrence.widget.INCLUSION);
        };

        freq_select.onchange = function() {
            form.set_freq(parseInt(this.value), 10);
        };

        interval_field.onchange = function() {
            form.set_interval(parseInt(this.value), 10);
        };

        limit_checkbox.onclick = function () {
            if (this.checked) {
                recurrence.widget.remove_class(
                    until_count_container, 'disabled');
                until_radio.disabled = false;
                count_radio.disabled = false;
                if (until_radio.checked) {
                    until_date_selector.enable();
                    form.set_until(until_date_selector.date);
                }
                if (count_radio.checked) {
                    count_field.disabled = false;
                    form.set_count(parseInt(count_field.value));
                }
            } else {
                recurrence.widget.add_class(
                    until_count_container, 'disabled');
                until_radio.disabled = true;
                count_radio.disabled = true;
                until_date_selector.disable();
                count_field.disabled = true;
                recurrence.array.foreach(
                    form.freq_rules, function(rule) {
                        rule.until = null;
                        rule.count = null;
                    });
                form.update();
            }
        }

        // for compatibility with ie, use timeout
        setTimeout(function () {
            if (form.rule.count) {
                count_radio.checked = true;
                until_date_selector.disable();
            } else {
                until_radio.checked = true;
                count_field.disabled = true;
            }
        }, 1);

        until_radio.onclick = function () {
            this.checked = true;
            until_date_selector.enable();
            count_radio.checked = false;
            count_field.disabled = true;
            form.set_until(until_date_selector.date);
        };

        count_radio.onclick = function () {
            this.checked = true;
            count_field.disabled = false;
            until_radio.checked = false;
            until_date_selector.disable();
            form.set_count(parseInt(count_field.value), 10);
        };

        count_field.onchange = function () {
            form.set_count(parseInt(this.value), 10);
        };

        // freq forms

        var forms = [
            recurrence.widget.RuleYearlyForm,
            recurrence.widget.RuleMonthlyForm,
            recurrence.widget.RuleWeeklyForm,
            recurrence.widget.RuleDailyForm,
            recurrence.widget.RuleHorlyForm,
        ];
        var freq_forms = recurrence.array.foreach(
            forms, function(form, i) {
                var rule = this.freq_rules[i];
                var f = new form(this, rule);
                freq_form_container.appendChild(f.elements.root);
                return f;
            }, this);

        this.freq_forms = freq_forms;

        // install dom

        this.panel.set_label(this.get_display_text());
        this.panel.set_body(root);

        this.elements = {
            'root': root,
            'mode_checkbox': mode_checkbox,
            'freq_select': freq_select,
            'interval_field': interval_field,
            'freq_form_container': freq_form_container,
            'until_radio': until_radio,
            'count_field': count_field,
            'count_radio': count_radio,
            'limit_checkbox': limit_checkbox
        };
    },

    get_display_text: function() {
        var text = this.freq_rules[this.selected_freq].get_display_text();
        if (this.mode == recurrence.widget.EXCLUSION)
            text = recurrence.display.mode.exclusion + ' ' + text;
        return recurrence.string.capitalize(text);
    },

    set_until: function(until) {
        recurrence.array.foreach(
            this.freq_rules, function(rule) {
                rule.count = null;
                rule.until = until;
            });
        this.update();
    },

    set_count: function(count) {
        if (count < 2)
            var token = recurrence.string.capitalize(
                recurrence.display.labels.count);
        else
            var token = recurrence.string.capitalize(
                recurrence.display.labels.count_plural);
        var label1 = this.elements.count_field.previousSibling;
        var label2 = this.elements.count_field.nextSibling;
        label1.firstChild.nodeValue = token.split('%(number)s')[0];
        label2.firstChild.nodeValue = token.split('%(number)s')[1];
        recurrence.array.foreach(
            this.freq_rules, function(rule) {
                rule.until = null;
                rule.count = count;
            });
        this.update();
    },

    set_interval: function(interval) {
        interval = parseInt(interval, 10);
        if (String(interval) == 'NaN') {
            // invalid value, reset to previous value
            this.elements.interval_field.value = (
                this.freq_rules[this.selected_freq].interval);
            return;
        }

        var first_label = this.elements.interval_field.previousSibling
        var label = this.elements.interval_field.nextSibling;


        if (this.selected_freq === 2) {
            first_label.innerHTML = recurrence.display.declensions[1]
        }
        else {
            first_label.innerHTML = recurrence.display.declensions[0]
        }

        if (interval < 2)
            label.firstChild.nodeValue = (
                recurrence.display.timeintervals[this.selected_freq]);
        else
            label.firstChild.nodeValue = (
                recurrence.display.timeintervals_plural[this.selected_freq]);
        recurrence.array.foreach(
            this.freq_rules, function(rule) {
                rule.interval = interval;
            });

        this.elements.interval_field.value = interval;
        this.update();
    },

    set_freq: function(freq) {
        this.freq_forms[this.selected_freq].hide();
        this.freq_forms[freq].show();
        this.elements.freq_select.value = freq;
        this.selected_freq = freq;
        // need to update interval to display different label
        this.set_interval(parseInt(this.elements.interval_field.value), 10);
        this.update();
    },

    set_mode: function(mode) {
        if (this.mode != mode) {
            if (this.mode == recurrence.widget.INCLUSION) {
                recurrence.array.remove(
                    this.panel.widget.data.rrules, this.rule);
                this.panel.widget.data.exrules.push(this.rule);
                recurrence.widget.remove_class(
                    this.panel.elements.root, 'inclusion');
                recurrence.widget.add_class(
                    this.panel.elements.root, 'exclusion');
            } else {
                recurrence.array.remove(
                    this.panel.widget.data.exrules, this.rule);
                this.panel.widget.data.rrules.push(this.rule);
                recurrence.widget.remove_class(
                    this.panel.elements.root, 'exclusion');
                recurrence.widget.add_class(
                    this.panel.elements.root, 'inclusion');
            }
            this.mode = mode;
        }
        this.update();
    },

    update: function() {
        this.panel.set_label(this.get_display_text());

        this.rule.update(this.freq_rules[this.selected_freq]);
        this.panel.widget.update();
    },

    remove: function() {
        recurrence.widget.default_panel()
        var parent = this.elements.root.parentNode;
        if (parent)
            parent.removeChild(this.elements.root);
        if (this.mode == recurrence.widget.INCLUSION)
            recurrence.array.remove(this.panel.widget.data.rrules, this.rule);
        else
            recurrence.array.remove(this.panel.widget.data.exrules, this.rule);
        this.panel.widget.update();
    }
};


recurrence.widget.RuleYearlyForm = function(panel, rule) {
    this.init(panel, rule);
};
recurrence.widget.RuleYearlyForm.prototype = {
    init: function(panel, rule) {
        this.panel = panel;
        this.rule = rule;

        this.init_dom();
    },

    init_dom: function() {
        var form = this;

        var grid = new recurrence.widget.Grid(4, 3);
        var number = 0;
        for (var y=0; y < 3; y++) {
            for (var x=0; x < 4; x++) {
                var cell = grid.cell(x, y);
                if (this.rule.bymonth.indexOf(number + 1) > -1)
                    recurrence.widget.add_class(cell, 'active');
                cell.value = number + 1;
                cell.innerHTML = recurrence.display.months_short[number];
                cell.onclick = function () {
                    if (recurrence.widget.has_class(this, 'active'))
                        recurrence.widget.remove_class(this, 'active');
                    else
                        recurrence.widget.add_class(this, 'active');
                    form.set_bymonth();
                };
                number += 1;
            }
        }

        // by weekday checkbox

        var byday_checkbox = recurrence.widget.e(
            'input', {
                'class': 'checkbox', 'type': 'checkbox',
                'name': 'byday'});
        var byday_label = recurrence.widget.e(
            'span', {'class': 'recurrence-label'},
            recurrence.string.capitalize(
                recurrence.display.labels.on_the) + ':');
        var byday_container = recurrence.widget.e(
            'div', {'class': 'byday'},
            [byday_checkbox, byday_label]);

        // weekday-position

        var position_options = recurrence.array.foreach(
            [1, 2, 3, 4, -1, -2, -3], function(value) {
                var option = recurrence.widget.e(
                    'option', {'value': value},
                    recurrence.string.strip(recurrence.display.weekdays_position[
                        String(value)].split('%(weekday)s')[0]));
                return option;
            });
        var position_select = recurrence.widget.e(
            'select', {'name': 'position', 'class': "custom-select", 'id': 'inputGroupSelect011', 'aria-label':""}, position_options);
        var weekday_options = recurrence.array.foreach(
            recurrence.display.weekdays, function(weekday, i) {
                var option = recurrence.widget.e(
                    'option', {'value': i}, weekday);
                return option;
            });
        var weekday_select = recurrence.widget.e(
            'select', {'name': 'weekday', 'class': "custom-select", 'id': 'inputGroupSelect012', 'aria-label':""}, weekday_options);
        var weekday_position_container = recurrence.widget.e(
            'div', {'class': 'section'}, [position_select, weekday_select]);

        // core

        var year = recurrence.widget.e('div');
        year.appendChild(grid.elements.root);

        var root = recurrence.widget.e(
            'div', {'class': 'yearly'},
            [year, byday_container, weekday_position_container]);
        recurrence.widget.add_class(root, 'hidden');

        if (this.rule.byday.length) {
            if (form.rule.bysetpos.length) {
                position_select.value = String(form.rule.bysetpos[0]);
            } else {
                position_select.value = String(form.rule.byday[0].index);
            }
            weekday_select.value = String(form.rule.byday[0].number);
            byday_checkbox.checked = true;
        } else {
            position_select.disabled = true;
            weekday_select.disabled = true;
        }

        // events

        byday_checkbox.onclick = function () {
            if (this.checked) {
                position_select.disabled = false;
                weekday_select.disabled = false;
                form.set_byday();
            } else {
                position_select.disabled = true;
                weekday_select.disabled = true;
                form.rule.byday = [];
                form.panel.update();
            }
        };

        position_select.onchange = function () {
            form.set_byday();
        };

        weekday_select.onchange = function () {
            form.set_byday();
        };

        this.elements = {
            'root': root,
            'grid': grid,
            'byday_checkbox': byday_checkbox,
            'position_select': position_select,
            'weekday_select': weekday_select
        };
    },

    get_weekday: function() {
        var number = parseInt(this.elements.weekday_select.value, 10);
        var index = parseInt(this.elements.position_select.value, 10);
        return new recurrence.Weekday(number, index);
    },

    set_bymonth: function() {
        var bymonth = [];
        recurrence.array.foreach(
            this.elements.grid.cells, function(cell) {
                if (recurrence.widget.has_class(cell, 'active'))
                    bymonth.push(cell.value);
            })
        this.rule.bymonth = bymonth;
        this.panel.update();
    },

    set_byday: function() {
        this.rule.byday = [this.get_weekday()];
        this.panel.update();
    },

    show: function() {
        recurrence.widget.remove_class(this.elements.root, 'hidden');
    },

    hide: function() {
        recurrence.widget.add_class(this.elements.root, 'hidden');
    }
};


recurrence.widget.RuleMonthlyForm = function(panel, rule) {
    this.init(panel, rule);
};
recurrence.widget.RuleMonthlyForm.prototype = {
    init: function(panel, rule) {
        this.panel = panel;
        this.rule = rule;

        this.init_dom();
    },

    init_dom: function() {
        var form = this;

        // monthday

        var monthday_grid = new recurrence.widget.Grid(7, Math.ceil(31 / 7));
        var number = 0;
        for (var y=0; y < Math.ceil(31 / 7); y++) {
            for (var x=0; x < 7; x++) {
                number += 1;
                var cell = monthday_grid.cell(x, y);

		// use the last four cells to provide negative
		// day indexes
                cell.innerHTML = number<=31 ? number : number-36;
                if (this.rule.bymonthday.indexOf(number) > -1)
                    recurrence.widget.add_class(cell, 'active');
                cell.onclick = function () {
                    if (monthday_grid.disabled)
                        return;
                    var day = parseInt(this.innerHTML, 10) || null;
                    if (day) {
                        if (recurrence.widget.has_class(this, 'active'))
                            recurrence.widget.remove_class(this, 'active');
                        else
                            recurrence.widget.add_class(this, 'active');
                        form.set_bymonthday();
                    }
                }
                // }
            }
        }
        var monthday_grid_container = recurrence.widget.e(
            'div', {'class': 'section'});
        monthday_grid_container.appendChild(monthday_grid.elements.root);
        var monthday_radio = recurrence.widget.e(
            'input', {
                'class': 'radio', 'type': 'radio',
                'name': 'monthly', 'value': 'monthday'});
        var monthday_label = recurrence.widget.e(
            'span', {'class': 'recurrence-label'},
            recurrence.display.labels.each + ':');
        var monthday_container = recurrence.widget.e(
            'li', {'class': 'monthday'},
            [monthday_radio, monthday_label, monthday_grid_container]);

        // weekday-position

        var position_options = recurrence.array.foreach(
            [1, 2, 3, 4, -1, -2, -3], function(value) {
                var option = recurrence.widget.e(
                    'option', {'value': value},
                    recurrence.string.strip(
                        recurrence.display.weekdays_position[
                        String(value)].split('%(weekday)s')[0]));
                return option;
            });
        var position_select = recurrence.widget.e(
            'select', {'name': 'position', 'class': "custom-select", 'id': 'inputGroupSelect013', 'aria-label':""}, position_options);

        var weekday_options = recurrence.array.foreach(
            recurrence.display.weekdays, function(weekday, i) {
                var option = recurrence.widget.e(
                    'option', {'value': i}, weekday);
                return option;
            });
        var weekday_select = recurrence.widget.e(
            'select', {'name': 'weekday', 'class': "custom-select", 'id': 'inputGroupSelect014', 'aria-label':""}, weekday_options);
        var weekday_position_container = recurrence.widget.e(
            'div', {'class': 'section'}, [position_select, weekday_select]);
        var weekday_radio = recurrence.widget.e(
            'input', {
                'class': 'radio', 'type': 'radio',
                'name': 'monthly', 'value': 'weekday'});
        var weekday_label = recurrence.widget.e(
            'span', {'class': 'recurrence-label'},
            recurrence.display.labels.on_the + ':');
        var weekday_container = recurrence.widget.e(
            'li', {'class': 'weekday'},
            [weekday_radio, weekday_label, weekday_position_container]);

        // core

        var monthday_weekday_container = recurrence.widget.e(
            'ul', {'class': 'monthly'},
            [monthday_container, weekday_container]);

        var root = recurrence.widget.e(
            'div', {'class': 'monthly'}, [monthday_weekday_container]);
        recurrence.widget.add_class(root, 'hidden');

        // events

        // for compatibility with ie, use timeout
        setTimeout(function () {
            if (form.rule.byday.length) {
                weekday_radio.checked = true;
                if (form.rule.bysetpos.length) {
                    position_select.value = String(form.rule.bysetpos[0]);
                } else {
                    position_select.value = String(form.rule.byday[0].index);
                }
                weekday_select.value = String(form.rule.byday[0].number);
                monthday_grid.disable();
            } else {
                monthday_radio.checked = true;
                position_select.disabled = true;
                weekday_select.disabled = true;
            }
        }, 1);

        monthday_radio.onclick = function () {
            this.checked = true;
            weekday_radio.checked = false;
            position_select.disabled = true;
            weekday_select.disabled = true;
            monthday_grid.enable();
            form.set_bymonthday();
        };

        weekday_radio.onclick = function () {
            this.checked = true;
            monthday_radio.checked = false;
            position_select.disabled = false;
            weekday_select.disabled = false;
            monthday_grid.disable();
            form.set_byday();
        };

        position_select.onchange = function () {
            form.set_byday();
        };

        weekday_select.onchange = function () {
            form.set_byday();
        };

        this.elements = {
            'root': root,
            'monthday_grid': monthday_grid,
            'monthday_radio': monthday_radio,
            'weekday_radio': weekday_radio,
            'position_select': position_select,
            'weekday_select': weekday_select
        };
    },

    get_weekday: function() {
        var number = parseInt(this.elements.weekday_select.value, 10);
        var index = parseInt(this.elements.position_select.value, 10);
        return new recurrence.Weekday(number, index);
    },

    set_byday: function() {
        this.rule.bymonthday = [];
        this.rule.bysetpos = [];
        this.rule.byday = [this.get_weekday()];
        this.panel.update();
    },

    set_bymonthday: function() {
        this.rule.bysetpos = [];
        this.rule.byday = [];
        var monthdays = [];
        recurrence.array.foreach(
            this.elements.monthday_grid.cells, function(cell) {
                var day = parseInt(cell.innerHTML, 10) || null;
                if (day && recurrence.widget.has_class(cell, 'active'))
                    monthdays.push(day);
            });
        this.rule.bymonthday = monthdays;
        this.panel.update();
    },

    show: function() {
        recurrence.widget.remove_class(this.elements.root, 'hidden');
    },

    hide: function() {
        recurrence.widget.add_class(this.elements.root, 'hidden');
    }
};



recurrence.widget.RuleHorlyForm = function(panel, rule) {
    this.init(panel, rule);
};


recurrence.widget.RuleHorlyForm.prototype = {
    init: function(panel, rule) {
        this.panel = panel;
        this.rule = rule;

        this.init_dom();
    },

    init_dom: function() {
        var form = this;
        var hours_grid = new recurrence.widget.Grid(6, 4);
        

        var selected_hours = recurrence.array.foreach(
            this.rule.byhour, function(hour) {
                return hour
            }
        );

        let number = -1
        for (var col=0; col < 4; col++) {
            for (var row=0; row < 6; row++) {
                number += 1
                var cell = hours_grid.cell(row, col);

                if (selected_hours.indexOf(number) > -1) {
                    recurrence.widget.add_class(cell, 'active');
                }
                cell.value = number;
                cell.innerHTML = number
                
                cell.onclick = function () {
                    if (hours_grid.disabled)
                        return;
                    if (recurrence.widget.has_class(this, 'active'))
                        recurrence.widget.remove_class(this, 'active');
                    else
                        recurrence.widget.add_class(this, 'active');
                    form.set_byhours();
                };

            }
        }
    
        var hours_container = recurrence.widget.e(
            'div', {'class': 'section'}
        );
        hours_container.appendChild(hours_grid.elements.root);
        
        var root = recurrence.widget.e(
            'div', {'class': 'hours hidden'}, [hours_container]
        );

        this.elements = {
            'root': root,
            'hours_grid': hours_grid
        };
    },

    set_byhours: function () {
        var byhour = [];
        recurrence.array.foreach(
            this.elements.hours_grid.cells, function (cell) {
                if (recurrence.widget.has_class(cell, 'active')) {
                    byhour.push(cell.value)
                }
            });
        this.rule.byhour = byhour;
        this.panel.update();
    },

    show: function() {
        recurrence.widget.remove_class(this.elements.root, 'hidden');
    },

    hide: function() {
        recurrence.widget.add_class(this.elements.root, 'hidden');
    }
};



recurrence.widget.RuleWeeklyForm = function(panel, rule) {
    this.init(panel, rule);
};
recurrence.widget.RuleWeeklyForm.prototype = {
    init: function(panel, rule) {
        this.panel = panel;
        this.rule = rule;

        this.init_dom();
    },

    init_dom: function() {
        var form = this;

        var weekday_grid = new recurrence.widget.Grid(7, 1);
        var days = [];
        var days = recurrence.array.foreach(
            this.rule.byday, function(day) {
                return recurrence.to_weekday(day).number;
            });
        for (var x=0; x < 7; x++) {
            var cell = weekday_grid.cell(x, 0);
            if (days.indexOf(x) > -1)
                recurrence.widget.add_class(cell, 'active');
            cell.value = x;
            cell.innerHTML = recurrence.display.weekdays_short[x];
            cell.onclick = function () {
                if (weekday_grid.disabled)
                    return;
                if (recurrence.widget.has_class(this, 'active'))
                    recurrence.widget.remove_class(this, 'active');
                else
                    recurrence.widget.add_class(this, 'active');
                form.set_byday();
            };
        }

        var weekday_container = recurrence.widget.e(
            'div', {'class': 'section'});

        weekday_container.appendChild(weekday_grid.elements.root);
        var root = recurrence.widget.e(
            'div', {'class': 'weekly hidden'}, [weekday_container]);

        this.elements = {
            'root': root,
            'weekday_grid': weekday_grid
        };
    },

    set_byday: function() {
        var byday = [];
        recurrence.array.foreach(
            this.elements.weekday_grid.cells, function(cell) {
                if (recurrence.widget.has_class(cell, 'active'))
                    byday.push(new recurrence.Weekday(cell.value));
            });
        this.rule.byday = byday;
        this.panel.update();
    },

    show: function() {
        recurrence.widget.remove_class(this.elements.root, 'hidden');
    },

    hide: function() {
        recurrence.widget.add_class(this.elements.root, 'hidden');
    }
};


recurrence.widget.RuleDailyForm = function(panel, rule) {
    this.init(panel, rule);
};
recurrence.widget.RuleDailyForm.prototype = {
    init: function(panel, rule) {
        this.panel = panel;
        this.rule = rule;

        this.init_dom();
    },

    init_dom: function() {
        var root = recurrence.widget.e('div', {'class': 'daily hidden'});
        this.elements = {'root': root};
    },

    show: function() {
        // recurrence.widget.remove_class(this.elements.root, 'hidden');
    },

    hide: function() {
        // recurrence.widget.add_class(this.elements.root, 'hidden');
    }
};

recurrence.widget.CustomRruleForm = function(panel, mode, custom_rrule) {
    this.init(panel, mode, custom_rrule);
};
recurrence.widget.CustomRruleForm.prototype = {
    init: function(panel, mode, custom_rrule) {
        this.collapsed = true;
        this.panel = panel;
        this.mode = mode;
        this.custom_rrule = custom_rrule;

        this.init_dom();
    },

    init_dom: function() {
        var form = this;

        var custom_rrule_selector = new recurrence.widget.CustomInputSelector(
            this.custom_rrule, {'onchange': function(custom_rrule) {form.update(custom_rrule);}}
        );
        
        var custom_rrule_input_label = recurrence.widget.e(
            'span', {'class': 'recurrence-label col-sm-2 col-form'}, recurrence.display.labels.rule + ':');
        
        var custom_rrule_input_container = recurrence.widget.e(
            'div', {'class': 'custom_rrule_input_container'}, [custom_rrule_input_label, custom_rrule_selector.elements.root]
        )

        var custom_rrule_error = recurrence.widget.e(
            'span', {'class': 'recurrence-label col-sm-2 col-form help-block text-red',
            'error_field_id': this.panel.id_panel}, 'Ошибка синтаксиса!'
        );

        var root = recurrence.widget.e(
            'form', {'class': 'date'}, [custom_rrule_input_container]
        );

        // init dom
        this.panel.set_label(this.get_display_text());
        this.panel.set_body(root);
        this.elements = {
            'root': root,
            'custom_rrule_input_container': custom_rrule_input_container,
            'custom_rrule_error': custom_rrule_error
        };

    },

    get_display_text: function() {
        return `rrule: ${this.custom_rrule}`
    },

    set_syntax_error_panel: function(is_valid, custom_rrule) {
        if (is_valid || !custom_rrule) {
            recurrence.widget.remove_class(this.panel.elements.root, 'error_panel');
            $(`[error_field_id="${this.panel.id_panel}"]`).first().remove()
        }
        else {
            recurrence.widget.add_class(this.panel.elements.root, 'error_panel');
            this.elements.custom_rrule_input_container.appendChild(this.elements.custom_rrule_error)
        }
        
    },

    update: function(custom_rrule) {
        clearTimeout(CheckRruleSyntaxTimer);
        
        var index_update = this.panel.widget.data.custom_rrules.indexOf(this.custom_rrule)
        this.custom_rrule = custom_rrule
        this.panel.widget.data.custom_rrules[index_update] = custom_rrule
        this.panel.set_label(this.get_display_text());
        this.panel.widget.update();

        CheckRruleSyntaxTimer = setTimeout(() => {
            if (custom_rrule) {
                recurrence.func.check_syntax_rrule(custom_rrule).then((result) => {
                    this.set_syntax_error_panel(result, custom_rrule)
                })
            } else {
                this.set_syntax_error_panel(true, custom_rrule)
            }
            
        }, TIME_TO_CHECK_SYNTAX_RRULE)
    },

    remove: function() {
        var parent = this.elements.root.parentNode;
        if (parent)
            parent.removeChild(this.elements.root);
        recurrence.array.remove(this.panel.widget.data.custom_rrules, this.custom_rrule);
        this.panel.widget.update();
    }

}

recurrence.widget.DateForm = function(panel, mode, date) {
    this.init(panel, mode, date);
};
recurrence.widget.DateForm.prototype = {
    init: function(panel, mode, date) {
        this.collapsed = true;
        this.panel = panel;
        this.mode = mode;
        this.date = date;

        this.init_dom();
    },

    init_dom: function() {
        var form = this;

        // mode

        var mode_checkbox = recurrence.widget.e(
            'input', {
                'class': 'checkbox', 'type': 'checkbox', 'name': 'mode',
                'onclick': function() {
                    if (this.checked)
                        form.set_mode(recurrence.widget.EXCLUSION);
                    else
                        form.set_mode(recurrence.widget.INCLUSION);
                }
            });
        if (this.mode == recurrence.widget.EXCLUSION)
            mode_checkbox.checked = true;
        var mode_label = recurrence.widget.e(
            'span', {'class': 'recurrence-label'},
            recurrence.display.labels.exclude_date);
        var mode_container = recurrence.widget.e(
            'div', {'class': 'mode'}, [mode_checkbox, mode_label]);

        // date

        var date_label = recurrence.widget.e(
            'span', {'class': 'recurrence-label'}, recurrence.display.labels.date + ':');
        var date_selector = new recurrence.widget.DateSelector(
            this.date, {'onchange': function() {form.update();}});
        var date_container = recurrence.widget.e(
            'div', {'class': 'date'}, [date_label, date_selector.elements.root]);

        // core

        var root = recurrence.widget.e(
            'form', {'class': 'date'}, [mode_container, date_container]);

        // init dom

        this.panel.set_label(this.get_display_text());
        this.panel.set_body(root);
        this.elements = {'root': root};
    },

    get_display_text: function() {
        var text = recurrence.date.format(this.date, pgettext('date', '%l, %F %j, %Y %h:%i'));
        if (this.mode == recurrence.widget.EXCLUSION)
            text = recurrence.display.mode.exclusion + ' ' + text;
        return recurrence.string.capitalize(text);
    },

    set_mode: function(mode) {
        if (this.mode != mode) {
            if (this.mode == recurrence.widget.INCLUSION) {
                recurrence.array.remove(
                    this.panel.widget.data.rdates, this.date);
                this.panel.widget.data.exdates.push(this.date);
                recurrence.widget.remove_class(
                    this.elements.root, 'inclusion');
                recurrence.widget.add_class(
                    this.elements.root, 'exclusion');
                this.update();
            } else {
                recurrence.array.remove(
                    this.panel.widget.data.exdates, this.date);
                this.panel.widget.data.rdates.push(this.date);
                recurrence.widget.remove_class(
                    this.elements.root, 'exclusion');
                recurrence.widget.add_class(
                    this.elements.root, 'inclusion');
                this.update();
            }
            this.mode = mode;
        }
        this.update();
    },

    update: function() {
        this.panel.set_label(this.get_display_text());
        this.panel.widget.update();
    },

    remove: function() {
        var parent = this.elements.root.parentNode;
        if (parent)
            parent.removeChild(this.elements.root);
        if (this.mode == recurrence.widget.INCLUSION)
            recurrence.array.remove(this.panel.widget.data.rdates, this.date);
        else
            recurrence.array.remove(this.panel.widget.data.exdates, this.date);
        this.panel.widget.update();
    }
};


recurrence.widget.e = function(tag_name, attrs, inner) {
    var element = document.createElement(tag_name);
    if (attrs)
        recurrence.widget.set_attrs(element, attrs);
    if (inner) {
        if (!inner.toLowerCase && inner.length)
            recurrence.array.foreach(
                inner, function(e) {element.appendChild(e);});
        else
            element.innerHTML = inner;
    }
    return element;
};


recurrence.widget.set_attrs = function(element, attrs) {
    for (var attname in attrs)
        if (attname.match(/^on/g))
            element[attname] = attrs[attname];
        else if (attname == 'class')
            element.className = attrs[attname];
        else
            element.setAttribute(attname, attrs[attname]);
};


recurrence.widget.add_class = function(element, class_name) {
    var names = (element.className || '').split(/[ \r\n\t]+/g);
    if (names.indexOf(class_name) == -1) {
        names.push(class_name);
        element.className = names.join(' ');
    }
};


recurrence.widget.remove_class = function(element, class_name) {
    var names = (element.className || '').split(/[ \r\n\t]+/g);
    if (names.indexOf(class_name) > -1) {
        recurrence.array.remove(names, class_name);
        element.className = names.join(' ');
    }
};


recurrence.widget.has_class = function(element, class_name) {
    var names = (element.className || '').split(/[ \r\n\t]+/g);
    if (names.indexOf(class_name) > -1)
        return true;
    else
        return false;
};


recurrence.widget.element_in_dom = function(element, dom) {
    if (element == dom) {
        return true;
    } else {
        for (var i=0; i < dom.childNodes.length; i++)
            if (recurrence.widget.element_in_dom(element, dom.childNodes[i]))
                return true;
    }
    return false;
};


recurrence.widget.cumulative_offset = function(element) {
    var y = 0, x = 0;
    do {
        y += element.offsetTop  || 0;
        x += element.offsetLeft || 0;
        element = element.offsetParent;
    } while (element);
    return [x, y];
};


recurrence.widget.textareas_to_widgets = function(token) {
    var elements = [];
    if (!token)
        token = 'recurrence-widget';
    if (token.toLowerCase) {
        var textareas = document.getElementsByTagName('textarea');
        recurrence.array.foreach(
            textareas, function(textarea) {
                if (recurrence.widget.has_class(textarea, token))
                    elements.push(textarea);
            });
    }
    recurrence.array.foreach(
        elements, function(e) {
            new recurrence.widget.Widget(e, window[e.id] || {});
        });
};


recurrence.widget.date_today = function() {
    var date = new Date();
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    return date;
};


recurrence.widget.INCLUSION = true;
recurrence.widget.EXCLUSION = false;


// display


if (!recurrence.display)
    recurrence.display = {};

recurrence.display.mode = {
    'inclusion': gettext('including'), 'exclusion': gettext('excluding')
};

recurrence.display.labels = {
    'frequency': gettext('Frequency'),
    'on_the': gettext('On the'),
    'each': gettext('Each'),
    'every': gettext('Every'),
    'until': gettext('Until'),
    'count': gettext('Occurs %(number)s time'),
    'count_plural': gettext('Occurs %(number)s times'),
    'date': gettext('Date'),
    'time': gettext('Time'),
    'repeat_until': gettext('Repeat until'),
    'exclude_occurrences': gettext('Exclude these occurences'),
    'exclude_date': gettext('Exclude this date'),
    'rule': gettext('Custom rrule'),
    'add_rule': gettext('Add rule'),
    'add_date': gettext('Add date'),
    'add_custom_rrule': gettext('Add a rule in rrule format'),
    'remove': gettext('Remove'),
    'calendar': gettext('Calendar')
};

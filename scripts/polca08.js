Procs = []

Function.prototype.toString = function () {
    return '#{Procedure'+(this.name?' '+this.name:'')+'}'
}

polca = {
    help_chache: {},
    reverse: null,        // reversed notation checkbox
    stack_to_input: null, // stack to input checkbox
    input: null,          // input box
    output: null,         // output div

    // Assign Dom Objects to this object and reset their values
    initialize: function () {
        var $ = function(a){return document.getElementById(a)};
        // DOM Object for handling input and output
        this.input = $('input_box');
        this.input.value = '';
        this.output = $('result');
        this.output.innerHTML = "<p>Problems? Type <code><a href='javascript:polca.link(\"help\")'>help</a></code></p>";
        this.reverse    = $('reverse');
        this.stack_to_input = $('stack_to_input');
        if (typeof localStorage != 'undefined') {
            this.reverse.checked = (localStorage['reversed'] == 'true');
            this.reverse.addEventListener(
                'change',
                function(e){localStorage['reversed'] = e.target.checked },
                false);
            this.stack_to_input.checked = (localStorage['stackwrite'] == 'true')
            this.stack_to_input.addEventListener(
                'change',
                function(e){localStorage['stackwrite'] = e.target.checked },
                false);
        }
    },

    // Sets some text to the input field and execute it.
    // Used in help files to link to other help files.
    link: function (dest,dest_rev) {
        this.input.value = dest_rev && polca.reverse.checked ? dest_rev : dest;
        this.exec()
    },

    // Removes everything from the output field
    clear : function () {
        this.output.innerHTML = ''
    },

    // writes ''value'' to the input field
    write : function (value) {
        this.output.innerHTML += '<p>'+value+'</p>'
    },

    exec: function () {
//        try {
            stack = []
            this.clear()
            var lstack = this.calc(this.input.value, this.reverse.checked )
            if (this.stack_to_input.checked) this.input.value = ''
            for (var part in lstack){
                //if (part !== false) {
                    this.write("[" + part + "]: " + lstack[part].toString());
                    if (this.stack_to_input.checked) this.input.value += ' '+lstack[part]
                //}
            }
            if (this.stack_to_input.checked) this.input.value = this.input.value.replace(' ', '')
//        } catch (e) {
//            this.write('[ERROR]: '+e.toString())
//        }
    },

    // performes the calculation
    calc: function (input,reverse) {
        rev = reverse
        // findes procedures and inserts placeholders
        input = input.replace(/\{.+?\}/g, this.proc, reverse)
        if (typeof stack == 'undefined') stack = []
        
        //  Push elements on stack (ignore undefined)
        var push = function (obj) {
            if (obj !== undefined) stack.push(obj)
        }
        // Grab values from stack
        var pop = function (num) {
            if (num == undefined) num = 1
            if (stack.length < num) throw 'Not enought values on stack.'
            var result = stack.splice(stack.length-num)
            return reverse ? result : result.reverse()
        }
        
        var base = input.split(' ')
        if (!reverse) base = base.reverse()
        base.every(function (value) {
            if (value == '')
                return true

            // Match numbers
            else if (!isNaN(value))
                push(Number(value))

            // Match strings
            else if (/^\'(.*)$/.test(value))
                push(value.match(/^\'(.*)$/)[1])

            // findes given names inside the Math object and returns there
            // values / execeutes them
            else if (Math[value]) {
                if (typeof Math[value] == 'function') {
                    if (Math[value].proc)
                        stack = Math[value]()   // TODO: Syntax for polca Procs execution
                    else
                        push(Math[value].apply(null, pop(Math[value].length)))
                } else
                    push(Math[value])
            
            // exec command
            } else if (value == 'exec') {
                var v = pop()[0];
                if (v.proc)
                    stack = v()
                else
                    push(v.apply(null, pop(v.length)))
        
            // <stack traversing commands>
            } else if (value == 'dup') {
                var a = pop()[0]
                push(a);push(a)
            
            } else if (value == 'swap') {
                var a = pop(2)
                if (reverse){
                    push(a[1])
                    push(a[0])
                } else {
                    push(a[0])
                    push(a[1])
                }
            
            } else if (value == 'del') {
                pop(pop()[0])
            //</stack travesing commands>
            
            // Matches expressions like Procs[0]. This is the way of polca
            // for temporary proc storing
            } else if (/Procs\[\d+\]/.test(value)) {
                push(Procs[value.match(/\d+/)[0]]);

            // Computes the help command (not inside polcalib because it
            // has a default value)
            } else if (value == 'help')
                this.help(stack.length!=0 ? pop() : 'index')

            else
                throw 'Undefined operator "'+value+'"'
            return true
        }, this);
        if (!reverse) stack = stack.reverse()
        var lstack = stack
        stack = []
        return lstack
    },

    // 
    proc: function (text) {
        text = text.match(/\{(.*)\}/)
        var reverse = rev
        function polcaProc () {
            return polca.calc(text[1], reverse)
        }
        polcaProc.proc = true
        Procs.push(polcaProc)
        return ' Procs['+(Procs.length-1)+'] '
    },
    
    help: function (topic) {
        if (polca.help_chache[topic])
            polca.write(polca.help_chache[topic]);
        else {
            req = XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
            req.open('GET', 'help/'+topic+'.html', true);
            req.onreadystatechange = function() {
                if (req.readyState == 4) {
                    if (req.status == 404)
                        polca.write('<p>Keine Hilfe zu '+topic+' gefunden</p>');
                    else {
                        polca.help_chache[topic] = req.responseText;
                        polca.write(req.responseText);
                    }
                }
            }
            req.send();
        }
    }
}
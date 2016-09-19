// These use browser apis, so the are not part of polcalib
(function () {
    "use strict";

    polcaLib.storeVal = function (val, name) {
        localStorage.setItem(name, val.toString());
    };

    polcaLib.store = function (name) {
        localStorage.setItem(name, polcaLib.get(name));
    };

    polcaLib.loadVal = function (name) {
        return Polca.exec(Polca.compile(localStorage.getItem(name)), new Polca.Context()).stack.pull(0);
    };

    polcaLib.load = function (name) {
        this.scope.set[name] = polcaLib.loadVal(name);
    };

    polcaLib.trash = function (name) {
        localStorage.setItem(name, undefined);
    };

    polcaLib.import = function (filename) {
        if (!filename.match(/http(s)?\:\\\\/))
            filename = 'src/lib/' + filename + '.js';
        $.ajax({
            url: filename,
            dataType: 'script'
        })
    };
}());

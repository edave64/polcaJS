// These use browser apis, so the are not part of polcalib
module polcaLib {
    export function storeVal (val, name) {
        localStorage.setItem(name, val)
    }

    export function store (name) {
        localStorage.setItem(name, polcaLib.get(name));
    }

    export function loadVal (name) {
        const context = new Polca.Context();
        Polca.compile(localStorage.getItem(name)).call(context);
        return context.stack.pull(0);
    }

    export function load (name) {
        this.scope.set[name] = polcaLib.loadVal(name);
    }

    export function trash (name) {
        localStorage.setItem(name, undefined);
    }
}

polcaLib['import'] = function (filename) {
    if (!filename.match(/http(s)?:\\\\/))
        filename = 'src/lib/' + filename + '.js';

    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = () => {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200) eval(xmlHttp.responseText);
    };
    xmlHttp.open("GET", filename, true);
    xmlHttp.send(null);
};

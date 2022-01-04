// These use browser apis, so the are not part of polcalib
var polcaLib;
(function (polcaLib) {
    function storeVal(val, name) {
        localStorage.setItem(name, val);
    }
    polcaLib.storeVal = storeVal;
    function store(name) {
        localStorage.setItem(name, polcaLib.get(name));
    }
    polcaLib.store = store;
    function loadVal(name) {
        const context = new Polca.Context();
        Polca.compile(localStorage.getItem(name)).call(context);
        return context.stack.pull(0);
    }
    polcaLib.loadVal = loadVal;
    function load(name) {
        this.scope.set[name] = polcaLib.loadVal(name);
    }
    polcaLib.load = load;
    function trash(name) {
        localStorage.setItem(name, undefined);
    }
    polcaLib.trash = trash;
})(polcaLib || (polcaLib = {}));
polcaLib['import'] = function (filename) {
    if (!filename.match(/http(s)?:\\\\/))
        filename = 'src/lib/' + filename + '.js';
    const xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = () => {
        if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            eval(xmlHttp.responseText);
    };
    xmlHttp.open("GET", filename, true);
    xmlHttp.send(null);
};
//# sourceMappingURL=polca.htmlextension.js.map
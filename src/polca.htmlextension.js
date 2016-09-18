// These use browser apis, so the are not part of polcalib

polcaLib.storeVal = function (val, name) {
  localStorage.setItem(name, val.toString());
};

polcaLib.store = function (name) {
  localStorage.setItem(name, this.get(name));
};

polcaLib.loadVal = function (name) {
  return polca.exec(polca.compile(localStorage.getItem(name))).stack[0];
};

polcaLib.load = function (name) {
  this.userScope[name] = polcaLib.loadVal(name);
};

polcaLib.trash = function (name) {
  localStorage.setItem(name, undefined);
};

polcaLib.import = function (filename) {
  if (!filename.match(/http(s)?\:\\\\/))
    filename = 'src/lib/'+filename+'.js';
  a = filename;
  $.ajax({
    url: filename,
    dataType: 'script'
  })
};
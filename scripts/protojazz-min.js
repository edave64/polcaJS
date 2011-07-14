/* Protojazz 0.5
 * (c) 2011 EDave
 *
 * Protojazz is freely distributable under the terms of an MIT-style license.
 * For details, see the Protojazz web site: http://edave64.github.com/protojazz/
*/
if(!$)var $={};$.proto=function(b,a){if(!a)a=b,b=$.global;var c=function(){(this
.init||function(){}).apply(this,arguments)};c.prototype={};if(typeof a==
"function"){var d={};a.call(d);a=d}b.inherited&&b.inherited(a);a.self&&($.
extend(c,a.self),delete a.self);c.prototype=new b;$.extendP(c,a);c.prototype.
_parent=b.prototype;return c};$.applyAttr=function(b,a){if(a.getters)for(var c
in a.getters)b.__defineGetter__(c,a.getters[c]);if(a.setters)for(var d in a.
setters)b.__defineSetter__(d,a.setters[d]);delete a.getters};$.extend=function(b
,a){if(typeof a=="function")a.call(b);else for(var c in a)a.hasOwnProperty(c)&&(
b[c]=a[c]);$.applyAttr(a,a)};$.extendP=function(b,a){$.extend(b.prototype,a)};$.
global=$.proto(function(){},{parent:function(b){if(typeof this._parent[b]==
"function")return this._parent[b].apply(this,[].slice.call(arguments,1));return
this._parent[b]}});if(typeof module!='undefined')module.exports=$

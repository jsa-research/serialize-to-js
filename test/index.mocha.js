'use strict';

/* global describe, it */

var assert = require('assert');
var M = require('../index');

function log (arg) {
	console.log(JSON.stringify(arg).replace(/"/g, ''));
}

describe('#serialize simple', function(){
	it('function only', function(){
		var res = M.serialize(log);
		var exp = log.toString();
		assert.equal(res, exp);
	});
	it('string only', function(){
		var res = M.serialize("string's\nnew\t line");
		var exp = '\'string\\\'s\nnew\t line\'';
		assert.equal(res, exp);
	});
	it('number only', function(){
		var res = M.serialize(3.1415);
		var exp = '3.1415';
		assert.equal(res, exp);
	});
	it('boolean only', function(){
		var res = M.serialize(true);
		var exp = 'true';
		assert.equal(res, exp);
	});
	it('undefined only', function(){
		var res = M.serialize(undefined);
		var exp = 'undefined';
		assert.equal(res, exp);
	});
	it('regex only', function(){
		var res = M.serialize(/test(?:it)?/ig);
		var exp = '/test(?:it)?/gi';
		assert.equal(res, exp);
	});
	it('date only', function(){
		var d = new Date(24*12*3600000);
		var res = M.serialize(d);
		var exp = "new Date('1970-01-13T00:00:00.000Z')";
		assert.equal(res, exp);
	});
	it('error only', function(){
		var e = new Error('error');
		var res = M.serialize(e);
		var exp = "new Error('error')";
		assert.equal(res, exp);
	});
	it('empty error only', function(){
		var e = new Error();
		var res = M.serialize(e);
		var exp = "new Error()";
		assert.equal(res, exp);
	});
	it('buffer only', function(){
		var b = new Buffer('buffer');
		var res = M.serialize(b);
		var exp = "new Buffer('YnVmZmVy', 'base64')";
		assert.equal(res, exp);
	});
	it('empty buffer only', function(){
		var b = new Buffer('');
		var res = M.serialize(b);
		var exp = "new Buffer('', 'base64')";
		assert.equal(res, exp);
	});
	it('null only', function(){
		var res = M.serialize(null);
		var exp = "null";
		assert.equal(res, exp);
	});
	it('array of primitives only', function(){
		var a = [ true, false, undefined, 1, 3.1415, -17, 'string' ];
		var res = M.serialize(a);
		var exp = "[true, false, undefined, 1, 3.1415, -17, 'string']";
		assert.equal(res, exp);
	});
	it('object of primitives only', function(){
		var o = {
			one: true,
			two: false,
			"thr-ee": undefined,
			four: 1,
			"5": 3.1415,
			six: -17,
			seven: 'string'
		};
		var res = M.serialize(o);
		var exp = "{'5': 3.1415, one: true, two: false, 'thr-ee': undefined, four: 1, six: -17, seven: 'string'}";
		assert.equal(res, exp);
	});
	it('empty object', function(){
		var res = M.serialize({});
		var exp = "{}";
		assert.equal(res, exp);
	});
});

describe('#serialize', function(){
	it('converting an object of objects', function(){
		var o1 = {
			one: true,
			"thr-ee": undefined,
		};
		var o = { a: o1, b: o1 };
		var res = M.serialize(o);
		var exp = "{'a': {one: true, 'thr-ee': undefined}, 'b': {one: true, 'thr-ee': undefined}}";
		assert.equal(res, exp);
	});

	it('converting an object of objects using references', function(){
		var r = {
			one: true,
			"thr-ee": undefined,
		};
		var o = { a: r, b: r, c: { d: r }};
		var opts = { reference: true };
		var res = M.serialize(o, opts);
		var exp = "{'a': {one: true, 'thr-ee': undefined}, 'c': {}}";
		var refs = [ [ 'b', 'a' ], [ 'c.d', 'a' ] ];
		//~ console.log(res); console.log(opts.references);
		assert.equal(res, exp);
		assert.deepEqual(opts.references, refs);
	});

	it('converting a circular object throws', function(){
		var o = { a: { b: {} } };
		o.a.b = o.a;
		assert.throws(function(){ M.serialize(o); }, /can not convert circular structures/);
	});
});

describe('#serializeToModule', function(){
	it('object of objects', function(){
		var r = {
			one: true,
			"thr-ee": undefined,
		};
		var o = { a: r, b: r, c: { d: r }};
		var res = M.serializeToModule(o);
		var exp = "var m = module.exports = {\n\t'a': {\n\t\tone: true,\n\t\t'thr-ee': undefined\n\t},\n\t'b': {\n\t\tone: true,\n\t\t'thr-ee': undefined\n\t},\n\t'c': {\n\t\t'd': {\n\t\t\tone: true,\n\t\t\t'thr-ee': undefined\n\t\t}\n\t}\n};";
		//~ log(res);
		assert.equal(res, exp);
	});
	it('object of objects using references', function(){
		var r = {
			one: true,
			"thr-ee": undefined,
		};
		var o = { a: r, b: r, c: { d: r }};
		var res = M.serializeToModule(o, { reference: true, beautify: false });
		var exp = "var m = module.exports = {'a': {one: true, 'thr-ee': undefined}, 'c': {}};\nm.b = m.a;\nm.c.d = m.a;\n";
		//~ log(res);
		assert.equal(res, exp);
	});
	it('object of objects - beautify', function(){
		var r = {
			one: true,
			"thr-ee": /^test$/,
		};
		var o = { a: r, b: r, c: { d: r }};
		var res = M.serializeToModule(o, { reference: true });
		var exp = "var m = module.exports = {\n\t'a': {\n\t\tone: true,\n\t\t'thr-ee': /^test$/\n\t},\n\t'c': {}\n};\nm.b = m.a;\nm.c.d = m.a;";
		//~ console.log(res);
		assert.equal(res, exp);
	});
});
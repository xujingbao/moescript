var path = require('path');
var opts = require('./options').opts;
var argv = require('./options').argv;
var moe = require('../runtime');
var compiler = require('../compiler');
var util = require('util');
var fs = require('fs');

var ts = new compiler.TopScope;

var optmaps = {};
var options = {}

var runtimeBind = '';
var noPreludeQ  = false;
var bareQ = false;
var fWrite = console.log;

ts.bind('require', 'require');
ts.bind('module', 'module');
ts.bind('exports', 'exports');

var codeSegments = [];

var doFile = function(value){
	if(fs.existsSync(value)){
		if(!noPreludeQ) ts.libRequireBind(require('../prelude'), '(require("moe/prelude"))');
		ts.runtimeBind = runtimeBind;
		var script = compiler.compile(fs.readFileSync(value, 'utf-8'), ts, {
			optionMaps: optmaps,
			warn: function(s){ process.stderr.write(s + '\n') },
			options: options
		});
		codeSegments.push(compiler.stdComposite(script, ts));
	} else {
		process.stderr.write('File ' + value + ' does not exist.' + "\n");
	}
};

var METADATA = require('../package.json');
var VER_MSG = "\
Moescript Optimized Compiler, ver. #version\n\
(c) 2012 #author\n".replace(/#\w+/g, function(m){return METADATA[m.slice(1)]})
var HELP_MSG = "\
USAGE\n\
	moec [options] <input_file>\n\
\n\
OPTIONS\n\
 * -v, --version : Display version information\n\
 * -h, --help : Display help information\n\
 * --explicit : Enable explicit mode\n\
 * -o <path>, --output <path> : Specify the output path of generated .js file. When absent, it will be written into STDOUT\n\
 * -b <name> <expr>, --bind <name> <expr> : Enable a global variable named <name>, and bind it into JavaScript expression <expr>\n\
 * -g <name>, --global <name> : Create a global variable <name>, bind it to <name>\n\
 * --no-prelude : Disable prelude importing\n\
 * --use-prelude : Enable prelude importing\n\
 * --clear-binds : Clear all manually added global variable binds\n\
 * --bare : Equalivent to --no-prelude and --clear-binds\n\
 * --runtime-bind <expr> : Bind the Moescript Runtime into <expr>. When absent, \"require('moe').runtime\" will be used\
"

opts()
	.on('-v', '--version', function(){ return console.log(VER_MSG) })
	.on('-h', '--help', function(){ return console.log(VER_MSG + HELP_MSG) })
	.on('-o', '--output',
		function(path){ fWrite = function(s){fs.writeFileSync(path, s, 'utf-8')} })
	.on('-b', '--bind',
		function(s, x){ ts.bind(s, x) })
	.on('-g', '--global',
		function(varName){ ts.bind(varName, varName) })
	.on('--clear-binds', 
		function(){ ts = new (compiler.TopScope) })
	.on('--no-prelude', function(){ noPreludeQ = true }) 
	.on('--use-prelude', function(){ noPreludeQ = false })
	.on('--bare', 
		function(){ this.config['--clear-binds'].call(this), this.config['--no-prelude'].call(this)})
	.on('--runtime-bind', 
		function(expr){ runtimeBind = expr })
	.on('--include-js', 
		function(file){ codeSegments.push(compiler.inputNormalize(fs.readFileSync(file, 'utf-8'))) })
	.on('--file', '-f', doFile)
	.on('--explicit', function(){ options.explicit = true })
	.file(doFile)
	.parse(argv());

fWrite(codeSegments.join('\n\n'));
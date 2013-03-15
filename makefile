ifeq ($(OS),Windows_NT)
	MKDIR = -@mkdir.exe -p
else
	MKDIR = -@mkdir -p
endif

everything: __all

MOD = dist/moe
MOEC = $(MOD)/compiler

DIRS = $(MOD)/ $(MOD)/bin/ $(MOEC)/

$(DIRS):
	$(MKDIR) $@
dirs: $(MOD)/ $(MOD)/bin/ $(MOEC)/


runtimeMods = $(MOD)/runtime.js $(MOD)/dummy.js
compilerMods = $(MOEC)/compiler.rt.js $(MOEC)/compiler.js $(MOEC)/codegen.js $(MOEC)/lexer.js $(MOEC)/parser.js $(MOEC)/resolve.js $(MOEC)/cps.js
commandLineMods = $(MOD)/bin/options.js $(MOD)/bin/moec.js  $(MOD)/bin/moei.js $(MOD)/bin/moec $(MOD)/bin/moei
metadatas = $(MOD)/package.json $(MOEC)/package.json

moecCompoments = $(runtimeMods) $(compilerMods) $(commandLineMods) $(metadatas)

$(moecCompoments): $(MOD)/%: src/%
	cp $< $@

moec: dirs $(moecCompoments)

PRELUDE_CONFIG = --explicit --bare -g exports -g moert --runtime-bind moert.runtime
$(MOD)/prelude.js: src/prelude/overture.js src/prelude/prelude.moe $(moecCompoments)
	node $(MOD)/bin/moec $(PRELUDE_CONFIG) --include-js $(word 1,$^) $(word 2,$^) -o $@

moePrelude: $(MOD)/prelude.js

### Web test environment
### Always updates all scripts
WEBTEST = doc/webtest
WEBMOD  = $(WEBTEST)/moe
webtestDir:
	$(MKDIR) doc
	$(MKDIR) $(WEBTEST)
	$(MKDIR) $(WEBMOD)
	$(MKDIR) $(WEBMOD)/compiler

nessatEXE = node tools/nessat

###webMods = $(subst $(MOD)/,$(WEBMOD)/,$(runtimeMods) $(compilerMods))
webMods = $(subst $(MOD)/,$(WEBMOD)/,$(runtimeMods) $(compilerMods) $(MOD)/prelude.js)
$(webMods): $(WEBMOD)/%.js: $(MOD)/%.js
	$(nessatEXE) $< $@ dist/

webtestENV = $(WEBTEST)/index.html $(WEBTEST)/webtest.css $(WEBTEST)/webtest.js $(WEBTEST)/mod.rt.js
$(webtestENV): $(WEBTEST)/% : webtest_env/%
	cp $< $@

$(MOD)/README.md: README.md
	cp $< $@

###npmdist: moec
npmdist: moec moePrelude $(MOD)/README.md

webtest: npmdist webtestDir $(webMods) $(webtestENV)

clean:
	rm -rf dist
	rm -rf doc/webtest

force:
	make clean
	make everything

__all: webtest

publish:
	git push origin master:master
	git push cafe   master:master
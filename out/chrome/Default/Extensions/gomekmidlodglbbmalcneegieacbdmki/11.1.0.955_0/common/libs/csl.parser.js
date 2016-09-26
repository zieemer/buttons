/**
 *  CSL Parse by CIUVO for avast! Online Security Plugin
 *
 *
 *  AvastWRC.ial.productScan(json_rules, callback_function)
 *
 *
 * Test code for amazon.de product page

AvastWRC.ial.productScan({
    "status":201,
    "csl":"$title = trim(sizzle('span#btAsinTitle', 'textContent'))\r\n$artist = sizzle('.buying > .parseasinTitle + a', 'textContent') or sizzle('.buying>span>a', 'textContent')\r\n$store_id = sizzle('input#storeID', 'value')\r\n$asin = sizzle('form#handleBuy>input#ASIN', 'value')\r\n$isbn = re('<li><b>ISBN-13:</b>\\\\s*([\\\\d-]{14})\\\\s*</li>')\r\n$availability = sizzle('.buying > span[class^=\"avail\"]', 'class')\r\n$availability = re(/avail(.+)$/, 'i', $availability)\r\n$price = sizzle('td .priceLarge', 'textContent') or sizzle('.olpCondLink:first > .price', 'textContent')\r\n$image = sizzle('#main-image', 'src')\r\n\r\n\n$title = $title or sizzle('#product-title', 'textContent')\r\n$price = $price or sizzle('#prices .a-color-price:first', 'textContent')\r\n$artist = $artist or sizzle('#by-line>a:first', 'textContent')\r\n$asin = $asin or sizzle('#addToCart>input[name=\"a\"]', 'value')\r\n$availability = $availability or sizzle('#availability>#scarcity', 'textContent')\r\n$image = $image or sizzle('#aw-image-block .a-image-wrapper>img:first', 'src')\r\n\r\nif ($price == \"GRATIS\") {\r\n  $price = \"\"\r\n}\r\n\r\n$swatcher = sizzle('#jsSwatches')\r\nif ($store_id == 'videogames' and $swatcher) {\r\n  refresh(5000)\r\n}\r\n\r\nrequire $title, $price\r\nreturn $title, $price, $asin, $artist, $store_id, $isbn, $availability, $image",
    "priority":1,
    "version":"1.4.9",
    "plugins":[["CiuvoSearch",{}],["VoucherSearch",{}]],
    "match":"http://(\\w+\\.)?amazon\\.de"
}, function(response){
  console.log("RESULT", response);
});

 *
 */

(function(jQuery) {
  if(typeof(AvastWRC) === 'undefined') AvastWRC = { ial : {} };

  AvastWRC.ial.productScan = function(json, callback){
    console.log('productscan called');

    var com = {ciuvo : {}};

  // START CIUVO PARSER

  com.ciuvo.cslrunner = function() {
    var CSL_CACHE = [];
    var DEFAULT_CSL = "require $noop\nreturn $noop";
    var CSLRunner = function(csl_code, plugins) {
      this.csl_code = csl_code;
      if(typeof csl_code !== "string") {
        throw"CSL code must be string.";
      }
      this.plugins = plugins;
      this.create_csl()
    };
    var get_csl = function(url) {
      var now = new Date;
      for(var i = 0, l = CSL_CACHE.length;i < l;i++) {
        var config = CSL_CACHE[i];
        var expired = now - config.added > com.ciuvo.setting("csl_expiry_ms");
        if(!expired && config.match.test(url)) {
          return config.csl
        }
      }
      return undefined
    };
    var set_csl = function(priority, csl_code, match, plugins) {
      var csl = new com.ciuvo.cslrunner.CSLRunner(csl_code, plugins);
      CSL_CACHE.push({priority:priority, match:new RegExp(match), csl:csl, plugins:plugins, added:new Date});
      CSL_CACHE.sort(function(a, b) {
        return a.priority - b.priority
      });
      return csl
    };
    var set_default_csl = function(url) {
      return com.ciuvo.cslrunner.set_csl(0, DEFAULT_CSL, url)
    };
    return{CSLRunner:CSLRunner, get_csl:get_csl, set_csl:set_csl, set_default_csl:set_default_csl}
  }();
  com.ciuvo.csl = function() {
    function objectEquals(a, b) {
      if(a === null || b === null) {
        if(a === b) {
          return true
        }else {
          return false
        }
      }
      if(a === undefined || b === undefined) {
        if(a === b) {
          return true
        }else {
          return false
        }
      }
      for(var p in b) {
        if(p[0] == "_") {
          continue
        }
        if(!a.hasOwnProperty(p)) {
          return false
        }
      }
      for(var p in a) {
        if(p[0] == "_") {
          continue
        }
        if(!b.hasOwnProperty(p)) {
          return false
        }
        if(a[p]) {
          switch(typeof a[p]) {
            case "object":
              if(!objectEquals(a[p], b[p])) {
                return false
              }
              break;
            default:
              if(a[p] !== b[p]) {
                return false
              }
          }
        }else {
          if(b[p]) {
            return false
          }
        }
      }
      return true
    }
    function Timer(callback, delay) {
      var timerId, start, remaining = delay;
      this.pause = function() {
        window.clearTimeout(timerId);
        remaining -= new Date - start
      };
      this.resume = function() {
        start = new Date;
        timerId = window.setTimeout(function() {
          callback()
        }, remaining)
      };
      this.cancel = function() {
        window.clearTimeout(timerId)
      };
      this.resume()
    }
    var TypeError = function(message) {
      this.message = message;
      this.name = "TypeError"
    };
    var ValueError = function(message) {
      this.message = message;
      this.name = "ValueError"
    };
    var RequireError = function(message) {
      this.message = message;
      this.name = "RequireError"
    };
    RequireError.prototype.getMessage = function() {
      return this.name + ": " + this.message
    };
    var InterpreterError = function(message) {
      this.message = message;
      this.name = "InterpreterError"
    };
    var InterruptException = function() {
      this.name = "InterruptException"
    };
    var Interpreter = function(doc, window, return_callback, error_callback) {
      this.doc = doc;
      this.window = window;
      this.ret = {};
      this.id = Interpreter.id++;
      this.first_run = true;
      var self = this;
      this.return_callback = function(result) {
        return_callback(result, self.getCurrentContext())
      };
      this.error_callback = function(error) {
        var context = self.getCurrentContext();
        if(context._modified) {
          error_callback(error, context)
        }
      }
    };
    Interpreter.id = 0;
    Interpreter.prototype.InterpreterError = InterpreterError;
    Interpreter.prototype.RequireError = RequireError;
    Interpreter.prototype.interpretNext = function() {
      var stmt_stack = this.stmt_stack;
      if(stmt_stack.length > 0) {
        try {
          var stmt = stmt_stack.pop();
          this.current_stmt = stmt;
          stmt.interpret(this);
          this.interpretNext()
        }catch(e) {
          if(e instanceof InterruptException) {
            stmt_stack.push(stmt)
          }else {
            this.error_callback.call(this, e)
          }
        }
      }
    };
    Interpreter.prototype.getCurrentContext = function() {
      var context = {"_refresh":this.refresh_timer !== undefined};
      for(var name in this.variables) {
        var varname = name.substring(1);
        context[varname] = this.variables[name]
      }
      if(this.previousContext === undefined) {
        context._modified = true
      }else {
        context._modified = !objectEquals(this.previousContext, context)
      }
      return context
    };
    Interpreter.prototype.interpret = function(ast) {
      if(this.first_run) {
        this.previousContext = undefined;
        this.first_run = false
      }else {
        this.previousContext = this.getCurrentContext()
      }
      this.variables = {};
      this.temp = {};
      this.stmt_stack = [];
      this.ast = ast;
      this.refresh_timer = undefined;
      this.wait_timer = undefined;
      ast.interpret(this)
    };
    Interpreter.prototype.pause_timers = function(ast) {
      if(this.refresh_timer) {
        this.refresh_timer.pause()
      }
      if(this.wait_timer) {
        this.wait_timer.pause()
      }
    };
    Interpreter.prototype.resume_timers = function(ast) {
      if(this.refresh_timer) {
        this.refresh_timer.resume()
      }
      if(this.wait_timer) {
        this.wait_timer.resume()
      }
    };
    Interpreter.prototype.close = function(ast) {
      if(this.refresh_timer) {
        this.refresh_timer.cancel()
      }
      if(this.wait_timer) {
        this.wait_timer.cancel()
      }
    };
    Interpreter.prototype.function_table = {"const":function(value) {
      return value
    }, sizzle:function() {
      var args = Array.prototype.slice.call(arguments);
      var selector = args[0];
      var attribute;
      var cssSelector;
      var elem_array;
      if(args.length > 1) {
        attribute = args[1]
      }
      try {
        cssSelector = jQuery
      }catch(e) {
        throw new InterpreterError("jQuery not available under com.ciuvo.jQuery.");
      }
      try {
        elem_array = cssSelector(selector, this.doc)
      }catch(e) {
        throw new InterpreterError("CSS Selector - " + e);
      }
      if(elem_array.length === 0) {
        return""
      }else {
        var res = [];
        for(var i = 0;i < elem_array.length;i++) {
          var elem = elem_array[i];
          var value = "";
          if(attribute) {
            if(attribute == "textContent") {
              value = elem.textContent || elem.innerText
            }else {
              value = elem.getAttribute(attribute)
            }
          }else {
            value = elem.innerHTML
          }
          res.push(value)
        }
        if(res.length == 1) {
          return res[0]
        }else {
          return res
        }
      }
    }, debug:function() {
      var args = Array.prototype.slice.call(arguments);
      if(com && com.ciuvo && com.ciuvo.log) {
        com.ciuvo.log(args)
      }
      return undefined
    }, httpGet:function(url) {
      var temp = this.temp;
      var expr_id = "__httpGet__" + url;
      if(expr_id in temp) {
        var value = temp[expr_id];
        delete temp[expr_id];
        return value
      }else {
        var req = new com.ciuvo.AjaxRequest("GET", url);
        var self = this;
        req.set_onreadystatechange(function(e) {
          var value = null;
          if(req.req.readyState == 4) {
            if(req.req.status == 200) {
              value = req.req.responseText
            }
            temp[expr_id] = value;
            self.interpretNext()
          }
        });
        req.set_onerror(function(e) {
          temp[expr_id] = null;
          self.interpretNext()
        });
        req.send(null);
        throw new InterruptException;
      }
    }, join:function(values, joiner) {
      return values.join(joiner)
    }, len:function(value) {
      if(value.hasOwnProperty("length")) {
        return value.length
      }else {
        return undefined
      }
    }, re:function() {
      var args = arguments;
      var mycontent = this.doc.documentElement.innerHTML;
      var regexp = args[0];
      var flags = "";
      if(args.length >= 2) {
        flags = args[1]
      }
      if(args.length == 3) {
        mycontent = args[2]
      }
      if(args.length > 3) {
        throw new ValueError("'re' expression expects 3 arguments at most.");
      }
      if(!mycontent) {
        return""
      }
      if(typeof mycontent !== "string") {
        try {
          mycontent = mycontent.toString()
        }catch(e) {
          throw new ValueError("'re' block argument has no 'toString'.");
        }
      }
      mycontent = mycontent.replace(/(\r|\n)/ig, "");
      if(regexp instanceof RegExp) {
        regexp = regexp.source
      }
      regexp = regexp.replace(/"([^?])/ig, '"?$1');
      if(flags.search("i") == -1) {
        flags += "i"
      }
      regexp = new RegExp(regexp, flags);
      var m = mycontent.match(regexp);
      if(!m) {
        return""
      }else {
        if(flags.search("g") != -1) {
          return m
        }else {
          if(m.length == 1) {
            return true
          }else {
            return m[1]
          }
        }
      }
    }, refresh:function(interval) {
      var self = this;
      if(interval === undefined) {
        throw new ValueError("refresh interval argument required.");
      }
      interval = parseInt(interval, 10);
      if(interval < 1E3) {
        throw new ValueError("interval must be at least 1000.");
      }
      if(this.refresh_timer) {
        this.refresh_timer.cancel()
      }
      var timer = new Timer(function() {
        self.interpret(self.ast)
      }, interval);
      this.refresh_timer = timer
    }, replace:function() {
      var args = Array.prototype.slice.call(arguments);
      var value = args.shift();
      if(typeof value !== "string") {
        throw new TypeError("First argument must be of type string.");
      }
      if(args.length === 0 || args.length % 2 !== 0) {
        throw new ValueError("ReplaceExpression got wrong number of args.");
      }
      args.reverse();
      var i = 2;
      while(args.length > 0) {
        var regexp = args.pop();
        if(regexp instanceof RegExp) {
          regexp = regexp.source
        }
        var replace_str = args.pop();
        try {
          regexp = new RegExp(regexp, "gi")
        }catch(e) {
          throw new ValueError("Cannot create RegExp for " + regexp);
        }
        i += 2;
        value = value.replace(regexp, replace_str)
      }
      return value
    }, trim:function(value) {
      if(typeof value == "string") {
        value = value.replace(/\s+/gi, " ");
        value = value.replace(/^\s/i, "").replace(/\s$/i, "")
      }
      return value
    }, url:function() {
      var doc = this.doc;
      try {
        var url = doc.location.href;
        return url
      }catch(e) {
        throw new InterpreterError("'doc' has no property 'location.href'.");
      }
    }, urlParam:function(param_name) {
      var doc = this.doc;
      var url;
      try {
        url = doc.location.href
      }catch(e) {
        throw new InterpreterError("'doc' has no property 'location.href'.");
      }
      var qs = url.slice(url.indexOf("?") + 1).split("&");
      var vars = {};
      for(var i = 0, l = qs.length;i < l;i++) {
        var pair = qs[i].split("=");
        vars[pair[0]] = pair[1]
      }
      return vars[param_name]
    }, version:function() {
      if(com.ciuvo.csl.parser) {
        return com.ciuvo.csl.parser.VERSION
      }else {
        return undefined
      }
    }, at_least_version:function(value) {
      if(!com.ciuvo.csl.parser) {
        throw new InterpreterError("CSL Parser not in namespace. ");
      }
      function parseVersionString(str) {
        if(typeof str != "string") {
          return false
        }
        var x = str.split(".");
        var maj = parseInt(x[0], 10) || 0;
        var min = parseInt(x[1], 10) || 0;
        var pat = parseInt(x[2], 10) || 0;
        return{major:maj, minor:min, patch:pat}
      }
      var given_version = parseVersionString(value);
      var running_version = parseVersionString(com.ciuvo.csl.parser.VERSION);
      if(running_version.major != given_version.major) {
        return running_version.major > given_version.major
      }else {
        if(running_version.minor != given_version.minor) {
          return running_version.minor > given_version.minor
        }else {
          if(running_version.patch != given_version.patch) {
            return running_version.patch > given_version.patch
          }else {
            return true
          }
        }
      }
    }, wait:function(delay) {
      var self = this;
      if(!("wait_token" in this.temp)) {
        delay = parseInt(delay, 10);
        if(delay < 0) {
          throw new ValueError("Delay must be larger than 0.");
        }
        window.setTimeout(function() {
          self.temp.wait_token = null;
          self.interpretNext()
        }, delay);
        throw new InterruptException;
      }
      delete this.temp.wait_token
    }, xpath:function(value) {
      var doc = this.doc;
      if(!("evaluate" in doc)) {
        throw new InterpreterError("DOM doc object has no 'evaluate' function.");
      }
      var xresult = null;
      try {
        xresult = doc.evaluate(value, doc, null, 2, null)
      }catch(e) {
        throw new InterpreterError(e);
      }
      if(xresult) {
        return xresult.stringValue
      }else {
        return""
      }
    }};
    return{TypeError:TypeError, ValueError:ValueError, InterruptException:InterruptException, Interpreter:Interpreter}
  }();
  com.ciuvo.csl.parser = function() {
    var result = {parse:function(input, startRule) {
      var parseFunctions = {"Accessor":parse_Accessor, "AccessorExpression":parse_AccessorExpression, "AdditiveExpression":parse_AdditiveExpression, "AdditiveOperator":parse_AdditiveOperator, "AndToken":parse_AndToken, "ArrayLiteral":parse_ArrayLiteral, "AssignmentOperator":parse_AssignmentOperator, "AssignmentStatement":parse_AssignmentStatement, "Block":parse_Block, "BooleanLiteral":parse_BooleanLiteral, "BreakToken":parse_BreakToken, "CallExpression":parse_CallExpression, "CharacterEscapeSequence":parse_CharacterEscapeSequence,
      "Comment":parse_Comment, "DecimalDigit":parse_DecimalDigit, "DecimalDigits":parse_DecimalDigits, "DecimalIntegerLiteral":parse_DecimalIntegerLiteral, "DecimalLiteral":parse_DecimalLiteral, "DoubleStringCharacter":parse_DoubleStringCharacter, "DoubleStringCharacters":parse_DoubleStringCharacters, "EOF":parse_EOF, "EOS":parse_EOS, "ElseToken":parse_ElseToken, "EmptyStatement":parse_EmptyStatement, "EqualsExpression":parse_EqualsExpression, "EqualsToken":parse_EqualsToken, "EscapeCharacter":parse_EscapeCharacter,
      "EscapeSequence":parse_EscapeSequence, "ExponentIndicator":parse_ExponentIndicator, "ExponentPart":parse_ExponentPart, "Expression":parse_Expression, "ExpressionList":parse_ExpressionList, "FalseToken":parse_FalseToken, "ForInStatement":parse_ForInStatement, "ForToken":parse_ForToken, "FunctionName":parse_FunctionName, "HexDigit":parse_HexDigit, "HexEscapeSequence":parse_HexEscapeSequence, "HexIntegerLiteral":parse_HexIntegerLiteral, "IdentifierStart":parse_IdentifierStart, "IfStatement":parse_IfStatement,
      "IfToken":parse_IfToken, "InToken":parse_InToken, "LineContinuation":parse_LineContinuation, "LineTerminator":parse_LineTerminator, "LineTerminatorSequence":parse_LineTerminatorSequence, "Literal":parse_Literal, "LogicalANDExpression":parse_LogicalANDExpression, "LogicalORExpression":parse_LogicalORExpression, "MultiLineComment":parse_MultiLineComment, "MultiLineCommentNoLineTerminator":parse_MultiLineCommentNoLineTerminator, "MultiplicativeExpression":parse_MultiplicativeExpression, "MultiplicativeOperator":parse_MultiplicativeOperator,
      "NonEscapeCharacter":parse_NonEscapeCharacter, "NonZeroDigit":parse_NonZeroDigit, "NotToken":parse_NotToken, "NullLiteral":parse_NullLiteral, "NullToken":parse_NullToken, "NumericLiteral":parse_NumericLiteral, "OrToken":parse_OrToken, "Program":parse_Program, "RegularExpressionLiteral":parse_RegularExpressionLiteral, "RegularExpressionLiteralCharacter":parse_RegularExpressionLiteralCharacter, "RegularExpressionLiteralCharacters":parse_RegularExpressionLiteralCharacters, "RelationalExpression":parse_RelationalExpression,
      "RelationalOperator":parse_RelationalOperator, "RequireStatement":parse_RequireStatement, "RequireToken":parse_RequireToken, "ReturnStatement":parse_ReturnStatement, "ReturnToken":parse_ReturnToken, "SignedInteger":parse_SignedInteger, "SingleEscapeCharacter":parse_SingleEscapeCharacter, "SingleLineComment":parse_SingleLineComment, "SingleStringCharacter":parse_SingleStringCharacter, "SingleStringCharacters":parse_SingleStringCharacters, "SourceCharacter":parse_SourceCharacter, "Statement":parse_Statement,
      "StatementExpression":parse_StatementExpression, "StatementList":parse_StatementList, "Statements":parse_Statements, "StringLiteral":parse_StringLiteral, "TrueToken":parse_TrueToken, "UnaryExpression":parse_UnaryExpression, "UnaryOperator":parse_UnaryOperator, "UnicodeEscapeSequence":parse_UnicodeEscapeSequence, "VariableExpression":parse_VariableExpression, "VariableExpressionList":parse_VariableExpressionList, "WhiteSpace":parse_WhiteSpace, "Zs":parse_Zs, "_":parse__, "__":parse___, "start":parse_start};
      if(startRule !== undefined) {
        if(parseFunctions[startRule] === undefined) {
          throw new Error("Invalid rule name: " + quote(startRule) + ".");
        }
      }else {
        startRule = "start"
      }
      var pos = 0;
      var reportMatchFailures = true;
      var rightmostMatchFailuresPos = 0;
      var rightmostMatchFailuresExpected = [];
      var cache = {};
      function padLeft(input, padding, length) {
        var result = input;
        var padLength = length - input.length;
        for(var i = 0;i < padLength;i++) {
          result = padding + result
        }
        return result
      }
      function escape(ch) {
        var charCode = ch.charCodeAt(0);
        if(charCode <= 255) {
          var escapeChar = "x";
          var length = 2
        }else {
          var escapeChar = "u";
          var length = 4
        }
        return"\\" + escapeChar + padLeft(charCode.toString(16).toUpperCase(), "0", length)
      }
      function quote(s) {
        return'"' + s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\r/g, "\\r").replace(/\n/g, "\\n").replace(/[\x80-\uFFFF]/g, escape) + '"'
      }
      function matchFailed(failure) {
        if(pos < rightmostMatchFailuresPos) {
          return
        }
        if(pos > rightmostMatchFailuresPos) {
          rightmostMatchFailuresPos = pos;
          rightmostMatchFailuresExpected = []
        }
        rightmostMatchFailuresExpected.push(failure)
      }
      function parse_start() {
        var cacheKey = "start@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse___();
        if(result3 !== null) {
          var result4 = parse_Program();
          if(result4 !== null) {
            var result5 = parse___();
            if(result5 !== null) {
              var result1 = [result3, result4, result5]
            }else {
              var result1 = null;
              pos = savedPos1
            }
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(program) {
          return program
        }(result1[1]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_SourceCharacter() {
        var cacheKey = "SourceCharacter@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.length > pos) {
          var result0 = input.charAt(pos);
          pos++
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed("any character")
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_WhiteSpace() {
        var cacheKey = "WhiteSpace@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        if(input.substr(pos).match(/^[\t\x0B\f \xA0\uFEFF]/) !== null) {
          var result2 = input.charAt(pos);
          pos++
        }else {
          var result2 = null;
          if(reportMatchFailures) {
            matchFailed("[\t\x0B\f \\xA0\\uFEFF]")
          }
        }
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result1 = parse_Zs();
          if(result1 !== null) {
            var result0 = result1
          }else {
            var result0 = null
          }
        }
        reportMatchFailures = savedReportMatchFailures;
        if(reportMatchFailures && result0 === null) {
          matchFailed("whitespace")
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_LineTerminator() {
        var cacheKey = "LineTerminator@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos).match(/^[\n\r\u2028\u2029]/) !== null) {
          var result0 = input.charAt(pos);
          pos++
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed("[\\n\\r\\u2028\\u2029]")
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_LineTerminatorSequence() {
        var cacheKey = "LineTerminatorSequence@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        if(input.substr(pos, 1) === "\n") {
          var result5 = "\n";
          pos += 1
        }else {
          var result5 = null;
          if(reportMatchFailures) {
            matchFailed('"\\n"')
          }
        }
        if(result5 !== null) {
          var result0 = result5
        }else {
          if(input.substr(pos, 2) === "\r\n") {
            var result4 = "\r\n";
            pos += 2
          }else {
            var result4 = null;
            if(reportMatchFailures) {
              matchFailed('"\\r\\n"')
            }
          }
          if(result4 !== null) {
            var result0 = result4
          }else {
            if(input.substr(pos, 1) === "\r") {
              var result3 = "\r";
              pos += 1
            }else {
              var result3 = null;
              if(reportMatchFailures) {
                matchFailed('"\\r"')
              }
            }
            if(result3 !== null) {
              var result0 = result3
            }else {
              if(input.substr(pos, 1) === "\u2028") {
                var result2 = "\u2028";
                pos += 1
              }else {
                var result2 = null;
                if(reportMatchFailures) {
                  matchFailed('"\\u2028"')
                }
              }
              if(result2 !== null) {
                var result0 = result2
              }else {
                if(input.substr(pos, 1) === "\u2029") {
                  var result1 = "\u2029";
                  pos += 1
                }else {
                  var result1 = null;
                  if(reportMatchFailures) {
                    matchFailed('"\\u2029"')
                  }
                }
                if(result1 !== null) {
                  var result0 = result1
                }else {
                  var result0 = null
                }
              }
            }
          }
        }
        reportMatchFailures = savedReportMatchFailures;
        if(reportMatchFailures && result0 === null) {
          matchFailed("end of line")
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_Comment() {
        var cacheKey = "Comment@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var result2 = parse_MultiLineComment();
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result1 = parse_SingleLineComment();
          if(result1 !== null) {
            var result0 = result1
          }else {
            var result0 = null
          }
        }
        reportMatchFailures = savedReportMatchFailures;
        if(reportMatchFailures && result0 === null) {
          matchFailed("comment")
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_MultiLineComment() {
        var cacheKey = "MultiLineComment@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        if(input.substr(pos, 2) === "/*") {
          var result1 = "/*";
          pos += 2
        }else {
          var result1 = null;
          if(reportMatchFailures) {
            matchFailed('"/*"')
          }
        }
        if(result1 !== null) {
          var result2 = [];
          var savedPos1 = pos;
          var savedPos2 = pos;
          var savedReportMatchFailuresVar0 = reportMatchFailures;
          reportMatchFailures = false;
          if(input.substr(pos, 2) === "*/") {
            var result7 = "*/";
            pos += 2
          }else {
            var result7 = null;
            if(reportMatchFailures) {
              matchFailed('"*/"')
            }
          }
          reportMatchFailures = savedReportMatchFailuresVar0;
          if(result7 === null) {
            var result5 = ""
          }else {
            var result5 = null;
            pos = savedPos2
          }
          if(result5 !== null) {
            var result6 = parse_SourceCharacter();
            if(result6 !== null) {
              var result4 = [result5, result6]
            }else {
              var result4 = null;
              pos = savedPos1
            }
          }else {
            var result4 = null;
            pos = savedPos1
          }
          while(result4 !== null) {
            result2.push(result4);
            var savedPos1 = pos;
            var savedPos2 = pos;
            var savedReportMatchFailuresVar0 = reportMatchFailures;
            reportMatchFailures = false;
            if(input.substr(pos, 2) === "*/") {
              var result7 = "*/";
              pos += 2
            }else {
              var result7 = null;
              if(reportMatchFailures) {
                matchFailed('"*/"')
              }
            }
            reportMatchFailures = savedReportMatchFailuresVar0;
            if(result7 === null) {
              var result5 = ""
            }else {
              var result5 = null;
              pos = savedPos2
            }
            if(result5 !== null) {
              var result6 = parse_SourceCharacter();
              if(result6 !== null) {
                var result4 = [result5, result6]
              }else {
                var result4 = null;
                pos = savedPos1
              }
            }else {
              var result4 = null;
              pos = savedPos1
            }
          }
          if(result2 !== null) {
            if(input.substr(pos, 2) === "*/") {
              var result3 = "*/";
              pos += 2
            }else {
              var result3 = null;
              if(reportMatchFailures) {
                matchFailed('"*/"')
              }
            }
            if(result3 !== null) {
              var result0 = [result1, result2, result3]
            }else {
              var result0 = null;
              pos = savedPos0
            }
          }else {
            var result0 = null;
            pos = savedPos0
          }
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_MultiLineCommentNoLineTerminator() {
        var cacheKey = "MultiLineCommentNoLineTerminator@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        if(input.substr(pos, 2) === "/*") {
          var result1 = "/*";
          pos += 2
        }else {
          var result1 = null;
          if(reportMatchFailures) {
            matchFailed('"/*"')
          }
        }
        if(result1 !== null) {
          var result2 = [];
          var savedPos1 = pos;
          var savedPos2 = pos;
          var savedReportMatchFailuresVar0 = reportMatchFailures;
          reportMatchFailures = false;
          if(input.substr(pos, 2) === "*/") {
            var result9 = "*/";
            pos += 2
          }else {
            var result9 = null;
            if(reportMatchFailures) {
              matchFailed('"*/"')
            }
          }
          if(result9 !== null) {
            var result7 = result9
          }else {
            var result8 = parse_LineTerminator();
            if(result8 !== null) {
              var result7 = result8
            }else {
              var result7 = null
            }
          }
          reportMatchFailures = savedReportMatchFailuresVar0;
          if(result7 === null) {
            var result5 = ""
          }else {
            var result5 = null;
            pos = savedPos2
          }
          if(result5 !== null) {
            var result6 = parse_SourceCharacter();
            if(result6 !== null) {
              var result4 = [result5, result6]
            }else {
              var result4 = null;
              pos = savedPos1
            }
          }else {
            var result4 = null;
            pos = savedPos1
          }
          while(result4 !== null) {
            result2.push(result4);
            var savedPos1 = pos;
            var savedPos2 = pos;
            var savedReportMatchFailuresVar0 = reportMatchFailures;
            reportMatchFailures = false;
            if(input.substr(pos, 2) === "*/") {
              var result9 = "*/";
              pos += 2
            }else {
              var result9 = null;
              if(reportMatchFailures) {
                matchFailed('"*/"')
              }
            }
            if(result9 !== null) {
              var result7 = result9
            }else {
              var result8 = parse_LineTerminator();
              if(result8 !== null) {
                var result7 = result8
              }else {
                var result7 = null
              }
            }
            reportMatchFailures = savedReportMatchFailuresVar0;
            if(result7 === null) {
              var result5 = ""
            }else {
              var result5 = null;
              pos = savedPos2
            }
            if(result5 !== null) {
              var result6 = parse_SourceCharacter();
              if(result6 !== null) {
                var result4 = [result5, result6]
              }else {
                var result4 = null;
                pos = savedPos1
              }
            }else {
              var result4 = null;
              pos = savedPos1
            }
          }
          if(result2 !== null) {
            if(input.substr(pos, 2) === "*/") {
              var result3 = "*/";
              pos += 2
            }else {
              var result3 = null;
              if(reportMatchFailures) {
                matchFailed('"*/"')
              }
            }
            if(result3 !== null) {
              var result0 = [result1, result2, result3]
            }else {
              var result0 = null;
              pos = savedPos0
            }
          }else {
            var result0 = null;
            pos = savedPos0
          }
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_SingleLineComment() {
        var cacheKey = "SingleLineComment@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        if(input.substr(pos, 2) === "//") {
          var result1 = "//";
          pos += 2
        }else {
          var result1 = null;
          if(reportMatchFailures) {
            matchFailed('"//"')
          }
        }
        if(result1 !== null) {
          var result2 = [];
          var savedPos1 = pos;
          var savedPos2 = pos;
          var savedReportMatchFailuresVar0 = reportMatchFailures;
          reportMatchFailures = false;
          var result6 = parse_LineTerminator();
          reportMatchFailures = savedReportMatchFailuresVar0;
          if(result6 === null) {
            var result4 = ""
          }else {
            var result4 = null;
            pos = savedPos2
          }
          if(result4 !== null) {
            var result5 = parse_SourceCharacter();
            if(result5 !== null) {
              var result3 = [result4, result5]
            }else {
              var result3 = null;
              pos = savedPos1
            }
          }else {
            var result3 = null;
            pos = savedPos1
          }
          while(result3 !== null) {
            result2.push(result3);
            var savedPos1 = pos;
            var savedPos2 = pos;
            var savedReportMatchFailuresVar0 = reportMatchFailures;
            reportMatchFailures = false;
            var result6 = parse_LineTerminator();
            reportMatchFailures = savedReportMatchFailuresVar0;
            if(result6 === null) {
              var result4 = ""
            }else {
              var result4 = null;
              pos = savedPos2
            }
            if(result4 !== null) {
              var result5 = parse_SourceCharacter();
              if(result5 !== null) {
                var result3 = [result4, result5]
              }else {
                var result3 = null;
                pos = savedPos1
              }
            }else {
              var result3 = null;
              pos = savedPos1
            }
          }
          if(result2 !== null) {
            var result0 = [result1, result2]
          }else {
            var result0 = null;
            pos = savedPos0
          }
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_IdentifierStart() {
        var cacheKey = "IdentifierStart@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 1) === "$") {
          var result0 = "$";
          pos += 1
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed('"$"')
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_Zs() {
        var cacheKey = "Zs@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos).match(/^[ \xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000]/) !== null) {
          var result0 = input.charAt(pos);
          pos++
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed("[ \\xA0\\u1680\\u180E\\u2000\\u2001\\u2002\\u2003\\u2004\\u2005\\u2006\\u2007\\u2008\\u2009\\u200A\\u202F\\u205F\\u3000]")
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_EOS() {
        var cacheKey = "EOS@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos3 = pos;
        var result9 = parse__();
        if(result9 !== null) {
          var result10 = parse_LineTerminatorSequence();
          if(result10 !== null) {
            var result8 = [result9, result10]
          }else {
            var result8 = null;
            pos = savedPos3
          }
        }else {
          var result8 = null;
          pos = savedPos3
        }
        if(result8 !== null) {
          var result0 = result8
        }else {
          var savedPos1 = pos;
          var result5 = parse__();
          if(result5 !== null) {
            var savedPos2 = pos;
            var savedReportMatchFailuresVar0 = reportMatchFailures;
            reportMatchFailures = false;
            if(input.substr(pos, 1) === "}") {
              var result7 = "}";
              pos += 1
            }else {
              var result7 = null;
              if(reportMatchFailures) {
                matchFailed('"}"')
              }
            }
            reportMatchFailures = savedReportMatchFailuresVar0;
            if(result7 !== null) {
              var result6 = "";
              pos = savedPos2
            }else {
              var result6 = null
            }
            if(result6 !== null) {
              var result4 = [result5, result6]
            }else {
              var result4 = null;
              pos = savedPos1
            }
          }else {
            var result4 = null;
            pos = savedPos1
          }
          if(result4 !== null) {
            var result0 = result4
          }else {
            var savedPos0 = pos;
            var result2 = parse___();
            if(result2 !== null) {
              var result3 = parse_EOF();
              if(result3 !== null) {
                var result1 = [result2, result3]
              }else {
                var result1 = null;
                pos = savedPos0
              }
            }else {
              var result1 = null;
              pos = savedPos0
            }
            if(result1 !== null) {
              var result0 = result1
            }else {
              var result0 = null
            }
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_EOF() {
        var cacheKey = "EOF@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedReportMatchFailuresVar0 = reportMatchFailures;
        reportMatchFailures = false;
        if(input.length > pos) {
          var result1 = input.charAt(pos);
          pos++
        }else {
          var result1 = null;
          if(reportMatchFailures) {
            matchFailed("any character")
          }
        }
        reportMatchFailures = savedReportMatchFailuresVar0;
        if(result1 === null) {
          var result0 = ""
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse__() {
        var cacheKey = "_@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var result0 = [];
        var result4 = parse_WhiteSpace();
        if(result4 !== null) {
          var result1 = result4
        }else {
          var result3 = parse_MultiLineCommentNoLineTerminator();
          if(result3 !== null) {
            var result1 = result3
          }else {
            var result2 = parse_SingleLineComment();
            if(result2 !== null) {
              var result1 = result2
            }else {
              var result1 = null
            }
          }
        }
        while(result1 !== null) {
          result0.push(result1);
          var result4 = parse_WhiteSpace();
          if(result4 !== null) {
            var result1 = result4
          }else {
            var result3 = parse_MultiLineCommentNoLineTerminator();
            if(result3 !== null) {
              var result1 = result3
            }else {
              var result2 = parse_SingleLineComment();
              if(result2 !== null) {
                var result1 = result2
              }else {
                var result1 = null
              }
            }
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse___() {
        var cacheKey = "__@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var result0 = [];
        var result4 = parse_WhiteSpace();
        if(result4 !== null) {
          var result1 = result4
        }else {
          var result3 = parse_LineTerminatorSequence();
          if(result3 !== null) {
            var result1 = result3
          }else {
            var result2 = parse_Comment();
            if(result2 !== null) {
              var result1 = result2
            }else {
              var result1 = null
            }
          }
        }
        while(result1 !== null) {
          result0.push(result1);
          var result4 = parse_WhiteSpace();
          if(result4 !== null) {
            var result1 = result4
          }else {
            var result3 = parse_LineTerminatorSequence();
            if(result3 !== null) {
              var result1 = result3
            }else {
              var result2 = parse_Comment();
              if(result2 !== null) {
                var result1 = result2
              }else {
                var result1 = null
              }
            }
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_Statement() {
        var cacheKey = "Statement@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var result6 = parse_AssignmentStatement();
        if(result6 !== null) {
          var result0 = result6
        }else {
          var result5 = parse_ForInStatement();
          if(result5 !== null) {
            var result0 = result5
          }else {
            var result4 = parse_IfStatement();
            if(result4 !== null) {
              var result0 = result4
            }else {
              var result3 = parse_RequireStatement();
              if(result3 !== null) {
                var result0 = result3
              }else {
                var result2 = parse_StatementExpression();
                if(result2 !== null) {
                  var result0 = result2
                }else {
                  var result1 = parse_EmptyStatement();
                  if(result1 !== null) {
                    var result0 = result1
                  }else {
                    var result0 = null
                  }
                }
              }
            }
          }
        }
        reportMatchFailures = savedReportMatchFailures;
        if(reportMatchFailures && result0 === null) {
          matchFailed("Statement")
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_AssignmentStatement() {
        var cacheKey = "AssignmentStatement@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_VariableExpression();
        if(result3 !== null) {
          var result4 = parse___();
          if(result4 !== null) {
            var result11 = parse_Accessor();
            var result5 = result11 !== null ? result11 : "";
            if(result5 !== null) {
              var result6 = parse___();
              if(result6 !== null) {
                var result7 = parse_AssignmentOperator();
                if(result7 !== null) {
                  var result8 = parse___();
                  if(result8 !== null) {
                    var result9 = parse_LogicalORExpression();
                    if(result9 !== null) {
                      var result10 = parse_EOS();
                      if(result10 !== null) {
                        var result1 = [result3, result4, result5, result6, result7, result8, result9, result10]
                      }else {
                        var result1 = null;
                        pos = savedPos1
                      }
                    }else {
                      var result1 = null;
                      pos = savedPos1
                    }
                  }else {
                    var result1 = null;
                    pos = savedPos1
                  }
                }else {
                  var result1 = null;
                  pos = savedPos1
                }
              }else {
                var result1 = null;
                pos = savedPos1
              }
            }else {
              var result1 = null;
              pos = savedPos1
            }
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(variable, accessor, operator, value) {
          return{type:"AssignmentStatement", variable:variable, accessor:accessor, operator:operator, value:value, interpret:function(interpreter) {
            var value = this.value.interpret(interpreter);
            if(this.operator != "=") {
              var var_value = this.variable.interpret(interpreter);
              value = binaryOperator(var_value, this.operator.substring(0, 1), value)
            }
            if(this.accessor != "") {
              var index = accessor.interpret(interpreter);
              var var_value = this.variable.interpret(interpreter);
              index = absolute_index(index, var_value);
              interpreter.variables[this.variable.identifier][index] = value
            }else {
              interpreter.variables[this.variable.identifier] = value
            }
          }, accept:function(visitor) {
            visitor.visitAssignmentStatement(this)
          }}
        }(result1[0], result1[2], result1[4], result1[6]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        reportMatchFailures = savedReportMatchFailures;
        if(reportMatchFailures && result0 === null) {
          matchFailed("Assignment Statement")
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_AssignmentOperator() {
        var cacheKey = "AssignmentOperator@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        if(input.substr(pos, 1) === "=") {
          var result9 = "=";
          pos += 1
        }else {
          var result9 = null;
          if(reportMatchFailures) {
            matchFailed('"="')
          }
        }
        if(result9 !== null) {
          var savedPos2 = pos;
          var savedReportMatchFailuresVar0 = reportMatchFailures;
          reportMatchFailures = false;
          if(input.substr(pos, 1) === "=") {
            var result11 = "=";
            pos += 1
          }else {
            var result11 = null;
            if(reportMatchFailures) {
              matchFailed('"="')
            }
          }
          reportMatchFailures = savedReportMatchFailuresVar0;
          if(result11 === null) {
            var result10 = ""
          }else {
            var result10 = null;
            pos = savedPos2
          }
          if(result10 !== null) {
            var result7 = [result9, result10]
          }else {
            var result7 = null;
            pos = savedPos1
          }
        }else {
          var result7 = null;
          pos = savedPos1
        }
        var result8 = result7 !== null ? function() {
          return"="
        }() : null;
        if(result8 !== null) {
          var result6 = result8
        }else {
          var result6 = null;
          pos = savedPos0
        }
        if(result6 !== null) {
          var result0 = result6
        }else {
          if(input.substr(pos, 2) === "*=") {
            var result5 = "*=";
            pos += 2
          }else {
            var result5 = null;
            if(reportMatchFailures) {
              matchFailed('"*="')
            }
          }
          if(result5 !== null) {
            var result0 = result5
          }else {
            if(input.substr(pos, 2) === "/=") {
              var result4 = "/=";
              pos += 2
            }else {
              var result4 = null;
              if(reportMatchFailures) {
                matchFailed('"/="')
              }
            }
            if(result4 !== null) {
              var result0 = result4
            }else {
              if(input.substr(pos, 2) === "%=") {
                var result3 = "%=";
                pos += 2
              }else {
                var result3 = null;
                if(reportMatchFailures) {
                  matchFailed('"%="')
                }
              }
              if(result3 !== null) {
                var result0 = result3
              }else {
                if(input.substr(pos, 2) === "+=") {
                  var result2 = "+=";
                  pos += 2
                }else {
                  var result2 = null;
                  if(reportMatchFailures) {
                    matchFailed('"+="')
                  }
                }
                if(result2 !== null) {
                  var result0 = result2
                }else {
                  if(input.substr(pos, 2) === "-=") {
                    var result1 = "-=";
                    pos += 2
                  }else {
                    var result1 = null;
                    if(reportMatchFailures) {
                      matchFailed('"-="')
                    }
                  }
                  if(result1 !== null) {
                    var result0 = result1
                  }else {
                    var result0 = null
                  }
                }
              }
            }
          }
        }
        reportMatchFailures = savedReportMatchFailures;
        if(reportMatchFailures && result0 === null) {
          matchFailed("Assignment Operator")
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_VariableExpression() {
        var cacheKey = "VariableExpression@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_IdentifierStart();
        if(result3 !== null) {
          if(input.substr(pos).match(/^[a-zA-Z0-9_]/) !== null) {
            var result5 = input.charAt(pos);
            pos++
          }else {
            var result5 = null;
            if(reportMatchFailures) {
              matchFailed("[a-zA-Z0-9_]")
            }
          }
          if(result5 !== null) {
            var result4 = [];
            while(result5 !== null) {
              result4.push(result5);
              if(input.substr(pos).match(/^[a-zA-Z0-9_]/) !== null) {
                var result5 = input.charAt(pos);
                pos++
              }else {
                var result5 = null;
                if(reportMatchFailures) {
                  matchFailed("[a-zA-Z0-9_]")
                }
              }
            }
          }else {
            var result4 = null
          }
          if(result4 !== null) {
            var result1 = [result3, result4]
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(start, name) {
          return{type:"VariableExpression", identifier:start + name.join(""), interpret:function(interpreter) {
            if(!(this.identifier in interpreter.variables)) {
              throw new interpreter.InterpreterError("Variable " + this.identifier + " not defined.");
            }
            var value = interpreter.variables[this.identifier];
            return value
          }, accept:function(visitor) {
            return visitor.visitVariableExpression(this)
          }}
        }(result1[0], result1[1]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_VariableExpressionList() {
        var cacheKey = "VariableExpressionList@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_VariableExpression();
        if(result3 !== null) {
          var result4 = [];
          var savedPos2 = pos;
          var result6 = parse___();
          if(result6 !== null) {
            if(input.substr(pos, 1) === ",") {
              var result7 = ",";
              pos += 1
            }else {
              var result7 = null;
              if(reportMatchFailures) {
                matchFailed('","')
              }
            }
            if(result7 !== null) {
              var result8 = parse___();
              if(result8 !== null) {
                var result9 = parse_VariableExpression();
                if(result9 !== null) {
                  var result5 = [result6, result7, result8, result9]
                }else {
                  var result5 = null;
                  pos = savedPos2
                }
              }else {
                var result5 = null;
                pos = savedPos2
              }
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }else {
            var result5 = null;
            pos = savedPos2
          }
          while(result5 !== null) {
            result4.push(result5);
            var savedPos2 = pos;
            var result6 = parse___();
            if(result6 !== null) {
              if(input.substr(pos, 1) === ",") {
                var result7 = ",";
                pos += 1
              }else {
                var result7 = null;
                if(reportMatchFailures) {
                  matchFailed('","')
                }
              }
              if(result7 !== null) {
                var result8 = parse___();
                if(result8 !== null) {
                  var result9 = parse_VariableExpression();
                  if(result9 !== null) {
                    var result5 = [result6, result7, result8, result9]
                  }else {
                    var result5 = null;
                    pos = savedPos2
                  }
                }else {
                  var result5 = null;
                  pos = savedPos2
                }
              }else {
                var result5 = null;
                pos = savedPos2
              }
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }
          if(result4 !== null) {
            var result1 = [result3, result4]
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(head, tail) {
          var vars = [head];
          for(var i = 0;i < tail.length;i++) {
            vars.push(tail[i][3])
          }
          return vars
        }(result1[0], result1[1]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_StatementExpression() {
        var cacheKey = "StatementExpression@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var result1 = parse_CallExpression();
        var result2 = result1 !== null ? function(expr) {
          return{type:"StatementExpression", expr:expr, interpret:function(interpreter) {
            this.expr.interpret(interpreter)
          }, accept:function(visitor) {
            return visitor.visitStatementExpression(this)
          }}
        }(result1) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_Block() {
        var cacheKey = "Block@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        if(input.substr(pos, 1) === "{") {
          var result3 = "{";
          pos += 1
        }else {
          var result3 = null;
          if(reportMatchFailures) {
            matchFailed('"{"')
          }
        }
        if(result3 !== null) {
          var result4 = parse___();
          if(result4 !== null) {
            var savedPos2 = pos;
            var result8 = parse_StatementList();
            if(result8 !== null) {
              var result9 = parse___();
              if(result9 !== null) {
                var result7 = [result8, result9]
              }else {
                var result7 = null;
                pos = savedPos2
              }
            }else {
              var result7 = null;
              pos = savedPos2
            }
            var result5 = result7 !== null ? result7 : "";
            if(result5 !== null) {
              if(input.substr(pos, 1) === "}") {
                var result6 = "}";
                pos += 1
              }else {
                var result6 = null;
                if(reportMatchFailures) {
                  matchFailed('"}"')
                }
              }
              if(result6 !== null) {
                var result1 = [result3, result4, result5, result6]
              }else {
                var result1 = null;
                pos = savedPos1
              }
            }else {
              var result1 = null;
              pos = savedPos1
            }
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(statements) {
          return{type:"Block", statements:statements !== "" ? statements[0] : [], interpret:function(interpreter) {
            for(var i = this.statements.length - 1;i >= 0;i--) {
              interpreter.stmt_stack.push(this.statements[i])
            }
          }, accept:function(visitor) {
            visitor.visitBlock(this)
          }}
        }(result1[2]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        reportMatchFailures = savedReportMatchFailures;
        if(reportMatchFailures && result0 === null) {
          matchFailed("Block")
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_StatementList() {
        var cacheKey = "StatementList@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_Statement();
        if(result3 !== null) {
          var result4 = [];
          var savedPos2 = pos;
          var result6 = parse___();
          if(result6 !== null) {
            var result7 = parse_Statement();
            if(result7 !== null) {
              var result5 = [result6, result7]
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }else {
            var result5 = null;
            pos = savedPos2
          }
          while(result5 !== null) {
            result4.push(result5);
            var savedPos2 = pos;
            var result6 = parse___();
            if(result6 !== null) {
              var result7 = parse_Statement();
              if(result7 !== null) {
                var result5 = [result6, result7]
              }else {
                var result5 = null;
                pos = savedPos2
              }
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }
          if(result4 !== null) {
            var result1 = [result3, result4]
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(head, tail) {
          var result = [head];
          for(var i = 0;i < tail.length;i++) {
            result.push(tail[i][1])
          }
          return result
        }(result1[0], result1[1]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_EmptyStatement() {
        var cacheKey = "EmptyStatement@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        if(input.substr(pos, 1) === ";") {
          var result1 = ";";
          pos += 1
        }else {
          var result1 = null;
          if(reportMatchFailures) {
            matchFailed('";"')
          }
        }
        var result2 = result1 !== null ? function() {
          return{type:"EmptyStatement", interpret:function(interpreter) {
          }, accept:function(visitor) {
            visitor.visitEmptyStatement(this)
          }}
        }() : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        reportMatchFailures = savedReportMatchFailures;
        if(reportMatchFailures && result0 === null) {
          matchFailed("No-op Statement")
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_ForInStatement() {
        var cacheKey = "ForInStatement@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_ForToken();
        if(result3 !== null) {
          var result4 = parse___();
          if(result4 !== null) {
            if(input.substr(pos, 1) === "(") {
              var result5 = "(";
              pos += 1
            }else {
              var result5 = null;
              if(reportMatchFailures) {
                matchFailed('"("')
              }
            }
            if(result5 !== null) {
              var result6 = parse___();
              if(result6 !== null) {
                var result7 = parse_VariableExpression();
                if(result7 !== null) {
                  var result8 = parse___();
                  if(result8 !== null) {
                    var result9 = parse_InToken();
                    if(result9 !== null) {
                      var result10 = parse___();
                      if(result10 !== null) {
                        var result19 = parse_Expression();
                        if(result19 !== null) {
                          var result11 = result19
                        }else {
                          var result18 = parse_VariableExpression();
                          if(result18 !== null) {
                            var result11 = result18
                          }else {
                            var result11 = null
                          }
                        }
                        if(result11 !== null) {
                          var result12 = parse___();
                          if(result12 !== null) {
                            if(input.substr(pos, 1) === ")") {
                              var result13 = ")";
                              pos += 1
                            }else {
                              var result13 = null;
                              if(reportMatchFailures) {
                                matchFailed('")"')
                              }
                            }
                            if(result13 !== null) {
                              var result14 = parse___();
                              if(result14 !== null) {
                                var result17 = parse_Statement();
                                if(result17 !== null) {
                                  var result15 = result17
                                }else {
                                  var result16 = parse_Block();
                                  if(result16 !== null) {
                                    var result15 = result16
                                  }else {
                                    var result15 = null
                                  }
                                }
                                if(result15 !== null) {
                                  var result1 = [result3, result4, result5, result6, result7, result8, result9, result10, result11, result12, result13, result14, result15]
                                }else {
                                  var result1 = null;
                                  pos = savedPos1
                                }
                              }else {
                                var result1 = null;
                                pos = savedPos1
                              }
                            }else {
                              var result1 = null;
                              pos = savedPos1
                            }
                          }else {
                            var result1 = null;
                            pos = savedPos1
                          }
                        }else {
                          var result1 = null;
                          pos = savedPos1
                        }
                      }else {
                        var result1 = null;
                        pos = savedPos1
                      }
                    }else {
                      var result1 = null;
                      pos = savedPos1
                    }
                  }else {
                    var result1 = null;
                    pos = savedPos1
                  }
                }else {
                  var result1 = null;
                  pos = savedPos1
                }
              }else {
                var result1 = null;
                pos = savedPos1
              }
            }else {
              var result1 = null;
              pos = savedPos1
            }
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(iterator, collection, statement) {
          return{type:"ForInStatement", iterator:iterator, collection:collection, statement:statement, interpret:function(interpreter) {
            var collection = this.collection.interpret(interpreter);
            var statement = this.statement;
            if(!collection.hasOwnProperty("length")) {
              throw new interpreter.InterpreterError("ForIn Loop only on Arrays or Strings.");
            }
            var i = 0;
            var iteratorid = this.iterator.identifier;
            function LoopClosure() {
              this.type = "LoopClosure"
            }
            LoopClosure.prototype.interpret = function(interpreter) {
              if(i < collection.length) {
                interpreter.variables[iteratorid] = collection[i];
                i += 1;
                interpreter.stmt_stack.push(this);
                interpreter.stmt_stack.push(statement)
              }
            };
            interpreter.stmt_stack.push(new LoopClosure)
          }, accept:function(visitor) {
            visitor.visitForInStatement(this)
          }}
        }(result1[4], result1[8], result1[12]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        reportMatchFailures = savedReportMatchFailures;
        if(reportMatchFailures && result0 === null) {
          matchFailed("For-In Loop")
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_IfStatement() {
        var cacheKey = "IfStatement@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_IfToken();
        if(result3 !== null) {
          var result4 = parse___();
          if(result4 !== null) {
            if(input.substr(pos, 1) === "(") {
              var result5 = "(";
              pos += 1
            }else {
              var result5 = null;
              if(reportMatchFailures) {
                matchFailed('"("')
              }
            }
            if(result5 !== null) {
              var result6 = parse___();
              if(result6 !== null) {
                var result7 = parse_LogicalORExpression();
                if(result7 !== null) {
                  var result8 = parse___();
                  if(result8 !== null) {
                    if(input.substr(pos, 1) === ")") {
                      var result9 = ")";
                      pos += 1
                    }else {
                      var result9 = null;
                      if(reportMatchFailures) {
                        matchFailed('")"')
                      }
                    }
                    if(result9 !== null) {
                      var result10 = parse___();
                      if(result10 !== null) {
                        var result21 = parse_Statement();
                        if(result21 !== null) {
                          var result11 = result21
                        }else {
                          var result20 = parse_Block();
                          if(result20 !== null) {
                            var result11 = result20
                          }else {
                            var result11 = null
                          }
                        }
                        if(result11 !== null) {
                          var result12 = parse___();
                          if(result12 !== null) {
                            var savedPos2 = pos;
                            var result15 = parse_ElseToken();
                            if(result15 !== null) {
                              var result16 = parse___();
                              if(result16 !== null) {
                                var result19 = parse_Statement();
                                if(result19 !== null) {
                                  var result17 = result19
                                }else {
                                  var result18 = parse_Block();
                                  if(result18 !== null) {
                                    var result17 = result18
                                  }else {
                                    var result17 = null
                                  }
                                }
                                if(result17 !== null) {
                                  var result14 = [result15, result16, result17]
                                }else {
                                  var result14 = null;
                                  pos = savedPos2
                                }
                              }else {
                                var result14 = null;
                                pos = savedPos2
                              }
                            }else {
                              var result14 = null;
                              pos = savedPos2
                            }
                            var result13 = result14 !== null ? result14 : "";
                            if(result13 !== null) {
                              var result1 = [result3, result4, result5, result6, result7, result8, result9, result10, result11, result12, result13]
                            }else {
                              var result1 = null;
                              pos = savedPos1
                            }
                          }else {
                            var result1 = null;
                            pos = savedPos1
                          }
                        }else {
                          var result1 = null;
                          pos = savedPos1
                        }
                      }else {
                        var result1 = null;
                        pos = savedPos1
                      }
                    }else {
                      var result1 = null;
                      pos = savedPos1
                    }
                  }else {
                    var result1 = null;
                    pos = savedPos1
                  }
                }else {
                  var result1 = null;
                  pos = savedPos1
                }
              }else {
                var result1 = null;
                pos = savedPos1
              }
            }else {
              var result1 = null;
              pos = savedPos1
            }
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(condition, if_statement, else_statement) {
          return{type:"IfStatement", condition:condition, if_statement:if_statement, else_statement:else_statement[2], interpret:function(interpreter) {
            if(this.condition.interpret(interpreter)) {
              interpreter.stmt_stack.push(this.if_statement)
            }else {
              if(this.else_statement) {
                interpreter.stmt_stack.push(this.else_statement)
              }
            }
          }, accept:function(visitor) {
            visitor.visitIfStatement(this)
          }}
        }(result1[4], result1[8], result1[10]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        reportMatchFailures = savedReportMatchFailures;
        if(reportMatchFailures && result0 === null) {
          matchFailed("If Statement")
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_RequireStatement() {
        var cacheKey = "RequireStatement@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_RequireToken();
        if(result3 !== null) {
          var result4 = parse___();
          if(result4 !== null) {
            var result5 = parse_VariableExpressionList();
            if(result5 !== null) {
              var result6 = parse_EOS();
              if(result6 !== null) {
                var result1 = [result3, result4, result5, result6]
              }else {
                var result1 = null;
                pos = savedPos1
              }
            }else {
              var result1 = null;
              pos = savedPos1
            }
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(vars) {
          return{type:"RequireStatement", vars:vars, interpret:function(interpreter) {
            for(var i = 0;i < this.vars.length;i++) {
              var identifier = this.vars[i].identifier;
              var value = this.vars[i].interpret(interpreter);
              if(!value) {
                interpreter.error_callback.call(this, new interpreter.RequireError("Variable " + identifier + " required."));
                while(interpreter.stmt_stack.length > 0) {
                  interpreter.stmt_stack.pop()
                }
                interpreter.ret = undefined;
                break
              }
            }
          }, accept:function(visitor) {
            visitor.visitRequireStatement(this)
          }}
        }(result1[2]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        reportMatchFailures = savedReportMatchFailures;
        if(reportMatchFailures && result0 === null) {
          matchFailed("Require Statement")
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_ReturnStatement() {
        var cacheKey = "ReturnStatement@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_ReturnToken();
        if(result3 !== null) {
          var result4 = parse___();
          if(result4 !== null) {
            var result5 = parse_VariableExpressionList();
            if(result5 !== null) {
              var result6 = parse_EOS();
              if(result6 !== null) {
                var result1 = [result3, result4, result5, result6]
              }else {
                var result1 = null;
                pos = savedPos1
              }
            }else {
              var result1 = null;
              pos = savedPos1
            }
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(vars) {
          return{type:"ReturnStatement", vars:vars, interpret:function(interpreter) {
            var different = false;
            var var_identifiers = {};
            var i = this.vars.length - 1;
            while(i >= 0) {
              var_identifiers[this.vars[i].identifier] = true;
              i = i - 1
            }
            if(interpreter.ret === undefined) {
              interpreter.ret = {}
            }
            var i = this.vars.length - 1;
            while(i >= 0) {
              var variable = this.vars[i];
              var value = variable.interpret(interpreter);
              var identifier = variable.identifier.substring(1);
              if(!(identifier in interpreter.ret && compare(interpreter.ret[identifier], value))) {
                different = true;
                interpreter.ret[identifier] = value
              }
              i = i - 1
            }
            var n_vars_ret = 0;
            for(var prop in interpreter.ret) {
              n_vars_ret += 1
            }
            var n_vars = 0;
            for(var prop in var_identifiers) {
              n_vars += 1
            }
            if(n_vars != n_vars_ret) {
              different = true
            }
            if(different) {
              interpreter.return_callback.call(interpreter.return_callback, interpreter.ret)
            }else {
            }
          }, accept:function(visitor) {
            visitor.visitReturnStatement(this)
          }}
        }(result1[2]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        reportMatchFailures = savedReportMatchFailures;
        if(reportMatchFailures && result0 === null) {
          matchFailed("Return Statement")
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_Expression() {
        var cacheKey = "Expression@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var result11 = parse_CallExpression();
        if(result11 !== null) {
          var result0 = result11
        }else {
          var result10 = parse_VariableExpression();
          if(result10 !== null) {
            var result0 = result10
          }else {
            var result9 = parse_Literal();
            if(result9 !== null) {
              var result0 = result9
            }else {
              var savedPos0 = pos;
              var savedPos1 = pos;
              if(input.substr(pos, 1) === "(") {
                var result4 = "(";
                pos += 1
              }else {
                var result4 = null;
                if(reportMatchFailures) {
                  matchFailed('"("')
                }
              }
              if(result4 !== null) {
                var result5 = parse___();
                if(result5 !== null) {
                  var result6 = parse_LogicalORExpression();
                  if(result6 !== null) {
                    var result7 = parse___();
                    if(result7 !== null) {
                      if(input.substr(pos, 1) === ")") {
                        var result8 = ")";
                        pos += 1
                      }else {
                        var result8 = null;
                        if(reportMatchFailures) {
                          matchFailed('")"')
                        }
                      }
                      if(result8 !== null) {
                        var result2 = [result4, result5, result6, result7, result8]
                      }else {
                        var result2 = null;
                        pos = savedPos1
                      }
                    }else {
                      var result2 = null;
                      pos = savedPos1
                    }
                  }else {
                    var result2 = null;
                    pos = savedPos1
                  }
                }else {
                  var result2 = null;
                  pos = savedPos1
                }
              }else {
                var result2 = null;
                pos = savedPos1
              }
              var result3 = result2 !== null ? function(expression) {
                return expression
              }(result2[2]) : null;
              if(result3 !== null) {
                var result1 = result3
              }else {
                var result1 = null;
                pos = savedPos0
              }
              if(result1 !== null) {
                var result0 = result1
              }else {
                var result0 = null
              }
            }
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_FunctionName() {
        var cacheKey = "FunctionName@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        if(input.substr(pos).match(/^[a-zA-Z_]/) !== null) {
          var result3 = input.charAt(pos);
          pos++
        }else {
          var result3 = null;
          if(reportMatchFailures) {
            matchFailed("[a-zA-Z_]")
          }
        }
        if(result3 !== null) {
          var result1 = [];
          while(result3 !== null) {
            result1.push(result3);
            if(input.substr(pos).match(/^[a-zA-Z_]/) !== null) {
              var result3 = input.charAt(pos);
              pos++
            }else {
              var result3 = null;
              if(reportMatchFailures) {
                matchFailed("[a-zA-Z_]")
              }
            }
          }
        }else {
          var result1 = null
        }
        var result2 = result1 !== null ? function(name) {
          return name.join("")
        }(result1) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_CallExpression() {
        var cacheKey = "CallExpression@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_FunctionName();
        if(result3 !== null) {
          var result4 = parse___();
          if(result4 !== null) {
            if(input.substr(pos, 1) === "(") {
              var result5 = "(";
              pos += 1
            }else {
              var result5 = null;
              if(reportMatchFailures) {
                matchFailed('"("')
              }
            }
            if(result5 !== null) {
              var result6 = parse___();
              if(result6 !== null) {
                var result10 = parse_ExpressionList();
                var result7 = result10 !== null ? result10 : "";
                if(result7 !== null) {
                  var result8 = parse___();
                  if(result8 !== null) {
                    if(input.substr(pos, 1) === ")") {
                      var result9 = ")";
                      pos += 1
                    }else {
                      var result9 = null;
                      if(reportMatchFailures) {
                        matchFailed('")"')
                      }
                    }
                    if(result9 !== null) {
                      var result1 = [result3, result4, result5, result6, result7, result8, result9]
                    }else {
                      var result1 = null;
                      pos = savedPos1
                    }
                  }else {
                    var result1 = null;
                    pos = savedPos1
                  }
                }else {
                  var result1 = null;
                  pos = savedPos1
                }
              }else {
                var result1 = null;
                pos = savedPos1
              }
            }else {
              var result1 = null;
              pos = savedPos1
            }
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(func_name, arg_exprs) {
          return{type:"CallExpression", func_name:func_name, arg_exprs:arg_exprs, interpret:function(interpreter) {
            var args = [];
            if(this.arg_exprs === "") {
              this.arg_exprs = []
            }
            for(var i = 0;i < this.arg_exprs.length;i++) {
              var val = this.arg_exprs[i].interpret(interpreter);
              args.push(val)
            }
            var func = interpreter.function_table[this.func_name];
            if(!func) {
              return undefined
            }
            return func.apply(interpreter, args)
          }, accept:function(visitor) {
            return visitor.visitCallExpression(this)
          }}
        }(result1[0], result1[4]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_ExpressionList() {
        var cacheKey = "ExpressionList@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_Expression();
        if(result3 !== null) {
          var result4 = [];
          var savedPos2 = pos;
          var result6 = parse___();
          if(result6 !== null) {
            if(input.substr(pos, 1) === ",") {
              var result7 = ",";
              pos += 1
            }else {
              var result7 = null;
              if(reportMatchFailures) {
                matchFailed('","')
              }
            }
            if(result7 !== null) {
              var result8 = parse___();
              if(result8 !== null) {
                var result9 = parse_Expression();
                if(result9 !== null) {
                  var result5 = [result6, result7, result8, result9]
                }else {
                  var result5 = null;
                  pos = savedPos2
                }
              }else {
                var result5 = null;
                pos = savedPos2
              }
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }else {
            var result5 = null;
            pos = savedPos2
          }
          while(result5 !== null) {
            result4.push(result5);
            var savedPos2 = pos;
            var result6 = parse___();
            if(result6 !== null) {
              if(input.substr(pos, 1) === ",") {
                var result7 = ",";
                pos += 1
              }else {
                var result7 = null;
                if(reportMatchFailures) {
                  matchFailed('","')
                }
              }
              if(result7 !== null) {
                var result8 = parse___();
                if(result8 !== null) {
                  var result9 = parse_Expression();
                  if(result9 !== null) {
                    var result5 = [result6, result7, result8, result9]
                  }else {
                    var result5 = null;
                    pos = savedPos2
                  }
                }else {
                  var result5 = null;
                  pos = savedPos2
                }
              }else {
                var result5 = null;
                pos = savedPos2
              }
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }
          if(result4 !== null) {
            var result1 = [result3, result4]
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(head, tail) {
          var args = [head];
          for(var i = 0;i < tail.length;i++) {
            args.push(tail[i][3])
          }
          return args
        }(result1[0], result1[1]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_Accessor() {
        var cacheKey = "Accessor@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        if(input.substr(pos, 1) === "[") {
          var result3 = "[";
          pos += 1
        }else {
          var result3 = null;
          if(reportMatchFailures) {
            matchFailed('"["')
          }
        }
        if(result3 !== null) {
          var result4 = parse___();
          if(result4 !== null) {
            var result5 = parse_LogicalORExpression();
            if(result5 !== null) {
              var result6 = parse___();
              if(result6 !== null) {
                if(input.substr(pos, 1) === "]") {
                  var result7 = "]";
                  pos += 1
                }else {
                  var result7 = null;
                  if(reportMatchFailures) {
                    matchFailed('"]"')
                  }
                }
                if(result7 !== null) {
                  var result1 = [result3, result4, result5, result6, result7]
                }else {
                  var result1 = null;
                  pos = savedPos1
                }
              }else {
                var result1 = null;
                pos = savedPos1
              }
            }else {
              var result1 = null;
              pos = savedPos1
            }
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(index) {
          return index
        }(result1[2]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_AccessorExpression() {
        var cacheKey = "AccessorExpression@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_Expression();
        if(result3 !== null) {
          var result4 = parse___();
          if(result4 !== null) {
            var result5 = parse_Accessor();
            if(result5 !== null) {
              var result1 = [result3, result4, result5]
            }else {
              var result1 = null;
              pos = savedPos1
            }
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(value, index) {
          return{type:"AccessorExpression", value:value, index:index, interpret:function(interpreter) {
            var value = this.value.interpret(interpreter);
            var index = this.index.interpret(interpreter);
            index = absolute_index(index, value);
            return value[index]
          }, accept:function(visitor) {
            return visitor.visitAccessorExpression(this)
          }}
        }(result1[0], result1[2]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_UnaryExpression() {
        var cacheKey = "UnaryExpression@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var result8 = parse_AccessorExpression();
        if(result8 !== null) {
          var result0 = result8
        }else {
          var result7 = parse_Expression();
          if(result7 !== null) {
            var result0 = result7
          }else {
            var savedPos0 = pos;
            var savedPos1 = pos;
            var result4 = parse_UnaryOperator();
            if(result4 !== null) {
              var result5 = parse___();
              if(result5 !== null) {
                var result6 = parse_Expression();
                if(result6 !== null) {
                  var result2 = [result4, result5, result6]
                }else {
                  var result2 = null;
                  pos = savedPos1
                }
              }else {
                var result2 = null;
                pos = savedPos1
              }
            }else {
              var result2 = null;
              pos = savedPos1
            }
            var result3 = result2 !== null ? function(operator, expression) {
              return{type:"UnaryExpression", operator:operator, expression:expression, interpret:function(interpreter) {
                var val = this.expression.interpret(interpreter);
                return unaryOperator(this.operator, val)
              }, accept:function(visitor) {
                return visitor.visitUnaryExpression(this)
              }}
            }(result2[0], result2[2]) : null;
            if(result3 !== null) {
              var result1 = result3
            }else {
              var result1 = null;
              pos = savedPos0
            }
            if(result1 !== null) {
              var result0 = result1
            }else {
              var result0 = null
            }
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_UnaryOperator() {
        var cacheKey = "UnaryOperator@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 1) === "+") {
          var result4 = "+";
          pos += 1
        }else {
          var result4 = null;
          if(reportMatchFailures) {
            matchFailed('"+"')
          }
        }
        if(result4 !== null) {
          var result0 = result4
        }else {
          if(input.substr(pos, 1) === "-") {
            var result3 = "-";
            pos += 1
          }else {
            var result3 = null;
            if(reportMatchFailures) {
              matchFailed('"-"')
            }
          }
          if(result3 !== null) {
            var result0 = result3
          }else {
            if(input.substr(pos, 1) === "~") {
              var result2 = "~";
              pos += 1
            }else {
              var result2 = null;
              if(reportMatchFailures) {
                matchFailed('"~"')
              }
            }
            if(result2 !== null) {
              var result0 = result2
            }else {
              if(input.substr(pos, 3) === "not") {
                var result1 = "not";
                pos += 3
              }else {
                var result1 = null;
                if(reportMatchFailures) {
                  matchFailed('"not"')
                }
              }
              if(result1 !== null) {
                var result0 = result1
              }else {
                var result0 = null
              }
            }
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_MultiplicativeExpression() {
        var cacheKey = "MultiplicativeExpression@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_UnaryExpression();
        if(result3 !== null) {
          var result4 = [];
          var savedPos2 = pos;
          var result6 = parse___();
          if(result6 !== null) {
            var result7 = parse_MultiplicativeOperator();
            if(result7 !== null) {
              var result8 = parse___();
              if(result8 !== null) {
                var result9 = parse_UnaryExpression();
                if(result9 !== null) {
                  var result5 = [result6, result7, result8, result9]
                }else {
                  var result5 = null;
                  pos = savedPos2
                }
              }else {
                var result5 = null;
                pos = savedPos2
              }
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }else {
            var result5 = null;
            pos = savedPos2
          }
          while(result5 !== null) {
            result4.push(result5);
            var savedPos2 = pos;
            var result6 = parse___();
            if(result6 !== null) {
              var result7 = parse_MultiplicativeOperator();
              if(result7 !== null) {
                var result8 = parse___();
                if(result8 !== null) {
                  var result9 = parse_UnaryExpression();
                  if(result9 !== null) {
                    var result5 = [result6, result7, result8, result9]
                  }else {
                    var result5 = null;
                    pos = savedPos2
                  }
                }else {
                  var result5 = null;
                  pos = savedPos2
                }
              }else {
                var result5 = null;
                pos = savedPos2
              }
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }
          if(result4 !== null) {
            var result1 = [result3, result4]
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(head, tail) {
          var result = head;
          for(var i = 0;i < tail.length;i++) {
            result = {type:"MultiplicativeExpression", operator:tail[i][1], left:result, right:tail[i][3], interpret:function(interpreter) {
              var left = this.left.interpret(interpreter);
              var right = this.right.interpret(interpreter);
              return binaryOperator(left, this.operator, right)
            }, accept:function(visitor) {
              return visitor.visitMultiplicativeExpression(this)
            }}
          }
          return result
        }(result1[0], result1[1]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_MultiplicativeOperator() {
        var cacheKey = "MultiplicativeOperator@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        if(input.substr(pos, 1) === "*") {
          var result8 = "*";
          pos += 1
        }else {
          var result8 = null;
          if(reportMatchFailures) {
            matchFailed('"*"')
          }
        }
        if(result8 !== null) {
          var result3 = result8
        }else {
          if(input.substr(pos, 1) === "/") {
            var result7 = "/";
            pos += 1
          }else {
            var result7 = null;
            if(reportMatchFailures) {
              matchFailed('"/"')
            }
          }
          if(result7 !== null) {
            var result3 = result7
          }else {
            if(input.substr(pos, 1) === "%") {
              var result6 = "%";
              pos += 1
            }else {
              var result6 = null;
              if(reportMatchFailures) {
                matchFailed('"%"')
              }
            }
            if(result6 !== null) {
              var result3 = result6
            }else {
              var result3 = null
            }
          }
        }
        if(result3 !== null) {
          var savedPos2 = pos;
          var savedReportMatchFailuresVar0 = reportMatchFailures;
          reportMatchFailures = false;
          if(input.substr(pos, 1) === "=") {
            var result5 = "=";
            pos += 1
          }else {
            var result5 = null;
            if(reportMatchFailures) {
              matchFailed('"="')
            }
          }
          reportMatchFailures = savedReportMatchFailuresVar0;
          if(result5 === null) {
            var result4 = ""
          }else {
            var result4 = null;
            pos = savedPos2
          }
          if(result4 !== null) {
            var result1 = [result3, result4]
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(operator) {
          return operator
        }(result1[0]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_AdditiveExpression() {
        var cacheKey = "AdditiveExpression@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_MultiplicativeExpression();
        if(result3 !== null) {
          var result4 = [];
          var savedPos2 = pos;
          var result6 = parse___();
          if(result6 !== null) {
            var result7 = parse_AdditiveOperator();
            if(result7 !== null) {
              var result8 = parse___();
              if(result8 !== null) {
                var result9 = parse_MultiplicativeExpression();
                if(result9 !== null) {
                  var result5 = [result6, result7, result8, result9]
                }else {
                  var result5 = null;
                  pos = savedPos2
                }
              }else {
                var result5 = null;
                pos = savedPos2
              }
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }else {
            var result5 = null;
            pos = savedPos2
          }
          while(result5 !== null) {
            result4.push(result5);
            var savedPos2 = pos;
            var result6 = parse___();
            if(result6 !== null) {
              var result7 = parse_AdditiveOperator();
              if(result7 !== null) {
                var result8 = parse___();
                if(result8 !== null) {
                  var result9 = parse_MultiplicativeExpression();
                  if(result9 !== null) {
                    var result5 = [result6, result7, result8, result9]
                  }else {
                    var result5 = null;
                    pos = savedPos2
                  }
                }else {
                  var result5 = null;
                  pos = savedPos2
                }
              }else {
                var result5 = null;
                pos = savedPos2
              }
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }
          if(result4 !== null) {
            var result1 = [result3, result4]
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(head, tail) {
          var result = head;
          for(var i = 0;i < tail.length;i++) {
            result = {type:"AdditiveExpression", operator:tail[i][1], left:result, right:tail[i][3], interpret:function(interpreter) {
              var left = this.left.interpret(interpreter);
              var right = this.right.interpret(interpreter);
              return binaryOperator(left, this.operator, right)
            }, accept:function(visitor) {
              return visitor.visitAdditiveExpression(this)
            }}
          }
          return result
        }(result1[0], result1[1]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_AdditiveOperator() {
        var cacheKey = "AdditiveOperator@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos3 = pos;
        var savedPos4 = pos;
        if(input.substr(pos, 1) === "+") {
          var result12 = "+";
          pos += 1
        }else {
          var result12 = null;
          if(reportMatchFailures) {
            matchFailed('"+"')
          }
        }
        if(result12 !== null) {
          var savedPos5 = pos;
          var savedReportMatchFailuresVar1 = reportMatchFailures;
          reportMatchFailures = false;
          if(input.substr(pos, 1) === "+") {
            var result16 = "+";
            pos += 1
          }else {
            var result16 = null;
            if(reportMatchFailures) {
              matchFailed('"+"')
            }
          }
          if(result16 !== null) {
            var result14 = result16
          }else {
            if(input.substr(pos, 1) === "=") {
              var result15 = "=";
              pos += 1
            }else {
              var result15 = null;
              if(reportMatchFailures) {
                matchFailed('"="')
              }
            }
            if(result15 !== null) {
              var result14 = result15
            }else {
              var result14 = null
            }
          }
          reportMatchFailures = savedReportMatchFailuresVar1;
          if(result14 === null) {
            var result13 = ""
          }else {
            var result13 = null;
            pos = savedPos5
          }
          if(result13 !== null) {
            var result10 = [result12, result13]
          }else {
            var result10 = null;
            pos = savedPos4
          }
        }else {
          var result10 = null;
          pos = savedPos4
        }
        var result11 = result10 !== null ? function() {
          return"+"
        }() : null;
        if(result11 !== null) {
          var result9 = result11
        }else {
          var result9 = null;
          pos = savedPos3
        }
        if(result9 !== null) {
          var result0 = result9
        }else {
          var savedPos0 = pos;
          var savedPos1 = pos;
          if(input.substr(pos, 1) === "-") {
            var result4 = "-";
            pos += 1
          }else {
            var result4 = null;
            if(reportMatchFailures) {
              matchFailed('"-"')
            }
          }
          if(result4 !== null) {
            var savedPos2 = pos;
            var savedReportMatchFailuresVar0 = reportMatchFailures;
            reportMatchFailures = false;
            if(input.substr(pos, 1) === "-") {
              var result8 = "-";
              pos += 1
            }else {
              var result8 = null;
              if(reportMatchFailures) {
                matchFailed('"-"')
              }
            }
            if(result8 !== null) {
              var result6 = result8
            }else {
              if(input.substr(pos, 1) === "=") {
                var result7 = "=";
                pos += 1
              }else {
                var result7 = null;
                if(reportMatchFailures) {
                  matchFailed('"="')
                }
              }
              if(result7 !== null) {
                var result6 = result7
              }else {
                var result6 = null
              }
            }
            reportMatchFailures = savedReportMatchFailuresVar0;
            if(result6 === null) {
              var result5 = ""
            }else {
              var result5 = null;
              pos = savedPos2
            }
            if(result5 !== null) {
              var result2 = [result4, result5]
            }else {
              var result2 = null;
              pos = savedPos1
            }
          }else {
            var result2 = null;
            pos = savedPos1
          }
          var result3 = result2 !== null ? function() {
            return"-"
          }() : null;
          if(result3 !== null) {
            var result1 = result3
          }else {
            var result1 = null;
            pos = savedPos0
          }
          if(result1 !== null) {
            var result0 = result1
          }else {
            var result0 = null
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_RelationalExpression() {
        var cacheKey = "RelationalExpression@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_AdditiveExpression();
        if(result3 !== null) {
          var result4 = [];
          var savedPos2 = pos;
          var result6 = parse___();
          if(result6 !== null) {
            var result7 = parse_RelationalOperator();
            if(result7 !== null) {
              var result8 = parse___();
              if(result8 !== null) {
                var result9 = parse_AdditiveExpression();
                if(result9 !== null) {
                  var result5 = [result6, result7, result8, result9]
                }else {
                  var result5 = null;
                  pos = savedPos2
                }
              }else {
                var result5 = null;
                pos = savedPos2
              }
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }else {
            var result5 = null;
            pos = savedPos2
          }
          while(result5 !== null) {
            result4.push(result5);
            var savedPos2 = pos;
            var result6 = parse___();
            if(result6 !== null) {
              var result7 = parse_RelationalOperator();
              if(result7 !== null) {
                var result8 = parse___();
                if(result8 !== null) {
                  var result9 = parse_AdditiveExpression();
                  if(result9 !== null) {
                    var result5 = [result6, result7, result8, result9]
                  }else {
                    var result5 = null;
                    pos = savedPos2
                  }
                }else {
                  var result5 = null;
                  pos = savedPos2
                }
              }else {
                var result5 = null;
                pos = savedPos2
              }
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }
          if(result4 !== null) {
            var result1 = [result3, result4]
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(head, tail) {
          var result = head;
          for(var i = 0;i < tail.length;i++) {
            result = {type:"RelationalExpression", operator:tail[i][1], left:result, right:tail[i][3], interpret:function(interpreter) {
              var left = this.left.interpret(interpreter);
              var right = this.right.interpret(interpreter);
              return binaryOperator(left, this.operator, right)
            }, accept:function(visitor) {
              return visitor.visitRelationalExpression(this)
            }}
          }
          return result
        }(result1[0], result1[1]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_RelationalOperator() {
        var cacheKey = "RelationalOperator@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 2) === "<=") {
          var result4 = "<=";
          pos += 2
        }else {
          var result4 = null;
          if(reportMatchFailures) {
            matchFailed('"<="')
          }
        }
        if(result4 !== null) {
          var result0 = result4
        }else {
          if(input.substr(pos, 2) === ">=") {
            var result3 = ">=";
            pos += 2
          }else {
            var result3 = null;
            if(reportMatchFailures) {
              matchFailed('">="')
            }
          }
          if(result3 !== null) {
            var result0 = result3
          }else {
            if(input.substr(pos, 1) === "<") {
              var result2 = "<";
              pos += 1
            }else {
              var result2 = null;
              if(reportMatchFailures) {
                matchFailed('"<"')
              }
            }
            if(result2 !== null) {
              var result0 = result2
            }else {
              if(input.substr(pos, 1) === ">") {
                var result1 = ">";
                pos += 1
              }else {
                var result1 = null;
                if(reportMatchFailures) {
                  matchFailed('">"')
                }
              }
              if(result1 !== null) {
                var result0 = result1
              }else {
                var result0 = null
              }
            }
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_EqualsExpression() {
        var cacheKey = "EqualsExpression@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_RelationalExpression();
        if(result3 !== null) {
          var result4 = [];
          var savedPos2 = pos;
          var result6 = parse___();
          if(result6 !== null) {
            var result7 = parse_EqualsToken();
            if(result7 !== null) {
              var result8 = parse___();
              if(result8 !== null) {
                var result9 = parse_RelationalExpression();
                if(result9 !== null) {
                  var result5 = [result6, result7, result8, result9]
                }else {
                  var result5 = null;
                  pos = savedPos2
                }
              }else {
                var result5 = null;
                pos = savedPos2
              }
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }else {
            var result5 = null;
            pos = savedPos2
          }
          while(result5 !== null) {
            result4.push(result5);
            var savedPos2 = pos;
            var result6 = parse___();
            if(result6 !== null) {
              var result7 = parse_EqualsToken();
              if(result7 !== null) {
                var result8 = parse___();
                if(result8 !== null) {
                  var result9 = parse_RelationalExpression();
                  if(result9 !== null) {
                    var result5 = [result6, result7, result8, result9]
                  }else {
                    var result5 = null;
                    pos = savedPos2
                  }
                }else {
                  var result5 = null;
                  pos = savedPos2
                }
              }else {
                var result5 = null;
                pos = savedPos2
              }
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }
          if(result4 !== null) {
            var result1 = [result3, result4]
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(head, tail) {
          var result = head;
          for(var i = 0;i < tail.length;i++) {
            result = {type:"EqualsExpression", operator:tail[i][1], left:result, right:tail[i][3], interpret:function(interpreter) {
              var left_val = this.left.interpret(interpreter);
              var right_val = this.right.interpret(interpreter);
              return left_val == right_val
            }, accept:function(visitor) {
              return visitor.visitEqualsExpression(this)
            }}
          }
          return result
        }(result1[0], result1[1]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_EqualsToken() {
        var cacheKey = "EqualsToken@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 2) === "==") {
          var result0 = "==";
          pos += 2
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed('"=="')
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_LogicalANDExpression() {
        var cacheKey = "LogicalANDExpression@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_EqualsExpression();
        if(result3 !== null) {
          var result4 = [];
          var savedPos2 = pos;
          var result6 = parse___();
          if(result6 !== null) {
            var result7 = parse_AndToken();
            if(result7 !== null) {
              var result8 = parse___();
              if(result8 !== null) {
                var result9 = parse_EqualsExpression();
                if(result9 !== null) {
                  var result5 = [result6, result7, result8, result9]
                }else {
                  var result5 = null;
                  pos = savedPos2
                }
              }else {
                var result5 = null;
                pos = savedPos2
              }
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }else {
            var result5 = null;
            pos = savedPos2
          }
          while(result5 !== null) {
            result4.push(result5);
            var savedPos2 = pos;
            var result6 = parse___();
            if(result6 !== null) {
              var result7 = parse_AndToken();
              if(result7 !== null) {
                var result8 = parse___();
                if(result8 !== null) {
                  var result9 = parse_EqualsExpression();
                  if(result9 !== null) {
                    var result5 = [result6, result7, result8, result9]
                  }else {
                    var result5 = null;
                    pos = savedPos2
                  }
                }else {
                  var result5 = null;
                  pos = savedPos2
                }
              }else {
                var result5 = null;
                pos = savedPos2
              }
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }
          if(result4 !== null) {
            var result1 = [result3, result4]
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(head, tail) {
          var result = head;
          for(var i = 0;i < tail.length;i++) {
            result = {type:"LogicalANDExpression", operator:tail[i][1], left:result, right:tail[i][3], interpret:function(interpreter) {
              var left = this.left.interpret(interpreter);
              if(!left) {
                return false
              }else {
                return this.right.interpret(interpreter)
              }
            }, accept:function(visitor) {
              return visitor.visitLogicalANDExpression(this)
            }}
          }
          return result
        }(result1[0], result1[1]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_LogicalORExpression() {
        var cacheKey = "LogicalORExpression@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_LogicalANDExpression();
        if(result3 !== null) {
          var result4 = [];
          var savedPos2 = pos;
          var result6 = parse___();
          if(result6 !== null) {
            var result7 = parse_OrToken();
            if(result7 !== null) {
              var result8 = parse___();
              if(result8 !== null) {
                var result9 = parse_LogicalANDExpression();
                if(result9 !== null) {
                  var result5 = [result6, result7, result8, result9]
                }else {
                  var result5 = null;
                  pos = savedPos2
                }
              }else {
                var result5 = null;
                pos = savedPos2
              }
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }else {
            var result5 = null;
            pos = savedPos2
          }
          while(result5 !== null) {
            result4.push(result5);
            var savedPos2 = pos;
            var result6 = parse___();
            if(result6 !== null) {
              var result7 = parse_OrToken();
              if(result7 !== null) {
                var result8 = parse___();
                if(result8 !== null) {
                  var result9 = parse_LogicalANDExpression();
                  if(result9 !== null) {
                    var result5 = [result6, result7, result8, result9]
                  }else {
                    var result5 = null;
                    pos = savedPos2
                  }
                }else {
                  var result5 = null;
                  pos = savedPos2
                }
              }else {
                var result5 = null;
                pos = savedPos2
              }
            }else {
              var result5 = null;
              pos = savedPos2
            }
          }
          if(result4 !== null) {
            var result1 = [result3, result4]
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(head, tail) {
          var result = head;
          for(var i = 0;i < tail.length;i++) {
            result = {type:"LogicalORExpression", operator:tail[i][1], left:result, right:tail[i][3], interpret:function(interpreter) {
              var left = this.left.interpret(interpreter);
              if(left) {
                return left
              }else {
                return this.right.interpret(interpreter)
              }
            }, accept:function(visitor) {
              return visitor.visitLogicalORExpression(this)
            }}
          }
          return result
        }(result1[0], result1[1]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_Literal() {
        var cacheKey = "Literal@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var result6 = parse_NullLiteral();
        if(result6 !== null) {
          var result0 = result6
        }else {
          var result5 = parse_BooleanLiteral();
          if(result5 !== null) {
            var result0 = result5
          }else {
            var result4 = parse_NumericLiteral();
            if(result4 !== null) {
              var result0 = result4
            }else {
              var result3 = parse_StringLiteral();
              if(result3 !== null) {
                var result0 = result3
              }else {
                var result2 = parse_RegularExpressionLiteral();
                if(result2 !== null) {
                  var result0 = result2
                }else {
                  var result1 = parse_ArrayLiteral();
                  if(result1 !== null) {
                    var result0 = result1
                  }else {
                    var result0 = null
                  }
                }
              }
            }
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_ArrayLiteral() {
        var cacheKey = "ArrayLiteral@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        if(input.substr(pos, 1) === "[") {
          var result3 = "[";
          pos += 1
        }else {
          var result3 = null;
          if(reportMatchFailures) {
            matchFailed('"["')
          }
        }
        if(result3 !== null) {
          var result4 = parse___();
          if(result4 !== null) {
            var result8 = parse_ExpressionList();
            var result5 = result8 !== null ? result8 : "";
            if(result5 !== null) {
              var result6 = parse___();
              if(result6 !== null) {
                if(input.substr(pos, 1) === "]") {
                  var result7 = "]";
                  pos += 1
                }else {
                  var result7 = null;
                  if(reportMatchFailures) {
                    matchFailed('"]"')
                  }
                }
                if(result7 !== null) {
                  var result1 = [result3, result4, result5, result6, result7]
                }else {
                  var result1 = null;
                  pos = savedPos1
                }
              }else {
                var result1 = null;
                pos = savedPos1
              }
            }else {
              var result1 = null;
              pos = savedPos1
            }
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(elements) {
          return{type:"ArrayLiteral", elements:elements !== "" ? elements : [], interpret:function(interpreter) {
            var res = new Array;
            for(var i = 0;i < this.elements.length;i++) {
              res.push(this.elements[i].interpret(interpreter))
            }
            return res
          }, accept:function(visitor) {
            return visitor.visitArrayLiteral(this)
          }}
        }(result1[2]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_RegularExpressionLiteral() {
        var cacheKey = "RegularExpressionLiteral@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        if(input.substr(pos, 1) === "/") {
          var result3 = "/";
          pos += 1
        }else {
          var result3 = null;
          if(reportMatchFailures) {
            matchFailed('"/"')
          }
        }
        if(result3 !== null) {
          var result4 = parse_RegularExpressionLiteralCharacters();
          if(result4 !== null) {
            if(input.substr(pos, 1) === "/") {
              var result5 = "/";
              pos += 1
            }else {
              var result5 = null;
              if(reportMatchFailures) {
                matchFailed('"/"')
              }
            }
            if(result5 !== null) {
              var result1 = [result3, result4, result5]
            }else {
              var result1 = null;
              pos = savedPos1
            }
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(value_) {
          return{type:"RegexLiteral", value:value_, interpret:function(interpreter) {
            return this.value
          }, accept:function(visitor) {
            return visitor.visitRegularExpressionLiteral(this)
          }}
        }(result1[1]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        reportMatchFailures = savedReportMatchFailures;
        if(reportMatchFailures && result0 === null) {
          matchFailed("regex")
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_NullLiteral() {
        var cacheKey = "NullLiteral@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var result1 = parse_NullToken();
        var result2 = result1 !== null ? function() {
          return{type:"NullLiteral", value:null, interpret:function(interpreter) {
            return this.value
          }, accept:function(visitor) {
            return visitor.visitNullLiteral(this)
          }}
        }() : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_BooleanLiteral() {
        var cacheKey = "BooleanLiteral@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos1 = pos;
        var result5 = parse_TrueToken();
        var result6 = result5 !== null ? function() {
          return{type:"BooleanLiteral", value:true, interpret:function(interpreter) {
            return this.value
          }, accept:function(visitor) {
            return visitor.visitBooleanLiteral(this)
          }}
        }() : null;
        if(result6 !== null) {
          var result4 = result6
        }else {
          var result4 = null;
          pos = savedPos1
        }
        if(result4 !== null) {
          var result0 = result4
        }else {
          var savedPos0 = pos;
          var result2 = parse_FalseToken();
          var result3 = result2 !== null ? function() {
            return{type:"BooleanLiteral", value:false, interpret:function(interpreter) {
              return this.value
            }, accept:function(visitor) {
              return visitor.visitBooleanLiteral(this)
            }}
          }() : null;
          if(result3 !== null) {
            var result1 = result3
          }else {
            var result1 = null;
            pos = savedPos0
          }
          if(result1 !== null) {
            var result0 = result1
          }else {
            var result0 = null
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_NumericLiteral() {
        var cacheKey = "NumericLiteral@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result7 = parse_HexIntegerLiteral();
        if(result7 !== null) {
          var result3 = result7
        }else {
          var result6 = parse_DecimalLiteral();
          if(result6 !== null) {
            var result3 = result6
          }else {
            var result3 = null
          }
        }
        if(result3 !== null) {
          var savedPos2 = pos;
          var savedReportMatchFailuresVar0 = reportMatchFailures;
          reportMatchFailures = false;
          var result5 = parse_IdentifierStart();
          reportMatchFailures = savedReportMatchFailuresVar0;
          if(result5 === null) {
            var result4 = ""
          }else {
            var result4 = null;
            pos = savedPos2
          }
          if(result4 !== null) {
            var result1 = [result3, result4]
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(value) {
          return{type:"NumericLiteral", value:value, interpret:function(interpreter) {
            return this.value
          }, accept:function(visitor) {
            return visitor.visitNumericLiteral(this)
          }}
        }(result1[0]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        reportMatchFailures = savedReportMatchFailures;
        if(reportMatchFailures && result0 === null) {
          matchFailed("number")
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_DecimalLiteral() {
        var cacheKey = "DecimalLiteral@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos4 = pos;
        var savedPos5 = pos;
        var result17 = parse_DecimalIntegerLiteral();
        if(result17 !== null) {
          if(input.substr(pos, 1) === ".") {
            var result18 = ".";
            pos += 1
          }else {
            var result18 = null;
            if(reportMatchFailures) {
              matchFailed('"."')
            }
          }
          if(result18 !== null) {
            var result22 = parse_DecimalDigits();
            var result19 = result22 !== null ? result22 : "";
            if(result19 !== null) {
              var result21 = parse_ExponentPart();
              var result20 = result21 !== null ? result21 : "";
              if(result20 !== null) {
                var result15 = [result17, result18, result19, result20]
              }else {
                var result15 = null;
                pos = savedPos5
              }
            }else {
              var result15 = null;
              pos = savedPos5
            }
          }else {
            var result15 = null;
            pos = savedPos5
          }
        }else {
          var result15 = null;
          pos = savedPos5
        }
        var result16 = result15 !== null ? function(before, after, exponent) {
          return parseFloat(before + "." + after + exponent)
        }(result15[0], result15[2], result15[3]) : null;
        if(result16 !== null) {
          var result14 = result16
        }else {
          var result14 = null;
          pos = savedPos4
        }
        if(result14 !== null) {
          var result0 = result14
        }else {
          var savedPos2 = pos;
          var savedPos3 = pos;
          if(input.substr(pos, 1) === ".") {
            var result10 = ".";
            pos += 1
          }else {
            var result10 = null;
            if(reportMatchFailures) {
              matchFailed('"."')
            }
          }
          if(result10 !== null) {
            var result11 = parse_DecimalDigits();
            if(result11 !== null) {
              var result13 = parse_ExponentPart();
              var result12 = result13 !== null ? result13 : "";
              if(result12 !== null) {
                var result8 = [result10, result11, result12]
              }else {
                var result8 = null;
                pos = savedPos3
              }
            }else {
              var result8 = null;
              pos = savedPos3
            }
          }else {
            var result8 = null;
            pos = savedPos3
          }
          var result9 = result8 !== null ? function(after, exponent) {
            return parseFloat("." + after + exponent)
          }(result8[1], result8[2]) : null;
          if(result9 !== null) {
            var result7 = result9
          }else {
            var result7 = null;
            pos = savedPos2
          }
          if(result7 !== null) {
            var result0 = result7
          }else {
            var savedPos0 = pos;
            var savedPos1 = pos;
            var result4 = parse_DecimalIntegerLiteral();
            if(result4 !== null) {
              var result6 = parse_ExponentPart();
              var result5 = result6 !== null ? result6 : "";
              if(result5 !== null) {
                var result2 = [result4, result5]
              }else {
                var result2 = null;
                pos = savedPos1
              }
            }else {
              var result2 = null;
              pos = savedPos1
            }
            var result3 = result2 !== null ? function(before, exponent) {
              return parseFloat(before + exponent)
            }(result2[0], result2[1]) : null;
            if(result3 !== null) {
              var result1 = result3
            }else {
              var result1 = null;
              pos = savedPos0
            }
            if(result1 !== null) {
              var result0 = result1
            }else {
              var result0 = null
            }
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_DecimalIntegerLiteral() {
        var cacheKey = "DecimalIntegerLiteral@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 1) === "0") {
          var result7 = "0";
          pos += 1
        }else {
          var result7 = null;
          if(reportMatchFailures) {
            matchFailed('"0"')
          }
        }
        if(result7 !== null) {
          var result0 = result7
        }else {
          var savedPos0 = pos;
          var savedPos1 = pos;
          var result4 = parse_NonZeroDigit();
          if(result4 !== null) {
            var result6 = parse_DecimalDigits();
            var result5 = result6 !== null ? result6 : "";
            if(result5 !== null) {
              var result2 = [result4, result5]
            }else {
              var result2 = null;
              pos = savedPos1
            }
          }else {
            var result2 = null;
            pos = savedPos1
          }
          var result3 = result2 !== null ? function(digit, digits) {
            return digit + digits
          }(result2[0], result2[1]) : null;
          if(result3 !== null) {
            var result1 = result3
          }else {
            var result1 = null;
            pos = savedPos0
          }
          if(result1 !== null) {
            var result0 = result1
          }else {
            var result0 = null
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_DecimalDigits() {
        var cacheKey = "DecimalDigits@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var result3 = parse_DecimalDigit();
        if(result3 !== null) {
          var result1 = [];
          while(result3 !== null) {
            result1.push(result3);
            var result3 = parse_DecimalDigit()
          }
        }else {
          var result1 = null
        }
        var result2 = result1 !== null ? function(digits) {
          return digits.join("")
        }(result1) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_DecimalDigit() {
        var cacheKey = "DecimalDigit@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos).match(/^[0-9]/) !== null) {
          var result0 = input.charAt(pos);
          pos++
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed("[0-9]")
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_NonZeroDigit() {
        var cacheKey = "NonZeroDigit@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos).match(/^[1-9]/) !== null) {
          var result0 = input.charAt(pos);
          pos++
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed("[1-9]")
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_ExponentPart() {
        var cacheKey = "ExponentPart@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_ExponentIndicator();
        if(result3 !== null) {
          var result4 = parse_SignedInteger();
          if(result4 !== null) {
            var result1 = [result3, result4]
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(indicator, integer) {
          return indicator + integer
        }(result1[0], result1[1]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_ExponentIndicator() {
        var cacheKey = "ExponentIndicator@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos).match(/^[eE]/) !== null) {
          var result0 = input.charAt(pos);
          pos++
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed("[eE]")
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_SignedInteger() {
        var cacheKey = "SignedInteger@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        if(input.substr(pos).match(/^[\-+]/) !== null) {
          var result5 = input.charAt(pos);
          pos++
        }else {
          var result5 = null;
          if(reportMatchFailures) {
            matchFailed("[\\-+]")
          }
        }
        var result3 = result5 !== null ? result5 : "";
        if(result3 !== null) {
          var result4 = parse_DecimalDigits();
          if(result4 !== null) {
            var result1 = [result3, result4]
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(sign, digits) {
          return sign + digits
        }(result1[0], result1[1]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_HexIntegerLiteral() {
        var cacheKey = "HexIntegerLiteral@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        if(input.substr(pos, 1) === "0") {
          var result3 = "0";
          pos += 1
        }else {
          var result3 = null;
          if(reportMatchFailures) {
            matchFailed('"0"')
          }
        }
        if(result3 !== null) {
          if(input.substr(pos).match(/^[xX]/) !== null) {
            var result4 = input.charAt(pos);
            pos++
          }else {
            var result4 = null;
            if(reportMatchFailures) {
              matchFailed("[xX]")
            }
          }
          if(result4 !== null) {
            var result6 = parse_HexDigit();
            if(result6 !== null) {
              var result5 = [];
              while(result6 !== null) {
                result5.push(result6);
                var result6 = parse_HexDigit()
              }
            }else {
              var result5 = null
            }
            if(result5 !== null) {
              var result1 = [result3, result4, result5]
            }else {
              var result1 = null;
              pos = savedPos1
            }
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(digits) {
          return parseInt("0x" + dgits.join(""))
        }(result1[2]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_HexDigit() {
        var cacheKey = "HexDigit@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos).match(/^[0-9a-fA-F]/) !== null) {
          var result0 = input.charAt(pos);
          pos++
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed("[0-9a-fA-F]")
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_StringLiteral() {
        var cacheKey = "StringLiteral@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedReportMatchFailures = reportMatchFailures;
        reportMatchFailures = false;
        var savedPos0 = pos;
        var savedPos2 = pos;
        if(input.substr(pos, 1) === '"') {
          var result9 = '"';
          pos += 1
        }else {
          var result9 = null;
          if(reportMatchFailures) {
            matchFailed('"\\""')
          }
        }
        if(result9 !== null) {
          var result12 = parse_DoubleStringCharacters();
          var result10 = result12 !== null ? result12 : "";
          if(result10 !== null) {
            if(input.substr(pos, 1) === '"') {
              var result11 = '"';
              pos += 1
            }else {
              var result11 = null;
              if(reportMatchFailures) {
                matchFailed('"\\""')
              }
            }
            if(result11 !== null) {
              var result8 = [result9, result10, result11]
            }else {
              var result8 = null;
              pos = savedPos2
            }
          }else {
            var result8 = null;
            pos = savedPos2
          }
        }else {
          var result8 = null;
          pos = savedPos2
        }
        if(result8 !== null) {
          var result1 = result8
        }else {
          var savedPos1 = pos;
          if(input.substr(pos, 1) === "'") {
            var result4 = "'";
            pos += 1
          }else {
            var result4 = null;
            if(reportMatchFailures) {
              matchFailed('"\'"')
            }
          }
          if(result4 !== null) {
            var result7 = parse_SingleStringCharacters();
            var result5 = result7 !== null ? result7 : "";
            if(result5 !== null) {
              if(input.substr(pos, 1) === "'") {
                var result6 = "'";
                pos += 1
              }else {
                var result6 = null;
                if(reportMatchFailures) {
                  matchFailed('"\'"')
                }
              }
              if(result6 !== null) {
                var result3 = [result4, result5, result6]
              }else {
                var result3 = null;
                pos = savedPos1
              }
            }else {
              var result3 = null;
              pos = savedPos1
            }
          }else {
            var result3 = null;
            pos = savedPos1
          }
          if(result3 !== null) {
            var result1 = result3
          }else {
            var result1 = null
          }
        }
        var result2 = result1 !== null ? function(parts) {
          return{type:"StringLiteral", value:parts[1], quote:parts[0], interpret:function(interpreter) {
            return this.value
          }, accept:function(visitor) {
            return visitor.visitStringLiteral(this)
          }}
        }(result1) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        reportMatchFailures = savedReportMatchFailures;
        if(reportMatchFailures && result0 === null) {
          matchFailed("string")
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_DoubleStringCharacters() {
        var cacheKey = "DoubleStringCharacters@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var result3 = parse_DoubleStringCharacter();
        if(result3 !== null) {
          var result1 = [];
          while(result3 !== null) {
            result1.push(result3);
            var result3 = parse_DoubleStringCharacter()
          }
        }else {
          var result1 = null
        }
        var result2 = result1 !== null ? function(chars) {
          return chars.join("")
        }(result1) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_SingleStringCharacters() {
        var cacheKey = "SingleStringCharacters@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var result3 = parse_SingleStringCharacter();
        if(result3 !== null) {
          var result1 = [];
          while(result3 !== null) {
            result1.push(result3);
            var result3 = parse_SingleStringCharacter()
          }
        }else {
          var result1 = null
        }
        var result2 = result1 !== null ? function(chars) {
          return chars.join("")
        }(result1) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_RegularExpressionLiteralCharacters() {
        var cacheKey = "RegularExpressionLiteralCharacters@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var result3 = parse_RegularExpressionLiteralCharacter();
        if(result3 !== null) {
          var result1 = [];
          while(result3 !== null) {
            result1.push(result3);
            var result3 = parse_RegularExpressionLiteralCharacter()
          }
        }else {
          var result1 = null
        }
        var result2 = result1 !== null ? function(chars) {
          return chars.join("")
        }(result1) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_DoubleStringCharacter() {
        var cacheKey = "DoubleStringCharacter@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos2 = pos;
        var savedPos3 = pos;
        var savedPos4 = pos;
        var savedReportMatchFailuresVar0 = reportMatchFailures;
        reportMatchFailures = false;
        if(input.substr(pos, 1) === '"') {
          var result15 = '"';
          pos += 1
        }else {
          var result15 = null;
          if(reportMatchFailures) {
            matchFailed('"\\""')
          }
        }
        if(result15 !== null) {
          var result12 = result15
        }else {
          if(input.substr(pos, 1) === "\\") {
            var result14 = "\\";
            pos += 1
          }else {
            var result14 = null;
            if(reportMatchFailures) {
              matchFailed('"\\\\"')
            }
          }
          if(result14 !== null) {
            var result12 = result14
          }else {
            var result13 = parse_LineTerminator();
            if(result13 !== null) {
              var result12 = result13
            }else {
              var result12 = null
            }
          }
        }
        reportMatchFailures = savedReportMatchFailuresVar0;
        if(result12 === null) {
          var result10 = ""
        }else {
          var result10 = null;
          pos = savedPos4
        }
        if(result10 !== null) {
          var result11 = parse_SourceCharacter();
          if(result11 !== null) {
            var result8 = [result10, result11]
          }else {
            var result8 = null;
            pos = savedPos3
          }
        }else {
          var result8 = null;
          pos = savedPos3
        }
        var result9 = result8 !== null ? function(char_) {
          return char_
        }(result8[1]) : null;
        if(result9 !== null) {
          var result7 = result9
        }else {
          var result7 = null;
          pos = savedPos2
        }
        if(result7 !== null) {
          var result0 = result7
        }else {
          var savedPos0 = pos;
          var savedPos1 = pos;
          if(input.substr(pos, 1) === "\\") {
            var result5 = "\\";
            pos += 1
          }else {
            var result5 = null;
            if(reportMatchFailures) {
              matchFailed('"\\\\"')
            }
          }
          if(result5 !== null) {
            var result6 = parse_EscapeSequence();
            if(result6 !== null) {
              var result3 = [result5, result6]
            }else {
              var result3 = null;
              pos = savedPos1
            }
          }else {
            var result3 = null;
            pos = savedPos1
          }
          var result4 = result3 !== null ? function(sequence) {
            return sequence
          }(result3[1]) : null;
          if(result4 !== null) {
            var result2 = result4
          }else {
            var result2 = null;
            pos = savedPos0
          }
          if(result2 !== null) {
            var result0 = result2
          }else {
            var result1 = parse_LineContinuation();
            if(result1 !== null) {
              var result0 = result1
            }else {
              var result0 = null
            }
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_SingleStringCharacter() {
        var cacheKey = "SingleStringCharacter@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos2 = pos;
        var savedPos3 = pos;
        var savedPos4 = pos;
        var savedReportMatchFailuresVar0 = reportMatchFailures;
        reportMatchFailures = false;
        if(input.substr(pos, 1) === "'") {
          var result15 = "'";
          pos += 1
        }else {
          var result15 = null;
          if(reportMatchFailures) {
            matchFailed('"\'"')
          }
        }
        if(result15 !== null) {
          var result12 = result15
        }else {
          if(input.substr(pos, 1) === "\\") {
            var result14 = "\\";
            pos += 1
          }else {
            var result14 = null;
            if(reportMatchFailures) {
              matchFailed('"\\\\"')
            }
          }
          if(result14 !== null) {
            var result12 = result14
          }else {
            var result13 = parse_LineTerminator();
            if(result13 !== null) {
              var result12 = result13
            }else {
              var result12 = null
            }
          }
        }
        reportMatchFailures = savedReportMatchFailuresVar0;
        if(result12 === null) {
          var result10 = ""
        }else {
          var result10 = null;
          pos = savedPos4
        }
        if(result10 !== null) {
          var result11 = parse_SourceCharacter();
          if(result11 !== null) {
            var result8 = [result10, result11]
          }else {
            var result8 = null;
            pos = savedPos3
          }
        }else {
          var result8 = null;
          pos = savedPos3
        }
        var result9 = result8 !== null ? function(char_) {
          return char_
        }(result8[1]) : null;
        if(result9 !== null) {
          var result7 = result9
        }else {
          var result7 = null;
          pos = savedPos2
        }
        if(result7 !== null) {
          var result0 = result7
        }else {
          var savedPos0 = pos;
          var savedPos1 = pos;
          if(input.substr(pos, 1) === "\\") {
            var result5 = "\\";
            pos += 1
          }else {
            var result5 = null;
            if(reportMatchFailures) {
              matchFailed('"\\\\"')
            }
          }
          if(result5 !== null) {
            var result6 = parse_EscapeSequence();
            if(result6 !== null) {
              var result3 = [result5, result6]
            }else {
              var result3 = null;
              pos = savedPos1
            }
          }else {
            var result3 = null;
            pos = savedPos1
          }
          var result4 = result3 !== null ? function(sequence) {
            return sequence
          }(result3[1]) : null;
          if(result4 !== null) {
            var result2 = result4
          }else {
            var result2 = null;
            pos = savedPos0
          }
          if(result2 !== null) {
            var result0 = result2
          }else {
            var result1 = parse_LineContinuation();
            if(result1 !== null) {
              var result0 = result1
            }else {
              var result0 = null
            }
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_RegularExpressionLiteralCharacter() {
        var cacheKey = "RegularExpressionLiteralCharacter@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos3 = pos;
        var savedPos4 = pos;
        if(input.substr(pos, 1) === "\\") {
          var result13 = "\\";
          pos += 1
        }else {
          var result13 = null;
          if(reportMatchFailures) {
            matchFailed('"\\\\"')
          }
        }
        if(result13 !== null) {
          if(input.substr(pos, 1) === "/") {
            var result14 = "/";
            pos += 1
          }else {
            var result14 = null;
            if(reportMatchFailures) {
              matchFailed('"/"')
            }
          }
          if(result14 !== null) {
            var result11 = [result13, result14]
          }else {
            var result11 = null;
            pos = savedPos4
          }
        }else {
          var result11 = null;
          pos = savedPos4
        }
        var result12 = result11 !== null ? function(slash) {
          return slash
        }(result11[1]) : null;
        if(result12 !== null) {
          var result10 = result12
        }else {
          var result10 = null;
          pos = savedPos3
        }
        if(result10 !== null) {
          var result0 = result10
        }else {
          var savedPos0 = pos;
          var savedPos1 = pos;
          var savedPos2 = pos;
          var savedReportMatchFailuresVar0 = reportMatchFailures;
          reportMatchFailures = false;
          if(input.substr(pos, 1) === "/") {
            var result9 = "/";
            pos += 1
          }else {
            var result9 = null;
            if(reportMatchFailures) {
              matchFailed('"/"')
            }
          }
          if(result9 !== null) {
            var result7 = result9
          }else {
            var result8 = parse_LineTerminator();
            if(result8 !== null) {
              var result7 = result8
            }else {
              var result7 = null
            }
          }
          reportMatchFailures = savedReportMatchFailuresVar0;
          if(result7 === null) {
            var result5 = ""
          }else {
            var result5 = null;
            pos = savedPos2
          }
          if(result5 !== null) {
            var result6 = parse_SourceCharacter();
            if(result6 !== null) {
              var result3 = [result5, result6]
            }else {
              var result3 = null;
              pos = savedPos1
            }
          }else {
            var result3 = null;
            pos = savedPos1
          }
          var result4 = result3 !== null ? function(char_) {
            return char_
          }(result3[1]) : null;
          if(result4 !== null) {
            var result2 = result4
          }else {
            var result2 = null;
            pos = savedPos0
          }
          if(result2 !== null) {
            var result0 = result2
          }else {
            var result1 = parse_LineContinuation();
            if(result1 !== null) {
              var result0 = result1
            }else {
              var result0 = null
            }
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_LineContinuation() {
        var cacheKey = "LineContinuation@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        if(input.substr(pos, 1) === "\\") {
          var result3 = "\\";
          pos += 1
        }else {
          var result3 = null;
          if(reportMatchFailures) {
            matchFailed('"\\\\"')
          }
        }
        if(result3 !== null) {
          var result4 = parse_LineTerminatorSequence();
          if(result4 !== null) {
            var result1 = [result3, result4]
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(sequence) {
          return sequence
        }(result1[1]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_EscapeSequence() {
        var cacheKey = "EscapeSequence@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var result9 = parse_CharacterEscapeSequence();
        if(result9 !== null) {
          var result0 = result9
        }else {
          var savedPos0 = pos;
          var savedPos1 = pos;
          if(input.substr(pos, 1) === "0") {
            var result6 = "0";
            pos += 1
          }else {
            var result6 = null;
            if(reportMatchFailures) {
              matchFailed('"0"')
            }
          }
          if(result6 !== null) {
            var savedPos2 = pos;
            var savedReportMatchFailuresVar0 = reportMatchFailures;
            reportMatchFailures = false;
            var result8 = parse_DecimalDigit();
            reportMatchFailures = savedReportMatchFailuresVar0;
            if(result8 === null) {
              var result7 = ""
            }else {
              var result7 = null;
              pos = savedPos2
            }
            if(result7 !== null) {
              var result4 = [result6, result7]
            }else {
              var result4 = null;
              pos = savedPos1
            }
          }else {
            var result4 = null;
            pos = savedPos1
          }
          var result5 = result4 !== null ? function() {
            return"\x00"
          }() : null;
          if(result5 !== null) {
            var result3 = result5
          }else {
            var result3 = null;
            pos = savedPos0
          }
          if(result3 !== null) {
            var result0 = result3
          }else {
            var result2 = parse_HexEscapeSequence();
            if(result2 !== null) {
              var result0 = result2
            }else {
              var result1 = parse_UnicodeEscapeSequence();
              if(result1 !== null) {
                var result0 = result1
              }else {
                var result0 = null
              }
            }
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_CharacterEscapeSequence() {
        var cacheKey = "CharacterEscapeSequence@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var result2 = parse_SingleEscapeCharacter();
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result1 = parse_NonEscapeCharacter();
          if(result1 !== null) {
            var result0 = result1
          }else {
            var result0 = null
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_SingleEscapeCharacter() {
        var cacheKey = "SingleEscapeCharacter@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        if(input.substr(pos).match(/^['"\\bfnrtv]/) !== null) {
          var result1 = input.charAt(pos);
          pos++
        }else {
          var result1 = null;
          if(reportMatchFailures) {
            matchFailed("['\"\\\\bfnrtv]")
          }
        }
        var result2 = result1 !== null ? function(char_) {
          return char_.replace("b", "\b").replace("f", "\f").replace("n", "\n").replace("r", "\r").replace("t", "\t").replace("v", "\x0B")
        }(result1) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_NonEscapeCharacter() {
        var cacheKey = "NonEscapeCharacter@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        var savedPos2 = pos;
        var savedReportMatchFailuresVar0 = reportMatchFailures;
        reportMatchFailures = false;
        var result7 = parse_EscapeCharacter();
        reportMatchFailures = savedReportMatchFailuresVar0;
        if(result7 === null) {
          var result6 = ""
        }else {
          var result6 = null;
          pos = savedPos2
        }
        if(result6 !== null) {
          var result3 = result6
        }else {
          var result5 = parse_LineTerminator();
          if(result5 !== null) {
            var result3 = result5
          }else {
            var result3 = null
          }
        }
        if(result3 !== null) {
          var result4 = parse_SourceCharacter();
          if(result4 !== null) {
            var result1 = [result3, result4]
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(char_) {
          return char_
        }(result1[1]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_EscapeCharacter() {
        var cacheKey = "EscapeCharacter@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var result4 = parse_SingleEscapeCharacter();
        if(result4 !== null) {
          var result0 = result4
        }else {
          var result3 = parse_DecimalDigit();
          if(result3 !== null) {
            var result0 = result3
          }else {
            if(input.substr(pos, 1) === "x") {
              var result2 = "x";
              pos += 1
            }else {
              var result2 = null;
              if(reportMatchFailures) {
                matchFailed('"x"')
              }
            }
            if(result2 !== null) {
              var result0 = result2
            }else {
              if(input.substr(pos, 1) === "u") {
                var result1 = "u";
                pos += 1
              }else {
                var result1 = null;
                if(reportMatchFailures) {
                  matchFailed('"u"')
                }
              }
              if(result1 !== null) {
                var result0 = result1
              }else {
                var result0 = null
              }
            }
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_HexEscapeSequence() {
        var cacheKey = "HexEscapeSequence@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        if(input.substr(pos, 1) === "x") {
          var result3 = "x";
          pos += 1
        }else {
          var result3 = null;
          if(reportMatchFailures) {
            matchFailed('"x"')
          }
        }
        if(result3 !== null) {
          var result4 = parse_HexDigit();
          if(result4 !== null) {
            var result5 = parse_HexDigit();
            if(result5 !== null) {
              var result1 = [result3, result4, result5]
            }else {
              var result1 = null;
              pos = savedPos1
            }
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(h1, h2) {
          return String.fromCharCode(parseInt("0x" + h1 + h2))
        }(result1[1], result1[2]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_UnicodeEscapeSequence() {
        var cacheKey = "UnicodeEscapeSequence@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        if(input.substr(pos, 1) === "u") {
          var result3 = "u";
          pos += 1
        }else {
          var result3 = null;
          if(reportMatchFailures) {
            matchFailed('"u"')
          }
        }
        if(result3 !== null) {
          var result4 = parse_HexDigit();
          if(result4 !== null) {
            var result5 = parse_HexDigit();
            if(result5 !== null) {
              var result6 = parse_HexDigit();
              if(result6 !== null) {
                var result7 = parse_HexDigit();
                if(result7 !== null) {
                  var result1 = [result3, result4, result5, result6, result7]
                }else {
                  var result1 = null;
                  pos = savedPos1
                }
              }else {
                var result1 = null;
                pos = savedPos1
              }
            }else {
              var result1 = null;
              pos = savedPos1
            }
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(h1, h2, h3, h4) {
          return String.fromCharCode(parseInt("0x" + h1 + h2 + h3 + h4))
        }(result1[1], result1[2], result1[3], result1[4]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_AndToken() {
        var cacheKey = "AndToken@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 3) === "and") {
          var result0 = "and";
          pos += 3
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed('"and"')
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_OrToken() {
        var cacheKey = "OrToken@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 2) === "or") {
          var result0 = "or";
          pos += 2
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed('"or"')
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_NotToken() {
        var cacheKey = "NotToken@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 3) === "not") {
          var result0 = "not";
          pos += 3
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed('"not"')
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_BreakToken() {
        var cacheKey = "BreakToken@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 5) === "break") {
          var result0 = "break";
          pos += 5
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed('"break"')
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_ElseToken() {
        var cacheKey = "ElseToken@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 4) === "else") {
          var result0 = "else";
          pos += 4
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed('"else"')
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_FalseToken() {
        var cacheKey = "FalseToken@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 5) === "false") {
          var result0 = "false";
          pos += 5
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed('"false"')
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_ForToken() {
        var cacheKey = "ForToken@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 3) === "for") {
          var result0 = "for";
          pos += 3
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed('"for"')
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_InToken() {
        var cacheKey = "InToken@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 2) === "in") {
          var result0 = "in";
          pos += 2
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed('"in"')
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_IfToken() {
        var cacheKey = "IfToken@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 2) === "if") {
          var result0 = "if";
          pos += 2
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed('"if"')
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_NullToken() {
        var cacheKey = "NullToken@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 4) === "null") {
          var result0 = "null";
          pos += 4
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed('"null"')
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_ReturnToken() {
        var cacheKey = "ReturnToken@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 6) === "return") {
          var result0 = "return";
          pos += 6
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed('"return"')
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_TrueToken() {
        var cacheKey = "TrueToken@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 4) === "true") {
          var result0 = "true";
          pos += 4
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed('"true"')
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_RequireToken() {
        var cacheKey = "RequireToken@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        if(input.substr(pos, 7) === "require") {
          var result0 = "require";
          pos += 7
        }else {
          var result0 = null;
          if(reportMatchFailures) {
            matchFailed('"require"')
          }
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_Program() {
        var cacheKey = "Program@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var result3 = parse_Statements();
        var result1 = result3 !== null ? result3 : "";
        var result2 = result1 !== null ? function(statements) {
          return{type:"Program", statements:statements !== "" ? statements : [], interpret:function(interpreter) {
            var statements = this.statements;
            for(var i = this.statements.length - 1;i >= 0;i--) {
              interpreter.stmt_stack.push(this.statements[i])
            }
            interpreter.interpretNext()
          }, accept:function(visitor) {
            visitor.visitProgram(this)
          }}
        }(result1) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function parse_Statements() {
        var cacheKey = "Statements@" + pos;
        var cachedResult = cache[cacheKey];
        if(cachedResult) {
          pos = cachedResult.nextPos;
          return cachedResult.result
        }
        var savedPos0 = pos;
        var savedPos1 = pos;
        var result3 = parse_Statement();
        if(result3 !== null) {
          var result4 = [];
          var savedPos2 = pos;
          var result8 = parse___();
          if(result8 !== null) {
            var result9 = parse_Statement();
            if(result9 !== null) {
              var result7 = [result8, result9]
            }else {
              var result7 = null;
              pos = savedPos2
            }
          }else {
            var result7 = null;
            pos = savedPos2
          }
          while(result7 !== null) {
            result4.push(result7);
            var savedPos2 = pos;
            var result8 = parse___();
            if(result8 !== null) {
              var result9 = parse_Statement();
              if(result9 !== null) {
                var result7 = [result8, result9]
              }else {
                var result7 = null;
                pos = savedPos2
              }
            }else {
              var result7 = null;
              pos = savedPos2
            }
          }
          if(result4 !== null) {
            var result5 = parse___();
            if(result5 !== null) {
              var result6 = parse_ReturnStatement();
              if(result6 !== null) {
                var result1 = [result3, result4, result5, result6]
              }else {
                var result1 = null;
                pos = savedPos1
              }
            }else {
              var result1 = null;
              pos = savedPos1
            }
          }else {
            var result1 = null;
            pos = savedPos1
          }
        }else {
          var result1 = null;
          pos = savedPos1
        }
        var result2 = result1 !== null ? function(head, tail, ret_stmt) {
          var result = [head];
          for(var i = 0;i < tail.length;i++) {
            result.push(tail[i][1])
          }
          result.push(ret_stmt);
          return result
        }(result1[0], result1[1], result1[3]) : null;
        if(result2 !== null) {
          var result0 = result2
        }else {
          var result0 = null;
          pos = savedPos0
        }
        cache[cacheKey] = {nextPos:pos, result:result0};
        return result0
      }
      function buildErrorMessage() {
        function buildExpected(failuresExpected) {
          failuresExpected.sort();
          var lastFailure = null;
          var failuresExpectedUnique = [];
          for(var i = 0;i < failuresExpected.length;i++) {
            if(failuresExpected[i] !== lastFailure) {
              failuresExpectedUnique.push(failuresExpected[i]);
              lastFailure = failuresExpected[i]
            }
          }
          switch(failuresExpectedUnique.length) {
            case 0:
              return"end of input";
            case 1:
              return failuresExpectedUnique[0];
            default:
              return failuresExpectedUnique.slice(0, failuresExpectedUnique.length - 1).join(", ") + " or " + failuresExpectedUnique[failuresExpectedUnique.length - 1]
          }
        }
        var expected = buildExpected(rightmostMatchFailuresExpected);
        var actualPos = Math.max(pos, rightmostMatchFailuresPos);
        var actual = actualPos < input.length ? quote(input.charAt(actualPos)) : "end of input";
        return"Expected " + expected + " but " + actual + " found."
      }
      function computeErrorPosition() {
        var line = 1;
        var column = 1;
        var seenCR = false;
        for(var i = 0;i < rightmostMatchFailuresPos;i++) {
          var ch = input.charAt(i);
          if(ch === "\n") {
            if(!seenCR) {
              line++
            }
            column = 1;
            seenCR = false
          }else {
            if(ch === "\r" | ch === "\u2028" || ch === "\u2029") {
              line++;
              column = 1;
              seenCR = true
            }else {
              column++;
              seenCR = false
            }
          }
        }
        return{line:line, column:column}
      }
      this.VERSION = "0.2.1";
      function binaryOperator(left, operator, right) {
        switch(operator) {
          case "+":
            return left + right;
          case "-":
            return left - right;
          case "*":
            return left * right;
          case "/":
            return left / right;
          case "%":
            return left % right;
          case "<":
            return left < right;
          case ">":
            return left > right;
          case "<=":
            return left <= right;
          case ">=":
            return left >= right;
          case "==":
            return left == right;
          case "!=":
            return left != right;
          default:
            return undefined
        }
      }
      function unaryOperator(operator, val) {
        switch(operator) {
          case "+":
            return+val;
          case "-":
            return-val;
          case "~":
            return~val;
          case "not":
            return!val;
          default:
            return undefined
        }
      }
      function compare(a, b) {
        if(a instanceof Array && b instanceof Array) {
          if(a.length !== b.length) {
            return false
          }else {
            for(var i = 0;i < a.length;i++) {
              if(a[i] != b[i]) {
                return false
              }
            }
            return true
          }
        }else {
          return a == b
        }
      }
      function absolute_index(index, value) {
        if(value === undefined || index === undefined) {
          return undefined
        }
        index = parseInt(index);
        if(isNaN(index)) {
          return undefined
        }else {
          if(index < 0 && value.hasOwnProperty("length")) {
            index = value.length + index;
            if(index < 0) {
              index = 0
            }
          }
          return index
        }
      }
      var result = parseFunctions[startRule]();
      if(result === null || pos !== input.length) {
        var errorPosition = computeErrorPosition();
        throw new this.SyntaxError(buildErrorMessage(), errorPosition.line, errorPosition.column);
      }
      return result
    }, toSource:function() {
      return this._source
    }};
    result.SyntaxError = function(message, line, column) {
      this.name = "SyntaxError";
      this.message = message;
      this.line = line;
      this.column = column
    };
    result.SyntaxError.prototype = Error.prototype;
    return result
  }();


  // END CIUVO PARSER



    // Run parser
    var ast = com.ciuvo.csl.parser.parse(json.csl);

    var interpreter = new com.ciuvo.csl.Interpreter(document, window, function(res) {
      callback(res);
      interpreter.close()
    }, function(err) {
      console.error('csl interp finished with err', err);
      callback(err);
      interpreter.close()
    });
    interpreter.interpret(ast)


  };

}).call(this, jQuery);

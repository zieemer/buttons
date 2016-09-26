/*
 * Avast Online Security extension
 * Inserts Avast WebRep data into search results, etc.
 */

(function($){
  if(window.AvastWRC && window.AvastWRC.DOM) return false;

  // ignore rich text editors in iframes....
  if(document.getElementsByTagName("body").contentEditable) return false;

  function getImagePath(img) {
    return chrome.extension.getURL("common/ui/") + img;
  }

  var TIME_DELAY = 500;
  var SHOW_DELAY = 600;

  var RATING0 = chrome.i18n.getMessage("noRating");
  var RATING1 = chrome.i18n.getMessage("ratingTextPositive");
  var RATING2 = chrome.i18n.getMessage("ratingTextAverage");
  var RATING3 = chrome.i18n.getMessage("ratingTextBad");


  var ICON = ['se_icn_norating.png','se_icn_thumbup.png','se_icn_thumbneutral.png', 'se_icn_thumbdown.png'];

  var TOOLTIP_RATING_CLASSES = ['aos-tooltip-none', 'aos-tooltip-ok', 'aos-tooltip-attention', 'aos-tooltip-error'];
  var TOOLTIP_RATING_ICONS = ['icons/unknown.png', 'icons/ok.png', 'icons/attention.png', 'icons/error.png'];

  var CSSID = "wrc-css";
  var WRCHOVERDIVID = "wrchoverdiv";
  var WRCHOVERDIVIDSEL = '#' + WRCHOVERDIVID + ' ';
  var WRCHOVERDIVCONTENT = 
    '<div id="wrccontainer" class="aos-tooltip">'+
        '<div class="aos-tooltip-arrow"></div>'+
        '<a href="" class="aos-tooltip-logo">' +
            '<span class="aos-tooltip-logo-img"></span>' +
            '<span class="aos-tooltip-logo-text">Online Security</span>' +
        '</a>'+
  		'<div id="wrcratingicon" class="aos-tooltip-icon" style="background-image: url(' + getImagePath(TOOLTIP_RATING_ICONS[0]) + ')"></div>'+
      '<div id="wrcratingtext" class="aos-tooltip-text">' + RATING0 + '</div>'+
  	'</div>';

  var WRCHOVERDIV = 
    "<div id='"+WRCHOVERDIVID+"'>"+
   	  WRCHOVERDIVCONTENT +
   	"</div>";

  var POPUP_RULES = [
    '.wrc_icon {margin:-2px 0 0 15px;padding:0; position: absolute; width:22px !important; height:22px !important; background-size: contain !important; line-height:16px !important;}',
    
    '{position:absolute; margin: 0 0 0 20px; display:none; z-index:9999999;}',
    '.aos-tooltip { position: absolute; width: 200px; height: auto; background-color: #a5abb2; color: #fff; border-radius: 4px; box-shadow: 0 0 0 1px rgba(255,255,255,0.8); }',
    '.aos-tooltip-arrow { right: 100%; top:75px; border: solid transparent; height: 0; width: 0; position: absolute; border-color: rgba(128, 128, 128, 0); border-right-color: #a5abb2; border-width: 7px; }',
    '.aos-tooltip-icon { background: no-repeat center 15px / 50px; margin: 0 auto; padding-top:15px; height:50px; border-top: solid 1px rgba(255,255,255,.3)}',
    '.aos-tooltip-text { padding: 12px 10px 15px; line-height: 18px; font-size: 14px; font-weight: 300; text-transform: uppercase; font-family: "Open Sans", "Helvetica Neue", Helvetica, Arial, sans-serif; text-align:center;}',
    '.aos-tooltip-text strong { font-weight: 600; }',
    '.aos-tooltip-ok { background-color: #4bbf60; }',
    '.aos-tooltip-ok .aos-tooltip-arrow { border-right-color: #4bbf60; }',
    '.aos-tooltip-error { background-color: #c93838; }',
    '.aos-tooltip-error .aos-tooltip-arrow { border-right-color: #c93838; }',
    '.aos-tooltip-attention { background-color: #ecd047; color: #282828; }',
    '.aos-tooltip-attention .aos-tooltip-arrow { border-right-color: #ecd047; }',
    '.aos-tooltip-logo {color: #fff;text-decoration: none; font-size:12px; border-bottom: solid 1px rgba(0,0,0,.1); display:block; height:45px; line-height:45px;text-align:center;}',
	'.aos-tooltip-logo:hover {color: inherit !important;}',
    '.aos-tooltip-logo-text {vertical-align: top;}',
    '.aos-tooltip-logo-img {width:64px;height:25px;display:inline-block;margin:10px 8px 0 0;background: url("'+getImagePath("bgs/logo-avast-white.png")+'") no-repeat center center;background-size:contain;}',
    '.aos-tooltip-attention .aos-tooltip-logo {color:#282828;}',
    '.aos-tooltip-attention .aos-tooltip-logo-img {background-image:url("'+getImagePath("bgs/logo-avast-dark.png")+'")}'

   ];
  for(var i=1; i < POPUP_RULES.length; i++) {
    POPUP_RULES[i] = WRCHOVERDIVIDSEL + POPUP_RULES[i];
  }

  var POPUP_CSS = POPUP_RULES.join('\n');

  var timer = null;
  var showTimer = null;
  var port = null;
  var lastDomains = null;
  var domainsTimer = null;
  //var domains = null;

  var css = document.getElementById(CSSID);

  if($('#avast_os_ext_custom_font').length === 0) {
    $('head')
      .append("<link id='avast_os_ext_custom_font' href='//fonts.googleapis.com/css?family=Open+Sans:600,300&subset=latin,latin-ext,cyrillic,greek' rel='stylesheet' type='text/css'>");
  }


  if(css == null) {

    var styleCode = [];

  	var imgPath = chrome.extension.getURL("common/ui/icons/");
      // prepare CSS chunk for WRC icons
  	
    function constructCSSPart(styleOpts, markerClass, markerIcon) {
      return styleOpts.replace(new RegExp("WRCN", "g"), markerClass).replace(new RegExp("IMAGE", "g"), markerIcon);
    }  

    var STYLE_RULES = [
      { icon: 'serp-none.png', mCls: ['wrcx','wrc0'] },
      { icon: 'serp-ok.png', mCls: ['wrc11','wrc12','wrc13'] },
      { icon: 'serp-attention.png', mCls: ['wrc21','wrc22','wrc23'] },
      { icon: 'serp-error.png', mCls: ['wrc31','wrc32','wrc33'] }
    ];
    for (var ir=0, rl=STYLE_RULES.length; ir < rl; ir++) {
      var sr = STYLE_RULES[ir];
      for (var ic=0, cl=sr.mCls.length; ic < cl; ic++) {
        styleCode.push(constructCSSPart(styleOpts, sr.mCls[ic], imgPath + sr.icon));
      }
    }

    styleCode.push(POPUP_CSS);

  	var head = document.getElementsByTagName("head")[0];
  	css = document.createElement("style");
    css.id = CSSID;
    css.type = "text/css";
    css.innerHTML = styleCode.join('\n');
    head.appendChild(css);
  }





if(!AvastWRC) var AvastWRC = {};
$.extend(AvastWRC, {
    CONFIG : CONFIG,
    DOM : {
        initialize : function(){

            this.openPort();
            this.bindEvents();

            if (AvastWRC.CONFIG.ENABLE_SERP_POPUP) {
                this.Popup.initialize();
            }
        },
        port : null,
        openPort : function(){

            // should be extended by browser specific features.

        },
        /** Listen to dom changes and validate new results */
        bindEvents : function() {
            var self = this;
            $(document).ready(function(){
                self.runningRequest = true;
                setTimeout(function(){
                    self.loadRatings();
                },100);
            });
            document.addEventListener("DOMNodeInserted", {
                handleEvent: function(ev) {
                    // there is a request already running...stop right here.
                    if(self.runningRequest) return;

                    var $target = $(ev.target),
                        id = $target.attr("id"),
                        elmclass = $target.attr("class");

                    // trigger request for DOM changes, but ignore for wrccontainer
                    if($target && ev.target.nodeType === 1 &&
                        id !== "wrccontainer" && id !== "wrchoverdiv" && elmclass.indexOf('wrc_icon') < 0 )
                    {
                        clearTimeout(self.timer);
                        self.runningRequest = true;
                        self.timer = window.setTimeout(function() {
                            self.loadRatings();
                        }, 500);
                    }
                }
            }, false);
        },
        /** Load ratings for current page */
        loadRatings : function(){
            var anchors = this.mapAnchors($(document));
            this.sendRequest(anchors, function(rankings) {
                AvastWRC.DOM.mapResults(anchors, rankings);
                this.runningRequest = false;
            }.bind(this));
        },
        /** Retrieve ratings */
        sendRequest : function() {

            // This function is extended by browser specific function

        },

        /**
         * Harvest all anchors, filter them for evaluation
         */
        mapAnchors : function(context){
            var self = this;
            var ud = self.Utils.getDomainFromUrl(document.URL);
            // reset anchor map
            var anchors = [];
            $("a", context).each(function(){
                var $a = $(this),
                    href = $a.attr("href"),
                    aclass = $a.attr("class"),
                    u, d;
                if(href !== "" && href !== undefined && aclass.indexOf('avast') < 0) {
                    u = self.Utils.retrieveTargetUrl(href);
                    d = self.Utils.getDomainFromUrl(u);
                    if(d !== null) {
                        if(d != ud) {
                            anchors.push({
                                url : u,
                                $a : $a
                            });
                        }
                    }
                }
            });
            return anchors;
        },
        /**
         * Bind results to all harvested anchors
         */
        mapResults : function (anchors, rankings) {
            for(var i = 0, j = anchors.length; i < j; i++) {
                var anchor = anchors[i];
                var url = anchor.url;
                var rank = rankings[url];
                if(anchor.$a.attr('wrc_done') === undefined && rank) {
                    var rt = ""+rank.rating+"3";
                    if(rt == "00" || rt == "01" || rt == "02" || rt == "03") rt = "0";
                    var cls = "wrc"+rt;
                    anchor.$a.attr('wrc_done','true').after("&nbsp;<span class='wrc_icon "+cls+"' rating='"+JSON.stringify(rank)+"'></span>");
                }
            }
        },
        /***************************************************************************
         *
         *  Handle popup dialog
         *
         **************************************************************************/
        Popup : {
            initialize: function(){
                if($('#wrchoverdiv').length > 0) return;

                this.$popup = $(WRCHOVERDIV);
    			$("body").append(this.$popup);

                 var self = this;

                // add popup messages for ratings
        		$(".wrc_icon").live('mouseover',function(e) {
                    clearTimeout(self.hideTimer)
        			self.showTimer = setTimeout(function(){ self.show(e);}, SHOW_DELAY);
        		});
        		$(".wrc_icon").live('mouseout',function(e) {
        			self.hideTimer = setTimeout(function(e){ self.hide(false)},TIME_DELAY);
        			if(self.showTimer) clearTimeout(self.showTimer);
        		});

                // Disable popup timeout when hoverin over it.
            	$(this.$popup).bind('mouseover',function(e) {
            		if(self.hideTimer) clearTimeout(self.hideTimer);
            		self.hideTimer = null;
            	});
            	$(this.$popup).bind('mouseout',function(e) {
            		self.hideTimer = setTimeout(function(e){ self.hide(false)},TIME_DELAY);
            	});

            },
            showTimer : null,
            hideTimer : null,
            /** hide popup window */
            hide : function() {
    	        if(this.hideTimer) clearTimeout(this.hideTimer);
            	this.hideTimer = null;

                this.$popup.html('');//fadeOut("fast");
            },
            /** show popup window */
            show : function(e){
                // hide previously opened popups
                this.hide(true);

                // reset contents
                this.$popup.html(WRCHOVERDIVCONTENT);


                var $a = $(e.target);
            	var aHref = $a.prev().attr('href');

                // parse ratings
            	var rat = JSON.parse($a.attr('rating'));
                if(rat) {
                    var rating = rat.rating;
                    var addClass = ''; removeClasses = '';
                    for (var i = 0; i < TOOLTIP_RATING_CLASSES.length; i++) {
                        if (i === rating) {
                            addClass = TOOLTIP_RATING_CLASSES[i];
                        } else {
                            removeClasses += TOOLTIP_RATING_CLASSES[i] + ' ';
                        }
                    }
                    $('#wrccontainer', this.$popup).removeClass(removeClasses).addClass(addClass);
                    $('#wrcratingtext', this.$popup).html(AvastWRC.DOM.Utils.getRatingText(rating));
                    $('#wrcratingicon',this.$popup)
                        .css('background-image', ' url(' + getImagePath(TOOLTIP_RATING_ICONS[rating]) + ')');
            	}

            	var x = $a.offset().left + 25;
            	var y = $a.offset().top - 70;
            	this.$popup.css({
            		'left':x,
            		'top':y
            	}).show(); //fadein();
            }
        },
        /** Common functions */
        Utils : {
          getRatingText : function (rating){
          	switch(rating){
          		case 0: return RATING0;
          		case 1: return RATING1;
          		case 2: return RATING2;
          		case 3: return RATING3;
          		default: return RATING0;
          	}
          },

            /**
             * Retrieve domain from given URL.
             */
            getDomainFromUrl : function (url) {
            	 var matches = url.match(new RegExp("^(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(www.)?([a-z0-9\-\.]+[a-z]{2,6})(:[0-9]+)?(.*)?$"));
                 if((matches) && (matches.length>4))
                 {
                     // var protocol = matches[1];
                     // var credentials = matches[2];
                     // var www = matches[3];
                     var domain = matches[4];
                     // var wport = matches[5];
                     return domain;
                 }
                 return null;
            },

            /**
             * Attampt to retrive target url if URL is redirector URL. Otherwise return the URL itself.
             */
            retrieveTargetUrl : function (url) {
                var target = this.getTargetFromRedirectorUrl(url);
                return (target != null) ? (target.indexOf('http') != 0 ? "http://" : '') + target : url;
            },

            /**
             * Recognizes target urls inside arbitrary redirector urls (also handles base64 encoded urls)
             */
            getTargetFromRedirectorUrl : function (url){
            	var args = this.getUrlVars(url);

            	for(var p in args) {
                    if(args.hasOwnProperty(p)) {
            	        //This regexp extracts domain from URL encoded address of type http
            	        try {
            		        //Matches URLs starting with http(s)://domain.com http(s)://www.domain.com www.domain.com
            		        //optionally followed by path and GET parameters
            		        //If successfull then matches[4] holds the domain name with the www. part stripped

            		        var re = /((https?\:\/\/(www\.)?|www\.)(([\w|\-]+\.)+(\w+)))([\/#\?].*)?/;
            		        var decoded = decodeURIComponent(args[p]);
            		        var matches = decoded.match(re);
            		        if(matches) {
            		        	return matches[2]+matches[4];
            		        }

            		        var b64decoded = atob(decoded);
            		        matches = b64decoded.match(re);
            		        if(matches) {
            		        	return matches[2]+matches[4];
            		        }
            	        }
            	        catch(e)
            	        {
            		        //alert("Exception: "+JSON.stringify(e));
            	        }
                    }
                }
                return null;
            },

            getUrlVars : function (url){
                //Creates an associative array of GET URL parameters
                var vars = {};

                var parts = url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m, key, value) {
                     vars[key] = value;
                });
                return vars;
            }

        } // DOM.Utils
    }
});

/*******************************************************************************
 *
 *  Chrome specific functions
 *
 ******************************************************************************/

$.extend(AvastWRC.DOM, {
    responseCallback : null,
    sendRequest : function(anchors, callback) {
        this.responseCallback = callback;
        var urls = [];
        for (var i = 0, l = anchors.length; i < l; i++) {
            urls.push(anchors[i].url);
        }
        var msg = JSON.stringify(urls);
        this.port.postMessage({
            domains: msg
        });
    },
    openPort : function() {
        if(this.port == null) {
        	this.port = chrome.extension.connect({name: "wrc"+(new Date()).valueOf()});
        	this.port.onMessage.addListener(function(msg) {
                if (typeof this.responseCallback === 'function' ) {
                    this.responseCallback(msg.rankings);
                }
            }.bind(this));
        }
    }
});



// Start anchor monitoring
AvastWRC.DOM.initialize();
$.extend(window.AvastWRC, AvastWRC);

})(jQuery);   
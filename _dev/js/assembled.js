/* $Intense
 * Awesome fulscreen image viever by Tim Holman
 * http://tholman.com
 *
 * https://github.com/tholman/intense-images
 * The MIT License (MIT)
*/
window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

window.cancelRequestAnimFrame = ( function() {
    return window.cancelAnimationFrame          ||
        window.webkitCancelRequestAnimationFrame    ||
        window.mozCancelRequestAnimationFrame       ||
        window.oCancelRequestAnimationFrame     ||
        window.msCancelRequestAnimationFrame        ||
        clearTimeout
} )();


var Intense = (function() {

    'use strict';

    var KEYCODE_ESC = 27;

    // Track both the current and destination mouse coordinates
    // Destination coordinates are non-eased actual mouse coordinates
    var mouse = { xCurr:0, yCurr:0, xDest: 0, yDest: 0 };

    var horizontalOrientation = true;

    // Holds the animation frame id.
    var looper;
  
    // Current position of scrolly element
    var lastPosition, currentPosition = 0;
    
    var sourceDimensions, target;
    var targetDimensions = { w: 0, h: 0 };
  
    var container;
    var containerDimensions = { w: 0, h:0 };
    var overflowArea = { x: 0, y: 0 };

    // Overflow variable before screen is locked.
    var overflowValue;

    /* -------------------------
    /*          UTILS
    /* -------------------------*/

    //Detect ie
    function isIE () {
        var myNav = navigator.userAgent.toLowerCase();
        return (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
    }

    // Soft object augmentation
    function extend( target, source ) {

        for ( var key in source )

            if ( !( key in target ) )

                target[ key ] = source[ key ];

        return target;
    }

    // Applys a dict of css properties to an element
    function applyProperties( target, properties ) {

      for( var key in properties ) {
        target.style[ key ] = properties[ key ];
      }
    }

    // Returns whether target a vertical or horizontal fit in the page.
    // As well as the right fitting width/height of the image.
    function getFit( source ) {

      var heightRatio = window.innerHeight / source.h;

      if( (source.w * heightRatio) > window.innerWidth ) {
        return { w: source.w * heightRatio, h: source.h * heightRatio, fit: true };
      } else {
        var widthRatio = window.innerWidth / source.w;
        return { w: source.w * widthRatio, h: source.h * widthRatio, fit: false };
      }
    }

    /* -------------------------
    /*          APP
    /* -------------------------*/

    function startTracking( passedElements ) {

      var i;

      // If passed an array of elements, assign tracking to all.
      if ( passedElements ) {

        // Loop and assign
        for( i = 0; i < passedElements.length; i++ ) {
          track( passedElements[ i ] );
        }

      } else {
          track( passedElements );
      }
    }

    function track( element ) {

      // Element needs a src at minumun.
      if( element.getAttribute( 'data-image') || element.src ) {
        element.addEventListener( 'click', function() {
          init( this );
        }, false );
      }

      // Add some styles to a tracked elements
      var elementProperties = {
        'cursor': 'pointer',
        'webkitTransition': 'opacity 500ms',
        'MozTransition': 'opacity 500ms',
        'transition': 'opacity 500ms',
        'opacity': '1'
      }
      applyProperties( element, elementProperties );
      element.onmouseover = function(){
        this.style.opacity = '0.5';
      }
      element.onmouseout = function(){
        this.style.opacity = '1';
      }
    }
  
    function start() { 
      loop();
    }
   
    function stop() {
      cancelRequestAnimFrame( looper );
    }

    function loop() {
        looper = requestAnimFrame(loop);
        positionTarget();      
    }

    // Lock scroll on the document body.
    function lockBody() {

      overflowValue = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    // Unlock scroll on the document body.
    function unlockBody() {
      document.body.style.overflow = overflowValue;
    }

    function createViewer( title, caption ) {

      /*
       *  Container
       */
      var containerProperties = {
        'backgroundColor': 'rgba(0,0,0,0.8)',
        'width': '100%',
        'height': '100%',
        'position': 'fixed',
        'bottom': '0px',
        'right': '0px',
        'zIndex': '999999',
        'overflow': 'hidden',
        'margin': '0px',
        'padding': '0',
        'webkitTransition': 'opacity 150ms cubic-bezier( 0, 0, .26, 1 )',
        'MozTransition': 'opacity 150ms cubic-bezier( 0, 0, .26, 1 )',
        'transition': 'opacity 150ms cubic-bezier( 0, 0, .26, 1 )',
        'opacity': '0'
      }
      var figureProperties= {
        'width': '100%',
        'height': '100%',        
        'overflow': 'auto'
      }

      //for ie9 create wrapper and set scroll for figure     
      if (isIE() && isIE () < 10){
        container = document.createElement( 'div' );
        figure = document.createElement( 'figure' );
        container.appendChild( figure );
        figure.appendChild( target );
        applyProperties( container, containerProperties ); 
        applyProperties( figure, figureProperties );     
      } else{
        container = document.createElement( 'figure' );
        container.appendChild( target );
        applyProperties( container, containerProperties ); 
      }
      

      var imageProperties = {
        'cursor': 'url( "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDoAABSCAABFVgAADqXAAAXb9daH5AAAAP/SURBVHja5JpLaJ1FFMd/+YoKbSWNCS2aaJuQLmorPjbVlYsW1JK4srk2KuiyECgqRBNTfIAbcSvBhe1OF27Mo01MoWgWVbTWha+NTSmEiig2Si021/p3Mx8ch/uYme/m5hYPzOJ+9zz+/5n73TnnzLRJogHSDzwAPAx0u88dwGb3/RXgN+A8sAwsAueAH4sGbitAYCvwJDAEPARkkfbXgc+AD4EPgF+SUEiKHX2SJiX9ocbJ785nXyye2BV4DRgHbjLPVoEV4HPga+AHYAn4CbjsdDqA24E+YBdwP/AgsAW42fgqA28Crzd6Be6TdLbCrC1IGpG0O2EldzvbBefLypeS7g3xExJoSNI/xvmqpHlJJUntCcD90e58zTvfuVyXdLAogRFvZpYkvSRpWwOA+2Ob873kxRxJJXDEc/SppP1rANwf+10sK0diCRz0HExJ6m8C+Hz0u5hWngglsNMz/EhSdxPB56PbxbbSH0Lge2PwiSPEOo2dDkMu39UjMOG9sPvWEXw+9nkv9ng1Al1GqSxpVNKGFiCwwWEpG3ydlQi8axQ+ltQREeRpSZsj9G+V9EyEfofDlMukT6DTbFZX3MYS6vyos1uMsFl0NkcjbEoOW77JdVoCLxp2C26GQpxOeP8ScwE2c57NKxGrtmDsnrcEvnIPr9Xb+dxoqwA+hMRcFZsJ5zMkM7jmbM7mBO40jn6WtCfA0aE66fHJCjYn69gcCoi7x2HMpSd/AXOZDlzOnhqzWWkl5gN0ewJjTxu7pzJgr8muzwVm4cvAY8BsDZ1HgfeAY8AjNfRmna/lwNgW417/dzmU8D89W6ASm0mIN2R/qhmw3TC6kFCVDtRZiVozP5hgZzFuz4B28+BSYoE/GEliJhG8j7E9AzaZBysFOhyDwPEAvePA4wXiWIybMqAhjaG8TUOTJQOums9bCviaAZ4N0HvO6aaKxfhn5i3JHQXAD0S++KkkLMaVDLhoHvQmODwRCd6SOJFgZzFezFy/Mpe7E2b+QI3vj9V5sQ8krITFeB5JwwmpxF2STtXZpKarbP+V5JTzGZtKDKcmc6UI8KEkSqnJHKZtGJpO48q8SjJVw2aqis1oYEybTn9h64EXEguaMQ/IbELuNNaIguY2SX8nlpTjzu50hM3pSh2GiJKy7DD/p6ifLFDUlyRtjNDfGDlJflH/zo3eVumq1tgauwEaWy/Xay1+28KtxW9CeqO9Ldzc3RHaXh9owfb6QOwBx+EWOuA4/L88YrKnNeV1OORbrXYqE0sASfdIOtPEY9YzgUll9EH3KPAGcMsaHXT/BbwKvLWWVw16Jb0taaWBVw0uO5871vqqgZUuYLhBlz3eB35t9m2Vlrhu8+8ACTOGueBtHrIAAAAASUVORK5CYII=" ) 25 25, no-drop',
        'width': 'auto',
        'maxWidth': 'none'
      }
      applyProperties( target, imageProperties );

      /*
       *  Caption Container
       */
      var captionContainerProperties = {
        'fontFamily': 'Georgia, Times, "Times New Roman", serif',
        'position': 'fixed',
        'bottom': '10px',
        'left': '10px',
        'padding': '20px',
        'color': '#e2e2e2',
        'wordSpacing': '0.2px',
        'webkitFontSmoothing': 'antialiased',
        'textShadow': '1px 1px 1px #555'
      }
      var captionContainer = document.createElement( 'figcaption' );
      applyProperties( captionContainer, captionContainerProperties );

      /*
       *  Caption Title
       */
      if ( title ) {
        var captionTitleProperties = {
          'margin': '0px',
          'padding': '0px',
          'fontWeight': 'normal',
          'fontSize': '40px',
          'letterSpacing': '0.5px',
          'lineHeight': '35px',
          'textAlign': 'left'
        }
        var captionTitle = document.createElement( 'h1' );
        applyProperties( captionTitle, captionTitleProperties );
        captionTitle.innerHTML = title;
        captionContainer.appendChild( captionTitle );
      }

      if ( caption ) {
        var captionTextProperties = {
          'fontFamily': '"Open Sans Condensed", Georgia, Times, "Times New Roman", serif',  
          'margin': '0px',
          'padding': '0px',
          'fontWeight': 'normal',
          'fontSize': '30px',
          'letterSpacing': '0.1px',
          'maxWidth': '500px',
          'textAlign': 'left',
          'background': 'none',
          'marginTop': '5px'
        }
        var captionText = document.createElement( 'h2' );
        applyProperties( captionText, captionTextProperties );
        captionText.innerHTML = caption;
        captionContainer.appendChild( captionText );
      }
      if (isIE() && isIE () < 10){
        figure.appendChild( captionContainer );
      } else{
        container.appendChild( captionContainer );
      }  
      setDimensions();

      mouse.xCurr = mouse.xDest = window.innerWidth / 2;
      mouse.yCurr = mouse.yDest = window.innerHeight / 2;
      
      document.body.appendChild( container );
      setTimeout( function() {
        container.style[ 'opacity' ] = '1';
      }, 10);
    }

    function removeViewer() {

      unlockBody();
      unbindEvents();
      document.body.removeChild( container );
    }

    function setDimensions() {

      // Manually set height to stop bug where 
      var imageDimensions = getFit( sourceDimensions );
      target.width = imageDimensions.w;
      target.height = imageDimensions.h;
      horizontalOrientation = imageDimensions.fit;

      targetDimensions = { w: target.width, h: target.height };
      containerDimensions = { w: window.innerWidth, h: window.innerHeight };
      overflowArea = {x: containerDimensions.w - targetDimensions.w, y: containerDimensions.h - targetDimensions.h};

    }

    function init( element ) {

      var imageSource = element.getAttribute( 'data-image') || element.src;
      var title = element.getAttribute( 'data-title');
      var caption = element.getAttribute( 'alt');
      
      var img = new Image();
      img.onload = function() {

        sourceDimensions = { w: img.width, h: img.height }; // Save original dimensions for later.
        target = this;
        createViewer( title, caption );
        lockBody();
        bindEvents();
        loop();
      }

      img.src = imageSource;
    }

    function bindEvents() {

      container.addEventListener( 'mousemove', onMouseMove,   false );
      container.addEventListener( 'touchmove', onTouchMove,   false );
      window.addEventListener(    'resize',    setDimensions, false );
      window.addEventListener(    'keyup',     onKeyUp,       false );
      target.addEventListener(    'click',     removeViewer,  false );
    }

    function unbindEvents() {

      container.removeEventListener( 'mousemove', onMouseMove,   false );
      container.removeEventListener( 'touchmove', onTouchMove,   false);
      window.removeEventListener(    'resize',    setDimensions, false );
      window.removeEventListener(    'keyup',     onKeyUp,       false );
      target.removeEventListener(    'click',     removeViewer,  false )
    }
  
    function onMouseMove( event ) {

      mouse.xDest = event.clientX;
      mouse.yDest = event.clientY;
    }

    function onTouchMove( event ) {

      event.preventDefault(); // Needed to keep this event firing.
      mouse.xDest = event.touches[0].clientX;
      mouse.yDest = event.touches[0].clientY;
    }

    // Exit on excape key pressed;
    function onKeyUp( event ) {

      event.preventDefault();
      if ( event.keyCode === KEYCODE_ESC ) {
        removeViewer();
      } 
    }
  
    function positionTarget() {

      mouse.xCurr += ( mouse.xDest - mouse.xCurr ) * 0.05;
      mouse.yCurr += ( mouse.yDest - mouse.yCurr ) * 0.05;

      if ( horizontalOrientation === true ) {

        // HORIZONTAL SCANNING
        currentPosition += ( mouse.xCurr - currentPosition );
        if( mouse.xCurr !== lastPosition ) {
          var position = parseFloat( currentPosition / containerDimensions.w );
          position = overflowArea.x * position;
          target.style[ 'webkitTransform' ] = 'translate3d(' + position + 'px, 0px, 0px)';
          target.style[ 'MozTransform' ] = 'translate3d(' + position + 'px, 0px, 0px)';
          target.style[ 'msTransform' ] = 'translate3d(' + position + 'px, 0px, 0px)';
          lastPosition = mouse.xCurr;
        }
      } else if ( horizontalOrientation === false ) {

        // VERTICAL SCANNING
        currentPosition += ( mouse.yCurr - currentPosition );
        if( mouse.yCurr !== lastPosition ) {
          var position = parseFloat( currentPosition / containerDimensions.h );
          position = overflowArea.y * position;
          target.style[ 'webkitTransform' ] = 'translate3d( 0px, ' + position + 'px, 0px)';
          target.style[ 'MozTransform' ] = 'translate3d( 0px, ' + position + 'px, 0px)';
          target.style[ 'msTransform' ] = 'translate3d( 0px, ' + position + 'px, 0px)';
          lastPosition = mouse.yCurr;
        }
      }
    }

    function main( element ) {

      // Parse arguments

      if ( !element ) {
        throw 'You need to pass an element!';
      }

      startTracking( element );
    }

    return extend( main, {
        resize: setDimensions,
        start: start,
        stop: stop
    });

})();
(function() {
  (function($, window, document, undefined_) {
    "use strict";
    return $.fn.anchorScroll = function() {
      var $this;
      $this = this;
      $this.click(function() {
        var target;
        if (location.pathname.replace(/^\//, "") === this.pathname.replace(/^\//, "") && location.hostname === this.hostname) {
          target = $(this.hash);
          target = (target.length ? target : $("[name=" + this.hash.slice(1) + "]"));
          if (target.length) {
            $("html,body").animate({
              scrollTop: target.offset().top
            }, 1000);
            return false;
          }
        }
      });
      return this;
    };
  })(jQuery, window, document);

}).call(this);


/*
$Lazy load
Lazy Load - jQuery plugin for lazy loading images

Copyright (c) 2007-2013 Mika Tuupola

Licensed under the MIT license:
http://www.opensource.org/licenses/mit-license.php

Project home:
http://www.appelsiini.net/projects/lazyload

Version:  1.9.3
 */

(function() {
  (function($, window, document, undefined_) {
    var $window;
    $window = $(window);
    $.fn.lazyload = function(options) {
      var $container, elements, settings, update;
      update = function() {
        var counter;
        counter = 0;
        return elements.each(function() {
          var $this;
          $this = $(this);
          if (settings.skip_invisible && !$this.is(":visible")) {
            return;
          }
          if ($.abovethetop(this, settings) || $.leftofbegin(this, settings)) {

          } else if (!$.belowthefold(this, settings) && !$.rightoffold(this, settings)) {
            $this.trigger("appear");
            return counter = 0;
          } else {
            if (++counter > settings.failure_limit) {
              return false;
            }
          }
        });
      };
      elements = this;
      $container = void 0;
      settings = {
        threshold: 0,
        failure_limit: 0,
        event: "scroll",
        effect: "show",
        container: window,
        data_attribute: "src",
        skip_invisible: true,
        appear: null,
        load: null,
        placeholder: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXYzh8+PB/AAffA0nNPuCLAAAAAElFTkSuQmCC"
      };
      if (options) {
        if (undefined !== options.failurelimit) {
          options.failure_limit = options.failurelimit;
          delete options.failurelimit;
        }
        if (undefined !== options.effectspeed) {
          options.effect_speed = options.effectspeed;
          delete options.effectspeed;
        }
        $.extend(settings, options);
      }
      $container = (settings.container === undefined || settings.container === window ? $window : $(settings.container));
      if (0 === settings.event.indexOf("scroll")) {
        $container.bind(settings.event, function() {
          return update();
        });
      }
      this.each(function() {
        var $self, self;
        self = this;
        $self = $(self);
        self.loaded = false;
        if ($self.attr("src") === undefined || $self.attr("src") === false) {
          if ($self.is("img")) {
            $self.attr("src", settings.placeholder);
          }
        }
        $self.one("appear", function() {
          var elements_left;
          if (!this.loaded) {
            if (settings.appear) {
              elements_left = elements.length;
              settings.appear.call(self, elements_left, settings);
            }
            return $("<img />").bind("load", function() {
              var original, temp;
              original = $self.attr("data-" + settings.data_attribute);
              $self.hide();
              if ($self.is("img")) {
                $self.attr("src", original);
              } else {
                $self.css("background-image", "url('" + original + "')");
              }
              $self[settings.effect](settings.effect_speed);
              self.loaded = true;
              temp = $.grep(elements, function(element) {
                return !element.loaded;
              });
              elements = $(temp);
              if (settings.load) {
                elements_left = elements.length;
                return settings.load.call(self, elements_left, settings);
              }
            }).attr("src", $self.attr("data-" + settings.data_attribute));
          }
        });
        if (0 !== settings.event.indexOf("scroll")) {
          return $self.bind(settings.event, function() {
            if (!self.loaded) {
              return $self.trigger("appear");
            }
          });
        }
      });
      $window.bind("resize", function() {
        return update();
      });
      if (/(?:iphone|ipod|ipad).*os 5/g.test(navigator.appVersion)) {
        $window.bind("pageshow", function(event) {
          if (event.originalEvent && event.originalEvent.persisted) {
            return elements.each(function() {
              return $(this).trigger("appear");
            });
          }
        });
      }
      $(document).ready(function() {
        return update();
      });
      return this;
    };
    $.belowthefold = function(element, settings) {
      var fold;
      fold = void 0;
      if (settings.container === undefined || settings.container === window) {
        fold = (window.innerHeight ? window.innerHeight : $window.height()) + $window.scrollTop();
      } else {
        fold = $(settings.container).offset().top + $(settings.container).height();
      }
      return fold <= $(element).offset().top - settings.threshold;
    };
    $.rightoffold = function(element, settings) {
      var fold;
      fold = void 0;
      if (settings.container === undefined || settings.container === window) {
        fold = $window.width() + $window.scrollLeft();
      } else {
        fold = $(settings.container).offset().left + $(settings.container).width();
      }
      return fold <= $(element).offset().left - settings.threshold;
    };
    $.abovethetop = function(element, settings) {
      var fold;
      fold = void 0;
      if (settings.container === undefined || settings.container === window) {
        fold = $window.scrollTop();
      } else {
        fold = $(settings.container).offset().top;
      }
      return fold >= $(element).offset().top + settings.threshold + $(element).height();
    };
    $.leftofbegin = function(element, settings) {
      var fold;
      fold = void 0;
      if (settings.container === undefined || settings.container === window) {
        fold = $window.scrollLeft();
      } else {
        fold = $(settings.container).offset().left;
      }
      return fold >= $(element).offset().left + settings.threshold + $(element).width();
    };
    $.inviewport = function(element, settings) {
      return !$.rightoffold(element, settings) && !$.leftofbegin(element, settings) && !$.belowthefold(element, settings) && !$.abovethetop(element, settings);
    };
    return $.extend($.expr[":"], {
      "below-the-fold": function(a) {
        return $.belowthefold(a, {
          threshold: 0
        });
      },
      "above-the-top": function(a) {
        return !$.belowthefold(a, {
          threshold: 0
        });
      },
      "right-of-screen": function(a) {
        return $.rightoffold(a, {
          threshold: 0
        });
      },
      "left-of-screen": function(a) {
        return !$.rightoffold(a, {
          threshold: 0
        });
      },
      "in-viewport": function(a) {
        return $.inviewport(a, {
          threshold: 0
        });
      },
      "above-the-fold": function(a) {
        return !$.belowthefold(a, {
          threshold: 0
        });
      },
      "right-of-fold": function(a) {
        return $.rightoffold(a, {
          threshold: 0
        });
      },
      "left-of-fold": function(a) {
        return !$.rightoffold(a, {
          threshold: 0
        });
      }
    });
  })(jQuery, window, document);

}).call(this);

(function() {
  (function($, window, document, undefined_) {
    var NavKit, defaults;
    NavKit = function(element, options) {
      this.options = $.extend({}, defaults, options);
      this.element = element;
      return this.init();
    };
    defaults = {
      navAnchor: "js-anchor",
      navLink: "js-link",
      navIcon: "js-navtoggle",
      iconOpen: "is-open",
      activeLink: "is-active",
      state: "closed"
    };
    NavKit.prototype.init = function() {
      var $navAnchor, $navIcon, $navLink, $this, aArray, ahref, cond, i, link, navHeight;
      $this = $(this.element);
      $navAnchor = $("." + this.options.navAnchor);
      $navLink = $("." + this.options.navLink);
      $navIcon = $("." + this.options.navIcon);
      cond = this.options.state;
      navHeight = $this.show().height();
      aArray = [];
      i = void 0;
      if (!cond || cond === "closed") {
        $this.slideToggle();
        $navIcon.show();
      } else {
        $navIcon.show().addClass(this.options.iconOpen);
      }
      $navIcon.on("click", $.proxy(function(e) {
        e.preventDefault();
        $navIcon.toggleClass(this.options.iconOpen);
        return $this.slideToggle();
      }, this));
      $navAnchor.click(function() {
        var target;
        if (location.pathname.replace(/^\//, "") === this.pathname.replace(/^\//, "") && location.hostname === this.hostname) {
          target = $(this.hash);
          target = (target.length ? target : $("[name=" + this.hash.slice(1) + "]"));
          if (target.length) {
            $("html,body").animate({
              scrollTop: target.offset().top - navHeight
            }, 1000);
            return false;
          }
        }
      });
      i = 0;
      while (i < $navLink.length) {
        link = $navLink[i];
        ahref = $(link).attr("href");
        aArray.push(ahref);
        i += 1;
      }
      return $(window).scroll($.proxy(function() {
        var $firstSection, docHeight, sectHeight, sectPos, theID, windowHeight, windowPos;
        windowPos = $(window).scrollTop();
        windowHeight = $(window).height();
        docHeight = $(document).height();
        $firstSection = $("section").eq(0);
        i = 0;
        while (i < aArray.length) {
          theID = aArray[i];
          sectPos = $(theID).offset().top - navHeight;
          sectHeight = $(theID).height();
          if (windowPos >= sectPos && windowPos < (sectPos + sectHeight)) {
            $navLink.filter("[href='" + theID + "']").addClass(this.options.activeLink);
          } else {
            $navLink.filter("[href='" + theID + "']").removeClass(this.options.activeLink);
          }
          i += 1;
        }
        if (windowPos + windowHeight === docHeight) {
          if (!$this.find("li").filter(":last-child").find($navLink).hasClass(this.options.activeLink)) {
            $navLink.filter("." + this.options.activeLink).removeClass(this.options.activeLink);
            $this.find("li").filter(":last-child").find($navLink).addClass(this.options.activeLink);
          }
        }
        if (windowPos < $firstSection.offset().top) {
          if (!$this.find("li").filter(":first-child").find($navLink).hasClass(this.options.activeLink)) {
            $navLink.filter("." + this.options.activeLink).removeClass(this.options.activeLink);
            return $this.find("li").filter(":first-child").find($navLink).addClass(this.options.activeLink);
          }
        }
      }, this));
    };
    return $.fn.navKit = function(options) {
      return this.each(function() {
        return new NavKit(this, options);
      });
    };
  })(jQuery, window, document);

}).call(this);

(function() {
  (function($, window, document, undefined_) {
    var SimpleSpoiler, defaults;
    SimpleSpoiler = function(element, options) {
      this.options = $.extend({}, defaults, options);
      this.element = element;
      return this.init();
    };
    defaults = {
      spoilerPanel: "js-panel",
      spoilerClosed: "is-closed",
      state: "closed"
    };
    SimpleSpoiler.prototype.init = function() {
      var $spoilerPanel, $this, cond;
      $this = $(this.element);
      $spoilerPanel = $this.find("." + this.options.spoilerPanel);
      cond = this.options.state;
      if ((!cond || cond === "closed") && (!($this.hasClass(this.options.spoilerClosed)))) {
        $this.addClass(this.options.spoilerClosed);
      }
      return $spoilerPanel.on("click", $.proxy(function(e) {
        e.preventDefault();
        return $this.toggleClass(this.options.spoilerClosed);
      }, this));
    };
    return $.fn.simpleSpoiler = function(options) {
      return this.each(function() {
        return new SimpleSpoiler(this, options);
      });
    };
  })(jQuery, window, document);

}).call(this);

/* http://prismjs.com/download.html?themes=prism&languages=markup+css+clike+javascript+bash+coffeescript+css-extras+git+haml+handlebars+jade+less+makefile+markdown+php+ruby+sass+scss+sql+stylus+wiki+yaml */
self="undefined"!=typeof window?window:"undefined"!=typeof WorkerGlobalScope&&self instanceof WorkerGlobalScope?self:{};var Prism=function(){var e=/\blang(?:uage)?-(?!\*)(\w+)\b/i,t=self.Prism={util:{encode:function(e){return e instanceof n?new n(e.type,t.util.encode(e.content),e.alias):"Array"===t.util.type(e)?e.map(t.util.encode):e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/\u00a0/g," ")},type:function(e){return Object.prototype.toString.call(e).match(/\[object (\w+)\]/)[1]},clone:function(e){var n=t.util.type(e);switch(n){case"Object":var a={};for(var r in e)e.hasOwnProperty(r)&&(a[r]=t.util.clone(e[r]));return a;case"Array":return e.map(function(e){return t.util.clone(e)})}return e}},languages:{extend:function(e,n){var a=t.util.clone(t.languages[e]);for(var r in n)a[r]=n[r];return a},insertBefore:function(e,n,a,r){r=r||t.languages;var i=r[e];if(2==arguments.length){a=arguments[1];for(var l in a)a.hasOwnProperty(l)&&(i[l]=a[l]);return i}var s={};for(var o in i)if(i.hasOwnProperty(o)){if(o==n)for(var l in a)a.hasOwnProperty(l)&&(s[l]=a[l]);s[o]=i[o]}return t.languages.DFS(t.languages,function(t,n){n===r[e]&&t!=e&&(this[t]=s)}),r[e]=s},DFS:function(e,n,a){for(var r in e)e.hasOwnProperty(r)&&(n.call(e,r,e[r],a||r),"Object"===t.util.type(e[r])?t.languages.DFS(e[r],n):"Array"===t.util.type(e[r])&&t.languages.DFS(e[r],n,r))}},highlightAll:function(e,n){for(var a,r=document.querySelectorAll('code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'),i=0;a=r[i++];)t.highlightElement(a,e===!0,n)},highlightElement:function(a,r,i){for(var l,s,o=a;o&&!e.test(o.className);)o=o.parentNode;if(o&&(l=(o.className.match(e)||[,""])[1],s=t.languages[l]),a.className=a.className.replace(e,"").replace(/\s+/g," ")+" language-"+l,o=a.parentNode,/pre/i.test(o.nodeName)&&(o.className=o.className.replace(e,"").replace(/\s+/g," ")+" language-"+l),s){var u=a.textContent;if(u){u=u.replace(/^(?:\r?\n|\r)/,"");var g={element:a,language:l,grammar:s,code:u};if(t.hooks.run("before-highlight",g),r&&self.Worker){var c=new Worker(t.filename);c.onmessage=function(e){g.highlightedCode=n.stringify(JSON.parse(e.data),l),t.hooks.run("before-insert",g),g.element.innerHTML=g.highlightedCode,i&&i.call(g.element),t.hooks.run("after-highlight",g)},c.postMessage(JSON.stringify({language:g.language,code:g.code}))}else g.highlightedCode=t.highlight(g.code,g.grammar,g.language),t.hooks.run("before-insert",g),g.element.innerHTML=g.highlightedCode,i&&i.call(a),t.hooks.run("after-highlight",g)}}},highlight:function(e,a,r){var i=t.tokenize(e,a);return n.stringify(t.util.encode(i),r)},tokenize:function(e,n){var a=t.Token,r=[e],i=n.rest;if(i){for(var l in i)n[l]=i[l];delete n.rest}e:for(var l in n)if(n.hasOwnProperty(l)&&n[l]){var s=n[l];s="Array"===t.util.type(s)?s:[s];for(var o=0;o<s.length;++o){var u=s[o],g=u.inside,c=!!u.lookbehind,f=0,h=u.alias;u=u.pattern||u;for(var p=0;p<r.length;p++){var d=r[p];if(r.length>e.length)break e;if(!(d instanceof a)){u.lastIndex=0;var m=u.exec(d);if(m){c&&(f=m[1].length);var y=m.index-1+f,m=m[0].slice(f),v=m.length,k=y+v,b=d.slice(0,y+1),w=d.slice(k+1),N=[p,1];b&&N.push(b);var O=new a(l,g?t.tokenize(m,g):m,h);N.push(O),w&&N.push(w),Array.prototype.splice.apply(r,N)}}}}}return r},hooks:{all:{},add:function(e,n){var a=t.hooks.all;a[e]=a[e]||[],a[e].push(n)},run:function(e,n){var a=t.hooks.all[e];if(a&&a.length)for(var r,i=0;r=a[i++];)r(n)}}},n=t.Token=function(e,t,n){this.type=e,this.content=t,this.alias=n};if(n.stringify=function(e,a,r){if("string"==typeof e)return e;if("Array"===t.util.type(e))return e.map(function(t){return n.stringify(t,a,e)}).join("");var i={type:e.type,content:n.stringify(e.content,a,r),tag:"span",classes:["token",e.type],attributes:{},language:a,parent:r};if("comment"==i.type&&(i.attributes.spellcheck="true"),e.alias){var l="Array"===t.util.type(e.alias)?e.alias:[e.alias];Array.prototype.push.apply(i.classes,l)}t.hooks.run("wrap",i);var s="";for(var o in i.attributes)s+=o+'="'+(i.attributes[o]||"")+'"';return"<"+i.tag+' class="'+i.classes.join(" ")+'" '+s+">"+i.content+"</"+i.tag+">"},!self.document)return self.addEventListener?(self.addEventListener("message",function(e){var n=JSON.parse(e.data),a=n.language,r=n.code;self.postMessage(JSON.stringify(t.util.encode(t.tokenize(r,t.languages[a])))),self.close()},!1),self.Prism):self.Prism;var a=document.getElementsByTagName("script");return a=a[a.length-1],a&&(t.filename=a.src,document.addEventListener&&!a.hasAttribute("data-manual")&&document.addEventListener("DOMContentLoaded",t.highlightAll)),self.Prism}();"undefined"!=typeof module&&module.exports&&(module.exports=Prism);;
Prism.languages.markup={comment:/<!--[\w\W]*?-->/,prolog:/<\?.+?\?>/,doctype:/<!DOCTYPE.+?>/,cdata:/<!\[CDATA\[[\w\W]*?]]>/i,tag:{pattern:/<\/?[^\s>\/]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\\1|\\?(?!\1)[\w\W])*\1|[^\s'">=]+))?)*\s*\/?>/i,inside:{tag:{pattern:/^<\/?[^\s>\/]+/i,inside:{punctuation:/^<\/?/,namespace:/^[^\s>\/:]+:/}},"attr-value":{pattern:/=(?:('|")[\w\W]*?(\1)|[^\s>]+)/i,inside:{punctuation:/=|>|"/}},punctuation:/\/?>/,"attr-name":{pattern:/[^\s>\/]+/,inside:{namespace:/^[^\s>\/:]+:/}}}},entity:/&#?[\da-z]{1,8};/i},Prism.hooks.add("wrap",function(t){"entity"===t.type&&(t.attributes.title=t.content.replace(/&amp;/,"&"))});;
Prism.languages.css={comment:/\/\*[\w\W]*?\*\//,atrule:{pattern:/@[\w-]+?.*?(;|(?=\s*\{))/i,inside:{punctuation:/[;:]/}},url:/url\((?:(["'])(\\\n|\\?.)*?\1|.*?)\)/i,selector:/[^\{\}\s][^\{\};]*(?=\s*\{)/,string:/("|')(\\\n|\\?.)*?\1/,property:/(\b|\B)[\w-]+(?=\s*:)/i,important:/\B!important\b/i,punctuation:/[\{\};:]/,"function":/[-a-z0-9]+(?=\()/i},Prism.languages.markup&&(Prism.languages.insertBefore("markup","tag",{style:{pattern:/<style[\w\W]*?>[\w\W]*?<\/style>/i,inside:{tag:{pattern:/<style[\w\W]*?>|<\/style>/i,inside:Prism.languages.markup.tag.inside},rest:Prism.languages.css},alias:"language-css"}}),Prism.languages.insertBefore("inside","attr-value",{"style-attr":{pattern:/\s*style=("|').*?\1/i,inside:{"attr-name":{pattern:/^\s*style/i,inside:Prism.languages.markup.tag.inside},punctuation:/^\s*=\s*['"]|['"]\s*$/,"attr-value":{pattern:/.+/i,inside:Prism.languages.css}},alias:"language-css"}},Prism.languages.markup.tag));;
Prism.languages.clike={comment:[{pattern:/(^|[^\\])\/\*[\w\W]*?\*\//,lookbehind:!0},{pattern:/(^|[^\\:])\/\/.*/,lookbehind:!0}],string:/("|')(\\[\s\S]|(?!\1)[^\\\r\n])*\1/,"class-name":{pattern:/((?:(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[a-z0-9_\.\\]+/i,lookbehind:!0,inside:{punctuation:/(\.|\\)/}},keyword:/\b(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,"boolean":/\b(true|false)\b/,"function":{pattern:/[a-z0-9_]+\(/i,inside:{punctuation:/\(/}},number:/\b-?(0x[\dA-Fa-f]+|\d*\.?\d+([Ee]-?\d+)?)\b/,operator:/[-+]{1,2}|!|<=?|>=?|={1,3}|&{1,2}|\|?\||\?|\*|\/|~|\^|%/,ignore:/&(lt|gt|amp);/i,punctuation:/[{}[\];(),.:]/};;
Prism.languages.javascript=Prism.languages.extend("clike",{keyword:/\b(as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|false|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|true|try|typeof|var|void|while|with|yield)\b/,number:/\b-?(0x[\dA-Fa-f]+|0b[01]+|0o[0-7]+|\d*\.?\d+([Ee][+-]?\d+)?|NaN|Infinity)\b/,"function":/(?!\d)[a-z0-9_$]+(?=\()/i}),Prism.languages.insertBefore("javascript","keyword",{regex:{pattern:/(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/,lookbehind:!0}}),Prism.languages.insertBefore("javascript","class-name",{"template-string":{pattern:/`(?:\\`|\\?[^`])*`/,inside:{interpolation:{pattern:/\$\{[^}]+\}/,inside:{"interpolation-punctuation":{pattern:/^\$\{|\}$/,alias:"punctuation"},rest:Prism.languages.javascript}},string:/[\s\S]+/}}}),Prism.languages.markup&&Prism.languages.insertBefore("markup","tag",{script:{pattern:/<script[\w\W]*?>[\w\W]*?<\/script>/i,inside:{tag:{pattern:/<script[\w\W]*?>|<\/script>/i,inside:Prism.languages.markup.tag.inside},rest:Prism.languages.javascript},alias:"language-javascript"}});;
Prism.languages.bash=Prism.languages.extend("clike",{comment:{pattern:/(^|[^"{\\])(#.*?(\r?\n|$))/,lookbehind:!0},string:{pattern:/("|')(\\?[\s\S])*?\1/,inside:{property:/\$([a-zA-Z0-9_#\?\-\*!@]+|\{[^\}]+\})/}},number:{pattern:/([^\w\.])-?(0x[\dA-Fa-f]+|\d*\.?\d+([Ee]-?\d+)?)\b/,lookbehind:!0},"function":/\b(?:alias|apropos|apt-get|aptitude|aspell|awk|basename|bash|bc|bg|builtin|bzip2|cal|cat|cd|cfdisk|chgrp|chmod|chown|chroot|chkconfig|cksum|clear|cmp|comm|command|cp|cron|crontab|csplit|cut|date|dc|dd|ddrescue|declare|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|du|echo|egrep|eject|enable|env|ethtool|eval|exec|exit|expand|expect|export|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|getopts|git|grep|groupadd|groupdel|groupmod|groups|gzip|hash|head|help|hg|history|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|jobs|join|kill|killall|less|link|ln|locate|logname|logout|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|make|man|mkdir|mkfifo|mkisofs|mknod|more|most|mount|mtools|mtr|mv|mmv|nano|netstat|nice|nl|nohup|notify-send|nslookup|open|op|passwd|paste|pathchk|ping|pkill|popd|pr|printcap|printenv|printf|ps|pushd|pv|pwd|quota|quotacheck|quotactl|ram|rar|rcp|read|readarray|readonly|reboot|rename|renice|remsync|rev|rm|rmdir|rsync|screen|scp|sdiff|sed|select|seq|service|sftp|shift|shopt|shutdown|sleep|slocate|sort|source|split|ssh|stat|strace|su|sudo|sum|suspend|sync|tail|tar|tee|test|time|timeout|times|touch|top|traceroute|trap|tr|tsort|tty|type|ulimit|umask|umount|unalias|uname|unexpand|uniq|units|unrar|unshar|until|uptime|useradd|userdel|usermod|users|uuencode|uudecode|v|vdir|vi|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yes|zip)\b/,keyword:/\b(if|then|else|elif|fi|for|break|continue|while|in|case|function|select|do|done|until|echo|exit|return|set|declare)\b/}),Prism.languages.insertBefore("bash","keyword",{property:/\$([a-zA-Z0-9_#\?\-\*!@]+|\{[^}]+\})/}),Prism.languages.insertBefore("bash","comment",{important:/(^#!\s*\/bin\/bash)|(^#!\s*\/bin\/sh)/});;
!function(e){var n=/#(?!\{).+/,t={pattern:/#\{[^}]+\}/,alias:"variable"};e.languages.coffeescript=e.languages.extend("javascript",{comment:n,string:[/'(?:\\?[\s\S])*?'/,{pattern:/"(?:\\?[\s\S])*?"/,inside:{interpolation:t}}],keyword:/\b(and|break|by|catch|class|continue|debugger|delete|do|each|else|extend|extends|false|finally|for|if|in|instanceof|is|isnt|let|loop|namespace|new|no|not|null|of|off|on|or|own|return|super|switch|then|this|throw|true|try|typeof|undefined|unless|until|when|while|window|with|yes|yield)\b/,"class-member":{pattern:/@(?!\d)\w+/,alias:"variable"}}),e.languages.insertBefore("coffeescript","comment",{"multiline-comment":{pattern:/###[\s\S]+?###/,alias:"comment"},"block-regex":{pattern:/\/{3}[\s\S]*?\/{3}/,alias:"regex",inside:{comment:n,interpolation:t}}}),e.languages.insertBefore("coffeescript","string",{"inline-javascript":{pattern:/`(?:\\?[\s\S])*?`/,inside:{delimiter:{pattern:/^`|`$/,alias:"punctuation"},rest:e.languages.javascript}},"multiline-string":[{pattern:/'''[\s\S]*?'''/,alias:"string"},{pattern:/"""[\s\S]*?"""/,alias:"string",inside:{interpolation:t}}]}),e.languages.insertBefore("coffeescript","keyword",{property:/(?!\d)\w+(?=\s*:(?!:))/})}(Prism);;
Prism.languages.css.selector={pattern:/[^\{\}\s][^\{\}]*(?=\s*\{)/,inside:{"pseudo-element":/:(?:after|before|first-letter|first-line|selection)|::[-\w]+/,"pseudo-class":/:[-\w]+(?:\(.*\))?/,"class":/\.[-:\.\w]+/,id:/#[-:\.\w]+/}},Prism.languages.insertBefore("css","function",{hexcode:/#[\da-f]{3,6}/i,entity:/\\[\da-f]{1,8}/i,number:/[\d%\.]+/});;
Prism.languages.git={comment:/^#.*$/m,string:/("|')(\\?.)*?\1/m,command:{pattern:/^.*\$ git .*$/m,inside:{parameter:/\s(--|-)\w+/m}},coord:/^@@.*@@$/m,deleted:/^-(?!-).+$/m,inserted:/^\+(?!\+).+$/m,commit_sha1:/^commit \w{40}$/m};;
!function(e){e.languages.haml={"multiline-comment":[{pattern:/((?:^|\n)([\t ]*))\/.*(\n\2[\t ]+.+)*/,lookbehind:!0,alias:"comment"},{pattern:/((?:^|\n)([\t ]*))-#.*(\n\2[\t ]+.+)*/,lookbehind:!0,alias:"comment"}],"multiline-code":[{pattern:/((?:^|\n)([\t ]*)(?:[~-]|[&!]?=)).*,[\t ]*(\n\2[\t ]+.*,[\t ]*)*(\n\2[\t ]+.+)/,lookbehind:!0,inside:{rest:e.languages.ruby}},{pattern:/((?:^|\n)([\t ]*)(?:[~-]|[&!]?=)).*\|[\t ]*(\n\2[\t ]+.*\|[\t ]*)*/,lookbehind:!0,inside:{rest:e.languages.ruby}}],filter:{pattern:/((?:^|\n)([\t ]*)):[\w-]+(\n(?:\2[\t ]+.+|\s*?(?=\n)))+/,lookbehind:!0,inside:{"filter-name":{pattern:/^:[\w-]+/,alias:"variable"}}},markup:{pattern:/((?:^|\n)[\t ]*)<.+/,lookbehind:!0,inside:{rest:e.languages.markup}},doctype:{pattern:/((?:^|\n)[\t ]*)!!!(?: .+)?/,lookbehind:!0},tag:{pattern:/((?:^|\n)[\t ]*)[%.#][\w\-#.]*[\w\-](?:\([^)]+\)|\{(?:\{[^}]+\}|[^}])+\}|\[[^\]]+\])*[\/<>]*/,lookbehind:!0,inside:{attributes:[{pattern:/(^|[^#])\{(?:\{[^}]+\}|[^}])+\}/,lookbehind:!0,inside:{rest:e.languages.ruby}},{pattern:/\([^)]+\)/,inside:{"attr-value":{pattern:/(=\s*)(?:"(?:\\?.)*?"|[^)\s]+)/,lookbehind:!0},"attr-name":/[\w:-]+(?=\s*!?=|\s*[,)])/,punctuation:/[=(),]/}},{pattern:/\[[^\]]+\]/,inside:{rest:e.languages.ruby}}],punctuation:/[<>]/}},code:{pattern:/((?:^|\n)[\t ]*(?:[~-]|[&!]?=)).+/,lookbehind:!0,inside:{rest:e.languages.ruby}},interpolation:{pattern:/#\{[^}]+\}/,inside:{delimiter:{pattern:/^#\{|\}$/,alias:"punctuation"},rest:e.languages.ruby}},punctuation:{pattern:/((?:^|\n)[\t ]*)[~=\-&!]/,lookbehind:!0}};for(var t="((?:^|\\n)([\\t ]*)):{{filter_name}}(\\n(?:\\2[\\t ]+.+|\\s*?(?=\\n)))+",n=["css",{filter:"coffee",language:"coffeescript"},"erb","javascript","less","markdown","ruby","scss","textile"],a={},i=0,r=n.length;r>i;i++){var l=n[i];l="string"==typeof l?{filter:l,language:l}:l,e.languages[l.language]&&(a["filter-"+l.filter]={pattern:RegExp(t.replace("{{filter_name}}",l.filter)),lookbehind:!0,inside:{"filter-name":{pattern:/^:[\w-]+/,alias:"variable"},rest:e.languages[l.language]}})}e.languages.insertBefore("haml","filter",a)}(Prism);;
!function(e){var a=/\{\{\{[\w\W]+?\}\}\}|\{\{[\w\W]+?\}\}/g;e.languages.handlebars=e.languages.extend("markup",{handlebars:{pattern:a,inside:{delimiter:{pattern:/^\{\{\{?|\}\}\}?$/i,alias:"punctuation"},string:/(["'])(\\?.)+?\1/,number:/\b-?(0x[\dA-Fa-f]+|\d*\.?\d+([Ee]-?\d+)?)\b/,"boolean":/\b(true|false)\b/,block:{pattern:/^(\s*~?\s*)[#\/]\S+/i,lookbehind:!0,alias:"keyword"},brackets:{pattern:/\[[^\]]+\]/,inside:{punctuation:/\[|\]/,variable:/[\w\W]+/}},punctuation:/[!"#%&'()*+,.\/;<=>@\[\\\]^`{|}~]/,variable:/[^!"#%&'()*+,.\/;<=>@\[\\\]^`{|}~]+/}}}),e.languages.insertBefore("handlebars","tag",{"handlebars-comment":{pattern:/\{\{![\w\W]*?\}\}/,alias:["handlebars","comment"]}}),e.hooks.add("before-highlight",function(e){"handlebars"===e.language&&(e.tokenStack=[],e.backupCode=e.code,e.code=e.code.replace(a,function(a){return e.tokenStack.push(a),"___HANDLEBARS"+e.tokenStack.length+"___"}))}),e.hooks.add("before-insert",function(e){"handlebars"===e.language&&(e.code=e.backupCode,delete e.backupCode)}),e.hooks.add("after-highlight",function(a){if("handlebars"===a.language){for(var n,t=0;n=a.tokenStack[t];t++)a.highlightedCode=a.highlightedCode.replace("___HANDLEBARS"+(t+1)+"___",e.highlight(n,a.grammar,"handlebars"));a.element.innerHTML=a.highlightedCode}})}(Prism);;
!function(e){e.languages.jade={"multiline-comment":{pattern:/((?:^|\n)([\t ]*))\/\/.*(\n\2[\t ]+.+)*/,lookbehind:!0,alias:"comment"},"multiline-script":{pattern:/((?:^|\n)([\t ]*)script\b.*\.[\t ]*)(\n(?:\2[\t ]+.+|\s*?(?=\n)))+/,lookbehind:!0,inside:{rest:e.languages.javascript}},filter:{pattern:/((?:^|\n)([\t ]*)):.+(\n(?:\2[\t ]+.+|\s*?(?=\n)))+/,lookbehind:!0,inside:{"filter-name":{pattern:/^:[\w-]+/,alias:"variable"}}},"multiline-plain-text":{pattern:/((?:^|\n)([\t ]*)[\w\-#.]+\.[\t ]*)(\n(?:\2[\t ]+.+|\s*?(?=\n)))+/,lookbehind:!0},markup:{pattern:/((?:^|\n)[\t ]*)<.+/,lookbehind:!0,inside:{rest:e.languages.markup}},comment:{pattern:/((?:^|\n)[\t ]*)\/\/.+/,lookbehind:!0},doctype:{pattern:/((?:^|\n)[\t ]*)doctype(?: .+)?/,lookbehind:!0},"flow-control":{pattern:/((?:^|\n)[\t ]*)(?:if|unless|else|case|when|default|each|while)(?: .+)?/,lookbehind:!0,inside:{each:{pattern:/((?:^|\n)[\t ]*)each .+? in\b/,lookbehind:!0,inside:{keyword:/\b(?:each|in)\b/,punctuation:/,/}},branch:{pattern:/((?:^|\n)[\t ]*)(?:if|unless|else|case|when|default|while)/,lookbehind:!0,alias:"keyword"},rest:e.languages.javascript}},keyword:{pattern:/((?:^|\n)[\t ]*)(?:block|extends|include|append|prepend)\b.+/,lookbehind:!0},mixin:[{pattern:/((?:^|\n)[\t ]*)mixin .+/,lookbehind:!0,inside:{keyword:/^mixin/,"function":/\w+(?=\s*\(|\s*$)/,punctuation:/[(),.]/}},{pattern:/((?:^|\n)[\t ]*)\+.+/,lookbehind:!0,inside:{name:{pattern:/^\+\w+/,alias:"function"},rest:e.languages.javascript}}],script:{pattern:/((?:^|\n)[\t ]*script(?:(?:&[^(]+)?\([^)]+\))*) .+/,lookbehind:!0,inside:{rest:e.languages.javascript}},"plain-text":{pattern:/((?:^|\n)[\t ]*(?!-)[\w\-#.]*[\w\-](?:(?:&[^(]+)?\([^)]+\))*\/?[\t ]+).+/,lookbehind:!0},tag:{pattern:/((?:^|\n)[\t ]*)(?!-)[\w\-#.]*[\w\-](?:(?:&[^(]+)?\([^)]+\))*\/?:?/,lookbehind:!0,inside:{attributes:[{pattern:/&[^(]+\([^)]+\)/,inside:{rest:e.languages.javascript}},{pattern:/\([^)]+\)/,inside:{"attr-value":{pattern:/(=\s*)(?:\{[^}]*\}|[^,)\n]+)/,lookbehind:!0,inside:{rest:e.languages.javascript}},"attr-name":/[\w-]+(?=\s*!?=|\s*[,)])/,punctuation:/[!=(),]/}}],punctuation:/[:]/}},code:[{pattern:/((?:^|\n)[\t ]*(?:-|!?=)).+/,lookbehind:!0,inside:{rest:e.languages.javascript}}],punctuation:/[.\-!=|]/};for(var t="((?:^|\\n)([\\t ]*)):{{filter_name}}(\\n(?:\\2[\\t ]+.+|\\s*?(?=\\n)))+",n=[{filter:"atpl",language:"twig"},{filter:"coffee",language:"coffeescript"},"ejs","handlebars","hogan","less","livescript","markdown","mustache","plates",{filter:"sass",language:"scss"},"stylus","swig"],a={},i=0,s=n.length;s>i;i++){var l=n[i];l="string"==typeof l?{filter:l,language:l}:l,e.languages[l.language]&&(a["filter-"+l.filter]={pattern:RegExp(t.replace("{{filter_name}}",l.filter)),lookbehind:!0,inside:{"filter-name":{pattern:/^:[\w-]+/,alias:"variable"},rest:e.languages[l.language]}})}e.languages.insertBefore("jade","filter",a)}(Prism);;
Prism.languages.less=Prism.languages.extend("css",{comment:[/\/\*[\w\W]*?\*\//,{pattern:/(^|[^\\])\/\/.*/,lookbehind:!0}],atrule:{pattern:/@[\w-]+?(?:\([^{}]+\)|[^(){};])*?(?=\s*\{)/i,inside:{punctuation:/[:()]/}},selector:{pattern:/(?:@\{[\w-]+\}|[^{};\s@])(?:@\{[\w-]+\}|\([^{}]*\)|[^{};@])*?(?=\s*\{)/,inside:{variable:/@+[\w-]+/}},property:/(\b|\B)(?:@\{[\w-]+\}|[\w-])+(?:\+_?)?(?=\s*:)/i,punctuation:/[{}();:,]/,operator:/[+\-*\/]/}),Prism.languages.insertBefore("less","punctuation",{"function":Prism.languages.less.function}),Prism.languages.insertBefore("less","property",{variable:[{pattern:/@[\w-]+\s*:/,inside:{punctuation:/:/}},/@@?[\w-]+/],"mixin-usage":{pattern:/([{;]\s*)[.#](?!\d)[\w-]+.*?(?=[(;])/,lookbehind:!0,alias:"function"}});;
Prism.languages.makefile={comment:{pattern:/(^|[^\\])#(?:\\[\s\S]|.)*/,lookbehind:!0},string:/(["'])(?:\\[\s\S]|(?!\1)[^\\\r\n])*\1/,builtin:/\.[A-Z][^:#=\s]+(?=\s*:(?!=))/,symbol:{pattern:/^[^:=\r\n]+(?=\s*:(?!=))/m,inside:{variable:/\$+(?:[^(){}:#=\s]+|(?=[({]))/}},variable:/\$+(?:[^(){}:#=\s]+|\([@*%<^+?][DF]\)|(?=[({]))/,keyword:[/\b(?:define|else|endef|endif|export|ifn?def|ifn?eq|-?include|override|private|sinclude|undefine|unexport|vpath)\b/,{pattern:/(\()(?:addsuffix|abspath|and|basename|call|dir|error|eval|file|filter(?:-out)?|findstring|firstword|flavor|foreach|guile|if|info|join|lastword|load|notdir|or|origin|patsubst|realpath|shell|sort|strip|subst|suffix|value|warning|wildcard|word(?:s|list)?)(?=[ \t])/,lookbehind:!0}],operator:/(?:::|[?:+!])?=|[|@]/,punctuation:/[:;(){}]/};;
Prism.languages.markdown=Prism.languages.extend("markup",{}),Prism.languages.insertBefore("markdown","prolog",{blockquote:{pattern:/(^|\n)>(?:[\t ]*>)*/,lookbehind:!0,alias:"punctuation"},code:[{pattern:/(^|\n)(?: {4}|\t).+/,lookbehind:!0,alias:"keyword"},{pattern:/``.+?``|`[^`\n]+`/,alias:"keyword"}],title:[{pattern:/\w+.*\n(?:==+|--+)/,alias:"important",inside:{punctuation:/==+$|--+$/}},{pattern:/((?:^|\n)\s*)#+.+/,lookbehind:!0,alias:"important",inside:{punctuation:/^#+|#+$/}}],hr:{pattern:/((?:^|\n)\s*)([*-])([\t ]*\2){2,}(?=\s*(?:\n|$))/,lookbehind:!0,alias:"punctuation"},list:{pattern:/((?:^|\n)\s*)(?:[*+-]|\d+\.)(?=[\t ].)/,lookbehind:!0,alias:"punctuation"},"url-reference":{pattern:/!?\[[^\]]+\]:[\t ]+(?:\S+|<(?:[^>]|\\>)+>)(?:[\t ]+(?:"(?:[^"]|\\")*"|'(?:[^']|\\')*'|\((?:[^)]|\\\))*\)))?/,inside:{variable:{pattern:/^(!?\[)[^\]]+/,lookbehind:!0},string:/(?:"(?:[^"]|\\")*"|'(?:[^']|\\')*'|\((?:[^)]|\\\))*\))$/,punctuation:/[[\]\(\)<>:]/},alias:"url"},bold:{pattern:/(^|[^\\])(\*\*|__)(?:\n(?!\n)|.)+?\2/,lookbehind:!0,inside:{punctuation:/^\*\*|^__|\*\*\s*$|__\s*$/}},italic:{pattern:/(^|[^\\])(?:\*(?:\n(?!\n)|.)+?\*|_(?:\n(?!\n)|.)+?_)/,lookbehind:!0,inside:{punctuation:/^[*_]|[*_]$/}},url:{pattern:/!?\[[^\]]+\](?:\([^\s)]+(?:[\t ]+"(?:[^"]|\\")*")?\)| ?\[[^\]\n]*\])/,inside:{variable:{pattern:/(!?\[)[^\]]+(?=\]$)/,lookbehind:!0},string:{pattern:/"(?:[^"]|\\")*"(?=\)$)/}}}}),Prism.languages.markdown.bold.inside.url=Prism.util.clone(Prism.languages.markdown.url),Prism.languages.markdown.italic.inside.url=Prism.util.clone(Prism.languages.markdown.url),Prism.languages.markdown.bold.inside.italic=Prism.util.clone(Prism.languages.markdown.italic),Prism.languages.markdown.italic.inside.bold=Prism.util.clone(Prism.languages.markdown.bold);;
Prism.languages.php=Prism.languages.extend("clike",{keyword:/\b(and|or|xor|array|as|break|case|cfunction|class|const|continue|declare|default|die|do|else|elseif|enddeclare|endfor|endforeach|endif|endswitch|endwhile|extends|for|foreach|function|include|include_once|global|if|new|return|static|switch|use|require|require_once|var|while|abstract|interface|public|implements|private|protected|parent|throw|null|echo|print|trait|namespace|final|yield|goto|instanceof|finally|try|catch)\b/i,constant:/\b[A-Z0-9_]{2,}\b/,comment:{pattern:/(^|[^\\])(\/\*[\w\W]*?\*\/|(^|[^:])(\/\/).*?(\r?\n|$))/,lookbehind:!0}}),Prism.languages.insertBefore("php","class-name",{"shell-comment":{pattern:/(^|[^\\])#.*?(\r?\n|$)/,lookbehind:!0,alias:"comment"}}),Prism.languages.insertBefore("php","keyword",{delimiter:/(\?>|<\?php|<\?)/i,variable:/(\$\w+)\b/i,"package":{pattern:/(\\|namespace\s+|use\s+)[\w\\]+/,lookbehind:!0,inside:{punctuation:/\\/}}}),Prism.languages.insertBefore("php","operator",{property:{pattern:/(->)[\w]+/,lookbehind:!0}}),Prism.languages.markup&&(Prism.hooks.add("before-highlight",function(e){"php"===e.language&&(e.tokenStack=[],e.backupCode=e.code,e.code=e.code.replace(/(?:<\?php|<\?)[\w\W]*?(?:\?>)/gi,function(n){return e.tokenStack.push(n),"{{{PHP"+e.tokenStack.length+"}}}"}))}),Prism.hooks.add("before-insert",function(e){"php"===e.language&&(e.code=e.backupCode,delete e.backupCode)}),Prism.hooks.add("after-highlight",function(e){if("php"===e.language){for(var n,a=0;n=e.tokenStack[a];a++)e.highlightedCode=e.highlightedCode.replace("{{{PHP"+(a+1)+"}}}",Prism.highlight(n,e.grammar,"php"));e.element.innerHTML=e.highlightedCode}}),Prism.hooks.add("wrap",function(e){"php"===e.language&&"markup"===e.type&&(e.content=e.content.replace(/(\{\{\{PHP[0-9]+\}\}\})/g,'<span class="token php">$1</span>'))}),Prism.languages.insertBefore("php","comment",{markup:{pattern:/<[^?]\/?(.*?)>/,inside:Prism.languages.markup},php:/\{\{\{PHP[0-9]+\}\}\}/}));;
Prism.languages.ruby=Prism.languages.extend("clike",{comment:/#[^\r\n]*(\r?\n|$)/,keyword:/\b(alias|and|BEGIN|begin|break|case|class|def|define_method|defined|do|each|else|elsif|END|end|ensure|false|for|if|in|module|new|next|nil|not|or|raise|redo|require|rescue|retry|return|self|super|then|throw|true|undef|unless|until|when|while|yield)\b/,builtin:/\b(Array|Bignum|Binding|Class|Continuation|Dir|Exception|FalseClass|File|Stat|File|Fixnum|Fload|Hash|Integer|IO|MatchData|Method|Module|NilClass|Numeric|Object|Proc|Range|Regexp|String|Struct|TMS|Symbol|ThreadGroup|Thread|Time|TrueClass)\b/,constant:/\b[A-Z][a-zA-Z_0-9]*[?!]?\b/}),Prism.languages.insertBefore("ruby","keyword",{regex:{pattern:/(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\r\n])+\/[gim]{0,3}(?=\s*($|[\r\n,.;})]))/,lookbehind:!0},variable:/[@$]+\b[a-zA-Z_][a-zA-Z_0-9]*[?!]?\b/,symbol:/:\b[a-zA-Z_][a-zA-Z_0-9]*[?!]?\b/});;
!function(e){e.languages.sass=e.languages.extend("css",{comment:/^([ \t]*)\/[\/*].*(?:(?:\r?\n|\r)\1[ \t]+.+)*/m}),e.languages.insertBefore("sass","atrule",{"atrule-line":{pattern:/^(?:[ \t]*)[@+=].+/m,inside:{atrule:/^(?:[ \t]*)(?:@[\w-]+|[+=])/m}}}),delete e.languages.sass.atrule;var a=/((\$[-_\w]+)|(#\{\$[-_\w]+\}))/i,s=/[-+]{1,2}|==?|!=|\|?\||\?|\*|\/|%/;e.languages.insertBefore("sass","property",{"variable-line":{pattern:/(^|(?:\r?\n|\r))[ \t]*\$.+/,lookbehind:!0,inside:{punctuation:/:/,variable:a,operator:s}},"property-line":{pattern:/(^|(?:\r?\n|\r))[ \t]*(?:[^:\s]+[ ]*:.*|:[^:\s]+.*)/i,lookbehind:!0,inside:{property:[/[^:\s]+(?=\s*:)/,{pattern:/(:)[^:\s]+/,lookbehind:!0}],punctuation:/:/,variable:a,operator:s,important:e.languages.sass.important}}}),delete e.languages.sass.property,delete e.languages.sass.important,delete e.languages.sass.selector,e.languages.insertBefore("sass","punctuation",{selector:{pattern:/([ \t]*).+(?:,(?:\r?\n|\r)\1[ \t]+.+)*/,lookbehind:!0}})}(Prism);;
Prism.languages.scss=Prism.languages.extend("css",{comment:{pattern:/(^|[^\\])(\/\*[\w\W]*?\*\/|\/\/.*?(\r?\n|$))/,lookbehind:!0},atrule:/@[\w-]+(?=\s+(\(|\{|;))/i,url:/([-a-z]+-)*url(?=\()/i,selector:/([^@;\{\}\(\)]?([^@;\{\}\(\)]|&|#\{\$[-_\w]+\})+)(?=\s*\{(\}|\s|[^\}]+(:|\{)[^\}]+))/m}),Prism.languages.insertBefore("scss","atrule",{keyword:/@(if|else if|else|for|each|while|import|extend|debug|warn|mixin|include|function|return|content)|(?=@for\s+\$[-_\w]+\s)+from/i}),Prism.languages.insertBefore("scss","property",{variable:/((\$[-_\w]+)|(#\{\$[-_\w]+\}))/i}),Prism.languages.insertBefore("scss","function",{placeholder:/%[-_\w]+/i,statement:/\B!(default|optional)\b/i,"boolean":/\b(true|false)\b/,"null":/\b(null)\b/,operator:/\s+([-+]{1,2}|={1,2}|!=|\|?\||\?|\*|\/|%)\s+/});;
Prism.languages.sql={comment:{pattern:/(^|[^\\])(\/\*[\w\W]*?\*\/|((--)|(\/\/)|#).*?(\r?\n|$))/,lookbehind:!0},string:{pattern:/(^|[^@])("|')(\\?[\s\S])*?\2/,lookbehind:!0},variable:/@[\w.$]+|@("|'|`)(\\?[\s\S])+?\1/,"function":/\b(?:COUNT|SUM|AVG|MIN|MAX|FIRST|LAST|UCASE|LCASE|MID|LEN|ROUND|NOW|FORMAT)(?=\s*\()/i,keyword:/\b(?:ACTION|ADD|AFTER|ALGORITHM|ALTER|ANALYZE|APPLY|AS|ASC|AUTHORIZATION|BACKUP|BDB|BEGIN|BERKELEYDB|BIGINT|BINARY|BIT|BLOB|BOOL|BOOLEAN|BREAK|BROWSE|BTREE|BULK|BY|CALL|CASCADE|CASCADED|CASE|CHAIN|CHAR VARYING|CHARACTER VARYING|CHECK|CHECKPOINT|CLOSE|CLUSTERED|COALESCE|COLUMN|COLUMNS|COMMENT|COMMIT|COMMITTED|COMPUTE|CONNECT|CONSISTENT|CONSTRAINT|CONTAINS|CONTAINSTABLE|CONTINUE|CONVERT|CREATE|CROSS|CURRENT|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|CURRENT_USER|CURSOR|DATA|DATABASE|DATABASES|DATETIME|DBCC|DEALLOCATE|DEC|DECIMAL|DECLARE|DEFAULT|DEFINER|DELAYED|DELETE|DENY|DESC|DESCRIBE|DETERMINISTIC|DISABLE|DISCARD|DISK|DISTINCT|DISTINCTROW|DISTRIBUTED|DO|DOUBLE|DOUBLE PRECISION|DROP|DUMMY|DUMP|DUMPFILE|DUPLICATE KEY|ELSE|ENABLE|ENCLOSED BY|END|ENGINE|ENUM|ERRLVL|ERRORS|ESCAPE|ESCAPED BY|EXCEPT|EXEC|EXECUTE|EXIT|EXPLAIN|EXTENDED|FETCH|FIELDS|FILE|FILLFACTOR|FIRST|FIXED|FLOAT|FOLLOWING|FOR|FOR EACH ROW|FORCE|FOREIGN|FREETEXT|FREETEXTTABLE|FROM|FULL|FUNCTION|GEOMETRY|GEOMETRYCOLLECTION|GLOBAL|GOTO|GRANT|GROUP|HANDLER|HASH|HAVING|HOLDLOCK|IDENTITY|IDENTITY_INSERT|IDENTITYCOL|IF|IGNORE|IMPORT|INDEX|INFILE|INNER|INNODB|INOUT|INSERT|INT|INTEGER|INTERSECT|INTO|INVOKER|ISOLATION LEVEL|JOIN|KEY|KEYS|KILL|LANGUAGE SQL|LAST|LEFT|LIMIT|LINENO|LINES|LINESTRING|LOAD|LOCAL|LOCK|LONGBLOB|LONGTEXT|MATCH|MATCHED|MEDIUMBLOB|MEDIUMINT|MEDIUMTEXT|MERGE|MIDDLEINT|MODIFIES SQL DATA|MODIFY|MULTILINESTRING|MULTIPOINT|MULTIPOLYGON|NATIONAL|NATIONAL CHAR VARYING|NATIONAL CHARACTER|NATIONAL CHARACTER VARYING|NATIONAL VARCHAR|NATURAL|NCHAR|NCHAR VARCHAR|NEXT|NO|NO SQL|NOCHECK|NOCYCLE|NONCLUSTERED|NULLIF|NUMERIC|OF|OFF|OFFSETS|ON|OPEN|OPENDATASOURCE|OPENQUERY|OPENROWSET|OPTIMIZE|OPTION|OPTIONALLY|ORDER|OUT|OUTER|OUTFILE|OVER|PARTIAL|PARTITION|PERCENT|PIVOT|PLAN|POINT|POLYGON|PRECEDING|PRECISION|PREV|PRIMARY|PRINT|PRIVILEGES|PROC|PROCEDURE|PUBLIC|PURGE|QUICK|RAISERROR|READ|READS SQL DATA|READTEXT|REAL|RECONFIGURE|REFERENCES|RELEASE|RENAME|REPEATABLE|REPLICATION|REQUIRE|RESTORE|RESTRICT|RETURN|RETURNS|REVOKE|RIGHT|ROLLBACK|ROUTINE|ROWCOUNT|ROWGUIDCOL|ROWS?|RTREE|RULE|SAVE|SAVEPOINT|SCHEMA|SELECT|SERIAL|SERIALIZABLE|SESSION|SESSION_USER|SET|SETUSER|SHARE MODE|SHOW|SHUTDOWN|SIMPLE|SMALLINT|SNAPSHOT|SOME|SONAME|START|STARTING BY|STATISTICS|STATUS|STRIPED|SYSTEM_USER|TABLE|TABLES|TABLESPACE|TEMP(?:ORARY)?|TEMPTABLE|TERMINATED BY|TEXT|TEXTSIZE|THEN|TIMESTAMP|TINYBLOB|TINYINT|TINYTEXT|TO|TOP|TRAN|TRANSACTION|TRANSACTIONS|TRIGGER|TRUNCATE|TSEQUAL|TYPE|TYPES|UNBOUNDED|UNCOMMITTED|UNDEFINED|UNION|UNPIVOT|UPDATE|UPDATETEXT|USAGE|USE|USER|USING|VALUE|VALUES|VARBINARY|VARCHAR|VARCHARACTER|VARYING|VIEW|WAITFOR|WARNINGS|WHEN|WHERE|WHILE|WITH|WITH ROLLUP|WITHIN|WORK|WRITE|WRITETEXT)\b/i,"boolean":/\b(?:TRUE|FALSE|NULL)\b/i,number:/\b-?(0x)?\d*\.?[\da-f]+\b/,operator:/\b(?:ALL|AND|ANY|BETWEEN|EXISTS|IN|LIKE|NOT|OR|IS|UNIQUE|CHARACTER SET|COLLATE|DIV|OFFSET|REGEXP|RLIKE|SOUNDS LIKE|XOR)\b|[-+]|!|[=<>]{1,2}|(&){1,2}|\|?\||\?|\*|\//i,punctuation:/[;[\]()`,.]/};;
Prism.languages.stylus={comment:{pattern:/(^|[^\\])(\/\*[\w\W]*?\*\/|\/\/.*?(\r?\n|$))/g,lookbehind:!0},keyword:/(px|r?em|ex|ch|vw|vh|vmin|vmax|deg|grad|rad|turn|m?s|k?Hz|dpi|dppx|dpcm)\b|\b(is|defined|not|isnt|and|or|unless|for|in)\b/g,atrule:/@[\w-]+(?=\s+\S+)/gi,url:/url\((["']?).*?\1\)/gi,variable:/^\s*([\w-]+)(?=\s*[+-\\]?=)/gm,string:/("|')(\\\n|\\?.)*?\1/g,important:/\B!important\b/gi,hexcode:/#[\da-f]{3,6}/gi,entity:/\\[\da-f]{1,8}/gi,number:/\d+\.?\d*%?/g,selector:[{pattern:/::?(after|before|first-letter|first-line|selection)/g,alias:"pseudo-element"},{pattern:/:(?:active|checked|disabled|empty|enabled|first-child|first-of-type|focus|hover|in-range|invalid|lang|last-child|last-of-type|link|not|nth-child|nth-last-child|nth-last-of-type|nth-of-type|only-of-type|only-child|optional|out-of-range|read-only|read-write|required|root|target|valid|visited)(?:\(.*\))?/g,alias:"pseudo-class"},{pattern:/\[[\w-]+?\s*[*~$^|=]?(?:=\s*\S+)?\]/g,inside:{"attr-name":{pattern:/(\[)([\w-]+)(?=\s*[*~$^|=]{0,2})/g,lookbehind:!0},punctuation:/\[|\]/g,operator:/[*~$^|=]/g,"attr-value":{pattern:/\S+/}},alias:"attr"},{pattern:/\.[a-z-]+/i,alias:"class"},{pattern:/#[a-z-]+/i,alias:"id"},{pattern:/\b(html|head|title|base|link|meta|style|script|noscript|template|body|section|nav|article|aside|h[1-6]|header|footer|address|main|p|hr|pre|blockquote|ol|ul|li|dl|dt|dd|figure|figcaption|div|a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|dbo|span|br|wbr|ins|del|image|iframe|embed|object|param|video|audio|source|track|canvas|map|area|sv|math|table|caption|colgroup|col|tbody|thead|tfoot|tr|td|th|form|fieldset|legeng|label|input|button|select|datalist|optgroup|option|textarea|keygen|output|progress|meter|details|summary|menuitem|menu)\b/g,alias:"tag"}],property:[/^\s*([a-z-]+)(?=\s+[\w\W]+|\s*:)(?!\s*\{|\r?\n)/gim,{pattern:/(\(\s*)([a-z-]+)(?=\s*:)/gi,lookbehind:!0}],"function":/[-a-z0-9]+(?=\()/gi,punctuation:/[\{\};:]/g,operator:/[-+]{1,2}|!|<=?|>=?|={1,3}|&{1,2}|\|?\||\?|\*|\/|~|\^|%/g};;
Prism.languages.wiki=Prism.languages.extend("markup",{"block-comment":{pattern:/(^|[^\\])\/\*[\w\W]*?\*\//,lookbehind:!0,alias:"comment"},heading:{pattern:/^(=+).+?\1/m,inside:{punctuation:/^=+|=+$/,important:/.+/}},emphasis:{pattern:/('{2,4}).+?\1/,inside:{"bold italic":{pattern:/('''').+?(?=\1)/,lookbehind:!0},bold:{pattern:/(''').+?(?=\1)/,lookbehind:!0},italic:{pattern:/('').+?(?=\1)/,lookbehind:!0},punctuation:/^''+|''+$/}},hr:{pattern:/^-{4,}/m,alias:"punctuation"},url:[/ISBN +(?:97[89][ -]?)?(?:\d[ -]?){9}[\dx]\b/i,/(?:RFC|PMID) +\d+/,/\[\[.+?\]\]/,/\[.+?\]/],variable:[/__[A-Z]+__/,/\{{3}.+?\}{3}/,/\{\{.+?}}/],symbol:[/^#redirect/im,/~{3,5}/],"table-tag":{pattern:/((?:^|[|!])[|!])[^|\r\n]+\|(?!\|)/m,lookbehind:!0,inside:{"table-bar":{pattern:/\|$/,alias:"punctuation"},rest:Prism.languages.markup.tag.inside}},punctuation:/^(?:\{\||\|\}|\|-|[*#:;!|])|\|\||!!/m}),Prism.languages.insertBefore("wiki","tag",{nowiki:{pattern:/<(nowiki|pre|source)\b[\w\W]*?>[\w\W]*?<\/\1>/i,inside:{tag:{pattern:/<(?:nowiki|pre|source)\b[\w\W]*?>|<\/(?:nowiki|pre|source)>/i,inside:Prism.languages.markup.tag.inside}}}});;
Prism.languages.yaml={scalar:{pattern:/([\-:]\s*(![^\s]+)?[ \t]*[|>])[ \t]*(?:(\n[ \t]+)[^\r\n]+(?:\3[^\r\n]+)*)/,lookbehind:!0,alias:"string"},comment:/#[^\n]+/,key:{pattern:/(\s*[:\-,[{\n?][ \t]*(![^\s]+)?[ \t]*)[^\n{[\]},#]+?(?=\s*:\s)/,lookbehind:!0,alias:"atrule"},directive:{pattern:/((^|\n)[ \t]*)%[^\n]+/,lookbehind:!0,alias:"important"},datetime:{pattern:/([:\-,[{]\s*(![^\s]+)?[ \t]*)(\d{4}-\d\d?-\d\d?([tT]|[ \t]+)\d\d?:\d{2}:\d{2}(\.\d*)?[ \t]*(Z|[-+]\d\d?(:\d{2})?)?|\d{4}-\d{2}-\d{2}|\d\d?:\d{2}(:\d{2}(\.\d*)?)?)(?=[ \t]*(\n|$|,|]|}))/,lookbehind:!0,alias:"number"},"boolean":{pattern:/([:\-,[{]\s*(![^\s]+)?[ \t]*)(true|false)[ \t]*(?=\n|$|,|]|})/i,lookbehind:!0,alias:"important"},"null":{pattern:/([:\-,[{]\s*(![^\s]+)?[ \t]*)(null|~)[ \t]*(?=\n|$|,|]|})/i,lookbehind:!0,alias:"important"},string:{pattern:/([:\-,[{]\s*(![^\s]+)?[ \t]*)("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')(?=[ \t]*(\n|$|,|]|}))/,lookbehind:!0},number:{pattern:/([:\-,[{]\s*(![^\s]+)?[ \t]*)[+\-]?(0x[\dA-Fa-f]+|0o[0-7]+|(\d+\.?\d*|\.?\d+)(e[\+\-]?\d+)?|\.inf|\.nan)[ \t]*(?=\n|$|,|]|})/i,lookbehind:!0},tag:/![^\s]+/,important:/[&*][\w]+/,punctuation:/([:[\]{}\-,|>?]|---|\.\.\.)/};;

(function() {
  $(function() {
    $(".js-nav").navKit({
      state: "closed"
    });
    $(function() {
      var lazyImage;
      lazyImage = $(".js-lazy");
      return lazyImage.lazyload({
        effect: "fadeIn",
        threshold: 200,
        load: function() {
          return $(this).thumbImgFit();
        }
      });
    });
    return $(".js-spoiler").simpleSpoiler({
      state: "closed"
    });
  });

  (function() {
    var elements, isIE;
    isIE = function() {
      var myNav;
      myNav = navigator.userAgent.toLowerCase();
      if (myNav.indexOf("msie") !== -1) {
        return parseInt(myNav.split("msie")[1]);
      } else {
        return false;
      }
    };
    window.mobilecheck = function() {
      var check;
      check = false;
      (function(a, b) {
        if (/(android|bb\d+|meego).+mobile|avantgo|bada\/ |blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge   |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/ |plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino |android|ipad|playbook|silk/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)  |amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl( ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng) |dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze) |fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta) |hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/) |ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-  |kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(  01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )  |mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)  |nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(  ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55 \/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-  0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk) |tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)  |utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c (\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) {
          return check = true;
        }
      })(navigator.userAgent || navigator.vendor || window.opera);
      return check;
    };
    if (!window.mobilecheck()) {
      if (!isIE() | isIE() > 8) {
        elements = document.getElementsByClassName("js-view");
        return Intense(elements);
      }
    }
  })();

}).call(this);

(function() {
  (function($, window, document) {
    var ThumbImgFit, defaults;
    defaults = {
      thumb: 'js-thumb',
      thumbImg: 'js-thumb-img',
      thumbImgHor: 'is-horizontal',
      thumbImgVer: 'is-vertical'
    };
    ThumbImgFit = function(element, options) {
      this.options = $.extend({}, defaults, options);
      this.element = element;
      this.init();
    };
    ThumbImgFit.prototype.init = function() {
      var $this, $thumb, $thumbImg, thumbAspect, thumbImgAspect;
      $this = $(this.element);
      $thumb = $this.parent('.' + this.options.thumb);
      $thumbImg = $('.' + this.options.thumbImg);
      thumbAspect = $thumb.outerWidth() / $thumb.outerHeight();
      thumbImgAspect = $this.outerWidth() / $this.outerHeight();
      if (thumbImgAspect > thumbAspect) {
        $this.addClass(this.options.thumbImgHor);
      } else if (thumbImgAspect < thumbAspect) {
        $this.addClass(this.options.thumbImgVer);
      }
    };
    $.fn.thumbImgFit = function(options) {
      return this.each(function() {
        new ThumbImgFit(this, options);
      });
    };
  })(jQuery, window, document);

}).call(this);

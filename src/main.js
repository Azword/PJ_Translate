'use strict';
(function ($) {
  var _tradEnCours = {};

  function hashCode(that) {
    var hash = 0;
    for (var i = 0; i < that.length; i++) {
      var character = that.charCodeAt(i);
      hash = ((hash << 5) - hash) + character;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash;
  }

  function getTranslation(text, that, srcLang, targetlang) {
    return new Promise(function (resolve, reject) {
      translation = null;
      if (targetlang === translationLang) {
        var key = 'pjtranslate-' + hashCode(text).toString(),
          translation = sessionStorage.getItem(key);
      }
      if (null !== translation) {
        resolve({'trad': translation, 'that': that});
      } else {
        if (undefined == _tradEnCours[key]) {
          _tradEnCours[key] = [];

          $.ajax({
            url: "https://translation.googleapis.com/language/translate/v2/?key=YOUAPIKEY",
            type: "POST",
            dataType: "json",
            async: true,
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
              q: text.trim(),
              format: 'text',
              target: targetlang,
              source: srcLang,
              model: 'nmt'
            }),
            success: function (response) {
              var result = response.data.translations[0].translatedText;
              if (targetlang === translationLang)
                sessionStorage.setItem(key, result);

              _tradEnCours[key].forEach(function (fn) {
                fn({'trad': result + ' ', 'that': that});
              })
            }
          });
        }
        _tradEnCours[key].push(function (res) {
          resolve(res);
        });
      }
      ;
    });
  }

  $.fn.translate = function () {
    $.each(this, function () {
      var $dom = $(this);
      if ($dom.parents('.noTrad').length) return;

      var node = $dom.get(0);
      for (node = node.firstChild; node; node = node.nextSibling) {
        if (node.nodeType == 3 && node.textContent.trim() != '') { // text node non vides
          var p = getTranslation(node.textContent, node, 'fr', translationLang);
          p.then(function (res) {
            res.that.textContent = res.trad;
          })
        }
      }

      if ($dom.is('img, a, input, textarea')) {
        $.each(['placeholder', 'alt', 'title', 'value'], function (key, attr) {
          if ($dom.is('[' + attr + ']')) {
            var p = getTranslation($dom.attr(attr), $dom, 'fr', translationLang);
            p.then(function (res) {
              $(res.that).attr(attr, res.trad);
            });
          }
        });
      }
    });
  };

  ys.head.onScan('*:not(.noTrad, script, noscript, style, svg, meta, link)', function () {
    $('.sf-toolbar', $(this)).addClass('noTrad');
    if (translationLang) {
      $(this).translate();
    }
  });

})(ys.$);

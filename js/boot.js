// Runs before the game modules. Shows a friendly message instead of a blank screen
// when the device can't run the game, or when something fails while loading.
// (A plain script, not a module, so it also works on browsers too old for modules.)
(function () {
  var msg = document.getElementById('loadMsg');
  var box = document.getElementById('loading');

  function fail(text) {
    if (!box || box.hidden) return;
    box.classList.add('failed');
    msg.textContent = text;
  }

  // WebGL is required for the 3D street.
  var canvas = document.createElement('canvas');
  var gl = null;
  try {
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  } catch (e) {
    gl = null;
  }
  if (!gl) {
    fail(
      'Paumanhin, hindi kaya ng device o browser na ito ang 3D graphics (WebGL). Subukan sa ibang browser tulad ng Chrome, o i-on ang "hardware acceleration" sa settings.'
    );
    return;
  }

  // Modules and import maps are needed too (any browser from 2023 onward).
  var noModules = !('noModule' in document.createElement('script'));
  var noImportMap = !(
    window.HTMLScriptElement &&
    HTMLScriptElement.supports &&
    HTMLScriptElement.supports('importmap')
  );
  if (noModules || noImportMap) {
    fail(
      'Paumanhin, luma na ang browser na ito para sa larong ito. I-update ang browser o subukan ang Chrome, Edge, Firefox o Safari.'
    );
    return;
  }

  window.addEventListener('error', function (e) {
    var file = e.filename ? e.filename.split('/').pop() : '';
    fail('May nangyaring error habang naglo-load' + (file ? ' (' + file + ')' : '') + '. Subukang i-refresh ang page.');
  });
  window.addEventListener('unhandledrejection', function () {
    fail('Hindi ma-load ang ilang file ng laro. Suriin ang internet at i-refresh ang page.');
  });
  setTimeout(function () {
    if (box && !box.hidden) msg.textContent = 'Naglo-load pa rin... medyo mabagal ang koneksyon.';
  }, 12000);
})();

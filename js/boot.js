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
      'Sorry, this device or browser can\'t run 3D graphics (WebGL). Try another browser like Chrome, or turn on "hardware acceleration" in its settings.'
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
    fail('Sorry, this browser is too old for this game. Update it, or try Chrome, Edge, Firefox or Safari.');
    return;
  }

  window.addEventListener('error', function (e) {
    var file = e.filename ? e.filename.split('/').pop() : '';
    fail('Something went wrong while loading' + (file ? ' (' + file + ')' : '') + '. Try refreshing the page.');
  });
  window.addEventListener('unhandledrejection', function () {
    fail('Some game files could not load. Check your internet connection and refresh the page.');
  });
  setTimeout(function () {
    if (box && !box.hidden) msg.textContent = 'Still loading... the connection is a bit slow.';
  }, 12000);
})();

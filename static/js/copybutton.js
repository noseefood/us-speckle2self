document.addEventListener('DOMContentLoaded', function () {
  var copyBtn = document.getElementById('copy-bibtex-btn');
  var bibtexCode = document.getElementById('bibtex-code');
  if (!copyBtn || !bibtexCode) return;

  // FontAwesome's JS swaps <i> for <svg>, so feedback goes through the label.
  var label = copyBtn.querySelector('.copy-label');
  var resetTimer = null;

  function showFeedback(text, cls) {
    if (label) label.textContent = text;
    copyBtn.classList.remove('is-success', 'is-danger');
    copyBtn.classList.add(cls);
    clearTimeout(resetTimer);
    resetTimer = setTimeout(function () {
      if (label) label.textContent = 'Copy';
      copyBtn.classList.remove(cls);
    }, 1500);
  }

  // navigator.clipboard needs a secure context; fall back to a hidden textarea.
  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  copyBtn.addEventListener('click', function () {
    var text = bibtexCode.textContent;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        showFeedback('Copied!', 'is-success');
      }, function () {
        var ok = fallbackCopy(text);
        showFeedback(ok ? 'Copied!' : 'Failed', ok ? 'is-success' : 'is-danger');
      });
    } else {
      var ok = fallbackCopy(text);
      showFeedback(ok ? 'Copied!' : 'Failed', ok ? 'is-success' : 'is-danger');
    }
  });
});

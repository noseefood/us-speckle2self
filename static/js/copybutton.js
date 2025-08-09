document.addEventListener('DOMContentLoaded', function () {
  var copyBtn = document.getElementById('copy-bibtex-btn');
  var bibtexCode = document.getElementById('bibtex-code');
  if (copyBtn) {
    // Fix button width to prevent resizing on feedback
    copyBtn.style.width = copyBtn.offsetWidth + "px";
  }
  if (copyBtn && bibtexCode) {
    copyBtn.addEventListener('click', function () {
      var text = bibtexCode.innerText || bibtexCode.textContent;
      navigator.clipboard.writeText(text).then(function () {
        // Add feedback: change icon to check and button color
        copyBtn.classList.add('is-success');
        var icon = copyBtn.querySelector('i');
        if (icon) {
          icon.classList.remove('fa-copy');
          icon.classList.add('fa-check');
        }
        // Show feedback message
        showCopyFeedback(copyBtn, "Copied!");
        setTimeout(function () {
          copyBtn.classList.remove('is-success');
          if (icon) {
            icon.classList.remove('fa-check');
            icon.classList.add('fa-copy');
          }
        }, 1200);
      });
    });
  }

  function showCopyFeedback(btn, message) {
    // Remove existing feedback if present
    var old = btn.parentNode.querySelector('.copy-feedback');
    if (old) old.remove();
    var feedback = document.createElement('span');
    feedback.className = 'copy-feedback';
    feedback.innerText = message;
    btn.parentNode.appendChild(feedback);
    setTimeout(function () {
      feedback.remove();
    }, 1200);
  }
});
// Small helper to keep copyright year updated
document.addEventListener('DOMContentLoaded', () => {
  const yearSpan = document.getElementById('dd-year');
  if (yearSpan) {
    yearSpan.textContent = String(new Date().getFullYear());
  }
});



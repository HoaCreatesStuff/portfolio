document.querySelectorAll('a[href]').forEach((link) => {
  if (link.getAttribute('href') === 'contact.html' || link.classList.contains('site-nav__icon--linkedin') || link.classList.contains('site-nav__icon--email')) return;
  link.removeAttribute('href');
  link.removeAttribute('target');
  link.setAttribute('role', 'link');
  link.setAttribute('aria-disabled', 'true');
  link.setAttribute('tabindex', '0');
  link.setAttribute('data-unavailable-message', 'Portfolio is in development. Please come back later.');
  link.setAttribute('aria-description', 'Portfolio is in development. Please come back later.');
  link.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
});

document.querySelector('.performa-contact .contact-form')?.addEventListener('submit', (event) => {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const body = `${data.get('message')}\n\nFrom: ${data.get('name')}\nEmail: ${data.get('email')}${data.get('company') ? `\nCompany: ${data.get('company')}` : ''}`;
  location.href = `mailto:hoa.p.nguyen@gmail.com?subject=${encodeURIComponent(data.get('subject'))}&body=${encodeURIComponent(body)}`;
});

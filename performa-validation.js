document.querySelectorAll('.performa-validation__note').forEach((note) => {
  note.addEventListener('pointerenter', (event) => {
    if (event.pointerType === 'mouse' && !note.open) {
      note.open = true;
      note.dataset.hoverOpened = 'true';
    }
  });
  note.addEventListener('pointerleave', (event) => {
    if (event.pointerType === 'mouse' && note.dataset.hoverOpened === 'true') {
      note.open = false;
      delete note.dataset.hoverOpened;
    }
  });
  note.querySelector('summary').addEventListener('click', () => {
    delete note.dataset.hoverOpened;
  });
});

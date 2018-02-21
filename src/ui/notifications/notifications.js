const initialize = () => {
  $('.ui.modal').modal({
    closable: false
  }).modal('show');
};

document.addEventListener('DOMContentLoaded', initialize);

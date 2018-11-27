function Toast (id, time) {
  this.toast = $(id + ' .kl-toast');
  this.time = time || 2500;
  this.isShow = false;
}

Toast.prototype.show = function (text) {
  var _this = this;
  if (this.isShow) {
    return;
  }
  this.isShow = true;
  this.toast.text(text);
  this.toast.addClass('hl-toast_show');
  setTimeout(function() {
    _this._hide();
  }, this.time);
}

Toast.prototype._hide = function (text) {
  var _this = this;
  this.toast.removeClass('hl-toast_show');
  this.toast.addClass('hl-toast_hide');
  setTimeout(function() {
    _this.toast.removeClass('hl-toast_hide');
    _this.isShow = false;
  }, 300);
}

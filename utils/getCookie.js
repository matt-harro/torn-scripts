function getCookie(name) {
  var cookie = document.cookie.match('\\b' + name + '=([^;]*)\\b');
  return cookie ? cookie[1] : undefined;
}

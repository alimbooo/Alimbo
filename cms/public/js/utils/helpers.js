export function val(id) {
  return document.getElementById(id).value;
}

export function showMsg(msg, isError = false) {
  alert(msg);
}

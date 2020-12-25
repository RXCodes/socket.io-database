exports.generate_code = function() {
  // initialize variables
  var code = "";
  var i;

  // generate code
  for (i = 0; i < 8; i++) {
    code = code + String.fromCharCode(65 + (Math.random() * 25));
  }
}

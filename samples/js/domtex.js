/* domtex helper lib */

function generateRequestUrl(params) {
	var PORT = '8080';
	var domain = 'http://localhost:'+PORT;

	var reqURL = domain+'/generate?' + serialize(params);
	return reqURL;
}

var serialize = function(obj) {
  var str = [];
  for(var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
    }
  return str.join('&');
}
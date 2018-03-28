/* domtex helper lib */
'use strict';

var DOMTEX = {};

DOMTEX.generateRequestUrl = function(params) {
	var PORT = '8080';
	var domain = 'http://localhost:'+PORT;

	var reqURL = domain+'/generate?' + DOMTEX.serialize(params);
	return reqURL;
};

DOMTEX.serialize = function(obj) {
  var str = [];
  for(var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
    }
  return str.join('&');
};

//
if (window.THREE) {

  // TODO: also implement UV modification function
  DOMTEX.createTexture = function(sel, data) {
    var doc = data.textures['document'];

    var tex = data.textures[sel];

    var path = tex.path;
    var aspect = tex.width / tex.height;
    var texture = new THREE.TextureLoader().load( '/'+path );

    if (data.atlas) {
      texture.repeat.x = tex.width / doc.width;
      texture.repeat.y = tex.height / doc.height;

      var offsetX = tex.x / doc.width;
      var offsetY = ( ( doc.height - tex.height - tex.y ) / doc.height );
      texture.offset.x = offsetX;
      texture.offset.y = offsetY;

      _tex = texture;
    } else {
      // generate UVs
    }

    return texture;
  };

  // transform UVs based on repeat & offset
  DOMTEX.transformUVs = function(geo, texture) {
    let faces = geo.faceVertexUvs[0];
    for (let i = 0, n = faces.length; i < n; i++) {
      let faceUvs = faces[i];
      for (let k = 0; k < faceUvs.length; k++) {
        let faceUv = faceUvs[k];
        texture.transformUv(faceUv);
        console.log(faceUv);
      }
    }

    //geo.uvsNeedUpdate = true;
  };

  // Return a textured Box sized to
  // TODO: return a Plane
  DOMTEX.createObject3D = function(sel, data, s = 1/512) {
    var doc = data.textures['document'];

    var tex = data.textures[sel];
    console.log(tex);
    var aspect = tex.width / tex.height;

    var geometry = new THREE.PlaneGeometry(
      tex.width * s, tex.height * s );

    var texture = DOMTEX.createTexture(sel, data);
    //DOMTEX.transformUVs(geometry, texture);

    var material = new THREE.MeshBasicMaterial( { map: texture } );
    var object = new THREE.Mesh( geometry, material );

    object.name = sel;

    return object;
  };
}
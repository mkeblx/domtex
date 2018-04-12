/* domtex helper lib */
'use strict';

var DOMTEX = {};

DOMTEX.cache = {
  textures: {}
};

DOMTEX.modifyUVs = true;

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
    var texture;
    if (data.url in DOMTEX.cache.textures && DOMTEX.modifyUVs) {
      texture = DOMTEX.cache.textures[data.url];
    } else {
      texture = new THREE.TextureLoader().load( '/'+path );
      DOMTEX.cache.textures[data.url] = texture;
    }

    if (data.atlas) {
      if (!DOMTEX.modifyUVs) {
        texture.repeat.x = tex.width / doc.width;
        texture.repeat.y = tex.height / doc.height;

        var offsetX = tex.x / doc.width;
        var offsetY = ( ( doc.height - tex.height - tex.y ) / doc.height );
        texture.offset.x = offsetX;
        texture.offset.y = offsetY;
      }
    }

    return texture;
  };

  DOMTEX.modUVs = function(geo, data, sel) {
    var doc = data.textures['document'];
    var tex = data.textures[sel];

    var texMinX = tex.x / doc.width;
    var texMinY = tex.y / doc.height;
    var texMaxX = (tex.x + tex.width) / doc.width;
    var texMaxY = (tex.y + tex.height) / doc.height;
    var texWidth = tex.width / doc.width;
    var texHeight = tex.height / doc.height;

    var offsetX = texMinX;
    var offsetY = 1 - texMaxY;

    let faces = geo.faceVertexUvs[0];
    for (let i = 0, n = faces.length; i < n; i++) {
      let faceUvs = faces[i];
      for (let k = 0; k < faceUvs.length; k++) {
        let faceUv = faceUvs[k];

        let x = offsetX + (faceUv.x * texWidth);
        let y = offsetY + (faceUv.y * texHeight);

        faceUv.x = x;
        faceUv.y = y;
      }
    }
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
    var aspect = tex.width / tex.height;

    var geometry = new THREE.PlaneGeometry(
      tex.width * s, tex.height * s );

    var texture = DOMTEX.createTexture(sel, data);

    if (DOMTEX.modifyUVs) {
      DOMTEX.modUVs(geometry, data, sel);
    }

    var material = new THREE.MeshBasicMaterial( { map: texture } );
    var object = new THREE.Mesh( geometry, material );

    object.name = sel;

    return object;
  };
}
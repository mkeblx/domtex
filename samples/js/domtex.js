/* domtex helper lib */
'use strict';

var DOMTEX = {};

DOMTEX.cache = {
  responses: {},
  textures: {} // THREE
};

DOMTEX.modifyUVs = true;

DOMTEX.generateRequestUrl = function(params) {
	var PORT = '8080';
	var domain = 'http://localhost:'+PORT;

	var reqURL = domain+'/generate?' + DOMTEX._serialize(params);
	return reqURL;
};

DOMTEX._serialize = function(obj) {
  var str = [];
  for(var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]));
    }
  return str.join('&');
};

DOMTEX._checkStatus = function(response) {
  if (response.status >= 200 && response.status < 300) {
    return response;
  } else {
    var error = new Error(response.statusText);
    error.response = response;
    throw error;
  }
};

DOMTEX.getData = async function(request) {
  let resp = await fetch(request);
  let data = await resp.json();
  return data;
};

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

if (window.AFRAME) {
  AFRAME.registerComponent('domtex', {

    schema: {
      sel: {
        type: 'string'
      },
      template: {
        type: 'string'
      }
    },

    // for individual elements create geometry if needed
    // or use existing
    // set material texture
    // make aspect ratio correct
    init: async function() {
      //var url = this.data.url;
      var sel = this.data.sel;

      console.log('sel: ' + sel);

      var domtexAsset = document.getElementsByTagName('domtex')[0];

      var sels = domtexAsset.attributes.sels.value;
      var url = domtexAsset.attributes.url.value;

      // do requests
      var params = {
        url: url,
        sel: sel,
        atlas: true,
        force: true
      };
      var reqURL = DOMTEX.generateRequestUrl(params);

      console.log('reqURL: ' + reqURL);

      var data;
      if (url in DOMTEX.cache.responses) {
        data = DOMTEX.cache.responses[url];
      } else {
        data = await DOMTEX.getData(reqURL);
        DOMTEX.cache.responses[url] = data;
      }

      var tex = data.textures[sel];
      var width = tex.width;
      var height = tex.height;
      var aspect = width / height;
      var path = '/'+tex.path;

      var object = DOMTEX.createObject3D(sel, data);
      this.mesh = object;
      this.el.setObject3D('mesh', this.mesh);
    },

    update: function(oldData) {
      if (Object.keys(oldData).length === 0) { return; }
    },

    remove: function() {
      this.el.removeObject3D('mesh');
    }

  });
}
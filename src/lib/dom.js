// REFERENCED: https://stackoverflow.com/questions/68122097/how-can-i-ensure-text-is-valid-for-an-svg by vanowm
export const serializeSvg = svg => {
  const dummy = document.createElement("div")
  const svgData = svg.replace(/(&(?!(amp|gt|lt|quot|apos))[^;]+;)/g, a => {
    dummy.innerHTML = a;
    return dummy.textContent;
  })
  const preface = '<?xml version="1.0" standalone="no"?>\r\n';
  return preface + svgData
}

// Acknowledgement: https://gist.github.com/rokotyan/0556f8facbaf344507cdc45dc3622177
export const getSvgString = svgNode => {
  // const svgNode = document.createElementNS("http://www.w3.org/2000/svg", "svg")
  // svgNode.innerHTML = node.innerHTML

  // svgNode.childNodes[0].removeAttribute()

  // svgNode.setAttribute('xlink', 'http://www.w3.org/1999/xlink');
  let cssStyleText = getCSSStyles( svgNode );
  appendCSS( cssStyleText, svgNode );

  let serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(svgNode);
  svgString = svgString.replace(/(\w+)?:?xlink=/g, 'xmlns:xlink='); // Fix root xlink without namespace
  svgString = svgString.replace(/NS\d+:href/g, 'xlink:href'); // Safari NS namespace fix

  return svgString;

  function getCSSStyles( parentElement ) {
    let selectorTextArr = [];

    // Add Parent element Id and Classes to the list
    selectorTextArr.push( '#'+parentElement.id );
    for (let c = 0; c < parentElement.classList.length; c++)
      if ( !contains('.'+parentElement.classList[c], selectorTextArr) )
        selectorTextArr.push( '.'+parentElement.classList[c] );

    // Add Children element Ids and Classes to the list
    let nodes = parentElement.getElementsByTagName("*");
    for (let i = 0; i < nodes.length; i++) {
      let id = nodes[i].id;
      if ( !contains('#'+id, selectorTextArr) )
        selectorTextArr.push( '#'+id );

      let classes = nodes[i].classList;
      for (let c = 0; c < classes.length; c++)
        if ( !contains('.'+classes[c], selectorTextArr) )
          selectorTextArr.push( '.'+classes[c] );
    }

    // Extract CSS Rules
    let extractedCSSText = "";
    for (let i = 0; i < document.styleSheets.length; i++) {
      let s = document.styleSheets[i];

      try {
        if(!s.cssRules) continue;
      } catch( e ) {
        if(e.name !== 'SecurityError') throw e; // for Firefox
        continue;
      }

      let cssRules = s.cssRules;
      for (let r = 0; r < cssRules.length; r++) {
        if ( contains( cssRules[r].selectorText, selectorTextArr ) )
          extractedCSSText += cssRules[r].cssText;
      }
    }


    return extractedCSSText;

    function contains(str,arr) {
      return arr.indexOf(str) !== -1;
    }

  }

  function appendCSS( cssText, element ) {
    let styleElement = document.createElement("style");
    styleElement.setAttribute("type","text/css");
    styleElement.innerHTML = cssText;
    let refNode = element.hasChildNodes() ? element.children[0] : null;
    element.insertBefore( styleElement, refNode );
  }
}

// Acknowledgement: https://gist.github.com/rokotyan/0556f8facbaf344507cdc45dc3622177
export const svgString2Image = ( svgString, width, height, type) => new Promise(resolve => {
  // var format = format ? format : 'png';
  const dpi = window.devicePixelRatio || 1
  const aw = Math.ceil(width * dpi)
  const ah = Math.ceil(height * dpi)

  let imgsrc = 'data:image/svg+xml;base64,'+ btoa( unescape( encodeURIComponent( svgString ) ) ); // Convert SVG string to data URL
  let canvas = document.createElement("canvas");
  let context = canvas.getContext("2d");
  context.scale(dpi, dpi)

  canvas.width = aw;
  canvas.height = ah;

  let image = new Image();
  image.onload = function() {
    context.clearRect ( 0, 0, aw, ah );
    context.drawImage(image, 0, 0, aw, ah);

    canvas.toBlob( function(blob) {
      let filesize = Math.round( blob.length/1024 ) + ' KB';
      resolve( blob, filesize );
    }, type);
  };

  image.src = imgsrc;
})

export const downloadTextFile = (text, filename = "file") => {
  const a = document.createElement('a');
  a.download = filename;
  a.href = URL.createObjectURL(new Blob([text]));
  a.onclick = () => setTimeout(() => URL.revokeObjectURL(a.href), 15 * 1000);
  a.click();
}

export const downloadBlobFile = (blob, filename = "file") => {
  const a = document.createElement('a');
  a.download = filename;
  a.href = URL.createObjectURL(blob);
  a.onclick = () => setTimeout(() => URL.revokeObjectURL(a.href), 15 * 1000);
  a.click();
}

export const pxToVw = (px) => {
  return px * (100 / document.documentElement.clientWidth);
}

export const pxToVh = (px) => {
  return px * (100 / document.documentElement.clientHeight);
}

export const disableSelect = (event) => event.preventDefault();
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
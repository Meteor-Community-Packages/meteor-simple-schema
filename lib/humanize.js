/*
  Code source:
    https://github.com/jxson/string-humanize
    https://github.com/jxson/string-capitalize
 */

function capitalize(text) {
  text = text || '';
  text = text.trim();

  if (text[0]) {
    text = text[0].toUpperCase() + text.substr(1).toLowerCase();
  }

  // Do "ID" instead of "id" or "Id"
  text = text.replace(/\bid\b/g, 'ID');
  text = text.replace(/\bId\b/g, 'ID');

  return text;
}

function underscore(text) {
  text = text || '';
  text = text.toString(); // might be a number
  text = text.trim();
  text = text.replace(/([a-z\d])([A-Z]+)/g, '$1_$2');
  text = text.replace(/[-\s]+/g, '_').toLowerCase();

  return text;
}

function extname(text) {
  const index = text.lastIndexOf('.');
  const ext = text.substring(index, text.length);

  return (index === -1) ? '' : ext;
}

function humanize(text) {
  text = text || '';
  text = text.toString(); // might be a number
  text = text.trim();
  text = text.replace(extname(text), '');
  text = underscore(text);
  text = text.replace(/[\W_]+/g, ' ');

  return capitalize(text);
}

export default humanize;

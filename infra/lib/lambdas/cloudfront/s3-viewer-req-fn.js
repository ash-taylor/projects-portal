// biome-ignore lint/style/noVar: Cloudfront Function requires var
var IGNORE_SUFFIXES = {
  '.png': true,
  '.zip': true,
  '.svg': true,
  '.txt': true,
  '.html': true,
  '.js': true,
  '.css': true,
  '.ico': true,
  '.xml': true,
};

function handler(event) {
  // biome-ignore lint/style/noVar: Cloudfront Function requires var
  var suffixIndex = event.request.uri.lastIndexOf('.');

  // biome-ignore lint/style/noVar:
  var suffix;

  if (suffixIndex !== -1) {
    suffix = event.request.uri.substring(suffixIndex);

    if (IGNORE_SUFFIXES[suffix]) {
      return event.request;
    }
  }

  event.request.uri = '/index.html';
  return event.request;
}

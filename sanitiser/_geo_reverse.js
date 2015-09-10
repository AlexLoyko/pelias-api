var isObject = require('is-object');
var geo_common = require ('./_geo_common');

// validate inputs, convert types and apply defaults
module.exports = function sanitize( req ){
  var clean = req.clean || {};
  var params = req.query;
  var latlon_is_required = true;

  // ensure the input params are a valid object
  if( !isObject( params ) ){
    params = {};
  }

  if( !isObject( params.point ) ){
    params.point = {};
  }

  try {
    geo_common.sanitize_coord( 'lat', clean, params.point.lat, latlon_is_required );
    geo_common.sanitize_coord( 'lon', clean, params.point.lon, latlon_is_required );
    geo_common.sanitize_bbox(clean, params.bbox);
  }
  catch (err) {
    return {
      'error': true,
      'message': err.message
    };
  }

  req.clean = clean;

  return { 'error': false };
};
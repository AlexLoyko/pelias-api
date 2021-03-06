var _ = require('lodash'),
    check = require('check-types');
var logger = require('pelias-logger').get('api');

function getValidKeys(mapping) {
  return _.uniq(Object.keys(mapping)).join(',');
}

function setup( paramName, targetMap ) {
  return function( raw, clean ){
    return sanitize( raw, clean, {
      paramName: paramName,
      targetMap: targetMap,
      targetMapKeysString: getValidKeys(targetMap)
    });
  };
}

function sanitize( raw, clean, opts ) {
  // error & warning messages
  var messages = { errors: [], warnings: [] };

  // the string of targets (comma delimeted)
  var targetsString = raw[opts.paramName];

  // trim whitespace
  if( check.nonEmptyString( targetsString ) ){
    targetsString = targetsString.trim();

    // param must be a valid non-empty string
    if( !check.nonEmptyString( targetsString ) ){
      messages.errors.push(
        opts.paramName + ' parameter cannot be an empty string. Valid options: ' + opts.targetMapKeysString
      );
    }
    else {

      // split string in to array and lowercase each target string
      var targets = targetsString.split(',').map( function( target ){
        return target.toLowerCase(); // lowercase inputs
      });

      var matched = []; // put regex matches here

      // emit an error for each target *not* present in the targetMap
      targets.filter( function( target ){
        if(opts.targetMap.hasOwnProperty(target)) { // OK by direct equality
          return false;
        }
        // try regex
        for(var alias in opts.targetMap) {
          var reg = new RegExp(alias);
          if(reg.test(target)) {
            matched.push(target);
            return false;
          }
        }
        return true; // no match, filter away
      }).forEach( function( target ){
        messages.errors.push(
          '\'' + target + '\' is an invalid ' + opts.paramName + ' parameter. Valid options: ' + opts.targetMapKeysString
        );
      });

      // only set types value when no error occured
      if( !messages.errors.length ){
        clean[opts.paramName] = targets.reduce(function(acc, target) {
          if(opts.targetMap[target]) {
            return acc.concat(opts.targetMap[target]);
          }
          else {
            return acc;
          }
        }, []);
        clean[opts.paramName] = clean[opts.paramName].concat(matched);

        // dedupe in case aliases expanded to common things or user typed in duplicates
        clean[opts.paramName] = _.uniq(clean[opts.paramName]);
      }
    }
  }

  // string is empty
  else if( check.string( targetsString ) ){
    messages.errors.push(
      opts.paramName + ' parameter cannot be an empty string. Valid options: ' + opts.targetMapKeysString
    );
  }


  return messages;
}

module.exports = setup;

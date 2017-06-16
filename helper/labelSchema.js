var _ = require('lodash');
var fuzzy = require('../helper/fuzzyMatch');
var api = require('pelias-config').generate().api;

var schemas = {
  'default': {
    'local': getFirstProperty(['locality', 'localadmin']),
    'country': getFirstProperty(['country'])
  }
};

console.log(api);
if (api && api.localization && api.localization.labelSchemas) {
  var imported = api.localization.labelSchemas;
  console.log(imported);

  for (var country in imported) {
    console.log(country);
    var schema = imported[country];

    for (var key in schema) { // convert to the convention above
      console.log(schema[key].fields);
      schema[key] = getFirstProperty(  // param array to func
        schema[key].fields,
        schema[key].matchType,
        schema[key].targets
      );
    }
    schemas[country] = schema;
    console.log(schemas["USA"]);
  }
}

module.exports = schemas;

function baseVal(val) {
  if (Array.isArray(val)) {
    return val[0];
  }
  return val;
}

// find the first field of record that has a non-empty value that's not already in labelParts
function getFirstProperty(fields, matchType, targets) {
  return function(record, req) {
    console.log("RECORD");
    console.log(record);
    if (targets && targets.indexOf(record.layer)===-1) {
      return null; // not applicable to this kind of record
    }
    var matchRegions;
    if(matchType==='best' && req && req.clean && req.clean.parsed_text &&
       req.clean.parsed_text.regions && req.clean.parsed_text.regions.length>0) {
      matchRegions = req.clean.parsed_text.regions;
    }
    var bestScore = -1;
    var bestField;
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i];
      var fieldValue;
      if (Array.isArray(field)) { // chain multi parts
        var parts = [];
        for (var j = 0; j < field.length; j++) {
          var val = baseVal(record[field[j]]);
          if (!_.isEmpty(val)) {
            parts.push(val);
          }
        }
        if(parts.length>0) {
          fieldValue = parts.join(' ');
        }
      } else {
        //fieldValue = baseVal(record[field]);
        fieldValue = record[field];
      }
      if (!_.isEmpty(fieldValue)) {
        if(matchRegions) {
          var score = fuzzy.matchArray(fieldValue, matchRegions);
          if(score>bestScore) {
            bestScore = score;
            bestField = fieldValue;
          }
        } else { // default case, matchType === 'first'
          return fieldValue;
        }
      }
    }
    return bestField;
  };
}

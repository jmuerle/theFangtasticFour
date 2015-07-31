var parseString = require('xml2js').parseString;
var https = require('https');

function getFogbugzCase(caseNum, callback) {
  var txt = "";
  https.get("https://ixl.fogbugz.com/api.asp?token=vfbn807fh1k1bnvkj6kubnsb0ra0vb&cmd=search&q=" + caseNum + "&cols=dtOpened", function(res) {
    res.setEncoding('utf8');
    // Put together the data from the chunks.
    res.on("data", function(chunk) {
      txt += chunk;
    });
    // When all chunks are read, parse the resulting xml and make the callback with the result.
    res.on('end', function () {
      parseString(txt, function (err, result) {
        callback(getCaseInFlatFormat(result.response.cases[0].case[0]));
      });
    })
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });
}

function getCaseInFlatFormat(caseObj) {
  return {
    caseNumber: parseInt(caseObj["$"].ixBug),
    dateOpened: toMySQLDateFormat(new Date(Date.parse(caseObj.dtOpened[0]))),
  };
}

function toMySQLDateFormat(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

exports.getFogbugzCase = getFogbugzCase;

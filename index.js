var express = require('express');
var app = express();
var pg = require('pg');
var caseRequester = require("./fogbugzCaseRequester");
var trophyQueries = require("./trophyQueries");

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  var numQueries = 8,
    currQueriesComplete = 0,
    numRanks = 5,
    client = new pg.Client(process.env.DATABASE_URL),
    awards = [];
  function pushAward(award) {
    awards.push(award);
    currQueriesComplete += 1;
    if (currQueriesComplete === numQueries) {
      response.render('pages/index', {
        awards: awards
      });
    }
  }
  client.connect(function (err) {
    trophyQueries.mostBugsResolved(client, function (result) {
      var createRanking = function (row) {
        return {name: row.person_editing_name, value: row.bugs_resolved};
      }
      pushAward({
        name: 'Captain Kiwi',
        trophySrc: '/images/captainkiwiaward.png',
        rankings: dedupe(result.rows).slice(0, numRanks).map(createRanking),
        description: 'For Most Cases Fixed'
      });
    });
    trophyQueries.mostBugsOpened(client, function (result) {
      var createRanking = function (row) {
        return {name: row.person_editing_name, value: row.bugs_opened};
      }
      pushAward({
        name: 'Bug Sleuth',
        trophySrc: '/images/bugsleuth.png',
        rankings: dedupe(result.rows).slice(0, numRanks).map(createRanking),
        description: 'For Most Cases Opened'
      });
    });
    trophyQueries.mostBugsReopened(client, function (result) {
      var createRanking = function (row) {
        return {name: row.person_editing_name, value: row.bugs_reopened};
      }
      pushAward({
        name: 'Checkin\' It Twice',
        trophySrc: '/images/listaward.png',
        rankings: dedupe(result.rows).slice(0, numRanks).map(createRanking),
        description: 'For Most Cases Reopened'
      });
    });
    trophyQueries.mostComments(client, function (result) {
      var createRanking = function (row) {
        return {name: row.person_editing_name, value: row.num_comments};
      }
      pushAward({
        name: 'Busy Bee',
        trophySrc: '/images/busybeeaward.png',
        rankings: dedupe(result.rows).slice(0, numRanks).map(createRanking),
        description: 'For Most Comments Made On Cases'
      });
    });
    trophyQueries.longestComment(client, function (result) {
      var createRanking = function (row) {
        return {name: row.person_editing_name, value: row.num_chars};
      }
      pushAward({
        name: 'Tolkien',
        trophySrc: '/images/tolkienaward.png',
        rankings: dedupe(result.rows).slice(0, numRanks).map(createRanking),
        description: 'For Longest Comment Made On A Case'
      });
    });
    trophyQueries.oldestBugResolved(client, function (result) {
      var date;
      var createRanking = function (row) {
        return {name: row.person_editing_name, value: row.first_creation_date.toDateString()};
      }
      pushAward({
        name: 'When Pigs Fly',
        trophySrc: '/images/flyingpigaward.png',
        rankings: dedupe(result.rows).slice(0, numRanks).map(createRanking),
        description: 'For Oldest Case Fixed'
      });
    });
    trophyQueries.earliestActivity(client, function (result) {
      var rows = !result.rows || result.rows.length === 0 
        ? [{person_editing_name: 'James Muerle', event_time: new Date() }]
        : dedupe(result.rows).slice(0, numRanks);

      pushAward({
        name: 'Early Bird',
        trophySrc: '/images/earlybirdaward.png',
        rankings: rows.map(function(row) { 
          return { name: row.person_editing_name, value: toTimeString(row.event_time)};
        }),
        description: 'For Earliest Activity'
      });
    });
    trophyQueries.latestActivity(client, function (result) {
      var rows = result.rows.length === 0 
        ? [{person_editing_name: 'James Muerle', event_time: '2:00 am' }]
        : dedupe(result.rows).slice(0, numRanks);
      
      pushAward({
        name: 'Night Owl',
        trophySrc: '/images/nightowlaward.png',
        rankings: rows.map(function(row) { 
          return { name: row.person_editing_name, value: toTimeString(row.event_time)}; // HACK
        }),
        description: 'For Latest Activity'
      });
    });
  });
});

app.get('/fogbugzUpdate', function(request, response) {
  var caseArgs = request.query,
    caseNum = parseInt(caseArgs.caseNumber),
    client = new pg.Client(process.env.DATABASE_URL);
  client.connect(function(err) {
    client.query('SELECT * FROM cases WHERE case_number=' + caseNum, function (err, result) {
      if (result.rows.length === 0) {
        caseRequester.getFogbugzCase(caseNum, function (retrievedCaseObj) {
          addCaseObjToDb(client, retrievedCaseObj, function (caseObj) {
            addUpdateToDb(client, caseObj, caseArgs, function () {
              client.end();
            });
          });
        });
      }
      else {
        caseObj = result.rows[0];
        addUpdateToDb(client, caseObj, caseArgs, function () {
          client.end();
        });
      }
    });
  });
  response.end("Thanks");
});

function addCaseObjToDb(client, caseObj, callback) {
  console.log("Inserting new case into db with number:" + caseObj.caseNumber);
  client.query(
    'INSERT INTO cases (case_number, creation_date) VALUES (' + caseObj.caseNumber + ', \'' + caseObj.dateOpened + '\')' +
    ' RETURNING *',
    function (err, result) {
      callback(result.rows[0]);
    }
  );
}

// The following are sample fields of a caseArgs object.
// assignedToName: 'Kevin O\'Connor',
// caseNumber: '74770',
// eventText: '<p>\r\n\tre-opening</p>\r\n',
// eventTime: '2015-07-31 01:20:05Z',
// eventType: 'CaseReopened',
// personEditingName: 'Kevin O\'Connor',
// projectName: 'Tools & Services',
// statusName: 'Active',
// title: 'Test Bug for Fangtastic Four'
function addUpdateToDb(client, caseObj, caseArgs, callback) {
  console.log("Inserting new update into db with args:");
  console.log(caseArgs);
  var eventText = caseArgs.eventText || null,
    assignedToName = caseArgs.assignedToName || null,
    query =
    "INSERT INTO case_events " +
      "(case_id, person_editing_name, assigned_to_name, event_type, status_name, event_text, event_time, title, project_name) " +
      "VALUES (" + caseObj.case_id + ", '" + escapeQuotes(caseArgs.personEditingName) + "', '" + escapeQuotes(assignedToName) +
        "', '" + caseArgs.eventType + "', '" + caseArgs.statusName + "', '" + escapeQuotes(eventText) + "', '" + caseArgs.eventTime +
        "', '" + escapeQuotes(caseArgs.title) + "', '" + escapeQuotes(caseArgs.projectName) + "')";
  client.query(query, function (err) {
    callback();
  });
}

function dedupe(a) {
  var nameSet = {};
  var unique = [];
  a.forEach(function(x) {
    if (nameSet.hasOwnProperty(x.name)) { 
      continue; 
    }
    else {
      unique.push(x);
      nameSet[x.name] = true;
    }
  });
  return unique;
}

function toTimeString(date) {
  var timeString = date.toTimeString();
  return timeString.slice(0, timeString.length - 11);
}

function escapeQuotes(str) {
  return str.replace(/'/g, "''");
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

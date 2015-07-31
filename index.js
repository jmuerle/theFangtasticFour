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
  var numQueries = 7,
    currQueriesComplete = 0,
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
      var topRow = result.rows[0];
      pushAward({
        name: 'Problem Solver',
        trophySrc: '/images/',
        rankings: [{name: topRow.person_editing_name, value: topRow.bugs_resolved}],
        description: 'For Most Cases Fixed'
      });
    });
    trophyQueries.mostBugsOpened(client, function (result) {
      var topRow = result.rows[0];
      pushAward({
        name: 'Bug Sleuth',
        trophySrc: '/images/bugsleuth.png',
        rankings: [{name: topRow.person_editing_name, value: topRow.bugs_opened}],
        description: 'For Most Cases Opened'
      });
    });
    trophyQueries.mostBugsReopened(client, function (result) {
      var topRow = result.rows[0];
      pushAward({
        name: 'Checkin\' it Twice',
        trophySrc: '/images/',
        rankings: [{name: topRow.person_editing_name, value: topRow.bugs_reopened}],
        description: 'For Most Cases Reopened'
      });
    });
    trophyQueries.mostComments(client, function (result) {
      var topRow = result.rows[0];
      pushAward({
        name: 'Busy Bee',
        trophySrc: '/images/busybeeaward.png',
        rankings: [{name: topRow.person_editing_name, value: topRow.num_comments}],
        description: 'For Most Comments Made On Cases'
      });
    });
    trophyQueries.longestComment(client, function (result) {
      var topRow = result.rows[0];
      pushAward({
        name: 'The Tolkien Award',
        trophySrc: '/images/',
        rankings: [{name: topRow.person_editing_name, value: topRow.num_chars}],
        description: 'For Longest Comment Made On A Case'
      });
    });
    trophyQueries.oldestBugResolved(client, function (result) {
      var topRow = result.rows[0];
      pushAward({
        name: 'When Pigs Fly',
        trophySrc: '/images/flyingpigaward.png',
        rankings: [{name: topRow.person_editing_name, value: topRow.first_creation_date}],
        description: 'For Oldest Case Fixed'
      });
    });
    trophyQueries.earliestActivity(client, function (result) {
      var rows = result.rows || [{name: 'James Muerle', value: '6:00 am' }];
      pushAward({
        name: 'Early bird',
        trophySrc: '/images/earlybirdaward.png',
        rankings: rows.map(function(row) { return { name: row.person_editing_name, value: row.event_time}; }),
        description: 'For Earliest Activity'
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

function escapeQuotes(str) {
  return str.replace(/'/g, "''");
}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

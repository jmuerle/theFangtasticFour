var express = require('express');
var app = express();
var pg = require('pg');
var caseRequester = require("./fogbugzCaseRequester");

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index', {
    awards: [
      {
        name: 'Bug Sleuth',
        trophySrc: '/images/bugsleuth.png',
        winnerName: 'Sherlock Holmes',
        description: 'For Most Bugs Fixed'
      }
    ]
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
  client.query(
    'INSERT INTO cases (case_number, creation_date) VALUES (' + caseObj.caseNumber + ', \'' + caseObj.dateOpened + '\')' +
    ' RETURNING *',
    function (err, result) {
      console.log("got result:");
      console.log(result.rows);
      callback(result.rows[0]);
      // client.query('SELECT * FROM cases WHERE case_number=' + caseObj.caseNumber, function (err, result) {
      //   callback(result.rows[0]);
      // });
    }
  );
}

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
  var eventText = caseArgs.eventText || null,
    assignedToName = caseArgs.assignedToName || null,
    query =
    "INSERT INTO case_events " +
      "(case_id, person_editing_name, assigned_to_name, event_type, status_name, event_text, event_time, title, project_name) " +
      "VALUES (" + caseObj.case_id + ", '" + escapeQuotes(caseArgs.personEditingName) + "', '" + escapeQuotes(assignedToName) +
        "', '" + caseArgs.eventType + "', '" + caseArgs.statusName + "', '" + escapeQuotes(eventText) + "', '" + caseArgs.eventTime +
        "', '" + escapeQuotes(caseArgs.title) + "', '" + escapeQuotes(caseArgs.projectName) + "')";
  console.log("going to execute query: " + query);
  client.query(query, function (err) {
    console.log("Error:");
    console.log(err);
  });
    // switch (caseArgs.eventType) {
    //   case "CaseEdited":
    //     handleCaseEdited(client, caseArgs);
    //     break;
    //   case "CaseAssigned":
    //     handleCaseAssigned(client, caseArgs);
    //     break;
    //   case "CaseResolved":
    //     handleCaseResolved(client, caseArgs);
    //     break;
    //   case "CaseClosed":
    //     handleCaseClosed(client, caseArgs);
    //     break;
    //   case "CaseReopened":
    //     handleCaseReopened(client, caseArgs);
    //     break;
    //   case "CaseReactivated":
    //     handleCaseReactivated(client, caseArgs);
    //     break;
    // }
}

function escapeQuotes(str) {
  return str.replace(/'/g, "\\'");
}

// function handleCaseEdited(client, caseArgs) {
//   console.log("case edited");
//   console.log(caseArgs);
// }

// function handleCaseAssigned(client, caseArgs) {
//   console.log("case assigned");
//   console.log(caseArgs);
// }

// function handleCaseResolved(client, caseArgs) {
//   console.log("case resolved");
//   console.log(caseArgs);

// }

// function handleCaseClosed(client, caseArgs) {
//   console.log("case closed");
//   console.log(caseArgs);

// }

// function handleCaseReopened(client, caseArgs) {
//   console.log("case reopened");
//   console.log(caseArgs);

// }

// function handleCaseReactivated(client, caseArgs) {
//   console.log("case reactivated");
//   console.log(caseArgs);
// }

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

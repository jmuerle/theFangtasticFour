var express = require('express');
var app = express();
var pg = require('pg');

app.set('port', (process.env.PORT || 5000));

app.use(express.static(__dirname + '/public'));

// views is directory for all template files
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

app.get('/', function(request, response) {
  response.render('pages/index', {
    awards: [
      {
        name: 'Bug sleuth',
        trophySrc: 'images/bugsleuth.png',
        winnerName: 'Sherlock Holmes',
        description: 'Most bugs fixed'
      }
    ]
  });
});

app.get('/fogbugzUpdate', function(request, response) {
  pg.connect(process.env.DATABASE_URL, function(err, client) {
    var query = client.query('SELECT * FROM your_table');

    query.on('row', function(row) {
      console.log(JSON.stringify(row));
    });
    switch (request.query.eventType) {
      case "CaseEdited":
        handleCaseEdited(request.query);
        break;
      case "CaseAssigned":
        handleCaseAssigned(request.query);
        break;
      case "CaseResolved":
        handleCaseResolved(request.query);
        break;
      case "CaseClosed":
        handleCaseClosed(request.query);
        break;
      case "CaseReopened":
        handleCaseReopened(request.query);
        break;
      case "CaseReactivated":
        handleCaseReactivated(request.query);
        break;
    }
  
  }
  response.end("Thanks");
});

function handleCaseEdited(reqArgsForCase) {
  console.log("case edited");
  console.log(reqArgsForCase);
}

function handleCaseAssigned(reqArgsForCase) {
  console.log("case assigned");
  console.log(reqArgsForCase);
}

function handleCaseResolved(reqArgsForCase) {
  console.log("case resolved");
  console.log(reqArgsForCase);

}

function handleCaseClosed(reqArgsForCase) {
  console.log("case closed");
  console.log(reqArgsForCase);

}

function handleCaseReopened(reqArgsForCase) {
  console.log("case reopened");
  console.log(reqArgsForCase);

}

function handleCaseReactivated(reqArgsForCase) {
  console.log("case reactivated");
  console.log(reqArgsForCase);

}

app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});

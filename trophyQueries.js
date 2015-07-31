function mostBugsResolved(client, callback) {
  var query = "select person_editing_name, count(*) AS bugs_resolved from case_events " +
    "where event_type='CaseResolved' and event_time between '2015-07-30' and '2015-08-04' " +
    "group by person_editing_name order by bugs_resolved desc";
  client.query(query, function (err, result) {
    callback(result);
  });
}

function mostBugsOpened(client, callback) {
  var query = "select person_editing_name, count(*) AS bugs_opened from case_events " +
    "where event_type='CaseAssigned' and event_time between '2015-07-30' and '2015-08-04' " +
    "group by person_editing_name order by bugs_opened desc";
  client.query(query, function (err, result) {
    callback(result);
  });
}

function mostBugsReopened(client, callback) {
  var query = "select person_editing_name, count(*) AS bugs_reopened from case_events " +
    "where event_type='CaseReopened' and event_time between '2015-07-30' and '2015-08-04' " +
    "group by person_editing_name order by bugs_reopened desc";
  client.query(query, function (err, result) {
    callback(result);
  });
}

function mostComments(client, callback) {
  var query = "select person_editing_name, count(*) AS num_comments from case_events " +
    "where event_type='CaseEdited' and event_text is not null and event_time between '2015-07-30' and '2015-08-04' " +
    "group by person_editing_name order by num_comments desc";
  client.query(query, function (err, result) {
    callback(result);
  });
}

function longestComment(client, callback) {
  var query = "select event_text, person_editing_name, length(event_text) AS num_chars from case_events " +
    "order by length(event_text) desc";
  client.query(query, function (err, result) {
    callback(result);
  });
}

function oldestBugResolved(client, callback) {
  var query = "select person_editing_name, cases.case_id, cases.creation_date AS first_creation_date from case_events " +
    "left outer join cases on (cases.case_id = case_events.case_id) " +
    "where event_type='CaseResolved' and event_time between '2015-07-30' and '2015-08-04' " +
    "order by first_creation_date asc";
  client.query(query, function (err, result) {
    callback(result);
  });
}

function getPacificTimeHour(date) {
  return (date.getHours() + 16) % 24;
}

function earliestActivity(client, callback) {
  var getAllDateQuery = "select person_editing_name, event_time from case_events " +
    "where event_time between '2015-07-30' and '2015-08-04'";

  client.query(getAllDateQuery, function(err, result) {

    if (err) { console.log(err); }
    var rows = result.rows;

    rows = rows.filter(function(row) { return getPacificTimeHour(row.event_time) >= 5; });

    rows.sort(function(row1, row2) {
      return getPacificTimeHour(row1.event_time) - getPacificTimeHour(row2.event_time);
    });

    callback(rows);
  });
}

function latestActivity(client, callback) {
  var getAllDateQuery = "select person_editing_name, event_time from case_events " +
    "where event_time between '2015-07-30' and '2015-08-04'";

  client.query(getAllDateQuery, function(err, result) {

    if (err) { console.log(err); }
    var rows = result.rows;

    rows = rows.filter(function(row) { 
      var h = getPacificTimeHour(row.event_time) 
      return h >= 18 || h < 5;
    });

    rows.sort(function(row1, row2) {
      var h1 = getPacificTimeHour(row1.event_time);
      var h2 = getPacificTimeHour(row2.event_time);

      return ((h2 + 19) % 24) - ((h1 + 19 % 24);
    });

    callback(rows);
  });
}

exports.mostBugsResolved = mostBugsResolved;
exports.mostBugsOpened = mostBugsOpened;
exports.mostBugsReopened = mostBugsReopened;
exports.mostComments = mostComments;
exports.longestComment = longestComment;
exports.oldestBugResolved = oldestBugResolved;
exports.earliestActivity = earliestActivity;
exports.latestActivity = latestActivity;


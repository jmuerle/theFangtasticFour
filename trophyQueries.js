function mostBugsResolved(client, callback) {
  var query = "select person_editing_name, count(*) AS bugs_resolved from case_events " +
    "where event_type='CaseResolved' and event_time between '2015-07-30' and '2015-08-04' " +
    "group by person_editing_name order by count desc";
  client.query(query, function (err, result) {
    callback(result);
  });
}

function mostBugsOpened(client, callback) {
  var query = "select person_editing_name, count(*) AS bugs_opened from case_events " +
    "where event_type='CaseAssigned' and event_time between '2015-07-30' and '2015-08-04' " +
    "group by person_editing_name order by count desc";
  client.query(query, function (err, result) {
    callback(result);
  });
}

function mostBugsReopened(client, callback) {
  var query = "select person_editing_name, count(*) AS bugs_reopened from case_events " +
    "where event_type='CaseReopened' and event_time between '2015-07-30' and '2015-08-04' " +
    "group by person_editing_name order by count desc";
  client.query(query, function (err, result) {
    callback(result);
  });
}

function mostComments(client, callback) {
  var query = "select person_editing_name, count(*) AS num_comments from case_events " +
    "where event_type='CaseEdited' and event_text is not null and event_time between '2015-07-30' and '2015-08-04' " +
    "group by person_editing_name order by count desc";
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
  var query = "select person_editing_name, cases.case_id, cases.creation_date AS creation_date from case_events " +
    "left outer join cases on (cases.case_id = case_events.case_id) " +
    "where event_type='CaseResolved' and event_time between '2015-07-30' and '2015-08-04' " +
    "order by cases.creation_date desc";
  client.query(query, function (err, result) {
    callback(result);
  });
}

exports.mostBugsResolved = mostBugsResolved;
exports.mostBugsOpened = mostBugsOpened;
exports.mostBugsReopened = mostBugsReopened;
exports.mostComments = mostComments;
exports.longestComment = longestComment;
exports.oldestBugResolved = oldestBugResolved;
CREATE TABLE cases (
  case_id        SERIAL PRIMARY KEY,
  case_number    integer NOT NULL,
  creation_date  date NOT NULL
);

CREATE TABLE case_events (
  case_event_id         SERIAL PRIMARY KEY,
  case_id               integer REFERENCES cases (case_id) NOT NULL,
  person_editing_name   varchar(256) NOT NULL,
  assigned_to_name      varchar(256),
  event_type            varchar(256) NOT NULL,
  status_name           varchar(256) NOT NULL,
  event_text            varchar(256),
  event_time            date NOT NULL,
  title                 varchar(256) NOT NULL,
  project_name          varchar(256) NOT NULL
);
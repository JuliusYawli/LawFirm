CREATE TABLE IF NOT EXISTS contact_requests (
 id uuid PRIMARY KEY,
 name varchar(120) NOT NULL,
 email varchar(254) NOT NULL,
 message varchar(2000) NOT NULL,
 preferred_date date,
 language varchar(2) NOT NULL CHECK (language IN ('pt','en')),
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','contacted','closed')),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS request_limits (
 key text PRIMARY KEY,
 window_start timestamptz NOT NULL,
 count integer NOT NULL
);

CREATE INDEX IF NOT EXISTS request_limits_window_idx ON request_limits(window_start);

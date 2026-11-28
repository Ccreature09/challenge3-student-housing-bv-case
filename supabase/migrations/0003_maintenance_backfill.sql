-- Requests created before 0002 stored the location and the landlord's reply
-- inside "description" ("Location: …\n\n<text>\n\n[Admin response]: …") and
-- had no house/room. Move those parts into their columns and link each request
-- to the room its tenant lived in (their latest tenancy). Safe to run again:
-- only rows without a house are touched.
WITH latest AS (
  SELECT DISTINCT ON (a.student_id) a.student_id, a.room_id, r.house_id
  FROM "ROOM_ASSIGNMENTS" a
  JOIN "ROOMS" r ON r.id = a.room_id
  ORDER BY a.student_id, a.start_date DESC
)
UPDATE "MAINTENANCE_OR_COMPLAINTS" m
SET
  house_id = latest.house_id,
  room_id = latest.room_id,
  location = coalesce(m.location, substring(m.description FROM '^Location: ([^\n]*)')),
  response = coalesce(m.response, substring(m.description FROM '\n\n\[Admin response\]: (.*)$')),
  description = regexp_replace(
    regexp_replace(m.description, '\n\n\[Admin response\]: .*$', ''),
    '^Location: [^\n]*\n\n', ''
  )
FROM latest
WHERE m.house_id IS NULL AND m.submitted_by = latest.student_id;

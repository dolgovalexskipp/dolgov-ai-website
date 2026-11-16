# Private school survey

Standalone submission service; no public response listing or export. The encrypted page contains a submission-only credential. Never commit the environment file, plaintext page, password or response data.

Runtime: Python standard library, systemd unit in this directory, nginx `/school-api/` → `127.0.0.1:8098` on the existing HTTPS virtual host. `/etc/dolgov-school-survey.env` defines `SURVEY_TOKEN`. State is `/var/lib/dolgov-school-survey/answers.sqlite3`, private to the service user.

Run `python3 test_server.py`. Install only after committing and pushing; preserve existing nginx locations and validate with `nginx -t` before reload. Roll back by removing only the new location and stopping `dolgov-school-survey`; preserve the database.

Export over SSH as an authorized administrator: `python3 /opt/dolgov-school-survey/export.py`. CSV fields are spreadsheet-formula escaped. Download it to a private file, never place it in the website. Back up SQLite using its backup API, not a live file copy.

Frontend acceptance: wrong/correct password, required fields, failed POST, unchanged retry, changed response, actual saved receipt, no public read, widths 375/1440. Synthetic acceptance records must be identified and removed by their exact IDs after verification.

## November 2026 final feedback

The same submission-only endpoint accepts event `komanda-2026-11-feedback`. It uses the existing private table and credential; no migration or public export is added. The original `komanda-2026-11` questionnaire and export remain unchanged. Feedback does not collect participant names or contacts. Valid NPS values are strings `0`–`10`; missing NPS is excluded from the denominator.

Run all checks: `python3 -m unittest discover -s _tools/school-survey -v` from the repository root. Private aggregate summary: `python3 /opt/dolgov-school-survey/export_feedback.py`. It reports response count, NPS denominator and score distribution; no responses means `nps: null`.

Release: commit/push first, use SQLite backup API, install only server.py and export_feedback.py, restart this service. Preserve the environment, database, existing export and nginx config. Validate an exact synthetic receipt and remove only that receipt.

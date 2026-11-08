# Private school survey

Standalone submission service; no public response listing or export. The encrypted page contains a submission-only credential. Never commit the environment file, plaintext page, password or response data.

Runtime: Python standard library, systemd unit in this directory, nginx `/school-api/` → `127.0.0.1:8098` on the existing HTTPS virtual host. `/etc/dolgov-school-survey.env` defines `SURVEY_TOKEN`. State is `/var/lib/dolgov-school-survey/answers.sqlite3`, private to the service user.

Run `python3 test_server.py`. Install only after committing and pushing; preserve existing nginx locations and validate with `nginx -t` before reload. Roll back by removing only the new location and stopping `dolgov-school-survey`; preserve the database.

Export over SSH as an authorized administrator: `python3 /opt/dolgov-school-survey/export.py`. CSV fields are spreadsheet-formula escaped. Download it to a private file, never place it in the website. Back up SQLite using its backup API, not a live file copy.

Frontend acceptance: wrong/correct password, required fields, failed POST, unchanged retry, changed response, actual saved receipt, no public read, widths 375/1440. Synthetic acceptance records must be identified and removed by their exact IDs after verification.

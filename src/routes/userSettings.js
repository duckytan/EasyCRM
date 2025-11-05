function getDefaultSettings() {
  return {
    darkMode: 0,
    visitReminder: 1,
    birthdayReminder: 0,
    language: 'zh-CN',
    lastBackup: null,
  };
}

function registerUserSettingsRoutes(app, db) {
  app.get('/api/user-settings', (_req, res) => {
    db.get('SELECT * FROM UserSettings WHERE id = 1', (err, row) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (!row) {
        res.json(getDefaultSettings());
        return;
      }

      res.json({
        darkMode: Boolean(row.darkMode),
        visitReminder: Boolean(row.visitReminder),
        birthdayReminder: Boolean(row.birthdayReminder),
        language: row.language,
        lastBackup: row.lastBackup,
      });
    });
  });

  app.put('/api/user-settings', (req, res) => {
    const { darkMode, visitReminder, birthdayReminder, language, lastBackup } = req.body;

    const darkModeValue = darkMode ? 1 : 0;
    const visitReminderValue = visitReminder ? 1 : 0;
    const birthdayReminderValue = birthdayReminder ? 1 : 0;

    db.run(
      `UPDATE UserSettings SET
        darkMode = ?,
        visitReminder = ?,
        birthdayReminder = ?,
        language = ?,
        lastBackup = ?
      WHERE id = 1`,
      [darkModeValue, visitReminderValue, birthdayReminderValue, language, lastBackup],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        if (this.changes === 0) {
          db.run(
            `INSERT INTO UserSettings (id, darkMode, visitReminder, birthdayReminder, language, lastBackup)
             VALUES (1, ?, ?, ?, ?, ?)`,
            [darkModeValue, visitReminderValue, birthdayReminderValue, language, lastBackup],
            (insertErr) => {
              if (insertErr) {
                res.status(500).json({ error: insertErr.message });
                return;
              }

              res.json({ success: true, message: '设置已创建' });
            },
          );
        } else {
          res.json({ success: true, message: '设置已更新' });
        }
      },
    );
  });

  app.put('/api/user-settings/dark-mode', (req, res) => {
    const { value } = req.body;
    const darkModeValue = value ? 1 : 0;

    db.run('UPDATE UserSettings SET darkMode = ? WHERE id = 1', [darkModeValue], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        db.run(
          'INSERT INTO UserSettings (id, darkMode) VALUES (1, ?)',
          [darkModeValue],
          (insertErr) => {
            if (insertErr) {
              res.status(500).json({ error: insertErr.message });
              return;
            }

            res.json({ success: true });
          },
        );
      } else {
        res.json({ success: true });
      }
    });
  });

  app.put('/api/user-settings/notification', (req, res) => {
    const { visitReminder, birthdayReminder } = req.body;
    const visitReminderValue = visitReminder ? 1 : 0;
    const birthdayReminderValue = birthdayReminder ? 1 : 0;

    db.run(
      'UPDATE UserSettings SET visitReminder = ?, birthdayReminder = ? WHERE id = 1',
      [visitReminderValue, birthdayReminderValue],
      function (err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }

        if (this.changes === 0) {
          db.run(
            'INSERT INTO UserSettings (id, visitReminder, birthdayReminder) VALUES (1, ?, ?)',
            [visitReminderValue, birthdayReminderValue],
            (insertErr) => {
              if (insertErr) {
                res.status(500).json({ error: insertErr.message });
                return;
              }

              res.json({ success: true });
            },
          );
        } else {
          res.json({ success: true });
        }
      },
    );
  });

  app.put('/api/user-settings/backup', (req, res) => {
    const { lastBackup } = req.body;

    db.run('UPDATE UserSettings SET lastBackup = ? WHERE id = 1', [lastBackup], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }

      if (this.changes === 0) {
        db.run(
          'INSERT INTO UserSettings (id, lastBackup) VALUES (1, ?)',
          [lastBackup],
          (insertErr) => {
            if (insertErr) {
              res.status(500).json({ error: insertErr.message });
              return;
            }

            res.json({ success: true });
          },
        );
      } else {
        res.json({ success: true });
      }
    });
  });
}

module.exports = {
  registerUserSettingsRoutes,
};

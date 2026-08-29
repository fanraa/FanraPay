const fs = require('fs');
let code = fs.readFileSync('src/components/Family.tsx', 'utf8');

code = code.replace(
  "                  if (nextVal) {\n                    sessionStorage.removeItem('fanra_notif_ignored_session');\n                    if (typeof window !== 'undefined' && 'Notification' in window) {\n                      try {\n                        if (Notification.permission !== 'granted') {\n                          await Notification.requestPermission();\n                        }\n                      } catch (e) {}\n                    }\n                  }",
  "                  if (nextVal) {\n                    sessionStorage.removeItem('fanra_notif_ignored_session');\n                    if (typeof window !== 'undefined' && 'Notification' in window) {\n                      try {\n                        if (Notification.permission !== 'granted') {\n                          await Notification.requestPermission();\n                        }\n                      } catch (e) {}\n                    }\n                  } else {\n                    sessionStorage.setItem('fanra_notif_ignored_session', 'true');\n                  }"
);

fs.writeFileSync('src/components/Family.tsx', code);

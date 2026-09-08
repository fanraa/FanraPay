import re

with open('src/components/Family.tsx', 'r') as f:
    content = f.read()

import_lucide = "MessageSquare, Send, ExternalLink, Sparkles"
new_import_lucide = "MessageSquare, Send, ExternalLink, Sparkles, Edit2"
content = content.replace(import_lucide, new_import_lucide)

with open('src/components/Family.tsx', 'w') as f:
    f.write(content)

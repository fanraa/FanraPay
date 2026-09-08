import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Fix gradient background clipping by adding bg-fixed
content = content.replace(
    'min-h-screen bg-gradient-to-br',
    'min-h-screen bg-fixed bg-gradient-to-br'
)
content = content.replace(
    'fixed inset-0 z-[999] flex flex-col items-center justify-between bg-gradient-to-br',
    'fixed inset-0 z-[999] flex flex-col items-center justify-between bg-fixed bg-gradient-to-br'
)

with open('src/App.tsx', 'w') as f:
    f.write(content)

import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_tab_func = """  const handleTabChange = (newTab: Tab) => {
    if (activeTab === newTab) return;
    scrollPositions.current[activeTab] = window.scrollY;
    setActiveTab(newTab);
    setTimeout(() => {
      window.scrollTo({
        top: scrollPositions.current[newTab] || 0,
        behavior: 'instant'
      });
    }, 10);
  };"""

new_tab_func = """  const handleTabChange = (newTab: Tab) => {
    if (activeTab === newTab) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setActiveTab(newTab);
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'instant'
      });
    }, 10);
  };"""

if old_tab_func in content:
    content = content.replace(old_tab_func, new_tab_func)
else:
    print("Could not find old_tab_func")

with open('src/App.tsx', 'w') as f:
    f.write(content)

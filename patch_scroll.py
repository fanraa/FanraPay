import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# Add handleTabChange and scroll tracking
ref_code = """  const [events, setEvents] = useState<AppEvent[]>([]);
  
  const scrollPositions = useRef<Record<string, number>>({});
  
  const handleTabChange = (newTab: Tab) => {
    if (activeTab === newTab) return;
    scrollPositions.current[activeTab] = window.scrollY;
    setActiveTab(newTab);
    setTimeout(() => {
      window.scrollTo({
        top: scrollPositions.current[newTab] || 0,
        behavior: 'instant'
      });
    }, 10);
  };

  useEffect(() => {
    let scrollTimeout: any;
    const handleScroll = () => {
      document.body.classList.add('is-scrolling');
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        document.body.classList.remove('is-scrolling');
      }, 150); // Hides tooltip while scrolling, restores shortly after
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);
"""

content = content.replace("  const [events, setEvents] = useState<AppEvent[]>([]);", ref_code)

# Replace all setActiveTab( with handleTabChange( EXCEPT the initial state
# Wait, we can't replace the setter directly without being careful.
content = content.replace("setActiveTab('dashboard')", "handleTabChange('dashboard')")
content = content.replace("setActiveTab(item.id as Tab)", "handleTabChange(item.id as Tab)")
content = content.replace("setActiveTab('notifikasi')", "handleTabChange('notifikasi')")
content = content.replace("setActiveTab('transaksi')", "handleTabChange('transaksi')")
content = content.replace("setActiveTab('keluarga')", "handleTabChange('keluarga')")

# Fix any double replacements or state setter
content = content.replace("const [activeTab, handleTabChange", "const [activeTab, setActiveTab")

with open('src/App.tsx', 'w') as f:
    f.write(content)

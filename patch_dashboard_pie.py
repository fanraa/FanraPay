import re

with open('src/components/Dashboard.tsx', 'r') as f:
    content = f.read()

# 1. Fix renderActiveShape to not enlarge (removes outerRadius + 6)
old_render_shape = """const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};"""

new_render_shape = """const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
    </g>
  );
};"""

content = content.replace(old_render_shape, new_render_shape)

# 2. Add isPieAnimating state to Dashboard component
state_code_find = "const [activePieIndex, setActivePieIndex] = useState<number | undefined>(undefined);"
state_code_replace = """const [activePieIndex, setActivePieIndex] = useState<number | undefined>(undefined);
  const [isPieAnimating, setIsPieAnimating] = useState(true);

  useEffect(() => {
    // Reset animation state when category view changes
    setIsPieAnimating(true);
    const timer = setTimeout(() => {
      setIsPieAnimating(false);
    }, 1500); // Wait for recharts animation to finish
    return () => clearTimeout(timer);
  }, [categoryView]);"""

content = content.replace(state_code_find, state_code_replace)

# 3. Add pointer-events-none class when isPieAnimating is true
pie_container_find = '<div className="relative shrink-0" style={{ width: 140, height: 140 }}>'
pie_container_replace = '<div className={`relative shrink-0 ${isPieAnimating ? "pointer-events-none" : ""}`} style={{ width: 140, height: 140 }}>'

content = content.replace(pie_container_find, pie_container_replace)

# 4. Disable legend clicks/hovers during animation as well
legend_find = """                          className={`flex items-stretch gap-2.5 transition-all duration-300 cursor-pointer ${activePieIndex !== undefined && activePieIndex !== index ? 'opacity-50 grayscale' : 'opacity-100'}`}
                          onMouseEnter={() => setActivePieIndex(index)}
                          onMouseLeave={() => setActivePieIndex(undefined)}
                          onClick={() => setActivePieIndex(activePieIndex === index ? undefined : index)}"""

legend_replace = """                          className={`flex items-stretch gap-2.5 transition-all duration-300 cursor-pointer ${activePieIndex !== undefined && activePieIndex !== index ? 'opacity-50 grayscale' : 'opacity-100'} ${isPieAnimating ? 'pointer-events-none' : ''}`}
                          onMouseEnter={() => !isPieAnimating && setActivePieIndex(index)}
                          onMouseLeave={() => !isPieAnimating && setActivePieIndex(undefined)}
                          onClick={() => !isPieAnimating && setActivePieIndex(activePieIndex === index ? undefined : index)}"""

content = content.replace(legend_find, legend_replace)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(content)

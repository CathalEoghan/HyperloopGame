import os
import re

dev_dir = r'C:\Users\Cathal\Documents\HyperloopGame\DevelopmentManager'

updated = 0
for filename in os.listdir(dev_dir):
    if not filename.endswith('.js'):
        continue
    filepath = os.path.join(dev_dir, filename)
    with open(filepath, 'r') as f:
        content = f.read()
    
    pattern = r'(new Development\s*\(\s*"[^"]+"\s*,\s*)(\d+)(\s*,\s*"[^"]+"\s*,\s*)(\d+)'
    
    def multiply(m):
        cost = int(m.group(2))
        revenue = int(m.group(4))
        new_cost = round(cost * 10)
        new_revenue = round(revenue * 8)
        return f"{m.group(1)}{new_cost}{m.group(3)}{new_revenue}"
    
    new_content = re.sub(pattern, multiply, content)
    
    if new_content != content:
        with open(filepath, 'w') as f:
            f.write(new_content)
        updated += 1

print(f"Updated {updated} development files")
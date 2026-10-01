import os
import re

directory = r'c:\Users\prasa\Downloads\BridgeAura Internship deatils\BusMitra-App\busmitra-app\frontend\src\pages'

pattern = re.compile(r'\s*<nav className="bottom-nav">.*?</nav>', re.DOTALL)

for filename in os.listdir(directory):
    if filename.endswith('.jsx') and filename not in ['Admin.jsx', 'Driver.jsx', 'Landing.jsx']:
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = pattern.sub('', content)
        
        if content != new_content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f'Stripped bottom-nav from {filename}')

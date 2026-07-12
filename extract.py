import json
with open('deepfake-images.ipynb', encoding='utf-8') as f:
    data = json.load(f)
src = ["".join(cell['source']) for cell in data.get('cells', []) if cell['cell_type'] == 'code']
with open('extracted_code.py', 'w', encoding='utf-8') as out:
    out.write("\n\n# ---\n\n".join(src))

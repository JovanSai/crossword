import requests

try:
    resp = requests.get('http://127.0.0.1:8000/api/crossword/puzzle/101')
    print(f'Status: {resp.status_code}')
    
    if resp.status_code == 200:
        data = resp.json()
        print(f'Puzzle ID: {data.get("puzzleID")}')
        print(f'Blackboxes: {data.get("blackBoxArray")}')
        print(f'Across hints count: {len(data.get("acrossHints", []))}')
        print(f'Down hints count: {len(data.get("downHints", []))}')
    else:
        print(f'Error: {resp.text}')
except Exception as e:
    print(f'Connection error: {e}')
    print('Make sure Django server is running on port 8000')

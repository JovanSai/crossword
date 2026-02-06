import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from hackathon.views import get_puzzle
from django.test import RequestFactory
import json

# Create a mock request
factory = RequestFactory()
request = factory.get('/api/crossword/puzzle/101')

# Call the view
response = get_puzzle(request, '101')

# Render the response content
response.render()

print(f"Status Code: {response.status_code}")
print(f"Response Content:")
print(json.dumps(json.loads(response.content), indent=2))

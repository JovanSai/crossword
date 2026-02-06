from rest_framework import serializers
from .models import Crosswordpuzzlebank
import json

class CrosswordPuzzleSerializer(serializers.ModelSerializer):
    acrossHints = serializers.SerializerMethodField()
    downHints = serializers.SerializerMethodField()
    blackBoxArray = serializers.SerializerMethodField()
    puzzleID = serializers.CharField(source='puzzleid')

    class Meta:
        model = Crosswordpuzzlebank
        fields = ['puzzleID', 'acrossHints', 'downHints', 'blackBoxArray', 'status']

    def get_acrossHints(self, obj):
        if obj.accrosshintarray:
            try:
                # Replace single quotes with double quotes if necessary, distinct possibility in legacy data
                data = obj.accrosshintarray
                if isinstance(data, str):
                    # Basic cleanup for potential single-quoted JSON
                    if data.startswith("'") or '{\'' in data:
                        data = data.replace("'", '"')
                    return json.loads(data)
                return data
            except json.JSONDecodeError:
                return []
        return []

    def get_downHints(self, obj):
        if obj.downhintarray:
            try:
                data = obj.downhintarray
                if isinstance(data, str):
                    if data.startswith("'") or '{\'' in data:
                        data = data.replace("'", '"')
                    return json.loads(data)
                return data
            except json.JSONDecodeError:
                return []
        return []

    def get_blackBoxArray(self, obj):
        if obj.blackboxarray:
            try:
                data = obj.blackboxarray
                if isinstance(data, str):
                    # Check if it's a simple list like "[1, 2, 3]"
                    return json.loads(data)
                return data
            except json.JSONDecodeError:
                # Fallback implementation if it's comma separated string
                try:
                    return [int(x) for x in obj.blackboxarray.split(',') if x.strip().isdigit()]
                except:
                    return []
        return []

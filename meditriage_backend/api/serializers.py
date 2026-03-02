from rest_framework import serializers


class HistoryMessageSerializer(serializers.Serializer):
    """Single message in the conversation history."""
    role    = serializers.ChoiceField(choices=["user", "assistant", "system"])
    content = serializers.CharField()


class ChatMessageSerializer(serializers.Serializer):
    """
    Request body for POST /api/chat/

    Fields:
        message  (required) – The user's symptom text
        history  (optional) – Previous conversation turns for context
    """
    message = serializers.CharField(
        required   = True,
        min_length = 1,
        max_length = 2000,
        error_messages={
            "blank":     "Message cannot be empty.",
            "max_length": "Message is too long (max 2000 characters).",
        },
    )
    history = HistoryMessageSerializer(many=True, required=False, default=list)

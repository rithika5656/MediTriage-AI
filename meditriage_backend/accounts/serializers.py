"""
MediTriage Accounts – Serializers
"""
from rest_framework import serializers


class SignupSerializer(serializers.Serializer):
    name     = serializers.CharField(max_length=200)
    email    = serializers.EmailField()
    password = serializers.CharField(min_length=6, max_length=200, write_only=True)
    age      = serializers.IntegerField(min_value=1, max_value=120, required=False, allow_null=True)
    gender   = serializers.ChoiceField(
        choices=["male", "female", "other", ""],
        required=False, allow_blank=True
    )
    phone    = serializers.CharField(max_length=20, required=False, allow_blank=True)


class LoginSerializer(serializers.Serializer):
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ProfileUpdateSerializer(serializers.Serializer):
    name   = serializers.CharField(max_length=200, required=False)
    age    = serializers.IntegerField(min_value=1, max_value=120, required=False, allow_null=True)
    gender = serializers.ChoiceField(
        choices=["male", "female", "other", ""],
        required=False, allow_blank=True
    )
    phone  = serializers.CharField(max_length=20, required=False, allow_blank=True)

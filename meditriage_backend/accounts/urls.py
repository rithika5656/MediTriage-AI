from django.urls import path
from .views import SignupView, LoginView, ProfileView
from .face_recognition_views import (
    RegisterFaceView,
    VerifyFaceView,
    CheckFaceRegistrationView,
    DeleteFaceView,
)

urlpatterns = [
    # Standard auth endpoints
    path("signup",  SignupView.as_view(),  name="auth_signup"),
    path("login",   LoginView.as_view(),   name="auth_login"),
    path("profile", ProfileView.as_view(), name="auth_profile"),
    path("me",      ProfileView.as_view(), name="auth_me"),
    
    # Face recognition endpoints
    path("register-face/",        RegisterFaceView.as_view(),         name="auth_register_face"),
    path("verify-face/",          VerifyFaceView.as_view(),           name="auth_verify_face"),
    path("check-face-registration/", CheckFaceRegistrationView.as_view(), name="auth_check_face"),
    path("delete-face/",          DeleteFaceView.as_view(),           name="auth_delete_face"),
]

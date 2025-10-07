from django.urls import path, include
from . import views

urlpatterns = [      
    path("", views.dashboard, name="dashboard_dashboard"),
    path("metas/", views.metas, name="dashboard_metas"),
]

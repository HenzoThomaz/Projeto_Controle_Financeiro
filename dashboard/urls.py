from django.urls import path
from . import views

urlpatterns = [      
    path("", views.dashboard, name="dashboard_dashboard"),
    path("metas/", views.metas_financeiras, name="dashboard_metas"),
    path("metas/nova/", views.nova_meta, name="dashboard_nova_meta"),
    path('metas/<int:meta_id>/adicionar/', views.adicionar_valor, name='dashboard_adicionar_valor'),
]

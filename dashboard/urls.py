from django.urls import path
from . import views

urlpatterns = [      
    path("", views.ver_dashboard2, name="dashboard_dashboard2"),
    #path("metas/", views.metas_financeiras, name="dashboard_metas"),
    #path("metas/", views.nova_meta, name="nova_meta"),
    path('metas/<int:meta_id>/adicionar/', views.adicionar_valor, name='adicionar_valor'),
    path('metas/<int:meta_id>/excluir/', views.excluir_meta, name='excluir_meta'),
    path('metas/', views.metas_financeiras, name='metas_financeiras'),
    path('historico/', views.historico_transacoes, name='historico'),
    path('dashboard2/', views.ver_dashboard2, name='dashboard2'),
]

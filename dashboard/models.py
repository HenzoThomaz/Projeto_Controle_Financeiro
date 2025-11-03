from django.db import models
from django.contrib.auth.models import User  # modelo padrão do Django para meio que as sessions do flask

class Transacao(models.Model):
    TIPO_CHOICES = [
        ('receita', 'Receita'),
        ('despesa', 'Despesa'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)  # vínculo com o usuário, para não misturar dados
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    categoria = models.CharField(max_length=50)
    descricao = models.CharField(max_length=200, blank=True, null=True)
    data = models.DateField()

    criado_em = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.tipo} - {self.valor} ({self.categoria})"
    
#parte do banco referente a metas financeiras
class MetaFinanceira(models.Model):
    nome_meta = models.CharField(max_length=100)
    descricao_meta = models.TextField(blank=True)
    valor_atual_meta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    valor_objetivo_meta = models.DecimalField(max_digits=10, decimal_places=2)
    data_criacao_meta = models.DateTimeField(auto_now_add=True)

    def progresso(self):
        if self.valor_objetivo_meta == 0:
            return 0
        return (self.valor_atual_meta / self.valor_objetivo_meta) * 100

    def __str__(self):
        return self.nome_meta
    
from django.db import models
from django.contrib.auth.models import User  # modelo padrão do Django para meio que as sessions do flask

class Transacao(models.Model):
    # --- NOVAS OPÇÕES DE CATEGORIA ---
    CATEGORIA_CHOICES = [
        ('alimentacao', 'Alimentação'),
        ('lazer', 'Lazer'),
        ('transporte', 'Transporte'),
        ('contas_casa', 'Contas de Casa'),
        ('trabalho', 'Trabalho'),
        ('estudo', 'Estudo'),
        ('outro', 'Outro'),
    ]

    TIPO_CHOICES = [
        ('receita', 'Receita'),
        ('despesa', 'Despesa'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    
    # --- CAMPO CATEGORIA ATUALIZADO ---
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES) 
    
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
    
#parte referente ao orçamento mensal
class MetaOrcamento(models.Model):

    CATEGORIA_CHOICES = [
        ('alimentacao', 'Alimentação'),
        ('lazer', 'Lazer'),
        ('transporte', 'Transporte'),
        ('contas_casa', 'Contas de Casa'),
        ('trabalho', 'Trabalho'),
        ('estudo', 'Estudo'),
        ('outro', 'Outro'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    categoria = models.CharField(max_length=20, choices=CATEGORIA_CHOICES)
    limite_mensal = models.DecimalField(max_digits=10, decimal_places=2) 
    mes_ano = models.DateField(default=models.DateField(auto_now_add=True)) 

    class Meta:
        unique_together = ('user', 'categoria', 'mes_ano') 
        verbose_name = "Meta de Orçamento"
        verbose_name_plural = "Metas de Orçamento"

    def __str__(self):
        return f"Meta de {self.user.username} - {self.get_categoria_display()} - R${self.limite_mensal}"